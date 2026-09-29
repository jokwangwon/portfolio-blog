CREATE TABLE attachments (
    id UUID PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id),
    post_id BIGINT REFERENCES posts(id),
    storage_key VARCHAR(50) NOT NULL UNIQUE,
    media_type VARCHAR(30) NOT NULL CHECK (media_type IN ('image/png', 'image/jpeg')),
    byte_size BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
    width INTEGER NOT NULL CHECK (width > 0 AND width <= 8192),
    height INTEGER NOT NULL CHECK (height > 0 AND height <= 8192),
    sha256 VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (width::BIGINT * height <= 20000000)
);
CREATE INDEX idx_attachments_post ON attachments(post_id);
CREATE INDEX idx_attachments_owner ON attachments(owner_id, created_at DESC);
