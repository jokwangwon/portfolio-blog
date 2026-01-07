# 3D 포트폴리오 블로그 아키텍처 검토 보고서

## Executive Summary

### 전체 평가: 4.2/5.0

이 프로젝트는 취업 포트폴리오로서 매우 잘 설계된 아키텍처를 가지고 있습니다. 특히 GB10 로컬 환경에서 시작해 AWS로 전환 가능한 이식성 설계가 인상적입니다.

### 주요 강점 3가지

1. **차별화된 기술 조합**: 3D UI + 로컬 LLM 벤치마크는 2026년 취업 시장에서 강력한 차별화 요소
2. **환경 이식성 설계**: Docker 기반 구성으로 GB10 → AWS 전환이 명확하게 설계됨
3. **현실적인 MSA 경험**: Spring Boot + FastAPI 분리로 멀티 언어 백엔드 경험 확보

### 주요 개선점 3가지

1. **과도한 기술 스택 복잡도**: PostgreSQL + TimescaleDB + Redis 3개 DB가 MVP에는 과도함
2. **모니터링/관찰성 누락**: 로깅, 메트릭, 에러 추적 전략이 명시되지 않음
3. **테스트 전략 부재**: 단위/통합/E2E 테스트 계획이 구체적이지 않음

### 핵심 권장사항

1. **Phase 1 단순화**: TimescaleDB를 PostgreSQL로 통합하여 초기 개발 속도 확보
2. **옵저버빌리티 추가**: 최소한 구조화된 로깅 + Sentry(에러 추적) 추가
3. **MVP 범위 축소**: 3D 기능을 간소화하고 블로그 + 벤치마크 핵심 기능에 집중
4. **문서화 우선**: API 문서(OpenAPI), 개발 환경 구축 가이드를 먼저 작성

---

## 1. 아키텍처 설계 검토

### 1.1 확장성 (4.0/5.0)

#### 현재 설계 분석

**강점**
- Docker Compose → ECS 전환 경로가 명확함
- Stateless JWT 인증으로 수평 확장 대비
- Redis 세션/캐시로 서버 증설 용이
- Frontend(Vercel) + Backend(ECS) 분리 가능

**문제점**
1. **단일 DB 연결**: Main API가 PostgreSQL 단일 인스턴스에 의존
   - Connection Pool 고갈 가능성
   - Read Replica 전략 부재
2. **AI API 병목**: GPU 인스턴스가 단일 장애점(SPOF)
   - 모델 로딩 시간(10~30초) 동안 요청 차단
   - LRU 캐시 최대 2개 모델만 유지
3. **파일 저장소 부재**: 이미지/3D 모델 파일을 어디에 저장할지 명시 안됨

#### 개선안

**Critical: DB Read Replica 준비**
```yaml
# Phase 2: AWS RDS 구성
Writer Endpoint (Master) ← Main API (CUD)
Reader Endpoint (Replica) ← Main API (조회 전용)
```
- JPA `@Transactional(readOnly = true)`는 Reader로 라우팅
- Spring의 `AbstractRoutingDataSource` 활용
- **장점**: 조회 쿼리 부하 분산, DB 장애 복구 시간 단축
- **단점**: 복제 지연(Replication Lag) 발생 가능 (보통 1초 이하)

**High: AI API 큐 시스템 도입**
```
Frontend → Main API → Redis Queue (Bull/Celery)
                           ↓
                      AI API Worker (2~3개)
```
- 벤치마크 요청을 큐에 적재, Worker가 순차 처리
- GPU 인스턴스 2개 운영 시 처리량 2배
- **장점**: 과부하 방지, 우아한 실패(Graceful Degradation)
- **단점**: 실시간 응답 불가 (폴링 필요), 인프라 복잡도 증가

**Medium: CDN + S3 정적 파일 전략**
```
/public/models/*.glb → S3 Bucket → CloudFront CDN
/uploads/images/*.jpg → S3 (Presigned URL)
```
- 3D 모델, 이미지는 S3 저장 → CloudFront 캐싱
- Main API는 메타데이터만 저장 (URL, 크기, 해시)
- **장점**: 전 세계 배포 속도 향상, 서버 부하 감소
- **단점**: S3 비용 발생 (GB당 $0.023), 개발 환경 설정 복잡

#### 구현 우선순위
- **Critical**: Read Replica 설계 (Phase 2 전환 시 필수)
- **High**: S3 전략 수립 (이미지 업로드 기능 전 필요)
- **Medium**: AI API 큐 시스템 (트래픽 증가 시 고려)

---

### 1.2 성능 (3.8/5.0)

#### 잠재적 병목 지점

**1. Frontend: 3D 렌더링 성능**

**문제점**
- React Three Fiber는 복잡한 씬(Scene)에서 FPS 저하 가능
- 모바일 디바이스에서 WebGL 지원/성능 제한
- 3D 모델 파일(.glb) 크기가 큰 경우 초기 로딩 지연

**측정 지표**
```javascript
// Performance 모니터링 필요
- FPS (60fps 목표)
- 3D 모델 로딩 시간 (< 2초)
- 인터랙션 응답 시간 (< 100ms)
```

**개선안**
```javascript
// 1. LOD (Level of Detail) 구현
<mesh>
  <meshStandardMaterial>
    {isMobile ? <LowPolyModel /> : <HighPolyModel />}
  </meshStandardMaterial>
</mesh>

// 2. Lazy Loading
import { Suspense } from 'react'
<Suspense fallback={<Loader />}>
  <Model3D url="/models/scene.glb" />
</Suspense>

// 3. 드레이코 압축 (파일 크기 50% 감소)
useGLTF.setDecoderPath('/draco/')
```

**우선순위**: Medium (3D 기능 본격 개발 시)

**2. Main API: N+1 쿼리 문제**

**문제점**
```java
// Post → Category, Tags, Comments 조회 시
// 포스트 1개당 3번의 추가 쿼리 발생
List<Post> posts = postRepository.findAll(); // 1번 쿼리
for (Post post : posts) {
    post.getCategory().getName();  // N번 쿼리
    post.getTags().size();         // N번 쿼리
}
```

**개선안**
```java
// EntityGraph 또는 QueryDSL Join Fetch
@EntityGraph(attributePaths = {"category", "tags", "author"})
List<Post> findAllWithDetails();

// QueryDSL
return queryFactory
    .selectFrom(post)
    .leftJoin(post.category, category).fetchJoin()
    .leftJoin(post.tags, tag).fetchJoin()
    .fetch();
```

**우선순위**: Critical (개발 초기부터 적용)

**3. AI API: 모델 로딩 시간**

**문제점**
- Llama 3.1 8B Q4 모델 로딩: 약 10~15초
- 첫 요청 시 로딩 → 사용자 대기 시간 발생
- LRU 캐시 eviction 시 재로딩 필요

**측정 결과 예상**
```
모델 로딩: 12초
첫 토큰 생성(TTFT): 0.2초
이후 토큰: 40 tokens/sec
→ 총 100토큰 생성: 12 + 0.2 + 2.5 = 14.7초
```

**개선안**
1. **Startup 시 Warmup**
```python
# core/lifespan.py
@app.on_event("startup")
async def warmup_models():
    # 자주 사용하는 모델 사전 로드
    await model_manager.load_model("llama-3.1-8b-q4")
    logger.info("Warmup completed")
```

2. **Lazy Loading UI**
```typescript
// Frontend에서 로딩 상태 표시
POST /api/v1/generate
→ Response: { status: "loading_model", eta: 12 }
   (2초 후) { status: "generating", progress: 10 }
   (완료)    { status: "completed", text: "..." }
```

**우선순위**: High (사용자 경험에 직접 영향)

**4. Database: 인덱스 전략**

**누락된 인덱스**
```sql
-- 조회 성능 저하 예상 쿼리
-- 1. 포스트 목록 (카테고리 + 최신순)
SELECT * FROM posts
WHERE category_id = ?
ORDER BY created_at DESC
LIMIT 20;

-- 2. 벤치마크 결과 (모델별 최신순)
SELECT * FROM benchmark_results
WHERE model_id = ?
ORDER BY created_at DESC;

-- 3. 태그 검색
SELECT p.* FROM posts p
JOIN post_tags pt ON p.id = pt.post_id
WHERE pt.tag_id IN (?, ?, ?);
```

**권장 인덱스**
```sql
-- Main API (PostgreSQL)
CREATE INDEX idx_posts_category_created ON posts(category_id, created_at DESC);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX idx_benchmark_model_created ON benchmark_results(model_id, created_at DESC);

-- AI API (TimescaleDB)
CREATE INDEX idx_gpu_metrics_benchmark ON gpu_metrics(benchmark_id, time DESC);
CREATE INDEX idx_inference_model_time ON inference_logs(model_id, time DESC);
```

**우선순위**: Critical (Depth 4 DB 스키마 설계 시 포함)

#### 성능 개선 로드맵

| 단계 | 항목 | 예상 개선 | 우선순위 |
|------|------|-----------|----------|
| Phase 1 | N+1 쿼리 방지 (EntityGraph) | 조회 속도 70% 개선 | Critical |
| Phase 1 | DB 인덱스 최적화 | 쿼리 속도 50% 개선 | Critical |
| Phase 1 | AI 모델 Warmup | 첫 요청 대기 시간 제거 | High |
| Phase 2 | Redis 캐싱 (포스트 목록) | 응답 시간 90% 감소 | High |
| Phase 2 | 3D 모델 LOD/압축 | 로딩 시간 60% 감소 | Medium |
| Phase 3 | CDN (S3 + CloudFront) | 정적 파일 전송 80% 개선 | Medium |

---

### 1.3 보안 (3.5/5.0)

#### 현재 보안 설계 분석

**강점**
- Spring Security + JWT Stateless 인증
- OAuth2 소셜 로그인 (Google, GitHub)
- CORS 설정 명시
- 환경 변수로 비밀값 관리

**취약점**

**1. JWT 보안 위험**

**문제점**
```java
// JWT Secret이 노출되면 모든 토큰 위조 가능
jwt:
  secret: ${JWT_SECRET}  // .env 파일 또는 환경변수
  access-token-expiration: 3600000   # 1시간
  refresh-token-expiration: 604800000 # 7일
```

- Refresh Token을 로컬스토리지에 저장하면 XSS 공격 위험
- Access Token 탈취 시 1시간 동안 악용 가능
- Logout 시 토큰 무효화 불가 (Stateless 특성)

**개선안**

