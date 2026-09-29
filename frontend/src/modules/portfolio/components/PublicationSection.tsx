"use client";

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MotionSection } from "@/src/shared/animations/MotionSection";

export default function PublicationSection() {
  return (
    <MotionSection id="publication" className="py-12 md:py-16 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs font-medium tracking-widest text-primary mb-3">RESEARCH / PUBLICATION</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">논문</h2>
        <article className="border-l-2 border-primary pl-5 sm:pl-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">KCI 등재 학술지</Badge>
            <Badge variant="outline">제1저자</Badge>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold leading-relaxed max-w-3xl mb-4">
            행동 레이블링 데이터셋을 활용한 CNN 및 dlib 기반 어린이 행동 유형 분류 시스템
          </h3>
          <p className="text-sm leading-relaxed mb-2">조광원 · 김동현 · 박승민</p>
          <p className="text-sm text-muted-foreground mb-4">한국전자통신학회 논문지 · 2025 · 20권 3호 · 651–656쪽</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mb-4">
            행동 레이블링 데이터셋을 바탕으로, CNN과 dlib을 활용한 개인 식별과
            어린이 행동 유형 분류를 함께 다룬 연구입니다.
          </p>
          <p className="text-xs text-muted-foreground mb-6">CNN · dlib · Computer Vision · Behavior Recognition</p>
          <div className="flex flex-wrap gap-3">
            <a href="https://doi.org/10.13067/JKIECS.2025.20.3.651" target="_blank" rel="noopener noreferrer" aria-label="논문 DOI (새 탭)" className={buttonVariants({ variant: "outline", className: "min-h-11" })}>
              DOI <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
            <a href="https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003221222" target="_blank" rel="noopener noreferrer" aria-label="KCI 공식 논문 정보 (새 탭)" className={buttonVariants({ variant: "ghost", className: "min-h-11" })}>
              KCI 공식 논문 정보 <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </article>
      </div>
    </MotionSection>
  );
}
