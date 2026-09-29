"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "../data/projects";
import { useMouseGlow } from "@/src/shared/animations/useMouseGlow";

export default function ProjectCard({ project }: { project: Project }) {
  const glowRef = useMouseGlow<HTMLDivElement>();

  return (
    <article id={project.id} aria-labelledby={`${project.id}-title`} className="scroll-mt-24">
      <div ref={glowRef} className="glass-card glass-card-glow rounded-2xl p-6 md:p-8 focus-within:ring-2 focus-within:ring-ring">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 id={`${project.id}-title`} className="text-2xl font-semibold tracking-tight">{project.title}</h3>
            <Badge variant="outline">{project.status}</Badge>
          </div>
          <p className="text-sm font-medium text-primary mb-4">{project.subtitle}</p>
          <p className="text-base leading-relaxed max-w-3xl mb-6">{project.description}</p>
          <dl className="grid md:grid-cols-2 gap-6 border-t border-border pt-6">
            {project.steps.map((step) => (
              <div key={step.label}>
                <dt className="text-sm font-semibold mb-2">{step.label}</dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">{step.text}</dd>
              </div>
            ))}
          </dl>
          {project.stages && (
            <dl className="mt-6 grid md:grid-cols-3 gap-5 rounded-xl bg-muted/40 p-5">
              {project.stages.map((stage) => (
                <div key={stage.label}>
                  <dt className="text-sm font-semibold mb-2">{stage.label}</dt>
                  <dd className="text-sm text-muted-foreground leading-relaxed">{stage.text}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed mt-6">
            <span className="font-medium text-foreground">사용 기술</span> · {project.tags.join(" · ")}
          </p>
          {project.note && <p className="text-xs text-muted-foreground leading-relaxed mt-4">{project.note}</p>}
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} GitHub (새 탭)`} className={buttonVariants({ variant: "outline", className: "min-h-11 px-4 mt-6" })}>
              GitHub에서 코드 보기 <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
