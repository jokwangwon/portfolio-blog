# 디자인 강화 통합 설계 명세

> 포트폴리오 블로그의 시각적 임팩트를 3단계에 걸쳐 점진적으로 강화하는 설계 문서.
> 마이크로 인터랙션 → 차별화 요소 → Pixel Office + 고급 인터랙션.

**작성일**: 2026-04-05 (세션 #15)
**상태**: Accepted
**관련 문서**: `blog-ui-design.md`, `light-mode-glass-design.md`, `portfolio-landing-design.md`, `pixel-office-design.md`

---

## 0. 설계 배경

### 0.1 문제 정의

포트폴리오 블로그의 **기능은 완성**되었으나 (Blog CRUD, 에디터, 좋아요, 댓글, 검색, OAuth2), **채용 담당자를 30초 안에 사로잡을 시각적 임팩트가 부족**하다.

| 영역 | 현재 상태 | 문제 |
|------|-----------|------|
| Hero 섹션 | 텍스트 + 버튼 2개 | 정적, 평범함 |
| 섹션 전환 | 단순 스크롤 | 애니메이션 없음 |
| 카드 인터랙션 | `hover: -translate-y-0.5` | 미세한 움직임만 |
| 배경 메쉬 | CSS radial-gradient | 정적 그라데이션 |
| 차별화 요소 | 없음 | 3D/Pixel Office 미구현 |

### 0.2 목표

1. **Stage 1**: 기존 컴포넌트에 생동감 부여 (애니메이션, 인터랙션)
2. **Stage 2**: 포트폴리오 차별화 (3D Hero, 프로젝트 카드 리디자인)
3. **Stage 3**: 최고 임팩트 기능 (Pixel Office, 파티클, 벤치마크 시각화)

### 0.3 핵심 원칙

1. **Progressive Enhancement**: 각 Stage는 이전 Stage 위에 쌓임
2. **접근성 우선**: 모든 애니메이션은 `prefers-reduced-motion` 대응
3. **성능 보호**: 무거운 라이브러리(Three.js, PixiJS)는 `next/dynamic + ssr:false`로 메인 번들 제외
4. **기존 디자인 시스템 통합**: Glassmorphism 토큰(oklch)과 Warm Glass/Cool Glass 체계 유지

---

## 1. 기술 스택 선택

### 1.1 애니메이션

| 라이브러리 | 선택 | 근거 |
|------------|------|------|
| **framer-motion** | ✅ 채택 | React 19/App Router 지원, useInView/AnimatePresence 내장, ~35KB gzipped |
| GSAP | ❌ 미채택 | 오버킬, ScrollTrigger SSR 처리 복잡, 번들 크기 큼 |
| CSS-only | 부분 사용 | 메쉬 drift, gradient-shift 등 단순 keyframe은 CSS로 처리 |

### 1.2 3D 렌더링

| 라이브러리 | 선택 | 근거 |
|------------|------|------|
| **React Three Fiber + drei** | ✅ 채택 | React 선언적 API, Float/OrbitControls 내장, 트리 쉐이킹 |
| raw Three.js | ❌ 미채택 | 명령적 API, React 통합 수동 관리 필요 |

### 1.3 2D 렌더링

| 라이브러리 | 선택 | 근거 |
|------------|------|------|
| **PixiJS 8 + @pixi/react** | ✅ 채택 | 기존 pixel-office-design.md 기준, WebGL 2D 성능 최적 |

### 1.4 파티클 효과

| 라이브러리 | 선택 | 근거 |
|------------|------|------|
| **@tsparticles/react + slim** | ✅ 채택 | 커서 트레일, 축하 이펙트에 적합, React 통합 |

### 1.5 패키지 설치 (Stage별)

```bash
# Stage 1
npm install framer-motion

# Stage 2
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

# Stage 3
npm install pixi.js @pixi/react
npm install @tsparticles/react @tsparticles/slim
```

---

## 2. Stage 1: 마이크로 인터랙션 & 애니메이션

### 2.1 공유 애니메이션 인프라

#### 2.1.1 Motion Variants (`src/shared/animations/variants.ts`)

재사용 가능한 framer-motion variant 정의:

```typescript
// fadeInUp: 섹션 등장 시 아래에서 위로 페이드인
export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

// fadeIn: 단순 페이드인 (Hero 등 즉시 표시 요소)
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

// staggerContainer: 자식 요소 순차 등장
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

// scaleIn: 카드/아이콘 등장
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};
```

#### 2.1.2 Reduced Motion Hook (`src/shared/animations/useReducedMotion.ts`)

```typescript
// prefers-reduced-motion 감지
// true일 때 모든 variant의 duration을 0으로 덮어씌움
// 기존 globals.css line 528-533의 CSS 규칙과 연동
```

#### 2.1.3 MotionSection 컴포넌트 (`src/shared/animations/MotionSection.tsx`)

```typescript
// "use client"
// motion.section + useInView 조합
// Props: variants (기본 fadeInUp), className, children, once (기본 true)
// viewport: { once: true, margin: "-100px" }
// reduced motion일 때 즉시 visible 상태로 렌더
```

#### 2.1.4 Mouse Glow Hook (`src/shared/animations/useMouseGlow.ts`)

```typescript
// ref 기반 마우스 추적
// mousemove → element에 --mouse-x, --mouse-y CSS 변수 설정
// mouseleave → 리셋
// cleanup on unmount
```

#### 2.1.5 Page Transition (`src/shared/animations/PageTransition.tsx`)

```typescript
// AnimatePresence + motion.div
// fade 전환 (opacity 0 → 1, duration 0.3)
// layout 레벨에서 {children} 래핑
```

### 2.2 CSS 추가 (`globals.css`)

#### 2.2.1 Glass Card Glow (마우스 추적 빛 효과)

```css
.glass-card-glow {
  position: relative;
  overflow: hidden;
}
.glass-card-glow::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    var(--glass-glow-color) 0%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 1;
}
.glass-card-glow:hover::before {
  opacity: 1;
}
```

Light mode: `--glass-glow-color: oklch(0.78 0.18 75 / 15%)`
Dark mode: `--glass-glow-color: oklch(0.546 0.245 262 / 15%)`

#### 2.2.2 Animated Gradient Text

```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.animate-gradient-text {
  background-size: 200% auto;
  animation: gradient-shift 4s ease infinite;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

Light mode gradient: `warm-amber → warm-gold → warm-rose`
Dark mode gradient: `accent-blue → accent-cyan → accent-blue`

#### 2.2.3 Mesh Drift (배경 미세 움직임)

```css
@keyframes mesh-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(2%, -1%) scale(1.02); }
  66% { transform: translate(-1%, 2%) scale(0.98); }
}
body::before {
  animation: mesh-drift 25s ease-in-out infinite;
}
/* prefers-reduced-motion에서 자동 비활성화 (기존 규칙 활용) */
```

### 2.3 컴포넌트 수정 매트릭스

| 컴포넌트 | 변경 내용 | 애니메이션 |
|----------|-----------|-----------|
| HeroSection | stagger reveal + gradient text | fadeIn (즉시, 스크롤 트리거 아님) |
| AboutSection | MotionSection 래핑 | fadeInUp |
| TechStackSection | MotionSection + 카드 stagger | staggerContainer + scaleIn |
| ProjectsSection | MotionSection + 카드 stagger | staggerContainer + fadeInUp |
| ProjectCard | useMouseGlow + glass-card-glow | hover glow 추적 |
| ExperienceSection | MotionSection + 타임라인 stagger | staggerContainer + fadeInUp |
| BlogPreviewSection | MotionSection | fadeInUp |
| ContactSection | MotionSection | fadeInUp |
| PostCard (Blog) | useMouseGlow + glass-card-glow | hover glow 추적 |
| (portfolio)/layout | PageTransition 래핑 | fade |
| (blog)/layout | PageTransition 래핑 | fade |

---

## 3. Stage 2: 차별화 요소

### 3.1 3D Hero 섹션

#### 3.1.1 컨셉

Hero 섹션 배경에 **유리 질감의 기하학 오브젝트**가 떠있는 3D 씬을 배치. 텍스트는 기존 위치 유지 (전경). 마우스 움직임에 따라 카메라가 미세하게 회전.

#### 3.1.2 HeroScene 스펙 (`src/modules/portfolio/components/hero/HeroScene.tsx`)

```
Canvas 설정:
  - frameloop: "demand" (마우스 이동/애니메이션 시에만 렌더)
  - dpr: [1, 1.5] (고해상도 제한)
  - camera: { position: [0, 0, 5], fov: 45 }

