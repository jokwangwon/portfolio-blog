export interface Project {
  title: string;
  featured?: boolean;
  status: string;
  description: string;
  tags: string[];
  github?: string;
  live?: string;
  screenshot?: string;
  highlights?: string[];
}

export const projects: Project[] = [
  {
    "title": "Portfolio & Blog",
    "featured": true,
    "status": "공개 운영",
    "description": "Next.js와 Spring Boot로 구성한 개인 포트폴리오와 블로그입니다. 관리자 글 관리와 방문자 조회를 구분하고, Docker와 Cloudflare Tunnel로 홈서버에서 공개합니다.",
    "tags": [
      "Spring Boot",
      "Next.js",
      "PostgreSQL",
      "Docker"
    ],
    "github": "https://github.com/jokwangwon/portfolio-blog",
    "highlights": [
      "인증·초안·게시글 관리",
      "백엔드·프런트엔드 테스트",
      "DB 백업·복원 검증",
      "HTTPS 공개",
      "작업실에서 현재 작업 세션 시각화"
    ],
    "live": "https://gwangwon.dev"
  },
  {
    "title": "Oracle 학습 게임",
    "featured": true,
    "status": "개발 중",
    "description": "Oracle DBA 용어를 복습하는 웹 게임입니다. 빈칸 타이핑·용어 맞추기·객관식 모드와 LLM 문제 생성 코드를 구현했으며, 추가 모드는 설계 단계입니다.",
    "tags": [
      "NestJS",
      "Next.js",
      "TypeScript",
      "LangChain"
    ],
    "github": "https://github.com/jokwangwon/oracle_bootcamp_study_game",
    "highlights": [
      "학습 모드 3종",
      "문제 생성 결과의 형식·범위 검사",
      "학습 콘텐츠와 테스트 코드"
    ]
  },
  {
    "title": "Oracle Alert Log 분석",
    "status": "학습 프로젝트",
    "description": "Oracle alert log를 시간 단위로 나누고 이벤트 사전으로 분류하는 Python 스터디 프로젝트입니다. 로그의 ORA 코드와 미분류 항목을 확인하는 데 초점을 맞춥니다.",
    "tags": [
      "Python",
      "Oracle",
      "YAML"
    ],
    "github": "https://github.com/jokwangwon/Alert-log-project",
    "highlights": [
      "타임스탬프 단위 파싱",
      "정규식 기반 이벤트 분류",
      "학습용 로그와 설계 노트"
    ]
  },
  {
    "title": "학습자료 → 발표자료",
    "status": "개발 도구",
    "description": "Oracle 학습용 HTML 문서에서 슬라이드 정보를 추출해 PPTX를 생성하는 도구입니다. 문서 검증과 슬라이드 미리보기 과정을 스크립트로 연결했습니다.",
    "tags": [
      "Python",
      "JavaScript",
      "PptxGenJS"
    ],
    "github": "https://github.com/jokwangwon/ora-ppt-gen",
    "highlights": [
      "HTML → 슬라이드 JSON → PPTX",
      "문서 동기화·검증",
      "슬라이드 미리보기"
    ]
  },
  {
    "title": "혼천",
    "status": "개발 중",
    "description": "무협 RPG의 규칙과 세계를 구현하는 프로젝트입니다. Java 규칙 엔진과 마인크래프트 Paper 서버 구현을 중심으로 게임 시스템과 맵 제작을 진행하고 있습니다.",
    "tags": [
      "Java",
      "Paper",
      "Python"
    ],
    "github": "https://github.com/jokwangwon/honcheon-server",
    "highlights": [
      "게임 규칙 엔진",
      "설정 파일과 수치 설계",
      "맵 제작·검증 도구"
    ]
  },
  {
    "title": "AI 개발 도구",
    "status": "실험 프로젝트",
    "description": "AI 도구를 활용한 개발 과정을 정리하는 프로젝트입니다. 설계 문서, 작업 지침, 검사 스크립트와 Python 실행 도구를 함께 관리하며 적용 방법을 실험하고 있습니다.",
    "tags": [
      "Python",
      "GitHub Actions",
      "Docker"
    ],
    "github": "https://github.com/jokwangwon/AI_development_tool",
    "highlights": [
      "요구사항·설계 기록",
      "Git hooks와 검사 스크립트",
      "개발 작업 흐름 실험"
    ]
  }
];
