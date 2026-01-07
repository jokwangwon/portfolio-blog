# 문서 인덱스 (Documentation Index)

> **프로젝트 문서 전체 구조 및 읽는 순서**

**최종 업데이트**: 2026-01-07

---

## 📖 문서 읽는 순서 (권장)

### 1. 시작하기
1. **[README.md](../README.md)** - 프로젝트 개요, 기술 스택, 시작 가이드
2. **[docs/constitution/PROJECT_CONSTITUTION.md](constitution/PROJECT_CONSTITUTION.md)** 🔴 **필독** - 프로젝트 헌법 (최상위 규칙)

### 2. 아키텍처 이해
3. **[docs/architecture/blog-architecture-context.md](architecture/blog-architecture-context.md)** - 전체 시스템 아키텍처 (Depth 1)
4. **[docs/architecture/depth-2-module-structure.md](architecture/depth-2-module-structure.md)** - 모듈 상세 구조 (Depth 2)
5. **[docs/review/architecture-review.md](review/architecture-review.md)** - 아키텍처 검토 보고서 (평가 4.2/5.0)

### 3. 개선된 설계 (아키텍처 리뷰 반영)
6. **[docs/architecture/database-consolidation-design.md](architecture/database-consolidation-design.md)** 🔴 - PostgreSQL 통합 설계
7. **[docs/architecture/observability-design.md](architecture/observability-design.md)** 🔴 - 로깅, 모니터링, 에러 추적
8. **[docs/architecture/jwt-security-enhancement.md](architecture/jwt-security-enhancement.md)** 🟠 - JWT 보안 강화

### 4. 개발 가이드
9. **[docs/guides/DEVELOPMENT_GUIDE.md](guides/DEVELOPMENT_GUIDE.md)** - 코딩 컨벤션, Git 규칙, API 설계
10. **[docs/guides/TEST_STRATEGY.md](guides/TEST_STRATEGY.md)** 🟠 - 테스트 전략 (70% 커버리지 목표)

### 5. 원칙 문서 (상세 규칙)
11. **[docs/constitution/ARCHITECTURE_PRINCIPLES.md](constitution/ARCHITECTURE_PRINCIPLES.md)** - 아키텍처 10대 원칙
12. **[docs/constitution/CODE_QUALITY_PRINCIPLES.md](constitution/CODE_QUALITY_PRINCIPLES.md)** - 코드 품질 원칙
13. **[docs/constitution/SECURITY_PRINCIPLES.md](constitution/SECURITY_PRINCIPLES.md)** - 보안 원칙

---

## 📁 문서 구조

```
docs/
├── INDEX.md                          # 📍 현재 문서 (문서 인덱스)
├── CONTEXT.md                        # 🔴 프로젝트 현재 상태 (AI 에이전트 필독)
│
├── constitution/                     # 헌법 및 원칙 (최우선)
│   ├── PROJECT_CONSTITUTION.md       # 🔴 프로젝트 헌법 (12개 조항)
│   ├── ARCHITECTURE_PRINCIPLES.md    # 아키텍처 10대 원칙
│   ├── CODE_QUALITY_PRINCIPLES.md    # 코드 품질 원칙
│   └── SECURITY_PRINCIPLES.md        # 보안 원칙
│
├── architecture/                     # 아키텍처 설계
│   ├── blog-architecture-context.md  # 전체 시스템 아키텍처 (Depth 1)
│   ├── depth-2-module-structure.md   # 모듈 구조 (Depth 2)
│   ├── database-consolidation-design.md  # 🔴 PostgreSQL 통합 설계
│   ├── observability-design.md       # 🔴 Observability 설계
│   └── jwt-security-enhancement.md   # 🟠 JWT 보안 강화
│
├── review/                           # 검토 및 분석
│   └── architecture-review.md        # 아키텍처 검토 보고서
│
├── guides/                           # 개발 가이드
│   ├── DEVELOPMENT_GUIDE.md          # 개발 가이드 (코딩 컨벤션, Git 규칙)
│   └── TEST_STRATEGY.md              # 🟠 테스트 전략
│
├── decisions/                        # 의사결정 기록 (ADR)
│   ├── README.md                     # ADR 작성 가이드
│   ├── ADR-000-template.md           # ADR 템플릿
│   ├── ADR-001-database-consolidation.md
│   ├── ADR-002-observability-first.md
│   ├── ADR-003-jwt-refresh-token-rotation.md
│   └── ADR-004-test-strategy.md
│
├── sessions/                         # 세션별 작업 로그
│   ├── README.md                     # 세션 로그 가이드
│   └── SESSION_2026-01-07.md         # 세션 #1 로그
│
└── history/                          # 과거 문서 (참고용)
    └── README.md                     # 아카이브 설명
```

