# Blog UI 디자인 명세

> Frontend Blog 모듈의 디자인 컨셉, 컴포넌트별 디자인 스펙, 레이아웃 구조, 디자인 토큰, 반응형 전략을 정의합니다.

**최종 업데이트**: 2026-04-01
**관련 문서**: `portfolio-landing-design.md` (포트폴리오 랜딩), `light-mode-glass-design.md` (Glass 토큰)

---

## 0. 디자인 컨셉

### 0.1 핵심 방향: Vercel/Notion + Glassmorphism 하이브리드

| 축 | 정의 |
|---|------|
| **구조 (Structure)** | Notion/Vercel처럼 군더더기 없는 미니멀 레이아웃. 얇은 테두리와 명확한 그리드, 넉넉한 여백으로 콘텐츠에 집중 |
| **질감 (Texture)** | 다크 모드에서 배경이 살짝 비치는 반투명 유리 효과(Backdrop Blur)와 은은한 메쉬 그라데이션 조명 |
| **상호작용 (Interaction)** | 마우스 hover 시 카드 부유 + 유리 질감 강화, 버튼에 은은한 glow |

### 0.2 레퍼런스

| 사이트 | 참고 포인트 |
|--------|------------|
| **Vercel Blog** | 레이아웃 구조, 여백, 타이포그래피 위계 |
| **Notion** | 깔끔한 카드, 얇은 테두리, 콘텐츠 중심 디자인 |
| **Linear** | 다크 모드 Glassmorphism, 메쉬 그라데이션 배경 |
| **Stripe Docs** | 정보 밀도와 가독성 밸런스 |

### 0.3 모드별 전략

| 모드 | 전략 |
|------|------|
| **라이트 모드** | Notion/Vercel 스타일 — 순백 배경, 옅은 회색 카드, 얇은 테두리, 콘텐츠 중심의 깨끗한 종이 질감 |
| **다크 모드** | Glassmorphism 강조 — 깊은 검정 배경 위 Blue/Cyan 메쉬 그라데이션, 반투명 유리 카드, hover 시 빛번짐 |

### 0.4 포인트 컬러: Trust Blue / Cyan

메쉬 그라데이션, 포커스 링, 강조 요소에 사용하는 액센트 컬러입니다.

| 이름 | oklch | hex 근사 | 용도 |
|------|-------|----------|------|
| Trust Blue | `oklch(0.546 0.245 262)` | `#2563eb` | 메쉬 그라데이션 주 색상, 링크 hover |
| True Cyan | `oklch(0.715 0.143 215)` | `#06b6d4` | 메쉬 그라데이션 보조, 포커스 링, 배지 강조 |
| Deep Blue | `oklch(0.35 0.15 262)` | `#1e3a8a` | 다크 모드 메쉬 깊은 배경 |
| Ice Cyan | `oklch(0.85 0.08 215)` | `#a5f3fc` | 라이트 모드 미세 강조, hover 힌트 |

### 0.5 디자인 원칙 (확장)

1. **Neutral + Accent**: 기본 UI는 무채색, 포인트에만 Blue/Cyan 사용 — 과하지 않게
2. **Light = Clean, Dark = Atmospheric**: 라이트 모드는 깔끔한 구조, 다크 모드는 분위기와 질감
3. **Progressive Enhancement**: Glassmorphism은 다크 모드에서만 강하게 적용 — 라이트 모드는 미니멀 유지
4. **Motion with Purpose**: 장식적 애니메이션 배제, 상태 변화를 전달하는 모션만 사용
5. **접근성 우선**: Glass 효과에서도 WCAG AA(4.5:1) 대비율 보장, `prefers-reduced-motion` 대응

---

## 1. 디자인 시스템 기반

### 1.1 shadcn/ui v4 (base-nova)

| 항목 | 값 |
|------|-----|
| UI 라이브러리 | shadcn/ui v4 (base-nova 스타일) |
| Headless 기반 | @base-ui/react |
| 색상 체계 | oklch (CSS Color Level 4) |
| 베이스 컬러 | Neutral (무채색 계열) |
| 아이콘 | lucide-react |
| CSS 프레임워크 | Tailwind CSS v4 (CSS-based config) |
| 반지름 기본값 | 0.625rem (10px) |

### 1.2 디자인 토큰 (CSS Variables)

