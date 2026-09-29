package com.portfolio.module.blog.service;

import com.portfolio.domain.blog.*;
import com.portfolio.domain.blog.repository.*;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.blog.dto.PostRequest;
import com.portfolio.module.blog.dto.PostResponse;
import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ForbiddenException;
import com.portfolio.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    @org.springframework.beans.factory.annotation.Value("${app.blog.require-edit-version:true}")
    private boolean requireEditVersion = true;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final AttachmentService attachmentService;

    public Page<PostResponse> getPublishedPosts(Pageable pageable) {
        return postRepository.findAllByStatusAndDeletedAtIsNull(PostStatus.PUBLISHED, pageable)
                .map(PostResponse::summary);
    }

    public Page<PostResponse> searchPosts(String keyword, Pageable pageable) {
        return postRepository.searchByKeyword(keyword, pageable)
                .map(PostResponse::summary);
    }

    public Page<PostResponse> getPostsByTag(String tagSlug, Pageable pageable) {
        return postRepository.findPublishedByTag(tagSlug, pageable)
                .map(PostResponse::summary);
    }

    public Page<PostResponse> getPostsByCategory(Long categoryId, Pageable pageable) {
        return postRepository.findPublishedByCategory(categoryId, pageable)
                .map(PostResponse::summary);
    }

    public Page<PostResponse> getMyPosts(String username, String status, Pageable pageable) {
        return getMyPosts(username, status, null, pageable);
    }

    public Page<PostResponse> getMyPosts(String username, String status, PostVisibility visibility, Pageable pageable) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));
        PostStatus state = status == null || status.isBlank() ? null : PostStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT));
        return postRepository.findOwnedWithFilters(author.getId(), state, visibility, pageable).map(PostResponse::summary);
    }

    @Transactional
    public PostResponse getPost(Long id) {
        return getPost(id, null);
    }

    @Transactional
    public PostResponse getPost(Long id, String username) {
        Post post = postRepository.findForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        if (!post.isPubliclyReadable()
                && !post.getAuthor().getUsername().equals(username)) {
            throw new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다");
        }
        if (post.isPubliclyReadable()) {
            postRepository.incrementViews(id);
            return PostResponse.from(post).toBuilder().viewCount(post.getViewCount() + 1).build();
        }
        return PostResponse.from(post);
    }

    public PostResponse getPostBySlug(String slug) {
        Post post = postRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        if (!post.isPubliclyReadable()) {
            throw new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다");
        }
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse createPost(PostRequest request, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        String slug = generateUniqueSlug(request.getTitle());

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));
        }

        String excerpt = request.getExcerpt();
        if (excerpt == null || excerpt.isBlank()) {
            excerpt = request.getContent().length() > 200
                    ? request.getContent().substring(0, 200)
                    : request.getContent();
        }

        PostStatus status = "PUBLISHED".equals(request.getStatus()) ? PostStatus.PUBLISHED : PostStatus.DRAFT;

        Post post = Post.builder()
                .author(author)
                .category(category)
                .title(request.getTitle())
                .slug(slug)
                .content(request.getContent())
                .excerpt(excerpt)
                .status(status)
                .visibility(request.getVisibility())
                .build();

        if (status == PostStatus.PUBLISHED) {
            post.publish();
        }

        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findByIdIn(request.getTagIds());
            post.updateTags(tags);
        }

        post.recordCreation();
        postRepository.save(post);
        attachmentService.synchronize(post, post.getContent());
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse updatePost(Long id, PostRequest request, String username) {
        Post post = postRepository.findForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));

        if (!post.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("POST_FORBIDDEN", "게시글 수정 권한이 없습니다");
        }

        Long expected = request.getExpectedEditVersion();
        if (expected == null && requireEditVersion) throw new com.portfolio.common.exception.PostEditVersionRequiredException();
        if (expected != null && expected != post.getEditVersion()) throw new com.portfolio.common.exception.PostEditConflictException();

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));
        }

        String excerpt = request.getExcerpt();
        if (excerpt == null || excerpt.isBlank()) {
            excerpt = request.getContent().length() > 200
                    ? request.getContent().substring(0, 200)
                    : request.getContent();
        }

        List<Tag> requestedTags = request.getTagIds() == null ? post.getTags() : tagRepository.findByIdIn(request.getTagIds());
        PostStatus requestedStatus = request.getStatus() == null ? post.getStatus() : PostStatus.valueOf(request.getStatus());
        var requestedVisibility = request.getVisibility() == null ? post.getVisibility() : request.getVisibility();
        if (java.util.Objects.equals(post.getTitle(), request.getTitle())
                && java.util.Objects.equals(post.getContent(), request.getContent())
                && java.util.Objects.equals(post.getExcerpt(), excerpt)
                && java.util.Objects.equals(post.getCategory() == null ? null : post.getCategory().getId(), category == null ? null : category.getId())
                && post.getTags().stream().map(Tag::getId).sorted().toList().equals(requestedTags.stream().map(Tag::getId).sorted().toList())
                && post.getStatus() == requestedStatus && post.getVisibility() == requestedVisibility) return PostResponse.from(post);

        post.update(request.getTitle(), post.getSlug(), request.getContent(), excerpt, category);
        post.changeVisibility(request.getVisibility());

        if (request.getTagIds() != null) {
            post.updateTags(requestedTags);
        }

        if ("PUBLISHED".equals(request.getStatus()) && post.getStatus() != PostStatus.PUBLISHED) {
            post.publish();
        } else if ("DRAFT".equals(request.getStatus())) {
            post.draft();
        } else if ("ARCHIVED".equals(request.getStatus())) {
            post.archive();
        }

        post.recordEdit();
        attachmentService.synchronize(post, post.getContent());
        return PostResponse.from(post);
    }

    @Transactional
    public void deletePost(Long id, String username) {
        Post post = postRepository.findForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));

        User requester = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (!post.getAuthor().getUsername().equals(username) && !requester.isAdmin()) {
            throw new ForbiddenException("POST_FORBIDDEN", "게시글 삭제 권한이 없습니다");
        }

        post.delete(); // Soft delete
    }

    @Transactional
    public void likePost(Long postId, String username) {
        Post post = postRepository.findForUpdate(postId)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        if (!post.isPubliclyReadable()) throw new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (likeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new DuplicateResourceException("ALREADY_LIKED", "이미 좋아요한 게시글입니다");
        }

        likeRepository.save(new Like(user, post));
        postRepository.changeLikes(postId, 1);
    }

    @Transactional
    public void unlikePost(Long postId, String username) {
        Post post = postRepository.findForUpdate(postId)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        if (!post.isPubliclyReadable()) throw new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (!likeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new ResourceNotFoundException("NOT_LIKED", "좋아요하지 않은 게시글입니다");
        }

        likeRepository.deleteByUserIdAndPostId(user.getId(), postId);
        postRepository.changeLikes(postId, -1);
    }

    private String generateUniqueSlug(String title) {
        String base = generateSlug(title);
        if (base.isEmpty() || base.length() < 3) {
            base = "post-" + System.currentTimeMillis();
        }
        String slug = base;
        int suffix = 1;
        while (postRepository.existsBySlugAndDeletedAtIsNull(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    private String generateSlug(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD);
        String ascii = Pattern.compile("[^\\p{ASCII}]").matcher(normalized).replaceAll("");
        return ascii.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
