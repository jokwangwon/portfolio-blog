"use client";

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { projects } from "../data/projects";
import ProjectCard from "./ProjectCard";
import { MotionSection } from "@/src/shared/animations/MotionSection";

export default function ProjectsSection() {
  const featured = projects.filter((project) => project.featured);
  const others = projects.filter((project) => !project.featured);

  return (
    <MotionSection id="projects" className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-border pt-8 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">대표 프로젝트</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            공개 운영 중인 웹 서비스와 Oracle 학습을 위한 게임입니다.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {featured.map((project) => <ProjectCard key={project.title} project={project} />)}
        </div>

        <div className="mt-14">
          <h3 className="text-xl font-semibold tracking-tight mb-6">다른 프로젝트</h3>
          <div className="grid md:grid-cols-2 gap-x-8">
            {others.map((project) => (
              <article key={project.title} className="border-t border-border py-6 flex flex-col">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h4 className="text-lg font-semibold">{project.title}</h4>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{project.description}</p>
                <p className="text-xs text-muted-foreground mb-3">{project.tags.join(" · ")}</p>
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${project.title} 소스 코드 (새 탭)`}
                    className={buttonVariants({ variant: "ghost", className: "min-h-11 px-3 mt-auto self-start" })}
                  >
                    소스 코드 <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
