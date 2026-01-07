-- ==========================================
-- 3D Portfolio Blog Database Schema
-- Database: PostgreSQL 15 + TimescaleDB Extension
-- Migration: V1 - Initial Schema
-- ==========================================

-- TimescaleDB Extension 활성화
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ==========================================
-- 1. 사용자 및 인증
-- ==========================================

-- Users 테이블
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,  -- BCrypt 해시
    role VARCHAR(20) NOT NULL DEFAULT 'USER',  -- USER, ADMIN
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,  -- Soft Delete

    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN'))
);

COMMENT ON TABLE users IS '사용자 테이블';
COMMENT ON COLUMN users.password IS 'BCrypt 해시된 비밀번호';
COMMENT ON COLUMN users.deleted_at IS 'Soft Delete 타임스탬프';

-- Refresh Tokens 테이블 (JWT Refresh Token Rotation)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    token_family VARCHAR(100) NOT NULL,  -- Rotation Family ID
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE refresh_tokens IS 'JWT Refresh Token 저장소';
COMMENT ON COLUMN refresh_tokens.token_family IS 'Token Rotation Family ID (재사용 감지용)';

-- OAuth Accounts 테이블 (소셜 로그인)
CREATE TABLE oauth_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,  -- GOOGLE, GITHUB, KAKAO
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

-- Categories 테이블
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS '블로그 카테고리';

-- Tags 테이블
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tags IS '블로그 태그';

-- Posts 테이블
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,
    category_id BIGINT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,  -- Markdown 형식
    excerpt TEXT,  -- 요약문 (최대 200자)
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, PUBLISHED, ARCHIVED
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    deleted_at TIMESTAMP,  -- Soft Delete

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

-- Post-Tag 중간 테이블 (N:M 관계)
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

-- Comments 테이블
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    parent_id BIGINT,  -- 답글인 경우 부모 댓글 ID
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,  -- Soft Delete

    CONSTRAINT fk_comments_post FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
        REFERENCES comments(id) ON DELETE CASCADE
);

COMMENT ON TABLE comments IS '댓글 테이블 (계층 구조 지원)';
COMMENT ON COLUMN comments.parent_id IS '답글인 경우 부모 댓글 ID (Self-Referencing)';

-- ==========================================
-- 3. AI 벤치마크
-- ==========================================

-- AI Models 테이블
CREATE TABLE ai_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,  -- e.g., Llama 3.1 8B
    slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,  -- LLM, Diffusion, etc.
    quantization VARCHAR(20),  -- Q4, Q5, F16, etc.
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,  -- bytes
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_models IS 'AI 모델 메타데이터';
COMMENT ON COLUMN ai_models.quantization IS '양자화 방식 (Q4, Q5, F16 등)';
COMMENT ON COLUMN ai_models.file_size IS '모델 파일 크기 (bytes)';

-- Benchmark Results 테이블
CREATE TABLE benchmark_results (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    prompt_tokens INT NOT NULL,
    generated_tokens INT NOT NULL,
    total_duration NUMERIC(10,3) NOT NULL,  -- seconds
    tokens_per_second NUMERIC(8,2) NOT NULL,
    first_token_latency NUMERIC(8,3) NOT NULL,  -- TTFT in seconds
    avg_gpu_utilization NUMERIC(5,2),  -- percentage
    max_memory_used BIGINT,  -- MB
    avg_temperature NUMERIC(5,2),  -- celsius
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_benchmark_model FOREIGN KEY (model_id)
        REFERENCES ai_models(id) ON DELETE CASCADE,
    CONSTRAINT fk_benchmark_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE benchmark_results IS 'AI 모델 벤치마크 결과';
COMMENT ON COLUMN benchmark_results.first_token_latency IS 'Time To First Token (TTFT)';

-- GPU Metrics 테이블 (TimescaleDB Hypertable)
CREATE TABLE gpu_metrics (
    time TIMESTAMPTZ NOT NULL,  -- TimescaleDB time column
    benchmark_id BIGINT NOT NULL,
    gpu_utilization NUMERIC(5,2),  -- 0.00 ~ 100.00%
    memory_used BIGINT,  -- MB
    memory_total BIGINT,  -- MB
    temperature NUMERIC(5,2),  -- celsius
    power_draw NUMERIC(7,2),  -- Watts
    fan_speed NUMERIC(5,2),  -- 0.00 ~ 100.00%

    CONSTRAINT fk_gpu_metrics_benchmark FOREIGN KEY (benchmark_id)
        REFERENCES benchmark_results(id) ON DELETE CASCADE
);

COMMENT ON TABLE gpu_metrics IS 'GPU 메트릭 시계열 데이터 (TimescaleDB Hypertable)';
COMMENT ON COLUMN gpu_metrics.time IS 'TimescaleDB time column (TIMESTAMPTZ)';

-- TimescaleDB Hypertable 생성
SELECT create_hypertable('gpu_metrics', 'time');

-- ==========================================
-- 4. 초기 데이터 (Seed Data)
-- ==========================================

-- 기본 카테고리 생성
INSERT INTO categories (name, slug, description) VALUES
('Technology', 'technology', 'Tech-related articles and tutorials'),
('Algorithm', 'algorithm', 'Algorithm study and problem solving'),
('Project', 'project', 'Personal project showcase'),
('Troubleshooting', 'troubleshooting', 'Error fixing and solutions');

-- 기본 태그 생성
INSERT INTO tags (name, slug) VALUES
('React', 'react'),
('TypeScript', 'typescript'),
('Python', 'python'),
('Spring Boot', 'spring-boot'),
('FastAPI', 'fastapi'),
('AI', 'ai'),
('Three.js', 'threejs');

-- 관리자 계정 생성 (비밀번호: Admin123!)
-- BCrypt 해시: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (email, username, password, role) VALUES
('admin@example.com', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');

-- ==========================================
-- 5. 함수 및 트리거
-- ==========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Posts 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Users 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. 검증 쿼리 (마이그레이션 확인용)
-- ==========================================

-- TimescaleDB Extension 확인
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
    ) THEN
        RAISE EXCEPTION 'TimescaleDB extension is not installed';
    END IF;
END $$;

-- Hypertable 확인
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'gpu_metrics'
    ) THEN
        RAISE EXCEPTION 'gpu_metrics hypertable was not created';
    END IF;
END $$;

-- 테이블 개수 확인 (13개 테이블 + TimescaleDB 내부 테이블들)
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
        'ai_models', 'benchmark_results', 'gpu_metrics'
    );

    IF table_count != 11 THEN
        RAISE EXCEPTION 'Expected 11 tables, found %', table_count;
    END IF;
END $$;
