package com.portfolio.domain.blog;

import com.portfolio.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AccessLevel;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attachment {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "post_id")
    private Post post;
    @Column(name = "storage_key", nullable = false, unique = true, length = 50)
    private String storageKey;
    @Column(name = "media_type", nullable = false, length = 30)
    private String mediaType;
    @Column(name = "byte_size", nullable = false) private long byteSize;
    @Column(nullable = false) private int width;
    @Column(nullable = false) private int height;
    @Column(nullable = false, length = 64) private String sha256;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    public Attachment(UUID id, User owner, String storageKey, String mediaType, long byteSize,
                      int width, int height, String sha256) {
        this.id = id; this.owner = owner; this.storageKey = storageKey; this.mediaType = mediaType;
        this.byteSize = byteSize; this.width = width; this.height = height; this.sha256 = sha256;
        this.createdAt = LocalDateTime.now();
    }
    public void attachTo(Post post) { this.post = post; }
}
