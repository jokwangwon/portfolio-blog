"use client";

import { motion } from "framer-motion";
import { experience } from "../data/experience";
import { MotionSection } from "@/src/shared/animations/MotionSection";
import { staggerContainer, fadeInUp } from "@/src/shared/animations/variants";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";

export default function ExperienceSection() {
  const reduced = useReducedMotion();

  return (
    <MotionSection
      id="experience"
      className="py-24 md:py-32 bg-muted/30 dark:bg-muted/10"
    >
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight mb-12">Experience</h2>
        <motion.div
          className="relative border-l-2 border-border ml-4 space-y-8"
          variants={staggerContainer}
          initial={reduced ? "visible" : "hidden"}
          animate="visible"
        >
          {experience.map((item) => (
            <motion.div
              key={item.year + item.title}
              variants={fadeInUp}
              className="relative pl-8"
            >
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {item.year}
              </span>
              <h3 className="text-lg font-semibold mt-1">{item.title}</h3>
              {item.organization && (
                <p className="text-sm text-muted-foreground">
                  {item.organization}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </MotionSection>
  );
}
