# 데이터베이스 물리 분리 설계 (Service-per-Database)

> **아키텍처 리뷰 + ADR-006 반영 문서**
> 기존 3개 DB → 서비스별 독립 PostgreSQL 인스턴스 (물리 분리)

**작성일**: 2026-01-07
**최종 수정**: 2026-03-30
**우선순위**: 🔴 **CRITICAL**
**근거**: `docs/review/architecture-review.md` 권장사항 #1
**관련**: [ADR-001](../decisions/ADR-001-database-consolidation.md), [ADR-006](../decisions/ADR-006-microservice-architecture.md)

---

> **Phase 경계 안내**
>
> 이 문서의 DB 설계는 **서비스별 물리적 DB 분리**를 전제로 합니다.
> [ADR-006](../decisions/ADR-006-microservice-architecture.md) (2026-03-30)에 의해 **서비스별 독립 PostgreSQL 인스턴스**가 적용됩니다:
>
> | Phase | DB 구조 |
> |-------|---------|
> | Phase 1 | 서비스별 독립 PostgreSQL 컨테이너 (`portal-db`, `ai-bench-db`) |
> | Phase 2+ | 필요 시 관리형 DB 전환 (RDS 등) |
>
> **규칙**: 물리적 분리로 인프라 레벨에서 교차 접근 원천 차단. 데이터 필요 시 REST API 호출.

---

## 1. 변경 배경

### 기존 설계 (3개 DB)
```
PostgreSQL (Main)      ← 블로그 데이터
TimescaleDB (Separate) ← GPU 메트릭
Redis                  ← 세션/캐시
```

### 문제점
1. **과도한 복잡도**: MVP 단계에서 3개 DB 운영은 과도함
2. **운영 부담**: 백업, 모니터링, 버전 관리 3배
3. **개발 속도 저하**: DB 연결 설정, 마이그레이션 2배
4. **비용 증가**: AWS RDS 인스턴스 2개 필요 (PostgreSQL + TimescaleDB)

### 개선안
```
서비스별 독립 PostgreSQL 컨테이너 (물리적 분리)
├── portal-db      ← Portal API (블로그, 사용자, 서비스 레지스트리) [PostgreSQL 15]
├── ai-bench-db    ← AI Benchmark API (모델, 결과, GPU 메트릭) [TimescaleDB + PG15]
└── {service}-db   ← 새 서비스 추가 시
Redis (Phase 2로 지연) ← 캐싱은 나중에
```

**예상 효과**:
- 서비스 간 DB 교차 접근 인프라 레벨에서 원천 차단
- 서비스별 독립적 스케일링/백업/복구 가능
- 장애 격리 (한 DB 장애가 다른 서비스에 영향 없음)

### 포트 할당 정책

서비스 포트와 DB 포트를 미리 예약하여 충돌을 방지합니다.

| 서비스 | 서비스 포트 | DB 컨테이너 | DB 호스트 포트 | DB 이미지 |
|--------|-----------|------------|--------------|-----------|
| Portal API | 8080 | portal-db | **5432** | postgres:15 |
| AI Benchmark API | 8000 | ai-bench-db | **5433** | timescaledb:latest-pg15 |
| PhotoToon (예정) | 8100 | phototoon-db | **5434** | postgres:15 |
| Project-M (예정) | 8200 | project-m-db | **5435** | postgres:15 |
| (예비 슬롯) | 83XX | {service}-db | **5436+** | 자유 선택 |

**규칙**:
- DB 포트: 5432부터 순차 할당 (portal → ai-bench → 신규 순)
- 서비스 포트: 8000번대 (Portal 8080, AI 8000, 신규 81XX~83XX)
- 컨테이너 내부 포트는 항상 5432 (PostgreSQL 기본), 호스트 포트만 다르게 매핑

---

## 2. 서비스별 독립 DB 구성

### 2.1 구성 원칙

- **Portal DB**: 순수 PostgreSQL 15 — 블로그, 사용자, 인증, Service Registry
- **AI Bench DB**: TimescaleDB (PostgreSQL 15 + Extension) — AI 모델, 벤치마크 결과, GPU 메트릭 시계열 데이터
- **새 서비스 DB**: 서비스 요구사항에 맞는 이미지 자유 선택

TimescaleDB는 PostgreSQL의 확장(Extension)으로, 시계열 데이터 최적화(Hypertable, 자동 압축/삭제)를 제공합니다. AI Benchmark 서비스에서만 필요하므로 `ai-bench-db`에서만 사용합니다.

