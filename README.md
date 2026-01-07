# 3D 포트폴리오 블로그

> Dell Pro Max GB10 기반 로컬 AI 벤치마크를 포함한 3D 인터랙티브 개인 블로그

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com/)

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

2026년 포트폴리오용 개인 블로그 프로젝트입니다.

### 핵심 차별화 요소

1. **3D 인터랙티브 UI** - React Three Fiber 기반
2. **로컬 AI 벤치마크** - GB10에서 실행한 LLM 모델 성능 측정
3. **멀티 백엔드 MSA** - Spring Boot + FastAPI

### 블로그 콘텐츠

- 초보 개발자를 위한 알고리즘 학습 자료
- 프로그래밍 언어 학습 기록 (Python, TypeScript, React, Rust, Java, Spring)
- 개인 프로젝트 소개 (PhotoToon, Project-M 등)
- Dell Pro Max GB10 사용 경험 및 트러블슈팅
- AI 모델별 벤치마크 및 성능 평가 (그래프 시각화)

---

## 주요 기능

### 블로그 핵심 기능
- ✅ 게시글 CRUD (마크다운 지원)
- ✅ 카테고리/태그 분류
- ✅ 댓글 시스템
- ✅ 검색 기능
- ✅ 조회수/좋아요 통계

### 3D 인터랙티브
- ✅ 3D 메인 랜딩 페이지
- ✅ 스크롤 기반 3D 전환 효과
- ✅ 인터랙티브 네비게이션

### AI 모델 벤치마크
- ✅ 모델 리스트 (필터/정렬)
- ✅ 실시간 추론 테스트
- ✅ 성능 메트릭 시각화 (Tokens/sec, VRAM, 온도)
- ✅ 다중 모델 비교 차트

### 인증/인가
- ✅ JWT 기반 인증
- ✅ 소셜 로그인 (Google, GitHub, Kakao)
- ✅ 역할 기반 권한 관리 (ADMIN, USER)

---

## 기술 스택

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18
- **3D**: React Three Fiber, drei
- **State**: Redux Toolkit
- **Server State**: TanStack Query (React Query)
- **Styling**: TailwindCSS
- **Language**: TypeScript

### Main API (Backend)
- **Language**: Java 17+
- **Framework**: Spring Boot 3.x
- **Security**: Spring Security + JWT + OAuth2
- **ORM**: JPA + QueryDSL
- **Database**: PostgreSQL 15 + TimescaleDB Extension
- **Build**: Gradle

### AI API
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **LLM**: llama.cpp, Transformers
- **GPU**: CUDA 12+ (NVIDIA RTX 4060 Ti)
- **Database**: PostgreSQL 15 + TimescaleDB Extension
- **Server**: Uvicorn

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (Phase 2)

---

## 아키텍처

### 시스템 구조도

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│              Desktop / Mobile / Tablet (반응형)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Server                             │
│                   Next.js + React + R3F                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│     Main API Server   │           │     AI API Server     │
│     (Spring Boot)     │◄─────────►│     (FastAPI)         │
│   • 블로그 CRUD       │           │   • 모델 추론         │
│   • 인증/인가         │           │   • 벤치마크          │
└───────────┬───────────┘           └───────────┬───────────┘
            │                                   │
            └───────────────┬───────────────────┘
                            ▼
            ┌───────────────────────────────────┐
            │  PostgreSQL + TimescaleDB         │
            │  (통합 데이터베이스)              │
            └───────────────────────────────────┘
```

### 주요 디자인 패턴
- **Frontend**: 모듈러 아키텍처 + 게이트웨이 패턴
- **Backend**: 멀티 모듈 + 계층형 아키텍처 (Controller-Service-Repository)
- **AI API**: 3계층 (Router-Service-Infrastructure) + 싱글톤 모델 매니저

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
git clone https://github.com/yourusername/portfolio-blog.git
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
- **Main API**: http://localhost:8080
- **AI API**: http://localhost:8000
- **pgAdmin**: http://localhost:5050 (tools 프로필 사용 시)

---

### 🛠️ 로컬 개발 모드 (Docker 없이)

Docker 대신 직접 실행하고 싶다면:

#### 1. 데이터베이스 실행

```bash
# PostgreSQL + TimescaleDB만 Docker로 실행
docker-compose up -d postgres
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