**옵션 1: Refresh Token Rotation (권장)**
```java
// 1. Refresh Token을 HttpOnly Cookie에 저장 (XSS 방지)
// 2. 토큰 갱신 시마다 새 Refresh Token 발급
// 3. 사용된 Refresh Token은 Redis Blacklist에 추가

@PostMapping("/auth/refresh")
public TokenResponse refresh(
    @CookieValue("refresh_token") String refreshToken
) {
    // 1. 검증
    if (redisTemplate.hasKey("blacklist:" + refreshToken)) {
        throw new UnauthorizedException("Token already used");
    }

    // 2. 새 토큰 발급
    String newAccessToken = jwtProvider.createAccessToken(userId);
    String newRefreshToken = jwtProvider.createRefreshToken(userId);

    // 3. 기존 토큰 블랙리스트 등록 (7일 TTL)
    redisTemplate.opsForValue().set(
        "blacklist:" + refreshToken,
        "used",
        7,
        TimeUnit.DAYS
    );

    return new TokenResponse(newAccessToken, newRefreshToken);
}
```

**옵션 2: JWT + Redis Session 하이브리드**
```java
// Access Token에 session_id 포함
// Redis에 session_id : user_info 저장
// Logout 시 Redis에서 세션 삭제 → 즉시 무효화
```

**장단점 비교**
| 방식 | 장점 | 단점 | 권장도 |
|------|------|------|--------|
| Rotation | XSS 방지, Stateless 유지 | Blacklist 관리 필요 | High |
| 하이브리드 | 즉시 무효화 가능 | Redis 의존성 증가 | Medium |
| 현재 설계 | 단순함 | 보안 취약 | Low |

**우선순위**: High (Phase 1 완료 전 적용)

**2. API 인증/인가 누락**

**문제점**
```typescript
// Frontend에서 AI API 직접 호출 시
POST http://ai-api:8000/api/v1/generate
{
  "prompt": "malicious prompt",
  "model_id": "llama-3.1-8b-q4"
}
// → 인증 없이 GPU 리소스 사용 가능 (DDoS 가능)
```

**개선안**
```python
# AI API에 API Key 인증 추가
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.AI_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

@router.post("/generate")
async def generate(
    request: GenerateRequest,
    api_key: str = Depends(verify_api_key)
):
    # ...
```

**또는 Main API를 프록시로 활용**
```
Frontend → Main API (JWT 검증) → AI API (내부 통신)
```

**우선순위**: Critical (AI API 공개 시 필수)

**3. 입력 검증 부재**

**문제점**
```python
# AI API에서 프롬프트 길이 제한 없음
{
  "prompt": "A" * 100000,  # 10만 글자 → GPU 메모리 고갈
  "max_tokens": 999999
}
```

**개선안**
```python
# models/schemas/generate.py
from pydantic import BaseModel, Field, validator

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    model_id: str = Field(..., regex="^[a-z0-9-]+$")
    max_tokens: int = Field(default=512, ge=1, le=2048)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)

    @validator('prompt')
    def validate_prompt(cls, v):
        # 특수문자 제한, 금지어 필터링
        if any(word in v.lower() for word in BLACKLIST_WORDS):
            raise ValueError("Prompt contains prohibited content")
        return v
```

**우선순위**: Critical (개발 초기부터 적용)

**4. SQL Injection 방지**

**현재 상태**
- JPA/QueryDSL 사용 → Prepared Statement 자동 적용 (안전)
- 네이티브 쿼리 사용 시 위험

**권장사항**
```java
// ❌ 위험: 사용자 입력을 직접 SQL에 삽입
@Query(value = "SELECT * FROM posts WHERE title LIKE '%" + title + "%'", nativeQuery = true)
List<Post> searchByTitle(String title);

// ✅ 안전: 파라미터 바인딩
@Query(value = "SELECT * FROM posts WHERE title LIKE %:title%", nativeQuery = true)
List<Post> searchByTitle(@Param("title") String title);

// ✅ 더 좋음: QueryDSL 사용
return queryFactory
    .selectFrom(post)
    .where(post.title.contains(title))
    .fetch();
```

**우선순위**: Medium (코드 리뷰 시 체크리스트 포함)

**5. HTTPS/SSL 설정**

**Phase 1 (GB10 + Cloudflare Tunnel)**
- Cloudflare가 자동으로 SSL 제공 → 안전

**Phase 2 (AWS)**
```
CloudFront (SSL 종료) → ALB (HTTPS) → ECS (HTTP)
Route 53 (도메인) → ACM (인증서 발급)
```

**주의사항**
- 내부 통신(Main API ↔ AI API)은 HTTP 허용
- 외부 노출 엔드포인트는 반드시 HTTPS

**우선순위**: Critical (Phase 2 배포 시)

#### 보안 체크리스트

| 항목 | 현재 상태 | 권장 조치 | 우선순위 |
|------|-----------|-----------|----------|
| JWT Refresh Token 보안 | 미흡 | Rotation + HttpOnly Cookie | High |
| AI API 인증 | 없음 | API Key 또는 내부 전용 | Critical |
| 입력 검증 | 부분적 | Pydantic/Hibernate Validator 전면 적용 | Critical |
| SQL Injection | 안전 | QueryDSL 우선 사용 | Medium |
| CORS 설정 | 명시됨 | Whitelist 방식 유지 | Low |
| Rate Limiting | 없음 | Nginx 또는 Spring Cloud Gateway | High |
| HTTPS | Phase 2 필요 | ACM + CloudFront | Critical |
| 비밀값 관리 | 환경변수 | AWS Secrets Manager (Phase 2) | Medium |

---

### 1.4 유지보수성 (4.5/5.0)

#### 강점

**1. 모듈화 설계**
- Frontend: Feature Modules (auth, blog, benchmark 독립)
- Main API: Multi-Module Gradle (domain, security, module-*)
- AI API: 3계층 아키텍처 (routes, services, infrastructure)

**평가**: 매우 우수. 각 모듈이 명확한 책임을 가지고 독립적으로 테스트 가능

**2. 타입 안정성**
- Frontend: TypeScript + Zod 런타임 검증
- Main API: Java 강타입 + MapStruct DTO 매핑
- AI API: Pydantic 타입 검증

**평가**: 리팩토링 안전성 높음. IDE 자동완성 지원

**3. 의존성 방향 제어**
```
api-server → module-* → security → domain → common
(상위)                                        (하위)
```
- 순환 참조 방지
- 하위 모듈 재사용 가능

**평가**: 장기 유지보수에 유리

#### 개선 필요 사항

**1. 코드 중복 가능성**

**문제점**
```typescript
// Frontend: 각 모듈마다 유사한 API 호출 로직
// modules/blog/api/blogApi.ts
export const fetchPosts = async () => {
  return axios.get('/api/v1/posts');
};

// modules/benchmark/api/benchmarkApi.ts
export const fetchModels = async () => {
  return axios.get('/api/v1/models');
};
```

**개선안**
```typescript
// core/api/baseApi.ts
export const createApiClient = <T>(baseURL: string) => ({
  getList: () => axios.get<T[]>(baseURL),
  getById: (id: string) => axios.get<T>(`${baseURL}/${id}`),
  create: (data: T) => axios.post<T>(baseURL, data),
  update: (id: string, data: T) => axios.put<T>(`${baseURL}/${id}`, data),
  delete: (id: string) => axios.delete(`${baseURL}/${id}`),
});

// modules/blog/api/blogApi.ts
export const postApi = createApiClient<Post>('/api/v1/posts');
```

**우선순위**: Medium (개발 중기)

**2. 에러 처리 일관성**

**문제점**
```java
// 현재: 각 Service마다 다른 예외 처리
// module-blog/PostService.java
public Post getPost(Long id) {
    return postRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Post not found"));
}

// module-user/UserService.java
public User getUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
}
```

**개선안**
```java
// common/exception/EntityNotFoundException.java
public class EntityNotFoundException extends BusinessException {
    public EntityNotFoundException(String entityName, Object id) {
        super(ErrorCode.ENTITY_NOT_FOUND,
              String.format("%s not found: %s", entityName, id));
    }
}

// 사용
public Post getPost(Long id) {
    return postRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Post", id));
}
```

**우선순위**: High (개발 초기 표준화)

**3. 설정 파일 관리**

**문제점**
```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/blog_db
    username: postgres
    password: password123  # 하드코딩 위험

# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://prod-rds.amazonaws.com/blog_db
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

**개선안**
```yaml
# application.yml (공통)
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

# .env.dev (Git 제외)
DATABASE_URL=jdbc:postgresql://localhost:5432/blog_db
DB_USERNAME=postgres
DB_PASSWORD=dev_password

# .env.prod (AWS Secrets Manager)
DATABASE_URL=${ssm:/blog/database/url}
DB_USERNAME=${ssm:/blog/database/username}
DB_PASSWORD=${ssm:/blog/database/password}
```

**우선순위**: Critical (개발 초기부터 적용)

**4. 로깅 전략 부재**

**현재 상태**: 로깅 설정이 명시되지 않음

**권장 로깅 전략**
```xml
<!-- logback-spring.xml -->
<configuration>
  <!-- 개발 환경: Console + File -->
  <springProfile name="dev">
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
      </encoder>
    </appender>
    <root level="INFO">
      <appender-ref ref="CONSOLE" />
    </root>
  </springProfile>

  <!-- 프로덕션: JSON 구조화 로깅 (CloudWatch 연동) -->
  <springProfile name="prod">
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
      <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <includeMdc>true</includeMdc>
        <customFields>{"service":"main-api"}</customFields>
      </encoder>
    </appender>
    <root level="WARN">
      <appender-ref ref="JSON" />
    </root>
  </springProfile>
