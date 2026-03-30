# Pixel Office - AI 에이전트 가상 사무실 설계

**Status**: Accepted
**Date**: 2026-03-26
**관련 ADR**: [ADR-005-pixel-office-tech-stack](../decisions/ADR-005-pixel-office-tech-stack.md)
**서비스 경계**: Portal API 내부 모듈 (`module-office`)
**DB 소속**: `portal_db`

---

## 1. 개요

### 1.1 컨셉

2D 픽셀아트 스타일의 가상 사무실에서 AI 에이전트 캐릭터들이 실제 개발 작업 상태에 따라 움직이며 일하는 **인터랙티브 대시보드**.

포트폴리오 방문자는 픽셀 사무실을 통해:
- 현재 프로젝트의 개발 진행 상황을 직관적으로 파악
- AI 에이전트 캐릭터를 클릭하여 상세 작업 내용 확인
- 레트로 감성의 픽셀 게임 경험

### 1.2 핵심 가치

- **차별화**: 3D 포트폴리오(React Three Fiber) + 2D 픽셀 오피스의 대비
- **실시간 시각화**: 정적 대시보드가 아닌 살아있는 사무실
- **기술 어필**: PixiJS 2D 렌더링 + WebGL 활용 능력 증명

---

## 2. 사무실 공간 설계

### 2.1 공간 구성 (탑다운 뷰)

```
┌─────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Backend  │  │ Frontend │  │   Deploy Room  │  │
│  │  Desk    │  │  Desk    │  │   (서버실)     │  │
│  │  🧑‍💻      │  │  🧑‍💻      │  │   🖥️          │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ AI Lab   │  │ QA Room  │  │  Meeting Room  │  │
│  │ (AI연구) │  │ (테스트) │  │  (회의실)      │  │
│  │  🤖      │  │  🔍      │  │  📋           │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           Lounge (휴게실/대기)            │   │
│  │  ☕  🪴  🎮                               │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 2.2 구역별 역할 매핑

| 구역 | 개발 파이프라인 | 에이전트 행동 |
|------|----------------|--------------|
| **Backend Desk** | 백엔드 개발 | 커밋 작성, API 구현, DB 작업 |
| **Frontend Desk** | 프론트엔드 개발 | UI 컴포넌트 작업, 스타일링 |
| **AI Lab** | AI/ML 개발 | 모델 학습, 벤치마크 실행 |
| **QA Room** | 테스트/검증 | 테스트 실행, 버그 리포트 작성 |
| **Deploy Room** | CI/CD/배포 | 빌드, 배포, 서버 모니터링 |
| **Meeting Room** | 기획/리뷰 | PR 리뷰, 이슈 논의 |
| **Lounge** | 대기/유휴 | 커피 마시기, 휴식 |

---

## 3. AI 에이전트 캐릭터

### 3.1 에이전트 목록

| 캐릭터 | 역할 | 주요 데이터 소스 |
|--------|------|-----------------|
| **백엔드 개발자** | Spring Boot 모듈 작업 | GitHub 커밋 (backend/**) |
| **프론트엔드 개발자** | Next.js/React 작업 | GitHub 커밋 (frontend/**) |
| **AI 연구원** | FastAPI/모델 작업 | GitHub 커밋 (ai/**), 벤치마크 결과 |
| **QA 엔지니어** | 테스트 작성/실행 | GitHub Actions 테스트 결과 |
| **DevOps 엔지니어** | 배포/인프라 | GitHub Actions 배포, 서버 헬스체크 |

### 3.2 캐릭터 상태 머신

```
[Idle] ──커밋 감지──→ [Working] ──완료──→ [Celebrating]
  │                      │                      │
  │                      ├──에러──→ [Frustrated] │
  │                      │             │         │
  │                      │             └──해결──→─┘
  │                      │
  └──장시간 유휴──→ [Resting] (Lounge로 이동)
```

### 3.3 상태별 애니메이션

| 상태 | 스프라이트 동작 | 위치 |
|------|----------------|------|
| `IDLE` | 자리에서 가만히 앉아있음 | 담당 데스크 |
| `WORKING` | 키보드 타이핑, 모니터 응시 | 담당 데스크 |
| `REVIEWING` | 문서 들고 읽는 모습 | Meeting Room |
| `TESTING` | 돋보기 들고 살펴보는 모습 | QA Room |
| `DEPLOYING` | 서버실에서 버튼 누르는 모습 | Deploy Room |
| `CELEBRATING` | 기쁨 이모트 + 점프 | 현재 위치 |
| `FRUSTRATED` | 머리 긁적 + 물음표 | 현재 위치 |
| `RESTING` | 커피 마시기, 소파 앉기 | Lounge |

---

## 4. 데이터 소스 설계 (하이브리드)

### 4.1 아키텍처

```
GitHub API ─────→ ┌──────────────────┐ ──→ PixiJS
(실제 활동 데이터)  │  Portal API      │     (렌더링)
                   │  (상태 변환 엔진) │
