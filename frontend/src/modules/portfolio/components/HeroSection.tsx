"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, fadeInUp } from "@/src/shared/animations/variants";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";

export default function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section className="pt-32 pb-12">
      <motion.div
        className="max-w-5xl mx-auto px-6"
        variants={staggerContainer}
        initial={reduced ? "visible" : "hidden"}
        animate="visible"
      >
        <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
          조광원
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-xl sm:text-2xl md:text-3xl leading-relaxed text-balance max-w-2xl mb-4">
          데이터베이스를 공부하며,<br className="hidden sm:block" /> 웹과 도구를 만듭니다.
        </motion.p>
        <motion.p variants={fadeInUp} className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mb-8">
          AI 서비스 백엔드 개발 경험과 데이터베이스 학습, 개인 프로젝트의 구현·배포 과정을 기록합니다.
        </motion.p>
        <motion.div variants={fadeIn} className="flex flex-wrap gap-3">
          <a href="#projects" className={buttonVariants({ className: "min-h-11 px-4" })}>
            프로젝트 보기 <ArrowDown className="size-4" aria-hidden="true" />
          </a>
          <Link href="/blog" className={buttonVariants({ variant: "outline", className: "min-h-11 px-4" })}>
            기록 보기 <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </motion.div>
        <nav aria-label="포트폴리오 목차" className="mt-8 flex flex-wrap gap-5 text-sm text-muted-foreground">
          <a href="#projects" className="py-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">프로젝트</a>
          <a href="#experience" className="py-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">경력</a>
          <a href="#about" className="py-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">소개</a>
        </nav>
      </motion.div>
    </section>
  );
}
