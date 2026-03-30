# 데이터베이스 ERD (Entity Relationship Diagram)

> **데이터베이스 스키마 시각화**
> 테이블 간 관계, 외래키, 인덱스를 명확히 표현

**작성일**: 2026-01-07
**우선순위**: 🔴 **CRITICAL**
**근거**: 개발 시작 전 필수 점검 보고서

---

## 1. ERD 다이어그램

### 1.1 dbdiagram.io 코드

아래 코드를 [dbdiagram.io](https://dbdiagram.io)에 붙여넣으면 시각화됩니다.

```dbml
// 포트폴리오 포털 데이터베이스 ERD
// Project: Portfolio Portal (Independent Services Architecture)
// Database: 서비스별 물리 분리
//   - portal-db (PostgreSQL 15, :5432) — 섹션 1, 2
//   - ai-bench-db (TimescaleDB + PG15, :5433) — 섹션 3, 4

// ==========================================
// 1. 사용자 및 인증 [portal-db]
// ==========================================

Table users {
  id bigserial [pk, increment]
  email varchar(255) [not null, unique]
  username varchar(100) [not null, unique]
  password varchar(255) [not null, note: 'BCrypt 해시']
  role varchar(20) [not null, default: 'USER', note: 'USER, ADMIN']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  deleted_at timestamp [null, note: 'Soft Delete']

  indexes {
    email [unique]
    username [unique]
    (role, created_at) [name: 'idx_users_role_created']
  }
}

Table refresh_tokens {
  id bigserial [pk, increment]
  user_id bigint [not null, ref: > users.id]
  token varchar(500) [not null, unique]
  token_family varchar(100) [not null, note: 'Rotation Family ID']
  expires_at timestamp [not null]
  revoked boolean [not null, default: false]
  revoked_at timestamp [null]
  created_at timestamp [not null, default: `now()`]

  indexes {
    (user_id, expires_at) [name: 'idx_refresh_tokens_user']
    token [unique, where: 'NOT revoked', name: 'idx_refresh_tokens_token_active']
    token_family [name: 'idx_refresh_tokens_family']
  }
}

Table oauth_accounts {
  id bigserial [pk, increment]
  user_id bigint [not null, ref: > users.id]
  provider varchar(20) [not null, note: 'GOOGLE, GITHUB, KAKAO']
  provider_id varchar(255) [not null]
  email varchar(255) [null]
  created_at timestamp [not null, default: `now()`]

  indexes {
    user_id [name: 'idx_oauth_user']
    (provider, provider_id) [unique, name: 'idx_oauth_provider']
  }
}

// ==========================================
// 2. 블로그 콘텐츠 [portal-db]
// ==========================================

Table categories {
  id bigserial [pk, increment]
  name varchar(100) [not null, unique]
  slug varchar(100) [not null, unique]
  description text [null]
  created_at timestamp [not null, default: `now()`]

  indexes {
    slug [unique]
  }
}

Table tags {
  id bigserial [pk, increment]
  name varchar(50) [not null, unique]
  slug varchar(50) [not null, unique]
  created_at timestamp [not null, default: `now()`]

  indexes {
    slug [unique]
  }
}

Table posts {
  id bigserial [pk, increment]
  author_id bigint [not null, ref: > users.id]
  category_id bigint [null, ref: > categories.id]
  title varchar(255) [not null]
  slug varchar(255) [not null, unique]
  content text [not null, note: 'Markdown 형식']
  excerpt varchar(200) [null, note: '요약문, 미제공 시 앱에서 자동 생성']
  status varchar(20) [not null, default: 'DRAFT', note: 'DRAFT, PUBLISHED, ARCHIVED']
  view_count int [not null, default: 0]
  like_count int [not null, default: 0]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  published_at timestamp [null]
  deleted_at timestamp [null, note: 'Soft Delete']

  indexes {
    (author_id, created_at) [name: 'idx_posts_author_created']
    (category_id, created_at) [name: 'idx_posts_category_created']
    (status, created_at) [where: 'deleted_at IS NULL', name: 'idx_posts_status_created']
    slug [unique, where: 'deleted_at IS NULL', name: 'idx_posts_slug']
    (view_count) [name: 'idx_posts_view_count']
  }
}

Table post_tags {
  post_id bigint [not null, ref: > posts.id]
  tag_id bigint [not null, ref: > tags.id]

  indexes {
    (post_id, tag_id) [pk]
    tag_id [name: 'idx_post_tags_tag']
  }
}

Table comments {
  id bigserial [pk, increment]
  post_id bigint [not null, ref: > posts.id]
  author_id bigint [not null, ref: > users.id]
  parent_id bigint [null, ref: > comments.id, note: '답글인 경우, 최대 2단계']
  content text [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  deleted_at timestamp [null, note: 'Soft Delete']

  indexes {
    (post_id, created_at) [where: 'deleted_at IS NULL', name: 'idx_comments_post_created']
    author_id [name: 'idx_comments_author']
    parent_id [name: 'idx_comments_parent']
  }
}

Table likes {
  user_id bigint [not null, ref: > users.id]
  post_id bigint [not null, ref: > posts.id]
  created_at timestamp [not null, default: `now()`]

  indexes {
    (user_id, post_id) [pk]
  }
  Note: '사용자당 게시글 1회 좋아요'
}

// ==========================================
// 2B. Service Registry [portal-db]
// ==========================================

Table service_registry {
  id bigserial [pk, increment]
  service_name varchar(100) [not null, unique]
  display_name varchar(200) [not null]
  base_url varchar(500) [not null]
  health_path varchar(200) [not null, default: '/health']
  summary_path varchar(200) [not null, default: '/api/summary']
  is_active boolean [not null, default: true]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table service_cache {
  id bigserial [pk, increment]
  service_name varchar(100) [not null, ref: > service_registry.service_name]
  status varchar(20) [not null, default: 'UNKNOWN', note: 'UP, DOWN, DEGRADED, UNKNOWN']
  summary_data jsonb [null, note: '/api/summary 응답 캐시']
  last_checked_at timestamp [not null, default: `now()`]
  response_time_ms int [null]
  error_message text [null]
  consecutive_failures int [not null, default: 0, note: '3회 연속 실패 시 is_active=false']
  created_at timestamp [not null, default: `now()`]

  indexes {
    (service_name, last_checked_at) [name: 'idx_service_cache_name']
  }
}

// ==========================================
// 3. AI 벤치마크 [ai-bench-db]
// ⚠️ 아래 테이블은 portal-db와 물리적으로 분리된 별도 DB
// ⚠️ portal-db 테이블과의 FK는 불가 (cross-DB reference)
// ==========================================

Table ai_models {
  id bigserial [pk, increment]
  name varchar(255) [not null, note: 'e.g., Llama 3.1 8B']
  slug varchar(255) [not null, unique]
  type varchar(50) [not null, note: 'LLM, Diffusion, etc.']
  quantization varchar(20) [null, note: 'Q4, Q5, F16, etc.']
  file_path varchar(500) [not null]
  file_size bigint [not null, note: 'bytes']
  created_at timestamp [not null, default: `now()`]

  indexes {
    slug [unique]
    type [name: 'idx_ai_models_type']
  }
}

Table benchmark_results {
  id bigserial [pk, increment]
  model_id bigint [not null, ref: > ai_models.id]
  user_id bigint [not null, note: 'portal-db users.id 참조 (FK 불가, 물리 분리)']
  prompt_tokens int [not null]
  generated_tokens int [not null]
  total_duration numeric(10,3) [not null, note: 'seconds']
  tokens_per_second numeric(8,2) [not null]
  first_token_latency numeric(8,3) [not null, note: 'TTFT in seconds']
  avg_gpu_utilization numeric(5,2) [null, note: 'percentage']
  max_memory_used bigint [null, note: 'MB']
  avg_temperature numeric(5,2) [null, note: 'celsius']
  created_at timestamp [not null, default: `now()`]

  indexes {
    (model_id, created_at) [name: 'idx_benchmark_model_created']
    (user_id, created_at) [name: 'idx_benchmark_user']
  }
}

// ==========================================
// 4. GPU 메트릭 (TimescaleDB Hypertable) [ai-bench-db]
// ==========================================

Table gpu_metrics {
  time timestamptz [not null, note: 'TimescaleDB 파티션 키, UTC 저장']
  benchmark_id bigint [not null, ref: > benchmark_results.id]
  gpu_utilization numeric(5,2) [null, note: '0.00 ~ 100.00%']
  memory_used bigint [null, note: 'MB']
  memory_total bigint [null, note: 'MB']
  temperature numeric(5,2) [null, note: 'celsius']
  power_draw numeric(7,2) [null, note: 'Watts']
  fan_speed numeric(5,2) [null, note: '0.00 ~ 100.00%']

  Note: '''
  TimescaleDB Hypertable — PK 없음 (time 기반 파티셔닝)
  - Partitioned by time (chunk_interval: 7 days)
  - Compression policy: after 30 days (segmentby: benchmark_id)
  - Retention policy: delete after 180 days
  '''

  indexes {
    (benchmark_id, time) [name: 'idx_gpu_metrics_benchmark']
  }
}

// ==========================================
// Relationships Summary
// ==========================================

// --- portal-db 내부 관계 (FK 유효) ---

// User relationships [portal-db]
Ref: posts.author_id > users.id [delete: cascade]
Ref: comments.author_id > users.id [delete: cascade]
Ref: likes.user_id > users.id [delete: cascade]
Ref: refresh_tokens.user_id > users.id [delete: cascade]
Ref: oauth_accounts.user_id > users.id [delete: cascade]

// Post relationships [portal-db]
Ref: posts.category_id > categories.id [delete: set null]
Ref: post_tags.post_id > posts.id [delete: cascade]
Ref: post_tags.tag_id > tags.id [delete: cascade]
Ref: comments.post_id > posts.id [delete: cascade]
Ref: likes.post_id > posts.id [delete: cascade]

// Comment relationships (self-referencing) [portal-db]
Ref: comments.parent_id > comments.id [delete: cascade]

// --- ai-bench-db 내부 관계 (FK 유효) ---

// Benchmark relationships [ai-bench-db]
Ref: benchmark_results.model_id > ai_models.id [delete: cascade]
Ref: gpu_metrics.benchmark_id > benchmark_results.id [delete: cascade]

// --- cross-DB 참조 (FK 불가, 애플리케이션 레벨 검증) ---
// benchmark_results.user_id → portal-db.users.id (물리 분리로 FK 불가)
```

---

## 2. 테이블 관계 요약

### 2.1 Core Entities

#### User (1:N) — portal-db
- **users** 1---* **posts** (author_id)
- **users** 1---* **comments** (author_id)
- **users** *---* **posts** (through likes, 좋아요)
- **users** 1---* **refresh_tokens** (user_id)
- **users** 1---* **oauth_accounts** (user_id)
- ⚠️ **users** ···* **benchmark_results** (user_id) — cross-DB 참조, FK 불가

#### Post (1:N, N:M)
- **posts** *---1 **categories** (category_id)
- **posts** *---* **tags** (through post_tags)
- **posts** 1---* **comments** (post_id)

#### Comment (Self-Referencing)
- **comments** *---1 **comments** (parent_id) - 답글 구조

#### Benchmark — ai-bench-db
- **benchmark_results** *---1 **ai_models** (model_id)
- **benchmark_results** 1---* **gpu_metrics** (benchmark_id)
- ⚠️ **benchmark_results**.user_id → **users**.id — cross-DB 참조 (FK 불가, 앱 레벨 검증)

---

## 3. 외래키 제약조건

### 3.1 Cascade Delete

**사용자 삭제 시** (portal-db):
- ✅ posts, comments, likes 삭제 (CASCADE)
- ✅ refresh_tokens, oauth_accounts 삭제 (CASCADE)
- ⚠️ ai-bench-db의 benchmark_results는 CASCADE 불가 (물리 분리) → 앱 레벨에서 처리

**게시글 삭제 시**:
- ✅ post_tags, comments, likes 삭제 (CASCADE)
- ⚠️ category는 유지 (SET NULL)

**댓글 삭제 시**:
- ✅ 하위 답글(parent_id) 모두 삭제 (CASCADE)

**벤치마크 삭제 시**:
- ✅ gpu_metrics 삭제 (CASCADE)

**AI 모델 삭제 시**:
- ✅ benchmark_results 삭제 (CASCADE)

---

## 4. 인덱스 전략

### 4.1 성능 최적화 인덱스

#### Posts 테이블 (조회 빈도 높음)
```sql
-- 작성자별 최신순 조회
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);

-- 카테고리별 최신순 조회
CREATE INDEX idx_posts_category_created ON posts(category_id, created_at DESC);

-- 상태별 최신순 조회 (삭제 안 된 것만)
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC)
WHERE deleted_at IS NULL;

-- Slug 조회 (URL 기반)
CREATE UNIQUE INDEX idx_posts_slug ON posts(slug)
WHERE deleted_at IS NULL;

-- 인기 게시글 정렬
CREATE INDEX idx_posts_view_count ON posts(view_count);
```

#### Comments 테이블
```sql
-- 게시글별 댓글 조회 (최신순)
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 답글 조회 (parent_id)
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

#### Refresh Tokens 테이블
```sql
-- 사용자별 토큰 조회
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at DESC);

