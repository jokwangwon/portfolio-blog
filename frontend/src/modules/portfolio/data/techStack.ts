export interface TechItem {
  name: string;
  category: string;
}

export const techCategories = ["Backend", "Frontend", "DevOps", "AI/ML"] as const;

export const techStack: TechItem[] = [
  // Backend
  { name: "Spring Boot", category: "Backend" },
  { name: "JPA / Hibernate", category: "Backend" },
  { name: "PostgreSQL", category: "Backend" },
  { name: "Gradle", category: "Backend" },
  { name: "JUnit 5", category: "Backend" },

  // Frontend
  { name: "Next.js", category: "Frontend" },
  { name: "React", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "shadcn/ui", category: "Frontend" },
  { name: "Redux Toolkit", category: "Frontend" },

  // DevOps
  { name: "Docker", category: "DevOps" },
  { name: "GitHub Actions", category: "DevOps" },
  { name: "Nginx", category: "DevOps" },
  { name: "Git", category: "DevOps" },

  // AI/ML
  { name: "Python", category: "AI/ML" },
  { name: "PyTorch", category: "AI/ML" },
  { name: "LangChain", category: "AI/ML" },
  { name: "FastAPI", category: "AI/ML" },
];
