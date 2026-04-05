"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";

interface ProficiencyBarProps {
  value: number; // 0-100
}

export default function ProficiencyBar({ value }: ProficiencyBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[var(--warm-amber)] to-[var(--warm-gold)] dark:from-[var(--accent-blue)] dark:to-[var(--accent-cyan)]"
        initial={{ width: 0 }}
        animate={isInView || reduced ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: reduced ? 0 : 0.8, ease: "easeOut", delay: 0.2 }}
      />
    </div>
  );
}