</configuration>
```

**로깅 레벨 전략**
| 레벨 | 용도 | 예시 |
|------|------|------|
| ERROR | 시스템 오류, 즉시 대응 필요 | DB 연결 실패, 외부 API 타임아웃 |
| WARN | 잠재적 문제, 모니터링 필요 | 캐시 미스율 높음, 느린 쿼리 |
| INFO | 중요 비즈니스 이벤트 | 사용자 로그인, 포스트 작성 |
| DEBUG | 개발 디버깅 정보 | SQL 쿼리, API 요청/응답 |
| TRACE | 상세 추적 정보 | 메서드 호출 스택 |

**우선순위**: High (Phase 1 완료 전)

**5. 문서화 부족**

**누락된 문서**
1. **개발 환경 구축 가이드** (README.md)
   - Docker Compose 실행 방법
   - 환경변수 설정
   - DB 마이그레이션

2. **API 문서**
   - Main API: SpringDoc OpenAPI 자동 생성
   - AI API: FastAPI `/docs` 자동 생성
   - 하지만 비즈니스 로직, 제약사항은 수동 작성 필요

3. **아키텍처 결정 기록(ADR)**
   ```markdown
   # ADR-001: 왜 Spring Boot와 FastAPI를 분리했는가?

   ## 상황
   블로그 기능과 AI 추론 기능을 하나의 서버로 구현 가능

   ## 결정
   Spring Boot(Main API) + FastAPI(AI API) 분리

   ## 이유
   1. AI 생태계(PyTorch)는 Python 중심
   2. 취업 포트폴리오에 멀티 언어 백엔드 경험 추가
   3. GPU 리소스 격리 (AI 서버만 별도 스케일링)

   ## 결과
   - 장점: 기술 스택 다양성, 독립 배포
   - 단점: 운영 복잡도 증가
   ```

**우선순위**: High (면접 대비 필수)

#### 유지보수성 개선 로드맵

| 단계 | 항목 | 예상 효과 | 우선순위 |
|------|------|-----------|----------|
| Phase 1 | 공통 에러 처리 표준화 | 디버깅 시간 50% 단축 | High |
| Phase 1 | 구조화된 로깅 도입 | 문제 추적 80% 개선 | High |
| Phase 1 | 환경변수 관리 통일 | 배포 오류 70% 감소 | Critical |
| Phase 2 | API 문서 자동화 | 온보딩 시간 60% 단축 | Medium |
| Phase 2 | ADR 문서 작성 | 기술 의사결정 명확화 | Medium |
| Phase 3 | 공통 유틸 함수 추출 | 코드 중복 40% 감소 | Low |

---

### 1.5 비용 (3.0/5.0)

#### AWS 전환 시 예상 월 비용 (2026년 기준)

**Phase 1: GB10 (현재)**
- **총 비용**: $0/월 (하드웨어 보유)
- Cloudflare Tunnel: 무료
- 도메인: $12/년 (~$1/월)

**Phase 2: AWS (트래픽 가정: DAU 100명, 월 3,000 PV)**

| 서비스 | 스펙 | 월 비용 | 비고 |
|--------|------|---------|------|
| **Frontend (Vercel)** | Hobby Plan | $0 | 100GB 대역폭 무료 |
| **Main API (ECS Fargate)** | 0.5 vCPU, 1GB RAM | $15 | 24/7 운영 |
| **AI API (EC2 g4dn.xlarge)** | 4 vCPU, 16GB RAM, T4 GPU | $0 | 주문형(요청 시만 실행)* |
| **RDS PostgreSQL** | db.t4g.micro (2 vCPU, 1GB) | $12 | 단일 AZ |
| **ElastiCache Redis** | cache.t4g.micro (2 vCPU, 0.5GB) | $11 | 단일 노드 |
| **S3 + CloudFront** | 10GB 저장, 50GB 전송 | $5 | 이미지/3D 모델 |
| **Route 53** | 호스팅 영역 1개 | $1 | 도메인 DNS |
| **CloudWatch Logs** | 5GB 로그 | $3 | 무료 티어 5GB |
| **데이터 전송** | 50GB 아웃바운드 | $5 | 무료 티어 100GB |
| **총 월 비용** | - | **$52** | - |

**AI API 비용 최적화 전략**
```
* EC2 GPU 인스턴스는 주문형 실행:
  - 벤치마크 요청 시만 Lambda로 EC2 Start
  - 추론 완료 후 5분 유휴 시 자동 Stop
  - 월 평균 가동 시간: 10시간 = $3.5

대안: AWS Lambda + SageMaker Serverless Inference
  - 추론당 과금 ($0.0001/초)
  - 콜드 스타트 10~20초 (모델 로딩)
  - 월 100회 추론 = $5
```

**비용 최적화 전략**

**1. Spot Instance 활용 (AI API)**
```bash
# g4dn.xlarge Spot 가격: $0.12/시간 (On-Demand 대비 70% 할인)
# 단, 인스턴스 회수 가능 → Stateless 설계 필수
```

**2. RDS Reserved Instance (1년 약정)**
```
db.t4g.micro: $12/월 → $7/월 (40% 할인)
```

**3. S3 Intelligent-Tiering**
```
30일 미접근 파일 → S3 Standard-IA (50% 저렴)
90일 미접근 파일 → Glacier (80% 저렴)
```

**4. CloudFront 무료 티어 극대화**
```
월 1TB 무료 전송 → 정적 파일은 모두 CDN 캐싱
Cache-Control: max-age=31536000 (1년)
```

**최적화 후 월 비용**
| 항목 | 최적화 전 | 최적화 후 | 절감 |
|------|-----------|-----------|------|
| AI API | $124 | $3.5 (Spot) | 97% |
| RDS | $12 | $7 (RI) | 42% |
| S3/CloudFront | $5 | $2 (Tiering) | 60% |
| **총합** | **$52** | **$32** | **38%** |

**연간 비용**: $384 (월 $32 × 12개월)

#### 비용 리스크

**1. 예상치 못한 비용 증가 요인**

| 위험 요소 | 발생 시나리오 | 예상 추가 비용 | 완화 방안 |
|-----------|---------------|----------------|----------|
| AI API 과도한 호출 | 봇/크롤러 공격 | +$500/월 | Rate Limiting, API Key 인증 |
| S3 스토리지 폭증 | 이미지 무제한 업로드 | +$50/월 | 사용자당 용량 제한 (100MB) |
| RDS IOPS 부족 | 트래픽 급증 | +$30/월 | Read Replica, Redis 캐싱 |
| CloudWatch Logs | 과도한 DEBUG 로깅 | +$20/월 | 프로덕션은 WARN 이상만 |

**2. 비용 알림 설정**
```bash
# AWS Budgets 설정 (무료)
aws budgets create-budget \
  --budget-name "monthly-limit" \
  --budget-limit Amount=50,Unit=USD \
  --notifications NotificationType=ACTUAL,Threshold=80
```

**우선순위**: Critical (Phase 2 전환 시 첫 설정)

#### 비용 대비 효과 분석

**투자 대비 가치**
- **월 $32**: 포트폴리오 프로젝트로 매우 합리적
- **대안 비교**:
  - Heroku Hobby Plan: $16/월 (GPU 미지원)
  - DigitalOcean Droplet: $24/월 (관리형 서비스 없음)
  - AWS 완전 관리형: $150/월 (과도)

**결론**: 현재 아키텍처는 비용 효율적이나, Spot Instance + Lambda 전환으로 추가 40% 절감 가능

---

## 2. 기술 스택 검토

### 2.1 Frontend (4.5/5.0)

#### 현재 기술 스택
```
Next.js 14+ (App Router)
React 18
TypeScript 5.x
React Three Fiber + @react-three/drei
Redux Toolkit + TanStack Query
TailwindCSS 3.x
Recharts 2.x
NextAuth.js 5.x
Zod 3.x
```

#### 강점

**1. Next.js App Router 선택**
- **SSR/SSG**: 블로그 포스트 검색 엔진 최적화 (SEO)
- **RSC(React Server Components)**: 서버에서 데이터 페칭 → 초기 로딩 속도 향상
- **레이아웃 공유**: `app/layout.tsx`로 중복 제거

**평가**: 2026년 취업 시장에서 Next.js는 필수 기술. 최신 App Router 사용은 큰 장점

**2. React Three Fiber 선택**
- **선언적 3D**: React 컴포넌트로 3D 씬 구성
- **풍부한 생태계**: drei(유틸), postprocessing(후처리), rapier(물리엔진)
- **차별화 요소**: 일반 블로그 대비 시각적 임팩트

**평가**: 3D 포트폴리오로서 강력한 차별화. 단, 구현 난이도 높음

**3. Redux Toolkit + TanStack Query 조합**
- **Redux**: 전역 상태 (인증, 테마) - 여러 모듈 공유
- **TanStack Query**: 서버 상태 - 캐싱, 자동 재검증

**평가**: 역할 분담 명확. 단, 학습 곡선 높음

#### 개선 제안

**1. Redux Toolkit이 과도한가?**

**현재 설계**
```typescript
// Redux: 인증, 테마
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null },
  // ...
});

// TanStack Query: 서버 데이터
const { data: posts } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts
});
```

**문제점**
- Redux는 전역 상태 관리가 필요한 경우에만 유용
- 현재 설계에서 Redux 사용처: 인증, 테마 (2개)
- 인증은 NextAuth.js가 자체 세션 관리 제공

**대안: Zustand (경량 상태 관리)**
```typescript
// zustand로 단순화
import create from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null })
}));

// 사용
const { user, setAuth } = useAuthStore();
```

**비교**
| 항목 | Redux Toolkit | Zustand | 권장 |
|------|---------------|---------|------|
| 번들 크기 | 12KB | 1KB | Zustand |
| 보일러플레이트 | 중간 | 매우 적음 | Zustand |
| DevTools | 우수 | 지원 | Redux |
| 학습 곡선 | 높음 | 낮음 | Zustand |
| 미들웨어 | 풍부 | 적음 | Redux |

**권장**: Zustand로 전환하여 복잡도 감소
**우선순위**: Medium (개발 초기라면 High)

**2. 3D 성능 최적화 라이브러리 추가**

```bash
npm install @react-three/fiber \
            @react-three/drei \
            @react-three/postprocessing \
            leva  # 3D 디버깅 GUI
```

**Leva를 활용한 실시간 조정**
```typescript
import { useControls } from 'leva';

function Scene3D() {
  const { position, rotation } = useControls({
    position: { value: [0, 0, 0], step: 0.1 },
    rotation: { value: [0, 0, 0], step: 0.1 }
  });

  return <mesh position={position} rotation={rotation}>...</mesh>;
}
```

**우선순위**: Medium (3D 개발 시 생산성 향상)

**3. 코드 스플리팅 최적화**

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

// 3D는 클라이언트 전용 + Lazy Loading
const Scene3D = dynamic(() => import('@/modules/three/components/Scene3D'), {
  ssr: false,  // 서버 사이드 렌더링 비활성화
  loading: () => <Skeleton />
});

export default function HomePage() {
  return (
    <Suspense fallback={<Loader />}>
      <Scene3D />
    </Suspense>
  );
}
```

**우선순위**: Critical (초기 로딩 속도에 직접 영향)

#### 최종 평가

**종합 점수**: 4.5/5.0

**강점**
- 최신 기술 스택 (2026년 취업 시장 적합)
- 타입 안정성 (TypeScript + Zod)
- 3D 차별화 요소

**개선점**
- Redux → Zustand 고려 (복잡도 감소)
- 3D 성능 최적화 도구 추가
- 코드 스플리팅 전략 명확화

---

### 2.2 Main API (4.0/5.0)