-- 토큰 검증 (활성 토큰만)
CREATE UNIQUE INDEX idx_refresh_tokens_token_active ON refresh_tokens(token)
WHERE NOT revoked;

-- Token Family 전체 무효화 (재사용 감지)
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(token_family);
```

#### Benchmark 테이블
```sql
-- 모델별 최신 결과 조회
CREATE INDEX idx_benchmark_model_created ON benchmark_results(model_id, created_at DESC);

-- GPU 메트릭 시계열 조회
CREATE INDEX idx_gpu_metrics_benchmark ON gpu_metrics(benchmark_id, time DESC);
```

---

## 5. N+1 쿼리 방지 전략

### 5.1 JPA Fetch Join 필요 지점

#### Post 조회 시
```java
// ❌ N+1 발생
List<Post> posts = postRepository.findAll();
for (Post post : posts) {
    post.getAuthor().getUsername();  // N번 쿼리
    post.getCategory().getName();    // N번 쿼리
}

// ✅ Fetch Join 사용
@Query("SELECT p FROM Post p " +
       "LEFT JOIN FETCH p.author " +
       "LEFT JOIN FETCH p.category " +
       "WHERE p.deletedAt IS NULL")
List<Post> findAllWithDetails();
```

#### Comment 조회 시
```java
// ✅ 작성자 정보 포함
@Query("SELECT c FROM Comment c " +
       "LEFT JOIN FETCH c.author " +
       "WHERE c.post.id = :postId AND c.deletedAt IS NULL " +
       "ORDER BY c.createdAt ASC")
