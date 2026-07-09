"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { Project } from "../data/projects";
import { useMouseGlow } from "@/src/shared/animations/useMouseGlow";

export default function ProjectCard({ project }: { project: Project }) {
  const glowRef = useMouseGlow<HTMLDivElement>();

  return (
    <div
      ref={glowRef}
      className="glass-card glass-card-glow rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
    >
      {/* Thumbnail area with hover overlay */}
      <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
        <span className="text-2xl font-bold text-muted-foreground">
          {project.title.charAt(0)}
        </span>

        {/* Highlights overlay on hover */}
        {project.highlights && project.highlights.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <ul className="text-white text-xs space-y-1">
              {project.highlights.map((h) => (
                <li key={h} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/70 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="p-6 relative z-10">
        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              GitHub <ExternalLink className="size-3 ml-1" />
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "sm" })}
            >
              Live <ExternalLink className="size-3 ml-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
