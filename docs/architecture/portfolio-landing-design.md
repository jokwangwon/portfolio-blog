# Portfolio Landing Page 디자인 명세

> 포트폴리오 소개 랜딩 페이지의 라우트 구조, 섹션별 디자인 스펙, 레이아웃을 정의합니다.

**최종 업데이트**: 2026-09-29
**관련 문서**: `blog-ui-design.md` (블로그 UI), `light-mode-glass-design.md` (Glass 토큰)

---

## AI Backend 포지셔닝 (2026-09-29 최신 기준)

- 이름·AI Backend / Backend Developer·서비스 연결 설명·실무/논문/운영 근거를 Hero에 표시한다.
- 순서: Hero → Selected Work(민원e·혼천) → Publication → 공개 개인 도구 → About → 기술 사용 맥락 → 경력 → 최근 글 → Contact.
- 민원e는 이번 사용자가 공개 소개를 요청한 문제·담당 업무·기술 선택·결과만 설명한다. 회사 코드는 공개하지 않는다. 이 명시적 요청은 아래 9월 15일 요약 공개 기준보다 우선하며, 다른 내부 자료까지 공개 범위를 넓히지 않는다.
- 혼천은 개별 도구·규칙 구현, AI 생성·시각 검토 실험, 전체 월드 변화 설계 범위를 구분한다. 논문은 공식 서지·DOI·KCI 링크를 제공한다.
- 기술 숙련도 점수 대신 Backend / AI Integration / Infra·Ops / Research와 실무·개인·논문 사용 맥락을 표시한다. 색상·타이포그래피·카드 토큰은 유지한다.
- [파일별 변경·근거·검증·추가 확인 항목](../content/portfolio-positioning-2026-09-29.md). 아래 절은 이전 단계의 설계·공개 기록이며 충돌할 때 이 최신 기준을 따른다.

## 공개 범위 분리 (2026-09-15 당시 기준)

[공개 범위 기준](../content/portfolio-disclosure-policy.md)에 따라 공개 포트폴리오에는 회사명·기간·역할·한 문장 요약을 표시한다. 회사명 공개를 줄이라는 추가 답변이 오면 조정한다. 기존 상세 경력 소개 단계의 업무 목록과 공통 프로젝트 설명은 지원용 로컬 문서로 이동한다.

- 트러스트에이아이의 인턴/정규직과 기원테크 경력을 구분하고 종료된 기간을 표시한다.
- About는 AI 서비스 백엔드 경험과 현재 학습/개인 개발을 짧게 소개한다.
- 상세 구현, 팀 의사결정, 미확인 시점은 공개 데이터와 클라이언트 번들에 넣지 않는다.
- 지원용 초안과 개인 검토 원장은 Git 제외 로컬 파일로 보관한다. 공개 PDF 다운로드나 숨겨진 공개 URL을 만들지 않는다.
- 학습 기록과 공개 개인 프로젝트는 유지한다. 과거 상세 화면 캡처/검증 자료 중 상세 내용이 있는 파일은 비공개 위치로 이동한다.

## 경험 기록 확장 (2026-09-14, 당시 계획)

기원테크·트러스트랩 기록을 포트폴리오에 포함한다. 현재 재직 중이라는 문구는 사용하지 않는다. 기간·역할·실제 기여·성과는 [이력 전달 양식](../content/career-records-intake.md)으로 확인한다. 홈의 회사별 요약과 상세 업무/관련 기록을 연결하는 안은 [지식 저장소 확장안](knowledge-workspace-design.md)을 참조한다. 회사별 상세는 아직 구현하지 않았다.

## 공개 소개 문구 기준 (2026-09-13)

사용자가 GitHub와 실제 구현에 근거한 소개 수정을 요청했다. 아래 기준이 초기 예시 문구보다 우선한다.

- 개인 숙련도·회사 경력은 코드 존재만으로 추정하지 않는다. 현재 기원테크 재직으로 표현하지 않는다. 2026-09-14 사용자 요청에 따라 기원테크·트러스트랩의 과거 경험을 자료 확인 후 포함한다. 자료 부족을 경력 자체의 부재로 해석하지 않는다.
- 사용자가 정정한 부트캠프 수료 시점은 **2026년 8월**. 당시에는 일자와 교육기관·공식 과정명을 단정하지 않았으며, 이후 2026-09-15 제공 이력을 상단 기준으로 반영한다.
- Hero/About는 데이터베이스 학습, 웹 서비스와 도구 제작, AI 코딩 도구 활용, 문서·테스트·수정 기록을 설명한다.
- 기술 카드는 근거 없는 숙련도 백분율 대신 프로젝트에서의 사용 용도를 표시한다. PyTorch는 확인된 적용 근거가 없어 제외한다.
- 프로젝트 카드에는 현재 상태를 항상 표시한다. 미구현 AI Benchmark는 소개 목록에서 제외한다.
- 실제 공개 저장소의 Portfolio, Oracle 학습 게임, alert log 분석, 발표자료 생성, 혼천, AI 개발 도구를 소개한다.
  외부 프로젝트의 코드를 실행 검증한 것으로 서술하지 않고 개발·학습·실험 상태를 구분한다.
- 프로젝트 링크는 각 저장소로 연결한다. 설명은 줄 수로 잘라 숨기지 않는다.
- Pixel Office는 GitHub 활동을 주기적으로 조회해 캐릭터에 반영하는 시각화다. 실시간 AI 개발 현장으로 표현하지 않는다.
- 검색 메타데이터에도 미구현 Benchmark와 과장된 실시간 표현을 제거한다.

