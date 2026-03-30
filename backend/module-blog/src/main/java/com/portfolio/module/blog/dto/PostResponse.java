package com.portfolio.module.blog.dto;

import com.portfolio.domain.blog.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PostResponse {
    private Long id;
    private String title;
    private String slug;
    private String content;
    private String excerpt;
    private String status;
    private Integer viewCount;
    private Integer likeCount;
    private AuthorDto author;
    private CategoryDto category;
    private List<TagDto> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    public static PostResponse from(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .content(post.getContent())
                .excerpt(post.getExcerpt())
                .status(post.getStatus().name())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .author(new AuthorDto(post.getAuthor().getId(), post.getAuthor().getUsername()))
                .category(post.getCategory() != null
                        ? new CategoryDto(post.getCategory().getId(), post.getCategory().getName(), post.getCategory().getSlug())
                        : null)
                .tags(post.getTags().stream()
                        .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                        .toList())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .publishedAt(post.getPublishedAt())
                .build();
    }

    public static PostResponse summary(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .excerpt(post.getExcerpt())
                .status(post.getStatus().name())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .author(new AuthorDto(post.getAuthor().getId(), post.getAuthor().getUsername()))
                .category(post.getCategory() != null
                        ? new CategoryDto(post.getCategory().getId(), post.getCategory().getName(), post.getCategory().getSlug())
                        : null)
                .tags(post.getTags().stream()
                        .map(t -> new TagDto(t.getId(), t.getName(), t.getSlug()))
                        .toList())
                .createdAt(post.getCreatedAt())
                .publishedAt(post.getPublishedAt())
                .build();
    }

    public record AuthorDto(Long id, String username) {}
    public record CategoryDto(Long id, String name, String slug) {}
    public record TagDto(Long id, String name, String slug) {}
}
