# Pixel Office - AI 에이전트 가상 사무실 설계

**Status**: Accepted (MVP Revised)
**Date**: 2026-03-26
**Revised**: 2026-04-06 — MVP 축소 + Canvas 2D 전환 ([ADR-008](../decisions/ADR-008-pixel-office-canvas2d-mvp.md))
**관련 ADR**: [ADR-008](../decisions/ADR-008-pixel-office-canvas2d-mvp.md) (Canvas 2D MVP), ~~[ADR-005](../decisions/ADR-005-pixel-office-tech-stack.md)~~ (Superseded)
**서비스 경계**: Phase 1 프론트엔드 전용 / Phase 2 Portal API 내부 모듈 (`module-office`)
**DB 소속**: Phase 2에서 `portal_db`

---

## 1. 개요

### 1.1 컨셉

2D 픽셀아트 스타일의 가상 사무실에서 AI 에이전트 캐릭터들이 실제 개발 작업 상태에 따라 움직이며 일하는 **인터랙티브 대시보드**.

포트폴리오 방문자는 픽셀 사무실을 통해:
- 현재 프로젝트의 개발 진행 상황을 직관적으로 파악
- AI 에이전트 캐릭터를 클릭하여 상세 작업 내용 확인
- 레트로 감성의 픽셀 게임 경험

### 1.2 핵심 가치

- **차별화**: 3D 포트폴리오(React Three Fiber) + 2D 픽셀 오피스(Canvas 2D)의 기술 대비
- **실시간 시각화**: 정적 대시보드가 아닌 살아있는 사무실
- **기술 어필**: Canvas 2D API 직접 구현으로 브라우저 저수준 렌더링 역량 증명

### 1.3 설계 변경 이력

| 날짜 | 변경 | 사유 |
|------|------|------|
| 2026-03-26 | 초기 설계 (PixiJS 8, 7존, 5에이전트, 8상태) | ADR-005 |
| 2026-04-06 | MVP 축소 (Canvas 2D, 3존, 3에이전트, 4상태) | ADR-008, 3+1 멀티 에이전트 합의 |

---

## 2. 사무실 공간 설계 (MVP)

### 2.1 공간 구성 (탑다운 뷰)

```
┌─────────────────────────────────┐
│  ┌──────────┐  ┌─────────────┐  │
│  │ Work Area │  │ Server Room │  │
│  │  🧑‍💻 🧑‍💻   │  │  🖥️         │  │
│  └──────────┘  └─────────────┘  │
│  ┌──────────────────────────┐   │
│  │       Lounge             │   │
│  │  ☕  🪴                   │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### 2.2 구역별 역할 매핑

| 구역 | 개발 파이프라인 | 에이전트 행동 |
|------|----------------|--------------|
| **Work Area** | 백엔드/프론트엔드 개발 | 커밋 작성, 코드 작업 |
| **Server Room** | CI/CD/배포 | 빌드, 배포, 서버 모니터링 |
| **Lounge** | 대기/유휴 | 커피 마시기, 휴식 |

### 2.3 Phase 2 확장 존 (예정)

> MVP 이후 추가 가능한 존. Phase 2에서 백엔드 module-office와 함께 도입.

| 존 | 역할 |
|----|------|
| AI Lab | AI/ML 개발, 벤치마크 실행 |
| QA Room | 테스트 실행, 버그 리포트 |
| Meeting Room | PR 리뷰, 이슈 논의 |

---

## 3. AI 에이전트 캐릭터 (MVP)

### 3.1 에이전트 목록

| 캐릭터 | 역할 | 주요 데이터 소스 |
|--------|------|-----------------|
| **백엔드 개발자** | Spring Boot 모듈 작업 | GitHub 커밋 (backend/**) |
| **프론트엔드 개발자** | Next.js/React 작업 | GitHub 커밋 (frontend/**) |
| **DevOps 엔지니어** | 배포/인프라 | GitHub Actions, 서버 헬스체크 |

### 3.2 Phase 2 확장 에이전트 (예정)

| 캐릭터 | 역할 |
|--------|------|
| AI 연구원 | FastAPI/모델 작업, 벤치마크 |
| QA 엔지니어 | 테스트 작성/실행 |

### 3.3 캐릭터 상태 머신 (MVP: 4상태)

```
[IDLE] ──커밋 감지──→ [WORK] ──완료──→ [IDLE]
  │                                      │
  └──장시간 유휴──→ [REST] (Lounge 이동) ─┘
  
