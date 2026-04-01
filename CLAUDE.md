# CLAUDE.md — 프로젝트 개발 지시사항

> Claude Code가 매 세션마다 자동으로 읽는 프로젝트 규칙 문서

---

## 1. 핵심 개발 방법론: SDD + TDD

### SDD (Specification-Driven Development)
- **코드보다 문서가 우선**. 코드 변경 전 관련 SDD 문서 확인 필수
- SDD 문서 경로: `docs/architecture/` 하위 명세서 참조
- 문서와 코드 간 불일치 발견 시 → 문서를 기준으로 코드 수정
- **작업 전 필수 워크플로우**:
  1. 관련 설계/명세 문서가 있는지 확인
  2. **문서가 없으면** → 설계 문서를 먼저 작성하고 사용자 검토를 받음
  3. **문서 검토 완료 후** → 별도 브랜치에서 코드 구현 (TDD 적용)
  4. 구현 완료 후 → 문서에 변경사항 반영
- 문서와 구현은 **별도 브랜치/PR로 분리** (예: `feature/xxx-design` → `feature/xxx-implementation`)

### TDD (Test-Driven Development)
- **모든 코드 작성 시 TDD 사이클 적용 필수**
  1. RED: 실패하는 테스트 먼저 작성
  2. GREEN: 테스트를 통과하는 최소한의 코드 구현
  3. REFACTOR: 코드 정리 (테스트는 계속 통과해야 함)
- 테스트 커버리지 목표: **70% 이상**
- 테스트 분류:
  - Unit Test: 외부 의존성 Mock, 빠른 실행
  - Integration Test: Testcontainers(PostgreSQL) 사용
  - API Test: MockMvc + SpringBootTest

---

## 2. 3+1 멀티 에이전트 합의 프로토콜

### 적용 조건
아키텍처/SDD/보안 관련 **큰 결정**이 필요할 때만 가동

### 구성
- **Reviewer Agent** (1): 검토 및 최종 합의 도출
- **Agent A** (Implementation Analyst): 구현 가능성/비용 분석
- **Agent B** (Quality/Safety Auditor): 품질/보안 감사
- **Agent C** (Alternative Explorer): 대안 탐색

### 프로세스
분배 → 독립 분석 → 교차 비교 → 합의 도출 → 보고서 작성

### 일반 작업
일반 코딩/버그 수정은 에이전트 프로토콜 없이 직접 수행

---

## 3. 세션 프로토콜

### 세션 시작 시
1. `docs/CONTEXT.md` 읽기 (현재 상태 파악)
2. 최신 `docs/sessions/SESSION_*.md` 읽기 (마지막 작업 확인)
3. 이 `CLAUDE.md` 규칙 숙지

### 세션 종료 시
1. `docs/sessions/SESSION_{날짜}.md` 세션 로그 작성/업데이트
2. `docs/sessions/README.md` 세션 목록 갱신
3. `docs/CONTEXT.md` 최신 상태 반영
4. `docs/INDEX.md` 새 문서가 있으면 등록

---

## 4. Git 워크플로우

### 브랜치 전략 (Simplified Git Flow)
- `main`: 프로덕션 (PR만 허용)
- `develop`: 일상 개발 브랜치
- `feature/*`: 기능 개발 브랜치

### Phase별 정책
- Phase 1: develop 직접 push 허용
- Phase 2+: 모든 변경 PR 필수

### 커밋 메시지 (Conventional Commits)
```
feat: 새 기능
fix: 버그 수정
docs: 문서 변경
test: 테스트 추가/수정
refactor: 리팩토링
chore: 빌드/설정 변경
```

### 버전 관리 (Semantic Versioning)
- v0.1.0: Phase 1A
- v0.2.0: Phase 1B
- v1.0.0: Phase 2 프로덕션

---

## 5. 아키텍처 규칙

### 모듈 구조
- `common`: 공통 유틸/예외 (모든 모듈이 의존)
- `domain`: JPA 엔티티 + Repository
- `security`: Spring Security + JWT
- `module-*`: 비즈니스 로직 모듈
- `api-server`: 진입점 (Controller, GlobalExceptionHandler)

