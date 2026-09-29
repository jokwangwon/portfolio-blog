package com.portfolio.domain.blog;

import com.portfolio.domain.common.SoftDeletableEntity;
import com.portfolio.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String excerpt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostVisibility visibility = PostVisibility.PUBLIC;

    @Column(name = "edit_version", nullable = false)
    private long editVersion = 0;
    @Column(name = "edited_at")
    private LocalDateTime editedAt;
    @Column(name = "content_format", nullable = false, length = 30)
    private String contentFormat = "MARKDOWN_V1";

    public void recordEdit() { editVersion++; editedAt = LocalDateTime.now(); }
    public void recordCreation() { editedAt = LocalDateTime.now(); }

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @ManyToMany
    @JoinTable(
        name = "post_tags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags = new ArrayList<>();

    @Builder
    public Post(User author, Category category, String title, String slug,
                String content, String excerpt, PostStatus status, PostVisibility visibility) {
        this.author = author;
        this.category = category;
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.excerpt = excerpt;
        this.status = status != null ? status : PostStatus.DRAFT;
        this.visibility = visibility != null ? visibility : PostVisibility.PUBLIC;
        this.viewCount = 0;
        this.likeCount = 0;
    }

    public void update(String title, String slug, String content, String excerpt,
                      Category category) {
        this.title = title;
        this.slug = slug;
        this.content = content;
        this.excerpt = excerpt;
        this.category = category;
    }

    public void publish() {
        this.status = PostStatus.PUBLISHED;
        this.publishedAt = LocalDateTime.now();
    }

    public void archive() {
        this.status = PostStatus.ARCHIVED;
    }

    public void draft() {
        this.status = PostStatus.DRAFT;
        this.publishedAt = null;
    }

    public void changeVisibility(PostVisibility visibility) {
        if (visibility != null) this.visibility = visibility;
    }

    public boolean isPubliclyReadable() {
        return getDeletedAt() == null && status == PostStatus.PUBLISHED && visibility == PostVisibility.PUBLIC;
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementLikeCount() {
        this.likeCount++;
    }

    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    public void addTag(Tag tag) {
        if (!this.tags.contains(tag)) {
            this.tags.add(tag);
        }
    }

    public void removeTag(Tag tag) {
        this.tags.remove(tag);
    }

    public void clearTags() {
        this.tags.clear();
    }

    public void updateTags(List<Tag> newTags) {
        this.tags.clear();
        this.tags.addAll(newTags);
    }
}
