# 세션 로그 (Session Logs)

> **개발 세션별 작업 기록**
> AI 에이전트 및 개발자의 작업 내용을 세션별로 문서화

---

## 세션 로그란?

각 개발 세션에서 수행한 작업, 결정, 이슈를 기록하는 문서입니다.

### 목적
- **작업 추적**: 무엇을 했는지 시간순으로 기록
- **컨텍스트 보존**: 세션 전환 시 이전 작업 맥락 파악
- **진행 상황 파악**: 프로젝트 진행률 추적
- **이슈 기록**: 발생한 문제 및 해결 방법 문서화

---

## 세션 목록

| 날짜 | 세션 | 주요 작업 | 문서 |
|------|------|-----------|------|
| 2026-01-07 | #1 | 프로젝트 초기 설정, 아키텍처 설계, 헌법 제정, 백엔드 개발 | [SESSION_2026-01-07.md](SESSION_2026-01-07.md) |
| 2026-03-26 | #2 | 문서 점검, Pixel Office 설계, ADR 정비 | [SESSION_2026-03-26.md](SESSION_2026-03-26.md) |
| 2026-03-30 | #3 | 아키텍처 전환 (독립 서비스 + 중앙 포털), 전체 문서 일관성 갱신 | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-30 | #4 | Portal 리네이밍, DB 물리 분리, SDD 명세 완성 (18개 CRITICAL 해결) | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-30 | #5 | Git 워크플로우 보완, CI 구축, 멀티 에이전트 시스템 설계 | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-30 | #6 | CLAUDE.md 생성, 서비스 레이어 단위 테스트 69개, Health Check, JSON 로깅 | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-30 | #7 | module-registry 생성, Controller 테스트, 총 90개 테스트 | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-30 | #8 | ServiceHealthChecker, Nginx Gateway, Sentry 연동, 총 95개 테스트 | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-31 | #9 | 통합 테스트 28개 (Testcontainers), module-benchmark 제거, @EnableScheduling | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-31 | #10 | JWT jti claim, Flyway 통합, Dockerfile, docker-compose 기동 테스트 | [SESSION_2026-03-30.md](SESSION_2026-03-30.md) |
| 2026-03-31 | #11 | shadcn/ui 도입, Blog 에디터 CRUD 완성, 디자인 문서 작성 | [SESSION_2026-03-31.md](SESSION_2026-03-31.md) |
| 2026-03-31 | #12 | Blog 고도화(좋아요/댓글/검색), 프론트엔드 테스트 57개, OAuth2 소셜 로그인 | [SESSION_2026-03-31.md](SESSION_2026-03-31.md) |
| 2026-04-02 | #13–#14 | 하네스 엔지니어링 점검, OAuth2 4건 수정, 에디터 3건 수정 (slug/SSR/슬래시) | [SESSION_2026-04-02.md](SESSION_2026-04-02.md) |
| 2026-04-05 | #15 | 기획 점검, 3-Stage 디자인 강화 설계, Stage 1 애니메이션 구현 | [SESSION_2026-04-05.md](SESSION_2026-04-05.md) |
| 2026-04-06 | #16 | pixel-agents 분석, ADR-008 (Canvas 2D MVP), Pixel Office MVP 엔진 (TDD 39개) | [SESSION_2026-04-06.md](SESSION_2026-04-06.md) |
| 2026-04-06 | #17 | pixel-agents 렌더링 엔진 이식 (PNG 54개 + 19파일), 백엔드 보안 3건 | [SESSION_2026-04-06_s17.md](SESSION_2026-04-06_s17.md) |
| 2026-04-06 | #18 | (로그 누락) 관리자 Pixel Office SSE, 줌/팬 수정, Pixel Office hardening — [#19 로그에 복원](SESSION_2026-07-09.md) | — |
| 2026-07-09 | #19 | 재개 점검: Docker 29 호환 (Testcontainers 2.0.5), npm 취약점 27→2, compose 정리 | [SESSION_2026-07-09.md](SESSION_2026-07-09.md) |

**총 세션**: 19개

---

## 세션 로그 작성 가이드

