# Depth 2: 서비스별 모듈 구조

> 이 문서는 [blog-architecture-context.md](./blog-architecture-context.md)의 Depth 1을 기반으로 각 서비스의 모듈 구조를 정의합니다.

---

## 2-1. Frontend 모듈 구조

### 아키텍처 개요

**모듈러 아키텍처 + 게이트웨이 패턴**을 채택하여 기능별 모듈 독립성과 확장성을 확보합니다.

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js App Router                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   Core Module (핵심)                    │  │
│  │  • ModuleRegistry (모듈 등록/관리)                     │  │
│  │  • EventBus (모듈 간 통신)                             │  │
│  │  • Global State (Redux Toolkit)                        │  │
│  │  • API Client (Axios/TanStack Query)                   │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                           │
│  ┌────────────────┴───────────────────────────────────────┐  │
│  │              Feature Modules (기능 모듈)               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │   Auth   │ │   Blog   │ │  Three   │ │Benchmark │  │  │
│  │  │          │ │          │ │          │ │          │  │  │
│  │  │ • Login  │ │ • Posts  │ │ • Canvas │ │ • Models │  │  │
│  │  │ • OAuth  │ │ • Editor │ │ • Scenes │ │ • Charts │  │  │
│  │  │ • Session│ │ • Search │ │ • Lights │ │ • Compare│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │  ┌──────────┐                                          │  │
│  │  │ Project  │                                          │  │
│  │  │          │                                          │  │
│  │  │ • List   │                                          │  │
│  │  │ • Detail │                                          │  │
│  │  └──────────┘                                          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 디렉토리 구조

```
frontend/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root Layout
│   ├── page.tsx                 # Home (3D 랜딩)
│   ├── (auth)/                  # Auth 라우트 그룹
│   │   ├── login/
│   │   └── oauth/callback/
│   ├── blog/                    # Blog 라우트
│   │   ├── page.tsx             # 포스트 목록
│   │   ├── [slug]/page.tsx      # 포스트 상세
│   │   └── editor/page.tsx      # 에디터 (인증 필요)
│   ├── benchmark/               # Benchmark 라우트
│   │   ├── page.tsx             # 모델 리스트
│   │   ├── [modelId]/page.tsx   # 모델 상세
│   │   └── compare/page.tsx     # 모델 비교
│   ├── projects/                # Projects 라우트
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── api/                     # Next.js API Routes (프록시)
│       ├── auth/[...nextauth]/route.ts
│       └── revalidate/route.ts
│
├── src/
│   ├── core/                    # Core Module
│   │   ├── registry/
│   │   │   ├── ModuleRegistry.ts    # 모듈 등록/초기화
│   │   │   └── types.ts
│   │   ├── eventBus/
│   │   │   ├── EventBus.ts          # Pub-Sub 패턴
│   │   │   └── events.ts
│   │   ├── state/
│   │   │   ├── store.ts             # Redux Store
│   │   │   └── rootReducer.ts
│   │   ├── api/
│   │   │   ├── client.ts            # Axios 인스턴스
│   │   │   ├── queryClient.ts       # TanStack Query 설정
│   │   │   └── interceptors.ts      # Request/Response 인터셉터
│   │   └── hooks/
│   │       ├── useModule.ts
│   │       └── useEventBus.ts
│   │
│   ├── modules/                 # Feature Modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── OAuthButtons.tsx
│   │   │   │   └── SessionProvider.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useSession.ts
│   │   │   ├── api/
│   │   │   │   └── authApi.ts       # REST API 호출
│   │   │   ├── state/
│   │   │   │   └── authSlice.ts     # Redux Slice
│   │   │   └── index.ts             # 모듈 Export
│   │   │
│   │   ├── blog/
│   │   │   ├── components/
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── PostEditor.tsx
│   │   │   │   ├── CategoryFilter.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePosts.ts
│   │   │   │   ├── usePostDetail.ts
│   │   │   │   └── usePostEditor.ts
│   │   │   ├── api/
│   │   │   │   └── blogApi.ts
│   │   │   ├── state/
│   │   │   │   └── blogSlice.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── three/
│   │   │   ├── components/
│   │   │   │   ├── Canvas3D.tsx
│   │   │   │   ├── Scene/
│   │   │   │   │   ├── HomeScene.tsx
│   │   │   │   │   ├── BlogScene.tsx
│   │   │   │   │   └── ProjectScene.tsx
│   │   │   │   ├── Lights/
│   │   │   │   │   ├── AmbientLight.tsx
│   │   │   │   │   └── DirectionalLight.tsx
│   │   │   │   └── Models/
│   │   │   │       ├── Avatar3D.tsx
│   │   │   │       └── InteractiveObject.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useThreeScene.ts
│   │   │   │   └── useModelLoader.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── benchmark/
│   │   │   ├── components/
│   │   │   │   ├── ModelCard.tsx
│   │   │   │   ├── ModelFilters.tsx
│   │   │   │   ├── PerformanceChart.tsx    # Recharts
│   │   │   │   ├── CompareChart.tsx
│   │   │   │   └── MetricsTable.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useModels.ts
│   │   │   │   ├── useBenchmarkData.ts
│   │   │   │   └── useModelCompare.ts
│   │   │   ├── api/
│   │   │   │   └── benchmarkApi.ts
│   │   │   ├── state/
│   │   │   │   └── benchmarkSlice.ts
│   │   │   └── index.ts
│   │   │
│   │   └── project/
│   │       ├── components/
│   │       │   ├── ProjectCard.tsx
│   │       │   ├── ProjectDetail.tsx
│   │       │   └── TechStack.tsx
│   │       ├── hooks/
│   │       │   └── useProjects.ts
│   │       ├── api/
│   │       │   └── projectApi.ts
│   │       └── index.ts
│   │
│   ├── shared/                  # 공유 컴포넌트/유틸
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
│   └── types/                   # TypeScript 타입 정의
│       ├── api.d.ts
│       ├── models.d.ts
│       └── global.d.ts
│
├── public/
│   ├── models/                  # 3D 모델 파일 (.glb, .gltf)
│   └── images/
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 모듈 간 통신 방식

#### 1. ModuleRegistry (모듈 등록)
```typescript
// core/registry/ModuleRegistry.ts
class ModuleRegistry {
  private modules = new Map<string, Module>();

  register(module: Module) {
    this.modules.set(module.name, module);
    module.initialize();
  }

  getModule(name: string): Module | undefined {
    return this.modules.get(name);
  }
}

// modules/blog/index.ts
export const BlogModule: Module = {
  name: 'blog',
  initialize() {
    // Redux Slice 등록
    // API Client 설정
    // EventBus 구독
  }
};
```

#### 2. EventBus (이벤트 기반 통신)
```typescript
// core/eventBus/EventBus.ts
class EventBus {
  subscribe(event: string, handler: Function) { }
  publish(event: string, data?: any) { }
}

