"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Portfolio Platform
      </h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
        개발 블로그, AI 벤치마크, 프로젝트 쇼케이스를 위한 통합 플랫폼
      </p>
      <Link href="/blog" className={buttonVariants({ size: "lg" })}>
        블로그 보기
      </Link>
    </div>
  );
}