### 언제 작성하는가?
- 새로운 개발 세션 시작 시
- 세션 종료 시 (요약 및 다음 작업 기록)
- 중요한 마일스톤 달성 시

### 작성 형식

```markdown
# 세션 로그 - YYYY-MM-DD

**날짜**: YYYY-MM-DD
**AI 에이전트**: [에이전트 이름]
**작업 시간**: [예상 시간]

## 세션 목표
[이번 세션의 목표]

## 완료된 작업
- [x] 작업 1
- [x] 작업 2

## 주요 결정
[중요한 의사결정 사항]

## 다음 세션 작업
[다음에 할 일]

## 이슈 및 주의사항
[발생한 문제나 주의할 점]
```

---

## 세션별 요약

### 세션 #1 (2026-01-07)
**Phase**: 설계 및 문서화
**주요 성과**:
- ✅ 프로젝트 헌법 제정 (12개 조항)
- ✅ 아키텍처 설계 완료 (Depth 2)
- ✅ 아키텍처 리뷰 및 개선안 도출
- ✅ 4개 신규 설계 문서 작성
- ✅ 문서 관리 체계 수립

**주요 결정**:
- PostgreSQL 통합 (3개 DB → 1개)
- Observability 조기 도입
- JWT Refresh Token Rotation
- 테스트 전략 수립

**다음 작업**: 개발 환경 구축 (Docker Compose, 프로젝트 생성)

### 세션 #2 (2026-03-26)
**Phase**: 문서 정비 + 기능 설계
**주요 성과**:
- Pixel Office 아이디어 구체화 및 설계 문서 작성
- ADR-005 (PixiJS 기술 선택) 작성
- 전체 문서 일관성 분석 → 7개 문제점 도출 및 수정
- 누락 ADR 3개 (002, 003, 004) 생성
- 세션 로그 체계 복구

**주요 결정**:
- PixiJS + @pixi/react 채택 (ADR-005)
- 에셋 AI 생성 방식 확정
- Observability 로컬부터 도입 확인 (ADR-002)

**다음 작업**: CONTEXT.md 현행화, 구조적 개선 (중복 제거, Phase 통일)

### 세션 #3 (2026-03-30)
**Phase**: 아키텍처 전환 + 문서 일관성 확보
**주요 성과**:
- 독립 서비스 + 중앙 포털 아키텍처 설계 및 ADR-006 작성
- blog-architecture-context.md, depth-2-module-structure.md 전면 재작성
- DEVELOPMENT_GUIDE.md에 서비스 간 통신 규칙 추가
- ADR-001 부분 대체 처리 (서비스별 논리 DB 분리)
- PROJECT_CONSTITUTION.md 제2조 3항 추가 (서비스 독립성)
- pixel-office-design.md 서비스 경계 명확화 (Portal 내부 모듈)
- observability-design.md 분산 환경 Observability 섹션 추가
- 전체 문서 용어 통일 (Main API→Portal API, blog→portal)

**주요 결정**:
- 독립 서비스 + Service Registry + Nginx Gateway 아키텍처 채택 (ADR-006)
- 서비스별 논리 DB 분리 (portal_db, ai_bench_db)
- 서비스 간 DB 교차 접근 절대 금지, REST API 통신만 허용

**다음 작업**: Phase 1 백엔드 개발 본격 진행 (Portal API 모듈 구현)

### 세션 #4 (2026-03-30 후반)
**Phase**: Portal 리네이밍 + DB 물리 분리 + SDD 명세 완성
**주요 성과**:
- 코드 리네이밍 (blog→portal): 패키지, 클래스, API 경로, 환경변수
- docker-compose.yml: portal-db + ai-bench-db 물리 분리
- SDD 명세 18개 CRITICAL 이슈 전수 해결 (보안/API/DB/인프라 4단계)
- API 명세: 26개 엔드포인트, 21개 에러코드, 권한 매트릭스
- DB 명세: likes 테이블, service_registry/cache DDL, V6 seed 데이터
- 보안 명세: JWT HS256, SecurityFilterChain, CORS, Refresh Token Rotation

