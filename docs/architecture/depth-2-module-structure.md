# Depth 2: 서비스별 모듈 구조

> 이 문서는 [blog-architecture-context.md](./blog-architecture-context.md)의 Depth 1을 기반으로
> 각 **독립 서비스**의 내부 모듈 구조를 정의합니다.

**최종 업데이트**: 2026-03-30

---

## 서비스 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    독립 서비스 목록                           │
│                                                             │
│  1. Frontend Shell App (Next.js)     — 사용자 인터페이스    │
│  2. Portal API (Spring Boot)         — 블로그 + 중앙 관리   │
│  3. AI Benchmark API (FastAPI)       — AI 모델 벤치마크     │
│  4. 새 서비스 (아무 스택)            — 확장 가능            │
│                                                             │
│  각 서비스: 독립 프로세스 + 독립 DB + 독립 배포             │
│  통신: REST API (서비스 간 DB 직접 접근 금지)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2-1. Frontend Shell App (Next.js)

### 아키텍처 개요

**Shell App + Feature Modules** 패턴을 채택합니다.
Shell App이 공통 레이아웃/인증을 관리하고, Feature Module이 각 서비스의 UI를 담당합니다.

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js App Router                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   Shell (핵심)                          │  │
│  │  • Layout (Header, Sidebar, Footer)                    │  │
│  │  • Auth Provider (JWT 관리)                            │  │
│  │  • Service Registry Client (서비스 목록 조회)          │  │
│  │  • Global State (Redux Toolkit)                        │  │
│  │  • API Client (Axios/TanStack Query)                   │  │
│  │  • EventBus (모듈 간 통신)                             │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│  ┌────────────────┴───────────────────────────────────────┐  │
│  │              Feature Modules (기능 모듈)               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │   Auth   │ │   Blog   │ │  Three   │ │ Pixel    │  │  │
│  │  │          │ │          │ │          │ │ Office   │  │  │
│  │  │ • Login  │ │ • Posts  │ │ • Canvas │ │ • Sprites│  │  │
│  │  │ • OAuth  │ │ • Editor │ │ • Scenes │ │ • Tilemap│  │  │
│  │  │ • Session│ │ • Search │ │ • Lights │ │ • Agents │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐               │  │
│  │  │Benchmark │ │ Project  │ │ Service  │ ← 동적       │  │
│  │  │          │ │          │ │ {name}   │   라우팅      │  │
│  │  │ • Models │ │ • List   │ │ • 자동   │               │  │
│  │  │ • Charts │ │ • Detail │ │   생성   │               │  │
│  │  │ • Compare│ │          │ │          │               │  │
│  │  └──────────┘ └──────────┘ └──────────┘               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 디렉토리 구조

