package com.portfolio.module.blog.service;

import com.portfolio.domain.blog.Comment;
import com.portfolio.domain.blog.Post;
import com.portfolio.domain.blog.repository.CommentRepository;
import com.portfolio.domain.blog.repository.PostRepository;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.blog.dto.CommentRequest;
import com.portfolio.module.blog.dto.CommentResponse;
import com.portfolio.common.exception.ForbiddenException;
import com.portfolio.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public Page<CommentResponse> getComments(Long postId, Pageable pageable) {
        return commentRepository.findRootCommentsByPostId(postId, pageable)
                .map(comment -> {
                    List<CommentResponse> replies = commentRepository.findRepliesByParentId(comment.getId())
                            .stream()
                            .map(reply -> CommentResponse.from(reply, List.of()))
                            .toList();
                    return CommentResponse.from(comment, replies);
                });
    }

    @Transactional
    public CommentResponse createComment(Long postId, CommentRequest request, String username) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("POST_NOT_FOUND", "게시글을 찾을 수 없습니다"));
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다"));

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findByIdAndDeletedAtIsNull(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("COMMENT_NOT_FOUND", "부모 댓글을 찾을 수 없습니다"));
            // 최대 2단계 깊이 제한
            if (parent.getParent() != null) {
                throw new IllegalArgumentException("댓글은 최대 2단계까지만 허용됩니다");
            }
        }

        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .parent(parent)
                .content(request.getContent())
                .build();

        commentRepository.save(comment);
        return CommentResponse.from(comment, List.of());
    }

    @Transactional
    public CommentResponse updateComment(Long postId, Long commentId, CommentRequest request, String username) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다"));

        if (!comment.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("COMMENT_FORBIDDEN", "댓글 수정 권한이 없습니다");
        }

        comment.update(request.getContent());
        return CommentResponse.from(comment, List.of());
    }

    @Transactional
    public void deleteComment(Long postId, Long commentId, String username) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다"));

        if (!comment.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("COMMENT_FORBIDDEN", "댓글 삭제 권한이 없습니다");
        }

        comment.delete(); // Soft delete — "[삭제된 댓글입니다]"로 표시
    }
}