### 2.2 Docker Compose (개발 환경)
```yaml
# infrastructure/docker-compose.yml
version: '3.8'

services:
  portal-db:
    image: postgres:15
    container_name: portal-db
    environment:
      POSTGRES_DB: portal_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${PORTAL_DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - portal_db_data:/var/lib/postgresql/data
      - ./init-scripts/portal:/docker-entrypoint-initdb.d
    networks:
      - portal-network

  ai-bench-db:
    image: timescale/timescaledb:latest-pg15
    container_name: ai-bench-db
    environment:
      POSTGRES_DB: ai_bench_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${AI_BENCH_DB_PASSWORD}
    ports:
      - "5433:5432"
    volumes:
      - ai_bench_db_data:/var/lib/postgresql/data
      - ./init-scripts/ai-bench:/docker-entrypoint-initdb.d
    networks:
      - portal-network

volumes:
  portal_db_data:
  ai_bench_db_data:

networks:
  portal-network:
```

#### 초기화 스크립트

각 컨테이너가 자체 DB를 생성하므로 `CREATE DATABASE`는 불필요합니다.

**Portal DB 초기화:**
```sql
-- infrastructure/init-scripts/portal/01-init.sql

-- portal_db는 컨테이너 환경변수(POSTGRES_DB)로 자동 생성됨
-- 추가 Extension이 필요한 경우 여기에 작성
```

**AI Bench DB 초기화:**
```sql
-- infrastructure/init-scripts/ai-bench/01-init-timescaledb.sql

-- ai_bench_db는 컨테이너 환경변수(POSTGRES_DB)로 자동 생성됨

-- TimescaleDB Extension 활성화
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 확인
SELECT default_version, installed_version
FROM pg_available_extensions
WHERE name = 'timescaledb';
```

---

## 3. 데이터베이스 스키마 설계

### 3.1 일반 테이블 (블로그) — `portal_db`

```sql
-- 사용자
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- 게시글
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,
    category_id BIGINT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt VARCHAR(200),                -- 요약문 (최대 200자, 미제공 시 앱에서 자동 생성)
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, PUBLISHED, ARCHIVED
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,              -- DRAFT→PUBLISHED 전이 시 자동 설정
    deleted_at TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 인덱스 (성능 최적화)
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_category_created ON posts(category_id, created_at DESC);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_slug ON posts(slug) WHERE deleted_at IS NULL;

-- 카테고리
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 태그
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 게시글-태그 관계
CREATE TABLE post_tags (
    post_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- 댓글
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    parent_id BIGINT,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- 좋아요 (사용자당 게시글 1회)
CREATE TABLE likes (
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

### 3.2 시계열 테이블 (GPU 메트릭) — `ai_bench_db` (Hypertable)

```sql
-- GPU 메트릭 (시계열 데이터)
-- ⚠️ Hypertable은 전통적 PK 대신 time 기반 파티셔닝 사용
-- PK 없음 — TimescaleDB가 time 컬럼으로 파티션/정렬 관리
CREATE TABLE gpu_metrics (
    time TIMESTAMPTZ NOT NULL,         -- TimescaleDB 파티션 키 (UTC 저장)
    benchmark_id BIGINT NOT NULL,
    gpu_utilization NUMERIC(5,2),      -- 0.00 ~ 100.00%
    memory_used BIGINT,                -- MB
    memory_total BIGINT,               -- MB
    temperature NUMERIC(5,2),          -- 섭씨
    power_draw NUMERIC(7,2),           -- Watts
    fan_speed NUMERIC(5,2)             -- 0.00 ~ 100.00%
);

-- Hypertable로 변환 (TimescaleDB 기능, chunk_interval 기본 7일)
SELECT create_hypertable('gpu_metrics', 'time');

-- 인덱스
CREATE INDEX idx_gpu_metrics_benchmark ON gpu_metrics(benchmark_id, time DESC);

-- 자동 압축 정책 (30일 이후 데이터)
ALTER TABLE gpu_metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'benchmark_id'
);

SELECT add_compression_policy('gpu_metrics', INTERVAL '30 days');