#### 색상 토큰

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--background` | oklch(1 0 0) — 순백 | oklch(0.145 0 0) — 거의 검정 | 페이지 배경 |
| `--foreground` | oklch(0.145 0 0) | oklch(0.985 0 0) | 기본 텍스트 |
| `--card` | oklch(1 0 0) | oklch(0.205 0 0) | 카드 배경 |
| `--primary` | oklch(0.205 0 0) — 진한 검정 | oklch(0.922 0 0) — 밝은 회색 | 주요 버튼, 강조 |
| `--secondary` | oklch(0.97 0 0) — 연한 회색 | oklch(0.269 0 0) | 보조 버튼, 배지 |
| `--muted` | oklch(0.97 0 0) | oklch(0.269 0 0) | 비활성 배경 |
| `--muted-foreground` | oklch(0.556 0 0) | oklch(0.708 0 0) | 보조 텍스트 |
| `--destructive` | oklch(0.577 0.245 27.325) | oklch(0.704 0.191 22.216) | 삭제, 오류 |
| `--border` | oklch(0.922 0 0) | oklch(1 0 0 / 10%) | 테두리 |
| `--input` | oklch(0.922 0 0) | oklch(1 0 0 / 15%) | 입력 필드 테두리 |
| `--ring` | oklch(0.708 0 0) | oklch(0.556 0 0) | 포커스 링 |

#### 반지름 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--radius-sm` | 0.375rem (6px) | 작은 요소 (Badge) |
| `--radius-md` | 0.5rem (8px) | 중간 요소 (Button) |
| `--radius-lg` | 0.625rem (10px) | 큰 요소 (Card) |
| `--radius-xl` | 0.875rem (14px) | 모달, 팝오버 |

#### 타이포그래피 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--font-sans` | `"Pretendard Variable", "Geist Sans", sans-serif` | 본문, UI (한글 우선) |
| `--font-mono` | `"Geist Mono", monospace` | 코드, 에디터 |
| `--font-heading` | `"Geist Sans", "Pretendard Variable", sans-serif` | 제목 (영문 우선) |

#### 타이포그래피 스케일

| 요소 | 크기 | 웨이트 | 자간 | 행간 |
|------|------|--------|------|------|
| H1 (페이지 제목) | `text-3xl` (30px) | `font-bold` (700) | `-0.02em` (좁게) | 1.2 |
| H2 (섹션 제목) | `text-2xl` (24px) | `font-bold` (700) | `-0.02em` | 1.3 |
| H3 (카드 제목) | `text-lg` (18px) | `font-semibold` (600) | `-0.01em` | 1.4 |
| Body (본문) | `text-base` (16px) | `font-normal` (400) | `0` | 1.6 |
| Small (보조 텍스트) | `text-sm` (14px) | `font-normal` (400) | `0` | 1.5 |
| Caption (메타 정보) | `text-xs` (12px) | `font-normal` (400) | `0.01em` (넓게) | 1.4 |

> **원칙**: 제목은 두껍고 자간을 좁게, 본문은 가볍고 행간을 넉넉하게 — 명확한 위계 대비

#### 액센트 컬러 토큰 (Trust Blue / Cyan)

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--accent-blue` | `oklch(0.546 0.245 262)` | `oklch(0.60 0.20 262)` | 링크 hover, 활성 강조 |
| `--accent-cyan` | `oklch(0.715 0.143 215)` | `oklch(0.75 0.12 215)` | 포커스 링, 배지 강조 |
| `--mesh-deep` | — | `oklch(0.20 0.08 262)` | 다크 메쉬 그라데이션 깊은 층 |
| `--mesh-mid` | — | `oklch(0.25 0.12 230)` | 다크 메쉬 그라데이션 중간 층 |
| `--mesh-glow` | — | `oklch(0.35 0.10 215)` | 다크 메쉬 그라데이션 밝은 층 |
| `--accent-ice` | `oklch(0.92 0.04 215)` | — | 라이트 미세 hover 힌트 |

#### Glassmorphism 토큰 (다크 모드 전용)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--glass-bg` | `oklch(1 0 0 / 5%)` | Glass 카드 배경 (흰색 5% 투명) |
| `--glass-bg-hover` | `oklch(1 0 0 / 8%)` | Glass 카드 hover 배경 |
| `--glass-border` | `oklch(1 0 0 / 10%)` | Glass 카드 테두리 (유리 단면) |
| `--glass-border-hover` | `oklch(1 0 0 / 15%)` | Glass 카드 hover 테두리 |
| `--glass-blur` | `12px` | `backdrop-blur-md` |
| `--glass-blur-header` | `16px` | Header 고정 시 blur |
| `--glass-shadow` | `0 8px 32px oklch(0 0 0 / 20%)` | Glass 카드 그림자 |
| `--glow-blue` | `0 0 20px oklch(0.546 0.245 262 / 15%)` | 버튼/카드 hover glow |

### 1.3 디자인 원칙

> 섹션 0.5의 확장 원칙을 참조합니다.

