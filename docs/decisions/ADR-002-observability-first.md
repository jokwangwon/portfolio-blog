# ADR-002: Observability 우선 도입

**Status**: Accepted
**Date**: 2026-01-07
**Deciders**: kwangwon
**Tags**: #logging #monitoring #sentry #observability

---

## Context (배경)

### 현재 상황
초기 아키텍처 설계에서는 로깅/모니터링에 대한 구체적 계획이 없었다. Spring Boot 기본 로깅(console 출력)만 사용하는 상태.

### 문제점
- **디버깅 비효율**: 로컬 개발 중에도 에러 발생 시 콘솔 로그를 눈으로 훑어야 함
- **원인 추적 불가**: 요청 단위 추적(request_id)이 없어 어느 요청에서 에러가 났는지 특정 어려움
- **프로덕션 대비 부재**: 배포 후 장애 발생 시 대응 체계 없음
- **일관성 부재**: 로컬과 프로덕션의 로깅 방식이 달라지면 디버깅 경험이 단절됨

### 요구사항
- 로컬 개발 단계부터 오류를 체계적으로 추적할 수 있어야 함
- 프로덕션까지 일관된 로깅 체계 유지
- 에러 발생 시 알림을 받을 수 있어야 함 (Phase 2)

---

## Decision (결정)

### 선택한 방안
**Phase 1(로컬 개발)부터 구조화된 JSON 로깅 + Sentry 에러 추적을 도입한다.**

- **Portal API (Spring Boot)**: Logback + Logstash Encoder (JSON 로깅) + MDC (request_id 추적)
- **AI Benchmark API (FastAPI)**: python-json-logger + 구조화된 로깅
- **Frontend (Next.js)**: Sentry SDK + Error Boundary
- **에러 추적**: Sentry (무료 티어, 5,000 errors/월)

### 이유
1. **로컬에서부터 오류 방지**: 개발 단계에서 에러를 구조적으로 추적하면 프로덕션 배포 전에 문제를 잡을 수 있다
2. **디버깅 효율**: request_id 기반 요청 추적으로 "어느 요청에서 뭐가 잘못됐는지" 즉시 파악
3. **일관성**: 로컬/프로덕션 동일한 로깅 구조 → 환경 전환 시 디버깅 방식 변경 불필요
4. **비용 무료**: Sentry 무료 티어로 충분 (MVP 트래픽 기준)

---

## Alternatives Considered (고려한 대안)

### 대안 1: Phase 2(AWS 배포)에서 도입
**설명**: 로컬 개발 중에는 기본 로깅만 사용하고, 프로덕션 배포 시 Observability 추가

**장점**:
- 초기 개발 속도 빠름
- 설정 작업 지연 가능

**단점**:
- 로컬에서 발생한 에러를 체계적으로 추적 못함
- 나중에 로깅 구조를 추가하면 기존 코드 전체에 로깅 코드 삽입 필요
- 프로덕션 배포 후에야 문제를 발견하게 됨

**채택하지 않은 이유**: 로컬에서부터 관리해야 오류 방지가 가능하다. 나중에 추가하면 이미 작성된 코드에 로깅을 일일이 넣어야 하므로 처음부터 습관화하는 것이 효율적.

### 대안 2: ELK Stack (Elasticsearch + Logstash + Kibana) 도입
**설명**: 자체 로그 수집/분석 인프라 구축

**장점**:
- 로그 검색/분석 강력
- 대시보드 자유도 높음

**단점**:
- 인프라 운영 부담 과도 (MVP 단계에 부적합)
- 리소스 소비 큼 (Elasticsearch 메모리)
- Sentry 무료 티어로 충분한 기능을 더 복잡하게 구현

**채택하지 않은 이유**: MVP 단계에서 과도한 인프라. Sentry + 구조화된 로깅으로 충분.

---

## Consequences (결과)

### 긍정적 영향
- 로컬 개발부터 에러 추적 체계 확보
- request_id 기반 요청 단위 디버깅 가능
- 프로덕션 전환 시 로깅 구조 변경 불필요
- Sentry 무료 티어로 비용 $0

### 부정적 영향
- 초기 설정 시간 필요 (Logback 설정, Sentry 연동, MDC 필터)
- 모든 서비스 코드에서 로깅 패턴을 따라야 함

### Trade-offs
- 초기 설정 비용 vs 장기적 디버깅 효율 → 장기 효율 우선
- 단순 console.log vs 구조화된 JSON → JSON 채택 (검색/필터링 가능)

---

## Implementation (구현)

### 필요한 작업
- [ ] Logback JSON 로깅 설정 (Portal API)
- [ ] MDC 필터 구현 (request_id, user_id)
- [ ] Python JSON 로깅 설정 (AI Benchmark API)
- [ ] Sentry 연동 (Frontend, Portal API, AI Benchmark API)
- [ ] Health Check 엔드포인트 (/health, /health/db)
- [ ] Error Boundary (Frontend)

### 영향받는 컴포넌트
- backend/api-server (Logback 설정, Sentry 의존성)
- backend/common (MDC RequestLoggingFilter)
- frontend (Sentry SDK, Error Boundary)
- ai-api (python-json-logger, sentry-sdk)

---

## References (참고 자료)

- [아키텍처 리뷰 보고서](../review/architecture-review.md) - 권장사항 #2
- [Observability 설계 문서](../architecture/observability-design.md) - 상세 구현 가이드
- [Sentry 공식 문서](https://docs.sentry.io/)

---

**Created**: 2026-01-07
**Last Updated**: 2026-01-07