```
frontend/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root Layout (Shell)
│   ├── page.tsx                      # Home (3D 랜딩)
│   ├── (auth)/                       # Auth 라우트 그룹
│   │   ├── login/page.tsx
│   │   └── oauth/callback/page.tsx
│   ├── blog/                         # Blog 라우트 (Portal API)
│   │   ├── page.tsx
│   │   ├── [slug]/page.tsx
│   │   └── editor/page.tsx
│   ├── benchmark/                    # Benchmark 라우트 (AI API)
│   │   ├── page.tsx
│   │   ├── [modelId]/page.tsx
│   │   └── compare/page.tsx
│   ├── projects/                     # Projects 라우트
│   │   ├── page.tsx                  # Registry에서 서비스 목록 표시
│   │   └── [serviceId]/page.tsx      # 서비스별 상세 (동적)
│   ├── pixel-office/page.tsx         # Pixel Office
│   └── api/                          # Next.js API Routes (프록시)
│       └── revalidate/route.ts
│
├── src/
│   ├── shell/                        # Shell (핵심 인프라)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx
│   │   │   └── useAuth.ts
│   │   ├── registry/
│   │   │   ├── ServiceRegistryClient.ts   # Portal API에서 서비스 목록 조회
│   │   │   ├── useServices.ts             # 서비스 상태 훅
│   │   │   └── ServiceStatusBadge.tsx     # UP/DOWN 배지
│   │   ├── state/
│   │   │   ├── store.ts                   # Redux Store
│   │   │   └── rootReducer.ts
│   │   ├── api/
│   │   │   ├── client.ts                  # Axios 인스턴스
│   │   │   ├── queryClient.ts             # TanStack Query 설정
│   │   │   └── interceptors.ts
│   │   └── eventBus/
│   │       ├── EventBus.ts
│   │       └── events.ts
│   │
│   ├── modules/                      # Feature Modules
│   │   ├── blog/
│   │   │   ├── components/
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── PostEditor.tsx
│   │   │   │   ├── CategoryFilter.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePosts.ts
│   │   │   │   └── usePostDetail.ts
│   │   │   ├── api/
│   │   │   │   └── blogApi.ts         # → Portal API 호출
│   │   │   ├── state/
│   │   │   │   └── blogSlice.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── benchmark/
│   │   │   ├── components/
│   │   │   │   ├── ModelCard.tsx
│   │   │   │   ├── PerformanceChart.tsx
│   │   │   │   └── CompareChart.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useBenchmarkData.ts
│   │   │   ├── api/
│   │   │   │   └── benchmarkApi.ts    # → AI Benchmark API 호출
│   │   │   └── index.ts
│   │   │
│   │   ├── three/
│   │   │   ├── components/
│   │   │   │   ├── Canvas3D.tsx
│   │   │   │   └── Scene/
│   │   │   └── index.ts
│   │   │
│   │   ├── pixel-office/
│   │   │   ├── components/
│   │   │   │   ├── OfficeCanvas.tsx
│   │   │   │   ├── AgentSprite.tsx
│   │   │   │   └── TileMap.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── project/
│   │       ├── components/
│   │       │   ├── ProjectCard.tsx
│   │       │   └── ServiceDashboard.tsx   # Registry 기반 동적 대시보드
│   │       └── index.ts
│   │
│   ├── shared/                       # 공유 컴포넌트/유틸
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   └── useIntersectionObserver.ts
│   │   └── utils/
│   │       ├── format.ts
│   │       └── validation.ts
│   │
│   └── types/
│       ├── api.d.ts
│       ├── service.d.ts               # Service Contract 타입
│       └── global.d.ts
│
├── public/
│   ├── models/                        # 3D 모델 파일
│   └── sprites/                       # 픽셀 오피스 스프라이트
│
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### 상태 관리 전략

| 영역 | 도구 | 사용 용도 |
|------|------|-----------|
| **전역 상태** | Redux Toolkit | 인증 정보, 테마, 사용자 설정 |
| **서버 상태** | TanStack Query | API 응답 캐싱, 자동 재검증, 서비스별 데이터 |
| **로컬 상태** | React Hooks | 폼 입력, UI 토글, 임시 데이터 |
| **URL 상태** | Next.js Router | 페이지네이션, 필터, 검색 쿼리 |

### 서비스별 API 호출 분리

```typescript
// src/shell/api/client.ts
// 서비스별 Axios 인스턴스 — Nginx가 라우팅
const portalApi = axios.create({ baseURL: '/api/portal' });
const aiApi = axios.create({ baseURL: '/api/ai' });

// 새 서비스 추가 시: Registry에서 baseURL 동적 생성
function createServiceApi(serviceName: string) {
  return axios.create({ baseURL: `/api/${serviceName}` });
}
```

### 핵심 설계 결정

| 결정 | 근거 |
|------|------|
| Shell App 패턴 | 공통 인프라(인증, 레이아웃) 재사용 + 모듈 독립성 |
| EventBus | 모듈 간 느슨한 결합, 순환 참조 방지 |
| Redux + TanStack Query 이원화 | 전역 상태 vs 서버 상태 관심사 분리 |
| Next.js App Router | RSC로 초기 로딩 최적화, SSG로 블로그 SEO |
| 동적 서비스 라우팅 | Registry 기반으로 새 프로젝트 UI 자동 생성 |

---

## 2-2. Portal API (Spring Boot)

### 아키텍처 개요

**Spring Boot 멀티 모듈 + 계층형 아키텍처**를 유지하되, 포털 기능에 집중합니다.
벤치마크 등 서브 프로젝트 기능은 독립 서비스로 분리합니다.

```
┌────────────────────────────────────────────────────────────┐
│                    api-server (실행 모듈)                    │
│  • Spring Boot Application                                 │
│  • Configuration (CORS, Swagger, Scheduling)               │
│  • Global Exception Handler                                │
│  • 의존: module-*, security, domain                        │
└────────────────┬───────────────────────────────────────────┘
                 │
    ┌────────────┴──────────────┬─────────────┐
    ▼                           ▼             ▼
