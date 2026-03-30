package com.portfolio.module.blog.service;

import com.portfolio.common.exception.ForbiddenException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.blog.Comment;
import com.portfolio.domain.blog.Post;
import com.portfolio.domain.blog.PostStatus;
import com.portfolio.domain.blog.repository.CommentRepository;
import com.portfolio.domain.blog.repository.PostRepository;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.blog.dto.CommentRequest;
import com.portfolio.module.blog.dto.CommentResponse;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommentService commentService;

    private User author;
    private Post post;
    private Comment comment;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .email("test@test.com")
                .username("testuser")
                .password("encoded")
                .role(UserRole.USER)
                .build();
        ReflectionTestUtils.setField(author, "id", 1L);

        post = Post.builder()
                .author(author)
                .title("Test Post")
                .slug("test-post")
                .content("Content")
                .excerpt("Excerpt")
                .status(PostStatus.PUBLISHED)
                .build();
        ReflectionTestUtils.setField(post, "id", 1L);

        comment = Comment.builder()
                .post(post)
                .author(author)
                .content("Test comment")
                .build();
        ReflectionTestUtils.setField(comment, "id", 1L);
    }

    @Nested
    @DisplayName("createComment")
    class CreateComment {

        @Test
        @DisplayName("새 댓글을 생성한다")
        void createRootComment() {
            CommentRequest request = new CommentRequest();
            ReflectionTestUtils.setField(request, "content", "New comment");

            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(commentRepository.save(any(Comment.class))).willReturn(comment);

            CommentResponse result = commentService.createComment(1L, request, "testuser");

            assertThat(result).isNotNull();
            verify(commentRepository).save(any(Comment.class));
        }

        @Test
        @DisplayName("대댓글을 생성한다")
        void createReplyComment() {
            CommentRequest request = new CommentRequest();
            ReflectionTestUtils.setField(request, "content", "Reply");
            ReflectionTestUtils.setField(request, "parentId", 1L);

            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(commentRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(comment));
            given(commentRepository.save(any(Comment.class))).willReturn(comment);

            CommentResponse result = commentService.createComment(1L, request, "testuser");

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("2단계 초과 대댓글은 거부한다")
        void rejectDeepReply() {
            Comment parentComment = Comment.builder()
                    .post(post)
                    .author(author)
                    .parent(comment) // 이미 1단계 대댓글
                    .content("Reply")
                    .build();
            ReflectionTestUtils.setField(parentComment, "id", 2L);

            CommentRequest request = new CommentRequest();
            ReflectionTestUtils.setField(request, "content", "Deep reply");
            ReflectionTestUtils.setField(request, "parentId", 2L);

            given(postRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(post));
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(author));
            given(commentRepository.findByIdAndDeletedAtIsNull(2L)).willReturn(Optional.of(parentComment));

            assertThatThrownBy(() -> commentService.createComment(1L, request, "testuser"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("최대 2단계");
        }

        @Test
        @DisplayName("존재하지 않는 게시글에 댓글 작성 시 예외를 던진다")
        void throwWhenPostNotFound() {
            CommentRequest request = new CommentRequest();
            ReflectionTestUtils.setField(request, "content", "Comment");

            given(postRepository.findByIdAndDeletedAtIsNull(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> commentService.createComment(999L, request, "testuser"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("updateComment")
    class UpdateComment {

        @Test
        @DisplayName("본인 댓글을 수정한다")
        void updateOwnComment() {
            CommentRequest request = new CommentRequest();
            ReflectionTestUtils.setField(request, "content", "Updated");

            given(commentRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(comment));

            CommentResponse result = commentService.updateComment(1L, 1L, request, "testuser");

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("타인 댓글 수정 시 예외를 던진다")
        void throwWhenNotOwner() {
            CommentRequest request = new CommentRequest();
            ReflectionTestUtils.setField(request, "content", "Hacked");

            given(commentRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(comment));

            assertThatThrownBy(() -> commentService.updateComment(1L, 1L, request, "otheruser"))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("권한이 없습니다");
        }
    }

    @Nested
    @DisplayName("deleteComment")
    class DeleteComment {

        @Test
        @DisplayName("본인 댓글을 소프트 삭제한다")
        void softDeleteOwnComment() {
            given(commentRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(comment));

            commentService.deleteComment(1L, 1L, "testuser");

            assertThat(comment.getDeletedAt()).isNotNull();
        }

        @Test
        @DisplayName("타인 댓글 삭제 시 예외를 던진다")
        void throwWhenNotOwner() {
            given(commentRepository.findByIdAndDeletedAtIsNull(1L)).willReturn(Optional.of(comment));

            assertThatThrownBy(() -> commentService.deleteComment(1L, 1L, "otheruser"))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    @Nested
    @DisplayName("getComments")
    class GetComments {

        @Test
        @DisplayName("게시글의 댓글 목록을 페이징 조회한다")
        void returnPagedComments() {
            PageRequest pageable = PageRequest.of(0, 10);
            given(commentRepository.findRootCommentsByPostId(1L, pageable))
                    .willReturn(new PageImpl<>(List.of(comment)));
            given(commentRepository.findRepliesByParentId(1L)).willReturn(List.of());

            Page<CommentResponse> result = commentService.getComments(1L, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }
}
