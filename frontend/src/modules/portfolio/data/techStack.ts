export const techCategories = ["Backend", "AI Integration", "Infra / Ops", "Research"] as const;

export interface TechItem {
  name: string;
  category: (typeof techCategories)[number];
  usage: string;
}

export const techStack: TechItem[] = [
  { name: "Python · FastAPI", category: "Backend", usage: "실무 · 데이터 집계와 서비스 API" },
  { name: "PostgreSQL", category: "Backend", usage: "실무 · 서비스 데이터 저장·조회" },
  { name: "Redis · OpenSearch", category: "Backend", usage: "실무 · AI 서비스 백엔드에서 사용" },
  { name: "Spring Boot", category: "Backend", usage: "개인 · 블로그·인증 API" },
  { name: "LLM", category: "AI Integration", usage: "실무 · 주간 리포트 입력 구조와 연동" },
  { name: "Embedding · DBSCAN", category: "AI Integration", usage: "실무 · 유사 민원 군집화" },
  { name: "Docker", category: "Infra / Ops", usage: "개인 · 홈서버 서비스 실행" },
  { name: "On-Premise", category: "Infra / Ops", usage: "실무 · 서비스 운영과 장애 대응" },
  { name: "CNN · dlib", category: "Research", usage: "논문 · 개인 식별과 행동 유형 분류" },
  { name: "Computer Vision", category: "Research", usage: "논문 · Behavior Recognition" },
];