#### 4. AI API 실행 (선택)

```bash
cd backend/ai-api-server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# http://localhost:8000
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
├── backend/              # Spring Boot 멀티 모듈
│   ├── common/          # 공통 모듈
│   ├── domain/          # 엔티티 + 리포지토리
│   ├── security/        # 인증/인가
│   ├── module-blog/     # 블로그 비즈니스 로직
│   ├── module-user/     # 사용자 관리
│   ├── module-benchmark/# 벤치마크 메타데이터
│   └── api-server/      # 실행 가능한 메인 앱
│
├── frontend/            # Next.js 애플리케이션
│   ├── src/
│   │   ├── app/        # App Router (라우팅)
│   │   ├── modules/    # 독립 모듈 (auth, blog, three 등)
│   │   ├── shared/     # 공유 컴포넌트/훅/유틸
│   │   └── gateway/    # 모듈 통합 게이트웨이
│   └── public/         # 정적 파일
│
├── ai-api/              # FastAPI 애플리케이션
│   ├── app/
│   │   ├── api/        # API 라우터
│   │   ├── services/   # 비즈니스 로직
│   │   ├── core/       # 공통 인프라
│   │   └── infrastructure/  # LLM, GPU 모니터링
│   └── tests/          # 테스트
│
├── infrastructure/      # Docker, Nginx 설정
│   ├── docker-compose.yml
│   ├── nginx/
│   └── scripts/
│
└── docs/               # 프로젝트 문서
    ├── architecture/
    ├── api/
    └── guides/
```

---

## 개발 가이드

### 개발 컨벤션

프로젝트의 코딩 스타일, Git 워크플로우, API 설계 규칙 등은 다음 문서를 참고하세요:

📖 **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)**

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

자세한 내용은 [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) 참고

---

## API 문서

### Swagger UI

개발 서버 실행 후 다음 URL에서 API 문서 확인:

- **Main API**: http://localhost:8080/swagger-ui.html
- **AI API**: http://localhost:8000/docs

### 주요 엔드포인트

#### 인증
```
POST   /api/v1/auth/login
POST   /api/v1/auth/signup
POST   /api/v1/auth/refresh
```

#### 게시글
```
GET    /api/v1/posts
GET    /api/v1/posts/{id}
POST   /api/v1/posts
PUT    /api/v1/posts/{id}
DELETE /api/v1/posts/{id}
```

#### AI 추론
```
POST   /api/v1/inference/generate
POST   /api/v1/inference/generate/stream
POST   /api/v1/benchmark/run
```

---

## 테스트

### Backend

```bash
cd backend
./gradlew test

# 특정 모듈만 테스트
./gradlew :module-blog:test

# 통합 테스트
./gradlew integrationTest
```

### Frontend

```bash
cd frontend
npm test

# 커버리지
npm run test:coverage

# E2E 테스트 (Playwright)
npm run test:e2e
```

### AI API

```bash
cd ai-api
pytest

# 커버리지
pytest --cov=app
```

---

## 배포

### Phase 1: GB10 개발 환경 (현재)

```bash
# Docker Compose로 전체 스택 실행
cd infrastructure
docker-compose up -d

# Cloudflare Tunnel로 외부 노출
cloudflared tunnel --url http://localhost:3000
```

### Phase 2: AWS 프로덕션 (예정)

| 서비스 | AWS 리소스 |
|--------|-----------|
| Frontend | Vercel 또는 S3 + CloudFront |
| Main API | ECS 또는 EC2 |
| AI API | EC2 GPU 인스턴스 (g4dn.xlarge) |
| PostgreSQL + TimescaleDB | RDS PostgreSQL (TimescaleDB Extension) |

CI/CD: GitHub Actions

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

- **개발자**: 기원테크
- **이메일**: your.email@example.com
- **블로그**: https://yourdomain.com
- **GitHub**: https://github.com/yourusername

---

## 감사의 말

- Dell Pro Max GB10
- Spring Boot Team
- Next.js Team
- FastAPI Team
- llama.cpp Contributors

---

**Made with ❤️ and ☕**
