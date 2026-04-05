"use client";

import { motion, useInView, type Variants, type UseInViewOptions } from "framer-motion";
import { useRef } from "react";
import { fadeInUp } from "./variants";
import { useReducedMotion } from "./useReducedMotion";

interface MotionSectionProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  id?: string;
  once?: boolean;
  viewportMargin?: UseInViewOptions["margin"];
}

export function MotionSection({
  children,
  variants = fadeInUp,
  className,
  id,
  once = true,
  viewportMargin = "-100px",
}: MotionSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once, margin: viewportMargin });
  const reduced = useReducedMotion();

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={reduced ? "visible" : "hidden"}
      animate={isInView || reduced ? "visible" : "hidden"}
      variants={variants}
    >
      {children}
    </motion.section>
  );
}
