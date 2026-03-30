# CLAUDE.md — 프로젝트 개발 지시사항

> Claude Code가 매 세션마다 자동으로 읽는 프로젝트 규칙 문서

---

## 1. 핵심 개발 방법론: SDD + TDD

### SDD (Specification-Driven Development)
- **코드보다 문서가 우선**. 코드 변경 전 관련 SDD 문서 확인 필수
- SDD 문서 경로: `docs/sdd/` 하위 명세서 참조
- 문서와 코드 간 불일치 발견 시 → 문서를 기준으로 코드 수정

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
| 프로젝트 헌법 | `docs/guides/PROJECT_CONSTITUTION.md` | 최상위 원칙 |
| 개발 가이드 | `docs/guides/DEVELOPMENT_GUIDE.md` | 개발 프로세스/Git 정책 |
| 테스트 전략 | `docs/guides/TEST_STRATEGY.md` | 테스트 방법론/도구 |
| 보안 원칙 | `docs/guides/SECURITY_PRINCIPLES.md` | 보안 규칙 |
| 코드 품질 | `docs/guides/CODE_QUALITY_PRINCIPLES.md` | 코드 스타일/규칙 |
| 아키텍처 원칙 | `docs/guides/ARCHITECTURE_PRINCIPLES.md` | 아키텍처 설계 원칙 |
| 멀티에이전트 설계 | `docs/architecture/multi-agent-system-design.md` | 3+1 에이전트 상세 |
| 컨텍스트 | `docs/CONTEXT.md` | 현재 프로젝트 상태 |
