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
        <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3">
          조광원
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-base sm:text-xl font-medium text-primary mb-6">
          AI Backend / Backend Developer
        </motion.p>
        <motion.p variants={fadeInUp} className="text-xl sm:text-2xl md:text-3xl leading-relaxed text-balance max-w-2xl mb-4">
          AI 분석 결과를<br className="hidden sm:block" /> 실제 서비스 기능으로 연결합니다.
        </motion.p>
        <motion.p variants={fadeInUp} className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mb-8">
          Python·FastAPI 기반 백엔드에서 데이터 집계, 권한 처리, LLM 연동과
          온프레미스 운영을 경험했습니다.
        </motion.p>
        <motion.ul variants={fadeIn} className="flex flex-wrap gap-x-6 gap-y-3 text-sm mb-8" aria-label="핵심 경험">
          <li><a href="#experience" className="underline underline-offset-4 decoration-border hover:decoration-primary">1년 6개월 실무 경험</a></li>
          <li><a href="#publication" className="underline underline-offset-4 decoration-border hover:decoration-primary">KCI 제1저자 논문</a></li>
          <li><a href="#minwone" className="underline underline-offset-4 decoration-border hover:decoration-primary">On-Premise / Backend Integration</a></li>
        </motion.ul>
        <motion.div variants={fadeIn} className="flex flex-wrap gap-3">
          <a href="#projects" className={buttonVariants({ className: "min-h-11 px-4" })}>
            대표 작업 보기 <ArrowDown className="size-4" aria-hidden="true" />
          </a>
          <Link href="/blog" className={buttonVariants({ variant: "outline", className: "min-h-11 px-4" })}>
            기록 보기 <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </motion.div>
        <nav aria-label="포트폴리오 목차" className="mt-8 flex flex-wrap gap-5 text-sm text-muted-foreground">
          <a href="#projects" className="py-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">Selected Work</a>
          <a href="#publication" className="py-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">논문</a>
          <a href="#experience" className="py-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">경력</a>
          <a href="#about" className="py-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">소개</a>
        </nav>
      </motion.div>
    </section>
  );
}