#### 현재 기술 스택
```
Java 17 LTS
Spring Boot 3.2.x
Spring Security 6.x
Spring Data JPA + QueryDSL
PostgreSQL 15+
Redis 7+
JWT (jjwt 0.12.x)
Lombok, MapStruct
SpringDoc OpenAPI 2.x
```

#### 강점

**1. Spring Boot 멀티 모듈**
```
api-server → module-* → security → domain → common
```
- **도메인 격리**: 블로그, 사용자, 벤치마크 로직 분리
- **재사용성**: 다른 프로젝트에서 domain, common 모듈 추출 가능
- **빌드 최적화**: 수정된 모듈만 재컴파일

**평가**: 포트폴리오로서 "엔터프라이즈급 설계" 어필 가능

**2. JPA + QueryDSL 조합**
- **JPA**: CRUD 자동 생성, 연관 관계 관리
- **QueryDSL**: 복잡한 동적 쿼리, 타입 안전

**평가**: 한국 기업 표준 기술 스택. 취업 시장 적합도 높음

**3. Spring Security + JWT**
- **Stateless 인증**: 세션 없이 JWT로 인증 → 수평 확장 용이
- **OAuth2 통합**: Google, GitHub 로그인 간소화

**평가**: 현업 표준 패턴

#### 개선 제안

**1. 멀티 모듈이 과도한가?**

**현재 설계**
```
api-server/
module-blog/
module-user/
module-benchmark/
module-project/  # 프로젝트 모듈 추가 가능
security/
domain/
common/
```

**문제점**
- **초기 개발 속도**: 모듈 간 의존성 설정 복잡
- **빌드 시간**: Gradle 멀티 모듈은 단일 모듈 대비 느림
- **과도한 추상화**: 포트폴리오 규모에서는 단일 모듈로 충분할 수도

**대안: 패키지 기반 모놀리스**
```
src/main/java/com/portfolio/blog/
  ├── domain/
  │   ├── post/
  │   │   ├── Post.java
  │   │   ├── PostRepository.java
  │   │   ├── PostService.java
  │   │   └── PostController.java
  │   ├── user/
  │   └── benchmark/
  ├── security/
  └── common/
```

**비교**
| 항목 | 멀티 모듈 | 패키지 모놀리스 | 권장 |
|------|-----------|-----------------|------|
| 초기 개발 속도 | 느림 | 빠름 | 모놀리스 |
| 모듈 재사용성 | 우수 | 낮음 | 멀티 |
| 포트폴리오 어필 | 강함 | 약함 | 멀티 |
| 빌드 시간 | 느림 | 빠름 | 모놀리스 |
| 운영 복잡도 | 높음 | 낮음 | 모놀리스 |

**권장**:
- **개발 속도 우선**: 패키지 모놀리스 → 나중에 모듈 분리
- **포트폴리오 어필 우선**: 멀티 모듈 유지

**의견**: 현재 멀티 모듈 설계가 포트폴리오로서 가치 있음. 유지 권장.

**우선순위**: Low (현재 설계 유지)

**2. MapStruct vs ModelMapper**

**현재 선택**: MapStruct

**대안 비교**
| 항목 | MapStruct | ModelMapper |
|------|-----------|-------------|
| 매핑 방식 | 컴파일 타임 코드 생성 | 런타임 리플렉션 |
| 성능 | 매우 빠름 (수동 코드와 동일) | 느림 (리플렉션 오버헤드) |
| 타입 안정성 | 컴파일 에러 발생 | 런타임 에러 발생 |
| 학습 곡선 | 중간 (인터페이스 작성) | 낮음 (자동 매핑) |

**평가**: MapStruct 선택 정확함

**우선순위**: N/A (현재 최선의 선택)

**3. 캐싱 전략 구체화**

**현재 설계**
```yaml
• 포스트 목록 (30분 TTL)
• 모델 메타데이터 (1시간 TTL)
• 벤치마크 결과 (무제한, 데이터 변경 시 무효화)
• 세션 (7일 TTL)
```

**구현 예시**
```java
@Service
public class PostService {

    @Cacheable(value = "posts", key = "'list:' + #page + ':' + #size")
    public Page<PostResponse> getPosts(int page, int size) {
        return postRepository.findAll(PageRequest.of(page, size))
            .map(PostMapper::toResponse);
    }

    @CacheEvict(value = "posts", allEntries = true)
    public PostResponse createPost(PostCreateRequest request) {
        // 포스트 생성 시 목록 캐시 무효화
        // ...
    }
}
```

**Redis 설정**
```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 1800000  # 30분 (밀리초)
      cache-null-values: false
  data:
    redis:
      host: localhost
      port: 6379
```

**우선순위**: High (Phase 1 성능 최적화)

**4. API 버저닝 전략**

**현재 엔드포인트**
```
/api/v1/posts
/api/v1/models
```

**향후 변경 시**
```
/api/v2/posts  (새 버전)
/api/v1/posts  (구 버전 유지)
```

**구현**
```java
@RestController
@RequestMapping("/api/v1/posts")
public class PostControllerV1 {
    // 기존 구현
}

@RestController
@RequestMapping("/api/v2/posts")
public class PostControllerV2 {
    // 새 구현 (예: 응답 형식 변경)
}
```

**우선순위**: Low (향후 확장 대비)

#### 최종 평가

**종합 점수**: 4.0/5.0

**강점**
- 한국 취업 시장 표준 기술 (Spring Boot, JPA)
- 멀티 모듈 설계로 엔터프라이즈 경험 어필
- 타입 안전 매핑 (MapStruct)

**개선점**
- 캐싱 전략 구체화 (코드 레벨)
- API 버저닝 고려
- N+1 쿼리 방지 체크리스트

---

### 2.3 AI API (4.3/5.0)

#### 현재 기술 스택
```
Python 3.11+
FastAPI 0.109+
Uvicorn 0.27+
Pydantic 2.x
llama-cpp-python 0.2.x
transformers 4.x
torch 2.x
pynvml 12.x
psycopg[binary,pool] 3.x (TimescaleDB)
redis[asyncio] 5.x
```

#### 강점

**1. llama.cpp + Transformers 이원화**

**전략**
- **llama.cpp (GGUF)**: 양자화 모델, CPU/GPU 하이브리드
- **transformers (Safetensors)**: HuggingFace 모델, GPU 전용

**평가**:
- **장점**: 다양한 모델 포맷 지원, VRAM 절약
- **포트폴리오 가치**: 여러 추론 엔진 경험 어필

**2. ModelManager 싱글톤 + LRU 캐싱**

```python
class ModelManager:
    _instances: Dict[str, BaseModelClient] = {}
    _lru_cache: OrderedDict = OrderedDict()
    _max_loaded = 2  # VRAM 제약
```

**평가**: 메모리 효율적 설계. VRAM 고갈 방지

**3. 3계층 아키텍처**
```
Routes (Controller) → Services (비즈니스 로직) → Infrastructure (외부 시스템)
```

**평가**: FastAPI 프로젝트 치고 매우 체계적. 유지보수성 우수

#### 개선 제안

**1. llama.cpp + Transformers 이원화가 복잡도를 높이는가?**

**현재 설계**
```python
# 2개 클라이언트 유지
LlamaCppClient    # GGUF 모델
TransformersClient  # Safetensors 모델
```

**문제점**
- 2개 클라이언트 코드 유지보수
- 모델 포맷별 다른 설정 필요
- 테스트 케이스 2배

**대안: llama.cpp로 통일**
```python
# llama.cpp는 GGUF만 지원하지만, 대부분 LLM이 GGUF로 변환 가능
# HuggingFace 모델 → llama.cpp 변환 스크립트 제공
python convert-hf-to-gguf.py --model gpt2-medium --outfile gpt2.gguf
```

**비교**
| 항목 | 이원화 (현재) | llama.cpp 단일화 |
|------|---------------|------------------|
| 지원 모델 범위 | 넓음 | 넓음 (변환 필요) |
| 코드 복잡도 | 높음 | 낮음 |
| 포트폴리오 어필 | 강함 | 약함 |
| 유지보수 | 어려움 | 쉬움 |

**권장**:
- **MVP**: llama.cpp로 단일화 (개발 속도 우선)
- **확장**: 특정 모델 필요 시 Transformers 추가

**우선순위**: Medium (개발 중기 재검토)

**2. GPU 메트릭 수집 간격**

**현재 설계**: 100ms 간격

**문제점**
```python
# 10분 벤치마크 → 6,000개 메트릭 레코드 생성
# TimescaleDB 삽입 부하
for _ in range(600):  # 10분 = 600초
    for _ in range(10):  # 초당 10회
        gpu_metrics.append(monitor.get_current_metrics())
```

**개선안**
```python
# 1. 메트릭 수집: 100ms 간격 (정밀도 유지)
# 2. DB 저장: 1초 간격 평균값만 저장 (부하 감소)

metrics_buffer = []

async def collect_metrics():
    while True:
        metrics = gpu_monitor.get_current_metrics()
        metrics_buffer.append(metrics)
        await asyncio.sleep(0.1)  # 100ms

async def save_aggregated_metrics():
    while True:
        await asyncio.sleep(1)  # 1초마다
        if metrics_buffer:
            avg_metrics = aggregate(metrics_buffer)
            await timescale.insert_gpu_metrics(avg_metrics)
            metrics_buffer.clear()
```

**우선순위**: Medium (TimescaleDB 부하 모니터링 후 결정)

**3. Transformers 모델 로딩 최적화**

**문제점**
```python
# Transformers는 매번 디스크에서 모델 로드 (10~15초)
model = AutoModelForCausalLM.from_pretrained("gpt2-medium")
```

**개선안**
```python
# 1. 모델 로컬 캐싱
model = AutoModelForCausalLM.from_pretrained(
    "gpt2-medium",
    cache_dir="/models/cache",  # 디스크 캐싱
    local_files_only=True       # 네트워크 요청 방지
)

# 2. Mixed Precision (VRAM 절약 + 속도 향상)
model = AutoModelForCausalLM.from_pretrained(
    "gpt2-medium",
    torch_dtype=torch.float16,  # FP32 → FP16 (50% 메모리 절약)
    device_map="auto"           # GPU 자동 할당
)
```

**우선순위**: High (사용자 경험 직접 영향)

**4. 벤치마크 결과 검증**