List<Comment> findByPostIdWithAuthor(@Param("postId") Long postId);
```

#### Benchmark 조회 시
```java
// ✅ 모델 정보 포함
@Query("SELECT b FROM BenchmarkResult b " +
       "LEFT JOIN FETCH b.model " +
       "LEFT JOIN FETCH b.user " +
       "WHERE b.model.id = :modelId " +
       "ORDER BY b.createdAt DESC")
List<BenchmarkResult> findByModelIdWithDetails(@Param("modelId") Long modelId);
```

---

## 6. TimescaleDB Hypertable 설정

### 6.1 gpu_metrics 테이블

```sql
-- Hypertable 생성
SELECT create_hypertable('gpu_metrics', 'time');

-- 파티션 확인
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'gpu_metrics';

-- 압축 정책 (30일 이후 데이터)
ALTER TABLE gpu_metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'benchmark_id'
);

SELECT add_compression_policy('gpu_metrics', INTERVAL '30 days');

-- 삭제 정책 (180일 이후 데이터)
SELECT add_retention_policy('gpu_metrics', INTERVAL '180 days');
```

### 6.2 시계열 쿼리 최적화

```sql
-- 최근 1시간 GPU 메트릭 조회
SELECT time_bucket('1 minute', time) AS bucket,
       AVG(gpu_utilization) AS avg_utilization,
       AVG(temperature) AS avg_temp
