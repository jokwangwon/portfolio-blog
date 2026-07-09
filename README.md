# 포트폴리오 포털 (Portfolio Portal)

> Dell Pro Max GB10 기반 로컬 AI 벤치마크를 포함한 3D 인터랙티브 포트폴리오 플랫폼

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-240%20passing-brightgreen.svg)](#테스트)

---

## 📋 목차

- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [배포](#배포)
- [라이선스](#라이선스)

---

## 프로젝트 소개

2026년 포트폴리오용 플랫폼 프로젝트입니다. 중앙 포털에서 블로그, AI 벤치마크 등 독립 서비스들을 통합 관리합니다.

### 핵심 차별화 요소

1. **3D 인터랙티브 UI** — React Three Fiber 기반 랜딩 + Glassmorphism 라이트/다크 디자인 시스템
2. **Pixel Office** — 실제 GitHub 활동을 픽셀 아트 가상 사무실로 시각화 (공개 페이지 + 관리자 실시간 SSE)
3. **멀티 백엔드 MSA** — Spring Boot(포털) + FastAPI(AI 서비스), Service Registry 패턴
4. **로컬 AI 벤치마크** — GB10에서 실행한 LLM 성능 측정 (🚧 개발 예정)

### 블로그 콘텐츠

- 초보 개발자를 위한 알고리즘 학습 자료
- 프로그래밍 언어 학습 기록 (Python, TypeScript, React, Rust, Java, Spring)
- 개인 프로젝트 소개 (PhotoToon, Project-M 등)
- Dell Pro Max GB10 사용 경험 및 트러블슈팅
- AI 모델별 벤치마크 및 성능 평가 (그래프 시각화)

---

## 주요 기능

### 블로그
- ✅ 리치 에디터 (Tiptap WYSIWYG — 슬래시 명령, 표, 코드 하이라이팅, 수식(KaTeX), Mermaid 다이어그램, 이미지)
- ✅ 자동 저장 + 초안 복구, 마크다운 소스 토글
- ✅ AI 요약 (로컬 Ollama / Gemini 연동 excerpt 자동 생성)
- ✅ 카테고리/태그 분류, 검색, 페이지네이션
- ✅ 댓글(대댓글)/좋아요/조회수

### 포트폴리오 랜딩 & 디자인
- ✅ 3D Hero (React Three Fiber) + 스크롤 애니메이션 (framer-motion)
- ✅ Glassmorphism 디자인 시스템 — 라이트(Warm Glass)/다크(Cool Glass) 테마
- ✅ 7개 섹션 (Hero, About, Tech Stack, Projects, Experience, Blog Preview, Contact)

### Pixel Office
- ✅ GitHub 활동 → 픽셀 아트 가상 사무실 시각화 (실제 스프라이트, BFS 길찾기, 상태 머신)
- ✅ 관리자 페이지: 개발 도구 Hook 이벤트 실시간 SSE 스트리밍
- ✅ 줌/팬, 에이전트 클릭 상세 패널

### AI 모델 벤치마크 (🚧 개발 예정)
- 모델 리스트, 추론 테스트, 성능 메트릭 시각화 (Tokens/sec, VRAM)

### 인증/인가
- ✅ JWT 기반 인증 (Refresh Token Rotation, HttpOnly Cookie)
- ✅ 소셜 로그인 (Google, GitHub)
- ✅ 역할 기반 권한 관리 (ADMIN, USER)

---

## 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, shadcn/ui (Base UI)
- **3D / 애니메이션**: React Three Fiber + drei, framer-motion
- **에디터**: Tiptap 3 (lowlight, KaTeX, Mermaid)
- **State**: Redux Toolkit / TanStack Query
- **Styling**: TailwindCSS v4 (oklch 디자인 토큰)
- **Test**: Vitest + React Testing Library + MSW
- **Language**: TypeScript

### Portal API (Backend)
- **Language**: Java 17
- **Framework**: Spring Boot 3.2 (멀티 모듈 7개)
- **Security**: Spring Security + JWT (jti, Rotation) + OAuth2
- **ORM**: JPA, **Migration**: Flyway
- **Resilience**: Resilience4j (CircuitBreaker/Retry)
- **Database**: PostgreSQL 15 (`portal-db` 독립 인스턴스)
- **Test**: JUnit 5 + Testcontainers
- **Build**: Gradle

### AI Backend (내부 서비스)
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.115
- **LLM**: LangChain + Ollama(로컬) / Gemini, Notion 연동
- **Server**: Uvicorn

### AI Benchmark API (🚧 예정)
- FastAPI + TimescaleDB (`ai-bench-db` 독립 인스턴스), NVIDIA GB10 GPU 메트릭

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx (API Gateway)
- **CI/CD**: GitHub Actions (backend/frontend/docs 게이트)
- **Exposure**: Cloudflare Tunnel (GB10 홈서버)
- **Observability**: Logback JSON 로깅, Sentry, MDC request 추적

---

## 아키텍처

### 시스템 구조도

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼  Cloudflare Tunnel (TLS)
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx API Gateway                             │
│           /api/portal/* → Portal API                            │
│           /api/ai/*     → AI Benchmark API (🚧 예정)             │
│           /*            → Frontend (Next.js)                    │
└──────┬──────────────────────┬──────────────────────┬────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ Frontend     │   │  Portal API      │   │ AI Benchmark API│
│ (Next.js)    │   │  (Spring Boot)   │   │ (FastAPI)       │
│ • 3D UI      │   │  • 블로그 CRUD   │   │ • 모델 추론     │
│ • Pixel Office│  │  • 인증/인가     │   │ • 벤치마크      │
│              │   │  • Service Registry│ │ • GPU 메트릭    │
└──────────────┘   └───┬──────────┬───┘   │   (🚧 예정)     │
                       │          │       └────────┬────────┘
                       │          ▼ REST           │
                       │   ┌──────────────┐        │
                       │   │  AI Backend  │        │
                       │   │  (FastAPI)   │        │
                       │   │ • 글 요약    │        │
                       │   │ • Ollama/Gemini │     │
                       │   └──────────────┘        │
                       ▼                           ▼
                ┌─────────────┐            ┌──────────────┐
                │  portal-db  │            │ ai-bench-db  │
                │ (PostgreSQL)│            │ (TimescaleDB)│
                │  독립 컨테이너│            │  독립 컨테이너│
                └─────────────┘            └──────────────┘
```

> 각 서비스는 독립 실행 가능하며, 자기 DB에만 접근합니다. 서비스 간 데이터가 필요하면 REST API를 호출합니다.
> 자세한 아키텍처: [ADR-006](docs/decisions/ADR-006-microservice-architecture.md)

### 주요 디자인 패턴
- **Frontend**: Shell App + Feature Modules (서비스별 라우트)
- **Portal API**: 멀티 모듈 + 계층형 아키텍처 + Service Registry
- **AI Benchmark API**: 3계층 (Router-Service-Infrastructure) + 독립 서비스

자세한 아키텍처 문서: [docs/architecture/](docs/)

---

## 시작하기

### 사전 요구사항

- **Docker**: 20.10 이상
- **Docker Compose**: 2.0 이상

> **로컬 개발 시 추가 요구사항**:
> - Java 17+ (Spring Boot 개발 시)
> - Node.js 18+ (Frontend 개발 시)
> - Python 3.11+ (AI API 개발 시)

---

### ⚡ Quick Start (Docker Compose)

#### 1. 저장소 클론

```bash
git clone https://github.com/jokwangwon/portfolio-blog.git
cd portfolio-blog
```

#### 2. 환경 변수 설정

```bash
# .env 파일 생성 (템플릿 복사)
cp .env.example .env

# .env 파일 수정 (최소한 JWT_SECRET은 반드시 변경!)
# JWT_SECRET 생성 예시: openssl rand -base64 64
```

#### 3. 데이터베이스만 실행 (기본)

```bash
docker-compose up -d

# 실행 확인
docker-compose ps
```

이제 PostgreSQL (+ TimescaleDB)이 실행됩니다:
- **PostgreSQL**: `localhost:5432`
- **pgAdmin** (선택): `docker-compose --profile tools up -d` 실행 후 `localhost:5050`

#### 4. 전체 스택 실행 (옵션)

```bash
# Backend + Frontend + AI API 모두 실행
docker-compose --profile backend --profile frontend up -d

# 또는 선택적으로 실행
docker-compose --profile backend up -d    # Backend만
docker-compose --profile frontend up -d   # Frontend만
```

서비스 URL:
- **Frontend**: http://localhost:3000
- **Portal API**: http://localhost:8080
- **AI Backend**: http://localhost:8081
- **pgAdmin**: http://localhost:5050 (tools 프로필 사용 시)

---

### 🛠️ 로컬 개발 모드 (Docker 없이)

Docker 대신 직접 실행하고 싶다면:

#### 1. 데이터베이스 실행

```bash
# PostgreSQL + TimescaleDB만 Docker로 실행
docker-compose up -d portal-db ai-bench-db
```

#### 2. Backend 실행

```bash
cd backend/api-server
./gradlew bootRun

# 또는 IDE에서 ApiServerApplication 실행
# http://localhost:8080
```

#### 3. Frontend 실행

```bash
cd frontend
npm install
npm run dev

# http://localhost:3000
```

#### 4. AI Backend 실행 (선택 — 글 요약 기능)

```bash
cd ai-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8081

# http://localhost:8081 (로컬 Ollama 또는 GEMINI_API_KEY 필요)
```

---

### 📊 데이터베이스 초기화

Flyway 마이그레이션이 자동으로 실행되어 스키마와 시드 데이터를 생성합니다.

**기본 관리자 계정**:
- Email: `admin@example.com`
- Password: `Admin123!`

**수동 마이그레이션 실행**:

```bash
cd backend/api-server
./gradlew flywayMigrate
```

---

## 프로젝트 구조

```
portfolio-blog/
├── backend/              # Portal API (Spring Boot 멀티 모듈)
│   ├── common/          # 공통 유틸/예외
│   ├── domain/          # 엔티티 + 리포지토리
│   ├── security/        # 인증/인가 (JWT, OAuth2)
│   ├── module-blog/     # 블로그 비즈니스 로직
│   ├── module-user/     # 사용자 관리
│   ├── module-registry/ # Service Registry (서비스 등록/상태 관리)
│   └── api-server/      # 실행 가능한 메인 앱 (Controller, AI 프록시)
│
├── ai-backend/          # AI Backend (FastAPI 내부 서비스 — 글 요약)
│   ├── app/             # main, llm_service(LangChain), notion_service
│   └── tests/
│
├── frontend/            # Next.js Shell App
│   ├── app/             # App Router — (portfolio)/(blog)/(auth)/admin 라우트 그룹
│   ├── src/
│   │   ├── shell/       # 레이아웃, 인증, 테마, API 클라이언트
│   │   ├── modules/     # Feature Modules (blog, portfolio, pixel-office)
│   │   └── shared/      # 애니메이션/컴포넌트/유틸
│   └── public/          # 정적 파일 (픽셀 에셋 포함)
│
├── nginx/               # API Gateway 설정
├── scripts/             # 하네스/문서 검증 스크립트
└── docs/                # 프로젝트 문서 (헌법, 아키텍처, ADR, 세션 로그)
```

---

## 개발 가이드

### 개발 컨벤션

프로젝트의 코딩 스타일, Git 워크플로우, API 설계 규칙 등은 다음 문서를 참고하세요:

📖 **[DEVELOPMENT_GUIDE.md](docs/guides/DEVELOPMENT_GUIDE.md)**

주요 내용:
- 코딩 컨벤션 (Java, TypeScript, Python)
- Git 브랜치 전략 및 커밋 메시지 규칙
- RESTful API 설계 원칙
- 데이터베이스 네이밍 규칙
- 에러 처리 규칙
- 테스트 작성 가이드

### 브랜치 전략

```
main (프로덕션)
  ↑
develop (개발 통합)
  ↑
feature/* (기능 개발)
```

### 커밋 메시지

```bash
feat(auth): JWT 인증 구현
fix(post): 조회수 증가 버그 수정
docs(readme): 설치 가이드 추가
```

자세한 내용은 [DEVELOPMENT_GUIDE.md](docs/guides/DEVELOPMENT_GUIDE.md) 참고

---

## API 문서

### Swagger UI

개발 서버 실행 후 다음 URL에서 API 문서 확인:

- **Portal API**: http://localhost:8080/swagger-ui.html
- **AI Backend**: http://localhost:8081/docs

전체 명세: [docs/api/API_SPECIFICATION.md](docs/api/API_SPECIFICATION.md)

### 주요 엔드포인트

#### 인증 (Portal API)
```
POST   /api/portal/auth/login
POST   /api/portal/auth/signup
POST   /api/portal/auth/refresh
GET    /api/portal/auth/me
```

#### 게시글 (Portal API)
```
GET    /api/portal/posts            # 목록 (카테고리/페이지네이션)
GET    /api/portal/posts/search     # 검색
GET    /api/portal/posts/{id}
POST   /api/portal/posts
PUT    /api/portal/posts/{id}
DELETE /api/portal/posts/{id}
POST   /api/portal/posts/{id}/like
```

#### AI (Portal API → AI Backend 프록시)
```
POST   /api/portal/ai/summarize     # 게시글 excerpt 자동 생성
```

---

## 테스트

현재 **백엔드 131개** (단위 + Testcontainers 통합) / **프론트엔드 109개** (Vitest + RTL + MSW) 테스트가 CI에서 실행됩니다.

### Backend

```bash
cd backend
./gradlew test              # 전체 (통합 테스트는 Docker 필요)

# 특정 모듈만 테스트
./gradlew :module-blog:test
```

### Frontend

```bash
cd frontend
npm test

# 커버리지
npm run test:coverage
```

---

## 배포

**GB10 홈서버 + Cloudflare Tunnel** 구성으로 배포합니다. AI Backend가 로컬 Ollama(GB10 GPU)에 의존하므로 전체 스택을 단일 호스트에서 운영하고, Cloudflare Tunnel이 TLS와 외부 노출을 담당합니다 (포트포워딩 불필요).

```bash
# 프로덕션 스택 기동 (Nginx 게이트웨이 포함)
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile backend --profile frontend --profile gateway up -d

# Cloudflare Tunnel 연결 (도메인 설정 후)
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile deploy up -d cloudflared

# 도메인 없이 임시 검증 (trycloudflare)
cloudflared tunnel --url http://localhost:80
```

상세 절차: [docs/guides/DEPLOYMENT_GUIDE.md](docs/guides/DEPLOYMENT_GUIDE.md)

> 라이브 URL은 도메인 확보 후 여기에 게시 예정

---

## 기여하기

현재는 개인 프로젝트이지만, 피드백은 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat(scope): Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

## 문의

- **개발자**: 조광원
- **이메일**: tgdata200@gmail.com
- **GitHub**: https://github.com/jokwangwon
- **블로그**: 도메인 확보 후 게시 예정

---

## 감사의 말

- Spring Boot / Next.js / FastAPI 팀
- [pixel-agents](CREDITS.md) — Pixel Office 렌더링 엔진 원작 (MIT)
- Ollama Contributors

---

**Made with ❤️ and ☕**