┌──────────┐            ┌──────────┐    ┌──────────┐
│module-   │            │module-   │    │module-   │
│blog      │            │user      │    │registry  │  ← 신규
│          │            │          │    │          │
│• Post    │            │• Profile │    │• Service │
│• Comment │            │• Auth    │    │  Health  │
│• Category│            │• Setting │    │• Summary │
│• Tag     │            │          │    │  Cache   │
└────┬─────┘            └────┬─────┘    └────┬─────┘
     │                       │               │
     └───────────┬───────────┴───────────────┘
                 ▼
       ┌──────────────────┐
       │  security (인증)  │
       │  • JWT            │
       │  • OAuth2         │
       │  의존: domain     │
       └────────┬──────────┘
                ▼
       ┌──────────────────┐
       │  domain (도메인)  │
       │  • Entity         │
       │  • Repository     │
       │  의존: common     │
       └────────┬──────────┘
                ▼
       ┌──────────────────┐
       │  common (공통)    │
       │  • DTO            │
       │  • Utils          │
       │  • Exception      │
       └──────────────────┘
```

### 모듈 의존성 규칙

```
api-server → module-* → security → domain → common
```

- 상위 → 하위 의존 가능
- 하위 → 상위 의존 금지 (순환 참조 방지)
- common은 모든 모듈에서 참조 가능
- **module 간 직접 의존 금지**

### 디렉토리 구조

```
backend/
├── api-server/                         # 실행 모듈
│   ├── src/main/java/com/portfolio/portal/
│   │   ├── PortalApplication.java
│   │   ├── config/
│   │   │   ├── CorsConfig.java
│   │   │   ├── SwaggerConfig.java
│   │   │   └── SchedulingConfig.java      # 서비스 헬스체크 스케줄러
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── ErrorResponse.java
│   │   └── health/
│   │       └── HealthController.java       # Portal 자체 /health
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   ├── logback-spring.xml
│   │   └── db/migration/                  # Flyway (portal_db)
│   │       ├── V1__init_portal_schema.sql
│   │       └── V2__add_service_registry.sql
│   └── build.gradle.kts
│
├── module-blog/                        # 블로그 모듈
│   ├── src/main/java/com/portfolio/portal/blog/
│   │   ├── controller/
│   │   │   ├── PostController.java
│   │   │   ├── CommentController.java
│   │   │   ├── CategoryController.java
│   │   │   └── TagController.java
│   │   ├── service/
│   │   │   ├── PostService.java
│   │   │   └── CommentService.java
│   │   ├── dto/
│   │   │   ├── PostCreateRequest.java
│   │   │   ├── PostResponse.java
│   │   │   └── PostListResponse.java
│   │   └── mapper/
│   │       └── PostMapper.java
│   └── build.gradle.kts
│
├── module-user/                        # 사용자 모듈
│   ├── src/main/java/com/portfolio/portal/user/
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   └── UserController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   └── UserService.java
│   │   └── dto/
│   └── build.gradle.kts
│
├── module-registry/                    # 서비스 레지스트리 모듈 (신규)
│   ├── src/main/java/com/portfolio/portal/registry/
│   │   ├── controller/
│   │   │   └── ServiceRegistryController.java   # GET /api/portal/services
│   │   ├── service/
│   │   │   ├── ServiceRegistryService.java      # CRUD
│   │   │   └── ServiceHealthChecker.java        # @Scheduled 헬스체크
│   │   ├── dto/
│   │   │   ├── ServiceStatusResponse.java
│   │   │   └── ServiceSummaryResponse.java
│   │   └── client/
│   │       └── ServiceClient.java               # RestTemplate/WebClient
│   └── build.gradle.kts
│
├── security/                           # 보안 모듈
│   ├── src/main/java/com/portfolio/security/
│   │   ├── config/SecurityConfig.java
│   │   ├── jwt/
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── JwtProperties.java
│   │   ├── service/
│   │   │   └── CustomUserDetailsService.java
│   │   └── dto/
│   └── build.gradle.kts
│
├── domain/                             # 도메인 모듈 (Portal 전용)
│   ├── src/main/java/com/portfolio/domain/
│   │   ├── entity/
│   │   │   ├── BaseTimeEntity.java
│   │   │   ├── SoftDeletableEntity.java
│   │   │   ├── user/
│   │   │   │   ├── User.java
│   │   │   │   ├── UserRole.java
│   │   │   │   ├── RefreshToken.java
│   │   │   │   └── OAuthAccount.java
│   │   │   ├── blog/
│   │   │   │   ├── Post.java
│   │   │   │   ├── Category.java
│   │   │   │   ├── Tag.java
│   │   │   │   └── Comment.java
│   │   │   └── registry/                        # 신규
│   │   │       ├── ServiceRegistryEntry.java
│   │   │       └── ServiceCacheEntry.java
│   │   └── repository/
│   │       ├── user/
│   │       ├── blog/
│   │       └── registry/
│   │           ├── ServiceRegistryRepository.java
│   │           └── ServiceCacheRepository.java
│   └── build.gradle.kts
│
├── common/                             # 공통 유틸
│   └── build.gradle.kts
│
├── build.gradle.kts                    # 루트
└── settings.gradle.kts
```

### settings.gradle.kts 변경

```kotlin
rootProject.name = "portfolio-portal"

