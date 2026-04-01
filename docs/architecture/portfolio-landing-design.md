# Portfolio Landing Page 디자인 명세

> 포트폴리오 소개 랜딩 페이지의 라우트 구조, 섹션별 디자인 스펙, 레이아웃을 정의합니다.

**최종 업데이트**: 2026-04-01
**관련 문서**: `blog-ui-design.md` (블로그 UI), `light-mode-glass-design.md` (Glass 토큰)

---

## 0. 설계 배경

### 0.1 문제 정의

기존 `app/page.tsx`는 임시 랜딩 페이지(링크 1개)로, 프로젝트의 목적과 개발자의 역량을 전달하지 못함.

### 0.2 목표

| 항목 | 정의 |
|------|------|
| **1차 타겟** | 채용 담당자 / 면접관 (30초 내 판단) |
| **2차 타겟** | 개발자 커뮤니티 (블로그 콘텐츠 소비) |
| **핵심 메시지** | "AI/풀스택 개발자가 문서-주도 설계로 만든 기술 포트폴리오 플랫폼" |

### 0.3 선택지 A: 단일 Next.js 앱 + Route Group 분리

하나의 Next.js 앱 내에서 Route Group `(portfolio)` / `(blog)`로 레이아웃을 분리.

- 공통 디자인 시스템(shadcn/ui, Glassmorphism 토큰) 공유
- 배포 단일, 유지보수 부담 최소화
- 1인 프로젝트에 가장 현실적인 구조

---

## 1. 라우트 구조 변경

### 1.1 현재 → 변경 후

```
# 현재
app/
├── layout.tsx          ← RootLayout (Providers + ShellLayout)
├── page.tsx            ← 임시 랜딩
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── auth/callback/page.tsx
└── blog/
    ├── page.tsx
    ├── [id]/page.tsx
    └── editor/
        ├── page.tsx
        └── [id]/page.tsx

# 변경 후
app/
├── layout.tsx          ← RootLayout (Providers만, ShellLayout 제거)
├── (portfolio)/
│   ├── layout.tsx      ← PortfolioLayout (풀스크린, Header 포함)
│   └── page.tsx        ← 랜딩 페이지 (/)
├── (blog)/
│   ├── layout.tsx      ← BlogLayout (ShellLayout 계승, max-w-5xl)
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   └── blog/editor/
│       ├── page.tsx
│       └── [id]/page.tsx
├── (auth)/
│   ├── layout.tsx      ← AuthLayout (중앙 정렬, 최소 UI)
│   ├── login/page.tsx
│   └── signup/page.tsx
└── auth/callback/page.tsx
```

### 1.2 레이아웃별 역할

| Route Group | 레이아웃 | Header | Footer | max-width | 특징 |
|-------------|----------|--------|--------|-----------|------|
| `(portfolio)` | PortfolioLayout | 전용 (투명 → 스크롤 시 Glass) | 포함 | 없음 (풀스크린) | 섹션 기반 스크롤 |
| `(blog)` | BlogLayout | 공통 Header | 공통 Footer | max-w-5xl | 기존 ShellLayout 계승 |
| `(auth)` | AuthLayout | 없음 | 없음 | max-w-sm | 카드 중앙 정렬 |

### 1.3 RootLayout 변경

기존 RootLayout에서 `ShellLayout` 래핑을 제거하고, 각 Route Group의 layout.tsx가 자체 레이아웃을 담당.