**누락 항목**
```python
# 현재: 벤치마크 결과만 저장
# 필요: 재현 가능성 검증

class BenchmarkResult(BaseModel):
    benchmark_id: str
    model_id: str
    avg_tokens_per_second: float
    # ... 추가 필요
    environment: BenchmarkEnvironment  # 환경 정보

class BenchmarkEnvironment(BaseModel):
    gpu_name: str           # "NVIDIA RTX 4080"
    driver_version: str     # "535.129.03"
    cuda_version: str       # "12.2"
    system_info: dict       # OS, CPU, RAM
    llama_cpp_version: str  # "0.2.20"
```

**우선순위**: Medium (벤치마크 신뢰성 향상)

#### 최종 평가

**종합 점수**: 4.3/5.0

**강점**
- 체계적인 3계층 아키텍처
- 메모리 효율적 모델 관리 (LRU 캐싱)
- 비동기 처리 (FastAPI + asyncio)

**개선점**
- llama.cpp 단일화 고려 (복잡도 감소)
- GPU 메트릭 집계 최적화
- 벤치마크 재현성 강화

---

### 2.4 Database (3.5/5.0)

#### 현재 설계
```
PostgreSQL 15+  ← Main API (posts, users, comments, categories, tags, models, benchmark_results)
TimescaleDB     ← AI API (gpu_metrics, inference_logs, benchmark_history)
Redis 7+        ← 공용 (session, cache, metrics buffer)
```

#### 강점

**1. DB 역할 분담 명확**
- **PostgreSQL**: 정형 데이터, 관계형
- **TimescaleDB**: 시계열 데이터 (GPU 메트릭)
- **Redis**: 캐시, 세션

**2. TimescaleDB 선택 이유**
- GPU 메트릭은 100ms 간격 수집 → 대량 시계열 데이터
- 자동 파티셔닝, 압축
- PostgreSQL 호환 (SQL 재사용)

#### 문제점

**1. 3개 DB가 MVP에 과도한가?**

**현재 데이터 구조**
```sql
-- PostgreSQL
posts (100개)
users (10개)
comments (50개)
models (20개)  ← 모델 메타데이터
benchmark_results (50개)

-- TimescaleDB
gpu_metrics (600,000개)  ← 10분 벤치마크 × 10회 × 6,000 레코드
inference_logs (100개)
```

**문제점**
- **초기 개발**: 3개 DB 설정/유지보수 부담
- **로컬 환경**: Docker Compose에 3개 컨테이너 필요
- **데이터 조인**: PostgreSQL ↔ TimescaleDB 조인 불가 (Foreign Data Wrapper 필요)

**대안 1: PostgreSQL로 통합 (단순화)**
```sql
-- PostgreSQL에 TimescaleDB 확장 설치
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Hypertable 생성
SELECT create_hypertable('gpu_metrics', 'time');
```

**장점**
- 단일 DB 관리
- 조인 쿼리 가능
- 로컬 개발 간소화

**단점**
- TimescaleDB 특화 기능 일부 사용 불가 (연속 집계 등)
- 하지만 MVP에서는 불필요

**대안 2: 현재 구조 유지 (확장성)**
- Phase 1: PostgreSQL + TimescaleDB 분리 (Docker Compose)
- Phase 2: AWS RDS (PostgreSQL) + EC2 (TimescaleDB)

**비교**
| 항목 | 통합 (PostgreSQL) | 분리 (현재) |
|------|-------------------|-------------|
| 초기 복잡도 | 낮음 | 높음 |
| 운영 부담 | 낮음 | 높음 |
| 확장성 | 중간 | 높음 |
| 포트폴리오 어필 | 약함 | 강함 |

**권장**:
- **MVP 우선**: PostgreSQL 통합 (TimescaleDB 확장 사용)
- **포트폴리오 우선**: 현재 구조 유지

**우선순위**: High (개발 초기 결정 필요)

**2. Redis 사용처가 명확한가?**

**현재 계획**
```
1. 세션 (JWT Refresh Token Blacklist)
2. API 응답 캐시 (포스트 목록)
3. 실시간 메트릭 버퍼 (GPU 메트릭)
```

**문제점**
- **세션**: JWT Stateless인데 Redis 필요? → Refresh Token Rotation에만 필요
- **캐시**: 초기 트래픽 낮을 때는 불필요
- **메트릭 버퍼**: 메모리 버퍼로 대체 가능

**대안: Redis 도입 시점 지연**
```
Phase 1 (MVP): Redis 없이 시작
  - JWT 검증만 (Blacklist 없음)
  - 캐시 없음

Phase 2 (트래픽 증가): Redis 추가
  - 포스트 목록 캐싱
  - Refresh Token Rotation
```

**권장**: Phase 1에서는 Redis 제외, 필요 시 추가

**우선순위**: Medium (Phase 1 단순화)

**3. DB 스키마 정규화**

**현재 설계 검토 필요**
```sql
-- posts 테이블
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    category_id BIGINT,  -- 1:N
    author_id BIGINT,    -- 1:N
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- post_tags 중간 테이블 (N:M)
CREATE TABLE post_tags (
    post_id BIGINT,
    tag_id BIGINT,
    PRIMARY KEY (post_id, tag_id)
);
```

**추가 필요 컬럼**
```sql
ALTER TABLE posts ADD COLUMN status VARCHAR(20);  -- 'DRAFT', 'PUBLISHED', 'DELETED'
ALTER TABLE posts ADD COLUMN view_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN slug VARCHAR(255) UNIQUE;  -- SEO URL
```

**우선순위**: Critical (Depth 4 ERD 설계 시 포함)

#### 최종 평가

**종합 점수**: 3.5/5.0

**강점**
- 역할 분담 명확 (정형/시계열/캐시)
- TimescaleDB로 GPU 메트릭 최적화

**개선점**
- MVP에서는 PostgreSQL 통합 권장 (복잡도 감소)
- Redis 도입 시점 지연 고려
- DB 스키마 정규화 필요

---

## 3. 누락된 요소

### 3.1 모니터링 및 로깅 (Critical)

#### 현재 상태
- 로깅 전략 명시 없음
- 메트릭 수집 전략 없음 (GPU 메트릭 제외)
- 에러 추적 도구 없음

#### 권장 솔루션

**1. 구조화된 로깅**

**Main API (Spring Boot)**
```xml
<!-- logback-spring.xml -->
<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdc>true</includeMdc>
      <customFields>{"service":"main-api"}</customFields>
    </encoder>
  </appender>
</configuration>
```

**AI API (FastAPI)**
```python
import logging
import json
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# 사용
logger.info("Model loaded", extra={
    "model_id": "llama-3.1-8b",
    "load_time_ms": 12500
})
```

**2. 메트릭 수집 (Prometheus)**

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
```

**Main API 메트릭**
```java
// build.gradle
implementation 'io.micrometer:micrometer-registry-prometheus'

// application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

**AI API 메트릭**
```python
# requirements.txt
prometheus-client

# main.py
from prometheus_client import Counter, Histogram, make_asgi_app

# 메트릭 정의
inference_requests = Counter('inference_requests_total', 'Total inference requests')
inference_duration = Histogram('inference_duration_seconds', 'Inference duration')

# FastAPI에 /metrics 엔드포인트 추가
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

**3. 에러 추적 (Sentry)**

```typescript
// Frontend (Next.js)
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

```java
// Main API (Spring Boot)
// build.gradle
implementation 'io.sentry:sentry-spring-boot-starter:6.x'

// application.yml
sentry:
  dsn: ${SENTRY_DSN}
  traces-sample-rate: 0.1
```

```python
# AI API (FastAPI)
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=0.1,
    environment=os.getenv("ENVIRONMENT", "dev"),
)
```

**4. 헬스체크 엔드포인트**

```java
// Main API
@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP",
            "service", "main-api",
            "version", "1.0.0"
        );
    }

    @GetMapping("/health/db")
    public Map<String, String> dbHealth() {
        // PostgreSQL 연결 체크
    }
}
```

```python
# AI API
@router.get("/health")
async def health():
    return {
        "status": "UP",
        "service": "ai-api",
        "gpu_available": torch.cuda.is_available(),
        "loaded_models": len(model_manager._instances)
    }
```

**우선순위**:
- Critical: 구조화된 로깅 (Phase 1 필수)
- High: Sentry 에러 추적 (Phase 1 권장)
- Medium: Prometheus/Grafana (Phase 2)

---

### 3.2 테스트 전략 (High)

#### 현재 상태
- 테스트 코드 없음
- 테스트 전략 명시 없음

#### 권장 테스트 전략

**1. Frontend (Next.js)**

```typescript
// __tests__/modules/blog/PostCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/modules/blog/components/PostCard';

describe('PostCard', () => {
  it('renders post title', () => {
    const post = { id: 1, title: 'Test Post', content: '...' };
    render(<PostCard post={post} />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });
});
```

**테스트 도구**
- Jest + React Testing Library (컴포넌트)
- Playwright (E2E)

**2. Main API (Spring Boot)**

```java
// module-blog/src/test/java/.../PostServiceTest.java
@SpringBootTest
class PostServiceTest {

    @Autowired
    private PostService postService;

    @MockBean
    private PostRepository postRepository;

    @Test
    void getPost_Success() {
        // Given
        Post post = new Post(1L, "Title", "Content");
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        // When
        PostResponse result = postService.getPost(1L);

        // Then
        assertThat(result.getTitle()).isEqualTo("Title");
    }
}
```

**테스트 도구**
- JUnit 5 (단위 테스트)
- MockMvc (컨트롤러 테스트)
- Testcontainers (통합 테스트 - 실제 PostgreSQL)

**3. AI API (FastAPI)**

```python
# tests/unit/test_model_manager.py
import pytest
from infrastructure.llm.model_manager import ModelManager

@pytest.mark.asyncio
async def test_load_model():
    manager = ModelManager()
    client = await manager.load_model("llama-3.1-8b-q4")
    assert client is not None
    assert "llama-3.1-8b-q4" in manager._instances
```

**테스트 도구**
- pytest (단위 테스트)
- pytest-asyncio (비동기 테스트)
- httpx (API 테스트)

**4. 테스트 커버리지 목표**

| 레이어 | 목표 커버리지 | 우선순위 |
|--------|---------------|----------|
| Domain (Entity, Repository) | 80% | Critical |
| Service (비즈니스 로직) | 70% | High |
| Controller | 60% | Medium |
| 유틸리티 함수 | 90% | High |

**우선순위**: High (Phase 1 완료 전 핵심 로직 테스트)

---

### 3.3 CI/CD 파이프라인 상세 (High)

#### 현재 상태
- GitHub Actions 사용 계획만 명시
- 파이프라인 상세 설계 없음

#### 권장 CI/CD 전략

**1. GitHub Actions 워크플로우**