include(
    "common",
    "domain",
    "security",
    "module-blog",
    "module-user",
    "module-registry",    // 신규: 서비스 레지스트리
    "module-office",      // 신규: Pixel Office (AI 에이전트 가상 사무실)
    "api-server"
)
// module-benchmark 제거 → 독립 서비스로 분리
```

### 기존 코드 재활용

| 기존 모듈 | 변경 |
|-----------|------|
| common | 유지 |
| domain | 축소 — Blog + User + Registry 엔티티만 (Benchmark 엔티티 제거) |
| security | 유지 |
| module-blog | 유지 |
| module-user | 유지 |
| module-benchmark | **제거** → AI Benchmark API 독립 서비스로 이전 |
| module-registry | **신규** — 서비스 등록/헬스체크/캐시 |
| module-office | **신규** — Pixel Office AI 에이전트 가상 사무실 ([설계](pixel-office-design.md)) |
| api-server | 리네이밍 (blog → portal) |

### Portal API 엔드포인트

```
# 블로그
GET    /api/portal/posts                    # 포스트 목록
GET    /api/portal/posts/{slug}             # 포스트 상세
POST   /api/portal/posts                    # 포스트 생성
PUT    /api/portal/posts/{id}               # 포스트 수정
DELETE /api/portal/posts/{id}               # 포스트 삭제
GET    /api/portal/categories               # 카테고리 목록
GET    /api/portal/tags                     # 태그 목록

# 인증
POST   /api/portal/auth/signup              # 회원가입
POST   /api/portal/auth/login               # 로그인
POST   /api/portal/auth/refresh             # 토큰 갱신
POST   /api/portal/auth/logout              # 로그아웃

# 사용자
GET    /api/portal/users/me                 # 내 정보
PUT    /api/portal/users/me                 # 내 정보 수정

# 서비스 레지스트리
GET    /api/portal/services                 # 등록된 서비스 목록 + 상태
GET    /api/portal/services/{name}          # 특정 서비스 상세 (캐시된 summary)
POST   /api/portal/services                 # 서비스 등록 (관리자)
DELETE /api/portal/services/{name}          # 서비스 제거 (관리자)

# 헬스
GET    /health                              # Portal 자체 헬스체크
```

---

## 2-3. AI Benchmark API (FastAPI) — 독립 서비스

### 아키텍처 개요

Portal에서 분리된 **독립 서비스**로, 자체 DB를 보유하고 단독 실행 가능합니다.

```
┌────────────────────────────────────────────────────────────┐
│                  AI Benchmark API (FastAPI)                  │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Router (엔드포인트)                          │ │
│  │  • /health, /api/summary (Service Contract)            │ │
│  │  • /api/ai/models, /api/ai/benchmark                   │ │
│  │  • /api/ai/generate, /api/ai/generate/stream           │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                             │                                │
│  ┌──────────────────────────┴─────────────────────────────┐ │
│  │  Layer 2: Service (비즈니스 로직)                       │ │
│  │  • GenerationService (모델 추론)                        │ │
│  │  • BenchmarkService (벤치마크 실행/관리)                │ │
│  │  • MetricsService (GPU 메트릭 수집)                     │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                             │                                │
│  ┌──────────────────────────┴─────────────────────────────┐ │
│  │  Layer 3: Infrastructure                                │ │
│  │  • ModelManager (모델 로딩/캐싱, Singleton)             │ │
│  │  • LlamaCppClient (GGUF 모델 추론)                      │ │
│  │  • NvidiaGPUMonitor (pynvml, 메트릭 수집)               │ │
│  │  • Database (asyncpg → ai_bench_db)                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 디렉토리 구조

