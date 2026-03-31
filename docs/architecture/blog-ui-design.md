# Blog UI 디자인 명세

> Frontend Blog 모듈의 컴포넌트별 디자인 스펙, 레이아웃 구조, 디자인 토큰, 반응형 전략을 정의합니다.

**최종 업데이트**: 2026-03-31 (세션 #11)

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
| `--font-sans` | Geist Sans (Next.js 기본) | 본문, UI |
| `--font-mono` | Geist Mono | 코드, 에디터 |
| `--font-heading` | Geist Sans | 제목 |

### 1.3 디자인 원칙

1. **Neutral 톤**: 무채색 계열로 콘텐츠에 집중하는 읽기 친화적 디자인
2. **최소주의**: 불필요한 장식 배제, 구조와 타이포그래피로 위계 표현
3. **일관성**: 모든 인터랙티브 요소는 shadcn/ui 컴포넌트 사용
4. **접근성**: focus-visible 링, aria-invalid 상태, 충분한 색상 대비

---

## 2. 레이아웃 구조

### 2.1 전체 레이아웃 (ShellLayout)

```
┌──────────────────────────────────────────────────────┐
│ Header (h-14, border-b, bg-background)               │
│ ┌─ Logo ──── Nav ──────────── Auth Actions ────────┐ │
│ │ Portfolio │ 블로그        글쓰기 │ user │ 로그아웃│ │
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
| 호버 | `hover:ring-2 hover:ring-ring/20 transition-all` |
| 카테고리 | `Badge variant="secondary"` |
| 태그 | `Badge variant="outline"` (최대 3개) |
| 제목 | `text-lg font-semibold line-clamp-2` |
| 요약 | `text-sm text-muted-foreground line-clamp-2` |
| 메타 정보 | `text-xs text-muted-foreground` |
| Footer | 조회수/좋아요, `border-t bg-muted/50` |

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

## 4. 상태별 UI 패턴

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

## 5. 인터랙션 패턴

### 5.1 네비게이션

| 요소 | 동작 |
|------|------|
| Logo "Portfolio" | → `/` (홈) |
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

## 6. 반응형 전략

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

## 7. shadcn/ui 사용 패턴

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

## 8. 문서 간 관계

```
depth-2-module-structure.md (전체 프론트엔드 아키텍처)
    ↓
blog-ui-design.md (이 문서 — Blog 모듈 UI 세부 스펙)
    ↓
실제 구현 파일:
    ├─→ src/modules/blog/components/  (PostCard, PostEditor, ...)
    ├─→ app/blog/                     (라우트 페이지)
    ├─→ components/ui/                (shadcn 컴포넌트)
    └─→ app/globals.css               (디자인 토큰)
```

---

## 9. 향후 디자인 개선 로드맵

| 우선순위 | 항목 | 설명 |
|----------|------|------|
| 1 | 댓글 UI | CommentList, CommentForm, 대댓글 들여쓰기 |
| 2 | 좋아요 버튼 | 하트 아이콘 토글, 카운트 애니메이션 |
| 3 | 검색 바 | Header 또는 Blog 목록에 SearchBar, 디바운스 |
| 4 | Dark Mode 토글 | 현재 `.dark` 클래스 정의만 있음, 수동 토글 UI 필요 |
| 5 | 마크다운 에디터 고도화 | 툴바 (Bold, Italic, Link), 이미지 업로드 |
| 6 | WYSIWYG 에디터 | Tiptap 또는 Plate (Phase 2) |
| 7 | 모바일 반응형 | 햄버거 메뉴, 모바일 에디터 UX |
| 8 | Toast 알림 | 저장 성공/실패 피드백 (shadcn Toast 또는 Sonner) |