// 사용 예시: Auth 로그아웃 시 전역 상태 초기화
EventBus.subscribe('auth:logout', () => {
  // blog, benchmark 모듈 캐시 클리어
  queryClient.clear();
});
```

### 상태 관리 전략

| 영역 | 도구 | 사용 용도 |
|------|------|-----------|
| **전역 상태** | Redux Toolkit | 인증 정보, 테마, 사용자 설정 |
| **서버 상태** | TanStack Query | API 응답 캐싱, 자동 재검증, Optimistic Update |
| **로컬 상태** | React Hooks | 폼 입력, UI 토글, 임시 데이터 |
| **URL 상태** | Next.js Router | 페이지네이션, 필터, 검색 쿼리 |

### 기술 스택 상세

| 기술 | 버전 | 선정 이유 |
|------|------|-----------|
| **Next.js** | 14+ (App Router) | SSR/SSG SEO 최적화, 파일 기반 라우팅, API Routes |
| **React** | 18+ | Concurrent Features, R3F 호환, 업계 표준 |
| **TypeScript** | 5.x | 타입 안정성, IntelliSense, 리팩토링 안전성 |
| **React Three Fiber** | 8.x | React 기반 3D 구현, drei 유틸 풍부 |
| **@react-three/drei** | - | 카메라 컨트롤, 후처리, 3D 텍스트 등 |
| **Redux Toolkit** | 2.x | 보일러플레이트 최소화, DevTools, Immer 내장 |
| **TanStack Query** | 5.x | 서버 상태 캐싱, 자동 재검증, 낙관적 업데이트 |
| **Axios** | 1.x | Request/Response 인터셉터, Timeout 제어 |
| **TailwindCSS** | 3.x | 유틸리티 클래스, 반응형 내장, 번들 최적화 |
| **Recharts** | 2.x | 선언적 차트, 반응형, 커스터마이징 용이 |
| **NextAuth.js** | 5.x | OAuth2/JWT 통합, Next.js 최적화 |
| **Zod** | 3.x | 런타임 타입 검증, TypeScript 타입 추론 |

### 핵심 설계 결정 사항

#### 1. 모듈러 아키텍처 선택 이유
- **확장성**: 새 모듈(예: Admin) 추가 시 기존 코드 영향 최소화
- **재사용성**: 각 모듈의 컴포넌트/훅이 독립적으로 테스트/배포 가능
- **팀 협업**: 모듈별 작업 분담으로 충돌 방지 (미래 확장 고려)

#### 2. 게이트웨이 패턴 도입 이유
- **ModuleRegistry**: 모듈 초기화 순서 제어, 의존성 관리
- **EventBus**: 느슨한 결합, 순환 참조 방지, 확장 용이

#### 3. 상태 관리 이원화 이유
- **Redux**: 전역 상태(인증, 테마)는 여러 모듈에서 접근 필요
- **TanStack Query**: 서버 상태는 캐싱/재검증 로직이 복잡 → 전문 라이브러리 활용

#### 4. Next.js App Router 선택 이유
- **RSC(React Server Components)**: 서버에서 데이터 페칭 → 초기 로딩 속도 개선
- **레이아웃 공유**: layout.tsx로 공통 UI 중복 제거
- **SEO 최적화**: 블로그 포스트 SSG 빌드 → 검색 엔진 노출 극대화

---

## 2-2. Main API 모듈 구조

### 아키텍처 개요

**Spring Boot 멀티 모듈 + 계층형 아키텍처**를 채택하여 도메인 독립성과 의존성 방향 제어를 확보합니다.

```
┌────────────────────────────────────────────────────────────┐
│                    api-server (실행 모듈)                   │
│  • Spring Boot Application                                 │
│  • Configuration                                            │
│  • Global Exception Handler                                │
│  • 의존: module-*, security, domain                        │
└────────────────┬───────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┬─────────────┬─────────────┐
    ▼                         ▼             ▼             ▼
┌─────────┐            ┌─────────┐    ┌─────────┐  ┌─────────┐
│module-  │            │module-  │    │module-  │  │module-  │
│blog     │            │user     │    │benchmark│  │project  │
│         │            │         │    │         │  │         │
│• Post   │            │• Profile│    │• Model  │  │• Project│
│• Comment│            │• Setting│    │• Result │  │• Tech   │
└────┬────┘            └────┬────┘    └────┬────┘  └────┬────┘
     │                      │              │            │
     └──────────────┬───────┴──────────────┴────────────┘
                    ▼
          ┌──────────────────┐
          │  security (인증)  │
          │  • JWT           │
          │  • OAuth2        │
          │  의존: domain    │
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │  domain (도메인)  │
          │  • Entity        │
          │  • Repository    │
          │  의존: common    │
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │  common (공통)    │
          │  • DTO           │
          │  • Utils         │
          │  • Exception     │
          └──────────────────┘
```

### 모듈 의존성 규칙
```
api-server → module-* → security → domain → common
                         ↓
                      (common)
