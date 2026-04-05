"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { MotionSection } from "@/src/shared/animations/MotionSection";

export default function BlogPreviewSection() {
  return (
    <MotionSection id="blog" className="py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Blog</h2>
          <Link
            href="/blog"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            전체 보기 <ArrowRight className="size-4 ml-1" />
          </Link>
        </div>

        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-4">아직 작성된 글이 없습니다.</p>
          <p className="text-sm">
            곧 개발 일기, 기술 정리, 프로젝트 회고가 올라올 예정입니다.
          </p>
        </div>
      </div>
    </MotionSection>
  );
}