```
ai-benchmark-api/                        # 독립 프로젝트 (backend 외부)
├── app/
│   ├── main.py                          # FastAPI Application
│   ├── config.py                        # 환경 설정
│   │
│   ├── contract/                        # Service Contract 구현
│   │   ├── health.py                    # GET /health
│   │   └── summary.py                   # GET /api/summary
│   │
│   ├── routers/
│   │   ├── model_router.py              # /api/ai/models
│   │   ├── benchmark_router.py          # /api/ai/benchmark
│   │   └── generation_router.py         # /api/ai/generate
│   │
│   ├── services/
│   │   ├── generation_service.py
│   │   ├── benchmark_service.py
│   │   └── metrics_service.py
│   │
│   ├── infrastructure/
│   │   ├── model_manager.py             # Singleton, LRU Cache
│   │   ├── llama_client.py
│   │   ├── gpu_monitor.py
│   │   └── database.py                  # asyncpg → ai_bench_db
│   │
│   ├── schemas/                         # Pydantic 모델
│   │   ├── model.py
│   │   ├── benchmark.py
│   │   └── generation.py
│   │
│   └── db/
│       └── migrations/                  # Alembic (ai_bench_db 전용)
│           ├── V1__init_ai_bench.sql
│           └── alembic.ini
│
├── tests/
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

### Service Contract 구현

```python
# app/contract/health.py
@router.get("/health")
async def health():
    return {
        "status": "UP",
        "service": "ai-benchmark",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }

# app/contract/summary.py
@router.get("/api/summary")
async def summary(db: AsyncSession = Depends(get_db)):
    total_models = await db.scalar(select(func.count(Model.id)))
    total_benchmarks = await db.scalar(select(func.count(BenchmarkResult.id)))
    latest = await db.scalar(select(func.max(BenchmarkResult.created_at)))

    return {
        "service": "ai-benchmark",
        "displayName": "AI 모델 벤치마크",
        "description": "로컬 LLM 성능 측정 및 비교",
        "icon": "robot",
        "stats": {
            "totalModels": total_models,
            "totalBenchmarks": total_benchmarks,
            "lastUpdated": latest.isoformat() if latest else None
        },
        "routes": [
            {"path": "/benchmark", "label": "벤치마크 목록"},
            {"path": "/benchmark/compare", "label": "모델 비교"}
        ]
    }
```

### AI Benchmark API 엔드포인트

```
# Service Contract (필수)
GET    /health                              # 생존 확인
GET    /api/summary                         # 포털 대시보드용 요약

# 모델 관리
GET    /api/ai/models                       # 모델 리스트
GET    /api/ai/models/{id}                  # 모델 상세
POST   /api/ai/models                       # 모델 등록

# 벤치마크
POST   /api/ai/benchmark/run                # 벤치마크 실행
GET    /api/ai/benchmark/{id}/results       # 결과 조회
GET    /api/ai/benchmark/compare            # 모델 비교

# 추론
POST   /api/ai/generate                     # 텍스트 생성
POST   /api/ai/generate/stream              # 스트리밍 생성 (SSE)

# GPU 메트릭
GET    /api/ai/metrics/gpu                  # 현재 GPU 상태
GET    /api/ai/metrics/gpu/history          # GPU 이력 (TimescaleDB)
```

### ai_bench_db 스키마

```sql
-- 모델 메타 정보
CREATE TABLE ai_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(100),
    parameter_size VARCHAR(50),
    quantization VARCHAR(20),
    format VARCHAR(20),                   -- gguf, safetensors
    file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 벤치마크 결과
