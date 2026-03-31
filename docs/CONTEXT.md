# 프로젝트 컨텍스트 (Project Context)

> **AI 에이전트가 세션 시작 시 가장 먼저 읽어야 하는 문서**
> 현재 프로젝트 상태, 진행 중인 작업, 다음 할 일을 기록

**최종 업데이트**: 2026-03-31 (세션 #10)

---

## 🎯 현재 프로젝트 상태

### Phase
**Phase 1A: 백엔드 개발** (완료!)

### 마지막 작업 (세션 #10, 2026-03-31)
- JwtTokenProvider에 jti(UUID) claim 추가 (토큰 중복 근본 해결)
- Flyway V1~V5 → 단일 V1__init_portal_schema.sql 통합 (TimescaleDB 제거)
- API 서버 멀티 스테이지 Dockerfile 생성
- docker-compose 전체 스택 기동 테스트 성공 (DB + API + Nginx)
- Nginx upstream 동적 resolve 적용
- 전체 테스트 123개 유지 (14개 파일, 전부 통과)

### 완료된 개발
- Spring Boot 멀티 모듈 프로젝트 생성 (7개 모듈) — 세션 #1
- JPA 엔티티 전체 구현 (User, Blog, Benchmark 도메인) — 세션 #1
- Spring Security + JWT 인증 구현 — 세션 #1
- 인증 API (회원가입, 로그인, 토큰 갱신, 로그아웃) — 세션 #1
- Docker Compose 설정 (PostgreSQL + TimescaleDB) — 세션 #1
- Blog CRUD, Auth Cookie 리팩토링, Flyway V2-V5 — 세션 #5
- 서비스 레이어 단위 테스트 69개 (8 파일) — 세션 #6
- Health Check + Service Contract + JSON 로깅 — 세션 #6
- module-registry (Service Registry CRUD) — 세션 #7
- Controller 테스트 + 총 90개 테스트 — 세션 #7
- ServiceHealthChecker + Nginx Gateway + Sentry 연동 — 세션 #8
- 통합 테스트 28개 (Testcontainers), module-benchmark 제거 — 세션 #9
- 전체 테스트 123개 (14개 파일) — 세션 #9
- JWT jti claim, Flyway 통합, Dockerfile, docker-compose 기동 테스트 — 세션 #10

### 현재 상황
**Phase 1A 완료**: 백엔드 핵심 기능 (인증, 블로그 CRUD, Service Registry, Observability, 테스트 123개) + 인프라 (Dockerfile, Flyway, docker-compose, Nginx Gateway) 모두 완성.
프론트엔드/AI API 미착수. Phase 1B 진입 준비 완료.

---

## 📋 다음 할 일 (Next Actions)

### Phase 1B (Next)
1. **프론트엔드**
   - [ ] Next.js Shell App 프로젝트 생성
   - [ ] 기본 레이아웃 + 라우팅 설정

2. **AI Benchmark API**
   - [ ] FastAPI 독립 프로젝트 생성
   - [ ] AI Benchmark DB 스키마 (Alembic)

3. **인증 확장**
   - [ ] OAuth2 소셜 로그인 (Google, GitHub)

---

## 🔑 주요 의사결정 기록

> 상세 내용은 각 ADR 문서를 참조하세요. 여기는 빠른 참조용 요약입니다.

| # | 결정 | 결정일 | ADR |
|---|------|--------|-----|
| 1 | PostgreSQL 3개 → 1개 통합 (TimescaleDB) | 2026-01-07 | [ADR-001](decisions/ADR-001-database-consolidation.md) |
| 2 | Redux Toolkit 선택 (취업 포폴 목적) | 2026-01-07 | — |
| 3 | Redis 도입 Phase 2로 지연 | 2026-01-07 | — |
| 4 | Observability 조기 도입 (Phase 1부터) | 2026-01-07 | [ADR-002](decisions/ADR-002-observability-first.md) |
| 5 | 테스트 커버리지 70% 목표 | 2026-01-07 | [ADR-004](decisions/ADR-004-test-strategy.md) |
| 6 | JWT Refresh Token Rotation | 2026-01-07 | [ADR-003](decisions/ADR-003-jwt-refresh-token-rotation.md) |
| 7 | PixiJS + @pixi/react 채택 (Pixel Office) | 2026-03-26 | [ADR-005](decisions/ADR-005-pixel-office-tech-stack.md) |
| 8 | **독립 서비스 아키텍처 전환** | 2026-03-30 | [ADR-006](decisions/ADR-006-microservice-architecture.md) |
| 9 | **멀티 에이전트 합의 시스템** | 2026-03-30 | [ADR-007](decisions/ADR-007-multi-agent-consensus-system.md) |

---

## 💬 사용자 강조 사항

### 1. 문서 우선주의
- "docs 외부에 문서가 있는게 싫은데 docs 내에서도 폴더화를 통해 정리"
- → 모든 문서를 `docs/` 폴더 내부로 이동 완료
- → `docs/history/` 폴더로 과거 문서 관리

### 2. 취업 포트폴리오 목적
- "2026년 취업 포트폴리오를 목적으로 합니다"
- → 코드 품질 > 빠른 개발 속도
- → 일관성 > 개인 취향
- → Redux Toolkit 같은 기업 표준 기술 선호

### 3. 헌법 준수
- "개발 시작전 세팅부터 진행할 예정입니다. 개발을 진행하면서 에이전트가 지켜야할 법규나 문서를 확립"
- → `PROJECT_CONSTITUTION.md` 제정 완료 (12개 조항)
- → 모든 개발은 헌법 준수 필수

### 4. MVP 우선 접근
- "기본 블로그 기능부터 구현 진행"
- "1. 이정도면 적당할것 같아요 2. 일단 별도로 구현 후 게이트웨이를 도입하여 병합"
- → Depth 2까지 설계 완료, Depth 3/4는 개발하면서 설계

### 5. 관제형 에이전트 활용
- "추가적으로 다른 에이전트를 띄워 문서와 아이디어를 보고 점검 및 개선 혹은 다른 아이디어를 던져줄수 있는 관제형 에이전트"
- → `architecture-review.md` 생성 (아키텍처 검토 에이전트)
- → 필요 시 Task 도구로 검토 에이전트 실행

---

## 📚 필수 참조 문서

### AI 에이전트가 반드시 읽어야 할 문서 (우선순위 순)

1. **🔴 이 문서 (CONTEXT.md)** - 현재 상태 파악
2. **🔴 PROJECT_CONSTITUTION.md** - 절대 규칙
3. **🟠 INDEX.md** - 문서 전체 구조
4. **🟠 database-consolidation-design.md** - DB 설계
5. **🟠 observability-design.md** - 로깅/모니터링
6. **🟠 DEVELOPMENT_GUIDE.md** - 코딩 컨벤션

### 개발 시작 전 체크리스트
- [ ] CONTEXT.md 읽고 현재 상태 파악
- [ ] PROJECT_CONSTITUTION.md 숙지
- [ ] 관련 설계 문서 확인
- [ ] 사용자 강조 사항 확인

---

## 🚧 진행 중인 이슈

### 1. 미커밋 변경사항 (세션 #10)
- JWT jti claim 추가
- Flyway V1~V5 통합, 기존 파일 삭제
- API 서버 Dockerfile + .dockerignore
- docker-compose.yml 수정 (name, build context, initdb 제거)
- nginx.conf 동적 resolve 적용
- application.yml 환경변수 바인딩 추가
- 통합 테스트에서 Thread.sleep 워크어라운드 제거

---

## ⚠️ 주의사항

### 절대 하지 말아야 할 것
1. **헌법 위반**: `PROJECT_CONSTITUTION.md` 조항 위반
2. **문서 없는 개발**: 설계 문서 없이 코드 작성
3. **과도한 기술 스택**: MVP에 불필요한 기술 추가
4. **Redis 도입**: Phase 1에서는 PostgreSQL만 사용
5. **서비스 간 DB 교차 접근**: 각 서비스는 자기 DB만 접근 (ADR-006)

### 강조 사항
1. **코드보다 문서**: 변경 사항은 문서부터 업데이트
2. **보안 우선**: JWT Rotation, XSS 방지 필수
3. **테스트 작성**: 핵심 로직은 70% 커버리지
4. **구조화된 로깅**: 처음부터 JSON 로깅 설정
5. **Service Contract 준수**: 새 서비스는 /health + /api/summary 필수

---

## 📊 프로젝트 통계

### 문서 현황
- 헌법 문서: 4개
- 아키텍처 설계: 7개 (database-erd.md 포함)
- API 명세: 2개 (API_SPECIFICATION.md, openapi.yaml)
- 가이드: 2개
- 검토 보고서: 1개
- ADR: 7개 (ADR-000 ~ ADR-006)
- 세션 로그: 3개
- 총 문서: ~29개

### 완료된 설계
- [x] 시스템 아키텍처 — 독립 서비스 + 중앙 포털 (Depth 1)
- [x] 서비스별 모듈 구조 (Depth 2)
- [x] Service Registry 패턴 + Service Contract
- [x] DB 물리 분리 전략 (서비스별 독립 PostgreSQL 인스턴스)
- [x] Observability 설계
- [x] JWT 보안 강화 설계
- [x] 테스트 전략
- [x] Pixel Office 설계

### 완료된 개발
- [x] Spring Boot 멀티 모듈 프로젝트 (7개 모듈)
- [x] Docker Compose (PostgreSQL + TimescaleDB)
- [x] JPA 엔티티 전체 (User, Blog, Benchmark)
- [x] Spring Security + JWT 인증
- [x] 인증 API (회원가입/로그인/갱신/로그아웃)

### Phase 1A (완료)
- [x] Spring Boot 멀티 모듈, JPA 엔티티, Security+JWT, Auth API, Blog CRUD
- [x] module-registry, ServiceHealthChecker, Health Check, Service Contract
- [x] Logback JSON 로깅, Sentry 연동
- [x] Flyway V1 통합 마이그레이션 — 세션 #10에서 완료
- [x] API 서버 Dockerfile — 세션 #10에서 완료
- [x] docker-compose 전체 스택 기동 검증 — 세션 #10에서 완료
- [x] JWT jti claim — 세션 #10에서 완료
- [x] 123개 테스트 (단위 95 + 통합 28)

### Phase 1B (미착수)
- [ ] Next.js Shell App 프로젝트 생성
- [ ] AI Benchmark API (FastAPI) 독립 프로젝트 생성
- [ ] OAuth2 소셜 로그인

---

## 🔄 세션 전환 프로토콜

### 세션 종료 시
1. 이 문서(`CONTEXT.md`) 업데이트
   - 현재 작업 상태
   - 다음 할 일
   - 새로운 의사결정 사항
2. `docs/sessions/SESSION_{날짜}.md` 생성 (작업 로그)
3. 중요한 결정은 `docs/decisions/ADR-{번호}.md` 작성

### 새 세션 시작 시 (AI 에이전트용)
1. **이 문서 먼저 읽기** (`docs/CONTEXT.md`)
2. 현재 상태 파악
3. 다음 할 일 확인
4. 필수 참조 문서 읽기
5. 사용자에게 현재 상태 요약 제시

---

## 📝 마지막 대화 요약

### 세션 #9 (2026-03-31)
- 통합 테스트 28개 (Testcontainers PostgreSQL)
- module-benchmark 제거, @EnableScheduling 설정
- AccessDeniedException 핸들러 버그 수정
- 전체 테스트 123개 달성 (14개 파일)

### 세션 #10 (2026-03-31)
- JWT jti(UUID) claim 추가 (토큰 중복 근본 해결)
- Flyway V1~V5 통합 → V1__init_portal_schema.sql (TimescaleDB 제거)
- API 서버 Dockerfile 생성 (멀티 스테이지)
- docker-compose 전체 스택 기동 성공 (DB + API + Nginx)
- **Phase 1A 완료!**

---

## 💡 다음 세션을 위한 메모

### Phase 1B 우선순위
1. Next.js Shell App 프로젝트 생성 + 기본 레이아웃
2. AI Benchmark API (FastAPI) 독립 프로젝트 생성
3. OAuth2 소셜 로그인 (Google, GitHub)

---

**이 문서는 프로젝트의 현재 상태를 나타냅니다.**
**세션이 바뀔 때마다 반드시 업데이트하세요.**
**AI 에이전트는 세션 시작 시 이 문서를 가장 먼저 읽어야 합니다.**
