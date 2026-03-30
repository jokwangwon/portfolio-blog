# 포트폴리오 포털 시스템 아키텍처

> **독립 서비스 + 중앙 포털** 방식의 마이크로 아키텍처
> 각 프로젝트가 독립 실행되면서, 포털에서 통합 관리

**최종 업데이트**: 2026-03-30
**관련 ADR**: [ADR-006 마이크로서비스 전환](../decisions/ADR-006-microservice-architecture.md)

---

## 프로젝트 개요

### 목적
2026년 포트폴리오용 통합 플랫폼 구축. 블로그를 중심 포털로, 다양한 서브 프로젝트를 독립 서비스로 운영.

### 핵심 원칙
1. **서브 프로젝트 독립 실행** — 중앙 꺼져도 서브 프로젝트 단독 동작
2. **중앙에서 관리** — 포털에서 모든 프로젝트 현황 조회/관리
3. **DB 물리적 분리** — 서비스별 독립 PostgreSQL 인스턴스, 교차 접근 원천 차단
4. **결합 용이** — 새 프로젝트 추가 시 포털 코드 수정 불필요

### 블로그 콘텐츠 목표
- 프로그래밍 언어 학습 기록 (Python, TypeScript, React, Rust, Java, Spring)
- 초보 개발자를 위한 알고리즘 학습 자료
- 개인 프로젝트 소개 (PhotoToon, Project-M 등)
- Dell Pro Max GB10 사용 경험 및 트러블슈팅
- AI 모델별 벤치마크 및 성능 평가 (그래프 시각화)

### 핵심 차별화 요소
- 3D 인터랙티브 UI (React Three Fiber)
- AI 픽셀 오피스 대시보드 (PixiJS)
- GB10 기반 로컬 AI 모델 벤치마크 데이터
- 독립 서비스 아키텍처 (포트폴리오로서의 설계 역량)

---

## 블로그 구조

```
🏠 Home (3D 인터랙티브 랜딩)
│
├── 📚 Algorithm (알고리즘 학습 노트)
│
├── 💻 Languages & Frameworks
│   ├── Python / TypeScript / React
│   ├── Rust / Java / Spring
│
├── 📝 Study Notes (공부 기록)
│
├── 🚀 Projects (프로젝트 쇼케이스 — 서브 서비스 통합)
│   ├── PhotoToon  → 독립 서비스 연결
│   ├── Project-M  → 독립 서비스 연결
│   └── 기타       → Service Registry에서 자동 표시
│
├── 🖥️ Dell GB10 Lab
│
├── 🤖 Model Benchmark → AI Benchmark 독립 서비스 연결
│
├── 🏢 Pixel Office (AI 픽셀 오피스 대시보드)
│
└── 👤 About
```

---

## Depth 1: 시스템 아키텍처

### 전체 구조도

```
사용자 요청
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│                    Nginx (API Gateway)                        │
│                                                              │
│  /                → Frontend (Next.js)           :3000       │
│  /api/portal/*    → Portal API (Spring Boot)     :8080       │
│  /api/ai/*        → AI Benchmark API (FastAPI)   :8000       │
│  /api/{service}/* → 새 서비스                    :81XX       │
└───────────────────────────┬──────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Portal API  │     │ AI Bench-   │     │ 새 서비스   │
│ (Spring     │     │ mark API    │     │ (아무 스택) │
│  Boot)      │     │ (FastAPI)   │     │             │
│             │     │             │     │             │
│ • 블로그    │     │ • 모델 추론 │     │ • 자체 기능 │
│ • 사용자    │     │ • 벤치마크  │     │ • /health   │
│ • Registry  │     │ • GPU 메트릭│     │ • /summary  │
│ • 인증/인가 │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ portal-db       │  │ ai-bench-db     │  │ {service}-db    │
│ (postgres:15)   │  │ (timescaledb:   │  │ (postgres:15)   │
│ :5432           │  │  latest-pg15)   │  │ :54XX           │
│                 │  │ :5433           │  │                 │
│ • users         │  │ • models        │  │ • 자체 테이블   │
│ • posts         │  │ • results       │  │                 │
│ • categories    │  │ • gpu_metrics   │  │                 │
│ • tags          │  │ (hypertable)    │  │                 │
│ • registry      │  │                 │  │                 │
│ • cache         │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
       |                    |                    |
  별도 Docker 컨테이너   별도 Docker 컨테이너   별도 Docker 컨테이너

  핵심 원칙: 물리적 분리로 서비스 간 DB 교차 접근 원천 차단
```