```tsx
// app/layout.tsx (변경 후)
export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>...</head>
      <body>
        <Providers>
          {children}  {/* ShellLayout 제거 — 각 그룹이 자체 레이아웃 */}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 2. 포트폴리오 랜딩 페이지 (/)

### 2.1 전체 구조

```
┌──────────────────────────────────────────────────────────┐
│ PortfolioHeader (투명 → 스크롤 시 Glass, fixed)          │
│ ┌─ Logo ────── Nav ──────────────── Actions ───────────┐ │
│ │ KW     About │ Projects │ Blog    [Resume] [GitHub]  │ │
│ └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌── Section: Hero ─── 100vh ───────────────────────────┐ │
│ │                                                      │ │
│ │          안녕하세요,                                   │ │
│ │          조광원입니다.                                  │ │
│ │          AI & Full-Stack Developer                    │ │
│ │                                                      │ │
│ │          [블로그 보기]  [프로젝트 보기]                  │ │
│ │                                                      │ │
│ │          ↓ (scroll indicator)                         │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌── Section: About ────────────────────────────────────┐ │
│ │                                                      │ │
│ │  프로필 사진       자기소개 텍스트                      │ │
│ │  (rounded)        관심 분야, 현재 상태                 │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌── Section: Tech Stack ───────────────────────────────┐ │
│ │                                                      │ │
│ │  [Backend]  [Frontend]  [DevOps]  [AI/ML]            │ │
│ │                                                      │ │
│ │  Spring Boot  Next.js   Docker    Python             │ │
│ │  PostgreSQL   React     GitHub    PyTorch            │ │
│ │  JPA          TypeScript Actions  LangChain          │ │
│ │  ...          ...        ...      ...                │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌── Section: Projects ─────────────────────────────────┐ │
│ │                                                      │ │
│ │  ┌── ProjectCard ───┐  ┌── ProjectCard ───┐          │ │
│ │  │ 썸네일 / 스크린샷 │  │ 썸네일 / 스크린샷 │          │ │
│ │  │ 프로젝트 이름     │  │ 프로젝트 이름     │          │ │
│ │  │ 한줄 설명         │  │ 한줄 설명         │          │ │
│ │  │ [태그] [태그]     │  │ [태그] [태그]     │          │ │
│ │  │ [GitHub] [Live]   │  │ [GitHub] [Live]   │          │ │
│ │  └──────────────────┘  └──────────────────┘          │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌── Section: Experience ───────────────────────────────┐ │
│ │                                                      │ │
│ │  2026 ── 기원테크 AI 개발                              │ │
│ │    │                                                  │ │
│ │  2025 ── 부트캠프                                     │ │
│ │    │                                                  │ │
│ │  2024 ── ...                                         │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌── Section: Blog Preview ─────────────────────────────┐ │
│ │                                                      │ │
│ │  최근 글                          [전체 보기 →]        │ │
│ │                                                      │ │
│ │  ┌─ PostCard ─┐ ┌─ PostCard ─┐ ┌─ PostCard ─┐       │ │
│ │  │ ...        │ │ ...        │ │ ...        │       │ │
│ │  └────────────┘ └────────────┘ └────────────┘       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌── Section: Contact ──────────────────────────────────┐ │
│ │                                                      │ │
│ │          함께 일하고 싶으시다면                          │ │
│ │                                                      │ │
│ │  [Email]  [GitHub]  [LinkedIn]  [Resume]              │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Footer                                                   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 섹션 스펙

#### Hero Section

| 속성 | 값 |
|------|-----|
| 높이 | `min-h-screen` (100vh) |
| 배경 | 메쉬 그라데이션 (다크), 깔끔한 배경 (라이트) |
| 이름 | `text-5xl md:text-7xl font-bold tracking-tight` |
| 서브타이틀 | `text-xl md:text-2xl text-muted-foreground` |
| CTA 버튼 | `Button size="lg"` × 2 (primary + outline) |
| Scroll Indicator | `animate-bounce`, 하단 중앙, `ChevronDown` 아이콘 |
| 레이아웃 | `flex flex-col items-center justify-center text-center` |
| 콘텐츠 폭 | `max-w-3xl mx-auto` |

#### About Section

| 속성 | 값 |
|------|-----|
| ID | `#about` |
| 패딩 | `py-24 md:py-32` |
| 레이아웃 | `max-w-5xl mx-auto`, `grid md:grid-cols-[280px_1fr] gap-12` |
| 프로필 이미지 | `w-56 h-56 rounded-2xl object-cover` (또는 placeholder) |
| 이름 | `text-2xl font-bold` |
| 소개 텍스트 | `text-base text-muted-foreground leading-relaxed` |
| 키워드 강조 | `font-medium text-foreground` (본문 내 핵심 키워드) |

#### Tech Stack Section

| 속성 | 값 |
|------|-----|
| ID | `#tech-stack` |
| 패딩 | `py-24 md:py-32` |
| 배경 | `bg-muted/30` (라이트) / `bg-muted/10` (다크) — 섹션 구분용 |
| 레이아웃 | `max-w-5xl mx-auto` |
| 카테고리 탭 | `flex gap-2 mb-8`, `Button variant="outline" size="sm"` |
| 기술 아이템 | `grid grid-cols-2 md:grid-cols-4 gap-4` |
| 기술 카드 | 아이콘(32px) + 기술명(`text-sm font-medium`) + 숙련도 표시(선택) |
| 카드 스타일 | `rounded-lg border p-4 text-center` (라이트) / Glass 카드 (다크) |

카테고리 분류:

| 카테고리 | 기술 |
|----------|------|
| Backend | Spring Boot, JPA/Hibernate, PostgreSQL, Redis, Gradle |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| DevOps | Docker, GitHub Actions, Nginx |
| AI/ML | Python, PyTorch, LangChain, FastAPI |

#### Projects Section