FROM gpu_metrics
WHERE benchmark_id = 123
  AND time > NOW() - INTERVAL '1 hour'
GROUP BY bucket
ORDER BY bucket DESC;
```

---

## 7. Soft Delete vs Hard Delete

### 7.1 Soft Delete 적용 (deleted_at 컬럼)
- ✅ **users**: 복구 가능성, 외래키 참조 유지
- ✅ **posts**: 복구 필요, SEO 이력 유지
- ✅ **comments**: 삭제 후 복구 가능

### 7.2 Hard Delete 적용
- ✅ **refresh_tokens**: 만료 후 자동 삭제 (보안)
- ✅ **gpu_metrics**: 180일 후 자동 삭제 (TimescaleDB Retention)
- ✅ **oauth_accounts**: 사용자 삭제 시 CASCADE

---

## 8. 데이터 타입 선택 이유

### 8.1 ID 타입: BIGSERIAL
- **이유**: INT (21억) 대신 BIGINT (922경) 사용
- **근거**: 게시글, 댓글, 메트릭 데이터 대량 축적 예상

### 8.2 Timestamp vs Timestamptz
- **Timestamp**: created_at, updated_at (서버 시간 기준)
- **Timestamptz**: gpu_metrics.time (TimescaleDB 요구사항, UTC 저장)

### 8.3 VARCHAR 길이
- **email**: 255 (RFC 5321 표준)
- **username**: 100 (일반적 사용자명 길이)
- **title**: 255 (SEO 최적 길이)
- **slug**: 255 (URL 길이 제한)

---

## 9. 마이그레이션 순서

### 9.1 Portal DB 마이그레이션 (Flyway)

```
V1__init_portal_schema.sql
  → users, categories, tags 생성 (독립 테이블)