**주요 결정**:
- JWT HS256, Access Token 메모리 저장, 15분 만료
- 역할: USER/ADMIN 2개 (Phase 1)
- 댓글 최대 2단계, Slug 수정불가, Excerpt VARCHAR(200)

**다음 작업**: Phase 1A SDD 코딩 (Flyway V1~V6 → Portal API Core → Auth)

### 세션 #5 (2026-03-30)
**Phase**: Git 워크플로우 + 프로세스 정비
**주요 성과**:
- develop 브랜치 생성, Phase별 push 정책 문서화
- GitHub Actions CI 파이프라인 (.github/workflows/ci.yml) 구축
- PR 템플릿 생성 (.github/PULL_REQUEST_TEMPLATE.md)
- 멀티 에이전트 합의 시스템 설계 (검토 1 + 분석 3)
- ADR-007 작성 (멀티 에이전트 합의 시스템)
- DEVELOPMENT_GUIDE.md에 상태 추적/버전 태깅 정책 추가

**주요 결정**:
- main 직접 push 금지, PR + CI 통과 필수
- Phase 1에서 develop 직접 push 허용 (1인 개발)
- 3-에이전트 합의 프로토콜을 아키텍처/SDD/보안 결정에 필수 적용

**다음 작업**: Phase 1A SDD 코딩 (Flyway V1~V6 → Portal API Core → Auth)

### 세션 #6 (2026-03-30)
**Phase**: TDD 보완 + 인프라 구현
**주요 성과**:
- CLAUDE.md 생성 (SDD+TDD, 에이전트 프로토콜, 세션 규칙)
- 서비스 레이어 전체 단위 테스트 작성 (69개 메서드, 8개 파일)
- Health Check + Service Contract (/health, /api/summary)
- Logback JSON 구조화 로깅 + MDC 필터 (request_id 추적)

**주요 결정**:
- SDD+TDD 방법론 항시 적용 (CLAUDE.md에 명시)
- dev: human-readable 로그, prod: JSON 로그

**다음 작업**: module-registry, Nginx Gateway, Sentry, Controller API 테스트

### 세션 #7 (2026-03-30)
**Phase**: module-registry + Controller 테스트
**주요 성과**:
- module-registry 모듈 생성 (ServiceRegistryService, Controller, DTO)
- Controller 단위 테스트 (CategoryController 4개, PostController 9개)
- 전체 테스트 90개 달성 (11개 파일)

**주요 결정**:
- module-registry는 domain 엔티티/Repository 재사용 (별도 엔티티 불필요)
- Controller 테스트는 @WebMvcTest 대신 순수 유닛 테스트 (모듈 독립성 유지)

**다음 작업**: Nginx Gateway, Sentry, ServiceHealthChecker, Integration Test

### 세션 #8 (2026-03-30)
**Phase**: 인프라 완성
**주요 성과**:
- ServiceHealthChecker 구현 (@Scheduled 폴링, RestTemplate 5초 timeout)
- Nginx API Gateway 설정 (URL 패턴 라우팅, WebSocket 지원)
- Sentry 에러 트래킹 연동 (Spring Boot + Logback appender)
- 전체 테스트 95개 달성 (12개 파일)

**주요 결정**:
- Sentry는 prod 프로필에서만 활성화 (WARN 이상만 이벤트 전송)
- Nginx는 docker-compose gateway 프로필로 분리

**다음 작업**: @EnableScheduling, Integration Test, module-benchmark 제거

### 세션 #9 (2026-03-31)
**Phase**: 통합 테스트 + 정리
**주요 성과**:
- Testcontainers PostgreSQL 기반 통합 테스트 28개 작성 (Auth 11 + Blog 17)
- module-benchmark 빈 모듈 제거 (독립 서비스 분리 완료)
- @EnableScheduling + module-registry 스캔 설정
- AccessDeniedException 핸들러 추가 (403 반환 버그 수정)
- `-parameters` 컴파일러 플래그 추가
- 전체 테스트 123개 달성 (14개 파일)

