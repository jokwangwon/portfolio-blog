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
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;

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
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (status != null && !status.isBlank()) {
            PostStatus postStatus = PostStatus.valueOf(status.toUpperCase());
            return postRepository.findAllByAuthorAndStatus(author.getId(), postStatus, pageable)
                    .map(PostResponse::from);
        }
        return postRepository.findAllByAuthor(author.getId(), pageable)
                .map(PostResponse::from);
    }

    @Transactional
    public PostResponse getPost(Long id) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        post.incrementViewCount();
        return PostResponse.from(post);
    }

    public PostResponse getPostBySlug(String slug) {
        Post post = postRepository.findBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse createPost(PostRequest request, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        String slug = generateSlug(request.getTitle());
        if (postRepository.existsBySlugAndDeletedAtIsNull(slug)) {
            throw new DuplicateResourceException("POST_SLUG_DUPLICATE", "이미 존재하는 슬러그입니다: " + slug);
        }

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
                .build();

        if (status == PostStatus.PUBLISHED) {
            post.publish();
        }

        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findByIdIn(request.getTagIds());
            post.updateTags(tags);
        }

        postRepository.save(post);
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse updatePost(Long id, PostRequest request, String username) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));

        if (!post.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("POST_FORBIDDEN", "게시글 수정 권한이 없습니다");
        }

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

        post.update(request.getTitle(), post.getSlug(), request.getContent(), excerpt, category);

        if (request.getTagIds() != null) {
            List<Tag> tags = tagRepository.findByIdIn(request.getTagIds());
            post.updateTags(tags);
        }

        if ("PUBLISHED".equals(request.getStatus()) && post.getStatus() != PostStatus.PUBLISHED) {
            post.publish();
        } else if ("DRAFT".equals(request.getStatus())) {
            post.draft();
        } else if ("ARCHIVED".equals(request.getStatus())) {
            post.archive();
        }

        return PostResponse.from(post);
    }

    @Transactional
    public void deletePost(Long id, String username) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));

        if (!post.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("POST_FORBIDDEN", "게시글 삭제 권한이 없습니다");
        }

        post.delete(); // Soft delete
    }

    @Transactional
    public void likePost(Long postId, String username) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (likeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new DuplicateResourceException("ALREADY_LIKED", "이미 좋아요한 게시글입니다");
        }

        likeRepository.save(new Like(user, post));
        post.incrementLikeCount();
    }

    @Transactional
    public void unlikePost(Long postId, String username) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        if (!likeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new ResourceNotFoundException("NOT_LIKED", "좋아요하지 않은 게시글입니다");
        }

        likeRepository.deleteByUserIdAndPostId(user.getId(), postId);
        post.decrementLikeCount();
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
