# 프로젝트 컨텍스트 (Project Context)

> **AI 에이전트가 세션 시작 시 가장 먼저 읽어야 하는 문서**
> 현재 프로젝트 상태, 진행 중인 작업, 다음 할 일을 기록

**최종 업데이트**: 2026-01-07 (세션 #1)

---

## 🎯 현재 프로젝트 상태

### Phase
**Phase 0: 설계 및 문서화** (완료 90%)

### 마지막 작업
- 아키텍처 리뷰 완료 (평가 4.2/5.0)
- PostgreSQL 통합 설계 완료
- Observability 설계 완료
- JWT 보안 강화 설계 완료
- 테스트 전략 수립 완료

### 현재 상황
모든 설계 문서가 작성되었고, 개발 환경 구축 직전 단계입니다.

---

## 📋 다음 할 일 (Next Actions)

### 즉시 (Immediate)
1. **개발 환경 구축**
   - [ ] Docker Compose 설정 (PostgreSQL + TimescaleDB)
   - [ ] Spring Boot 멀티 모듈 프로젝트 생성
   - [ ] Next.js 프로젝트 생성
   - [ ] FastAPI 프로젝트 생성

2. **데이터베이스 초기화**
   - [ ] Flyway 마이그레이션 파일 작성 (V1__init_schema.sql)
   - [ ] TimescaleDB Extension 활성화
   - [ ] Hypertable 생성 (gpu_metrics)

### 다음 (Next)
3. **기본 인프라**
   - [ ] Logback JSON 로깅 설정
   - [ ] Sentry 연동 (무료 티어)
   - [ ] Health Check 엔드포인트

4. **인증 구현**
   - [ ] JWT Provider 구현
   - [ ] Refresh Token Rotation 구현
   - [ ] OAuth2 소셜 로그인 (Google, GitHub)

---

## 🔑 주요 의사결정 기록

### 1. 데이터베이스 통합 결정
- **결정일**: 2026-01-07
- **결정**: PostgreSQL 3개 → 1개로 통합 (TimescaleDB extension 사용)
- **이유**: MVP 단계에서 복잡도 과도, 운영 부담 감소
- **근거**: `docs/review/architecture-review.md` 권장사항 #1
- **관련 문서**: `docs/architecture/database-consolidation-design.md`

### 2. State Management: Redux Toolkit 선택
- **결정일**: 2026-01-07 (초기 설계)
- **결정**: Redux Toolkit 사용 (Zustand 대신)
- **이유**: 취업 포트폴리오 강화 목적, 기업에서 많이 사용
- **대안**: Zustand (경량), Jotai (Atomic)
- **사용자 강조**: "취업 포폴 강화 목적이라 redux toolkit으로 진행"

### 3. Redis 도입 지연
- **결정일**: 2026-01-07
- **결정**: Phase 1에서는 Redis 제외, Phase 2로 지연
- **이유**: 초기 트래픽 낮음, 복잡도 감소
- **대안**: Refresh Token Blacklist는 PostgreSQL 테이블 사용
- **관련 문서**: `docs/architecture/database-consolidation-design.md` > 6. Redis 제거

### 4. Observability 조기 도입
- **결정일**: 2026-01-07
- **결정**: Phase 1부터 구조화된 로깅 + Sentry 필수
- **이유**: 프로덕션 운영 시 디버깅 필수
- **근거**: `docs/review/architecture-review.md` 권장사항 #2
- **관련 문서**: `docs/architecture/observability-design.md`

### 5. 테스트 커버리지 목표
- **결정일**: 2026-01-07
- **결정**: 전체 70% 커버리지 목표
- **세부**: Service 80%, Controller 70%, Repository 60%
- **관련 문서**: `docs/guides/TEST_STRATEGY.md`

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
현재 설계 단계 완료, 개발 환경 구축 대기 중

---

## ⚠️ 주의사항

### 절대 하지 말아야 할 것
1. **헌법 위반**: `PROJECT_CONSTITUTION.md` 조항 위반
2. **문서 없는 개발**: 설계 문서 없이 코드 작성
3. **과도한 기술 스택**: MVP에 불필요한 기술 추가
4. **Redis 도입**: Phase 1에서는 PostgreSQL만 사용

### 강조 사항
1. **코드보다 문서**: 변경 사항은 문서부터 업데이트
2. **보안 우선**: JWT Rotation, XSS 방지 필수
3. **테스트 작성**: 핵심 로직은 70% 커버리지
4. **구조화된 로깅**: 처음부터 JSON 로깅 설정

---

## 📊 프로젝트 통계

### 문서 현황
- 헌법 문서: 4개
- 아키텍처 설계: 5개
- 가이드: 2개
- 검토 보고서: 1개
- 총 문서: 14개

### 완료된 설계
- [x] 전체 시스템 아키텍처 (Depth 1)
- [x] 모듈 구조 (Depth 2)
- [x] PostgreSQL 통합 설계
- [x] Observability 설계
- [x] JWT 보안 강화 설계
- [x] 테스트 전략

### 미완료
- [ ] DB 스키마 ERD
- [ ] API 명세서 (OpenAPI)
- [ ] Depth 3/4 상세 설계 (개발하면서 진행)

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

### 주요 결정
1. 문서 재구성 완료 (`docs/` 폴더 내 체계화)
2. 아키텍처 리뷰 4가지 권장사항 모두 설계에 반영
3. 과거 문서 관리를 위한 `docs/history/` 폴더 생성
4. 세션 컨텍스트 관리를 위한 이 문서 작성

### 사용자 마지막 요청
"이제 클로드가 연결이 끊기고 다시 붙을때 과거의 중요 대화 등 대화흐름과 강조 사항이 문서에 반영되었는지 판단 및 대화 추적을 위한 고민이 필요해"

→ 이 문서(`CONTEXT.md`)와 세션 로그 시스템으로 해결

---

## 💡 다음 세션을 위한 메모

### 개발 환경 구축 시작
- Docker Compose 설정부터 시작
- PostgreSQL + TimescaleDB 이미지 사용
- Spring Boot 멀티 모듈 프로젝트 생성

### 우선 구현할 기능
1. 데이터베이스 스키마 (Flyway)
2. 구조화된 로깅 설정
3. JWT Provider + Refresh Token Rotation
4. Health Check 엔드포인트

---

**이 문서는 프로젝트의 현재 상태를 나타냅니다.**
**세션이 바뀔 때마다 반드시 업데이트하세요.**
**AI 에이전트는 세션 시작 시 이 문서를 가장 먼저 읽어야 합니다.**