**주요 결정**:
- Singleton Testcontainer로 테스트 클래스 간 DB 공유
- Flyway 비활성화 + JPA create-drop으로 테스트 스키마 관리

**다음 작업**: Phase 1B (Next.js, FastAPI, OAuth2)

### 세션 #10 (2026-03-31)
**Phase**: Phase 1A 완료 + Phase 1B 시작
**주요 성과**:
- JWT jti claim, Flyway 통합, Dockerfile, docker-compose 기동 성공
- Next.js Shell App MVP 구현 (Auth + Blog 조회)

**다음 작업**: shadcn/ui 도입, Blog 에디터

### 세션 #11 (2026-03-31)
**Phase**: Phase 1B (프론트엔드 고도화)
**주요 성과**:
- shadcn/ui v4 (base-nova) 디자인 시스템 도입 — 11개 컴포넌트
- 기존 전체 컴포넌트 shadcn/ui 리팩토링 (14개 파일 수정)
- Blog 에디터 완성 (PostEditor + 생성/수정/삭제 + Dialog 확인)
- Blog CRUD 전체 완성 (API 함수 + Mutation hooks)
- 블로그 UI 디자인 세분화 문서 작성 (blog-ui-design.md)
- 프로젝트 문서 전면 업데이트

**주요 결정**:
- shadcn/ui base-nova 스타일 채택 (Base UI 기반, oklch 색상 체계)
- `asChild` 대신 `buttonVariants()` + Link className 패턴

**다음 작업**: Blog 고도화 (검색, 댓글, 좋아요), OAuth2, AI Benchmark API

### 세션 #12 (2026-03-31)
**Phase**: Phase 1B (프론트엔드 고도화 + OAuth2)
**주요 성과**:
- Blog 고도화 완성: 좋아요(LikeButton), 댓글(CommentSection), 검색(SearchBar)
- Vitest + RTL + MSW 프론트엔드 테스트 인프라 구축 (57개 테스트)
- OAuth2 소셜 로그인 구현 — Google, GitHub (백엔드 TDD 5개 + 프론트엔드 UI)
- 모노레포 정리 (frontend/.git 제거)
- 시스템 분석 에이전트: 종합 8.3/10

**주요 결정**:
- OAuth2 accessToken URL 파라미터 전달 방식
- PasswordEncoder 별도 Config 분리 (순환 참조 해결)
- 프론트엔드 테스트에서 fireEvent.change 사용 (fakeTimers 호환)

**다음 작업**: 요구사항 vs MVP 비교 분석, UI 시각적 점검, "진짜 구현" 단계 계획

### 세션 #13–#14 (2026-04-02)
**Phase**: Phase 1B (버그 수정 + 안정화)
**주요 성과**:
- 하네스 엔지니어링 6개 Layer 전수 점검 (모두 정상)
- OAuth2 소셜 로그인 4건 버그 수정 (CRITICAL 2, HIGH 1, MEDIUM 1)
- `.env.local` 환경변수 관리 체계 구축
- 블로그 에디터 3건 수정: 한글 slug 생성 (`generateUniqueSlug`), Tiptap SSR hydration, 슬래시 명령어 "/" 잔존

**주요 결정**:
- OAuth2 refresh_token은 프론트엔드 callback에서 Next.js 프록시 경유 쿠키 설정
- 한글 slug는 `post-{timestamp}` 형식, 중복 시 suffix 자동 추가
- Tiptap SSR에서 `immediatelyRender: false` 필수

**다음 작업**: 요구사항 vs MVP 비교 분석, UI 시각적 점검

---

## 참고

### CONTEXT.md와의 차이
- **CONTEXT.md**: 현재 프로젝트 전체 상태 (최신 정보만)
- **세션 로그**: 과거 세션별 작업 이력 (아카이브)

### 세션 전환 프로토콜
1. 세션 종료 시 → 세션 로그 작성
2. 중요 결정 → ADR 작성
3. 현재 상태 → CONTEXT.md 업데이트

---

**이 폴더는 프로젝트의 작업 이력을 보존합니다.**
**세션 종료 시 반드시 로그를 작성하세요.**
