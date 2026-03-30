# ADR-006: 독립 서비스 아키텍처 전환

**Status**: Accepted
**Date**: 2026-03-30
**Deciders**: kwangwon
**Tags**: architecture, microservice, service-registry, db-separation

---

## Context (배경)

### 현재 상황

기존 설계는 **모듈러 모놀리스**로, 모든 기능(블로그, 벤치마크, 사용자 관리)이 하나의 Spring Boot api-server에 `module-*`로 결합되어 있었다.

```
기존: api-server (단일 JVM)
├── module-blog
├── module-user
├── module-benchmark    ← 모두 하나의 프로세스
└── 공유 domain DB
```

### 문제점

1. **새 프로젝트 추가 시 재빌드 필요**: 새 기능을 module-*로 추가하면 전체 api-server 재빌드/재배포
2. **기술 스택 제한**: 모든 모듈이 Java/Spring 강제 — AI API(Python) 등 이질적 스택 포함 어려움
3. **장애 격리 불가**: 하나의 모듈 장애가 전체 서비스 중단
4. **중앙 의존성**: api-server가 죽으면 모든 기능 사용 불가
5. **DB 공유 위험**: 모든 모듈이 같은 DB를 공유하여 스키마 변경 영향 범위 큼
6. **포트폴리오 가치**: 실제 MSA 설계/운영 경험을 보여줄 수 없음

### 요구사항

- 새 프로젝트(PhotoToon, Project-M 등)를 아무 기술 스택으로 개발 후 블로그에서 접근 가능
- 중앙(포털)이 꺼져도 서브 프로젝트가 독립 실행
- 서브 프로젝트가 꺼져도 포털은 정상 동작 (캐시 표시)
- 프로젝트당 별도 DB 보유

---

## Decision (결정)

**독립 서비스 + Service Registry 패턴**을 채택한다.

### 핵심 결정사항

1. **각 프로젝트는 독립 서비스**: 자체 프로세스, 자체 DB, 자체 Dockerfile
2. **Nginx를 API Gateway로 사용**: URL 패턴 기반 라우팅
3. **Portal API가 Service Registry 역할**: 서비스 등록/헬스체크/캐시
4. **DB 물리 분리**: 서비스별 독립 PostgreSQL 인스턴스 (Docker 컨테이너 분리)
5. **Service Contract**: 모든 서비스는 `/health` + `/api/summary` 구현

### 변경 전후

| 항목 | Before | After |
|------|--------|-------|
| 프로젝트명 | portfolio-blog-backend | **portfolio-portal** |
| api-server | 모든 모듈 포함 (blog+user+benchmark) | **Portal 전용** (blog+user+registry) |
| module-benchmark | api-server 내부 모듈 | **독립 서비스** (FastAPI) |
| domain | 모든 엔티티 공유 | Portal 엔티티만 |
| DB | 1개 공유 | **서비스별 분리** |
| 새 프로젝트 | module-* 추가 + 재빌드 | 독립 서비스 + 등록 |

---

## Alternatives (대안 검토)

### 1. 모듈러 모놀리스 유지
- **장점**: 단순, 배포 간단, 트랜잭션 쉬움
- **단점**: 확장성 제한, 기술 스택 고정, 장애 전파
- **탈락 이유**: 새 프로젝트 추가 요구사항 충족 불가

### 2. Spring Cloud Gateway + Eureka
- **장점**: 자동 서비스 디스커버리, 로드밸런싱
- **단점**: 인프라 복잡도 급증, 1인 개발에 과도, JVM 메모리 추가 필요
- **탈락 이유**: GB10 리소스 제한, MVP 단계에 과잉 엔지니어링

### 3. Kubernetes + Service Mesh (Istio)
- **장점**: 프로덕션급 서비스 메시, 자동 스케일링
- **단점**: 학습 곡선 극심, 로컬 개발 환경 무거움, AWS 비용 급증
- **탈락 이유**: 1인 포트폴리오 프로젝트에 부적합

### 4. Nginx + 수동 Registry (채택)
- **장점**: 단순, 가볍, 이해 용이, 기존 Docker Compose에 추가만
- **단점**: 자동 디스커버리 없음, 수동 등록 필요
- **채택 이유**: MVP에 적합한 복잡도, Phase 2에서 업그레이드 가능

---

## Consequences (결과)

### 긍정적
- 새 프로젝트 추가 시 포털 코드 수정 불필요
- 서비스별 독립 배포/장애 격리
- 기술 스택 자유 (Go, Rust, Node.js 등)
- MSA 설계 역량 포트폴리오에 증명
- DB 분리로 스키마 변경 영향 범위 최소화

### 부정적
- 서비스 간 트랜잭션 어려움 (eventual consistency 필요)
- 인프라 관리 포인트 증가 (Nginx 설정, 서비스별 Dockerfile)
- 로컬 개발 시 여러 서비스 동시 실행 필요

### 위험 완화
- Docker Compose profiles로 필요한 서비스만 선택 실행
- Service Contract을 최소화 (2개 엔드포인트)하여 진입 장벽 낮춤
- 서비스 간 데이터 동기화는 REST API 호출로 단순화 (이벤트 기반은 Phase 2)

---

## References

- [blog-architecture-context.md](../architecture/blog-architecture-context.md) — 시스템 아키텍처
- [depth-2-module-structure.md](../architecture/depth-2-module-structure.md) — 서비스별 모듈 구조
- [ADR-001](ADR-001-database-consolidation.md) — DB 통합 결정 (이 ADR로 일부 대체)
