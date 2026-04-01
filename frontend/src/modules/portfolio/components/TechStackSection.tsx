"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { techStack, techCategories } from "../data/techStack";

export default function TechStackSection() {
  const [activeCategory, setActiveCategory] = useState<string>("Backend");

  const filtered = techStack.filter((t) => t.category === activeCategory);

  return (
    <section id="tech-stack" className="py-24 md:py-32 bg-muted/30 dark:bg-muted/10">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((tech) => (
            <div
              key={tech.name}
              className="glass-card rounded-lg p-4 text-center transition-all duration-200 hover:-translate-y-1"
            >
              <span className="text-sm font-medium text-foreground">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