### 핵심 원칙
- **서비스/모듈 독립성**: 모듈 간 직접 DB 접근 금지
- **예외 클래스**: `common` 모듈에 위치 (cross-module 접근)
- **Soft Delete**: posts, comments, users는 `deletedAt` 필드 사용

### 보안 원칙
- Refresh Token: **HttpOnly Cookie** (응답 본문에 포함 금지)
- Access Token: 응답 본문에만 포함, 만료 **15분**
- 비밀번호: BCrypt 해싱
- SQL Injection 방지: JPA/Prepared Statement 사용
- 입력 검증: @Valid + Bean Validation

---

## 6. 소통 규칙

- **한국어**로 소통 (코드/커밋 메시지는 영어)
- 기술 용어는 영어 원문 유지 (JWT, API, TDD 등)

---

## 7. 참조 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| 프로젝트 헌법 | `docs/constitution/PROJECT_CONSTITUTION.md` | 최상위 원칙 |
| 개발 가이드 | `docs/guides/DEVELOPMENT_GUIDE.md` | 개발 프로세스/Git 정책 |
| 테스트 전략 | `docs/guides/TEST_STRATEGY.md` | 테스트 방법론/도구 |
| 보안 원칙 | `docs/constitution/SECURITY_PRINCIPLES.md` | 보안 규칙 |
| 코드 품질 | `docs/constitution/CODE_QUALITY_PRINCIPLES.md` | 코드 스타일/규칙 |
| 아키텍처 원칙 | `docs/constitution/ARCHITECTURE_PRINCIPLES.md` | 아키텍처 설계 원칙 |
| 멀티에이전트 설계 | `docs/architecture/multi-agent-system-design.md` | 3+1 에이전트 상세 |
| 컨텍스트 | `docs/CONTEXT.md` | 현재 프로젝트 상태 |

---

## 8. 하네스 엔지니어링 규칙

> "에이전트에게 하라고 말하지 말고, 잘못하는 것이 불가능하게 만들어라"

### 피드백 루프 계층

| Layer | 수단 | 속도 | 수준 |
|-------|------|------|------|
| 0 | 이 CLAUDE.md | ~0ms | 권고 |
| 1 | PostToolUse Hook (자동 lint) | ~500ms | 강제 피드백 |
| 2 | PreCommit Hook (테스트) | ~10s | 강제 차단 |
| 3 | git pre-commit hook | ~30s | 강제 차단 |
| 4 | CI Pipeline (GitHub Actions) | ~3min | 강제 차단 |
| 5 | Human Review (PR) | ~hours | 수동 |

### 에이전트 행동 규칙

1. **코드 편집 후**: Hook이 자동으로 lint를 실행함. lint 오류가 보이면 즉시 수정
2. **커밋 전**: Hook이 테스트를 실행함. 실패 시 커밋이 차단되므로 테스트를 먼저 수정
3. **문서 수정 시**: 해당 문서를 참조하는 다른 문서도 확인 (아래 의존 관계 참조)
4. **새 API 추가 시**: `docs/api/API_SPECIFICATION.md` 반드시 동시 업데이트

### 문서 의존 관계 (수정 시 연쇄 확인 필수)

```
CLAUDE.md 수정 시 → 영향 없음 (최상위)
docs/architecture/* 수정 시 → API_SPECIFICATION.md, database-erd.md 확인
docs/constitution/* 수정 시 → CLAUDE.md 참조 테이블 확인
docs/api/API_SPECIFICATION.md 수정 시 → depth-2-module-structure.md 확인
database-erd.md 수정 시 → database-consolidation-design.md 확인
blog-ui-design.md 수정 시 → light-mode-glass-design.md 확인 (역방향도 동일)
```

### 하네스 설정 (초기 셋업)

프로젝트 클론 후 한 번 실행:
```bash
bash .githooks/setup.sh
```
이 명령은 `git config core.hooksPath .githooks`를 설정하여 pre-commit hook을 활성화합니다.
