export interface TechItem {
  name: string;
  category: string;
  usage: string;
}

export const techCategories = ["Backend", "Frontend", "Infra", "AI 연동 · 도구"] as const;

export const techStack: TechItem[] = [
  {
    "name": "Spring Boot",
    "category": "Backend",
    "usage": "블로그·인증 API"
  },
  {
    "name": "JPA / Hibernate",
    "category": "Backend",
    "usage": "게시글·사용자 데이터 접근"
  },
  {
    "name": "PostgreSQL",
    "category": "Backend",
    "usage": "웹 서비스 데이터 저장"
  },
  {
    "name": "NestJS",
    "category": "Backend",
    "usage": "Oracle 학습 게임 API"
  },
  {
    "name": "Next.js / React",
    "category": "Frontend",
    "usage": "포트폴리오·학습 게임 화면"
  },
  {
    "name": "TypeScript",
    "category": "Frontend",
    "usage": "화면과 API 응답 타입"
  },
  {
    "name": "Tailwind CSS",
    "category": "Frontend",
    "usage": "페이지 스타일과 반응형 화면"
  },
  {
    "name": "Redux Toolkit",
    "category": "Frontend",
    "usage": "블로그 로그인 상태 관리"
  },
  {
    "name": "Docker",
    "category": "Infra",
    "usage": "홈서버 서비스 실행"
  },
  {
    "name": "GitHub Actions",
    "category": "Infra",
    "usage": "테스트·검사 워크플로"
  },
  {
    "name": "Nginx",
    "category": "Infra",
    "usage": "웹 화면과 API 요청 연결"
  },
  {
    "name": "Cloudflare Tunnel",
    "category": "Infra",
    "usage": "개인 도메인 HTTPS 연결"
  },
  {
    "name": "Python",
    "category": "AI 연동 · 도구",
    "usage": "로그 분석·자료 변환"
  },
  {
    "name": "FastAPI",
    "category": "AI 연동 · 도구",
    "usage": "글쓰기 보조 API"
  },
  {
    "name": "LangChain",
    "category": "AI 연동 · 도구",
    "usage": "LLM 호출·문제 생성 연동"
  },
  {
    "name": "Oracle",
    "category": "AI 연동 · 도구",
    "usage": "SQL·로그 분석 학습"
  }
];