1. **Neutral + Accent**: 기본 UI는 무채색, 포인트에만 Blue/Cyan — 과하지 않게
2. **Light = Clean, Dark = Atmospheric**: 모드별 차별화된 시각 경험
3. **Progressive Enhancement**: Glassmorphism은 다크 모드에서만 강조
4. **Motion with Purpose**: 장식적 애니메이션 배제, 상태 전달 모션만
5. **접근성**: focus-visible 링, aria-invalid, WCAG AA 대비율, `prefers-reduced-motion`

---

## 2. 레이아웃 구조

> **라우트 구조 변경 (2026-04-01)**: Route Group 분리 적용.
> 포트폴리오 랜딩(`/`)은 `(portfolio)` 그룹, 블로그(`/blog`)는 `(blog)` 그룹.
> 상세: `portfolio-landing-design.md` 참조.

### 2.1 블로그 레이아웃 (BlogLayout — `(blog)` Route Group)

기존 ShellLayout을 `(blog)` Route Group의 layout.tsx가 계승.

```
┌──────────────────────────────────────────────────────┐
│ Header (h-14, border-b, bg-background)               │
│ ┌─ Logo ──── Nav ──────────── Auth Actions ────────┐ │
│ │ KW │ 블로그                글쓰기 │ user │ 로그아웃│ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│                                                      │
│  main (max-w-5xl, mx-auto, px-4, py-8, flex-1)      │
│  ┌──────────────────────────────────────────────┐    │
│  │              Page Content                     │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Footer (Separator + text-center, text-muted)         │
│            (c) 2026 Portfolio Platform                │
└──────────────────────────────────────────────────────┘
```

| 요소 | 스펙 |
|------|------|
| Header 높이 | h-14 (56px) |
| 콘텐츠 최대 너비 | max-w-5xl (1024px) |
| 사이드 패딩 | px-4 (16px) |
| 메인 상하 패딩 | py-8 (32px) |

### 2.2 Blog 목록 레이아웃 (`/blog`)