```yaml
# .github/workflows/main-api-ci.yml
name: Main API CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'main-api/**'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Cache Gradle packages
        uses: actions/cache@v3
        with:
          path: ~/.gradle/caches
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*') }}

      - name: Run tests
        run: ./gradlew test
        working-directory: main-api

      - name: Build
        run: ./gradlew build
        working-directory: main-api

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t main-api:latest main-api

      - name: Push to ECR
        # AWS ECR 푸시 로직
```

**2. 배포 전략**

**Phase 1: GB10 (Dev)**
```yaml
# .github/workflows/deploy-dev.yml
name: Deploy to GB10

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.GB10_HOST }}
          username: ${{ secrets.GB10_USER }}
          key: ${{ secrets.GB10_SSH_KEY }}
          script: |
            cd ~/blog-project
            git pull origin develop
            docker-compose down
            docker-compose up -d --build
```

**Phase 2: AWS (Prod)**
```yaml
# .github/workflows/deploy-prod.yml
name: Deploy to AWS

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-2

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push
        run: |
          docker build -t $ECR_REGISTRY/main-api:$GITHUB_SHA main-api
          docker push $ECR_REGISTRY/main-api:$GITHUB_SHA

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster blog-cluster \
            --service main-api \
            --force-new-deployment
```

**3. 환경 분리**

| 환경 | 브랜치 | 배포 트리거 | 인프라 |
|------|--------|-------------|--------|
| Development | develop | Push | GB10 Docker Compose |
| Staging | staging | PR → main | AWS ECS (작은 인스턴스) |
| Production | main | Tag (v1.0.0) | AWS ECS (프로덕션) |

**우선순위**:
- Critical: 기본 CI (테스트, 빌드)
- High: CD to GB10 (Phase 1)
- Medium: CD to AWS (Phase 2)

---

### 3.4 API 문서화 (Medium)

#### 현재 상태
- SpringDoc OpenAPI (자동 생성)
- FastAPI `/docs` (자동 생성)
- 하지만 비즈니스 로직, 제약사항은 수동 작성 필요

#### 권장 문서화 전략

**1. OpenAPI 주석 강화**

```java
// Main API
@Operation(
    summary = "포스트 조회",
    description = "포스트 ID로 상세 정보를 조회합니다. 비공개 포스트는 작성자만 조회 가능합니다.",
    responses = {
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "포스트를 찾을 수 없음"),
        @ApiResponse(responseCode = "403", description = "권한 없음 (비공개 포스트)")
    }
)
@GetMapping("/{id}")
public ApiResponse<PostResponse> getPost(
    @Parameter(description = "포스트 ID", required = true)
    @PathVariable Long id
) {
    return ApiResponse.success(postService.getPost(id));
}
```

```python
# AI API
@router.post(
    "/generate",
    summary="텍스트 생성",
    description="""
    AI 모델로 텍스트를 생성합니다.

    **제약사항**:
    - 프롬프트 최대 길이: 4000자
    - max_tokens 범위: 1~2048
    - 모델 로딩 시간: 10~15초 (첫 요청 시)

    **응답 시간**:
    - 모델 로딩: ~12초
    - 첫 토큰 생성: ~0.2초
    - 이후 토큰: ~40 tokens/sec
    """,
    response_model=GenerateResponse,
    responses={
        200: {"description": "생성 성공"},
        400: {"description": "잘못된 요청 (프롬프트 길이 초과 등)"},
        507: {"description": "GPU 메모리 부족"}
    }
)
async def generate_text(request: GenerateRequest):
    # ...
```

**2. Postman 컬렉션 자동 생성**

```bash
# OpenAPI 스펙 → Postman 컬렉션
npx openapi-to-postmanv2 \
  -s http://localhost:8080/v3/api-docs \
  -o main-api.postman_collection.json
```

**3. README 문서 구조**

```markdown
# 3D 포트폴리오 블로그

## 개발 환경 구축

### 1. 사전 요구사항
- Docker 20.x+
- Node.js 18+
- Java 17
- Python 3.11+

### 2. 환경변수 설정
\```bash
cp .env.example .env
# .env 파일 편집 (DB 비밀번호 등)
\```

### 3. 실행
\```bash
docker-compose up -d
\```

### 4. 접속
- Frontend: http://localhost:3000
- Main API: http://localhost:8080
- AI API: http://localhost:8000
- API Docs: http://localhost:8080/swagger-ui.html

## 아키텍처
![Architecture Diagram](./docs/architecture.png)

## API 문서
- [Main API 문서](http://localhost:8080/swagger-ui.html)
- [AI API 문서](http://localhost:8000/docs)
```

**우선순위**: Medium (개발 중기, 협업 또는 취업 지원 시 필요)

---

### 3.5 백업 및 재해 복구 (Low)

#### 권장 전략

**1. DB 백업**

```bash
# PostgreSQL 자동 백업 (daily)
# docker-compose.yml
services:
  db-backup:
    image: postgres:15
    volumes:
      - ./backups:/backups
    command: >
      sh -c "
      pg_dump -h postgres -U postgres blog_db > /backups/backup_$(date +%Y%m%d).sql
      find /backups -name '*.sql' -mtime +7 -delete
      "
    depends_on:
      - postgres
```

**AWS 백업**
- RDS 자동 백업 (7일 보관)
- S3 업로드 파일 버저닝 활성화

**2. 재해 복구 계획**

| 시나리오 | 복구 시간 목표 (RTO) | 복구 시점 목표 (RPO) |
|----------|----------------------|----------------------|
| DB 장애 | 1시간 | 1일 (일일 백업) |
| 전체 서버 장애 | 4시간 | 1일 |
| 코드 롤백 | 10분 | 최신 커밋 |

**우선순위**: Low (Phase 2 운영 안정화 후)

---

### 3.6 검색 기능 (Low)

#### 현재 상태
- PostgreSQL Full-Text Search 가능
- Elasticsearch 언급 없음

#### 권장 전략

**Phase 1: PostgreSQL Full-Text Search**
```sql
-- 포스트 제목/내용 검색
SELECT * FROM posts
WHERE to_tsvector('korean', title || ' ' || content)
      @@ to_tsquery('korean', 'React');

-- 인덱스 생성
CREATE INDEX idx_posts_fulltext ON posts
USING GIN (to_tsvector('korean', title || ' ' || content));
```

**Phase 2: Elasticsearch (트래픽 증가 시)**
- 고급 검색 (자동완성, 오타 교정)
- 벤치마크 결과 복합 검색

**우선순위**: Low (MVP에서는 PostgreSQL로 충분)

---

## 4. 개선안 우선순위

### Critical (즉시 반영 필요)

| 항목 | 현재 문제 | 개선안 | 예상 효과 |
|------|-----------|--------|-----------|
| **환경변수 관리 통일** | 하드코딩 위험 | 모든 설정을 환경변수로 | 보안 강화, 배포 오류 70% 감소 |
| **N+1 쿼리 방지** | 조회 성능 저하 | EntityGraph, QueryDSL | 조회 속도 70% 개선 |
| **DB 인덱스 설계** | 쿼리 속도 느림 | 주요 쿼리 인덱스 추가 | 쿼리 속도 50% 개선 |
| **입력 검증 강화** | 보안 취약 | Pydantic/Hibernate Validator | 공격 방지, 안정성 향상 |
| **AI API 인증** | 무제한 GPU 사용 가능 | API Key 인증 | DDoS 방지 |
| **구조화된 로깅** | 디버깅 어려움 | JSON 로깅 (Logstash) | 문제 추적 80% 개선 |

### High (Phase 1 완료 전 반영)

| 항목 | 현재 문제 | 개선안 | 예상 효과 |
|------|-----------|--------|-----------|
| **JWT Refresh Token 보안** | XSS 위험 | Rotation + HttpOnly Cookie | 보안 강화 |
| **Redis 캐싱 구현** | 응답 속도 느림 | 포스트 목록 캐싱 (30분 TTL) | 응답 시간 90% 감소 |
| **AI 모델 Warmup** | 첫 요청 대기 시간 | Startup 시 자동 로드 | 사용자 경험 개선 |
| **코드 스플리팅** | 초기 로딩 느림 | 3D 모듈 Lazy Loading | 로딩 시간 60% 감소 |
| **에러 추적 (Sentry)** | 프로덕션 에러 추적 어려움 | Sentry 연동 | 에러 발견 속도 10배 개선 |
| **테스트 코드 작성** | 리팩토링 위험 | 핵심 로직 70% 커버리지 | 안정성 향상 |
| **CI/CD 파이프라인** | 수동 배포 | GitHub Actions 자동화 | 배포 시간 80% 단축 |

### Medium (Phase 2에서 고려)

| 항목 | 현재 문제 | 개선안 | 예상 효과 |
|------|-----------|--------|-----------|
| **DB Read Replica** | 조회 쿼리 부하 | RDS Reader 엔드포인트 | 부하 분산 50% |
| **S3 + CDN 전략** | 정적 파일 서버 부하 | CloudFront 캐싱 | 전송 속도 80% 개선 |
| **3D 성능 최적화** | 모바일 FPS 저하 | LOD, 드레이코 압축 | 로딩 시간 50% 감소 |
| **Prometheus/Grafana** | 메트릭 시각화 부족 | 대시보드 구축 | 운영 가시성 향상 |
| **API 문서화 강화** | 온보딩 시간 오래 걸림 | OpenAPI 주석, README | 온보딩 60% 단축 |
| **Redux → Zustand** | 코드 복잡도 높음 | 경량 상태 관리 | 번들 크기 10KB 감소 |

### Low (향후 검토)

| 항목 | 현재 문제 | 개선안 | 예상 효과 |
|------|-----------|--------|-----------|
| **Elasticsearch** | 검색 기능 제한적 | 전문 검색 엔진 도입 | 검색 품질 향상 |
| **AI API 큐 시스템** | GPU 과부하 가능 | Redis Queue (Bull) | 안정성 향상 |
| **백업 자동화** | 재해 복구 불가 | 일일 백업 스크립트 | 데이터 보호 |
| **DB 통합 (PostgreSQL)** | 3개 DB 관리 부담 | TimescaleDB 확장 사용 | 운영 복잡도 40% 감소 |

---

## 5. 추가 아이디어

### 5.1 차별화 요소 강화

#### 아이디어 1: 인터랙티브 AI 채팅봇 (블로그 도우미)

**개념**
```
블로그 오른쪽 하단에 AI 채팅 위젯
→ "이 블로그에서 React 관련 글 찾아줘"
→ 로컬 LLM이 포스트 검색 + 요약 제공
```

