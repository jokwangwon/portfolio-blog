# ADR-008: Pixel Office Canvas 2D MVP 전환

**Status**: Accepted
**Date**: 2026-04-06
**Deciders**: kwangwon
**Supersedes**: [ADR-005](ADR-005-pixel-office-tech-stack.md) (PixiJS + @pixi/react)
**Tags**: frontend, pixel-art, 2d-rendering, canvas, mvp

---

## Context (배경)

### 원래 결정 (ADR-005, 2026-03-26)

PixiJS 8 + @pixi/react를 2D 렌더링 엔진으로 채택. 당시 Canvas 2D 직접 구현은 "개발 비용 대비 이점 없음"으로 기각.

### 상황 변화

1. **pixel-agents 오픈소스 발견**: [pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents) (MIT, 6,144 stars)가 Canvas 2D만으로 매력적인 픽셀 오피스를 구현함을 증명. 게임 루프, BFS 길찾기, 스프라이트 시스템의 검증된 레퍼런스 확보.
2. **Stage 2 완료**: React Three Fiber로 3D Hero 씬 구현 완료. WebGL 역량이 이미 증명되어 PixiJS(또 다른 WebGL)는 **중복 어필**.
3. **3+1 멀티 에이전트 합의**: Agent A(구현), B(품질), C(대안) 3개 에이전트 독립 분석 + Reviewer 합의를 통해 결정.

### 합의 결과 요약

- Option A (pixel-agents 추출): **기각** (3:0) — ADR-005 기각 사유와 직접 충돌, 재사용률 25-35%
- Option B (ADR-005 PixiJS 유지): 안전하나, WebGL 중복 어필 문제
- Option C (하이브리드): 중간 입장
- **Option F-Safe (MVP 축소 + Canvas 2D)**: **채택** — 시간 대비 최고 임팩트, 기술 스펙트럼 확장

---

## Decision (결정)

### 선택한 방안

**Canvas 2D 직접 구현 + MVP 규모 축소**를 채택한다. pixel-agents의 설계 패턴을 학습 레퍼런스로 참고하되, 모든 코드는 직접 작성한다.

### MVP 스펙

| 항목 | ADR-005 (이전) | ADR-008 (현재) |
|------|---------------|---------------|
| 렌더링 | PixiJS 8 + @pixi/react (WebGL) | Canvas 2D API (브라우저 내장) |
| 존 | 7개 | 3개 (WorkArea, ServerRoom, Lounge) |
| 에이전트 | 5개 (Backend, Frontend, AI, QA, DevOps) | 3개 (Backend, Frontend, DevOps) |
| 상태 | 8개 | 4개 (IDLE, WALK, WORK, REST) |
| 길찾기 | A* 8방향 | BFS 4방향 |
| 백엔드 | module-office (Spring Boot, SSE, DB) | Next.js API Route + ISR (Phase 2에서 module-office) |
| 에셋 | 픽셀아트 스프라이트 | Phase 1: placeholder / Phase 2: 픽셀아트 |

### 이유

1. **기술 스펙트럼 확장**: "React Three Fiber(WebGL 3D) + Canvas 2D(2D 픽셀)"이 "R3F + PixiJS(둘 다 WebGL)"보다 기술 폭이 넓다. 면접에서 "WebGL도 Canvas 2D도 다룬다"로 어필.

2. **레퍼런스 확보로 비용 역전**: pixel-agents가 Canvas 2D 구현의 검증된 패턴을 제공. ADR-005 시점의 "개발 비용 과다" 우려가 해소됨. 코드 복사 없이 패턴만 참고하면 "오픈소스 분석 후 자기 설계로 재구현"이라는 포트폴리오 스토리도 확보.

3. **번들 크기 0**: Canvas 2D는 브라우저 내장 API. PixiJS(~200KB gzip) 추가 불필요. 3D Hero(Three.js ~150KB)와 합산 번들 부담 감소.

4. **MVP 우선**: 3존 × 3에이전트 × 4상태로 "작동하는 완성품"을 빠르게 만들고, Phase 2에서 확장.

5. **확장 경로 보존**: engine/ 디렉토리의 순수 로직(StateMachine, PathFinder, EventMapper)을 렌더러와 분리하여, 향후 PixiJS 마이그레이션이 필요하면 SpriteRenderer만 교체 가능.

---

## Alternatives Considered (고려한 대안)

### 대안 1: PixiJS 8 + @pixi/react 유지 (ADR-005)

**장점**: 설계 문서 변경 없음, React 선언적 패턴 일관성, WebGL 성능
**단점**: R3F와 WebGL 중복 어필, 번들 200KB+ 추가, 구현 15-21일
**미채택 이유**: 상황 변화(pixel-agents 레퍼런스 + R3F 완료)로 Canvas 2D 대비 우위가 사라짐

