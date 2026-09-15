"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRight, FolderGit2 } from "lucide-react";
import type { Project } from "../data/projects";
import { useMouseGlow } from "@/src/shared/animations/useMouseGlow";

export default function ProjectCard({ project }: { project: Project }) {
  const glowRef = useMouseGlow<HTMLDivElement>();

  return (
    <div ref={glowRef} className="glass-card glass-card-glow rounded-2xl h-full p-6 md:p-7 flex flex-col transition-all duration-200 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-ring">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <FolderGit2 className="size-5" aria-hidden="true" />
        </div>
        <Badge variant="outline">{project.status}</Badge>
      </div>
      <h3 className="text-xl font-semibold tracking-tight mb-3">{project.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{project.description}</p>
      {project.highlights && project.highlights.length > 0 && (
        <ul className="text-sm space-y-2 border-t border-border pt-4 mb-6">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-2" aria-hidden="true" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto relative z-10">
        <div className="flex flex-wrap gap-2 mb-5">
          {project.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} 소스 코드 (새 탭)`} className={buttonVariants({ variant: "outline", className: "min-h-11 px-4" })}>
              소스 코드 <ArrowUpRight className="size-4 ml-1" aria-hidden="true" />
            </a>
          )}
          {project.live && (
            <a href={project.live} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} 사이트 보기 (새 탭)`} className={buttonVariants({ className: "min-h-11 px-4" })}>
              사이트 보기 <ArrowUpRight className="size-4 ml-1" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