CREATE TABLE benchmark_results (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT REFERENCES ai_models(id),
    tokens_per_second DECIMAL(10,2),
    time_to_first_token_ms INTEGER,
    vram_usage_gb DECIMAL(5,2),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    test_prompt TEXT,
    test_config JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- GPU 메트릭 (TimescaleDB Hypertable)
CREATE TABLE gpu_metrics (
    time TIMESTAMPTZ NOT NULL,
    gpu_id INTEGER NOT NULL,
    temperature_celsius DECIMAL(5,1),
    utilization_percent DECIMAL(5,1),
    memory_used_mb INTEGER,
    memory_total_mb INTEGER,
    power_draw_watts DECIMAL(6,1)
);

SELECT create_hypertable('gpu_metrics', 'time');
```

### 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Python | 3.11+ | 런타임 |
| FastAPI | 0.100+ | 웹 프레임워크 |
| Uvicorn | 0.24+ | ASGI 서버 |
| Pydantic | 2.x | 요청/응답 검증 |
| asyncpg | 0.29+ | PostgreSQL 비동기 드라이버 |
| Alembic | 1.13+ | DB 마이그레이션 |
| llama-cpp-python | 0.2+ | GGUF 모델 추론 |
| transformers | 4.36+ | Safetensors 모델 추론 |
| pynvml | 11.5+ | GPU 모니터링 |

---

## 2-4. 새 서비스 추가 가이드 (템플릿)

어떤 기술 스택이든 아래 계약만 지키면 포털에 연결됩니다.

### 최소 요구사항

```
새 서비스
├── /health              # GET — 생존 확인 (필수)
├── /api/summary         # GET — 대시보드 요약 (필수)
├── /api/{service}/*     # 자체 API (자유)
├── Dockerfile           # Docker 이미지 (필수)
└── 자체 DB              # 독립 DB (권장)
```

### 포털 등록 절차

```sql
-- 1. Portal DB에 서비스 등록
INSERT INTO service_registry (service_name, display_name, base_url)
VALUES ('project-m', 'Project-M', 'http://project-m:8200');
```

```yaml
# 2. docker-compose.yml에 서비스 + 전용 DB 추가
services:
  project-m-db:
    image: postgres:15
    environment:
      POSTGRES_DB: project_m_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${PROJECT_M_DB_PASSWORD}
    volumes:
      - project_m_data:/var/lib/postgresql/data
    networks:
      - portfolio-network

  project-m:
    build: ./services/project-m
    ports:
      - "8200:8200"
    environment:
      DATABASE_URL: postgresql://postgres:${PROJECT_M_DB_PASSWORD}@project-m-db:5432/project_m_db
    depends_on:
      - project-m-db
    networks:
      - portfolio-network
```

```nginx
# 3. nginx.conf에 라우팅 추가
location /api/project-m/ {
    proxy_pass http://project-m:8200/;
}
```

**끝.** Portal 코드 수정/재배포 불필요.

---

## 서비스 간 통신 프로토콜

### 통신 규칙

```
┌──────────────┐  REST API   ┌──────────────┐
│   Frontend   │ ──────────► │  Portal API  │
│   (Next.js)  │             │  (Spring)    │
│              │  REST API   │              │
│              │ ──────────► │              │
└──────────────┘             └──────────────┘
       │
       │ REST API (Nginx 라우팅)
       ▼
┌──────────────┐
│  AI Bench-   │
│  mark API    │
│  (FastAPI)   │
└──────────────┘
```

| 통신 | 방향 | 프로토콜 |
|------|------|---------|
| Frontend → Portal API | /api/portal/* | REST (Nginx 프록시) |
| Frontend → AI API | /api/ai/* | REST (Nginx 프록시) |
| Frontend → 새 서비스 | /api/{service}/* | REST (Nginx 프록시) |
| Portal → 서브 서비스 | /health, /api/summary | REST (서비스 간 직접) |
| 서비스 → 서비스 | 금지 (Portal 경유 권장) | — |

### 인증 전파

```
1. Frontend에서 Portal API로 로그인 → JWT 발급
2. Frontend가 JWT를 Authorization 헤더에 포함
3. Nginx가 요청을 각 서비스로 라우팅
4. 각 서비스는 JWT 검증만 수행 (발급은 Portal만)
   - Portal: Spring Security (JWT 발급 + 검증)
   - AI API: JWT 검증 미들웨어 (검증만)
   - 새 서비스: JWT 검증 라이브러리 (검증만)
```

---

## 다음 단계 (Depth 3/4)

개발 진행하면서 필요 시 추가:

- **Depth 3**: 각 모듈 내부 클래스/함수 설계
- **Depth 4**: API 상세 명세 (OpenAPI), DB ERD, 시퀀스 다이어그램

---

**이 문서는 서비스별 모듈 구조를 정의합니다.**
**새 서비스 추가 시 2-4절의 가이드를 따르세요.**
