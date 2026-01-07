# 3D 반응형 포트폴리오 블로그 프로젝트

## 프로젝트 개요

### 목적
2026년 포트폴리오용 3D 반응형 개인 블로그 구축

### 블로그 콘텐츠 목표
- 초보 개발자를 위한 알고리즘 학습 자료
- 프로그래밍 언어 학습 기록 (Python, TypeScript, React, Rust, Java, Spring)
- 개인 프로젝트 소개 (PhotoToon, Project-M 등)
- Dell Pro Max GB10 사용 경험 및 트러블슈팅
- AI 모델별 벤치마크 및 성능 평가 (그래프 시각화 포함)

### 핵심 차별화 요소
- 3D 인터랙티브 UI (React Three Fiber)
- GB10 기반 로컬 AI 모델 벤치마크 데이터 제공
- 한국어 GB10 + 로컬 LLM 관련 콘텐츠 (희소성)

---

## 블로그 구조

```
🏠 Home (3D 인터랙티브 랜딩)
│
├── 📚 Algorithm (알고리즘 학습 노트)
│
├── 💻 Languages & Frameworks
│   ├── Python
│   ├── TypeScript
│   ├── React
│   ├── Rust
│   ├── Java
│   └── Spring
│
├── 📝 Study Notes (공부 기록)
│
├── 🚀 Projects (프로젝트 쇼케이스)
│   ├── PhotoToon
│   ├── Project-M
│   └── 기타
│
├── 🖥️ Dell GB10 Lab
│   ├── 초기 세팅 가이드
│   ├── 트러블슈팅
│   └── AI 워크로드 최적화
│
├── 🤖 Model Benchmark
│   ├── 모델 리스트 (필터/정렬)
│   ├── 개별 모델 상세 (성능 테스트, 인터랙티브 그래프)
│   └── 모델 비교 페이지
│
└── 👤 About
```

---

## Depth 1: 시스템 아키텍처

### 전체 구조도

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
│                       │   REST    │                       │
│  • 인증/인가          │           │  • 모델 추론          │
│  • 콘텐츠 CRUD        │           │  • 벤치마크 실행      │
│  • 사용자 관리        │           │  • GPU 메트릭 수집    │
│  • 벤치마크 결과 조회 │           │  • 실시간 모니터링    │
└───────────┬───────────┘           └───────────┬───────────┘
            │                                   │
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│     PostgreSQL        │           │     TimescaleDB       │
│                       │           │                       │
│  • users              │           │  • gpu_metrics        │
│  • posts              │           │  • inference_logs     │
│  • comments           │           │  • benchmark_history  │
│  • categories/tags    │           │                       │
│  • models (메타)      │           │                       │
│  • benchmark_results  │           │                       │
└───────────────────────┘           └───────────────────────┘
            │                                   │
            └─────────────┬─────────────────────┘
                          ▼
              ┌───────────────────────┐
              │        Redis          │
              │                       │
              │  • 세션 관리          │
              │  • API 응답 캐시      │
              │  • 실시간 메트릭 버퍼 │
              └───────────────────────┘
```

### 멀티 백엔드 선택 이유
- AI 생태계(PyTorch, Transformers, llama.cpp)가 Python 중심
- 블로그 핵심 기능은 Spring Boot로 취업 포트폴리오 강화
- 서비스 분리로 현실적인 MSA 경험 확보

---

## 환경별 배포 구성

### Phase 1: 개발 환경 (GB10 All-in-One)

```
┌───────────────────────────────────────────────────────────────┐
│                        Dell GB10                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Docker Compose                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │  │
│  │  │  Frontend   │ │  Main API   │ │   AI API    │        │  │
│  │  │  (Next.js)  │ │  (Spring)   │ │  (FastAPI)  │        │  │
│  │  │   :3000     │ │   :8080     │ │   :8000     │        │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │  │
│  │  │ PostgreSQL  │ │ TimescaleDB │ │    Redis    │        │  │
│  │  │   :5432     │ │   :5433     │ │   :6379     │        │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Cloudflare Tunnel │
                    │  (도메인 연결)    │
                    └───────────────────┘