오브젝트:
  - 기하학: IcosahedronGeometry (정이십면체) 또는 TorusKnotGeometry
  - 머티리얼: MeshPhysicalMaterial
    - transmission: 0.9 (유리 투과)
    - roughness: 0.1
    - thickness: 1.5
    - ior: 1.5
  - drei Float 래핑: idle bobbing 애니메이션

조명:
  - Light mode: warm amber (oklch 0.78 0.18 75) 환경광
  - Dark mode: cool blue (oklch 0.546 0.245 262) 환경광
  - useTheme() 연동으로 동적 전환

카메라:
  - 마우스 위치에 따라 ±5도 회전 (useFrame + pointer)
  - 터치 디바이스: 자이로스코프 또는 자동 회전
```

#### 3.1.3 HeroCanvas 래퍼 (`src/modules/portfolio/components/hero/HeroCanvas.tsx`)

```typescript
// next/dynamic with ssr: false
// Suspense fallback: 투명 div (invisible placeholder)
// 조건부 렌더링:
//   - md 미만 (모바일): 렌더링 안 함
//   - prefers-reduced-motion: 렌더링 안 함
//   - WebGL 미지원: 렌더링 안 함
```

#### 3.1.4 HeroSection 통합

```
기존 구조:
  <section min-h-screen>
    <div> 텍스트 + CTA </div>
    <ChevronDown />
  </section>

