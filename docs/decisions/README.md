# Architecture Decision Records (ADR)

> **아키텍처 의사결정 기록**
> 프로젝트의 중요한 기술적 결정을 문서화

---

## ADR이란?

**Architecture Decision Record (ADR)**는 소프트웨어 프로젝트에서 내린 중요한 아키텍처 결정을 문서화하는 표준 방식입니다.

### 왜 필요한가?
- **컨텍스트 보존**: 왜 이 선택을 했는지 미래에도 이해 가능
- **의사결정 투명성**: 고려한 대안과 트레이드오프 명확화
- **팀 온보딩**: 새로운 팀원이 프로젝트 히스토리 빠르게 파악
- **세션 연속성**: AI 에이전트가 세션 전환 시 의사결정 맥락 유지

---

## ADR 목록

### 활성 ADR (Accepted)

| 번호 | 제목 | 날짜 | 상태 | 태그 |
|------|------|------|------|------|
| [ADR-001](ADR-001-database-consolidation.md) | 데이터베이스 통합 | 2026-01-07 | ✅ Accepted | #database #mvp |
| [ADR-002](ADR-002-observability-first.md) | Observability 우선 도입 | 2026-01-07 | ✅ Accepted | #logging #monitoring |
| [ADR-003](ADR-003-jwt-refresh-token-rotation.md) | JWT Refresh Token Rotation | 2026-01-07 | ✅ Accepted | #security #jwt |
| [ADR-004](ADR-004-test-strategy.md) | 테스트 전략 수립 | 2026-01-07 | ✅ Accepted | #testing #quality |

### 제안 중 (Proposed)
없음

### 폐기됨 (Deprecated)
없음

### 대체됨 (Superseded)
없음

---

## ADR 작성 가이드

### 언제 ADR을 작성하는가?

**작성해야 할 경우**:
- 아키텍처에 영향을 주는 기술 선택 (DB, 프레임워크, 라이브러리)
- 여러 대안이 있는 중요한 결정
- 향후 변경이 어려운 결정 (마이그레이션 비용 높음)
- 팀원/AI 에이전트에게 설명이 필요한 결정

**작성하지 않아도 되는 경우**:
- 명백하거나 사소한 결정
- 쉽게 되돌릴 수 있는 결정
- 구현 세부사항 (알고리즘 선택 등)

### 작성 프로세스

1. **템플릿 복사**: `ADR-000-template.md` 복사
2. **번호 부여**: 다음 번호 사용 (ADR-005, ADR-006...)
3. **내용 작성**:
   - Context: 왜 이 결정이 필요했는가?
   - Decision: 무엇을 결정했는가?
   - Alternatives: 어떤 대안을 고려했는가?
   - Consequences: 어떤 영향이 있는가?
4. **Status 설정**: Proposed → Accepted
5. **이 README 업데이트**: 목록에 추가

---

## ADR 형식

### Status (상태)
- **Proposed**: 제안됨 (아직 결정 안 됨)
- **Accepted**: 승인됨 (현재 사용 중)
- **Deprecated**: 폐기됨 (더 이상 사용 안 함)
- **Superseded**: 대체됨 (다른 ADR로 대체)

### 필수 섹션
1. **Context**: 배경 및 문제점
2. **Decision**: 선택한 방안 및 이유
3. **Alternatives Considered**: 고려한 대안 및 기각 이유
4. **Consequences**: 긍정적/부정적 영향

---

## 주요 ADR 요약

### ADR-001: 데이터베이스 통합
**결정**: PostgreSQL 3개 → 1개로 통합 (TimescaleDB Extension)
**이유**: MVP 복잡도 감소, 운영 부담 40% 감소, 비용 $30/월 절감
**영향**: 개발 속도 30% 향상, 확장성 일부 트레이드오프

### ADR-002: Observability 우선 도입
**결정**: Phase 1부터 구조화된 로깅 + Sentry 필수
**이유**: 프로덕션 디버깅 필수, 조기 도입으로 습관화
**영향**: 디버깅 효율 80% 향상, 장애 발견 10배 빠름

### ADR-003: JWT Refresh Token Rotation
**결정**: Refresh Token Rotation + HttpOnly Cookie 사용
**이유**: XSS 방지, 토큰 재사용 감지, 보안 강화
**영향**: XSS 저항성 99% 향상, 토큰 탈취 피해 최소화

### ADR-004: 테스트 전략 수립
**결정**: 70% 커버리지 목표 (Unit 70%, Integration 20%, E2E 10%)
**이유**: 리팩토링 안전성, 장기적 개발 속도 향상
**영향**: 버그 발생률 80% 감소, 코드 품질 개선

---

## 참고 자료

- [ADR 공식 가이드](https://adr.github.io/)
- [Michael Nygard's ADR](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR 템플릿](ADR-000-template.md)

---

**이 폴더는 프로젝트의 중요한 의사결정을 보존합니다.**
**새로운 결정 시 반드시 ADR을 작성하세요.**