```
- **상위 모듈**은 하위 모듈 의존 가능
- **하위 모듈**은 상위 모듈 의존 금지 (순환 참조 방지)
- **common**은 모든 모듈에서 참조 가능

### 디렉토리 구조

```
main-api/
├── api-server/                      # 실행 모듈
│   ├── src/main/java/com/portfolio/blog/
│   │   ├── ApiServerApplication.java    # @SpringBootApplication
│   │   ├── config/
│   │   │   ├── CorsConfig.java
│   │   │   ├── RedisConfig.java
│   │   │   └── SwaggerConfig.java
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── ErrorResponse.java
│   │   └── health/
│   │       └── HealthController.java
│   ├── src/main/resources/
│   │   ├── application.yml              # 공통 설정
│   │   ├── application-dev.yml          # 개발 환경
│   │   ├── application-prod.yml         # 프로덕션
│   │   └── logback-spring.xml
│   └── build.gradle
│
├── module-blog/                     # 블로그 모듈
│   ├── src/main/java/com/portfolio/blog/module/blog/
│   │   ├── controller/
│   │   │   ├── PostController.java
│   │   │   ├── CommentController.java
│   │   │   ├── CategoryController.java
│   │   │   └── TagController.java
│   │   ├── service/
│   │   │   ├── PostService.java
│   │   │   ├── PostServiceImpl.java
│   │   │   ├── CommentService.java
│   │   │   └── CategoryService.java
│   │   ├── dto/
│   │   │   ├── PostCreateRequest.java
│   │   │   ├── PostUpdateRequest.java
│   │   │   ├── PostResponse.java
│   │   │   └── PostListResponse.java
│   │   └── mapper/
│   │       └── PostMapper.java          # Entity ↔ DTO 변환
│   └── build.gradle
│
├── module-user/                     # 사용자 모듈
│   ├── src/main/java/com/portfolio/blog/module/user/
│   │   ├── controller/
│   │   │   └── UserController.java
│   │   ├── service/
│   │   │   ├── UserService.java
│   │   │   └── UserServiceImpl.java
│   │   └── dto/
│   │       ├── UserProfileResponse.java
│   │       └── UserUpdateRequest.java
│   └── build.gradle
│
├── module-benchmark/                # 벤치마크 모듈
│   ├── src/main/java/com/portfolio/blog/module/benchmark/
│   │   ├── controller/
│   │   │   ├── ModelController.java
│   │   │   └── BenchmarkResultController.java
│   │   ├── service/
│   │   │   ├── ModelService.java
│   │   │   └── BenchmarkResultService.java
│   │   └── dto/
│   │       ├── ModelResponse.java
│   │       └── BenchmarkResultResponse.java
│   └── build.gradle
│
├── security/                        # 보안 모듈
│   ├── src/main/java/com/portfolio/blog/security/
│   │   ├── config/
│   │   │   ├── SecurityConfig.java      # Spring Security 설정
│   │   │   └── OAuth2Config.java
│   │   ├── jwt/
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── JwtExceptionFilter.java
│   │   ├── oauth/
│   │   │   ├── OAuth2UserService.java
│   │   │   └── OAuth2SuccessHandler.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   └── CustomUserDetailsService.java
│   │   └── dto/
│   │       ├── LoginRequest.java
│   │       ├── TokenResponse.java
│   │       └── OAuth2UserInfo.java
│   └── build.gradle
│
├── domain/                          # 도메인 모듈
│   ├── src/main/java/com/portfolio/blog/domain/
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Post.java
│   │   │   ├── Comment.java
│   │   │   ├── Category.java
│   │   │   ├── Tag.java
│   │   │   ├── Model.java
│   │   │   ├── BenchmarkResult.java
│   │   │   └── BaseEntity.java          # createdAt, updatedAt
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── PostRepository.java
│   │   │   ├── PostRepositoryCustom.java    # QueryDSL 인터페이스
│   │   │   ├── PostRepositoryImpl.java      # QueryDSL 구현
│   │   │   ├── CommentRepository.java
│   │   │   ├── CategoryRepository.java
│   │   │   ├── TagRepository.java
│   │   │   ├── ModelRepository.java
│   │   │   └── BenchmarkResultRepository.java
│   │   └── enums/
│   │       ├── UserRole.java
│   │       ├── PostStatus.java
│   │       └── ModelType.java
│   └── build.gradle
│
├── common/                          # 공통 모듈
│   ├── src/main/java/com/portfolio/blog/common/
│   │   ├── dto/
│   │   │   ├── ApiResponse.java         # 공통 응답 형식
│   │   │   ├── PageResponse.java        # 페이지네이션
│   │   │   └── ErrorCode.java
│   │   ├── exception/
│   │   │   ├── BusinessException.java
│   │   │   ├── EntityNotFoundException.java
│   │   │   ├── UnauthorizedException.java
│   │   │   └── InvalidInputException.java
│   │   ├── util/
│   │   │   ├── StringUtils.java
│   │   │   ├── DateUtils.java
│   │   │   └── EncryptUtils.java
│   │   └── constant/
│   │       └── Constants.java
│   └── build.gradle
│
├── build.gradle                     # 루트 빌드 파일
├── settings.gradle                  # 멀티 모듈 정의
└── gradle.properties
```

### 계층형 아키텍처 (각 모듈 내부)

```
Controller Layer (REST API 엔드포인트)
    ↓ DTO
Service Layer (비즈니스 로직)
    ↓ Entity
Repository Layer (데이터 접근)
    ↓
Database (PostgreSQL)
```

**계층별 역할**

| 계층 | 역할 | 반환 타입 | 주요 어노테이션 |
|------|------|-----------|----------------|
| **Controller** | HTTP 요청/응답 처리, 검증 | DTO (Response) | @RestController, @RequestMapping, @Valid |
| **Service** | 비즈니스 로직, 트랜잭션 관리 | DTO 또는 Entity | @Service, @Transactional |
| **Repository** | DB CRUD, 동적 쿼리 | Entity | @Repository, extends JpaRepository |

### 기술 스택 상세

| 기술 | 버전 | 선정 이유 |
|------|------|-----------|
| **Java** | 17 (LTS) | 한국 취업 시장 1위, Record/Pattern Matching, Virtual Thread 준비 |
| **Spring Boot** | 3.2.x | 국내 표준, Auto Configuration, 최신 Spring 6.x 기반 |
| **Spring Security** | 6.x | JWT Stateless 인증, OAuth2 통합, CSRF/CORS 제어 |
| **Spring Data JPA** | 3.x | ORM 생산성, Repository 추상화, Auditing |
| **QueryDSL** | 5.x | 타입 안전 동적 쿼리, 복잡한 JOIN 처리 |
| **PostgreSQL Driver** | 42.x | 최신 PostgreSQL 15+ 호환 |
| **Redis (Lettuce)** | 3.x | Spring Boot 기본 클라이언트, 비동기 지원 |
| **JWT (jjwt)** | 0.12.x | JWT 생성/검증, 클레임 관리 |
| **Lombok** | 1.18.x | 보일러플레이트 감소 (@Getter, @Builder 등) |
| **MapStruct** | 1.5.x | 컴파일 타임 DTO 매핑, 성능 우수 |
| **SpringDoc OpenAPI** | 2.x | Swagger UI 자동 생성, Spring Boot 3 호환 |

### 핵심 설계 결정 사항

#### 1. 멀티 모듈 구조 선택 이유
- **도메인 격리**: 블로그/벤치마크/사용자 로직 분리 → 단일 책임 원칙
- **재사용성**: 다른 프로젝트에서 module-user만 추출 가능
- **빌드 최적화**: 수정된 모듈만 재컴파일 (Gradle 증분 빌드)
- **팀 협업**: 모듈별 코드 오너십 명확 (미래 확장 고려)

#### 2. Spring Security + JWT 선택 이유
- **Stateless**: 세션 없이 JWT로 인증 → 수평 확장 용이
- **OAuth2 통합**: Google/GitHub 로그인 구현 간소화
- **표준 프레임워크**: 한국 기업 대부분 Spring Security 사용

#### 3. JPA + QueryDSL 조합 이유
- **JPA**: 기본 CRUD, 연관 관계 관리 자동화
- **QueryDSL**: 복잡한 검색(태그, 카테고리 필터링), 페이징, N+1 방지
- **네이티브 쿼리 회피**: JPQL/QueryDSL로 DB 독립성 유지

#### 4. Redis 캐싱 전략
```
• 포스트 목록 (30분 TTL)
• 모델 메타데이터 (1시간 TTL)
• 벤치마크 결과 (무제한, 데이터 변경 시 무효화)
• 세션 (7일 TTL)
```

#### 5. 트랜잭션 관리
- **@Transactional(readOnly = true)**: 조회 쿼리 → Dirty Checking 비활성화
- **@Transactional**: CUD 작업 → 자동 커밋/롤백
- **격리 수준**: READ_COMMITTED (PostgreSQL 기본)

### API 응답 형식 표준

```json
// 성공 응답
{
  "success": true,
  "data": { ... },
  "message": "조회 성공"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "포스트를 찾을 수 없습니다.",
    "field": "postId",
    "timestamp": "2026-01-07T10:30:00Z"
  }
}