### 아키텍처 선택 근거

| 관점 | 모놀리스 | 독립 서비스 (채택) |
|------|---------|-------------------|
| 배포 | 전체 재배포 | ��비스별 독립 배포 |
| 장애 격리 | 하나 죽으면 전체 죽음 | 서비스별 격리 |
| 기술 스택 | 통일 강제 | 서비스별 자유 선택 |
| 새 프로젝트 추가 | 코드 수정 + 재빌드 | 등록만 하면 끝 |
| DB | 공유 | 서비스별 물리 분리 |
| 포트폴리오 가치 | 낮음 | MSA 설계 역량 증명 |

---

## Service Registry 패턴

### 중앙은 "물어보는" 방식, 강제하지 않음

```
Portal API
│
├── service_registry 테이블
│   ├── ai-benchmark  → http://ai-api:8000
│   ├── phototoon     → http://phototoon:8100
│   └── project-m     → http://project-m:8200
│
├── 주기적으로 (30초~1분):
│   ├── GET {service}/health    → 생존 확인
│   ├── GET {service}/summary   → 요약 데이터
│   └── 결과 → service_cache 테이블에 저장
│
└── 프론트엔드 요청 시:
    ├── 서비스 UP   → 최신 데이터 반환
    └── 서비스 DOWN → 캐시 데이터 + "오프라인" 표시
```

### 서비스 계약 (Service Contract)

모든 서브 프로젝트가 **2개 엔드포인트**만 구현하면 포털에 자동 연결:

```json
// GET /health — 생존 확인
{
  "status": "UP",
  "service": "ai-benchmark",
  "version": "1.0.0",
  "timestamp": "2026-03-30T10:00:00Z"
}

// GET /api/summary — 포털 대시보드용 요약
{
  "service": "ai-benchmark",
  "displayName": "AI 모델 벤치마크",
  "description": "로컬 LLM 성능 측정 및 비교",
  "icon": "robot",
  "stats": {
    "totalModels": 15,
    "totalBenchmarks": 42,
    "lastUpdated": "2026-03-30T10:00:00Z"
  },
  "routes": [
    { "path": "/benchmark", "label": "벤치마크 목록" },
    { "path": "/benchmark/compare", "label": "모델 비교" }
  ]
}
```

### 에러 응답 및 타임아웃 동작

```json
// GET /health — 서비스 다운 또는 DB 연결 실패 시
{
  "status": "DOWN",
  "service": "ai-benchmark",
  "version": "1.0.0",
  "timestamp": "2026-03-30T10:00:00Z",
  "error": "Database connection refused"
}

// GET /health — 부분 장애 (DB는 OK, 외부 의존성 실패)
{
  "status": "DEGRADED",
  "service": "ai-benchmark",
  "version": "1.0.0",
  "timestamp": "2026-03-30T10:00:00Z",
  "error": "Ollama service unavailable"
}

// GET /api/summary — 서비스는 살아있지만 데이터 조회 실패 시
HTTP 500
{
  "error": "SUMMARY_UNAVAILABLE",
  "message": "Failed to retrieve summary data",
  "timestamp": "2026-03-30T10:00:00Z"
}
```

**Portal의 타임아웃 정책**:

