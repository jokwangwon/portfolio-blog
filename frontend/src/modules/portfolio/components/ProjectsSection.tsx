"use client";

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { projects } from "../data/projects";
import ProjectCard from "./ProjectCard";
import { MotionSection } from "@/src/shared/animations/MotionSection";

export default function ProjectsSection() {
  return (
    <MotionSection id="projects" className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-border pt-8 mb-8">
          <p className="text-xs font-medium tracking-widest text-primary mb-3">SELECTED WORK</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">서비스로 연결한 경험, 만들어 가는 세계</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            실무에서 담당한 AI 백엔드와, 생성·검증을 반복하는 개인 프로젝트입니다.
          </p>
        </div>
        <div className="space-y-8">
          {projects.filter((project) => project.featured).map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      </div>
    </MotionSection>
  );
}

export function PersonalProjectsSection() {
  return (
    <MotionSection id="personal-projects" className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-3">계속 만들고 개선하는 도구</h2>
        <p className="text-sm text-muted-foreground mb-6">직접 운영하는 웹 서비스와 AI 활용 개발, Oracle 학습·분석 기록입니다.</p>
        <div className="grid md:grid-cols-3 gap-x-8">
          {projects.filter((project) => !project.featured).map((project) => (
            <article key={project.id} className="border-t border-border py-6 flex flex-col">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <Badge variant="outline">{project.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{project.description}</p>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-3 mb-4">
                {project.steps.map((step) => <li key={step.label}>{step.text}</li>)}
              </ul>
              <p className="text-xs text-muted-foreground mb-3">{project.tags.join(" · ")}</p>
              {project.github && (
                <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`${project.title} GitHub (새 탭)`} className={buttonVariants({ variant: "ghost", className: "min-h-11 px-3 mt-auto self-start" })}>
                  GitHub <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