Server Health ───→ │                  │ ──→ React UI
(헬스체크)         └──────────────────┘     (상세 패널)
```

### 4.2 GitHub API → 에이전트 상태 변환

```
커밋 푸시 (backend/**)  → 백엔드 개발자: WORKING → CELEBRATING
PR 생성                 → 관련 에이전트: REVIEWING (Meeting Room 이동)
Actions 실행 중         → QA 엔지니어: TESTING
Actions 성공            → DevOps: DEPLOYING → CELEBRATING
Actions 실패            → QA: FRUSTRATED
12시간 이상 커밋 없음    → 전원: RESTING (Lounge)
```

### 4.3 백엔드 API 설계

```
GET  /api/portal/office/status          # 사무실 전체 상태
GET  /api/portal/office/agents          # 에이전트 목록 + 현재 상태
GET  /api/portal/office/agents/{id}     # 에이전트 상세 (최근 작업 이력)
GET  /api/portal/office/events          # 최근 사무실 이벤트 목록
POST /api/portal/office/sync            # GitHub 데이터 수동 동기화 (ADMIN)
```

### 4.4 데이터 갱신 전략

| 소스 | 방식 | 주기 |
|------|------|------|
| GitHub 커밋/PR | 폴링 (TanStack Query) | 5분 |
| GitHub Actions | Webhook (권장) 또는 폴링 | 이벤트 기반 / 2분 |
| 서버 헬스체크 | 백엔드 스케줄러 | 1분 |
| 사무실 상태 | SSE (Server-Sent Events) | 실시간 |

---

## 5. 픽셀아트 에셋

### 5.1 제작 워크플로우

```
AI 이미지 생성 (초안)
    ↓
사용자 프롬프트 조정/재생성
    ↓
Aseprite/Piskel로 편집 및 정리
    ↓
스프라이트시트로 내보내기
    ↓
프로젝트 에셋으로 등록
```

### 5.2 필요 에셋 목록

| 카테고리 | 에셋 | 규격 |
|----------|------|------|
| **타일맵** | 바닥, 벽, 가구 타일 | 16x16px 또는 32x32px |
| **캐릭터** | 에이전트별 스프라이트시트 (8방향 x 상태별) | 32x32px per frame |
| **오브젝트** | 데스크, 모니터, 서버랙, 소파, 화분, 커피머신 | 다양한 크기 |
| **이펙트** | 이모트 (하트, 물음표, 느낌표), 파티클 | 16x16px |
| **UI** | 말풍선, 상태 아이콘, 미니맵 | 다양한 크기 |

### 5.3 저작권 관리

- AI 생성 초안을 기반으로 **사용자가 직접 편집/수정**하여 2차적 저작물로 확보
- 프로젝트 내 에셋 라이선스 파일에 자체 제작 명시
- 에셋별 원본 프롬프트와 편집 이력을 `assets/CREDITS.md`에 기록

---

## 6. 프론트엔드 모듈 구조

기존 모듈 아키텍처 패턴을 그대로 따름 (`src/modules/` 하위 독립 모듈).

```
src/modules/pixel-office/
├── components/
│   ├── PixelOffice.tsx            # 메인 컨테이너 (Pixi Stage)
│   ├── OfficeMap.tsx              # 타일맵 렌더링
│   ├── AgentCharacter.tsx         # 에이전트 스프라이트 + 애니메이션
│   ├── Furniture.tsx              # 사무실 오브젝트
│   ├── StatusBubble.tsx           # 캐릭터 위 상태 말풍선
│   ├── OfficeEffects.tsx          # 파티클/이모트 이펙트
│   └── InteractionPanel.tsx       # 클릭 시 상세 정보 (React UI 오버레이)
├── hooks/
│   ├── useAgentStatus.ts          # 에이전트 상태 구독 (TanStack Query + SSE)
│   ├── useOfficeEvents.ts         # 사무실 이벤트 스트림
│   ├── useSpriteAnimation.ts      # 스프라이트 애니메이션 제어
│   └── useOfficeInteraction.ts    # 클릭/호버 인터랙션
├── api/
│   ├── officeApi.ts               # 백엔드 Office API 클라이언트
│   └── githubActivityApi.ts       # GitHub 활동 데이터 (Next.js API Route 경유)
├── state/
│   └── officeSlice.ts             # Redux: 선택된 에이전트, UI 상태 등
├── engine/
│   ├── StateMachine.ts            # 에이전트 상태 전이 엔진
│   ├── PathFinder.ts              # 캐릭터 이동 경로 계산 (A* 등)
│   └── EventMapper.ts             # GitHub 이벤트 → 에이전트 행동 변환
├── assets/
│   ├── sprites/                   # 캐릭터 스프라이트시트 (.png)
│   ├── tiles/                     # 사무실 타일맵 (.json + .png)
│   ├── objects/                   # 가구/소품 스프라이트
│   └── CREDITS.md                 # 에셋 제작 이력 및 라이선스
├── types/
│   └── office.types.ts            # 에이전트, 사무실, 이벤트 타입 정의
└── index.ts                       # 모듈 등록 (ModuleRegistry)
```

---

## 7. 백엔드 모듈 구조

Portal API 멀티모듈 구조에 `module-office` 추가. Pixel Office는 독립 서비스가 아닌 **Portal API 내부 모듈**로 동작합니다. DB 테이블은 `portal_db`에 소속됩니다.

### 7.1 모듈 의존성

```
module-office
├── depends on: domain (OfficeAgent, OfficeEvent 엔티티)
├── depends on: common (유틸리티)
└── depends on: security (인증 - ADMIN 동기화 API)
```

### 7.2 주요 클래스

```
backend/module-office/
├── controller/
│   └── OfficeController.java       # REST API 엔드포인트
├── service/
│   ├── OfficeService.java          # 사무실 상태 관리
│   ├── GitHubSyncService.java      # GitHub API 연동 + 상태 변환
│   └── OfficeEventPublisher.java   # SSE 이벤트 발행
├── dto/
│   ├── OfficeStatusResponse.java
│   ├── AgentStatusResponse.java
│   └── OfficeEventResponse.java
└── scheduler/
    └── GitHubSyncScheduler.java    # 주기적 GitHub 데이터 동기화
```

### 7.3 DB 테이블 — `portal_db` (Flyway 마이그레이션 추가)

```sql
-- 에이전트 정의 (portal_db 소속)
CREATE TABLE office_agents (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    role        VARCHAR(30) NOT NULL,      -- BACKEND, FRONTEND, AI, QA, DEVOPS
    status      VARCHAR(20) NOT NULL,      -- IDLE, WORKING, REVIEWING, ...
    location    VARCHAR(30) NOT NULL,      -- BACKEND_DESK, LOUNGE, ...
    current_task TEXT,
    sprite_key  VARCHAR(50) NOT NULL,
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 사무실 이벤트 로그
CREATE TABLE office_events (
    id          BIGSERIAL PRIMARY KEY,
    agent_id    BIGINT REFERENCES office_agents(id),
    event_type  VARCHAR(30) NOT NULL,      -- COMMIT, PR, BUILD, DEPLOY, ...
    description TEXT,
    source_url  TEXT,                       -- GitHub 링크 등
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_office_events_created ON office_events(created_at DESC);
```

---

## 8. 사용자 인터랙션

### 8.1 기본 인터랙션

| 동작 | 결과 |
|------|------|
| **사무실 관찰** | 에이전트들이 상태에 따라 자동으로 움직임 |
| **에이전트 클릭** | 오버레이 패널: 이름, 역할, 현재 작업, 최근 이력 |
| **구역 호버** | 구역 이름 + 현재 활동 요약 툴팁 |
| **이벤트 알림** | 새 커밋/배포 시 사무실 내 시각적 이벤트 발생 |

### 8.2 연출 예시

- 빌드 성공: 전원 잠시 기립 + 축하 이모트
- 빌드 실패: QA 캐릭터 머리 위 빨간 느낌표 + 해당 데스크로 이동
- 새벽 시간대: 사무실 조명 어두워짐 + 일부 캐릭터만 야근

---

## 9. 페이지 배치

### Option A: 독립 페이지 `/office`
- 전체 화면 픽셀 사무실 경험
- 사이드바에 이벤트 로그

### Option B: 홈페이지 위젯
- 3D 랜딩 페이지 하단에 미니 픽셀 사무실 섹션
- 클릭 시 `/office`로 확장

**권장**: Option B (진입점) + Option A (풀 경험) 병행

---

## 10. 기술 스택 요약

| 레이어 | 기술 | 역할 |
|--------|------|------|
| **2D 렌더링** | PixiJS + @pixi/react | 픽셀 사무실 렌더링 |
| **상태 관리** | Redux Toolkit + TanStack Query | UI 상태 + 서버 상태 |
| **실시간 통신** | SSE (Server-Sent Events) | 사무실 이벤트 스트림 |
| **데이터 소스** | GitHub API + 자체 Backend API | 하이브리드 |
| **에셋 제작** | AI 생성 + Aseprite/Piskel 편집 | 픽셀아트 스프라이트 |
| **백엔드** | Portal API (module-office) | 상태 관리 + GitHub 동기화 |

---

## References

- [프론트엔드 모듈 구조](depth-2-module-structure.md) - 기존 모듈 아키텍처
- [전체 시스템 아키텍처](blog-architecture-context.md) - Depth 1 아키텍처
- [ADR-005: Pixel Office 기술 선택](../decisions/ADR-005-pixel-office-tech-stack.md) - 기술 선택 근거

---

**Created**: 2026-03-26
**Last Updated**: 2026-03-30
