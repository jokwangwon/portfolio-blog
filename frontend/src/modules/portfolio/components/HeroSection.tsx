"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function HeroSection() {
  function scrollToAbout() {
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
      <div className="max-w-3xl mx-auto">
        <p className="text-lg md:text-xl text-muted-foreground mb-4">
          안녕하세요,
        </p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
          조광원입니다.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10">
          AI &amp; Full-Stack Developer
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/blog"
            className={buttonVariants({ size: "lg" })}
          >
            블로그 보기
          </Link>
          <button
            onClick={() =>
              document
                .querySelector("#projects")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            프로젝트 보기
          </button>
        </div>
      </div>

      <button
        onClick={scrollToAbout}
        className="absolute bottom-10 animate-bounce text-muted-foreground hover:text-foreground transition-colors"
        aria-label="아래로 스크롤"
      >
        <ChevronDown className="size-8" />
      </button>
    </section>
  );
}
