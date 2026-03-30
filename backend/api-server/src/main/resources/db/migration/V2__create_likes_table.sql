-- ==========================================
-- V2: likes 테이블 생성
-- 사용자당 게시글 1회 좋아요 (복합 PK)
-- ==========================================

CREATE TABLE likes (
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_post FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE
);

COMMENT ON TABLE likes IS '게시글 좋아요 (사용자당 1회)';
