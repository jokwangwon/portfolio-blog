-- Existing publication states and URLs remain unchanged.
ALTER TABLE posts ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE posts ADD CONSTRAINT posts_visibility_check CHECK (visibility IN ('PUBLIC', 'PRIVATE'));
CREATE INDEX idx_posts_public_published ON posts (published_at DESC)
    WHERE deleted_at IS NULL AND status = 'PUBLISHED' AND visibility = 'PUBLIC';