| 항목 | 값 | 동작 |
|------|-----|------|
| `/health` 타임아웃 | 3초 | 초과 시 `status: DOWN` 처리 |
| `/api/summary` 타임아웃 | 5초 | 초과 시 캐시 데이터 사용 |
| 폴링 주기 | 30초 | 서비스별 독립 스케줄 |
| 연속 실패 허용 | 3회 | 3회 연속 실패 시 `is_active: false` |
| 복구 확인 | 60초 | 비활성 서비스도 60초마다 재시도 |

**프론트엔드 표시 규칙**:

| service_cache.status | UI 표시 |
|---------------------|---------|
| `UP` | 정상 (최신 summary 데이터) |
| `DOWN` | 캐시 데이터 + "오프라인" 배지 |
| `DEGRADED` | 캐시 데이터 + "일부 제한" 배지 |
| `UNKNOWN` (첫 등록) | "연결 대기 중" |

### 새 프로젝트 추가 절차

```
1. 프로젝트를 아무 스택으로 개발
2. /health + /api/summary 구현 (Service Contract 준수)
3. docker-compose.yml에 서비스 + 전용 DB 컨테이너 추가
4. nginx.conf에 라우팅 추가
5. Portal DB의 service_registry에 INSERT
   → 포털 코드 재배포 없이 대시보드에 자동 표시
```

---

## 동작 시나리오

### 시나리오 1: 중앙(Portal) 꺼짐

```
Portal API    ❌ (down)
AI Benchmark  ✅ → /api/ai/* Nginx가 직접 라우팅
PhotoToon     ✅ → /api/phototoon/* Nginx가 직접 라우팅
Frontend      ⚠️ → 서브 서비스 페이지는 동작, 블로그/관리 기능 ��가
```

### 시나리오 2: 서브 프로젝트 꺼짐

```
Portal API    ✅
AI Benchmark  ❌ (down)
PhotoToon     ✅

Portal → GET /health 호출 → timeout
→ service_cache에서 마지막 데이터 표시 + "오프라인" 배지
→ 블로그, 다른 서비스 정상 동작
```

### 시나리오 3: 새 프로젝트 추가

```
1. "Project-M API" 개발 (Go, Rust, Node.js 등 자유)
2. /health + /api/summary 구현
3. docker-compose에 서비스 추가
4. nginx.conf에 /api/project-m/* → :8200 라우팅 추가
5. Portal registry에 등록

→ Portal 코드 재배포 없이 대시보드에 자동 표시
```

---

## DB 전략

### 핵심 원칙: 서비스별 독립 PostgreSQL 인스턴스

각 서비스는 자체 PostgreSQL 컨테이너를 보유합니다. 물리적 분리이므로 인프라 레벨에서 교차 접근이 원천 차단됩니다.

### Phase 1: 개발 환경 (GB10 Docker Compose)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  portal-db   │    │ ai-bench-db  │    │ {service}-db │
│  (postgres)  │    │ (timescaledb)│    │ (postgres)   │
│              │    │              │    │              │
│  • users     │    │  • models    │    │  • photos    │
│  • posts     │    │  • results   │    │  • effects   │
│  • registry  │    │  • gpu_metrics│   │              │
│  • cache     │    │  (hypertable)│    │              │
│              │    │              │    │              │
│  :5432       │    │  :5433       │    │  :5434       │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
  Portal API만        AI Benchmark만       해당 서비스만
  접근 가능           접근 가능            접근 가능