-- 자동 삭제 정책 (180일 이후 데이터)
SELECT add_retention_policy('gpu_metrics', INTERVAL '180 days');
```

### 3.3 벤치마크 테이블 — `ai_bench_db`

```sql
-- AI 모델
CREATE TABLE ai_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,           -- LLM, Diffusion, etc.
    quantization VARCHAR(20),            -- Q4, Q5, F16, etc.
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,           -- bytes
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 벤치마크 결과
CREATE TABLE benchmark_results (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,              -- Portal의 users.id 값 (FK 불가, 물리 분리)
    prompt_tokens INT NOT NULL,
    generated_tokens INT NOT NULL,
    total_duration NUMERIC(10,3) NOT NULL,  -- seconds
    tokens_per_second NUMERIC(8,2) NOT NULL,
    first_token_latency NUMERIC(8,3) NOT NULL,  -- seconds
    avg_gpu_utilization NUMERIC(5,2),
    max_memory_used BIGINT,
    avg_temperature NUMERIC(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (model_id) REFERENCES ai_models(id)
    -- user_id는 portal-db의 users.id를 참조하지만, 물리적으로 다른 DB이므로 FK 불가
    -- 데이터 정합성은 애플리케이션 레벨에서 보장 (Portal API 호출로 사용자 검증)
);

CREATE INDEX idx_benchmark_model_created ON benchmark_results(model_id, created_at DESC);
CREATE INDEX idx_benchmark_user ON benchmark_results(user_id, created_at DESC);
```

### 3.4 인증 관련 테이블 — `portal_db`

```sql
-- Refresh Token (JWT Rotation용)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL,
    token_family VARCHAR(100) NOT NULL,  -- Rotation Family ID (재사용 감지용)
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at DESC);
CREATE UNIQUE INDEX idx_refresh_tokens_token_active ON refresh_tokens(token) WHERE NOT revoked;
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(token_family);

-- OAuth2 연동 정보
CREATE TABLE oauth_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,      -- GOOGLE, GITHUB, KAKAO
    provider_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
```

### 3.5 Service Registry 테이블 — `portal_db`

```sql
-- 서비스 등록 정보
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

-- 서비스 상태 캐시 (마지막 조회 결과)
CREATE TABLE service_cache (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL REFERENCES service_registry(service_name),
    status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',  -- UP, DOWN, DEGRADED, UNKNOWN
    summary_data JSONB,                              -- /api/summary 응답 캐시
    last_checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    error_message TEXT,
    consecutive_failures INT NOT NULL DEFAULT 0,     -- 연속 실패 횟수 (3회 시 is_active=false)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_cache_name ON service_cache(service_name, last_checked_at DESC);
```

---

## 4. Spring Boot 설정 (Portal API → `portal_db`)

### 4.1 application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:portal-db}:5432/${DB_NAME:portal_db}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver

    # HikariCP 설정
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate  # 프로덕션에서는 validate, 개발에서는 update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        use_sql_comments: true
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true
    show-sql: false  # 로깅으로 대체

  # Flyway (DB 마이그레이션)
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
```

### 4.2 build.gradle

```gradle
dependencies {
    // PostgreSQL Driver
    implementation 'org.postgresql:postgresql'

    // JPA
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    // QueryDSL (N+1 방지)
    implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
    annotationProcessor 'com.querydsl:querydsl-apt:5.0.0:jakarta'
    annotationProcessor 'jakarta.annotation:jakarta.annotation-api'
    annotationProcessor 'jakarta.persistence:jakarta.persistence-api'

    // Flyway (마이그레이션)
    implementation 'org.flywaydb:flyway-core'
}
```

---

## 5. FastAPI 설정 (AI Benchmark API → `ai_bench_db`)

### 5.1 Database Connection

```python
# ai-benchmark-api/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# PostgreSQL 연결 (TimescaleDB extension 사용)
DATABASE_URL = f"postgresql://{settings.DB_USERNAME}:{settings.DB_PASSWORD}@{settings.DB_HOST}:5433/{settings.DB_NAME}"  # ai-bench-db:5433

engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 5.2 GPU Metrics Model

```python
# ai-api/app/models/gpu_metrics.py
from sqlalchemy import Column, BigInteger, TIMESTAMP, Numeric
from app.core.database import Base

class GPUMetrics(Base):
    __tablename__ = "gpu_metrics"

    time = Column(TIMESTAMP(timezone=True), primary_key=True)
    benchmark_id = Column(BigInteger, primary_key=True)
    gpu_utilization = Column(Numeric(5, 2))
    memory_used = Column(BigInteger)
    memory_total = Column(BigInteger)
    temperature = Column(Numeric(5, 2))
    power_draw = Column(Numeric(7, 2))
    fan_speed = Column(Numeric(5, 2))
```

---

## 6. Redis 제거 (Phase 2로 지연)

### 기존 Redis 사용 계획
1. JWT Refresh Token Blacklist → **PostgreSQL 테이블로 대체**
2. API 응답 캐시 (포스트 목록) → **Phase 2로 지연 (초기 트래픽 낮음)**
3. 세션 저장소 → **사용하지 않음 (Stateless JWT)**

### Refresh Token Blacklist 구현

#### PostgreSQL 기반 (Phase 1)
```java
// RefreshTokenRepository.java
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = CURRENT_TIMESTAMP WHERE rt.token = :token")
    void revokeToken(@Param("token") String token);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();
}
```

#### Redis 기반 (Phase 2 - 선택적)
```java
// Phase 2에서 트래픽 증가 시 고려
@Service
public class RedisBlacklistService {
    private final StringRedisTemplate redisTemplate;