// 페이징 응답
{
  "success": true,
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

### 보안 설정

```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: profile, email
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}

jwt:
  secret: ${JWT_SECRET}              # 환경변수로 주입
  access-token-expiration: 3600000   # 1시간
  refresh-token-expiration: 604800000 # 7일
```

### 데이터베이스 연결 설정

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/blog_db
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 20000

  jpa:
    hibernate:
      ddl-auto: validate           # 프로덕션: validate, 개발: update
    properties:
      hibernate:
        format_sql: true
        default_batch_fetch_size: 100  # N+1 방지

  data:
    redis:
      host: localhost
      port: 6379
      password: ${REDIS_PASSWORD}
```

---

## 2-3. AI API 모듈 구조

### 아키텍처 개요

**3계층 아키텍처 + 비동기 처리 + 싱글톤 패턴**을 채택하여 AI 추론, GPU 메트릭 수집, 모델 관리의 독립성과 성능을 확보합니다.

```
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Application                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           API Routes (Controller Layer)                │  │
│  │  /generate  /generate/stream  /benchmark/run  /metrics │  │
│  └───────────────────┬────────────────────────────────────┘  │
│                      ▼                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Services Layer (비즈니스 로직)             │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐         │  │
│  │  │ Benchmark  │ │ Generation │ │  Metrics   │         │  │
│  │  │  Service   │ │  Service   │ │  Service   │         │  │
│  │  └────────────┘ └────────────┘ └────────────┘         │  │
│  └───────────────────┬────────────────────────────────────┘  │
│                      ▼                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        Infrastructure Layer (외부 시스템 연동)         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐         │  │
│  │  │   Model    │ │   NVIDIA   │ │ TimescaleDB│         │  │
│  │  │  Manager   │ │    GPU     │ │  Client    │         │  │
│  │  │ (Singleton)│ │  Monitor   │ │            │         │  │
│  │  └─────┬──────┘ └────────────┘ └────────────┘         │  │
│  │        │                                                │  │
│  │        ├─ LlamaCppClient (GGUF)                        │  │
│  │        └─ TransformersClient (Safetensors)            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 디렉토리 구조

```
ai-api/
├── app/
│   ├── main.py                      # FastAPI 앱 진입점
│   │   # • CORS, 미들웨어, 라우터 등록
│   │   # • lifespan 이벤트 (startup/shutdown)
│   │
│   ├── api/                         # API Routes (Controller)
│   │   ├── routes/
│   │   │   ├── generate.py
│   │   │   │   # POST /api/v1/generate (동기 생성)
│   │   │   │   # POST /api/v1/generate/stream (SSE 스트리밍)
│   │   │   ├── benchmark.py
│   │   │   │   # POST /api/v1/benchmark/run
│   │   │   │   # GET  /api/v1/benchmark/{id}/status
│   │   │   │   # GET  /api/v1/benchmark/{id}/results
│   │   │   ├── models.py
│   │   │   │   # GET /api/v1/models (모델 목록)
│   │   │   │   # GET /api/v1/models/{id} (모델 상세)
│   │   │   └── metrics.py
│   │   │       # GET /api/v1/metrics/gpu/current
│   │   │       # GET /api/v1/metrics/benchmark/{id}
│   │   └── deps.py                  # Dependency Injection
│   │       # • get_model_manager()
│   │       # • get_gpu_monitor()
│   │       # • get_timescale_client()
│   │
│   ├── services/                    # Services Layer (비즈니스 로직)
│   │   ├── benchmark_service.py
│   │   │   # run_benchmark(model_id, config)
│   │   │   #   - 모델 로드
│   │   │   #   - GPU 메트릭 수집 시작 (백그라운드)
│   │   │   #   - 추론 실행 (TPS, TTFT 측정)
│   │   │   #   - 결과 TimescaleDB 저장
│   │   │   # get_benchmark_status(benchmark_id)
│   │   │   # get_benchmark_results(benchmark_id)
│   │   │
│   │   ├── generation_service.py
│   │   │   # generate_text(prompt, model_id, params)
│   │   │   #   - 모델 로드 (캐시 확인)
│   │   │   #   - 동기 생성
│   │   │   # stream_generate(prompt, model_id, params)
│   │   │   #   - 비동기 제너레이터로 토큰 반환
│   │   │
│   │   └── metrics_service.py
│   │       # collect_and_save_metrics(benchmark_id)
│   │       #   - 주기적 GPU 메트릭 수집 (100ms 간격)
│   │       #   - TimescaleDB 배치 삽입
│   │       # get_metrics_history(benchmark_id, time_range)
│   │
│   ├── infrastructure/              # Infrastructure Layer
│   │   ├── llm/
│   │   │   ├── model_manager.py     # 싱글톤 모델 관리자
│   │   │   │   class ModelManager:
│   │   │   │       # 메서드:
│   │   │   │       # - load_model(model_id) -> ModelClient
│   │   │   │       # - get_loaded_model(model_id) -> ModelClient | None
│   │   │   │       # - unload_model(model_id)
│   │   │   │       # - get_all_models_info() -> List[ModelInfo]
│   │   │   │       #
│   │   │   │       # 내부 상태:
│   │   │   │       # - _instances: Dict[str, ModelClient]
│   │   │   │       # - _lru_cache: OrderedDict (최대 2개)
│   │   │   │       # - _lock: asyncio.Lock (동시성 제어)
│   │   │   │
│   │   │   ├── clients/
│   │   │   │   ├── base.py          # BaseModelClient (추상 클래스)
│   │   │   │   │   # 메서드:
│   │   │   │   │   # - generate(prompt, **params) -> str
│   │   │   │   │   # - stream_generate(prompt, **params) -> AsyncGenerator
│   │   │   │   │   # - unload()
│   │   │   │   │   # - get_memory_usage() -> int
│   │   │   │   │
│   │   │   │   ├── llama_cpp_client.py  # GGUF 모델 클라이언트
│   │   │   │   │   # llama-cpp-python 래퍼
│   │   │   │   │   # n_gpu_layers 자동 설정
│   │   │   │   │
│   │   │   │   └── transformers_client.py  # Safetensors 클라이언트
│   │   │   │       # transformers.AutoModelForCausalLM 래퍼
│   │   │   │       # torch.cuda.is_available() 확인
│   │   │   │
│   │   │   └── model_config.py      # 모델 메타데이터
│   │   │       # MODEL_REGISTRY = {
│   │   │       #   "llama-3.1-8b-q4": {
│   │   │       #     "path": "/models/llama-3.1-8b.Q4_K_M.gguf",
│   │   │       #     "type": "gguf",
│   │   │       #     "client": "llama_cpp",
│   │   │       #     "context_length": 8192,
│   │   │       #   },
│   │   │       #   ...
│   │   │       # }
│   │   │
│   │   ├── monitoring/
│   │   │   └── nvidia_gpu_monitor.py
│   │   │       class NvidiaGPUMonitor:
│   │   │           # 메서드:
│   │   │           # - get_current_metrics() -> GPUMetrics
│   │   │           # - start_monitoring(callback, interval_ms=100)
│   │   │           # - stop_monitoring()
│   │   │           #
│   │   │           # pynvml API 래퍼:
│   │   │           # - nvmlDeviceGetTemperature()
│   │   │           # - nvmlDeviceGetMemoryInfo()
│   │   │           # - nvmlDeviceGetUtilizationRates()
│   │   │           # - nvmlDeviceGetPowerUsage()
│   │   │
│   │   └── database/
│   │       ├── timescale_client.py
│   │       │   # psycopg (asyncio) 기반
│   │       │   # - insert_gpu_metrics(benchmark_id, metrics_list)
│   │       │   # - insert_inference_log(log_data)
│   │       │   # - get_benchmark_results(benchmark_id)
│   │       │   # - get_metrics_timeseries(benchmark_id, start, end)
│   │       │
│   │       └── redis_client.py
│   │           # - set_benchmark_status(benchmark_id, status)
│   │           # - get_benchmark_status(benchmark_id)
│   │           # - cache_model_metadata(model_id, data, ttl=3600)
│   │
│   ├── core/                        # 핵심 설정 및 유틸
│   │   ├── config.py                # Pydantic Settings
│   │   │   class Settings:
│   │   │       # - MODELS_DIR: str
│   │   │       # - TIMESCALE_URL: str
│   │   │       # - REDIS_URL: str
│   │   │       # - MAX_LOADED_MODELS: int = 2
│   │   │       # - GPU_MONITORING_INTERVAL_MS: int = 100
│   │   │
│   │   ├── logging.py               # 구조화된 로깅 설정
│   │   └── lifespan.py              # Startup/Shutdown 이벤트
│   │       # - GPU 초기화
│   │       # - TimescaleDB 연결 풀 생성
│   │       # - Redis 연결
│   │       # - 모델 사전 로딩 (선택)
│   │
│   ├── models/                      # Pydantic 모델 (DTO)
│   │   ├── schemas/
│   │   │   ├── generate.py
│   │   │   │   # GenerateRequest (prompt, model_id, max_tokens, temperature, ...)
│   │   │   │   # GenerateResponse (text, tokens_generated, time_elapsed)
│   │   │   │
│   │   │   ├── benchmark.py
│   │   │   │   # BenchmarkRunRequest (model_id, test_prompts, config)
│   │   │   │   # BenchmarkConfig (num_iterations, warmup_iterations)
│   │   │   │   # BenchmarkResult (avg_tps, ttft_avg, memory_peak)
│   │   │   │
│   │   │   └── metrics.py
│   │   │       # GPUMetrics (timestamp, temperature, memory_used, ...)
│   │   │       # InferenceLog (model_id, prompt_len, time_to_first_token, ...)
│   │   │
│   │   └── responses/
│   │       └── api_response.py
│   │           # SuccessResponse[T]
│   │           # ErrorResponse
│   │
│   ├── utils/
│   │   ├── exceptions.py            # 커스텀 예외
│   │   │   # ModelNotFoundError
│   │   │   # GPUOutOfMemoryError
│   │   │   # InferenceTimeoutError
│   │   │   # BenchmarkNotFoundError
│   │   │
│   │   ├── validators.py
│   │   │   # validate_prompt(prompt: str)
│   │   │   # validate_generation_params(params: dict)
│   │   │
│   │   └── time_utils.py
│   │       # measure_time_to_first_token()
│   │       # calculate_tokens_per_second()
│   │
│   └── middleware/
│       ├── error_handler.py
│       │   # GPUOutOfMemoryError -> 507 Insufficient Storage
│       │   # InferenceTimeoutError -> 504 Gateway Timeout
│       │   # ModelNotFoundError -> 404 Not Found
│       │
│       └── request_logger.py
│           # 요청/응답 로깅 (추론 시간, 모델 ID, 토큰 수)
│
├── models/                          # LLM 모델 파일 저장소
│   ├── llama-3.1-8b.Q4_K_M.gguf
│   ├── mistral-7b.Q5_K_M.gguf
│   └── gpt2-medium/                 # Safetensors
│       ├── config.json
│       ├── model.safetensors
│       └── tokenizer.json
│
├── scripts/
│   ├── download_models.py           # HuggingFace Hub에서 모델 다운로드
│   ├── init_timescale.py            # TimescaleDB 스키마 초기화
│   └── benchmark_runner.py          # CLI 벤치마크 도구
│
├── tests/
│   ├── unit/
│   │   ├── test_model_manager.py
│   │   ├── test_llama_cpp_client.py
│   │   └── test_gpu_monitor.py
│   └── integration/
│       ├── test_benchmark_flow.py
│       └── test_streaming.py
│
├── Dockerfile
├── docker-compose.yml               # AI API + TimescaleDB + Redis
├── requirements.txt
├── pyproject.toml                   # Poetry 설정
└── .env.example
```

### 3계층 아키텍처 상세

#### Layer 1: API Routes (Controller)
**역할**: HTTP 요청 처리, 입력 검증, 응답 직렬화

```python
# api/routes/generate.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/v1/generate", tags=["Generation"])

@router.post("")
async def generate_text(
    request: GenerateRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """동기 텍스트 생성 API"""
    result = await generation_service.generate_text(
        prompt=request.prompt,
        model_id=request.model_id,
        params=request.to_params()
    )
    return SuccessResponse(data=result)

@router.post("/stream")
async def stream_generate_text(
    request: GenerateRequest,
    generation_service: GenerationService = Depends(get_generation_service)
):
    """SSE 기반 스트리밍 생성 API"""
    async def event_stream():
        async for token in generation_service.stream_generate(
            prompt=request.prompt,
            model_id=request.model_id,
            params=request.to_params()
        ):
            yield f"data: {token}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

#### Layer 2: Services (비즈니스 로직)
**역할**: 도메인 로직, 트랜잭션 관리, Infrastructure 계층 조율

```python
# services/benchmark_service.py
import asyncio
from typing import Dict
from infrastructure.llm.model_manager import ModelManager
from infrastructure.monitoring.nvidia_gpu_monitor import NvidiaGPUMonitor
from infrastructure.database.timescale_client import TimescaleClient

class BenchmarkService:
    def __init__(
        self,
        model_manager: ModelManager,
        gpu_monitor: NvidiaGPUMonitor,
        timescale: TimescaleClient
    ):
        self.model_manager = model_manager
        self.gpu_monitor = gpu_monitor
        self.timescale = timescale
        self.running_benchmarks: Dict[str, asyncio.Task] = {}

    async def run_benchmark(
        self,
        benchmark_id: str,
        model_id: str,
        config: BenchmarkConfig
    ):
        """벤치마크 실행 (비동기)"""
        # 1. 모델 로드
        model_client = await self.model_manager.load_model(model_id)

        # 2. GPU 메트릭 수집 시작
        metrics_buffer = []

        def metrics_callback(metrics: GPUMetrics):
            metrics_buffer.append(metrics)

        self.gpu_monitor.start_monitoring(
            callback=metrics_callback,
            interval_ms=100
        )

        try:
            # 3. Warmup iterations
            for _ in range(config.warmup_iterations):
                await model_client.generate(config.warmup_prompt)

            # 4. 실제 벤치마크 실행
            results = []
            for prompt in config.test_prompts:
                start_time = time.perf_counter()

                # TTFT (Time To First Token) 측정
                ttft = None
                tokens_generated = 0

                async for token in model_client.stream_generate(prompt):
                    if ttft is None:
                        ttft = time.perf_counter() - start_time
                    tokens_generated += 1

                elapsed = time.perf_counter() - start_time
                tps = tokens_generated / elapsed if elapsed > 0 else 0

                results.append({
                    "prompt": prompt,
                    "tokens_generated": tokens_generated,
                    "time_elapsed": elapsed,
                    "tokens_per_second": tps,
                    "time_to_first_token": ttft
                })

            # 5. 결과 집계
            avg_tps = sum(r["tokens_per_second"] for r in results) / len(results)
            avg_ttft = sum(r["time_to_first_token"] for r in results) / len(results)
            memory_peak = max(m.memory_used for m in metrics_buffer)

            benchmark_result = BenchmarkResult(
                benchmark_id=benchmark_id,
                model_id=model_id,
                avg_tokens_per_second=avg_tps,
                avg_time_to_first_token=avg_ttft,
                memory_peak_bytes=memory_peak,
                detailed_results=results
            )

            # 6. TimescaleDB 저장
            await self.timescale.insert_benchmark_result(benchmark_result)
            await self.timescale.insert_gpu_metrics(benchmark_id, metrics_buffer)

            return benchmark_result

        finally:
            # 7. 모니터링 중지
            self.gpu_monitor.stop_monitoring()
```

#### Layer 3: Infrastructure (외부 시스템 연동)
**역할**: 모델 관리, GPU 모니터링, DB 연결

##### 3-1. ModelManager (싱글톤 + LRU 캐싱)

```python
# infrastructure/llm/model_manager.py
import asyncio
from collections import OrderedDict
from typing import Dict, Optional
from .clients.base import BaseModelClient
from .clients.llama_cpp_client import LlamaCppClient
from .clients.transformers_client import TransformersClient
from .model_config import MODEL_REGISTRY

class ModelManager:
    _instance = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "_initialized"):
            self._instances: Dict[str, BaseModelClient] = {}
            self._lru_cache: OrderedDict = OrderedDict()
            self._max_loaded = 2  # VRAM 절약
            self._initialized = True

    async def load_model(self, model_id: str) -> BaseModelClient:
        """모델 로드 (캐시 확인 -> 로드 -> LRU 관리)"""
        async with self._lock:
            # 캐시 히트
            if model_id in self._instances:
                self._lru_cache.move_to_end(model_id)  # LRU 갱신
                return self._instances[model_id]

            # 캐시 미스 - 새 모델 로드
            if model_id not in MODEL_REGISTRY:
                raise ModelNotFoundError(f"Model '{model_id}' not found in registry")

            # LRU 정책: 캐시 초과 시 가장 오래된 모델 언로드
            if len(self._instances) >= self._max_loaded:
                oldest_id, oldest_client = self._lru_cache.popitem(last=False)
                await oldest_client.unload()
                del self._instances[oldest_id]
                logger.info(f"Unloaded model '{oldest_id}' (LRU eviction)")

            # 새 클라이언트 생성
            model_config = MODEL_REGISTRY[model_id]

            if model_config["client"] == "llama_cpp":
                client = LlamaCppClient(model_config)
            elif model_config["client"] == "transformers":
                client = TransformersClient(model_config)
            else:
                raise ValueError(f"Unknown client type: {model_config['client']}")

            await client.load()

            self._instances[model_id] = client
            self._lru_cache[model_id] = None  # LRU 추가

            logger.info(f"Loaded model '{model_id}' ({model_config['type']})")
            return client

    async def unload_model(self, model_id: str):
        """수동 모델 언로드"""
        async with self._lock:
            if model_id in self._instances:
                await self._instances[model_id].unload()
                del self._instances[model_id]
                del self._lru_cache[model_id]

    def get_all_models_info(self) -> list:
        """등록된 모든 모델 메타데이터 반환"""
        return [
            {
                "model_id": model_id,
                "type": config["type"],
                "context_length": config["context_length"],
                "loaded": model_id in self._instances
            }
            for model_id, config in MODEL_REGISTRY.items()
        ]