```
┌──────────────────────────────────────────────────────┐
│ ┌── Title ──────────────────── Action ─────────────┐ │
│ │ 블로그 (text-2xl, font-bold)       [글쓰기 btn]  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── CategoryFilter (flex-wrap, gap-2, mb-6) ───────┐ │
│ │ [전체] [카테고리1] [카테고리2] ...               │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── PostCard Grid (grid, gap-4) ───────────────────┐ │
│ │ ┌─ PostCard ─────────────────────────────────────┐│ │
│ │ │ [Badge: 카테고리]  2026-03-31                  ││ │
│ │ │ 게시글 제목 (text-lg, font-semibold)           ││ │
│ │ │ 요약 텍스트... (text-sm, line-clamp-2)         ││ │
│ │ │ username          #tag1  #tag2  #tag3          ││ │
│ │ │ ─────────────────────────────────              ││ │
│ │ │ 조회 123  좋아요 45                            ││ │
│ │ └────────────────────────────────────────────────┘│ │
│ │ ┌─ PostCard ─────────────────────────────────────┐│ │
│ │ │ ...                                            ││ │
│ │ └────────────────────────────────────────────────┘│ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── Pagination (flex, justify-center, gap-1, mt-8) ┐ │
│ │        [이전] [1] [2] [3] [다음]                 │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 2.3 Blog 상세 레이아웃 (`/blog/[id]`)

```
┌──────────────── max-w-3xl mx-auto ─────────────────┐
│ [← 목록으로] (ghost button)                         │
│                                                     │
│ [Badge: 카테고리] [Badge: #tag1] [Badge: #tag2]    │
│                                                     │
│ 게시글 제목 (text-3xl, font-bold)                   │
│                                                     │
│ author  |  2026-03-31 14:30  |  조회 123  |  좋아요 45 │
│                                                     │
│ [수정 btn] [삭제 btn]  ← 작성자만 표시              │
│                                                     │
│ ═══════════════ Separator ═══════════════════       │
│                                                     │
│ ┌── prose prose-neutral max-w-none ─────────────┐  │
│ │ 마크다운 렌더링 (react-markdown + remark-gfm) │  │
│ │ - 제목, 본문, 코드 블록, 테이블, 리스트       │  │
│ └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2.4 Blog 에디터 레이아웃 (`/blog/editor`, `/blog/editor/[id]`)

```
┌──────────────── max-w-3xl mx-auto ─────────────────┐
│ 새 글 작성 / 글 수정 (text-2xl, font-bold)         │
│                                                     │
│ ┌── PostEditor ────────────────────────────────────┐│
│ │ Label: 제목                                      ││
│ │ [Input: 게시글 제목을 입력하세요]                 ││
│ │                                                  ││
│ │ Label: 요약 (선택)                               ││
│ │ [Input: 게시글 요약]                             ││
│ │                                                  ││
│ │ ┌─ 카테고리 ─────┐ ┌─ 상태 ─────────┐           ││
│ │ │ [Select: 없음] │ │ [Select: 임시] │           ││
│ │ └────────────────┘ └────────────────┘           ││
│ │                                                  ││
│ │ Label: 태그                                      ││
│ │ [#tag1(선택됨)] [#tag2] [#tag3(선택됨)] ...     ││
│ │                                                  ││
│ │ ═══════════════ Separator ═════════════════      ││
│ │                                                  ││
│ │ Label: 본문 (마크다운)   [편집 btn] [미리보기 btn]││
│ │ ┌────────────────────────────────────────────┐   ││
│ │ │ Textarea (min-h-300px, font-mono)          │   ││
│ │ │ 또는                                       │   ││
│ │ │ Card: 마크다운 미리보기                     │   ││
│ │ └────────────────────────────────────────────┘   ││
│ │                                                  ││
│ │                         [취소 btn] [저장 btn]    ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트별 디자인 스펙

### 3.1 PostCard

| 속성 | 값 |
|------|-----|
| 기반 | shadcn `Card` + `CardContent` + `CardFooter` |
| 카테고리 | `Badge variant="secondary"` |
| 태그 | `Badge variant="outline"` (최대 3개) |
| 제목 | `text-lg font-semibold line-clamp-2 tracking-tight` |
| 요약 | `text-sm text-muted-foreground line-clamp-2` |
| 메타 정보 | `text-xs text-muted-foreground` |
| Footer | 조회수/좋아요, `border-t bg-muted/50` |

#### PostCard 모드별 스타일

| 상태 | 라이트 모드 | 다크 모드 |
|------|------------|-----------|
| 기본 | 흰색 카드, 옅은 테두리 | `var(--glass-bg)` + `var(--glass-border)` + `backdrop-blur` |
| Hover | `ring-2 ring-accent-ice` + `translateY(-2px)` + 미세 shadow | `var(--glass-bg-hover)` + `var(--glass-border-hover)` + `translateY(-4px)` + `var(--glow-blue)` |
| 전환 | `transition-all duration-200 ease-out` | 동일 |

### 3.2 CategoryFilter

| 속성 | 값 |
|------|-----|
| 레이아웃 | `flex flex-wrap gap-2 mb-6` |
| 선택된 버튼 | `Button variant="default"` (진한 배경) |
| 미선택 버튼 | `Button variant="outline"` (테두리만) |
| 크기 | `size="sm"` |

### 3.3 Pagination

| 속성 | 값 |
|------|-----|
| 레이아웃 | `flex items-center justify-center gap-1 mt-8` |
| 현재 페이지 | `Button variant="default"` |
| 다른 페이지 | `Button variant="outline"` |
| 이전/다음 | `Button variant="outline"` + `disabled` |
| 페이지 범위 | 현재 기준 +-2 (최대 5개 표시) |

### 3.4 PostEditor

| 속성 | 값 |
|------|-----|
| 제목 | shadcn `Input` |
| 요약 | shadcn `Input` (maxLength=200) |
| 카테고리/상태 | 네이티브 `<select>` (shadcn Input 스타일 적용) |
| 태그 | `Badge` (default=선택, outline=미선택, onClick 토글) |
| 본문 | shadcn `Textarea` (min-h-300px, font-mono) |
| 미리보기 | `Card > CardContent > prose` (react-markdown 렌더링) |
| 편집/미리보기 탭 | `Button` (default=활성, outline=비활성) |

### 3.5 삭제 확인 Dialog

| 속성 | 값 |
|------|-----|
| 기반 | shadcn `Dialog` + `DialogContent` + `DialogHeader` + `DialogFooter` |
| 트리거 | `Button variant="destructive" size="sm"` |
| 제목 | "게시글 삭제" |
| 설명 | "이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." |
| 액션 | 취소(outline) + 삭제(destructive) |
| 오버레이 | `bg-black/10 backdrop-blur-xs` |

### 3.6 Auth 페이지 (Login / Signup)

| 속성 | 값 |
|------|-----|
| 기반 | shadcn `Card` (max-w-sm, 중앙 정렬) |
| 제목 | `CardTitle text-2xl` |
| 필드 | `Label` + `Input` + 오류 메시지 |
| 오류 표시 | `Alert variant="destructive"` (전체), `text-destructive` (필드) |
| 필드 오류 | `aria-invalid` 속성으로 Input 빨간 테두리 |
| 제출 | `Button className="w-full"` + loading 텍스트 |

---

## 4. 모션 & 인터랙션 스펙

### 4.1 트랜지션 토큰

| 이름 | 값 | 용도 |
|------|-----|------|
| `--duration-fast` | `150ms` | 버튼 hover, 색상 변경 |
| `--duration-normal` | `200ms` | 카드 hover, 위치 이동 |
| `--duration-slow` | `300ms` | 모달 열기/닫기, 테마 전환 |
| `--easing-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | 요소 등장, hover 이동 |
| `--easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 좋아요 아이콘 토글 |

### 4.2 요소별 모션

| 요소 | 효과 | 타이밍 |
|------|------|--------|
| PostCard hover | `translateY(-2px)` (라이트) / `translateY(-4px)` (다크) + shadow/glow | `duration-normal`, `easing-out` |
| Button hover | 배경색 변경 + 다크 모드에서 `box-shadow: var(--glow-blue)` | `duration-fast` |
| Header (스크롤) | `sticky top-0` + `backdrop-blur: var(--glass-blur-header)` + `bg-background/80` | 즉시 적용 |
| Dialog 열기 | `fade-in` + `scale(0.95 → 1)` | `duration-slow`, `easing-out` |
| Dialog 오버레이 | `bg-black/10 backdrop-blur-xs` → `bg-black/40` | `duration-slow` |
| 좋아요 클릭 | 하트 아이콘 `scale(1.2)` → `scale(1)` | `duration-fast`, `easing-spring` |
| Skeleton | `animate-pulse` (opacity 0.5 → 1 반복) | 무한 반복, 1.5s |
| Toast 등장 | 우측에서 `translateX(100%) → 0` | `duration-slow`, `easing-out` |

### 4.3 `prefers-reduced-motion` 대응

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

모션 감소 설정 사용자에게는 즉시 전환(snap), 애니메이션 비활성화.

### 4.4 Header Sticky + Blur

| 속성 | 라이트 모드 | 다크 모드 |
|------|------------|-----------|
| 위치 | `sticky top-0 z-50` | 동일 |
| 배경 | `bg-background/80` (80% 투명) | `bg-background/60` (60% 투명) |
| Blur | `backdrop-blur-md` (12px) | `backdrop-blur-lg` (16px) |
| 테두리 | `border-b border-border` | `border-b border-glass-border` |
| 효과 | 스크롤 시 콘텐츠가 은은하게 비침 | 스크롤 시 메쉬 그라데이션이 비침 |

---

## 5. 상태별 UI 패턴

### 4.1 로딩 상태

| 페이지 | 패턴 |
|--------|------|
| 목록 | `Skeleton` 블록 4개 (h-6, h-4, h-32, h-4) |
| 상세 | 동일 Skeleton |
| 에디터 | 동일 Skeleton |

### 4.2 빈 상태

| 페이지 | 표시 |
|--------|------|
| 목록 (게시글 없음) | `"아직 게시글이 없습니다."` (py-20, text-muted-foreground, 중앙) |
| 상세 (404) | `"게시글을 찾을 수 없습니다."` + `"목록으로 돌아가기"` 링크 |
| 에디터 (미인증) | `/login`으로 리다이렉트 |
| 에디터 (타인 글) | `"본인이 작성한 글만 수정할 수 있습니다."` |

### 4.3 오류 상태

| 상황 | 패턴 |
|------|------|
| 로그인 실패 | `Alert variant="destructive"` (폼 상단) |
| 회원가입 필드 오류 | 필드 하단 `text-destructive` + `aria-invalid` |
| API 오류 | AxiosError → ApiError DTO 파싱 → message 표시 |

---

## 6. 인터랙션 패턴

### 5.1 네비게이션

| 요소 | 동작 |
|------|------|
| Logo "KW" | → `/` (포트폴리오 랜딩) |
| "블로그" | → `/blog` (목록) |
| "글쓰기" (Header) | → `/blog/editor` (인증 시만 표시) |
| PostCard 클릭 | → `/blog/{id}` (상세) |
| "← 목록으로" | → `/blog` |
| "수정" 버튼 | → `/blog/editor/{id}` |

### 5.2 폼 제출

| 액션 | 동작 |
|------|------|
| 로그인 | POST → 성공 시 `/blog`로 이동 |
| 회원가입 | POST → 성공 시 `/blog`로 이동 |
| 새 글 저장 | POST → 성공 시 `/blog/{newId}`로 이동 |
| 글 수정 저장 | PUT → 성공 시 `/blog/{id}`로 이동 |
| 글 삭제 | DELETE → 성공 시 `/blog`로 이동 |
| 버튼 비활성화 | 제출 중 `disabled`, 텍스트 변경 ("저장 중...", "삭제 중...") |

### 5.3 데이터 갱신

| 액션 | 캐시 무효화 |
|------|------------|
| 글 생성 | `queryKey: ["posts"]` 전체 무효화 |
| 글 수정 | `["posts"]` + `["posts", id]` 무효화 |
| 글 삭제 | `["posts"]` 전체 무효화 |
| 카테고리 필터 변경 | 새 queryKey로 자동 fetch |
| 페이지 이동 | 새 queryKey로 자동 fetch |

---

## 7. 반응형 전략

### 6.1 현재 구현 (Phase 1B MVP)

현재는 **데스크탑 우선** 접근으로 `max-w-5xl` (1024px) 기준 레이아웃입니다.

| 브레이크포인트 | 대응 |
|---------------|------|
| < 640px (mobile) | 자연스러운 스택 (flex-wrap) |
| 640px ~ 1024px (tablet) | 동일 레이아웃, 좌우 패딩 축소 |
| > 1024px (desktop) | 콘텐츠 max-w-5xl 중앙 정렬 |

### 6.2 향후 개선 (Phase 2)

- [ ] 모바일 전용 Header 메뉴 (햄버거 메뉴)
- [ ] PostCard 그리드를 모바일에서 1열, 데스크탑에서 2열로
- [ ] 에디터 편집/미리보기를 탭 대신 사이드바이사이드
- [ ] Sidebar 컴포넌트 (태그 클라우드, 인기 게시글)

---

## 8. shadcn/ui 사용 패턴

### 7.1 Link + Button 스타일

shadcn v4 (base-nova)에서는 `asChild` prop이 없으므로, `buttonVariants()`를 Link의 className에 적용합니다:

```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

<Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm" })}>
  블로그
</Link>
```

### 7.2 Client Component 제약

`buttonVariants`, `Badge` 등은 `"use client"` 의존이 있으므로 Server Component에서 직접 호출할 수 없습니다. 필요 시 페이지에 `"use client"` 디렉티브를 추가합니다.

### 7.3 설치된 컴포넌트 목록

| 컴포넌트 | 경로 | 사용처 |
|----------|------|--------|
| Button | `components/ui/button.tsx` | 모든 인터랙티브 버튼 |
| Input | `components/ui/input.tsx` | 로그인, 회원가입, 에디터 |
| Label | `components/ui/label.tsx` | 폼 필드 레이블 |
| Card | `components/ui/card.tsx` | PostCard, Auth 페이지, 에디터 미리보기 |
| Badge | `components/ui/badge.tsx` | 카테고리, 태그 |
| Separator | `components/ui/separator.tsx` | Header, Footer, 상세 페이지 |
| Skeleton | `components/ui/skeleton.tsx` | 로딩 상태 |
| Dialog | `components/ui/dialog.tsx` | 삭제 확인 모달 |
| Textarea | `components/ui/textarea.tsx` | 에디터 본문 |
| Select | `components/ui/select.tsx` | (향후 사용 예정) |
| Alert | `components/ui/alert.tsx` | 오류 메시지 |

---

## 9. 문서 간 관계

```
depth-2-module-structure.md (전체 프론트엔드 아키텍처)
    ↓
├── portfolio-landing-design.md (포트폴리오 랜딩 UI)
│       ↓
│   실제 구현: app/(portfolio)/, src/modules/portfolio/
│
└── blog-ui-design.md (이 문서 — Blog 모듈 UI 세부 스펙)
        ↓
    실제 구현:
        ├─→ src/modules/blog/components/  (PostCard, PostEditor, ...)
        ├─→ app/(blog)/blog/              (라우트 페이지)
        ├─→ components/ui/                (shadcn 컴포넌트)
        └─→ app/globals.css               (디자인 토큰)
```

---

## 10. 다크 모드

### 9.1 테마 토글

| 속성 | 값 |
|------|-----|
| 위치 | Header 우측, Auth 액션 영역 옆 |
| 아이콘 | Sun (라이트) / Moon (다크) — `lucide-react` |
| 크기 | `Button variant="ghost" size="icon"` (h-9 w-9) |
| 전환 | 아이콘 `rotate(180deg)` + `scale(0 → 1)` 교체 애니메이션 |

### 9.2 테마 저장

| 항목 | 방법 |
|------|------|
| 저장 | `localStorage.setItem("theme", "dark" \| "light")` |
| 초기값 | `prefers-color-scheme` 미디어 쿼리 (시스템 설정) |
| 적용 | `<html>` 태그에 `class="dark"` 토글 |
| 깜빡임 방지 | `<head>` 내 인라인 `<script>`로 초기 테마 즉시 적용 |

### 9.3 모드별 시각 차이

| 요소 | 라이트 | 다크 |
|------|--------|------|
| 페이지 배경 | 순백 `#ffffff` | 깊은 검정 `#0a0a0a` + 메쉬 그라데이션 |
| 카드 | 흰색, 옅은 회색 테두리 | Glass (반투명 + blur) |
| 카드 Hover | 미세 shadow + `translateY(-2px)` | Glass 강화 + Blue glow + `translateY(-4px)` |
| Header | `bg-background/80` + blur-md | `bg-background/60` + blur-lg + glass border |
| 버튼 Hover | 배경색 변경 | 배경색 변경 + Blue glow |
| 링크/강조 | `text-foreground` hover 시 underline | hover 시 `text-accent-cyan` |
| 메쉬 그라데이션 | 없음 (깨끗한 흰 배경) | 배경 깊은 곳에 Blue/Cyan radial gradient |

### 9.4 메쉬 그라데이션 스펙 (다크 모드)

```
배경에 2~3개의 radial-gradient가 겹쳐 은은한 조명 느낌:

1. radial-gradient(ellipse at 20% 50%, var(--mesh-deep), transparent 50%)
2. radial-gradient(ellipse at 80% 20%, var(--mesh-mid), transparent 40%)
3. radial-gradient(ellipse at 60% 80%, var(--mesh-glow), transparent 45%)

전체를 body::before 또는 fixed div로 적용, z-index: -1
opacity: 0.4 ~ 0.6 (은은하게)
```

> **핵심**: 메쉬 그라데이션은 "느껴지지만 방해하지 않는" 수준. 콘텐츠 가독성 > 배경 효과.

---

## 11. 댓글 UI 상세

### 10.1 전체 레이아웃

```
┌── CommentSection ── max-w-3xl ─────────────────────┐
│                                                     │
│ 댓글 N개 (text-lg, font-semibold)                   │
│                                                     │
│ ┌── CommentForm (인증 시) ────────────────────────┐ │
│ │ [Textarea: placeholder="댓글을 작성하세요"]      │ │
│ │                                    [작성 btn]   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌── CommentItem ──────────────────────────────────┐ │
│ │ avatar  username  ·  3시간 전                    │ │
│ │ 댓글 내용 텍스트...                              │ │
│ │                          [답글] [수정] [삭제]    │ │
│ │                                                  │ │
│ │   ┌── Reply (들여쓰기 pl-8, border-l-2) ──────┐ │ │
│ │   │ avatar  username  ·  1시간 전              │ │ │
│ │   │ 답글 내용 텍스트...                        │ │ │
│ │   │                          [수정] [삭제]     │ │ │
│ │   └────────────────────────────────────────────┘ │ │
│ │                                                  │ │
│ │   ┌── ReplyForm (답글 작성 시 토글) ──────────┐ │ │
│ │   │ [Textarea: "답글을 작성하세요"]            │ │ │
│ │   │                        [취소] [답글 작성]  │ │ │
│ │   └────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────┘ │
│                                                     │
│ ┌── CommentItem ──────────────────────────────────┐ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 10.2 CommentItem 스펙

| 요소 | 스펙 |
|------|------|
| 레이아웃 | `flex gap-3` (아바타 + 콘텐츠) |
| 아바타 | `w-8 h-8 rounded-full bg-muted` (이니셜 표시) |
| 작성자 | `text-sm font-medium` |
| 시간 | `text-xs text-muted-foreground` · 상대 시간 (3시간 전) |
| 본문 | `text-sm` 일반 텍스트 |
| 삭제된 댓글 | `text-muted-foreground italic` "삭제된 댓글입니다." |
| 액션 버튼 | `text-xs text-muted-foreground hover:text-foreground` — 작성자만 수정/삭제 표시 |
| 구분선 | 댓글 간 `border-b border-border` (마지막 제외) |

### 10.3 대댓글 (Reply)

| 요소 | 스펙 |
|------|------|
| 들여쓰기 | `pl-8` (32px) 또는 `ml-10` (아바타 너비 + gap 만큼) |
| 좌측 라인 | `border-l-2 border-muted` (시각적 연결선) |
| 최대 깊이 | 2단계 (루트 + 답글 1단계) — 답글의 답글은 같은 depth |
| 답글 버튼 | 루트 댓글에만 표시 (답글에는 답글 불가) |

### 10.4 인라인 수정

| 상태 | UI |
|------|-----|
| 기본 | 댓글 텍스트 + [수정] [삭제] 버튼 |
| 수정 중 | Textarea(기존 텍스트 채워진 상태) + [취소] [저장] 버튼 |
| 전환 | 수정 버튼 클릭 → 텍스트가 Textarea로 교체 (같은 자리) |

### 10.5 삭제 확인

| 속성 | 값 |
|------|-----|
| 방식 | 인라인 확인 — Dialog 없이 "정말 삭제하시겠습니까?" 텍스트 + [취소] [삭제] |
| 이유 | 댓글 삭제는 게시글 삭제보다 가볍기 때문에 모달은 과함 |

### 10.6 댓글 작성 폼 (CommentForm)

| 속성 | 값 |
|------|-----|
| 입력 | `Textarea` rows=2, `resize-none` |
| Placeholder | "댓글을 작성하세요" (루트) / "@username 에게 답글 작성" (답글) |
| 작성 버튼 | `Button size="sm"` — 내용 비어있으면 `disabled` |
| 미인증 시 | Textarea 대신 "댓글을 작성하려면 [로그인]하세요." 텍스트 + 로그인 링크 |

---

## 12. Toast 알림

### 11.1 라이브러리

**Sonner** (shadcn/ui 공식 권장 Toast)

```bash
npx shadcn@latest add sonner
```

### 11.2 배치

| 속성 | 값 |
|------|-----|
| 위치 | 화면 우측 하단 (`bottom-right`) |
| 최대 동시 표시 | 3개 |
| 자동 닫힘 | 4초 (success), 6초 (error) |
| 수동 닫기 | X 버튼 |

### 11.3 변형 (Variants)

| 변형 | 아이콘 | 색상 | 용도 |
|------|--------|------|------|
| `success` | CheckCircle | 초록 (기본) | 생성/수정/삭제 성공 |
| `error` | XCircle | destructive | API 오류, 네트워크 오류 |
| `info` | Info | accent-cyan | 정보 알림 (선택) |

### 11.4 트리거 시점

| 액션 | 메시지 | 변형 |
|------|--------|------|
| 게시글 생성 | "게시글이 작성되었습니다." | success |
| 게시글 수정 | "게시글이 수정되었습니다." | success |
| 게시글 삭제 | "게시글이 삭제되었습니다." | success |
| 댓글 작성 | "댓글이 작성되었습니다." | success |
| 댓글 삭제 | "댓글이 삭제되었습니다." | success |
| 좋아요 | Toast 없음 (optimistic update로 충분) | — |
| API 오류 | 서버 에러 메시지 그대로 | error |
| 네트워크 오류 | "서버에 연결할 수 없습니다." | error |
| 로그아웃 | "로그아웃되었습니다." | info |

### 11.5 다크 모드 스타일

| 모드 | 스타일 |
|------|--------|
| 라이트 | 흰색 배경 + 옅은 테두리 (기본) |
| 다크 | Glass 스타일 — `bg-glass-bg` + `backdrop-blur` + `border-glass-border` |

---

## 13. 향후 디자인 개선 로드맵

### Phase 1B — 즉시 구현 (디자인 명세 완료)

| 우선순위 | 항목 | 상태 | 명세 섹션 |
|----------|------|------|-----------|
| 1 | 디자인 컨셉 적용 (Glassmorphism + Blue/Cyan) | 📋 명세 완료 | 섹션 0, 1 |
| 2 | 다크 모드 토글 + 메쉬 그라데이션 | 📋 명세 완료 | 섹션 10 |
| 3 | 댓글 수정/삭제 + 대댓글 UI | 📋 명세 완료 | 섹션 11 |
| 4 | Toast 알림 (Sonner) | 📋 명세 완료 | 섹션 12 |
| 5 | Loading → Skeleton 전환 | 📋 명세 완료 | 섹션 5.1 |
| 6 | Header sticky + backdrop-blur | 📋 명세 완료 | 섹션 4.4 |
| 7 | PostCard hover 부유 + glow | 📋 명세 완료 | 섹션 3.1, 4.2 |

### Phase 1B — 이미 구현됨

| 항목 | 상태 |
|------|------|
| 좋아요 버튼 (LikeButton) | ✅ 구현 완료 (세션 #12) |
| 검색 바 (SearchBar + debounce) | ✅ 구현 완료 (세션 #12) |
| 댓글 생성 (CommentForm) | ✅ 구현 완료 (세션 #12) |

### Phase 2 — 후순위

| 우선순위 | 항목 | 설명 |
|----------|------|------|
| 1 | 마크다운 에디터 고도화 | 툴바 (Bold, Italic, Link), 이미지 업로드 |
| 2 | WYSIWYG 에디터 | Tiptap 또는 Plate |
| 3 | 모바일 반응형 | 햄버거 메뉴, 모바일 에디터 UX |
| 4 | ADMIN 대시보드 UI | 카테고리/태그 관리, Service Registry |