근거: 현재 저장소 및 [GitHub 공개 저장소](https://github.com/jokwangwon?tab=repositories)의 README·파일 구조·대표 코드·커밋을 2026-09-13에 확인했다. 상세 비교와 검증은 [세션 #20](../sessions/SESSION_2026-09-13.md) 참조.

---

## 단계별 적용 1: 글꼴과 줄바꿈 (2026-09-13)

사용자가 검토 우선순위대로 조금씩 수정하도록 요청했다. 첫 공개 변경은 타이포그래피다.

- 본문·제목 sans 글꼴의 자기 참조를 제거하고 기존 Pretendard Variable을 우선 적용한다.
  로딩 실패 시 Geist·시스템 sans-serif로 대체한다. 코드용 monospace는 유지한다.
- 포트폴리오 영역의 한글 단어 중간 줄바꿈을 줄이고, 긴 문자열은 화면 밖으로 넘치지 않도록 한다.
- 모바일 Hero 제목 크기와 소개 문장의 줄 배치를 조정한다.
- 실제 Chromium에서 글꼴 계산값과 PC/모바일/다크 화면을 확인한다.
- 이전에 작성한 카드·메뉴·최신 글 개선과 구분해 이 첫 변경만 별도 빌드 문맥에서 배포한다.

---

## 단계별 적용 2: 임시 이미지와 프로젝트 카드 (2026-09-13)

- About의 KW 이미지 자리 대신 이름과 기존 소개를 텍스트 중심으로 배치한다.
- 프로젝트의 이니셜 썸네일을 없애고 상태·제목·설명·핵심 구현·기술·링크를 상시 표시한다.
- 카드 하단 링크의 터치 영역은 높이 44px 이상으로 확보한다.
- 프로젝트 6개와 소개 문구는 유지한다. 대표작 선정과 섹션 순서는 후속 단계다.
- PC 라이트/다크와 모바일 390/320px에서 넘침·정보 노출·링크를 확인한다.
- 메뉴·최근 글·공통 스크롤 변경은 포함하지 않는 별도 빌드 사본으로 배포한다.

---

## 단계별 적용 3: 첫 화면과 프로젝트 우선순위 (2026-09-13)

- Hero는 이름·학습 분야·프로젝트 이동을 중심으로 구성하고 전체 화면 높이, 3D Canvas, 움직이는 이름 효과를 제거한다.
- 순서는 Hero → Projects → About → 기술 → 이력 → 블로그 → 연락 경로다.
- 공개 운영을 확인한 Portfolio & Blog와 Oracle 학습 게임을 대표 작업으로 먼저 표시한다. 개인 숙련도 순위나 채용 직무 확정으로 해석하지 않는다.
- 나머지 네 작업은 제목·상태·설명·기술·저장소를 갖춘 간결한 목록으로 표시한다.
- 홈은 단색 배경을 적용한다. 공통 테마 편집 패널은 개발 모드에서만 표시한다.
- 프로젝트 바로가기와 메뉴의 /#projects, /#about 링크, 섹션 스크롤 여백을 함께 적용한다.
- 블로그는 실제 빈 목록 및 브라우저 모의 데이터의 목록·상세·오류를 검토하고 후속 방향을 기록한다. BlogPreviewSection의 미배포 기능은 이번 범위에서 제외한다.

---

## 공개 후 사용성 개선 1차 (2026-09-13)

사용자의 디자인·기능 개선 요청에 따라 기존 색상/테마를 유지하면서 아래 문제를 먼저 해결한다.

- 프로젝트 카드: 임시 이니셜 썸네일과 hover 전용 설명을 없애고 상태·제목·설명·핵심 구현·기술·링크 순으로 배치한다. 핵심 정보는 모바일·키보드에서도 항상 읽을 수 있어야 한다.
- 홈 최근 글: 공개 글 API를 발행일 내림차순으로 최대 3개 조회하고 기존 PostCard를 재사용한다. 로딩·실제 빈 결과·오류를 구분하고 오류에는 재시도를 제공한다.
- 포트폴리오 메뉴: 소개/프로젝트는 /#about, /#projects 링크로 연결하여 Office에서도 홈 섹션으로 이동한다. Office 링크를 추가하고 모바일 메뉴의 펼침 상태·Escape 닫기·포커스 복귀를 제공한다.
- 고정 헤더가 섹션 제목을 가리지 않도록 섹션에 스크롤 여백을 둔다.
- 인증 확인 중 전체 화면이 대기하는 기존 구조는 인증 흐름 회귀 점검을 포함한 별도 후속 과제로 남긴다.

---

## 0. 설계 배경

### 0.1 문제 정의

기존 `app/page.tsx`는 임시 랜딩 페이지(링크 1개)로, 프로젝트의 목적과 개발자의 역량을 전달하지 못함.

### 0.2 목표

| 항목 | 정의 |
|------|------|
| **1차 타겟** | 채용 담당자 / 면접관 (30초 내 판단) |
| **2차 타겟** | 개발자 커뮤니티 (블로그 콘텐츠 소비) |
| **핵심 메시지** | "데이터베이스 학습을 웹 서비스와 도구로 이어가는 개발 기록" |

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
│ │  2026.09 ── 개인 포트폴리오 공개                              │ │
│ │    │                                                  │ │
│ │  2026.08 ── 부트캠프 수료                                     │ │
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
| 기술 카드 | 기술명(`text-sm font-medium`) + 프로젝트 사용 용도 |
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
| 설명 | `text-sm text-muted-foreground` |
| 기술 태그 | `Badge variant="secondary" size="sm"` × N |
| 링크 버튼 | `Button variant="outline" size="sm"` (GitHub, Live Demo) |
| Hover | blog PostCard와 동일 (translateY + shadow/glow) |

프로젝트 목록 (과거 초기안 — 공개 목록은 위 문구 기준 적용):

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
