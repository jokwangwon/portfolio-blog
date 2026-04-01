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
| 배경 | 거의 검정 `oklch(0.145 0 0)` | 따뜻한 크림 `oklch(0.985 0.01 85)` |
| 메쉬 색상 | Blue/Cyan/Deep Blue | Amber/Gold/Warm Rose |
| 메쉬 투명도 | 50% | 25-30% (더 은은하게) |
| 카드 배경 | 흰색 5% 투명 | 흰색 60-70% 투명 |
| 카드 보더 | 흰색 10% | 앰버 8% + 흰색 50% |
| 카드 blur | 12px | 8-10px (과하지 않게) |
| 카드 hover glow | Blue glow | Amber/Gold glow |
| 텍스트 | 밝은 회색 | 진한 회색 (기존 유지) |
| 그림자 | 검정 20% | 앰버 10% |

---

## 3. 디자인 토큰 확장

### 3.1 라이트 모드 Warm Accent 컬러

| 이름 | oklch | hex 근사 | 용도 |
|------|-------|----------|------|
| Warm Amber | `oklch(0.80 0.12 75)` | `#f59e0b` | 메쉬 주 색상, hover glow |
| Soft Gold | `oklch(0.88 0.08 85)` | `#fbbf24` | 메쉬 보조, 포커스 힌트 |
| Warm Rose | `oklch(0.75 0.08 25)` | `#fb923c` | 메쉬 악센트 (미세) |
| Cream | `oklch(0.96 0.02 85)` | `#fffbeb` | 배경 톤 |
| Light Gold | `oklch(0.92 0.04 85)` | `#fef3c7` | hover 힌트, 미세 강조 |

### 3.2 라이트 모드 Glassmorphism 토큰

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--glass-bg-light` | `oklch(1 0 0 / 65%)` | Glass 카드 배경 (흰색 65%) |
| `--glass-bg-light-hover` | `oklch(1 0 0 / 80%)` | Glass 카드 hover |
| `--glass-border-light` | `oklch(0.80 0.06 75 / 20%)` | 앰버 틴트 보더 |
| `--glass-border-light-hover` | `oklch(0.80 0.06 75 / 35%)` | hover 보더 강화 |
| `--glass-blur-light` | `8px` | `backdrop-blur-sm` |
| `--glass-shadow-light` | `0 4px 24px oklch(0.80 0.08 75 / 10%)` | 따뜻한 앰버 그림자 |
| `--glass-glow-light` | `0 0 20px oklch(0.80 0.12 75 / 12%)` | hover 시 앰버 glow |

### 3.3 라이트 모드 메쉬 그라데이션

```css
/* Light mode mesh gradient - Warm Sunlit */
body::before {
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%,
      oklch(0.92 0.06 85 / 30%) 0%, transparent 70%),    /* Soft Gold */
    radial-gradient(ellipse 60% 80% at 80% 20%,
      oklch(0.88 0.08 75 / 25%) 0%, transparent 60%),    /* Warm Amber */
    radial-gradient(ellipse 50% 50% at 60% 80%,
      oklch(0.85 0.05 25 / 15%) 0%, transparent 50%);    /* Warm Rose hint */
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
| 1.2 Glassmorphism 토큰 | "다크 모드 전용" → 라이트 토큰 추가 |
| 10. Dark Mode | "10. Theme별 Glass 효과"로 확장, 라이트 메쉬 추가 |