| 속성 | 값 |
|------|-----|
| ID | `#projects` |
| 패딩 | `py-24 md:py-32` |
| 레이아웃 | `max-w-5xl mx-auto` |
| 그리드 | `grid md:grid-cols-2 gap-6` |
| ProjectCard 크기 | 카드 전체 (썸네일 + 정보) |

ProjectCard 스펙:

| 요소 | 값 |
|------|-----|
| 기반 | shadcn `Card` |
| 썸네일 영역 | `aspect-video bg-muted rounded-t-lg overflow-hidden` |
| 프로젝트명 | `text-xl font-semibold` |
| 설명 | `text-sm text-muted-foreground line-clamp-2` |
| 기술 태그 | `Badge variant="secondary" size="sm"` × N |
| 링크 버튼 | `Button variant="outline" size="sm"` (GitHub, Live Demo) |
| Hover | blog PostCard와 동일 (translateY + shadow/glow) |

프로젝트 목록 (초기):

| 프로젝트 | 설명 | 태그 |
|----------|------|------|
| Portfolio Platform | 이 플랫폼 자체 — SDD + 하네스 엔지니어링 | Spring Boot, Next.js, PostgreSQL |
| AI Benchmark | GPU 벤치마크 비교 도구 | FastAPI, Python, TimescaleDB |
| (향후 추가) | ... | ... |

#### Experience Section

| 속성 | 값 |
|------|-----|
| ID | `#experience` |
| 패딩 | `py-24 md:py-32` |
| 배경 | `bg-muted/30` (라이트) / `bg-muted/10` (다크) |
| 레이아웃 | `max-w-5xl mx-auto` |
| 타임라인 | 좌측 세로선 `border-l-2 border-border` + 원형 마커 |

타임라인 아이템 스펙:

| 요소 | 값 |
|------|-----|
| 마커 | `w-3 h-3 rounded-full bg-primary` (좌측 선 위) |
| 연도 | `text-sm font-medium text-muted-foreground` |
| 제목 | `text-lg font-semibold` |
| 기관/회사 | `text-sm text-muted-foreground` |
| 설명 | `text-sm text-muted-foreground` 1~2줄 |
| 간격 | 아이템 간 `space-y-8` |

#### Blog Preview Section

| 속성 | 값 |
|------|-----|
| ID | `#blog` |
| 패딩 | `py-24 md:py-32` |
| 레이아웃 | `max-w-5xl mx-auto` |
| 헤더 | 제목("최근 글") + [전체 보기 →] 링크 |
| 카드 그리드 | `grid md:grid-cols-3 gap-6` |
| 카드 | 기존 `PostCard` 컴포넌트 재사용 (최대 3개) |
| 빈 상태 | "아직 작성된 글이 없습니다." |

#### Contact Section

| 속성 | 값 |
|------|-----|
| ID | `#contact` |
| 패딩 | `py-24 md:py-32` |
| 배경 | `bg-muted/30` (라이트) / `bg-muted/10` (다크) |
| 레이아웃 | `text-center max-w-2xl mx-auto` |
| 헤더 | `text-3xl font-bold` "함께 일하고 싶으시다면" |
| 서브 | `text-muted-foreground` 간단한 한 줄 |
| 링크 | `flex gap-4 justify-center`, 아이콘 버튼(ghost, size="lg") |
| 아이콘 | Mail, GitHub, Linkedin, FileText(Resume) — `lucide-react` |

---

## 3. PortfolioHeader

포트폴리오 랜딩 전용 Header. Hero 위에서는 투명, 스크롤 시 Glass 효과.

### 3.1 스펙

| 속성 | 값 |
|------|-----|
| 위치 | `fixed top-0 w-full z-50` |
| 높이 | `h-16` (64px) |
| 초기 상태 | `bg-transparent` (Hero 위에서) |
| 스크롤 후 | `bg-background/80 backdrop-blur-lg border-b` |
| 전환 | `transition-all duration-300` |
| 콘텐츠 폭 | `max-w-6xl mx-auto px-6` |

### 3.2 네비게이션

| 요소 | 동작 |
|------|------|
| Logo "KW" | → `/` (최상단 스크롤) |
| About | → `#about` (smooth scroll) |
| Projects | → `#projects` (smooth scroll) |
| Blog | → `/blog` (페이지 이동) |
| Resume | 외부 링크 또는 PDF 다운로드 |
| GitHub | 외부 링크 (new tab) |

### 3.3 모바일 대응

| 브레이크포인트 | 동작 |
|---------------|------|
| `md` 이상 | 가로 Nav 전체 표시 |
| `md` 미만 | 햄버거 메뉴 → 드롭다운 (Sheet 컴포넌트) |

---

## 4. 모드별 랜딩 페이지 시각

### 4.1 라이트 모드

