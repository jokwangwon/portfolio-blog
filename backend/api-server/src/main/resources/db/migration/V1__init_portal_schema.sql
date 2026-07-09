-- ==========================================
-- Portal Database Schema
-- Database: PostgreSQL 15
-- Migration: V1 - Initial Portal Schema
-- ==========================================

-- ==========================================
-- 1. 사용자 및 인증
-- ==========================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN'))
);

COMMENT ON TABLE users IS '사용자 테이블';
COMMENT ON COLUMN users.password IS 'BCrypt 해시된 비밀번호';
COMMENT ON COLUMN users.deleted_at IS 'Soft Delete 타임스탬프';

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    token_family VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE refresh_tokens IS 'JWT Refresh Token 저장소';
COMMENT ON COLUMN refresh_tokens.token_family IS 'Token Rotation Family ID (재사용 감지용)';

CREATE TABLE oauth_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT oauth_provider_check CHECK (provider IN ('GOOGLE', 'GITHUB', 'KAKAO')),
    CONSTRAINT oauth_provider_id_unique UNIQUE (provider, provider_id)
);

COMMENT ON TABLE oauth_accounts IS 'OAuth2 소셜 로그인 연동 정보';

-- ==========================================
-- 2. 블로그 콘텐츠
-- ==========================================

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS '블로그 카테고리';

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tags IS '블로그 태그';

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,
    category_id BIGINT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_posts_author FOREIGN KEY (author_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_posts_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT posts_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT posts_view_count_check CHECK (view_count >= 0),
    CONSTRAINT posts_like_count_check CHECK (like_count >= 0)
);

COMMENT ON TABLE posts IS '블로그 게시글';
COMMENT ON COLUMN posts.content IS 'Markdown 형식 콘텐츠';
COMMENT ON COLUMN posts.excerpt IS '요약문 (최대 200자)';
COMMENT ON COLUMN posts.deleted_at IS 'Soft Delete 타임스탬프';

CREATE TABLE post_tags (
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,

    PRIMARY KEY (post_id, tag_id),
    CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_tags_tag FOREIGN KEY (tag_id)
        REFERENCES tags(id) ON DELETE CASCADE
);

COMMENT ON TABLE post_tags IS '게시글-태그 관계 테이블 (N:M)';

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    parent_id BIGINT,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT fk_comments_post FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
        REFERENCES comments(id) ON DELETE CASCADE
);

COMMENT ON TABLE comments IS '댓글 테이블 (계층 구조 지원)';
COMMENT ON COLUMN comments.parent_id IS '답글인 경우 부모 댓글 ID (Self-Referencing)';

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

-- ==========================================
-- 3. Service Registry (ADR-006)
-- ==========================================

CREATE TABLE service_registry (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    health_path VARCHAR(200) NOT NULL DEFAULT '/health',
    summary_path VARCHAR(200) NOT NULL DEFAULT '/api/summary',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_registry IS '독립 서비스 등록 정보 (Service Contract)';

CREATE TABLE service_cache (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL REFERENCES service_registry(service_name),
    status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    summary_data JSONB,
    last_checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    error_message TEXT,
    consecutive_failures INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_cache IS '서비스 상태 캐시 (폴링 결과 저장)';
COMMENT ON COLUMN service_cache.status IS 'UP, DOWN, DEGRADED, UNKNOWN';
COMMENT ON COLUMN service_cache.consecutive_failures IS '연속 실패 횟수 (3회 시 is_active=false)';

-- ==========================================
-- 4. 인덱스
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

-- service_cache
CREATE INDEX idx_service_cache_name ON service_cache(service_name, last_checked_at DESC);

-- ==========================================
-- 5. 트리거 (updated_at 자동 갱신)
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_registry_updated_at
    BEFORE UPDATE ON service_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. Seed Data
-- ==========================================

-- 카테고리
INSERT INTO categories (name, slug, description) VALUES
    ('Technology', 'technology', '기술 관련 글'),
    ('Algorithm', 'algorithm', '알고리즘 학습 노트'),
    ('Projects', 'projects', '프로젝트 소개'),
    ('GB10 Lab', 'gb10-lab', 'Dell GB10 경험'),
    ('DevOps', 'devops', 'CI/CD, 인프라 관련'),
    ('AI & ML', 'ai-ml', 'AI/머신러닝 관련');

-- 태그
INSERT INTO tags (name, slug) VALUES
    ('React', 'react'),
    ('TypeScript', 'typescript'),
    ('Python', 'python'),
    ('Spring Boot', 'spring-boot'),
    ('FastAPI', 'fastapi'),
    ('AI', 'ai'),
    ('Three.js', 'threejs'),
    ('Java', 'java'),
    ('Spring', 'spring'),
    ('Next.js', 'nextjs'),
    ('Docker', 'docker'),
    ('PostgreSQL', 'postgresql'),
    ('Rust', 'rust');

-- 관리자 계정 (비밀번호: Admin123!)
INSERT INTO users (email, username, password, role) VALUES
    ('admin@example.com', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');

-- AI Benchmark 서비스 등록
INSERT INTO service_registry (service_name, display_name, base_url, health_path, summary_path, is_active)
VALUES ('ai-benchmark', 'AI 모델 벤치마크', 'http://ai-api-server:8000', '/health', '/api/summary', true);

-- ==========================================
-- 7. 검증
-- ==========================================

DO $$
DECLARE
    table_count INT;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'users', 'refresh_tokens', 'oauth_accounts',
        'categories', 'tags', 'posts', 'post_tags', 'comments',
        'likes', 'service_registry', 'service_cache'
    );

    IF table_count != 11 THEN
        RAISE EXCEPTION 'Expected 11 tables, found %', table_count;
    END IF;
END $$;