V2__create_posts_tables.sql
  → posts, post_tags, comments, likes 생성 (외래키 의존)

V3__create_auth_tables.sql
  → refresh_tokens (token_family 포함), oauth_accounts 생성

V4__create_service_registry.sql
  → service_registry, service_cache 생성

V5__add_indexes.sql
  → Portal DB 성능 최적화 인덱���

V6__seed_data.sql
  → 관리자 계정 (admin@example.com / Admin123!)
  → 초기 카테고리 6개, 태그 10개
  ��� AI Benchmark 서비스 등록
```

### 9.2 AI Bench DB 마이그레이션 (Alembic)

```
001_init_ai_bench_schema.py
  → ai_models, benchmark_results 생성

002_create_gpu_metrics_hypertable.py
  → gpu_metrics + TimescaleDB Hypertable 변환

003_add_compression_policy.py
  → 자동 압축/삭제 정책 설정

004_add_indexes.py
  → AI Bench DB 성능 최적화 인덱스
```

---

## 10. JPA Entity 설계 예시

### 10.1 Post Entity

```java
@Entity
@Table(name = "posts")
@SQLDelete(sql = "UPDATE posts SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToMany
    @JoinTable(
        name = "post_tags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.DRAFT;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

---

## 11. ERD 시각화

### 11.1 주요 관계도

```
[portal-db :5432]
Users (중심)
  ├─> Posts (1:N, author)
  │     ├─> Comments (1:N)
  │     ├─> Categories (N:1)
  │     ├─> Tags (N:M via post_tags)
  │     └─> Likes (N:M via likes)
  │
  ├─> Comments (1:N)
  ├─> Likes (N:M with Posts)
  ├─> Refresh Tokens (1:N)
  ├─> OAuth Accounts (1:N)
  └ ⚠️ user_id 참조 ···> (cross-DB, FK 불가)

[ai-bench-db :5433]
AI Models
  └─> Benchmark Results (1:N)
        ├── user_id (portal users 참조, 앱 레벨 검증)
        └─> GPU Metrics (1:N, Hypertable)
```

---

## 12. 검증 체크리스트

개발 시작 전 확인:
- [ ] ERD를 dbdiagram.io에서 시각화 확인
- [ ] 모든 외래키 관계 이해
- [ ] N+1 쿼리 발생 지점 파악
- [ ] JPA Entity 연관관계 매핑 계획
- [ ] TimescaleDB Hypertable 설정 확인
- [ ] Soft Delete 적용 테이블 확인
- [ ] 인덱스 전략 검토

---

**이 ERD는 실제 개발의 기반이 됩니다.**
**JPA Entity 작성 시 이 문서를 반드시 참고하세요.**
**변경 사항 발생 시 ERD부터 업데이트하세요.**