| 요소 | 스타일 |
|------|--------|
| Hero 배경 | `bg-background` (순백) + 미세한 기하학 패턴 또는 그라데이션 |
| 섹션 구분 | 교차 `bg-muted/30` 배경 |
| 카드 | 흰색 + 옅은 테두리 + hover shadow |
| 타임라인 선 | `border-border` (연한 회색) |
| 텍스트 | 기본 foreground, 보조 muted-foreground |

### 4.2 다크 모드

| 요소 | 스타일 |
|------|--------|
| Hero 배경 | 메쉬 그라데이션 (Deep Blue + Cyan, `blog-ui-design.md` 섹션 9.4 동일) |
| 섹션 구분 | 교차 `bg-muted/10` 배경 |
| 카드 | Glass 스타일 (glass-bg + backdrop-blur + glass-border) |
| 타임라인 선 | `border-glass-border` |
| Hover | glow 효과 + translateY |

---

## 5. 블로그 카테고리 확장

포트폴리오 블로그로서 콘텐츠 분류:

| 카테고리 | slug | 설명 |
|----------|------|------|
| TIL | `til` | 공부 정리, 기술 노트 |
| Project | `project` | 프로젝트 작업 내용, 회고 |
| Bootcamp | `bootcamp` | 부트캠프 경험, 후기 |
| Algorithm | `algorithm` | 알고리즘 풀이, 코드 정리 |
| Diary | `diary` | 개발 일기 |

기존 blog-ui-design.md의 CategoryFilter 컴포넌트에서 이 카테고리를 사용.

---

## 6. 컴포넌트 파일 구조

```
src/
├── modules/
│   ├── portfolio/                    ← 신규
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── TechStackSection.tsx
│   │   │   ├── ProjectsSection.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ExperienceSection.tsx
│   │   │   ├── TimelineItem.tsx
│   │   │   ├── BlogPreviewSection.tsx
│   │   │   └── ContactSection.tsx
│   │   └── data/
│   │       ├── projects.ts           ← 프로젝트 목록 정적 데이터
│   │       ├── techStack.ts          ← 기술 스택 정적 데이터
│   │       └── experience.ts         ← 경력 타임라인 정적 데이터
│   └── blog/                         ← 기존 유지
│       ├── components/
│       └── hooks/
├── shell/
│   ├── layout/
│   │   ├── Header.tsx                ← 블로그용 Header (기존)
│   │   ├── PortfolioHeader.tsx       ← 포트폴리오용 Header (신규)
│   │   ├── Footer.tsx                ← 공통
│   │   ├── ShellLayout.tsx           ← BlogLayout에서 사용
│   │   └── PortfolioLayout.tsx       ← 신규
│   └── ...
└── shared/
    └── ...
```

---

## 7. 구현 우선순위

| 순서 | 작업 | 의존성 |
|------|------|--------|
| 1 | Route Group 재구조화 (`(portfolio)`, `(blog)`, `(auth)` layout) | 없음 |
| 2 | PortfolioHeader (투명 → Glass 전환) | 1 |
| 3 | HeroSection | 1, 2 |
| 4 | AboutSection | 1 |
| 5 | TechStackSection | 1 |
| 6 | ProjectsSection + ProjectCard | 1 |
| 7 | ExperienceSection + TimelineItem | 1 |
| 8 | BlogPreviewSection (PostCard 재사용) | 1 |
| 9 | ContactSection | 1 |
| 10 | 모바일 반응형 (PortfolioHeader 햄버거 메뉴) | 2 |

---

## 8. 문서 간 관계

```
portfolio-landing-design.md (이 문서 — 포트폴리오 랜딩 UI)
    │
    ├── blog-ui-design.md (블로그 모듈 UI — PostCard 재사용)
    ├── light-mode-glass-design.md (Glass 토큰 — 다크/라이트 모드)
    └── depth-2-module-structure.md (전체 프론트엔드 아키텍처)
    
실제 구현 파일:
    ├─→ app/(portfolio)/           (랜딩 라우트)
    ├─→ app/(blog)/                (블로그 라우트)
    ├─→ src/modules/portfolio/     (포트폴리오 컴포넌트)
    ├─→ src/shell/layout/          (레이아웃 컴포넌트)
    └─→ app/globals.css            (디자인 토큰)
```

---

## 9. 향후 확장

| 항목 | 설명 | 시기 |
|------|------|------|
| `/projects/{id}` | 독립 프로젝트 상세 페이지 (AI Benchmark 등) | Phase 2 |
| 다국어 (i18n) | 영문 포트폴리오 | Phase 2 |
| 블로그 RSS | `/blog/feed.xml` | Phase 2 |
| OG Image 자동 생성 | `next/og` 활용 | Phase 2 |