변경 후:
  <section min-h-screen relative>
    <HeroCanvas className="absolute inset-0 -z-10" />  ← 배경
    <div className="relative z-10"> 텍스트 + CTA </div>  ← 전경
    <ChevronDown />
  </section>
```

### 3.2 프로젝트 카드 리디자인

#### 3.2.1 ProjectCardEnhanced 스펙

```
레이아웃:
  ┌──────────────────────────┐
  │  [스크린샷 Image]         │  aspect-video, next/image
  │  (hover: gradient overlay)│  hover 시 하이라이트 텍스트 표시
  ├──────────────────────────┤
  │  제목                     │  text-xl font-semibold
  │  설명 (line-clamp-2)      │
  │  [Badge] [Badge] [Badge]  │  기술 태그
  │  [GitHub] [Live Demo]     │  링크 버튼
  └──────────────────────────┘

기존 대비 변경:
  - placeholder 이니셜 → 실제 스크린샷 (next/image)
  - hover: gradient overlay + highlights 텍스트 페이드인
  - glass-card-glow (Stage 1에서 구축한 마우스 추적 glow)
```

#### 3.2.2 데이터 확장 (`src/modules/portfolio/data/projects.ts`)

```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  github?: string;
  live?: string;
  screenshot?: string;    // 추가: "/images/projects/portfolio.png"
  highlights?: string[];  // 추가: ["SDD + TDD", "7-module Spring Boot", ...]
}
```

### 3.3 Tech Stack 아이콘 + 숙련도 바

#### 3.3.1 TechIcon (`src/modules/portfolio/components/TechIcon.tsx`)

```
- lucide-react 아이콘 우선 매핑 (사용 가능한 것)
- 없으면 public/images/tech/ SVG 파일 로드
- 최종 fallback: 스타일링된 이니셜 원
```

#### 3.3.2 ProficiencyBar (`src/modules/portfolio/components/ProficiencyBar.tsx`)

```
- framer-motion motion.div
- useInView 트리거 → width 0% → proficiency% 애니메이션
- Glass 테마: 배경 glass-bg, 채우기 warm-amber(light) / accent-blue(dark)
- h-1.5 rounded-full
```

#### 3.3.3 데이터 확장 (`src/modules/portfolio/data/techStack.ts`)

```typescript
export interface TechItem {
  name: string;
  category: string;
  icon?: string;        // 추가: lucide 아이콘명 또는 SVG 경로
  proficiency?: number; // 추가: 0-100
}
```

### 3.4 블로그 카드 비주얼 강화

```
PostCard 확장:
  - 상단 커버 이미지 영역 (선택적, aspect-video)
  - 커버 없을 시 기존 레이아웃 유지
  - 읽기 시간 표시: word count / 200 → "N분 읽기"
  - gradient overlay on cover image
