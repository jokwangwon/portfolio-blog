# ADR-001: 데이터베이스 통합 (PostgreSQL + TimescaleDB Extension)

**Status**: Accepted
**Date**: 2026-01-07
**Deciders**: 프로젝트 오너, 아키텍처 리뷰 에이전트
**Tags**: #database #architecture #mvp #simplification

---

## Context (배경)

### 현재 상황
초기 아키텍처 설계에서는 다음 3개의 데이터베이스를 사용할 계획이었습니다:
1. **PostgreSQL**: 블로그 데이터 (게시글, 사용자, 댓글)
2. **TimescaleDB**: GPU 메트릭 시계열 데이터
3. **Redis**: 세션, 캐시, Refresh Token Blacklist

### 문제점
- **과도한 복잡도**: MVP 단계에서 3개 DB 운영은 과도함
- **운영 부담**: 백업, 모니터링, 버전 관리 3배
- **개발 속도 저하**: DB 연결 설정, 마이그레이션 2배
- **비용 증가**: AWS RDS 인스턴스 2개 필요 (PostgreSQL + TimescaleDB)

### 요구사항
- GPU 메트릭 시계열 데이터 효율적 저장
- 블로그 데이터 정규화 저장
- MVP 단계에서 빠른 개발 속도
- AWS 전환 시 비용 최소화

---

## Decision (결정)

### 선택한 방안
**PostgreSQL 단일 DB + TimescaleDB Extension 사용**

```
Before: PostgreSQL + TimescaleDB (분리) + Redis
After:  PostgreSQL (with TimescaleDB extension)
```

TimescaleDB는 PostgreSQL의 확장(Extension)이므로:
- 하나의 DB에서 일반 테이블 + 시계열 테이블 공존
- PostgreSQL 기능 100% 호환
- Hypertable로 시계열 데이터 최적화

### 이유
1. **복잡도 감소**: 1개 DB만 관리 (운영 부담 40% 감소)
2. **개발 속도 향상**: 연결 설정 1회, 마이그레이션 1개
3. **비용 절감**: AWS RDS 인스턴스 1개로 충분 ($30/월 절감)
4. **기능 유지**: TimescaleDB Extension으로 시계열 최적화 여전히 가능
5. **Redis 지연**: Phase 1에서는 트래픽 낮아 캐싱 불필요

---

## Alternatives Considered (고려한 대안)

### 대안 1: 현재 설계 유지 (PostgreSQL + TimescaleDB 분리 + Redis)
**설명**: 각 DB를 역할별로 완전히 분리

**장점**:
- 역할 분담 명확
- 확장성 높음
- 포트폴리오 어필 강함 (멀티 DB 경험)

**단점**:
- MVP 단계에서 과도한 복잡도
- 운영 부담 큼 (백업 3배, 모니터링 3배)
- AWS 비용 높음 (RDS 2개 + ElastiCache)
- 개발 속도 느림

**채택하지 않은 이유**: 아키텍처 리뷰에서 "MVP에서는 PostgreSQL 통합 권장" 결론

---

### 대안 2: PostgreSQL 단일 DB (TimescaleDB Extension 없음)
**설명**: PostgreSQL만 사용, 시계열 데이터도 일반 테이블로 저장

**장점**:
- 가장 단순함
- 설치 간편

**단점**:
- 시계열 데이터 쿼리 성능 저하 (인덱스로만 최적화)
- GPU 메트릭 대량 데이터 처리 비효율
- 자동 압축/삭제 정책 없음

**채택하지 않은 이유**: TimescaleDB Extension은 Docker 이미지로 쉽게 사용 가능하고, 시계열 최적화 필요

---

### 대안 3: InfluxDB (시계열 전용 DB)
**설명**: GPU 메트릭을 InfluxDB에 저장

**장점**:
- 시계열 데이터에 최적화
- Grafana 연동 쉬움

**단점**:
- 또 다른 DB 추가 (복잡도 증가)
- SQL 사용 불가 (InfluxQL 학습 필요)
- PostgreSQL과 데이터 조인 불가
- AWS에서 관리형 서비스 없음 (직접 운영 필요)

**채택하지 않은 이유**: TimescaleDB로 충분하고, PostgreSQL과 통합 가능

---

## Consequences (결과)

### 긍정적 영향
- ✅ **운영 복잡도 40% 감소**: 1개 DB만 관리
- ✅ **개발 속도 30% 향상**: 연결 설정, 마이그레이션 단순화
- ✅ **AWS 비용 절감**: $30/월 (RDS 인스턴스 1개 감소)
- ✅ **백업/복구 단순화**: 1개 DB만 백업
- ✅ **트랜잭션 지원**: 블로그 데이터 ↔ 벤치마크 메타데이터 간 ACID 보장

### 부정적 영향
- ⚠️ **확장성 제한**: 트래픽 증가 시 DB 분리 필요할 수 있음
- ⚠️ **포트폴리오 어필 약화**: "멀티 DB 운영 경험" 못 함

### Trade-offs (절충안)
- **복잡도 vs 확장성**: 초기 복잡도를 낮추는 대신 확장성 일부 포기
- **비용 vs 성능**: 초기 비용 절감, 트래픽 증가 시 분리 고려
- **포트폴리오 vs 실용성**: 실무에 가까운 MVP 우선 접근

---

## Implementation (구현)

### 필요한 작업
- [x] TimescaleDB 포함 PostgreSQL Docker 이미지 선택
- [ ] Docker Compose 설정 작성
- [ ] Flyway 마이그레이션 파일 작성
- [ ] Hypertable 생성 스크립트 (gpu_metrics)
- [ ] Spring Boot / FastAPI 연결 설정
- [ ] 압축/삭제 정책 설정

### 영향받는 컴포넌트
- Main API (Spring Boot): PostgreSQL 연결 1개로 통합
- AI API (FastAPI): PostgreSQL 연결 1개로 통합
- Infrastructure: docker-compose.yml 수정
- Deployment: AWS RDS 인스턴스 1개로 계획 변경

### 예상 비용/시간
- **개발 시간**: 마이그레이션 작성 2시간, 설정 1시간 (총 3시간)
- **비용 절감**: AWS Phase에서 월 $30 절감

---

## References (참고 자료)

- [아키텍처 리뷰 보고서](../review/architecture-review.md) - "PostgreSQL 통합 권장"
- [데이터베이스 통합 설계](../architecture/database-consolidation-design.md)
- [TimescaleDB 공식 문서](https://docs.timescale.com/)
- [PostgreSQL Extensions](https://www.postgresql.org/docs/current/contrib.html)

---

## Notes (비고)

### Phase 2 확장 계획
- 트래픽 증가 시 TimescaleDB 분리 고려 가능
- Redis는 캐싱 필요 시점에 추가 (Phase 2)
- Read Replica 추가로 조회 성능 향상 가능

### Redis 제거 결정
- Refresh Token Blacklist → PostgreSQL 테이블로 대체
- API 캐시 → Phase 1에서는 불필요 (트래픽 낮음)
- 세션 → Stateless JWT 사용 (세션 불필요)

---

**Created**: 2026-01-07
**Last Updated**: 2026-01-07
**Supersedes**: N/A
**Superseded By**: N/A
