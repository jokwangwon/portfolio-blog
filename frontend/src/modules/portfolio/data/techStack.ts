export interface TechItem {
  name: string;
  category: string;
  proficiency?: number; // 0-100
}

export const techCategories = ["Backend", "Frontend", "DevOps", "AI/ML"] as const;

export const techStack: TechItem[] = [
  // Backend
  { name: "Spring Boot", category: "Backend", proficiency: 80 },
  { name: "JPA / Hibernate", category: "Backend", proficiency: 75 },
  { name: "PostgreSQL", category: "Backend", proficiency: 70 },
  { name: "Gradle", category: "Backend", proficiency: 65 },
  { name: "JUnit 5", category: "Backend", proficiency: 75 },

  // Frontend
  { name: "Next.js", category: "Frontend", proficiency: 80 },
  { name: "React", category: "Frontend", proficiency: 85 },
  { name: "TypeScript", category: "Frontend", proficiency: 80 },
  { name: "Tailwind CSS", category: "Frontend", proficiency: 85 },
  { name: "shadcn/ui", category: "Frontend", proficiency: 75 },
  { name: "Redux Toolkit", category: "Frontend", proficiency: 70 },

  // DevOps
  { name: "Docker", category: "DevOps", proficiency: 70 },
  { name: "GitHub Actions", category: "DevOps", proficiency: 65 },
  { name: "Nginx", category: "DevOps", proficiency: 60 },
  { name: "Git", category: "DevOps", proficiency: 85 },

  // AI/ML
  { name: "Python", category: "AI/ML", proficiency: 80 },
  { name: "PyTorch", category: "AI/ML", proficiency: 60 },
  { name: "LangChain", category: "AI/ML", proficiency: 65 },
  { name: "FastAPI", category: "AI/ML", proficiency: 75 },
];