**기술 스택**
- Frontend: 채팅 UI (react-chat-widget)
- AI API: RAG (Retrieval-Augmented Generation)
  - 포스트 임베딩 (FAISS 벡터 DB)
  - 질문 → 관련 포스트 검색 → LLM 요약

**차별화 포인트**
- **로컬 LLM 활용**: OpenAI API 대신 GB10 모델 사용
- **RAG 경험**: 최신 AI 트렌드 (2026년 필수 기술)
- **포트폴리오 어필**: "로컬 LLM으로 구현한 지능형 블로그"

**구현 난이도**: High
**우선순위**: Medium (Phase 3, 차별화 강화 시)

---

#### 아이디어 2: 실시간 벤치마크 대시보드 (WebSocket)

**개념**
```
벤치마크 실행 중 실시간 GPU 메트릭 시각화
→ 온도, VRAM, 토큰 생성 속도를 실시간 그래프로 표시
```

**기술 스택**
- Frontend: Recharts + WebSocket
- AI API: WebSocket 엔드포인트
  - 100ms마다 GPU 메트릭 브로드캐스트

**구현**
```python
# AI API
from fastapi import WebSocket

@app.websocket("/ws/benchmark/{benchmark_id}")
async def benchmark_stream(websocket: WebSocket, benchmark_id: str):
    await websocket.accept()

    async def send_metrics():
        while True:
            metrics = gpu_monitor.get_current_metrics()
            await websocket.send_json(metrics.dict())
            await asyncio.sleep(0.1)

    task = asyncio.create_task(send_metrics())
    await task
```

```typescript
// Frontend
const socket = new WebSocket('ws://localhost:8000/ws/benchmark/abc123');
socket.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  setGpuMetrics(prev => [...prev, metrics]);
};
```

**차별화 포인트**
- 실시간 시각화 (대부분 블로그는 정적 데이터만)
- WebSocket 경험 어필

**구현 난이도**: Medium
**우선순위**: High (벤치마크 페이지 핵심 기능)

---

#### 아이디어 3: 3D 모델 에디터 (블로그 콘텐츠로 활용)

**개념**
```
GB10에서 3D 모델 학습 과정을 블로그 콘텐츠로 작성
→ 간단한 3D 모델 뷰어/에디터 구현
→ "AI로 3D 모델 생성하기" 시리즈
```

**기술 스택**
- React Three Fiber
- Stable Diffusion (2D 이미지 → 3D 모델 변환)

**차별화 포인트**
- GB10 GPU 활용 사례 확장
- 3D AI 콘텐츠 (희소성 높음)

**구현 난이도**: Very High
**우선순위**: Low (Phase 4, 여유 있을 때)

---

### 5.2 사용자 경험 개선

#### 아이디어 4: 다크 모드 + 테마 커스터마이징

**개념**
```
사용자가 블로그 색상 테마를 직접 설정
→ Primary Color, Background, Font 선택
→ 설정을 로컬스토리지에 저장
```

**구현**
```typescript
// TailwindCSS + CSS Variables
const themes = {
  light: { primary: '#3b82f6', bg: '#ffffff' },
  dark: { primary: '#8b5cf6', bg: '#1e1e1e' },
  custom: { primary: userColor, bg: userBg }
};

// Zustand 상태 관리
const useThemeStore = create((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme })
}));
```

**차별화 포인트**
- 사용자 맞춤 경험
- 3D 배경 색상도 연동 (React Three Fiber)

**구현 난이도**: Low
**우선순위**: Medium (UX 개선)

---

#### 아이디어 5: 포스트 음성 읽기 (TTS)

**개념**
```
블로그 포스트를 음성으로 읽어주는 기능
→ GB10에서 로컬 TTS 모델 실행
→ "운전 중에 블로그 듣기"
```

**기술 스택**
- AI API: Coqui TTS 또는 Bark (로컬 TTS)
- Frontend: Audio Player

**차별화 포인트**
- 로컬 TTS (클라우드 API 대신)
- 접근성 향상

**구현 난이도**: Medium
**우선순위**: Low (Phase 3)

---

### 5.3 기술적 도전 과제

#### 아이디어 6: 멀티테넌시 (여러 사용자 블로그 호스팅)

**개념**
```
단일 인프라에서 여러 사용자의 블로그 호스팅
→ 각 사용자마다 서브도메인 제공
→ user1.myblog.com, user2.myblog.com
```

**기술적 도전**
- DB 스키마 설계 (tenant_id 추가)
- Nginx 동적 라우팅
- 사용자별 리소스 격리 (CPU, 메모리 제한)

**포트폴리오 가치**: 매우 높음 (SaaS 경험)
**구현 난이도**: Very High
**우선순위**: Low (Phase 4, 확장 시)

---

#### 아이디어 7: 블루-그린 배포 자동화

**개념**
```
ECS 블루-그린 배포로 무중단 배포 구현
→ 새 버전 배포 시 트래픽을 점진적으로 이동
→ 문제 발생 시 자동 롤백
```

**기술 스택**
- AWS CodeDeploy
- ECS Blue-Green Deployment

**포트폴리오 가치**: 높음 (DevOps 경험)
**구현 난이도**: Medium
**우선순위**: Medium (Phase 2)

---

### 5.4 수익화 가능성 (선택사항)

#### 아이디어 8: AI 벤치마크 서비스 (SaaS)

**개념**
```
다른 개발자들이 자신의 모델을 업로드하여 벤치마크 실행
→ GB10 GPU 리소스를 유료로 제공
→ "벤치마크 1회당 $1"
```

**비즈니스 모델**
- 무료 티어: 월 3회 벤치마크
- Pro 티어: 월 $10 (무제한 벤치마크)

**기술적 요구사항**
- 사용자 모델 업로드 (S3)
- 모델 포맷 검증 (GGUF, Safetensors)
- 결제 시스템 (Stripe)

**시장 가능성**: 낮음 (니치 시장)
**우선순위**: Very Low (Phase 5, 실험적)

---

#### 아이디어 9: 블로그 템플릿 마켓플레이스

**개념**
```
3D 블로그 테마를 유료로 판매
→ "3D 포트폴리오 템플릿 $29"
→ Gumroad, LemonSqueezy로 판매
```

**기술적 요구사항**
- 테마 추상화 (컴포넌트 재사용)
- 설정 UI (색상, 폰트, 3D 씬 선택)

**시장 가능성**: 중간 (개발자 타겟)
**우선순위**: Low (Phase 4)

---

## 6. 리스크 및 완화 방안

### 6.1 기술적 리스크

| 리스크 | 가능성 | 영향도 | 완화 방안 |
|--------|--------|--------|-----------|
| **3D 렌더링 성능 저하 (모바일)** | High | High | LOD 구현, 모바일은 2D 폴백 |
| **AI 모델 로딩 시간 (10~15초)** | High | Medium | Startup Warmup, 로딩 UI 개선 |
| **GPU 메모리 부족 (VRAM)** | Medium | High | LRU 캐싱, 2개 모델 제한 |
| **PostgreSQL + TimescaleDB 동기화** | Medium | Medium | 단일 DB 통합 고려 |
| **JWT 보안 취약점** | Medium | High | Refresh Token Rotation 적용 |
| **N+1 쿼리 성능 저하** | High | Medium | EntityGraph, QueryDSL 적용 |
| **Docker Compose 복잡도** | Low | Low | 상세 README 작성 |

### 6.2 일정 리스크

| 리스크 | 가능성 | 영향도 | 완화 방안 |
|--------|--------|--------|-----------|
| **3D 기능 구현 난이도 과소평가** | High | High | Phase 1에서는 간단한 씬만, Phase 2에서 확장 |
| **멀티 모듈 설정 시간 과다** | Medium | Medium | 모놀리스 패키지로 시작, 나중에 분리 |
| **AI API llama.cpp + Transformers 통합** | Medium | Medium | llama.cpp로 단일화 고려 |
| **3개 DB 설정/관리 부담** | High | Medium | PostgreSQL로 통합, TimescaleDB 확장 사용 |
| **테스트 코드 작성 시간 부족** | High | High | 핵심 로직(Service)만 70% 커버리지 목표 |

**권장 일정**
```
Phase 1 (3개월): MVP 개발
  - Week 1-2: 개발 환경 구축, DB 스키마 설계
  - Week 3-6: Main API (블로그 CRUD, 인증)
  - Week 7-9: Frontend (블로그 UI, 간단한 3D)
  - Week 10-11: AI API (모델 로딩, 벤치마크)
  - Week 12: 통합 테스트, 버그 수정

Phase 2 (1개월): AWS 전환
  - Week 1-2: ECS, RDS 설정
  - Week 3: CI/CD 파이프라인
  - Week 4: 성능 최적화, 모니터링

Phase 3 (2개월): 고도화
  - 3D 기능 확장
  - 실시간 대시보드
  - AI 채팅봇 (선택)
```

### 6.3 비용 리스크

| 리스크 | 가능성 | 영향도 | 완화 방안 |
|--------|--------|--------|-----------|
| **AI API EC2 GPU 인스턴스 과도한 비용** | High | High | Spot Instance, 주문형 실행 |
| **S3 스토리지 비용 폭증** | Medium | Medium | 사용자당 용량 제한 (100MB) |
| **CloudFront 전송 비용** | Low | Low | 캐싱 최대화 (1년 TTL) |
| **RDS IOPS 초과** | Medium | Medium | Read Replica, Redis 캐싱 |
| **예상치 못한 트래픽 폭증** | Low | High | AWS Budgets 알림 ($50 초과 시) |

**비용 상한선 설정**
```bash
# AWS Budgets
월 예산: $50
알림 임계값: $40 (80%)
강제 중단: $60 (120%)
```

### 6.4 유지보수 리스크

| 리스크 | 가능성 | 영향도 | 완화 방안 |
|--------|--------|--------|-----------|
| **혼자 관리하기 어려운 복잡도** | High | High | 단순화 (DB 통합, Redux → Zustand) |
| **기술 스택 버전 업그레이드 부담** | Medium | Medium | Dependabot 자동 PR, 분기별 업그레이드 |
| **프로덕션 에러 추적 어려움** | High | High | Sentry 조기 도입 |
| **문서화 부족으로 온보딩 어려움** | Medium | Medium | README, ADR 작성 |
| **테스트 없어 리팩토링 위험** | High | High | 핵심 로직 70% 커버리지 |

**완화 전략**
1. **단순화 우선**: MVP에서는 최소 기술 스택 (PostgreSQL만, Redis 제외)
2. **문서화 습관**: 주요 결정 사항은 ADR 작성
3. **테스트 우선**: 핵심 비즈니스 로직은 먼저 테스트 코드 작성
4. **모니터링 조기 도입**: Sentry, 구조화된 로깅은 Phase 1부터