```

##### 3-2. LlamaCppClient (GGUF 모델 클라이언트)

```python
# infrastructure/llm/clients/llama_cpp_client.py
from llama_cpp import Llama
from .base import BaseModelClient

class LlamaCppClient(BaseModelClient):
    def __init__(self, config: dict):
        self.config = config
        self.llm: Optional[Llama] = None

    async def load(self):
        """llama.cpp 모델 로드"""
        # n_gpu_layers 자동 설정 (GPU 사용 시 전체 레이어 오프로드)
        n_gpu_layers = -1 if torch.cuda.is_available() else 0

        self.llm = Llama(
            model_path=self.config["path"],
            n_ctx=self.config["context_length"],
            n_gpu_layers=n_gpu_layers,
            verbose=False
        )

    async def generate(self, prompt: str, **params) -> str:
        """동기 생성"""
        output = self.llm(
            prompt,
            max_tokens=params.get("max_tokens", 512),
            temperature=params.get("temperature", 0.7),
            top_p=params.get("top_p", 0.9),
            stop=params.get("stop", [])
        )
        return output["choices"][0]["text"]

    async def stream_generate(self, prompt: str, **params):
        """스트리밍 생성 (AsyncGenerator)"""
        stream = self.llm(
            prompt,
            max_tokens=params.get("max_tokens", 512),
            temperature=params.get("temperature", 0.7),
            stream=True
        )

        for chunk in stream:
            token = chunk["choices"][0]["text"]
            yield token

    async def unload(self):
        """모델 언로드"""
        if self.llm:
            del self.llm
            self.llm = None
            # CUDA 캐시 클리어
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

    def get_memory_usage(self) -> int:
        """현재 모델 메모리 사용량 (bytes)"""
        if self.llm is None:
            return 0
        # llama.cpp는 메모리 사용량 API가 없으므로 대략적으로 계산
        return self.config.get("estimated_memory", 8 * 1024 * 1024 * 1024)  # 8GB
