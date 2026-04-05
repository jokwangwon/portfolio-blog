"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, fadeInUp } from "@/src/shared/animations/variants";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";

export default function HeroSection() {
  const reduced = useReducedMotion();

  function scrollToAbout() {
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative">
      <motion.div
        className="max-w-3xl mx-auto"
        variants={staggerContainer}
        initial={reduced ? "visible" : "hidden"}
        animate="visible"
      >
        <motion.p
          variants={fadeInUp}
          className="text-lg md:text-xl text-muted-foreground mb-4"
        >
          안녕하세요,
        </motion.p>
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
        >
          <span className="animate-gradient-text">조광원</span>
          <span className="text-foreground">입니다.</span>
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="text-xl md:text-2xl text-muted-foreground mb-10"
        >
          AI &amp; Full-Stack Developer
        </motion.p>
        <motion.div variants={fadeIn} className="flex gap-4 justify-center">
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
        </motion.div>
      </motion.div>

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