```

- **서비스별 독립 PostgreSQL 인스턴스** (Docker 컨테이너 분리)
- **Portal DB 역할**: 인증(로그인), 사용자, 블로그, Service Registry 등 서비스 간 상호작용 데이터
- **서비스별 DB 역할**: 프로젝트 고유 데이터만 저장
- 서비스 간 데이터 필요 시 → REST API 호출 (물리적으로 교차 접근 불가)

### 포털 전용 테이블

```sql
-- 서비스 등록 정보
CREATE TABLE service_registry (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    health_path VARCHAR(200) DEFAULT '/health',
    summary_path VARCHAR(200) DEFAULT '/api/summary',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 서비스 상태 캐시 (마지막 조회 결과)
CREATE TABLE service_cache (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL REFERENCES service_registry(service_name),
    status VARCHAR(20) NOT NULL,        -- UP, DOWN, UNKNOWN
    summary_data JSONB,                  -- /api/summary 응답 캐시
    last_checked_at TIMESTAMP NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 환경별 배포 구성

### Phase 1: 개발 환경 (GB10 All-in-One)

```
┌───────────────────────────────────────────────────────────┐
│                        Dell GB10                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Docker Compose                      │  │
│  │                                                      │  │
│  │  ┌───────────┐                                       │  │
│  │  │  Nginx    │  ← API Gateway (단일 진입점)         │  │
│  │  │  :80/:443 │                                       │  │
│  │  └─────┬─────┘                                       │  │
│  │        │                                              │  │
│  │  ┌────���┼───────────────┬───────────────┐              │  │
│  │  ▼           ▼                ▼        ▼              │  │
│  │  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │Frontend│ │Portal API│ │ AI API   │ │ 새 서비스 │  │  │
│  │  │(Next)  │ │(Spring)  │ │(FastAPI) │ │(자유)    │  │  │
│  │  │ :3000  │ │ :8080    │ │ :8000    │ │ :81XX    │  │  │
│  │  └────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │                    │            │            │         │  │
│  │                    ▼            ▼            ▼         │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │ portal-db    │ │ ai-bench-db  │ │ {svc}-db     │  │  │
│  │  │ (postgres:15)│ │ (timescaledb │ │ (postgres:15)│  │  │
│  │  │ :5432        │ │  :latest-    │ │ :54XX        │  │  │
│  │  │              │ │  pg15) :5433 │ │              │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘  │  │
│  │  (서비스별 독립 DB 컨테이너 -- 물리적 분리)           │  │
│  └─────────────────────────────────────────────────────┘  │
│                        │                                    │
│              ┌─────────▼─────────┐                         │
│              │ Cloudflare Tunnel │                         │
│              │  (도메인 연결)    │                         │
│              └───────────────────┘                         │
└───────────────────────────────────────────────────────────┘
```

### Phase 2: 프로덕션 환경 (AWS)

| 구성 요소 | Phase 1 (GB10) | Phase 2 (AWS) |
|-----------|----------------|---------------|
| Gateway | Nginx (Docker) | ALB + API Gateway |
| Frontend | Docker | Vercel 또는 S3+CloudFront |
| Portal API | Docker | ECS Fargate |
| AI API | Docker | EC2 GPU 인스턴스 |
| 새 서비스 | Docker | ECS (서비스별 독립) |
| PostgreSQL | Docker (서비스별 독립 컨테이너) | RDS (서비스별 독립 인스턴스) |
| 도메인 | Cloudflare Tunnel | Route 53 + CloudFront |
| CI/CD | GitHub Actions | GitHub Actions |

### 설계 원칙: 환경 이식성
- 전 서비스 Docker 이미지화 → ECS 배포 용이
- `.env` 파일로 환경 분리 (dev/prod)
- 서비스명 기반 통신 (Docker DNS → AWS Service Discovery)

---

## 기술 스택

### Frontend (Next.js Shell App)

| 기술 | 선정 이유 |
|------|-----------|
| **Next.js 14+** | SSR/SSG SEO 최적화, App Router, Shell App으로 서비스 통합 |
| **React 18** | 최대 생태계, R3F/PixiJS 호환, 취업 시장 요구 |
| **TypeScript** | 타입 안정성, IDE 자동완성, 업계 표준 |
| **React Three Fiber** | React 기반 3D, drei 유틸 풍부, 선언적 문법 |
| **PixiJS + @pixi/react** | 2D 픽셀 오피스 렌더링 (ADR-005) |
| **Redux Toolkit** | 전역 상태 관리, 취업 포폴 강화 목적 |
| **TanStack Query** | 서버 상태 캐싱, 자동 재검증 |
| **TailwindCSS** | 유틸리티 클래스, 반응형, 번들 최적화 |

### Portal API (Spring Boot)

| 기술 | 선정 이유 |
|------|-----------|
| **Java 17+** | LTS 안정성, 한국 취업 시장 1위 |
| **Spring Boot 3.x** | 국내 업계 표준, 통합 생태계 |
| **Spring Security** | JWT Stateless 인증, OAuth2 확장 |
| **JPA + QueryDSL** | ORM 생산성 + 타입 안전 동적 쿼리 |
| **Flyway** | DB 마이그레이션 버전 관리 |

### AI Benchmark API (FastAPI)

| 기술 | 선정 이유 |
|------|-----------|
| **Python 3.11+** | AI 생태계 (PyTorch, Transformers, llama.cpp) |
| **FastAPI** | ASGI 고성능, 자동 API 문서화, 비동기 지원 |
| **Uvicorn** | FastAPI 공식 권장, 고성능 ASGI 서버 |

### Infrastructure

| 기술 | 선정 이유 |
|------|-----------|
| **Docker** | 환경 일관성, 서비스 격리, GB10→AWS 이식성 |
| **Docker Compose** | 단일 명령 전체 스택 실행, profile로 서비스 선택 |
| **Nginx** | API Gateway, 리버스 프록시, SSL 종료 |
| **PostgreSQL 15+** | TimescaleDB 호환, JSONB, 서비스별 독립 인스턴스 |
| **Cloudflare Tunnel** | 포트 개방 없이 보안 노출, 무료 SSL |
| **GitHub Actions** | CI/CD, 서비스별 독립 파이프라인 |

---

## Model Benchmark 기능 요구사항

### 측정 항목
- Tokens/sec (생성 속도)
- VRAM 사용량 (GB)
- GPU 온도 변화 (시간별)
- GPU Utilization (%)
- Time to First Token (첫 토큰 응답 시간)

### 페이지 기능
- 모델 리스트 (필터/정렬: 파라미터 크��, 양자화 타입, 용도별)
- 개별 모델 상세 (기본 정보, 테스트 결과, 인터랙티브 그래프)
- 다중 모델 비교 (오버레이 차트)
- 테스트 환경 표시 (GB10 스펙, 드라이버 버전)

---

## 현재 진행 상태

### 완료
- ✅ 시스템 아키텍처 설계 (Depth 1) — 이 문서
- ✅ 서비스별 모듈 구조 (Depth 2) → [depth-2-module-structure.md](./depth-2-module-structure.md)
- ✅ Spring Boot 멀티 모듈 프로젝트 (Portal API 기반)
- ✅ JPA 엔티티 전체 구현 (User, Blog, Benchmark)
- ✅ Spring Security + JWT 인증
- ✅ 인증 API (회원가입, 로그인, 토큰 갱신, 로그아웃)
- ✅ Docker Compose 설정
- ✅ Pixel Office 설계 → [pixel-office-design.md](./pixel-office-design.md)

### 다음 단계
- ⏳ Nginx API Gateway 설정
- ⏳ DB 물리 분리 (portal-db 컨테이너, ai-bench-db 컨테이너)
- ⏳ Service Registry 구현
- ⏳ Flyway 마이그레이션 (V1__init_schema.sql)
- ⏳ 프론트엔드 프로젝트 생성 (Next.js Shell App)
- ⏳ AI Benchmark API 독립 서비스화

---

## 개발 환경 정보

- **개발 머신**: Dell Pro Max GB10
- **목표 배포**: AWS Cloud
- **도메인**: 구매 예정
- **개발자**: 기원테크 AI 개발자 (PhotoToon, Project-M 프로젝트 경험)

---

**이 문서는 프로젝트의 최상위 아키텍처를 정의합니다.**
**아키텍처 변경 시 반드시 이 문서와 관련 ADR을 업데이트하세요.**
