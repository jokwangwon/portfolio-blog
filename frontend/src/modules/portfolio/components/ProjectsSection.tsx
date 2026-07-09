"use client";

import { motion } from "framer-motion";
import { projects } from "../data/projects";
import ProjectCard from "./ProjectCard";
import { MotionSection } from "@/src/shared/animations/MotionSection";
import { staggerContainer, fadeInUp } from "@/src/shared/animations/variants";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";

export default function ProjectsSection() {
  const reduced = useReducedMotion();

  return (
    <MotionSection id="projects" className="py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight mb-12">Projects</h2>
        <motion.div
          className="grid md:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial={reduced ? "visible" : "hidden"}
          animate="visible"
        >
          {projects.map((project) => (
            <motion.div key={project.title} variants={fadeInUp}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </MotionSection>
  );
}