이동 시: [WALK] (BFS 경로 따라 타일 이동)
```

### 3.4 상태별 애니메이션

| 상태 | 스프라이트 동작 | 위치 |
|------|----------------|------|
| `IDLE` | 자리에서 가만히 앉아있음 | 담당 데스크 |
| `WALK` | 타일 이동 애니메이션 | 경로상 |
| `WORK` | 키보드 타이핑, 모니터 응시 | 담당 데스크 |
| `REST` | 커피 마시기, 소파 앉기 | Lounge |

### 3.5 Phase 2 확장 상태 (예정)

| 상태 | 동작 | 조건 |
|------|------|------|
| `REVIEWING` | 문서 읽기 | PR 생성 시 |
| `TESTING` | 돋보기 들기 | Actions 실행 시 |
| `CELEBRATING` | 기쁨 점프 | 빌드 성공 시 |
| `FRUSTRATED` | 머리 긁적 | 빌드 실패 시 |

---

## 4. 데이터 소스 설계

### 4.1 Phase 1: 프론트엔드 전용 아키텍처

```
GitHub API ────→ Next.js API Route ────→ Canvas 2D
(public repo)    (ISR 캐싱, 5분)         (렌더링)
                       │
                       └────→ React UI (상세 패널)
```

- **Next.js API Route** (`app/api/office/route.ts`): GitHub API 프록시 + ISR 캐싱
- **TanStack Query**: 5분 간격 폴링
- **상태 변환 로직**: 프론트엔드 `engine/EventMapper.ts`에서 처리

### 4.2 GitHub API → 에이전트 상태 변환

```
커밋 푸시 (backend/**)  → 백엔드 개발자: IDLE → WORK
커밋 푸시 (frontend/**) → 프론트엔드 개발자: IDLE → WORK
Actions 실행 완료       → DevOps: IDLE → WORK
12시간 이상 커밋 없음    → 전원: REST (Lounge)
```

### 4.3 Phase 2: 백엔드 연동 아키텍처 (예정)

```
GitHub API ─────→ ┌──────────────────┐ ──→ Canvas 2D
(실제 활동 데이터)  │  Portal API      │     (렌더링)
                   │  (상태 변환 엔진) │
Server Health ───→ │                  │ ──→ React UI
(헬스체크)         └──────────────────┘     (상세 패널)
```

Phase 2 백엔드 API:
```
GET  /api/portal/office/status          # 사무실 전체 상태
GET  /api/portal/office/agents          # 에이전트 목록 + 현재 상태
GET  /api/portal/office/agents/{id}     # 에이전트 상세
GET  /api/portal/office/events          # 최근 이벤트 목록
POST /api/portal/office/sync            # GitHub 수동 동기화 (ADMIN)
```

---

## 5. 픽셀아트 에셋

### 5.1 Phase 1: Placeholder 전략

MVP에서는 컬러 사각형 placeholder를 사용하여 엔진/로직을 먼저 완성한다.

| 에셋 | Placeholder | Phase 2 교체 |
|------|-------------|-------------|
| 바닥 타일 | 단색 사각형 (#E8D5B7) | 16x16px 픽셀 타일 |
| 벽 | 진한 사각형 (#8B7355) | 타일 세트 |
| 캐릭터 | 컬러 원형 + 방향 표시 | 32x32px 스프라이트시트 |
| 가구 | 라벨 사각형 | 픽셀 오브젝트 |

### 5.2 Phase 2: 실제 에셋 제작

```
AI 이미지 생성 (초안)
    ↓
Aseprite/Piskel로 편집 및 정리
    ↓
스프라이트시트로 내보내기
    ↓
프로젝트 에셋으로 등록
```

### 5.3 필요 에셋 목록 (Phase 2)

| 카테고리 | 에셋 | 규격 |
|----------|------|------|
| **타일맵** | 바닥, 벽 타일 | 16x16px |
| **캐릭터** | 에이전트별 스프라이트시트 (4방향 x 상태별) | 32x32px per frame |
| **오브젝트** | 데스크, 모니터, 서버랙, 소파, 커피머신 | 다양한 크기 |
| **이펙트** | 이모트 (물음표, 느낌표), 상태 아이콘 | 16x16px |

---

## 6. 프론트엔드 모듈 구조

기존 모듈 아키텍처 패턴을 따름 (`src/modules/` 하위 독립 모듈).

```
src/modules/pixel-office/
├── components/
│   ├── PixelOffice.tsx            # Canvas ref + 메인 컨테이너
│   ├── OfficeCanvas.tsx           # next/dynamic ssr:false 래퍼
│   └── InteractionPanel.tsx       # 클릭 시 상세 정보 (React UI 오버레이)
├── engine/
│   ├── GameLoop.ts                # requestAnimationFrame 루프 (delta-time)
│   ├── SpriteRenderer.ts          # Canvas 2D 스프라이트 렌더링
│   ├── TileMap.ts                 # 타일맵 렌더/충돌 검사
│   ├── PathFinder.ts              # BFS 4방향 길찾기
│   ├── StateMachine.ts            # 4상태 전이 엔진
│   └── EventMapper.ts             # GitHub 이벤트 → 에이전트 행동 변환
├── hooks/
│   ├── useGameLoop.ts             # Canvas + rAF 관리
│   └── useAgentStatus.ts          # TanStack Query GitHub 폴링
├── api/
│   └── githubActivity.ts          # Next.js API Route 호출
├── assets/
│   ├── sprites/                   # 캐릭터 스프라이트시트 (.png)
│   ├── tiles/                     # 사무실 타일맵 (.json + .png)
│   └── CREDITS.md                 # 에셋 제작 이력 및 라이선스
├── types/
│   └── office.types.ts            # 에이전트, 사무실, 이벤트 타입 정의
└── index.ts                       # 모듈 등록 (ModuleRegistry)
```

### 6.1 engine/ 설계 원칙

engine/ 디렉토리의 모든 모듈은 **프레임워크 독립적 순수 TypeScript**로 구현한다.

- Canvas API, React, Redux 등에 직접 의존하지 않음
- SpriteRenderer만 CanvasRenderingContext2D를 인자로 받음
- 나머지(StateMachine, PathFinder, EventMapper)는 순수 함수/클래스
- **이유**: TDD 완전 적용 + 향후 렌더러 교체(Canvas → PixiJS 등) 용이

### 6.2 pixel-agents 참고 패턴

> 코드 복사가 아닌 설계 패턴 참고. 모든 코드는 직접 작성.

| pixel-agents 패턴 | 본 프로젝트 적용 |
|-------------------|-----------------|
| requestAnimationFrame + delta-time capping | `GameLoop.ts`: useTick 패턴 → rAF 루프 + dt 클램핑 |
| BFS on 4-connected tile grid | `PathFinder.ts`: 동일 알고리즘, 자체 구현 |
| Sprite sheet parsing + hue shifting | `SpriteRenderer.ts`: Canvas 2D drawImage + CSS filter |
| Tile coord ↔ pixel coord conversion | `TileMap.ts`: 좌표 변환 유틸리티 |
| Furniture manifest.json schema | `assets/tiles/`: 모듈식 에셋 데이터 모델 |

---

## 7. 백엔드 모듈 구조 (Phase 2)

> Phase 1에서는 백엔드 없이 Next.js API Route로 구현.
> Phase 2에서 Portal API 멀티모듈에 `module-office` 추가.

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
│   └── OfficeController.java
├── service/
│   ├── OfficeService.java
│   ├── GitHubSyncService.java
│   └── OfficeEventPublisher.java   # SSE 이벤트 발행
├── dto/
│   ├── OfficeStatusResponse.java
│   ├── AgentStatusResponse.java
│   └── OfficeEventResponse.java
└── scheduler/
    └── GitHubSyncScheduler.java
```

### 7.3 DB 테이블 — `portal_db` (Phase 2)

```sql
CREATE TABLE office_agents (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    role        VARCHAR(30) NOT NULL,      -- BACKEND, FRONTEND, DEVOPS
    status      VARCHAR(20) NOT NULL,      -- IDLE, WALK, WORK, REST
    location    VARCHAR(30) NOT NULL,      -- WORK_AREA, SERVER_ROOM, LOUNGE
    current_task TEXT,
    sprite_key  VARCHAR(50) NOT NULL,
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE office_events (
    id          BIGSERIAL PRIMARY KEY,
    agent_id    BIGINT REFERENCES office_agents(id),
    event_type  VARCHAR(30) NOT NULL,
    description TEXT,
    source_url  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_office_events_created ON office_events(created_at DESC);
```

---

## 8. 사용자 인터랙션

### 8.1 MVP 인터랙션

| 동작 | 결과 |
|------|------|
| **사무실 관찰** | 에이전트들이 상태에 따라 자동으로 움직임 |
| **에이전트 클릭** | 오버레이 패널: 이름, 역할, 현재 작업, 최근 커밋 |
| **구역 호버** | 구역 이름 툴팁 |

### 8.2 Phase 2 연출 (예정)

- 빌드 성공: 전원 잠시 기립 + 축하 이모트
- 빌드 실패: 관련 캐릭터 머리 위 빨간 느낌표
- 새벽 시간대: 사무실 조명 어두워짐

---

## 9. 페이지 배치

### Option A: 독립 페이지 `/office`
- 전체 화면 픽셀 사무실 경험

### Option B: 홈페이지 위젯
- 포트폴리오 랜딩 페이지 하단에 미니 픽셀 사무실 섹션
- 클릭 시 `/office`로 확장

**권장**: Option B (진입점) + Option A (풀 경험) 병행

---

## 10. 기술 스택 요약

| 레이어 | 기술 | 역할 |
|--------|------|------|
| **2D 렌더링** | Canvas 2D API (브라우저 내장) | 픽셀 사무실 렌더링 |
| **게임 루프** | requestAnimationFrame + delta-time | 프레임 업데이트 |
| **길찾기** | BFS 4방향 | 캐릭터 이동 경로 |
| **상태 관리** | Redux Toolkit + TanStack Query | UI 상태 + 서버 상태 |
| **데이터 소스** | GitHub API (Phase 1: Next.js API Route / Phase 2: Portal API) | 하이브리드 |
| **에셋** | Phase 1: placeholder / Phase 2: 픽셀아트 스프라이트 | 점진적 |

---

## 11. 성능 최적화

### 11.1 렌더링 최적화

- `next/dynamic` SSR: false로 클라이언트만 로드
- `requestAnimationFrame` delta-time capping으로 프레임 안정화
- `imageSmoothingEnabled = false` 픽셀 퍼펙트 렌더링
- 정적 타일맵은 별도 오프스크린 Canvas에 사전 렌더링 (dirty rectangle 최적화)

### 11.2 접근성

- `prefers-reduced-motion` 감지 시 애니메이션 비활성화 (정적 스냅샷)
- 모바일: 터치 인터랙션 지원 + 축소 뷰포트

---

## References

- [ADR-008: Canvas 2D MVP 결정](../decisions/ADR-008-pixel-office-canvas2d-mvp.md)
- [pixel-agents GitHub](https://github.com/pablodelucca/pixel-agents) — 설계 패턴 레퍼런스 (MIT)
- [프론트엔드 모듈 구조](depth-2-module-structure.md)
- [전체 시스템 아키텍처](blog-architecture-context.md)
- [3-Stage 디자인 강화](design-enhancement.md)

---

**Created**: 2026-03-26
**Last Updated**: 2026-04-06 (MVP Revised)