### 대안 2: pixel-agents 엔진 직접 추출 (Option A)

**장점**: 즉시 동작하는 엔진, 개발 시간 최소
**단점**: ADR-005 기각 사유와 동일(Canvas 2D), React 아키텍처 불일치, 재사용률 25-35%, 업스트림 동기화 부채
**미채택 이유**: 3개 에이전트 전원 기각. 외부 코드 직접 도입은 보안/품질/SDD 정합성 모두에서 위험

### 대안 3: 하이브리드 — 패턴 참고 + PixiJS (Option C)

**장점**: PixiJS 유지 + 패턴 참고로 시행착오 감소
**단점**: WebGL 중복 어필 문제 미해결
**미채택 이유**: Canvas 2D 직접 구현의 포트폴리오 가치가 더 높음

---

## Consequences (결과)

### 긍정적 영향

- R3F(3D) + Canvas 2D(2D) 기술 스펙트럼 → 면접 어필 극대화
- 번들 크기 0 추가
- MVP 6-9일 완성 가능 (PixiJS 풀 구현 대비 50-60% 단축)
- engine/ 순수 로직 TDD 완전 적용 가능

### 부정적 영향

- Canvas 2D는 CPU 렌더링 → WebGL 대비 성능 열위 (MVP 3개 에이전트 규모에서는 무관)
- React 선언적 패턴과 Canvas 명령형 패턴 공존 (engine/ 분리 + React 훅 래핑으로 완화)
- ADR-005 + pixel-office-design.md 문서 개정 필요

### Trade-offs

- WebGL 성능 vs Canvas 2D 기술 폭 → 기술 폭 우선 (WebGL은 R3F로 이미 증명)
- 7존 풀 스펙 vs 3존 MVP → MVP 우선 (완성품 > 미완성 대작)
- 백엔드 모듈 vs 프론트엔드만 → Phase 1 프론트만 (백엔드 역량은 Phase 1A로 증명)

---

## Implementation (구현)

### 프론트엔드 모듈 구조

```
src/modules/pixel-office/
├── components/
│   ├── PixelOffice.tsx          # Canvas ref + 메인 컨테이너
│   ├── OfficeCanvas.tsx         # next/dynamic ssr:false 래퍼
│   └── InteractionPanel.tsx     # 클릭 시 상세 (React DOM 오버레이)
├── engine/
│   ├── GameLoop.ts              # requestAnimationFrame 루프
│   ├── SpriteRenderer.ts        # Canvas 2D 스프라이트 렌더링
│   ├── TileMap.ts               # 타일맵 렌더/충돌
│   ├── PathFinder.ts            # BFS 4방향
│   ├── StateMachine.ts          # 4상태 전이 (IDLE/WALK/WORK/REST)
│   └── EventMapper.ts           # GitHub → 에이전트 상태
├── hooks/
│   ├── useGameLoop.ts           # Canvas + rAF 관리
│   └── useAgentStatus.ts        # TanStack Query GitHub 폴링
├── api/
│   └── githubActivity.ts        # Next.js API Route 호출
├── types/
│   └── office.types.ts
└── index.ts
```

### 백엔드 (Phase 2 연기)

```
Phase 1: app/api/office/route.ts (Next.js API Route + GitHub API + ISR)
Phase 2: backend/module-office/ (Spring Boot, SSE, DB)
```

### pixel-agents에서 참고할 패턴 (코드 복사 아님)

- 게임 루프: requestAnimationFrame + delta-time capping 구조
- 스프라이트: 스프라이트시트 파싱, hue shifting 기법
- 길찾기: BFS 4방향 타일 그리드 구현 방식
- 타일맵: 타일 좌표 ↔ 픽셀 좌표 변환 유틸리티
- 가구: manifest.json 기반 모듈식 에셋 관리 데이터 모델

### 영향받는 컴포넌트

- `frontend/src/modules/pixel-office/` (신규)
- `frontend/app/(portfolio)/office/` (신규 라우트)
- `frontend/app/api/office/` (신규 API Route)
- `frontend/app/(portfolio)/page.tsx` (홈 위젯 추가)

---

## References (참고 자료)

- [pixel-agents GitHub](https://github.com/pablodelucca/pixel-agents) — Canvas 2D 레퍼런스 (MIT)
- [ADR-005: 원래 PixiJS 결정](ADR-005-pixel-office-tech-stack.md) — Superseded
- [Pixel Office 설계](../architecture/pixel-office-design.md) — MVP 개정 반영
- [3-Stage 디자인 강화](../architecture/design-enhancement.md) — Stage 3 섹션

---

**Created**: 2026-04-06
**Last Updated**: 2026-04-06
