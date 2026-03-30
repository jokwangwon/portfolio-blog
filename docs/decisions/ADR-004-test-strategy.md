# ADR-004: 테스트 전략 수립

**Status**: Accepted
**Date**: 2026-01-07
**Deciders**: kwangwon
**Tags**: #testing #quality #coverage #ci

---

## Context (배경)

### 현재 상황
프로젝트 초기 설계 단계에서 테스트에 대한 구체적 전략이 없었다. 코드 품질을 최우선으로 하는 프로젝트 헌법(PROJECT_CONSTITUTION.md 제3조)이 제정되었으나, 이를 보장할 테스트 체계가 부재.

### 문제점
- **리팩토링 위험**: 테스트 없이 코드를 수정하면 기존 기능이 깨질 수 있음
- **회귀 버그**: 새 기능 추가 시 기존 기능에 영향을 주는지 확인 불가
- **코드 신뢰도**: 핵심 비즈니스 로직(인증, 게시글 CRUD)이 올바르게 동작하는지 자동 검증 수단 없음
- **배포 불안**: CI/CD 파이프라인에서 자동 검증 없이 배포하면 장애 위험

### 요구사항
- 핵심 비즈니스 로직의 정확성을 자동으로 검증
- 리팩토링 시 기존 기능 보호
- CI/CD 파이프라인에서 자동 실행
- 현실적인 목표 (MVP 개발 속도와 균형)

---

## Decision (결정)

### 선택한 방안
**70% 커버리지 목표 + 테스트 피라미드(Unit 70% / Integration 20% / E2E 10%)**

#### 레이어별 커버리지 목표

| 레이어 | 목표 | 이유 |
|--------|------|------|
| Service (비즈니스 로직) | 80% | 핵심 로직, 버그 시 직접적 영향 |
| Controller (API) | 70% | 요청/응답 검증, 권한 체크 |
| Repository (쿼리) | 60% | N+1 방지, 복잡 쿼리 검증 |
| Util/Helper | 90% | 입력/출력 명확, 테스트 쉬움 |

#### 기술 스택

| 영역 | 도구 |
|------|------|
| Backend Unit | JUnit 5 + Mockito + AssertJ |
| Backend Integration | Spring Boot Test + Testcontainers (실제 PostgreSQL) |
| Backend Coverage | JaCoCo |
| AI API | pytest + pytest-asyncio + pytest-cov |
| Frontend Unit | Jest + React Testing Library |
| Frontend API Mock | MSW (Mock Service Worker) |
| Frontend E2E | Playwright |

### 이유
1. **리팩토링 안전망**: 테스트가 있어야 코드를 자신 있게 수정할 수 있음
2. **70%는 현실적 균형**: 100% TDD는 MVP 속도와 충돌, 0%는 품질 포기 — 70%가 실효성 있는 최소 기준
3. **피라미드 구조**: Unit 테스트 위주로 빠르게, Integration으로 연동 검증, E2E는 핵심 플로우만
4. **Testcontainers**: Mock DB가 아닌 실제 PostgreSQL로 테스트해야 마이그레이션/쿼리 문제를 조기 발견

---

## Alternatives Considered (고려한 대안)

### 대안 1: 테스트 없이 개발 후 나중에 추가
**설명**: MVP를 먼저 완성한 뒤 테스트를 일괄 작성

**장점**:
- 초기 개발 속도 최대화
- 요구사항 변경 시 테스트 재작성 불필요

**단점**:
- 이미 작성된 코드에 테스트를 붙이는 것은 훨씬 어려움 (테스트하기 어려운 구조가 굳어짐)
- 리팩토링 불가 (기존 기능이 깨지는지 확인 수단 없음)
- "나중에 추가"는 대부분 실현되지 않음

**채택하지 않은 이유**: 코드 품질 > 개발 속도 (프로젝트 헌법 제3조). 나중에 추가하면 테스트 가능한 구조로 코드를 바꿔야 하는 이중 작업 발생.

### 대안 2: 100% TDD (Test-Driven Development)
**설명**: 모든 코드를 테스트 먼저 작성 후 구현

**장점**:
- 최고 수준의 코드 품질
- 설계가 자연스럽게 개선됨

**단점**:
- MVP 개발 속도 크게 저하
- 1인 개발에서 모든 코드에 TDD 적용은 비현실적
- 초기 설계가 자주 바뀌는 단계에서 테스트 재작성 비용 큼

**채택하지 않은 이유**: MVP 단계에서 현실적 균형 필요. 핵심 로직(인증, CRUD)에만 선택적 TDD 적용하고, 나머지는 구현 후 테스트 작성.

---

## Consequences (결과)

### 긍정적 영향
- 핵심 비즈니스 로직에 대한 자동화된 검증
- 리팩토링 시 회귀 버그 방지
- CI/CD 파이프라인에서 자동 품질 게이트
- 포트폴리오 어필 (테스트 전략 + 커버리지 리포트)

### 부정적 영향
- 기능 구현 시 테스트 작성 시간 추가 (약 30~40% 추가 소요)
- Testcontainers 사용으로 Integration 테스트 실행 시간 증가

### Trade-offs
- 개발 속도 vs 코드 품질 → 품질 우선 (프로젝트 헌법)
- Mock DB vs 실제 DB → 실제 DB (Testcontainers) 채택, 느리지만 신뢰도 높음

---

## Implementation (구현)

### 필요한 작업
- [ ] JaCoCo 플러그인 설정 (70% 최소 커버리지)
- [ ] Testcontainers 의존성 추가 및 IntegrationTestBase 클래스 작성
- [ ] 인증 로직 Unit/Integration 테스트 작성 (AuthService, JwtTokenProvider)
- [ ] pytest 설정 (AI Benchmark API)
- [ ] Jest + React Testing Library 설정 (Frontend)
- [ ] GitHub Actions CI 워크플로우 (테스트 자동 실행)
- [ ] Codecov 연동 (커버리지 리포트)

### 영향받는 컴포넌트
- backend 전체 (JaCoCo, Testcontainers 의존성)
- frontend (Jest, RTL, MSW, Playwright 의존성)
- ai-api (pytest, pytest-cov 의존성)
- CI/CD (.github/workflows/test.yml)

---

## References (참고 자료)

- [아키텍처 리뷰 보고서](../review/architecture-review.md) - 권장사항 #4
- [테스트 전략 문서](../guides/TEST_STRATEGY.md) - 상세 가이드 및 코드 예시
- [프로젝트 헌법 제3조](../constitution/PROJECT_CONSTITUTION.md) - 코드 품질 원칙

---

**Created**: 2026-01-07
**Last Updated**: 2026-01-07