```

##### 3-3. NvidiaGPUMonitor (pynvml 래퍼)

```python
# infrastructure/monitoring/nvidia_gpu_monitor.py
import asyncio
import pynvml
from datetime import datetime
from models.schemas.metrics import GPUMetrics

class NvidiaGPUMonitor:
    def __init__(self, device_index: int = 0):
        pynvml.nvmlInit()
        self.handle = pynvml.nvmlDeviceGetHandleByIndex(device_index)
        self.monitoring_task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

    def get_current_metrics(self) -> GPUMetrics:
        """현재 GPU 메트릭 수집"""
        mem_info = pynvml.nvmlDeviceGetMemoryInfo(self.handle)
        util_rates = pynvml.nvmlDeviceGetUtilizationRates(self.handle)

        return GPUMetrics(
            timestamp=datetime.utcnow(),
            temperature=pynvml.nvmlDeviceGetTemperature(self.handle, pynvml.NVML_TEMPERATURE_GPU),
            memory_used=mem_info.used,
            memory_total=mem_info.total,
            utilization=util_rates.gpu,
            power_usage=pynvml.nvmlDeviceGetPowerUsage(self.handle) / 1000  # mW -> W
        )

    def start_monitoring(self, callback, interval_ms: int = 100):
        """주기적 메트릭 수집 시작"""
        self._stop_event.clear()

        async def monitor_loop():
            while not self._stop_event.is_set():
                metrics = self.get_current_metrics()
                callback(metrics)
                await asyncio.sleep(interval_ms / 1000)

        self.monitoring_task = asyncio.create_task(monitor_loop())

    def stop_monitoring(self):
        """모니터링 중지"""
        self._stop_event.set()
        if self.monitoring_task:
            self.monitoring_task.cancel()

    def __del__(self):
        pynvml.nvmlShutdown()
