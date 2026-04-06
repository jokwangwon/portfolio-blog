# 프로젝트 컨텍스트 (Project Context)

> **AI 에이전트가 세션 시작 시 가장 먼저 읽어야 하는 문서**
> 현재 프로젝트 상태, 진행 중인 작업, 다음 할 일을 기록

**최종 업데이트**: 2026-04-06 (세션 #17)

---

## 🎯 현재 프로젝트 상태

### Phase
**Phase 1B: 프론트엔드 개발** (진행 중)

### 마지막 작업 (세션 #17, 2026-04-06)
- **pixel-agents 렌더링 엔진 이식 완료**: PNG 에셋 54개 + 엔진 19파일 + assetLoader + usePixelOffice 어댑터
- **백엔드 보안 정비**: module-registry GET 인증 추가, AiClient CircuitBreaker/Retry, 벤치마크 @Deprecated
- 84개 테스트 통과, Next.js 빌드 성공

### 완료된 개발

#### Phase 1A (백엔드) — 완료 ✅
- Spring Boot 멀티 모듈 프로젝트 (7개 모듈), JPA 엔티티, Security+JWT, Auth API — 세션 #1
- Blog CRUD, Auth Cookie 리팩토링, Flyway V2-V5 — 세션 #5
- 서비스 레이어 단위 테스트 69개 + Health Check + JSON 로깅 — 세션 #6
- module-registry + Controller 테스트 (총 90개) — 세션 #7
- ServiceHealthChecker + Nginx Gateway + Sentry (총 95개) — 세션 #8
- 통합 테스트 28개 (Testcontainers), 전체 123개 — 세션 #9
- JWT jti claim, Flyway 통합, Dockerfile, docker-compose 기동 테스트 — 세션 #10

#### Phase 1B (프론트엔드) — 진행 중
- Next.js 16.2.1 Shell App + TailwindCSS v4 + Redux Toolkit + TanStack Query — 세션 #10
- Shell: Header, Footer, ShellLayout, AuthProvider, Providers, API Client — 세션 #10
- Auth: 로그인, 회원가입 페이지 — 세션 #10
- Blog: 목록, 상세(마크다운 렌더링), 카테고리 필터, 페이지네이션 — 세션 #10
- **shadcn/ui v4 (base-nova) 디자인 시스템 도입 — 세션 #11**
- **블로그 에디터 (생성/수정/삭제) CRUD 완성 — 세션 #11**
- **블로그 UI 디자인 세분화 문서 작성 — 세션 #11**
- **Blog 고도화: 좋아요/댓글/검색 — 세션 #12**
- **프론트엔드 테스트 57개 (Vitest + RTL + MSW) — 세션 #12**
- **OAuth2 소셜 로그인 Google/GitHub (백엔드 TDD + 프론트 UI) — 세션 #12**

### 현재 상황
**디자인 강화 Stage 3 완료**: Stage 1(마이크로 인터랙션) ✅ + Stage 2(3D Hero) ✅ + Stage 3(Pixel Office) ✅. pixel-agents 오픈소스 렌더링 엔진을 이식하여 실제 PNG 스프라이트로 업그레이드. 백엔드 보안 3건 정비 완료 (module-registry 인증, AiClient resilience4j, 벤치마크 deprecation).

---

## 📋 다음 할 일 (Next Actions)

### 디자인 강화 로드맵 (design-enhancement.md 기준)
1. ~~**Stage 1**: 마이크로 인터랙션 & 애니메이션~~ ✅ 완료
2. ~~**Stage 2**: 3D Hero, 프로젝트 카드 리디자인~~ ✅ 완료
3. **Stage 3**: Pixel Office MVP (Canvas 2D, 3존, 3에이전트, 4상태) ← **다음**

### Phase 1B 잔여
1. **AI Benchmark API**
   - [ ] FastAPI 독립 프로젝트 생성
   - [ ] AI Benchmark DB 스키마 (Alembic)

2. **Service Registry UI**
   - [ ] 등록된 서비스 목록 대시보드

3. **프론트엔드 테스트 강화**
   - [ ] 커버리지 향상 (현재 57개 + 10개 = 67개 → 목표 70%+)
   - [ ] E2E 테스트 도입 검토

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
| 10 | **Pixel Office Canvas 2D MVP 전환** | 2026-04-06 | [ADR-008](decisions/ADR-008-pixel-office-canvas2d-mvp.md) |

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

### 없음
세션 #12 작업은 모두 커밋 완료 (develop 브랜치, origin에 push 됨):
- `3a853cb` feat: Add blog likes, comments, and search features
- `e71f7ae` test: Add frontend test suite with Vitest + RTL + MSW
- `ef52a35` feat: Add OAuth2 social login (Google, GitHub)

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

### Phase 1A (완료) ✅
- [x] Spring Boot 멀티 모듈, JPA 엔티티, Security+JWT, Auth API, Blog CRUD
- [x] module-registry, ServiceHealthChecker, Health Check, Service Contract
- [x] Logback JSON 로깅, Sentry 연동
- [x] Flyway V1 통합, Dockerfile, docker-compose 기동, JWT jti
- [x] 123개 테스트 (단위 95 + 통합 28)

### Phase 1B (진행 중)
- [x] Next.js Shell App 프로젝트 생성 + 기본 레이아웃 — 세션 #10
- [x] Auth 페이지 (로그인, 회원가입) — 세션 #10
- [x] Blog 조회 (목록, 상세, 카테고리 필터, 페이지네이션) — 세션 #10
- [x] shadcn/ui 디자인 시스템 도입 (11개 컴포넌트) — 세션 #11
- [x] Blog 에디터 (생성/수정/삭제, PostEditor 컴포넌트) — 세션 #11
- [x] Blog 고도화 (좋아요/댓글/검색) — 세션 #12
- [x] 프론트엔드 테스트 57개 (Vitest + RTL + MSW) — 세션 #12
- [x] OAuth2 소셜 로그인 Google/GitHub — 세션 #12
- [ ] AI Benchmark API (FastAPI) 독립 프로젝트 생성
- [ ] Service Registry UI 대시보드

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

### 세션 #11 (2026-03-31)
- shadcn/ui v4 (base-nova) 디자인 시스템 도입 (11개 컴포넌트)
- Blog 에디터 (PostEditor + 생성/수정 라우트 + 삭제 Dialog)
- Blog CRUD 완성 (API 함수 + Mutation hooks)

### 세션 #12 (2026-03-31)
- Blog 고도화: 좋아요/댓글/검색 (LikeButton, CommentSection, SearchBar)
- Vitest + RTL + MSW 프론트엔드 테스트 57개
- OAuth2 소셜 로그인 Google/GitHub (백엔드 TDD 5개 + 프론트 UI)
- 모노레포 정리, 시스템 분석 8.3/10

### 세션 #13–#14 (2026-04-02)
- 하네스 엔지니어링 6개 Layer 전수 점검 (모두 정상)
- OAuth2 소셜 로그인 4건 버그 수정 (CRITICAL 2, HIGH 1, MEDIUM 1)
- `.env.local` 환경변수 관리 체계 구축
- 이슈 보고서 문서화 (`docs/review/oauth2-issue-report.md`)
- 블로그 에디터 3건 수정: 한글 slug 생성, Tiptap SSR hydration, 슬래시 명령어 "/" 잔존

### 세션 #15 (2026-04-05)
- 기획 문서 전수 점검 (14개 설계 문서, 구현율 55-60%)
- 3-Stage 디자인 강화 통합 설계 (`design-enhancement.md`)
- **Stage 1 완료**: framer-motion, 스크롤 애니메이션 7개 섹션, 마우스 glow, 배경 메쉬 drift, 텍스트 그라데이션
- 테스트 10개 추가 (총 67개)

### 세션 #16 (2026-04-06)
- pixel-agents 분석 + 3+1 멀티 에이전트 합의 → ADR-008 (Canvas 2D MVP)
- Pixel Office MVP 엔진 구현 (39 테스트, TDD)
- 디자인 시스템 재설계 (SpriteData, Colorize, 어두운 팔레트)

### 세션 #17 (2026-04-06)
- **pixel-agents 렌더링 엔진 이식**: PNG 에셋 54개 + pixel-engine/ 19파일 + assetLoader + usePixelOffice
- **백엔드 보안 정비**: module-registry GET 인증, AiClient CircuitBreaker/Retry, 벤치마크 @Deprecated
- 84개 테스트 통과, Next.js 빌드 성공
- CREDITS.md MIT 라이선스 고지

---

## 💡 다음 세션을 위한 메모

### 다음 세션(#18) 우선순위
1. ~~Stage 1~~ ✅ ~~Stage 2~~ ✅ ~~Stage 3~~ ✅ ~~pixel-agents 이식~~ ✅ ~~백엔드 보안~~ ✅
2. 관리자 /admin/office (Hook SSE + 실시간)
3. Git 히스토리 JSON 추출 스크립트 (타임랩스 실데이터)
4. 커서 트레일 + 벤치마크 시각화
5. AI Benchmark API (FastAPI)
6. Service Registry UI 대시보드

---

**이 문서는 프로젝트의 현재 상태를 나타냅니다.**
**세션이 바뀔 때마다 반드시 업데이트하세요.**
**AI 에이전트는 세션 시작 시 이 문서를 가장 먼저 읽어야 합니다.**
