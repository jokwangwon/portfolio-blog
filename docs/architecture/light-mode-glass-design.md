# Light Mode Glassmorphism 디자인 확장

> 기존 다크 모드 전용 Glassmorphism을 라이트 모드에도 적용하는 디자인 컨셉 문서.
> `blog-ui-design.md` Section 0.3, 0.5의 방향을 확장합니다.

**작성일**: 2026-04-01 (세션 #13)
**상태**: 계획 수립 (문서화 단계)

---

## 1. 변경 배경

### 1.1 기존 전략
| 모드 | 전략 |
|------|------|
| 라이트 | Notion/Vercel — 순백 배경, 옅은 회색 카드, "깨끗한 종이 질감" |
| 다크 | Glassmorphism — 반투명 유리 카드, 메쉬 그라데이션, glow |

### 1.2 변경 동기
- 라이트 모드가 상대적으로 평면적이고 무미건조함
- 다크 모드와 라이트 모드 간 비주얼 격차가 큼
- 포트폴리오 첫인상에서 라이트 모드가 기본 노출 (OS 기본값)
- Glassmorphism을 **라이트 모드에 맞게 변환**하여 양쪽 모두 프리미엄 느낌 부여

### 1.3 새로운 전략
| 모드 | 전략 |
|------|------|
| **라이트** | **Warm Glass** — 따뜻한 옐로우/앰버 메쉬 그라데이션 위 반투명 유리 카드. 맑은 날 창가 느낌 |
| **다크** | **Cool Glass** — 기존 유지. Blue/Cyan 메쉬 그라데이션 위 반투명 유리 카드 |

---

## 2. 라이트 모드 디자인 컨셉: "Warm Glass"

### 2.1 핵심 키워드
- **Sunlit Studio** — 햇빛이 들어오는 작업 공간
- **Frosted Warmth** — 따뜻한 서리 유리
- **Amber Glow** — 부드러운 앰버/골드 빛

### 2.2 레퍼런스
| 사이트/컨셉 | 참고 포인트 |
|-------------|------------|
| Apple macOS 윈도우 | 라이트 모드 반투명 창 + 배경 비침 |
| Figma UI | 밝은 배경 위 subtle glass card |
| Warm sunset gradient | 옐로우→앰버→로즈 그라데이션 |

### 2.3 모드 비교표

| 요소 | Dark (Cool Glass) | Light (Warm Glass) |
|------|-------------------|---------------------|
| 배경 | 거의 검정 `oklch(0.145 0 0)` | 따뜻한 크림 `oklch(0.98 0.015 85)` |
| 메쉬 색상 | Blue/Cyan/Deep Blue | Amber/Gold/Warm Rose |
| 메쉬 투명도 | **65%** (선명하게) | **45-50%** (확실히 보이게) |
| 메쉬 채도 | 높은 채도 (chroma 0.15-0.25) | 높은 채도 (chroma 0.12-0.18) |
| 카드 배경 | 흰색 **8%** 투명 | 흰색 **55%** 투명 |
| 카드 보더 | 흰색 **15%** | 앰버 **15%** + 흰색 40% |
| 카드 blur | **16px** | **12px** |
| 카드 hover glow | Blue glow (**20% 강도**) | Amber/Gold glow (**18% 강도**) |
| 텍스트 | 밝은 회색 | 진한 회색 (기존 유지) |
| 그림자 | 검정 **30%** | 앰버 **18%** |

---

## 3. 디자인 토큰 확장

### 3.1 라이트 모드 Warm Accent 컬러

| 이름 | oklch | hex 근사 | 용도 |
|------|-------|----------|------|
| Warm Amber | `oklch(0.78 0.18 75)` | `#f59e0b` | 메쉬 주 색상, hover glow — **고채도** |
| Soft Gold | `oklch(0.85 0.14 85)` | `#fbbf24` | 메쉬 보조, 포커스 힌트 — **채도 증가** |
| Warm Rose | `oklch(0.72 0.14 25)` | `#fb923c` | 메쉬 악센트 — **채도 증가** |
| Cream | `oklch(0.96 0.03 85)` | `#fffbeb` | 배경 톤 — 미세 틴트 |
| Light Gold | `oklch(0.90 0.08 85)` | `#fef3c7` | hover 힌트, 강조 |

### 3.2 라이트 모드 Glassmorphism 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--glass-bg-light` | `oklch(1 0 0 / 55%)` | Glass 카드 배경 — **메쉬 비침 강화** |
| `--glass-bg-light-hover` | `oklch(1 0 0 / 70%)` | Glass 카드 hover |
| `--glass-border-light` | `oklch(0.78 0.12 75 / 25%)` | 앰버 틴트 보더 — **채도+투명도 증가** |
| `--glass-border-light-hover` | `oklch(0.78 0.12 75 / 45%)` | hover 보더 — **선명하게** |
| `--glass-blur-light` | `12px` | `backdrop-blur-md` — **blur 강화** |
| `--glass-shadow-light` | `0 4px 30px oklch(0.78 0.14 75 / 18%)` | 앰버 그림자 — **강화** |
| `--glass-glow-light` | `0 0 25px oklch(0.78 0.18 75 / 20%)` | hover 앰버 glow — **강화** |

### 3.3 라이트 모드 메쉬 그라데이션

```css
/* Light mode mesh gradient - Warm Sunlit (선명한 버전) */
body::before {
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%,
      oklch(0.85 0.14 85 / 50%) 0%, transparent 65%),    /* Soft Gold — 강한 존재감 */
    radial-gradient(ellipse 60% 80% at 80% 20%,
      oklch(0.78 0.18 75 / 45%) 0%, transparent 55%),    /* Warm Amber — 메인 포인트 */
    radial-gradient(ellipse 50% 50% at 60% 80%,
      oklch(0.72 0.14 25 / 30%) 0%, transparent 50%);    /* Warm Rose — 확실한 악센트 */
}
```

> **다크 모드 메쉬 그라데이션도 동시에 강화** (기존 blog-ui-design.md 업데이트 대상):

```css
/* Dark mode mesh gradient - Cool Glass (강화 버전) */
body::before {
  background:
    radial-gradient(ellipse 80% 50% at 30% 20%,
      oklch(0.25 0.15 262 / 65%) 0%, transparent 60%),   /* Deep Blue — 투명도 상향 */
    radial-gradient(ellipse 60% 60% at 70% 60%,
      oklch(0.30 0.18 230 / 55%) 0%, transparent 55%),   /* Mid Blue — 채도+투명도 증가 */
    radial-gradient(ellipse 50% 50% at 50% 90%,
      oklch(0.40 0.15 215 / 45%) 0%, transparent 50%);   /* Cyan Glow — 강화 */
}
```

---

## 4. 컴포넌트별 라이트 모드 Glass 적용

### 4.1 Header
```
기존: bg-background/80 backdrop-blur-md
변경: bg-[var(--glass-bg-light)] backdrop-blur-sm border-b border-[var(--glass-border-light)]
```

### 4.2 PostCard
```
기존: bg-card border-border (불투명)
변경: bg-[var(--glass-bg-light)] border-[var(--glass-border-light)] backdrop-blur-sm
hover: bg-[var(--glass-bg-light-hover)] border-[var(--glass-border-light-hover)]
       shadow-[var(--glass-glow-light)] -translate-y-0.5
```

### 4.3 Sidebar (CategoryFilter)
```
기존: 투명 배경
변경: bg-[var(--glass-bg-light)] rounded-xl p-4 border border-[var(--glass-border-light)]
      backdrop-blur-sm
```

### 4.4 로그인/회원가입 Card
```
기존: bg-card
변경: bg-[var(--glass-bg-light)] backdrop-blur-sm border-[var(--glass-border-light)]
```

### 4.5 CommentSection
```
기존: 배경 없음
변경: 댓글 영역에 subtle glass 배경 적용
```

---

## 5. 접근성 고려사항

### 5.1 대비율
- Glass 카드 위 텍스트: 최소 WCAG AA (4.5:1) 보장
- 배경 65% 불투명도로 메쉬 그라데이션 위에서도 가독성 유지
- 메쉬 그라데이션 투명도를 25-30%로 제한 (다크 모드 50% 대비 낮음)

### 5.2 prefers-reduced-motion
- Glass blur, 메쉬 그라데이션은 유지 (장식적 애니메이션이 아님)
- hover 트랜지션만 비활성화

### 5.3 고대비 모드 (prefers-contrast: more)
- Glass 효과 비활성화, 불투명 배경으로 fallback
- 보더 두께 증가

---

## 6. 구현 범위

### 6.1 CSS 변경
| 파일 | 변경 내용 |
|------|-----------|
| `globals.css` | `:root`에 warm glass 토큰 추가, body::before 라이트 메쉬 |

### 6.2 컴포넌트 변경
| 파일 | 변경 내용 |
|------|-----------|
| `Header.tsx` | 라이트 모드 glass 스타일 적용 |
| `PostCard.tsx` | glass card 기본 적용 (dark: 접두어 제거) |
| `CategoryFilter.tsx` | 사이드바 glass 배경 |
| `login/page.tsx` | glass card |
| `signup/page.tsx` | glass card |
| `CommentSection.tsx` | subtle glass 배경 |

### 6.3 변경하지 않는 것
- 다크 모드 스타일 (기존 유지)
- 타이포그래피 (변경 없음)
- 컴포넌트 구조/동작 (변경 없음)

---

## 7. 기존 문서 반영 계획

### 변경 대상: `blog-ui-design.md`
| 섹션 | 변경 내용 |
|------|-----------|
| 0.3 모드별 전략 | 라이트 모드 설명 "Warm Glass" 반영 |
| 0.5 원칙 3 | "Glassmorphism은 양쪽 모드에 적용, 톤만 다름"으로 수정 |
| 1.2 액센트 컬러 토큰 | Warm Accent 컬러 추가 |
| 1.2 Glassmorphism 토큰 | "다크 모드 전용" → 양쪽 모드 토큰으로 확장 |
| 1.2 다크 Glassmorphism 토큰 | glass-bg 5%→8%, border 10%→15%, blur 12→16px 강화 |
| 10. Dark Mode | "10. Theme별 Glass 효과"로 확장, 라이트 메쉬 추가 |
| 10. 다크 메쉬 | 투명도 50%→65%, 채도 증가 |

### 다크 모드 Glass 토큰 강화 (기존 대비 변경)

| 토큰 | 기존 | 강화 | 변경점 |
|------|------|------|--------|
| `--glass-bg` | `oklch(1 0 0 / 5%)` | `oklch(1 0 0 / 8%)` | 카드가 더 드러남 |
| `--glass-bg-hover` | `oklch(1 0 0 / 8%)` | `oklch(1 0 0 / 12%)` | hover 대비 증가 |
| `--glass-border` | `oklch(1 0 0 / 10%)` | `oklch(1 0 0 / 15%)` | 유리 단면 선명 |
| `--glass-border-hover` | `oklch(1 0 0 / 15%)` | `oklch(1 0 0 / 22%)` | hover 보더 강화 |
| `--glass-blur` | `12px` | `16px` | blur 효과 강화 |
| `--glass-shadow` | `oklch(0 0 0 / 20%)` | `oklch(0 0 0 / 30%)` | 입체감 증가 |
| 메쉬 투명도 | 50% | 65% | 색감 선명 |
| 메쉬 채도 | 0.08-0.12 | 0.15-0.18 | 컬러 강화 |
| hover glow | `15%` | `20%` | glow 눈에 띄게 |