```

### Phase 2: 프로덕션 환경 (AWS)

| 구성 요소 | Phase 1 (GB10) | Phase 2 (AWS) |
|-----------|----------------|---------------|
| Frontend | Docker | Vercel 또는 S3+CloudFront |
| Main API | Docker | ECS 또는 EC2 |
| AI API | Docker | EC2 GPU 인스턴스 |
| PostgreSQL | Docker | RDS |
| TimescaleDB | Docker | RDS + 확장 또는 EC2 |
| Redis | Docker | ElastiCache |
| 도메인 | Cloudflare Tunnel | Route 53 + CloudFront |
| 컨테이너 관리 | Docker Compose | ECS 또는 EKS |
| CI/CD | GitHub Actions | GitHub Actions |

### 설계 원칙: 환경 이식성
- 전 서비스 Docker 이미지화 → ECS 배포 용이
- `.env` 파일로 환경 분리 (dev/prod)
- 서비스명 기반 통신 (localhost → 서비스 DNS)
- GitHub Actions로 dev/prod 분기 배포

---

## 기술 스택 및 선정 이유

### Frontend

| 기술 | 선정 이유 |
|------|-----------|
| **Next.js 14+** | SSR/SSG로 SEO 최적화, App Router로 최신 React 활용, Vercel 배포 최적화 |
| **React 18** | 최대 생태계, R3F 호환, 취업 시장 요구, Concurrent Features |
| **TypeScript** | 타입 안정성, IDE 자동완성, 코드 문서화 효과, 업계 표준 |
| **React Three Fiber** | React 컴포넌트 기반 3D 관리, drei 등 유틸 풍부, 선언적 문법 |
| **TailwindCSS** | 유틸리티 클래스로 빠른 개발, 번들 최적화, 반응형 내장 |

### Main API

| 기술 | 선정 이유 |
|------|-----------|
| **Java 17+** | LTS 안정성, 한국 취업 시장 1위, 최신 문법(Record, Pattern Matching) |
| **Spring Boot 3.x** | 국내 업계 표준, Auto Configuration, Security/Data/Cloud 통합 생태계 |
| **Spring Security** | 표준 인증/인가, JWT Stateless 지원, OAuth2 확장 용이 |
| **JPA + QueryDSL** | ORM 생산성 + 타입 안전 동적 쿼리 조합 |

### AI API

| 기술 | 선정 이유 |
|------|-----------|
| **Python 3.11+** | AI 생태계 사실상 유일 선택, PyTorch/Transformers/llama.cpp 지원 |
| **FastAPI** | ASGI 고성능, 자동 API 문서화, Pydantic 타입 검증, 비동기 지원 |
| **Uvicorn** | FastAPI 공식 권장, uvloop 기반 고성능, Gunicorn 조합 가능 |

### Database

| 기술 | 선정 이유 |
|------|-----------|
| **PostgreSQL 15+** | TimescaleDB 호환(동일 SQL), JSONB로 반정형 처리, pg_vector/Full-text search 확장, AWS RDS/Aurora 지원 |
| **TimescaleDB** | 시계열 최적화, PostgreSQL 확장이라 추가 학습 불필요, 자동 파티셔닝/압축 |
| **Redis 7+** | 인메모리 속도, 캐시/세션/Pub-Sub 다용도, Spring 통합 용이, ElastiCache 전환 쉬움 |

### Infrastructure

| 기술 | 선정 이유 |
|------|-----------|
| **Docker** | 환경 일관성, GB10→AWS 이식성, 서비스 격리, 이미지 버전 관리 |
| **Docker Compose** | 단일 명령 전체 스택 실행, 서비스 간 네트워크 자동 구성 |
| **Nginx** | 리버스 프록시, SSL 종료, 정적 파일 서빙, 로드밸런싱 대비 |
| **Cloudflare Tunnel** | 포트 개방 없이 보안 노출, 무료, SSL 자동, DDoS 보호 |
| **GitHub Actions** | GitHub 통합, 무료 티어 충분, AWS OIDC 연동 가능 |

---

## DB 역할 분담

| DB | 담당 서버 | 저장 데이터 | 특징 |
|----|-----------|-------------|------|
| **PostgreSQL** | Main API | users, posts, comments, categories, tags, models(메타), benchmark_results | 정형 데이터, 관계형, JSONB |
| **TimescaleDB** | AI API | gpu_metrics, inference_logs, benchmark_history | 시계열 데이터, 자동 파티셔닝 |
| **Redis** | 공용 | 세션, 캐시, 실시간 메트릭 버퍼 | 인메모리, 고속 접근 |

---

## Model Benchmark 기능 요구사항

### 측정 항목
- Tokens/sec (생성 속도)
- VRAM 사용량 (GB)
- GPU 온도 변화 (시간별)
- GPU Utilization (%)
- Time to First Token (첫 토큰 응답 시간)

### 페이지 기능
- 모델 리스트 (필터/정렬: 파라미터 크기, 양자화 타입, 용도별)
- 개별 모델 상세 페이지 (기본 정보, 테스트 결과, 인터랙티브 그래프)
- 다중 모델 비교 (오버레이 차트)
- 테스트 환경 표시 (GB10 스펙, 드라이버 버전)

---

## 현재 진행 상태

### 완료
- ✅ Depth 1: 시스템 아키텍처 설계 완료
- ✅ 기술 스택 선정 및 이유 정리 완료
- ✅ 환경별 배포 전략 수립 완료
- ✅ DB 구조 결정 (PostgreSQL + TimescaleDB + Redis)
- ✅ **Depth 2: 서비스별 모듈 구조 설계 완료** → [depth-2-module-structure.md](./depth-2-module-structure.md)
  - ✅ 2-1. Frontend 모듈 구조 (모듈러 아키텍처 + 게이트웨이 패턴)
  - ✅ 2-2. Main API 모듈 구조 (Spring Boot 멀티 모듈 + 계층형 아키텍처)
  - ✅ 2-3. AI API 모듈 구조 (FastAPI 모듈형 + 비동기 처리)

### 다음 단계
- ⏳ Depth 3: 모듈 내부 설계 (디렉토리 구조, 레이어 분리)
- ⏳ Depth 4: 상세 명세 (API 엔드포인트, DB 스키마/ERD)

### 추천 진행 순서
Frontend → Main API → AI API (사용자 흐름 기준 설계)

---

## 개발 환경 정보

- **개발 머신**: Dell Pro Max GB10
- **목표 배포**: AWS Cloud
- **도메인**: 구매 예정
- **개발자**: 기원테크 AI 개발자 (PhotoToon, Project-M 프로젝트 경험)

---

## 요청 사항

이 문서를 기반으로 Depth 2 (서비스별 모듈 구조) 설계를 이어서 진행해 주세요.