---

## 🎯 우선순위별 문서

### 🔴 CRITICAL (반드시 읽어야 함)
- `PROJECT_CONSTITUTION.md` - 프로젝트 헌법 (모든 개발의 기준)
- `database-consolidation-design.md` - DB 통합 설계 (기존 3개 DB → 1개)
- `observability-design.md` - 로깅/모니터링 (프로덕션 필수)

### 🟠 HIGH (Phase 1 완료 전)
- `jwt-security-enhancement.md` - JWT 보안 강화
- `TEST_STRATEGY.md` - 테스트 전략 (70% 커버리지)
- `DEVELOPMENT_GUIDE.md` - 개발 가이드

### 🟡 MEDIUM (참고)
- `architecture-review.md` - 아키텍처 검토 (권장사항)
- `ARCHITECTURE_PRINCIPLES.md` - 아키텍처 원칙
- `CODE_QUALITY_PRINCIPLES.md` - 코드 품질 원칙
- `SECURITY_PRINCIPLES.md` - 보안 원칙

---

## 📝 문서 간 관계

```
PROJECT_CONSTITUTION.md (헌법)
    ↓
    ├─→ ARCHITECTURE_PRINCIPLES.md (제2조 상세화)
    ├─→ CODE_QUALITY_PRINCIPLES.md (제3조 상세화)
    └─→ SECURITY_PRINCIPLES.md (제7조 상세화)

blog-architecture-context.md (기본 아키텍처)
    ↓
architecture-review.md (검토 및 개선안)
    ↓
개선 설계 문서들:
    ├─→ database-consolidation-design.md
    ├─→ observability-design.md
    └─→ jwt-security-enhancement.md
```

---

## 🔄 문서 업데이트 이력

| 날짜 | 변경 내용 | 관련 문서 |
|------|-----------|-----------|
| 2026-01-07 | 프로젝트 헌법 제정 | `PROJECT_CONSTITUTION.md` |
| 2026-01-07 | 아키텍처 리뷰 완료 | `architecture-review.md` |
| 2026-01-07 | PostgreSQL 통합 설계 | `database-consolidation-design.md` |
| 2026-01-07 | Observability 설계 추가 | `observability-design.md` |
| 2026-01-07 | JWT 보안 강화 설계 | `jwt-security-enhancement.md` |
| 2026-01-07 | 테스트 전략 수립 | `TEST_STRATEGY.md` |

---

## 🚀 개발 시작 전 체크리스트

개발을 시작하기 전에 다음 문서를 읽었는지 확인하세요:

- [ ] **README.md** - 프로젝트 개요 이해
- [ ] **PROJECT_CONSTITUTION.md** - 헌법 숙지 (필수)
- [ ] **blog-architecture-context.md** - 전체 아키텍처 이해
- [ ] **database-consolidation-design.md** - DB 설계 확인
- [ ] **observability-design.md** - 로깅/모니터링 전략 확인
- [ ] **DEVELOPMENT_GUIDE.md** - 코딩 컨벤션 확인

---

## 📌 자주 찾는 정보

### API 설계 규칙은?
→ `DEVELOPMENT_GUIDE.md` > "API 설계 원칙" 섹션

### 데이터베이스 스키마는?
→ `database-consolidation-design.md` > "3. 데이터베이스 스키마 설계"

### 로깅은 어떻게?
→ `observability-design.md` > "2.1 구조화된 로깅"

### JWT 인증 구현은?
→ `jwt-security-enhancement.md` > "3. 구현 설계"

### 테스트 작성 방법은?
→ `TEST_STRATEGY.md` > "2. Backend 테스트" 또는 "3. AI API 테스트"

### Git 커밋 규칙은?
→ `DEVELOPMENT_GUIDE.md` > "Git 워크플로우" 섹션

---

## 💡 AI 에이전트를 위한 안내

이 프로젝트에서 개발을 도울 때:

1. **반드시 준수**: `PROJECT_CONSTITUTION.md` (헌법)
2. **설계 참고**: `docs/architecture/` 폴더의 설계 문서들
3. **코딩 스타일**: `DEVELOPMENT_GUIDE.md` 참고
4. **보안**: `SECURITY_PRINCIPLES.md` + `jwt-security-enhancement.md` 준수

**변경 사항 발생 시**:
- 관련 문서 업데이트 필수
- 이 INDEX.md의 업데이트 이력에 기록

---

**이 문서는 프로젝트의 모든 문서를 안내하는 인덱스입니다.**
**새로운 문서 추가 시 반드시 이 파일도 업데이트하세요.**