    public void addToBlacklist(String token, long ttlSeconds) {
        redisTemplate.opsForValue().set("blacklist:" + token, "revoked", ttlSeconds, TimeUnit.SECONDS);
    }

    public boolean isBlacklisted(String token) {
        return redisTemplate.hasKey("blacklist:" + token);
    }
}
```

---

## 7. 마이그레이션 전략

### 7.1 Portal DB 마이그레이션 (Flyway)

Portal API(Spring Boot)는 Flyway로 `portal-db` 스키마를 관리합니다.

```
backend/api-server/src/main/resources/db/migration/
├── V1__init_portal_schema.sql       (users, categories, tags)
├── V2__create_posts_tables.sql      (posts, post_tags, comments, likes)
├── V3__create_auth_tables.sql       (refresh_tokens, oauth_accounts)
├── V4__create_service_registry.sql  (service_registry, service_cache)
├── V5__add_indexes.sql              (성능 최적화 인덱스)
└── V6__seed_data.sql                (초기 데이터)
```

```sql
-- V6__seed_data.sql (초기 카테고리, 태그, 관리자 계정, 서비스 등록)

-- 관리자 계정 (비밀번호: Admin123! → BCrypt 해시)
INSERT INTO users (email, username, password, role, created_at, updated_at)
VALUES ('admin@example.com', 'admin',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'ADMIN', NOW(), NOW());

-- 초기 카테고리
INSERT INTO categories (name, slug, description, created_at) VALUES
  ('Technology', 'technology', '기술 관련 글', NOW()),
  ('Algorithm', 'algorithm', '알고리즘 학습 노트', NOW()),
  ('DevOps', 'devops', 'CI/CD, 인프라 관련', NOW()),
  ('AI & ML', 'ai-ml', 'AI/머신러닝 관련', NOW()),
  ('Projects', 'projects', '프로젝트 소개', NOW()),
  ('GB10 Lab', 'gb10-lab', 'Dell GB10 경험', NOW());

-- 초기 태그
INSERT INTO tags (name, slug, created_at) VALUES
  ('Java', 'java', NOW()),
  ('Spring', 'spring', NOW()),
  ('Python', 'python', NOW()),
  ('TypeScript', 'typescript', NOW()),
  ('React', 'react', NOW()),
  ('Next.js', 'nextjs', NOW()),
  ('Docker', 'docker', NOW()),
  ('PostgreSQL', 'postgresql', NOW()),
  ('Rust', 'rust', NOW()),
  ('FastAPI', 'fastapi', NOW());

-- AI Benchmark 서비스 등록
INSERT INTO service_registry (service_name, display_name, base_url, health_path, summary_path, is_active, created_at, updated_at)
VALUES ('ai-benchmark', 'AI 모델 벤치마크', 'http://ai-api-server:8000',
        '/health', '/api/summary', true, NOW(), NOW());
```

### 7.2 AI Bench DB 마이그레이션 (Alembic)

AI Benchmark API(FastAPI)는 Alembic으로 `ai-bench-db` 스키마를 관리합니다.

```
ai-benchmark-api/alembic/versions/
├── 001_init_ai_bench_schema.py      (ai_models, benchmark_results)
├── 002_add_gpu_metrics_hypertable.py (gpu_metrics + TimescaleDB Hypertable)
└── 003_add_compression_policy.py    (자동 압축/삭제 정책)
```

```sql
-- ai-bench-db 전용: TimescaleDB Extension 활성화
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE ai_models ( ... );
CREATE TABLE benchmark_results ( ... );
CREATE TABLE gpu_metrics ( ... );
SELECT create_hypertable('gpu_metrics', 'time');
-- (위 3.2, 3.3 스키마 참고)
```

> **핵심**: Portal DB와 AI Bench DB는 물리적으로 다른 컨테이너이므로 마이그레이션도 완전히 분리됩니다.

---

## 8. AWS 배포 시 고려사항

### 8.1 AWS RDS — 서비스별 독립 인스턴스

물리 분리 원칙을 AWS에서도 유지합니다. 서비스별 독립 RDS 인스턴스를 사용합니다.

```hcl
# terraform/rds.tf

