package com.portfolio.module.blog.dto;

import com.portfolio.domain.blog.Comment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private boolean deleted;
    private PostResponse.AuthorDto author;
    private Long parentId;
    private List<CommentResponse> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommentResponse from(Comment comment, List<CommentResponse> replies) {
        boolean isDeleted = comment.getDeletedAt() != null;
        return CommentResponse.builder()
                .id(comment.getId())
                .content(isDeleted ? "[삭제된 댓글입니다]" : comment.getContent())
                .deleted(isDeleted)
                .author(isDeleted ? null : new PostResponse.AuthorDto(comment.getAuthor().getId(), comment.getAuthor().getUsername()))
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(replies)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