```

### TimescaleDB 스키마 설계

```sql
-- 1. GPU 메트릭 (Hypertable)
CREATE TABLE gpu_metrics (
    time TIMESTAMPTZ NOT NULL,
    benchmark_id VARCHAR(50),
    temperature FLOAT,
    memory_used BIGINT,
    memory_total BIGINT,
    utilization FLOAT,
    power_usage FLOAT
);

SELECT create_hypertable('gpu_metrics', 'time');

-- 연속 집계: 1분 단위 평균
CREATE MATERIALIZED VIEW gpu_metrics_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    benchmark_id,
    AVG(temperature) AS avg_temperature,
    MAX(memory_used) AS max_memory,
    AVG(utilization) AS avg_utilization,
    AVG(power_usage) AS avg_power
FROM gpu_metrics
GROUP BY bucket, benchmark_id;

-- 2. 추론 로그 (Hypertable)
CREATE TABLE inference_logs (
    time TIMESTAMPTZ NOT NULL,
    model_id VARCHAR(100),
    prompt_length INT,
    generated_tokens INT,
    tokens_per_second FLOAT,
    time_to_first_token FLOAT,
    total_time FLOAT
);

SELECT create_hypertable('inference_logs', 'time');

-- 3. 벤치마크 결과 (일반 테이블)
CREATE TABLE benchmark_history (
    benchmark_id VARCHAR(50) PRIMARY KEY,
    model_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    avg_tokens_per_second FLOAT,
    avg_time_to_first_token FLOAT,
    memory_peak_bytes BIGINT,
    config JSONB,  -- BenchmarkConfig 저장
    results JSONB  -- 상세 결과 저장
);

-- 인덱스
CREATE INDEX idx_benchmark_model ON benchmark_history(model_id);
CREATE INDEX idx_inference_model ON inference_logs(model_id, time DESC);
```

### API 엔드포인트 상세

#### 1. POST /api/v1/generate (동기 생성)
```json
// Request
{
  "prompt": "Explain quantum computing in simple terms:",
  "model_id": "llama-3.1-8b-q4",
  "max_tokens": 512,
  "temperature": 0.7,
  "top_p": 0.9
}

// Response
{
  "success": true,
  "data": {
    "text": "Quantum computing is...",
    "tokens_generated": 127,
    "time_elapsed": 3.42,
    "tokens_per_second": 37.1
  }
}
```

#### 2. POST /api/v1/generate/stream (SSE 스트리밍)
```bash
# curl 예시
curl -N -X POST http://localhost:8000/api/v1/generate/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "model_id": "llama-3.1-8b-q4"}'

# SSE 응답
data: Quantum
data:  computing
data:  is
data:  a
...
```

#### 3. POST /api/v1/benchmark/run (벤치마크 실행)
```json
// Request
{
  "model_id": "llama-3.1-8b-q4",
  "config": {
    "test_prompts": [
      "Write a short story about AI:",
      "Explain machine learning:"
    ],
    "warmup_iterations": 3,
    "warmup_prompt": "Hello, world!"
  }
}

// Response
{
  "success": true,
  "data": {
    "benchmark_id": "bench_20260107_abc123",
    "status": "started"
  }
}
```

#### 4. GET /api/v1/benchmark/{id}/results (벤치마크 결과 조회)
```json
{
  "success": true,
  "data": {
    "benchmark_id": "bench_20260107_abc123",
    "model_id": "llama-3.1-8b-q4",
    "status": "completed",
    "avg_tokens_per_second": 42.3,
    "avg_time_to_first_token": 0.23,
    "memory_peak_mb": 7845,
    "detailed_results": [...]
  }
}
```

### 기술 스택 상세

| 기술 | 버전 | 선정 이유 |
|------|------|-----------|
| **Python** | 3.11+ | AI 생태계 표준, async/await 성능 개선, PyTorch 호환 |
| **FastAPI** | 0.109+ | 고성능 ASGI, 자동 OpenAPI 문서화, Pydantic 네이티브 통합 |
| **Uvicorn** | 0.27+ | uvloop 기반 ASGI 서버, 높은 동시성 처리 |
| **Pydantic** | 2.x | 런타임 타입 검증, Settings 관리, JSON Schema 자동 생성 |
| **llama-cpp-python** | 0.2.x | GGUF 형식 지원, CPU/GPU 하이브리드 추론, Metal(M1) 지원 |
| **transformers** | 4.x | HuggingFace 모델 허브 통합, AutoModel 자동 추론 |
| **torch** | 2.x | GPU 가속 (CUDA), VRAM 관리, Mixed Precision |
| **pynvml** | 12.x | NVIDIA Management Library 래퍼, 실시간 GPU 메트릭 |
| **psycopg[binary,pool]** | 3.x | PostgreSQL 비동기 드라이버, 연결 풀 관리 |
| **redis[asyncio]** | 5.x | 비동기 Redis 클라이언트, Pub/Sub 지원 |
| **httpx** | 0.26+ | Main API 호출용 비동기 HTTP 클라이언트 |

### 핵심 설계 결정 사항

#### 1. 왜 FastAPI를 선택했는가?

**성능**
- ASGI 기반 비동기 처리로 동시 요청 처리 (Uvicorn + uvloop)
- GPU 메트릭 수집과 추론을 병렬 실행 가능

**개발 생산성**
- Pydantic 통합으로 자동 요청 검증
- Swagger UI 자동 생성 (/docs)
- Dependency Injection 패턴 내장

**AI 생태계 호환**
- Python 표준 프레임워크 (PyTorch, Transformers와 통합 용이)
- 취업 시장에서 AI API 개발 시 가장 많이 사용

#### 2. 왜 llama.cpp와 Transformers를 같이 쓰는가?

**llama.cpp (GGUF 모델)**
- CPU/GPU 하이브리드 추론 (n_gpu_layers 조절)
- 양자화 모델 (Q4_K_M, Q5_K_M) → 메모리 효율
- Llama, Mistral 등 주요 LLM 지원

**Transformers (Safetensors 모델)**
- HuggingFace Hub 직접 연동
- GPU 전용 고성능 추론
- BERT, GPT 등 다양한 아키텍처 지원

**전략**
- GB10 GPU 환경에서 GGUF 모델 우선 사용 (VRAM 절약)
- Safetensors는 특정 모델(GPT-2 등) 데모용
- **포트폴리오 관점**: 다양한 추론 엔진 경험 어필

#### 3. 왜 TimescaleDB를 사용하는가?

**시계열 데이터 최적화**
- GPU 메트릭은 100ms 간격으로 수집 → 대량 시계열 데이터
- 자동 파티셔닝, 압축 → 장기 데이터 저장 효율
- 연속 집계(Continuous Aggregate) → 실시간 대시보드

**PostgreSQL 호환**
- 기존 SQL 지식 활용 가능
- Main API와 동일한 DB 엔진 (psycopg 공유)
- JOIN 쿼리로 벤치마크 결과와 메트릭 연결

**대안 대비 장점**
- InfluxDB: Go 기반, 한국 커뮤니티 작음
- Prometheus: 메트릭 수집 특화, 범용 쿼리 약함
- TimescaleDB: SQL 표준, 범용성 높음

#### 4. 왜 Redis 캐싱이 필요한가?

**캐싱 대상**
```python
# 1. 모델 메타데이터 (1시간 TTL)
# - MODEL_REGISTRY 데이터
# - 로드 시간이 긴 모델 설정