```

---

## 4. Stage 3: Pixel Office & 고급 인터랙션

### 4.1 Pixel Office (MVP — ADR-008)

> 상세 설계는 [pixel-office-design.md](./pixel-office-design.md) 참조.
> 기술 결정은 [ADR-008](../decisions/ADR-008-pixel-office-canvas2d-mvp.md) 참조.
> 이 섹션은 pixel-office-design.md와의 통합 지점만 정의.

**핵심 변경 (2026-04-06)**: 3+1 멀티 에이전트 합의를 통해 MVP 축소 + Canvas 2D 전환 결정.
- PixiJS 8 → Canvas 2D API (R3F로 WebGL 이미 증명, 기술 스펙트럼 확장)
- 7존 → 3존, 5에이전트 → 3, 8상태 → 4상태
- 백엔드 module-office → Phase 2 연기 (Next.js API Route로 대체)
- pixel-agents 오픈소스 설계 패턴 참고 (코드 복사 아님)

#### 4.1.1 프론트엔드 모듈 구조

```
src/modules/pixel-office/
├── components/        # Canvas 2D 렌더링 + React 오버레이 (모두 "use client")
├── engine/            # 순수 로직 (GameLoop, StateMachine, PathFinder, EventMapper)
���── hooks/             # React 훅 (useGameLoop, useAgentStatus)
├── api/               # API 클라이언트 (githubActivity.ts)
├── assets/            # 스프라이트, 타일맵
└── types/             # TypeScript 타입 (office.types.ts)
```

#### 4.1.2 라우트 통합

| 경로 | 역할 | 레이���웃 |
|------|------|---------|
| `/office` | 전�� 화면 Pixel Office | 최소 레이아웃 (얇은 헤더만) |
| `/` (위젯) | 랜딩 페이지 미니 프리뷰 | PortfolioLayout 내 섹션 |

#### 4.1.3 에셋 전략

**Phase 1 (MVP)**: 컬러 사각형 placeholder
- 3개 구역은 색상 구분된 ���각형으로 표현
- 3개 에이전트는 컬러 원형 + 방향 표시로 표현
- 4상태 전이, BFS 이동, 클릭 인터랙션 로직을 먼저 완성

**Phase 2 (이후)**: 실제 픽셀아트 에셋으��� 교체
- 32x32 캐릭터 스프라이���시트
- ��일맵 JSON + PNG
- 가구/오브젝트 스프라이트

#### 4.1.4 데이터 소스

**Phase 1**: Next.js API Route (`app/api/office/route.ts`) + GitHub API + ISR 캐싱 (5분)
**Phase 2**: Spring Boot `module-office` (SSE 실시간, DB 캐싱, GitHub 동기화)

### 4.2 커서 트레일

```
CursorTrail.tsx ("use client", next/dynamic ssr:false):
  - @tsparticles/react 기반
  - 마우스를 따라 미세한 파티클 트레일
  - portfolio 라우트에서만 활성화 (blog 제외)
  - 비활성 조건: 모바일, prefers-reduced-motion, 터치 디바이스
  - 파티클 색상: warm-amber(light) / accent-cyan(dark)
```

### 4.3 AI 벤치마크 시각화

```
BenchmarkSection.tsx:
  - 포트폴리오 랜딩에 추가할 벤치마크 프리뷰 섹션
  - 정적/캐시 데이터 기반 (AI Backend 연동은 별도)
  - Glass 테마 차트 카드
  - MotionSection 래핑 (Stage 1 인프라 활용)
```

---

## 5. 의존성 맵

```
Stage 1 (framer-motion, CSS)
  │
  ├── useReducedMotion ──────────┐
  ├── variants.ts ───────────────┤
  ├── MotionSection ─────────────┤  → Stage 2/3에서 재사용
  ├── useMouseGlow ──────────────┤  → Stage 2 ProjectCard에서 사용
  └── globals.css 확장 ──────────┤  → 모든 Stage에서 참조
                                 ▼
Stage 2 (three, R3F)          Stage 1 인프라 의존
  │
  ├── HeroScene (useReducedMotion 사용)
  ├── HeroCanvas (next/dynamic 패턴) ──┐
  ├── ProjectCardEnhanced (glow 사용)   │  → Stage 3에서 패턴 재사용
  └── ProficiencyBar (motion 사용)      │
                                        ▼
Stage 3 (Canvas 2D, tsparticles)  Stage 2 패턴 재사용
  │
  ├── pixel-office 모듈 (Canvas 2D, dynamic import)
  ├── CursorTrail (useReducedMotion 사용)
  └── BenchmarkSection (MotionSection 사용)
