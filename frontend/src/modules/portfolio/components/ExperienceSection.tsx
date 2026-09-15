"use client";

import { motion } from "framer-motion";
import { career, experience, type ExperienceItem } from "../data/experience";
import { MotionSection } from "@/src/shared/animations/MotionSection";
import { staggerContainer, fadeInUp } from "@/src/shared/animations/variants";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";

function Timeline({ items }: { items: ExperienceItem[] }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className="relative border-l-2 border-border ml-2 sm:ml-4 space-y-10"
      variants={staggerContainer} initial={reduced ? "visible" : "hidden"} animate="visible">
      {items.map(item => (
        <motion.article key={item.year + item.title} variants={fadeInUp} className="relative pl-5 sm:pl-8 min-w-0">
          <div aria-hidden="true" className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary" />
          <p className="text-sm text-muted-foreground">{item.year}</p>
          <h4 className="text-lg font-semibold mt-1">{item.organization ? `${item.organization} · ` : ""}{item.title}</h4>
          <p className="text-sm leading-relaxed text-muted-foreground mt-2">{item.description}</p>
        </motion.article>
      ))}
    </motion.div>
  );
}

export default function ExperienceSection() {
  return (
    <MotionSection id="experience" className="py-24 md:py-32 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-5xl mx-auto px-6 [overflow-wrap:anywhere]">
        <h2 className="text-3xl font-bold tracking-tight mb-10">경력과 학습 기록</h2>
        <div className="space-y-12">
          <section aria-labelledby="career-heading">
            <h3 id="career-heading" className="text-xl font-semibold mb-6">업무 경험</h3>
            <Timeline items={career} />
          </section>
          <section aria-labelledby="learning-heading">
            <h3 id="learning-heading" className="text-xl font-semibold mb-6">학습과 개인 프로젝트</h3>
            <Timeline items={experience} />
          </section>
        </div>
      </div>
    </MotionSection>
  );
}