---

## 7. 결론 및 다음 단계

### 7.1 종합 평가

**현재 아키텍처의 장점**
1. **체계적인 설계**: 3계층 분리, 모듈화, 의존성 방향 제어
2. **환경 이식성**: Docker 기반 GB10 → AWS 전환 명확
3. **차별화 요소**: 3D UI + 로컬 LLM 벤치마크 (2026년 희소성)
4. **기술 스택**: 한국 취업 시장 적합 (Spring Boot, React, TypeScript)
5. **확장 가능성**: MSA 준비, 멀티 모듈, API 버저닝

**개선 필요 영역**
1. **복잡도 과도**: PostgreSQL + TimescaleDB + Redis 3개 DB → 통합 고려
2. **관찰성 부족**: 로깅, 모니터링, 에러 추적 전략 부재
3. **테스트 전략 부재**: 리팩토링 위험, 프로덕션 버그 가능성
4. **보안 미흡**: JWT Refresh Token, AI API 인증 보완 필요
5. **일정 리스크**: 3D + 멀티 백엔드 + 3개 DB는 3개월 MVP에 과도

### 7.2 핵심 권장사항 (우선순위 Top 5)

#### 1. MVP 범위 축소 (Critical)

**현재 계획**
- Frontend: 3D 랜딩, 블로그 CRUD, 벤치마크 페이지
- Main API: 인증, 블로그, 사용자, 벤치마크
- AI API: 모델 로딩, 추론, 벤치마크, GPU 메트릭
- DB: PostgreSQL + TimescaleDB + Redis

**권장 MVP**
- Frontend: **간단한 3D 랜딩** + 블로그 CRUD (벤치마크는 Phase 2)
- Main API: 인증 + 블로그 (사용자 관리는 최소화)
- AI API: 모델 로딩 + 추론 (벤치마크는 수동 실행)
- DB: **PostgreSQL 단일** (TimescaleDB 확장, Redis 제외)

**예상 효과**: 개발 기간 3개월 → 2개월 단축

#### 2. 관찰성 조기 도입 (Critical)

**즉시 적용**
- 구조화된 JSON 로깅 (Logstash Encoder)
- Sentry 에러 추적 (무료 티어)
- 헬스체크 엔드포인트 (/health, /health/db)

**Phase 2 추가**
- Prometheus + Grafana 대시보드
- CloudWatch Logs (AWS 전환 시)

#### 3. 보안 강화 (Critical)

**즉시 적용**
- Refresh Token Rotation (Redis 또는 DB Blacklist)
- AI API 인증 (API Key 또는 내부 전용)
- 입력 검증 (Pydantic, Hibernate Validator)
- 환경변수 관리 통일 (.env, AWS Secrets Manager)

#### 4. 테스트 전략 수립 (High)

**Phase 1 목표**
- Service Layer 70% 커버리지
- Repository Layer 80% 커버리지
- CI에서 자동 테스트 실행

**도구**
- Frontend: Jest + React Testing Library
- Main API: JUnit 5 + MockMvc + Testcontainers
- AI API: pytest + pytest-asyncio

#### 5. DB 단순화 (High)

**Phase 1: PostgreSQL 통합**
```sql
-- PostgreSQL에 TimescaleDB 확장 설치
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Hypertable로 GPU 메트릭 관리
SELECT create_hypertable('gpu_metrics', 'time');
```

**Redis는 Phase 2로 지연**
- 캐싱 없이 시작 (트래픽 낮을 때는 불필요)
- Refresh Token Blacklist는 PostgreSQL 테이블로 대체

**예상 효과**: 운영 복잡도 40% 감소, 개발 속도 30% 향상

---

### 7.3 수정된 개발 로드맵

#### Phase 1: MVP (2개월)

**Week 1-2: 기반 구축**
- [x] Docker Compose 환경 구축 (PostgreSQL 단일)
- [x] DB 스키마 설계 및 ERD
- [x] Main API 멀티 모듈 초기 설정
- [x] Frontend Next.js 프로젝트 생성
- [x] 구조화된 로깅 설정
- [x] Sentry 연동

**Week 3-5: Main API 개발**
- [ ] 인증 (JWT + OAuth2)
- [ ] 블로그 CRUD (Post, Category, Tag)
- [ ] 댓글 시스템
- [ ] N+1 쿼리 방지 (EntityGraph)
- [ ] 단위 테스트 (Service 70%)

**Week 6-8: Frontend 개발**
- [ ] 블로그 목록/상세 페이지
- [ ] 포스트 에디터 (Markdown)
- [ ] 간단한 3D 랜딩 페이지 (React Three Fiber)
- [ ] 다크 모드
- [ ] 반응형 디자인

**Week 9: AI API 기본 (선택)**
- [ ] 모델 로딩 (llama.cpp만)
- [ ] 텍스트 생성 API
- [ ] 수동 벤치마크 스크립트

**Week 10: 통합 및 테스트**
- [ ] Frontend ↔ Main API 통합
- [ ] E2E 테스트 (Playwright)
- [ ] 성능 테스트
- [ ] GB10 배포 (Docker Compose)

#### Phase 2: AWS 전환 (1개월)

**Week 1-2: 인프라 구축**
- [ ] ECS Fargate (Main API)
- [ ] RDS PostgreSQL
- [ ] S3 + CloudFront (정적 파일)
- [ ] Route 53 + ACM (도메인, SSL)

**Week 3: CI/CD**
- [ ] GitHub Actions (테스트, 빌드, 배포)
- [ ] 블루-그린 배포 (ECS)
- [ ] CloudWatch 로그 연동

**Week 4: 최적화**
- [ ] Redis 캐싱 추가 (ElastiCache)
- [ ] Read Replica (RDS)
- [ ] CDN 캐싱 최적화

#### Phase 3: 고도화 (1~2개월)

**차별화 기능**
- [ ] AI 벤치마크 페이지 (GPU 메트릭 시각화)
- [ ] 실시간 벤치마크 대시보드 (WebSocket)
- [ ] 3D 씬 확장 (인터랙티브 요소)
- [ ] AI 채팅봇 (선택)

**운영 안정화**
- [ ] Prometheus + Grafana
- [ ] 백업 자동화
- [ ] 알림 시스템 (Slack, Email)

---

### 7.4 다음 단계 (Depth 3 진행)

**Depth 3: 모듈 내부 설계**
1. **주요 화면별 컴포넌트 트리** (Frontend)
   - 블로그 목록 페이지
   - 포스트 상세 페이지
   - 벤치마크 대시보드

2. **API 엔드포인트 상세 명세** (Main API)
   - Request/Response DTO
   - 인증/인가 규칙
   - 에러 응답 형식

3. **DB 스키마 및 ERD**
   - 테이블 정의 (DDL)
   - 인덱스 전략
   - 외래키 관계

**또는 Depth 2 개선안 반영**
- PostgreSQL 통합 설계
- Redis 제외 전략
- 보안 강화 (JWT Rotation)
- 로깅 설정 구체화

---

### 7.5 최종 의견

이 프로젝트는 **2026년 취업 포트폴리오로서 매우 강력한 잠재력**을 가지고 있습니다. 특히:

1. **차별화 요소**: 3D UI + 로컬 LLM 벤치마크는 일반 CRUD 블로그와 확연히 구분됨
2. **기술 스택**: Spring Boot, React, TypeScript는 한국 취업 시장 표준
3. **아키텍처**: 멀티 모듈, MSA, Docker는 엔터프라이즈급 경험 어필
4. **환경 이식성**: GB10 → AWS 전환 설계는 실무 경험에 가까움

**하지만 위험 요소도 명확합니다**:

1. **복잡도 과도**: 3개 DB, 2개 백엔드, 3D 렌더링은 3개월 MVP에 과도
2. **관찰성 부족**: 로깅, 모니터링 없으면 프로덕션 운영 불가
3. **테스트 전략 부재**: 리팩토링 위험, 버그 가능성 높음

**권장 전략**:

1. **MVP 단순화**: PostgreSQL 통합, Redis 제외, 3D 최소화
2. **관찰성 우선**: 로깅, Sentry는 Phase 1부터 필수
3. **테스트 습관**: 핵심 로직은 TDD로 시작
4. **단계적 확장**: Phase 1 완료 후 Phase 2 (AWS), Phase 3 (고도화)

이 전략을 따른다면 **2개월 내 안정적인 MVP**를 완성하고, **면접에서 자신 있게 설명할 수 있는 포트폴리오**가 될 것입니다.

---

## 부록: 참고 자료

### A. 추천 학습 자료

**3D 웹 개발**
- [React Three Fiber Journey](https://threejs-journey.com/)
- [Three.js Fundamentals](https://threejs.org/manual/)
- [R3F Cookbook](https://docs.pmnd.rs/react-three-fiber)

**Spring Boot 멀티 모듈**
- [Spring Multi-Module Best Practices](https://spring.io/guides/gs/multi-module/)
- [Gradle Multi-Project Builds](https://docs.gradle.org/current/userguide/multi_project_builds.html)

**FastAPI + LLM**
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [llama.cpp Documentation](https://github.com/ggerganov/llama.cpp)
- [Transformers Documentation](https://huggingface.co/docs/transformers)

**AWS 배포**
- [ECS Fargate Workshop](https://ecsworkshop.com/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

### B. 체크리스트

**개발 시작 전**
- [ ] DB 스키마 ERD 작성 및 리뷰
- [ ] API 엔드포인트 명세서 작성
- [ ] 환경변수 관리 전략 수립 (.env.example)
- [ ] Git 브랜치 전략 결정 (main, develop, feature/*)
- [ ] 코드 컨벤션 문서화 (ESLint, Prettier, Checkstyle)

**Phase 1 완료 전**
- [ ] 핵심 기능 E2E 테스트 통과
- [ ] 구조화된 로깅 적용 (JSON)
- [ ] Sentry 에러 추적 연동
- [ ] README 개발 환경 구축 가이드 작성
- [ ] 성능 테스트 (JMeter, k6)
- [ ] 보안 체크리스트 (OWASP Top 10)

**Phase 2 완료 전**
- [ ] AWS 비용 알림 설정 ($50 임계값)
- [ ] CI/CD 파이프라인 테스트
- [ ] 백업 자동화 (RDS 스냅샷)
- [ ] 도메인 SSL 인증서 발급
- [ ] CloudWatch 대시보드 구축
- [ ] 장애 복구 매뉴얼 작성

---

**작성일**: 2026-01-07
**작성자**: Senior Solution Architect AI
**버전**: 1.0
**다음 리뷰**: Depth 3 설계 완료 후
