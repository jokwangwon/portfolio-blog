"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { techStack, techCategories } from "../data/techStack";
import { MotionSection } from "@/src/shared/animations/MotionSection";
import { staggerContainer, scaleIn } from "@/src/shared/animations/variants";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";
import ProficiencyBar from "./ProficiencyBar";

export default function TechStackSection() {
  const [activeCategory, setActiveCategory] = useState<string>("Backend");
  const reduced = useReducedMotion();

  const filtered = techStack.filter((t) => t.category === activeCategory);

  return (
    <MotionSection id="tech-stack" className="py-24 md:py-32 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight mb-12">Tech Stack</h2>

        <div className="flex flex-wrap gap-2 mb-8">
          {techCategories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          key={activeCategory}
          variants={staggerContainer}
          initial={reduced ? "visible" : "hidden"}
          animate="visible"
        >
          {filtered.map((tech) => (
            <motion.div
              key={tech.name}
              variants={scaleIn}
              className="glass-card rounded-lg p-4 transition-all duration-200 hover:-translate-y-1"
            >
              <span className="text-sm font-medium text-foreground block mb-2 text-center">
                {tech.name}
              </span>
              {tech.proficiency != null && (
                <ProficiencyBar value={tech.proficiency} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </MotionSection>
  );
}