```

---

## 6. 성능 가드레일

| 항목 | 전략 |
|------|------|
| Three.js (~600KB) | `next/dynamic ssr:false`, `(portfolio)` 라우트 전용 |
| Canvas 2D (0KB) | `next/dynamic ssr:false`, `/office` 라우트 전용 (번들 추가 없음) |
| tsparticles | `next/dynamic ssr:false`, portfolio 전용 |
| R3F Canvas | `frameloop="demand"`, `dpr={[1, 1.5]}` |
| 모바일 | md 미만에서 3D/파티클/커서 트레일 비활성화 |
| reduced-motion | 모든 애니메이션 즉시 완료 상태로 렌더 |
| WebGL 미지원 | graceful fallback (정적 레이아웃 유지) |

---

## 7. 접근성 (a11y)

| 항목 | 대응 |
|------|------|
| `prefers-reduced-motion` | useReducedMotion 훅 + CSS media query 이중 보호 |
| 키보드 탐색 | 3D/PixiJS 영역은 `aria-hidden="true"`, 기능은 별도 DOM 요소로 제공 |
| 색 대비 | WCAG AA (4.5:1) — Glass 효과 위 텍스트도 대비율 보장 |
| 스크린 리더 | 장식적 canvas에 `role="img" aria-label` 부여 |

---

## 8. 테스트 전략

### 8.1 단위 테스트 (Vitest + RTL)

| 대상 | 테스트 내용 |
|------|------------|
| useReducedMotion | media query 응답, 변경 감지 |
| MotionSection | 자식 렌더링, className 전달, reduced motion 존중 |
| useMouseGlow | CSS 변수 설정/해제, cleanup |
| HeroCanvas | 렌더링, reduced motion 시 3D 스킵, fallback |
| ProjectCardEnhanced | 스크린샷 렌더, 이미지 없을 때 fallback |
| TechIcon | 알려진 아이콘 렌더, unknown fallback |
| ProficiencyBar | 프로그레스 값 반영 |
| StateMachine (engine) | 모든 상태 전이, 잘못된 전이 거부 |
| PathFinder (engine) | 구역 간 경로, 차단된 경로 |
| EventMapper (engine) | GitHub 이벤트 → 에이전트 액션 매핑 |
| officeSlice | Redux 액션 정상 동작 |
| InteractionPanel | 에이전트 상세 표시, 닫기 버튼 |

### 8.2 테스트 원칙

- Three.js/PixiJS: Canvas/WebGL 컨텍스트를 mock. React 래퍼 레이어만 테스트
- engine 파일(StateMachine, PathFinder, EventMapper): 순수 로직이므로 TDD 최적
- 기존 테스트 패턴(`PostCard.test.tsx` 등) 따름

---

## 9. 브랜치 전략

| Stage | 브랜치 | 기반 |
|-------|--------|------|
| 1 | `feature/light-mode-glass-implementation` (현재) | — |
| 2 | `feature/stage-2-3d-visual` | Stage 1 완료 후 분기 |
| 3 | `feature/stage-3-pixel-office` | Stage 2 완료 후 분기 |

---

## 10. 파일 구조 요약

### 10.1 신규 생성 파일

```
src/shared/animations/
├── variants.ts
├── useReducedMotion.ts
├── MotionSection.tsx
├── useMouseGlow.ts
└── PageTransition.tsx

src/modules/portfolio/components/hero/
├── HeroScene.tsx
└── HeroCanvas.tsx

src/modules/portfolio/components/
├── ProjectCardEnhanced.tsx
├── TechIcon.tsx
├── ProficiencyBar.tsx
└── BenchmarkSection.tsx

src/modules/pixel-office/
├── components/ (8개)
├── engine/ (3개)
├── hooks/ (4개)
├── state/ (1개)
├── api/ (1개)
└── types/ (1개)

src/shared/animations/
└── CursorTrail.tsx

app/(portfolio)/office/
├── page.tsx
└── layout.tsx

public/images/projects/
public/images/tech/
public/assets/pixel-office/
```

### 10.2 수정 파일

```
globals.css                    — 모든 Stage
HeroSection.tsx                — Stage 1 + 2
AboutSection.tsx               — Stage 1
TechStackSection.tsx           — Stage 1 + 2
ProjectsSection.tsx            — Stage 1 + 2
ProjectCard.tsx                — Stage 1
ExperienceSection.tsx          — Stage 1
BlogPreviewSection.tsx         — Stage 1
ContactSection.tsx             — Stage 1
PostCard.tsx (Blog)            — Stage 1 + 2
(portfolio)/layout.tsx         — Stage 1
(blog)/layout.tsx              — Stage 1
(portfolio)/page.tsx           — Stage 3 (위젯 추가)
PortfolioHeader.tsx            — Stage 3 (Office 네비)
projects.ts (data)             — Stage 2
techStack.ts (data)            — Stage 2
```
