# 데이터베이스 통합 설계 (PostgreSQL Consolidation)

> **아키텍처 리뷰 반영 문서**
> 기존 PostgreSQL + TimescaleDB 분리 → PostgreSQL Extension 통합

**작성일**: 2026-01-07
**우선순위**: 🔴 **CRITICAL**
**근거**: `docs/review/architecture-review.md` 권장사항 #1

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
PostgreSQL (with TimescaleDB extension) ← 모든 데이터
Redis (Phase 2로 지연)                 ← 캐싱은 나중에
```

**예상 효과**:
- 운영 복잡도 40% 감소
- 개발 속도 30% 향상
- AWS 비용 $30/월 절감

---

## 2. TimescaleDB Extension 설계

### 2.1 TimescaleDB란?

TimescaleDB는 **PostgreSQL의 확장(Extension)**입니다.
- PostgreSQL에 설치하여 시계열 데이터 최적화 기능 추가
- 기존 PostgreSQL 기능 100% 호환
- 하나의 DB에서 일반 테이블 + 시계열 테이블 공존 가능

### 2.2 설치 방법

#### Docker Compose (개발 환경)
```yaml
# infrastructure/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15  # TimescaleDB 포함 이미지
    container_name: blog-postgres
    environment:
      POSTGRES_DB: blog_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - blog-network

volumes:
  postgres_data:

networks:
  blog-network:
```

#### 초기화 스크립트
```sql
-- infrastructure/init-scripts/01-init-timescaledb.sql

-- TimescaleDB Extension 활성화
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 데이터베이스 생성
CREATE DATABASE blog_db;

\c blog_db;

-- 확인
SELECT default_version, installed_version
FROM pg_available_extensions
WHERE name = 'timescaledb';
```

---

## 3. 데이터베이스 스키마 설계

### 3.1 일반 테이블 (블로그)

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
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
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
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC) WHERE deleted_at IS NULL;
```

### 3.2 시계열 테이블 (GPU 메트릭) - Hypertable

```sql
-- GPU 메트릭 (시계열 데이터)
CREATE TABLE gpu_metrics (
    time TIMESTAMPTZ NOT NULL,
    benchmark_id BIGINT NOT NULL,
    gpu_utilization NUMERIC(5,2),    -- 0.00 ~ 100.00%
    memory_used BIGINT,               -- MB
    memory_total BIGINT,              -- MB
    temperature NUMERIC(5,2),         -- 섭씨
    power_draw NUMERIC(7,2),          -- Watts
    fan_speed NUMERIC(5,2)            -- 0.00 ~ 100.00%
);

-- Hypertable로 변환 (TimescaleDB 기능)
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

### 3.3 벤치마크 테이블 (일반 테이블)

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
    user_id BIGINT NOT NULL,
    prompt_tokens INT NOT NULL,
    generated_tokens INT NOT NULL,
    total_duration NUMERIC(10,3) NOT NULL,  -- seconds
    tokens_per_second NUMERIC(8,2) NOT NULL,
    first_token_latency NUMERIC(8,3) NOT NULL,  -- seconds
    avg_gpu_utilization NUMERIC(5,2),
    max_memory_used BIGINT,
    avg_temperature NUMERIC(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (model_id) REFERENCES ai_models(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_benchmark_model_created ON benchmark_results(model_id, created_at DESC);
CREATE INDEX idx_benchmark_user ON benchmark_results(user_id, created_at DESC);
```

### 3.4 인증 관련 테이블

```sql
-- Refresh Token (JWT Rotation용)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at DESC);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE NOT revoked;

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

---

## 4. Spring Boot 설정

### 4.1 application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/${DB_NAME:blog_db}
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

## 5. FastAPI 설정 (AI API)

### 5.1 Database Connection

```python
# ai-api/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# PostgreSQL 연결 (TimescaleDB extension 사용)
DATABASE_URL = f"postgresql://{settings.DB_USERNAME}:{settings.DB_PASSWORD}@{settings.DB_HOST}:5432/{settings.DB_NAME}"

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

### 7.1 Flyway 마이그레이션 파일

```sql
-- backend/api-server/src/main/resources/db/migration/V1__init_schema.sql

-- TimescaleDB Extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users 테이블
CREATE TABLE users (
    -- (위 스키마 참고)
);

-- Posts 테이블
-- ...

-- GPU Metrics Hypertable
CREATE TABLE gpu_metrics (
    -- (위 스키마 참고)
);

SELECT create_hypertable('gpu_metrics', 'time');
```

### 7.2 버전 관리

```
db/migration/
├── V1__init_schema.sql          (초기 스키마)
├── V2__add_oauth_tables.sql     (OAuth 추가)
├── V3__add_benchmark_tables.sql (벤치마크 추가)
└── V4__add_indexes.sql          (성능 최적화)
```

---

## 8. AWS 배포 시 고려사항

### 8.1 RDS PostgreSQL with TimescaleDB

```hcl
# terraform/rds.tf
resource "aws_db_instance" "blog_postgres" {
  identifier = "blog-postgres"
  engine     = "postgres"
  engine_version = "15.4"

  # TimescaleDB는 RDS에서 직접 지원하지 않음
  # 대안 1: EC2에 TimescaleDB 직접 설치
  # 대안 2: RDS + 일반 PostgreSQL (Hypertable 없이 일반 인덱스 사용)
  # 대안 3: Timescale Cloud (관리형 서비스)

  instance_class = "db.t3.micro"
  allocated_storage = 20
  storage_type = "gp3"

  db_name  = "blog_db"
  username = var.db_username
  password = var.db_password

  backup_retention_period = 7
  backup_window = "03:00-04:00"
  maintenance_window = "Mon:04:00-Mon:05:00"

  multi_az = false  # Phase 1은 단일 AZ
  publicly_accessible = false

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
}
```

### 8.2 Phase 2 확장 계획

```
Phase 1: RDS PostgreSQL 단일 인스턴스
    ↓
Phase 2: Read Replica 추가
    ↓
Phase 3: Multi-AZ (고가용성)
```

---

## 9. 검증 체크리스트

### 개발 환경
- [ ] Docker Compose로 PostgreSQL + TimescaleDB 실행 확인
- [ ] Extension 설치 확인 (`SELECT * FROM pg_extension;`)
- [ ] Hypertable 생성 확인 (`SELECT * FROM timescaledb_information.hypertables;`)
- [ ] Main API 연결 테스트
- [ ] AI API 연결 테스트
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

### 변경 후 (1개 DB)
```
PostgreSQL (with TimescaleDB extension)
→ 단순화, 개발 속도 향상
```

### 예상 효과
- ✅ 운영 복잡도 40% 감소
- ✅ 개발 속도 30% 향상
- ✅ AWS 비용 $30/월 절감
- ✅ 백업/복구 전략 단순화

### Phase 2 확장 경로
- Redis 캐싱 추가 (트래픽 증가 시)
- Read Replica (조회 성능 향상)
- Multi-AZ (고가용성)

---

**이 문서는 `docs/review/architecture-review.md` 권장사항을 반영한 설계입니다.**
