-- ==========================================
-- V4: 성능 최적화 인덱스 추가
-- SDD 명세 기준 누락 인덱스 보완
-- ==========================================

-- users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;

-- refresh_tokens
CREATE UNIQUE INDEX idx_refresh_tokens_token_active ON refresh_tokens(token) WHERE NOT revoked;
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(token_family);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at DESC);

-- oauth_accounts
CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);

-- posts
CREATE INDEX idx_posts_author ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_category ON posts(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_status ON posts(status, published_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_posts_slug ON posts(slug) WHERE deleted_at IS NULL;

-- comments
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- benchmark_results
CREATE INDEX idx_benchmark_model_created ON benchmark_results(model_id, created_at DESC);
CREATE INDEX idx_benchmark_user ON benchmark_results(user_id, created_at DESC);

-- gpu_metrics
CREATE INDEX IF NOT EXISTS idx_gpu_metrics_benchmark ON gpu_metrics(benchmark_id, time DESC);
