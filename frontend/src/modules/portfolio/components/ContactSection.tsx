"use client";

import { Button } from "@/components/ui/button";
import { FolderGit2 } from "lucide-react";
import { MotionSection } from "@/src/shared/animations/MotionSection";

const links = [
  { icon: FolderGit2, label: "GitHub", href: "https://github.com/jokwangwon" },
];

export default function ContactSection() {
  return (
    <MotionSection
      id="contact"
      className="py-24 md:py-32 bg-muted/30 dark:bg-muted/10"
    >
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Contact
        </h2>
        <p className="text-muted-foreground mb-10">
          프로젝트 코드와 작업 기록은 GitHub에서 확인할 수 있습니다.
        </p>
        <div className="flex gap-4 justify-center">
          {links.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
            >
              <Button variant="ghost" size="lg" className="flex flex-col gap-1 h-auto py-3">
                <Icon className="size-5" />
                <span className="text-xs">{label}</span>
              </Button>
            </a>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