# Portal DB (PostgreSQL 15 — 블로그, 인증, Registry)
resource "aws_db_instance" "portal_db" {
  identifier     = "portal-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  storage_type   = "gp3"
  db_name        = "portal_db"
  username       = var.portal_db_username
  password       = var.portal_db_password
  multi_az       = false
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.portal_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# AI Bench DB — TimescaleDB는 RDS 미지원
# 대안 1: EC2에 TimescaleDB Docker 실행 (Phase 2 권장)
# 대안 2: Timescale Cloud (관리형 서비스)
# 대안 3: RDS PostgreSQL + 일반 인덱스 (Hypertable 포기)
```

### 8.2 Phase 2 확장 계획

```
Phase 1: Docker Compose (서비스별 독립 컨테이너)
    ↓
Phase 2: AWS RDS (서비스별 독립 인스턴스) + Read Replica
    ↓
Phase 3: Multi-AZ (고가용성) + AI Bench는 EC2 TimescaleDB
```

---

## 9. 검증 체크리스트

### 개발 환경
- [ ] Docker Compose로 portal-db, ai-bench-db 컨테이너 각각 실행 확인
- [ ] portal-db: PostgreSQL 15 정상 동작 확인 (포트 5432)
- [ ] ai-bench-db: TimescaleDB Extension 설치 확인 (포트 5433)
- [ ] ai-bench-db: Hypertable 생성 확인 (`SELECT * FROM timescaledb_information.hypertables;`)
- [ ] Portal API -> portal-db 연결 테스트
- [ ] AI Benchmark API -> ai-bench-db 연결 테스트
- [ ] 각 서비스에서 상대 DB로의 접근이 불가능한지 확인 (물리적 격리 검증)
- [ ] Flyway 마이그레이션 성공

### 기능 검증
- [ ] 일반 테이블 CRUD (Posts, Users)
- [ ] Hypertable 삽입/조회 (GPU Metrics)
- [ ] 인덱스 성능 테스트 (`EXPLAIN ANALYZE`)
- [ ] N+1 쿼리 방지 확인 (Fetch Join)

### 성능 테스트
- [ ] 포스트 목록 조회 (< 100ms)
- [ ] GPU 메트릭 조회 (최근 1시간, < 50ms)
- [ ] 벤치마크 결과 조회 (모델별, < 100ms)

---

## 10. 결론

### 변경 전 (3개 DB)
```
PostgreSQL + TimescaleDB + Redis
→ 복잡도 높음, 운영 부담 큼
```

### 변경 후 (서비스별 물리적 분리)
```
서비스별 독립 PostgreSQL 컨테이너
├── portal-db (PostgreSQL 15)      ← Portal API     [:5432]
├── ai-bench-db (TimescaleDB PG15) ← AI Benchmark API [:5433]
└── 물리적 분리로 교차 접근 원천 차단
```

### 예상 효과
- 인프라 레벨에서 서비스 간 DB 교차 접근 원천 차단
- 서비스별 독립적 스케일링/백업/복구 가능
- 장애 격리 (한 DB 장애가 다른 서비스에 전파되지 않음)
- 서비스별 독립 스키마 관리 (ADR-006)
- 각 서비스에 최적화된 DB 이미지 선택 가능 (예: TimescaleDB)

### Phase 2 확장 경로
- Redis 캐싱 추가 (트래픽 증가 시)
- Read Replica (조회 성능 향상)
- 관리형 DB 전환 (AWS RDS 등)
- Multi-AZ (고가용성)

---

## ADR-006 이후 변경 사항

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-30 | 논리적 DB 분리 -> 물리적 DB 분리로 전략 변경 |
| 2026-03-30 | 서비스별 독립 PostgreSQL 컨테이너 구성 (portal-db, ai-bench-db) |
| 2026-03-30 | ai-bench-db 포트를 5433으로 변경하여 포트 충돌 방지 |
| 2026-03-30 | 인프라 레벨에서 서비스 간 교차 접근 원천 차단 적용 |

---

**이 문서는 `docs/review/architecture-review.md` 권장사항을 반영한 설계입니다.**
**서비스별 DB 분리 전략은 [ADR-006](../decisions/ADR-006-microservice-architecture.md)을 참조하세요.**