# 2. 벤치마크 진행 상태 (완료 시 삭제)
# - 프론트엔드 폴링용 (5초 간격)
# - "started" | "running" | "completed" | "failed"

# 3. 실시간 GPU 메트릭 버퍼 (5초 TTL)
# - 100ms 간격 메트릭을 5초마다 집계
# - TimescaleDB 배치 삽입으로 부하 감소
```

**성능 개선**
- 모델 메타데이터 조회 시 MODEL_REGISTRY 파일 I/O 회피
- 벤치마크 상태 폴링 시 DB 쿼리 부하 감소

#### 5. 싱글톤 + LRU 캐싱 패턴을 선택한 이유

**싱글톤 패턴**
- ModelManager는 전역 인스턴스 (중복 로드 방지)
- asyncio.Lock으로 동시성 제어 (Race Condition 방지)

**LRU 캐싱**
- VRAM 제약: GB10 GPU는 최대 2개 모델만 로드 가능
- 가장 오래된 모델 자동 언로드 (OrderedDict)
- 캐시 히트 시 move_to_end()로 우선순위 갱신

**코드 예시**
```python
# 시나리오: 3개 모델 순차 로드 (max_loaded=2)
await model_manager.load_model("llama-3.1-8b")    # Cache: [llama-3.1-8b]
await model_manager.load_model("mistral-7b")       # Cache: [llama-3.1-8b, mistral-7b]
await model_manager.load_model("gpt2-medium")      # Cache: [mistral-7b, gpt2-medium] (llama 언로드)
await model_manager.load_model("mistral-7b")       # Cache: [gpt2-medium, mistral-7b] (캐시 히트, 순서만 변경)
```

### 비동기 처리 전략

#### 1. BackgroundTasks (벤치마크)
```python
@router.post("/benchmark/run")
async def run_benchmark(
    request: BenchmarkRunRequest,
    background_tasks: BackgroundTasks
):
    benchmark_id = generate_benchmark_id()

    # 백그라운드 작업 등록 (논블로킹)
    background_tasks.add_task(
        benchmark_service.run_benchmark,
        benchmark_id,
        request.model_id,
        request.config
    )

    return {"benchmark_id": benchmark_id, "status": "started"}
```

#### 2. Server-Sent Events (SSE) 스트리밍
```python
@router.post("/generate/stream")
async def stream_generate(request: GenerateRequest):
    async def event_generator():
        async for token in generation_service.stream_generate(
            prompt=request.prompt,
            model_id=request.model_id
        ):
            yield f"data: {token}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

#### 3. 주기적 메트릭 수집 (asyncio.create_task)
```python
# services/benchmark_service.py
metrics_buffer = []

def metrics_callback(metrics: GPUMetrics):
    metrics_buffer.append(metrics)

gpu_monitor.start_monitoring(
    callback=metrics_callback,
    interval_ms=100
)

# 벤치마크 완료 후
await timescale.insert_gpu_metrics(benchmark_id, metrics_buffer)
```

### 에러 처리 전략

```python
# middleware/error_handler.py
from fastapi import Request, status
from fastapi.responses import JSONResponse

@app.exception_handler(GPUOutOfMemoryError)
async def gpu_oom_handler(request: Request, exc: GPUOutOfMemoryError):
    return JSONResponse(
        status_code=507,  # Insufficient Storage
        content={
            "success": False,
            "error": {
                "code": "GPU_OUT_OF_MEMORY",
                "message": "GPU VRAM 부족. 다른 모델을 언로드 후 재시도하세요.",
                "suggestion": "현재 로드된 모델을 확인하세요: GET /api/v1/models"
            }
        }
    )

@app.exception_handler(InferenceTimeoutError)
async def timeout_handler(request: Request, exc: InferenceTimeoutError):
    return JSONResponse(
        status_code=504,  # Gateway Timeout
        content={
            "success": False,
            "error": {
                "code": "INFERENCE_TIMEOUT",
                "message": f"추론이 {exc.timeout}초 내에 완료되지 않았습니다.",
                "suggestion": "max_tokens를 줄이거나 prompt 길이를 조정하세요."
            }
        }
    )

@app.exception_handler(ModelNotFoundError)
async def model_not_found_handler(request: Request, exc: ModelNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": {
                "code": "MODEL_NOT_FOUND",
                "message": str(exc),
                "suggestion": "등록된 모델 목록: GET /api/v1/models"
            }
        }
    )
```

---

## 모듈 간 통신 프로토콜

### Frontend ↔ Main API

| 엔드포인트 | 메서드 | 용도 | 인증 |
|-----------|--------|------|------|
| `/api/v1/auth/login` | POST | 로그인 | No |
| `/api/v1/auth/refresh` | POST | 토큰 갱신 | No |
| `/api/v1/posts` | GET | 포스트 목록 | No |
| `/api/v1/posts/{id}` | GET | 포스트 상세 | No |
| `/api/v1/posts` | POST | 포스트 작성 | Yes (JWT) |
| `/api/v1/models` | GET | 모델 메타 조회 | No |
| `/api/v1/benchmark/results` | GET | 벤치마크 결과 | No |

### Main API ↔ AI API

| 엔드포인트 | 메서드 | 용도 | 호출 시점 |
|-----------|--------|------|----------|
| `/api/v1/models` | GET | 모델 목록 동기화 | 초기 로딩 / 정기 동기화 |
| `/api/v1/benchmark/run` | POST | 벤치마크 실행 요청 | 관리자 트리거 |
| `/api/v1/benchmark/{id}/status` | GET | 벤치마크 진행 상태 | 폴링 (5초 간격) |

### Frontend ↔ AI API (직접 통신)

| 엔드포인트 | 메서드 | 용도 | 비고 |
|-----------|--------|------|------|
| `/api/v1/inference/stream` | POST | 실시간 텍스트 생성 | SSE (Server-Sent Events) |
| `/api/v1/metrics/{benchmark_id}` | GET | 실시간 GPU 메트릭 | WebSocket (선택) |

---

## 다음 단계

이제 **Depth 3: 모듈 내부 설계**로 진행할 수 있습니다:
- 3-1. 주요 화면별 컴포넌트 트리 (Frontend)
- 3-2. API 엔드포인트 상세 명세 (Main API)
- 3-3. 벤치마크 실행 파이프라인 (AI API)
- 3-4. DB 스키마 및 ERD

또는 **Depth 2 검토 및 피드백**을 먼저 진행해주세요.

---

## 참고 자료

- [Frontend 모듈 아키텍처 패턴](https://martinfowler.com/articles/micro-frontends.html)
- [Spring Boot Multi-Module Best Practices](https://spring.io/guides/gs/multi-module/)
- [FastAPI 비동기 처리 가이드](https://fastapi.tiangolo.com/async/)
- [TimescaleDB 시계열 데이터 모델링](https://docs.timescale.com/timescaledb/latest/)
