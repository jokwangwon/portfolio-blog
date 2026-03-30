package com.portfolio.module.blog.service;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ForbiddenException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.blog.*;
import com.portfolio.domain.blog.repository.*;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.blog.dto.PostRequest;
import com.portfolio.module.blog.dto.PostResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private LikeRepository likeRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PostService postService;

    private User author;
    private Category category;
    private Post post;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .email("test@test.com")
                .username("testuser")
                .password("encoded")
                .role(UserRole.USER)
                .build();
        ReflectionTestUtils.setField(author, "id", 1L);

        category = Category.builder()
                .name("Spring")
                .slug("spring")
                .description("Spring Framework")
                .build();
        ReflectionTestUtils.setField(category, "id", 1L);

        post = Post.builder()
                .author(author)
                .category(category)
                .title("Test Post")
                .slug("test-post")
                .content("Content body here")
                .excerpt("Content body")
                .status(PostStatus.PUBLISHED)
                .build();
        ReflectionTestUtils.setField(post, "id", 1L);
    }

    @Nested
    @DisplayName("getPublishedPosts")
    class GetPublishedPosts {

        @Test
        @DisplayName("발행된 게시글 목록을 페이징 조회한다")
        void returnPublishedPosts() {
            PageRequest pageable = PageRequest.of(0, 10);
            given(postRepository.findAllByStatusAndDeletedAtIsNull(PostStatus.PUBLISHED, pageable))
                    .willReturn(new PageImpl<>(List.of(post)));

            Page<PostResponse> result = postService.getPublishedPosts(pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Post");
        }
    }

    @Nested
    @DisplayName("getPost")
    class GetPost {

        @Test
        @DisplayName("ID로 게시글을 조회하면 조회수가 증가한다")
        void incrementViewCount() {
            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            int before = post.getViewCount();

            PostResponse result = postService.getPost(1L);

            assertThat(result.getTitle()).isEqualTo("Test Post");
            assertThat(post.getViewCount()).isEqualTo(before + 1);
        }

        @Test
        @DisplayName("존재하지 않는 게시글 조회 시 예외를 던진다")
        void throwWhenNotFound() {
            given(postRepository.findByIdAndDeletedAtIsNull(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> postService.getPost(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("createPost")
    class CreatePost {

        @Test
        @DisplayName("새 게시글을 생성한다")
        void createNewPost() {
            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "New Post");
            ReflectionTestUtils.setField(request, "content", "New content for testing");
            ReflectionTestUtils.setField(request, "categoryId", 1L);
            ReflectionTestUtils.setField(request, "status", "DRAFT");

            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(postRepository.existsBySlugAndDeletedAtIsNull(anyString())).willReturn(false);
            given(categoryRepository.findById(1L)).willReturn(Optional.of(category));
            given(postRepository.save(any(Post.class))).willAnswer(invocation -> {
                Post saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 2L);
                return saved;
            });

            PostResponse result = postService.createPost(request, "testuser");

            assertThat(result.getTitle()).isEqualTo("New Post");
            assertThat(result.getStatus()).isEqualTo("DRAFT");
            verify(postRepository).save(any(Post.class));
        }

        @Test
        @DisplayName("excerpt 미제공 시 content 앞 200자를 자동 생성한다")
        void autoGenerateExcerpt() {
            String longContent = "A".repeat(300);
            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "Long Post");
            ReflectionTestUtils.setField(request, "content", longContent);
            ReflectionTestUtils.setField(request, "status", "DRAFT");

            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(postRepository.existsBySlugAndDeletedAtIsNull(anyString())).willReturn(false);
            given(postRepository.save(any(Post.class))).willAnswer(invocation -> {
                Post saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 3L);
                return saved;
            });

            PostResponse result = postService.createPost(request, "testuser");

            assertThat(result.getExcerpt()).hasSize(200);
        }

        @Test
        @DisplayName("PUBLISHED 상태로 생성하면 publishedAt이 설정된다")
        void setPublishedAt() {
            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "Published Post");
            ReflectionTestUtils.setField(request, "content", "Content");
            ReflectionTestUtils.setField(request, "status", "PUBLISHED");

            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(postRepository.existsBySlugAndDeletedAtIsNull(anyString())).willReturn(false);
            given(postRepository.save(any(Post.class))).willAnswer(invocation -> {
                Post saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 4L);
                return saved;
            });

            PostResponse result = postService.createPost(request, "testuser");

            assertThat(result.getPublishedAt()).isNotNull();
        }

        @Test
        @DisplayName("중복 슬러그로 생성 시 예외를 던진다")
        void throwWhenDuplicateSlug() {
            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "Test Post");
            ReflectionTestUtils.setField(request, "content", "Content");

            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(postRepository.existsBySlugAndDeletedAtIsNull(anyString())).willReturn(true);

            assertThatThrownBy(() -> postService.createPost(request, "testuser"))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("슬러그");
        }

        @Test
        @DisplayName("태그를 지정하여 게시글을 생성한다")
        void createWithTags() {
            Tag tag = Tag.builder().name("Java").slug("java").build();
            ReflectionTestUtils.setField(tag, "id", 1L);

            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "Tagged Post");
            ReflectionTestUtils.setField(request, "content", "Content");
            ReflectionTestUtils.setField(request, "tagIds", List.of(1L));
            ReflectionTestUtils.setField(request, "status", "DRAFT");

            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(postRepository.existsBySlugAndDeletedAtIsNull(anyString())).willReturn(false);
            given(tagRepository.findByIdIn(List.of(1L))).willReturn(List.of(tag));
            given(postRepository.save(any(Post.class))).willAnswer(invocation -> {
                Post saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 5L);
                return saved;
            });

            PostResponse result = postService.createPost(request, "testuser");

            assertThat(result).isNotNull();
            verify(tagRepository).findByIdIn(List.of(1L));
        }
    }

    @Nested
    @DisplayName("updatePost")
    class UpdatePost {

        @Test
        @DisplayName("본인 게시글을 수정한다")
        void updateOwnPost() {
            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "Updated Title");
            ReflectionTestUtils.setField(request, "content", "Updated content");
            ReflectionTestUtils.setField(request, "status", "PUBLISHED");

            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));

            PostResponse result = postService.updatePost(1L, request, "testuser");

            assertThat(result.getTitle()).isEqualTo("Updated Title");
        }

        @Test
        @DisplayName("타인 게시글 수정 시 예외를 던진다")
        void throwWhenNotOwner() {
            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "Hack");
            ReflectionTestUtils.setField(request, "content", "Hacked");

            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));

            assertThatThrownBy(() -> postService.updatePost(1L, request, "otheruser"))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("DRAFT → PUBLISHED 상태 전환 시 publishedAt이 설정된다")
        void publishDraft() {
            Post draftPost = Post.builder()
                    .author(author).title("Draft").slug("draft")
                    .content("C").excerpt("C").status(PostStatus.DRAFT)
                    .build();
            ReflectionTestUtils.setField(draftPost, "id", 2L);

            PostRequest request = new PostRequest();
            ReflectionTestUtils.setField(request, "title", "Draft");
            ReflectionTestUtils.setField(request, "content", "C");
            ReflectionTestUtils.setField(request, "status", "PUBLISHED");

            given(postRepository.findByIdAndDeletedAtIsNull(2L)).willReturn(Optional.of(draftPost));

            PostResponse result = postService.updatePost(2L, request, "testuser");

            assertThat(result.getPublishedAt()).isNotNull();
            assertThat(result.getStatus()).isEqualTo("PUBLISHED");
        }
    }

    @Nested
    @DisplayName("deletePost")
    class DeletePost {

        @Test
        @DisplayName("본인 게시글을 소프트 삭제한다")
        void softDeleteOwnPost() {
            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));

            postService.deletePost(1L, "testuser");

            assertThat(post.getDeletedAt()).isNotNull();
        }

        @Test
        @DisplayName("타인 게시글 삭제 시 예외를 던진다")
        void throwWhenNotOwner() {
            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));

            assertThatThrownBy(() -> postService.deletePost(1L, "otheruser"))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    @Nested
    @DisplayName("likePost / unlikePost")
    class LikeUnlike {

        @Test
        @DisplayName("게시글에 좋아요를 추가한다")
        void likePost() {
            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(likeRepository.existsByUserIdAndPostId(1L, 1L)).willReturn(false);

            int beforeLike = post.getLikeCount();
            postService.likePost(1L, "testuser");

            verify(likeRepository).save(any(Like.class));
            assertThat(post.getLikeCount()).isEqualTo(beforeLike + 1);
        }

        @Test
        @DisplayName("중복 좋아요 시 예외를 던진다")
        void throwWhenAlreadyLiked() {
            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(likeRepository.existsByUserIdAndPostId(1L, 1L)).willReturn(true);

            assertThatThrownBy(() -> postService.likePost(1L, "testuser"))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("이미 좋아요");
        }

        @Test
        @DisplayName("좋아요를 취소한다")
        void unlikePost() {
            ReflectionTestUtils.setField(post, "likeCount", 1);

            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(likeRepository.existsByUserIdAndPostId(1L, 1L)).willReturn(true);

            postService.unlikePost(1L, "testuser");

            verify(likeRepository).deleteByUserIdAndPostId(1L, 1L);
            assertThat(post.getLikeCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("좋아요하지 않은 게시글 취소 시 예외를 던진다")
        void throwWhenNotLiked() {
            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(likeRepository.existsByUserIdAndPostId(1L, 1L)).willReturn(false);

            assertThatThrownBy(() -> postService.unlikePost(1L, "testuser"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("searchPosts")
    class SearchPosts {

        @Test
        @DisplayName("키워드로 게시글을 검색한다")
        void searchByKeyword() {
            PageRequest pageable = PageRequest.of(0, 10);
            given(postRepository.searchByKeyword("Test", pageable))
                    .willReturn(new PageImpl<>(List.of(post)));

            Page<PostResponse> result = postService.searchPosts("Test", pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }
}
