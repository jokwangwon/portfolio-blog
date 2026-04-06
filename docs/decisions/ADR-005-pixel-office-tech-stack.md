# ADR-005: Pixel Office 2D 렌더링 기술 선택

**Status**: Superseded by [ADR-008](ADR-008-pixel-office-canvas2d-mvp.md)
**Date**: 2026-03-26
**Deciders**: kwangwon
**Tags**: frontend, pixel-art, 2d-rendering, pixi

---

## Context (배경)

### 현재 상황

포트폴리오 프로젝트에 "AI 픽셀 오피스" 기능을 처음부터 설계에 포함한다. 2D 픽셀아트 스타일의 가상 사무실에서 AI 에이전트 캐릭터가 실제 개발 상태에 따라 움직이는 인터랙티브 대시보드를 구현해야 한다.

현재 프론트엔드 스택은 Next.js 14 + React 18 + TypeScript이며, 3D는 React Three Fiber를 사용한다.

### 문제점

- 2D 픽셀 게임 느낌을 구현할 렌더링 기술 선택 필요
- 기존 React 모듈 아키텍처와의 통합 고려
- 3D(React Three Fiber)와 2D 기술이 공존해야 함

### 요구사항

- 픽셀 게임처럼 느껴지는 스프라이트 애니메이션 및 타일맵 렌더링
- React 컴포넌트 기반 개발 (기존 모듈 아키텍처 패턴 유지)
- 번들 크기 최적화 (3D 에셋과 함께 로드됨)
- 스프라이트시트, 타일맵 등 2D 게임 에셋 지원

---

## Decision (결정)

### 선택한 방안

**PixiJS + @pixi/react**를 2D 렌더링 엔진으로 채택한다.

### 이유

1. **React 아키텍처 일관성**: `@pixi/react`는 React Three Fiber와 동일한 패턴(선언적 컴포넌트 기반)으로 2D를 다룬다. `<Stage>`, `<Sprite>`, `<AnimatedSprite>` 등의 React 컴포넌트로 작성하므로 기존 모듈 구조(`src/modules/pixel-office/`)에 자연스럽게 삽입된다.

2. **적절한 추상화 수준**: Phaser는 게임 엔진으로서 불필요한 물리 엔진/씬 매니저가 포함되어 있으나, PixiJS는 렌더러 중심이라 필요한 게임 로직(상태 머신, 경로 탐색)만 직접 구현할 수 있다.

3. **번들 효율성**: ~500KB (gzip)으로 Phaser(~1MB) 대비 절반. 트리 셰이킹으로 사용하는 모듈만 포함 가능.

4. **포트폴리오 가치**: "React Three Fiber로 3D, @pixi/react로 2D"를 한 프로젝트에서 보여주는 것은 WebGL 전반의 이해도를 증명한다.

---

## Alternatives Considered (고려한 대안)

### 대안 1: Phaser.js

**설명**: 본격 2D 게임 엔진. 물리 엔진, 씬 매니저, 타일맵, 카메라 등 게임 기능 일체 내장.

**장점**:
- 게임감 최상 (내장 기능 풍부)
- Tiled 맵 에디터 공식 연동
- 게임 개발 튜토리얼/커뮤니티 풍부

**단점**:
- React와 별도 렌더링 루프 (Canvas 독립 동작, 데이터 교환에 이벤트/ref 필요)
- 번들 크기 ~1MB
- 불필요한 물리 엔진/오디오 엔진 포함
- React 모듈 아키텍처 패턴과 이질적

**채택하지 않은 이유**: React 컴포넌트 기반 아키텍처와의 통합이 어색하고, 사무실 대시보드에 게임 엔진의 물리/오디오 등이 불필요하다.

### 대안 2: HTML Canvas 직접 구현

**설명**: 외부 라이브러리 없이 Canvas 2D API + requestAnimationFrame으로 직접 구현.

**장점**:
- 외부 의존성 0 (번들 크기 없음)
- React와 완전한 제어 (useRef + useEffect)
- 학습한 것을 100% 어필 가능

**단점**:
- 게임루프, 스프라이트 로더, 애니메이션, 충돌 감지 전부 직접 구현
- 개발 시간 대폭 증가
- WebGL 가속 없이 Canvas 2D는 성능 한계
- 스프라이트시트 파싱/타일맵 렌더링 등 보일러플레이트 과다

**채택하지 않은 이유**: 개발 비용 대비 얻는 이점이 없다. 포트폴리오 목적상 바퀴를 재발명하는 것보다 적절한 도구를 잘 활용하는 것이 더 가치있다.

---

## Consequences (결과)

### 긍정적 영향

- React 컴포넌트 패턴으로 2D 렌더링 가능 (Three 모듈과 동일한 개발 경험)
- 기존 모듈 아키텍처에 `pixel-office` 모듈로 깔끔하게 삽입
- WebGL 기반 고성능 2D 렌더링
- Redux, TanStack Query 등 기존 상태 관리와 자연스러운 연동

### 부정적 영향

- 타일맵 렌더링, A* 경로 탐색 등 일부 게임 로직은 직접 구현 필요
- @pixi/react는 Phaser 대비 게임 특화 유틸리티가 적음

### Trade-offs

- Phaser의 풍부한 게임 기능 vs PixiJS의 React 통합 용이성 → React 통합을 우선
- 직접 구현의 학습 어필 vs 라이브러리 활용의 생산성 → 생산성을 우선하되, 상태 머신/경로 탐색 등 핵심 로직은 직접 구현하여 어필

---

## Implementation (구현)

### 필요한 작업

- [ ] `@pixi/react`, `pixi.js` 패키지 설치
- [ ] `src/modules/pixel-office/` 모듈 디렉토리 생성
- [ ] 타일맵 렌더링 엔진 구현
- [ ] 에이전트 상태 머신 구현
- [ ] 캐릭터 스프라이트 애니메이션 시스템
- [ ] A* 경로 탐색 (캐릭터 이동)
- [ ] AI 생성 + 편집으로 픽셀아트 에셋 제작
- [ ] 백엔드 `module-office` 구현 (GitHub 동기화, SSE)
- [ ] GitHub API 연동 + 에이전트 상태 변환 로직
- [ ] `/office` 페이지 + 홈 위젯 배치

### 영향받는 컴포넌트

- `frontend/src/modules/pixel-office/` (신규)
- `frontend/app/office/` (신규 라우트)
- `frontend/app/page.tsx` (홈 위젯 추가)
- `backend/module-office/` (신규 백엔드 모듈)
- `backend/domain/` (office 엔티티 추가)
- `backend/api-server/` (모듈 등록, Flyway 마이그레이션)

---

## References (참고 자료)

- [PixiJS 공식 문서](https://pixijs.com/)
- [@pixi/react GitHub](https://github.com/pixijs/pixi-react)
- [Pixel Office 아키텍처 설계](../architecture/pixel-office-design.md)
- [프론트엔드 모듈 구조](../architecture/depth-2-module-structure.md)

---

**Created**: 2026-03-26
**Last Updated**: 2026-03-26
