export interface Project {
  title: string;
  description: string;
  tags: string[];
  github?: string;
  live?: string;
}

export const projects: Project[] = [
  {
    title: "Portfolio Platform",
    description:
      "SDD + 하네스 엔지니어링으로 구축한 기술 포트폴리오 플랫폼. 블로그, 프로젝트 쇼케이스, 독립 서비스 통합.",
    tags: ["Spring Boot", "Next.js", "PostgreSQL", "Docker"],
    github: "https://github.com/jokwangwon",
  },
  {
    title: "AI Benchmark",
    description:
      "GPU 벤치마크 결과를 수집, 비교, 시각화하는 도구. TimescaleDB 기반 시계열 데이터 분석.",
    tags: ["FastAPI", "Python", "TimescaleDB", "React"],
    github: "https://github.com/jokwangwon",
  },
];
