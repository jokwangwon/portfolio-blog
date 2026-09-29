export interface Project {
  id: string;
  title: string;
  subtitle: string;
  featured?: boolean;
  status: string;
  description: string;
  tags: string[];
  github?: string;
  steps: { label: string; text: string }[];
  stages?: { label: string; text: string }[];
  note?: string;
}

// Sources and scope: docs/content/portfolio-positioning-2026-09-29.md.
// Company work is based on the owner's account; no private code is distributed.
export const projects: Project[] = [
  {
    id: "minwone",
    title: "민원e",
    subtitle: "공공 AI 민원 분석 서비스",
    featured: true,
    status: "실무 경험",
    description: "유사 민원을 이슈 단위로 묶고, 분석 결과를 권한별 조회와 주간 리포트·챗봇 기능으로 연결하는 백엔드 작업을 담당했습니다.",
    tags: ["Python / FastAPI", "PostgreSQL", "OpenSearch", "Redis", "Embedding / LLM"],
    steps: [
      { label: "문제", text: "반복되는 유사 민원을 묶어 기간별로 살펴보고, 사용자 권한에 맞는 데이터로 분석 결과를 제공해야 했습니다." },
      { label: "맡은 부분", text: "유사 민원 자동 군집화, 권한 Scope 기반 데이터 접근 제어, 주간 리포트 집계와 LLM 입력 구조, 챗봇 세션·메시지 API, 민원 필터링 preset을 구현했습니다." },
      { label: "기술 선택", text: "주제별로 사전 그룹화한 뒤 1024차원 임베딩을 DBSCAN으로 군집화했습니다. 대표 문서를 선정하고 Noise를 별도로 처리해 군집 결과를 집계에 연결했습니다." },
      { label: "결과와 운영", text: "일·주·월·연 단위 스냅샷을 구현하고, 분석 데이터를 조회·리포트에 활용하는 구조를 만들었습니다. 온프레미스 환경 운영과 장애 대응에도 참여했습니다." },
    ],
    note: "회사 코드는 비공개입니다. 직접 담당한 업무와 기술 선택을 중심으로 소개합니다.",
  },
  {
    id: "honcheon",
    title: "혼천",
    subtitle: "Minecraft 기반 무협 RPG 오픈월드",
    featured: true,
    status: "개발·실험 중",
    description: "AI-assisted world generation으로 의도한 건축 형태를 만들고, 실제 인게임 결과를 검토하며 세계와 게임 규칙을 함께 발전시키는 개인 프로젝트입니다.",
    tags: ["Java / Paper", "Python", "AI-assisted development", "Mineflayer"],
    github: "https://github.com/jokwangwon/honcheon-server",
    steps: [
      { label: "문제", text: "의도한 무협 세계의 건축 형태를 실제 플레이 공간으로 옮기고, 플레이어 행동이 세계 변화로 이어지는 구조를 만들고 있습니다." },
      { label: "맡은 부분과 판단", text: "AI를 활용한 건축 생성에서 건축물과 바닥·지형 생성 단계를 분리했습니다. 레퍼런스와 실제 인게임 화면을 대조해 형태와 동선을 반복 개선하고, 서버 접속 봇과 촬영 도구로 검토 자동화를 실험합니다." },
    ],
    stages: [
      { label: "구현 확인", text: "Java 규칙 엔진, 지역 상태값·세력 반응 계산 코드, 서버 접속 봇, 인게임 촬영·비교 도구가 있습니다. 개별 도구와 규칙의 구현 범위입니다." },
      { label: "실험 중", text: "AI 건축 생성과 레퍼런스 기반 반복 개선, 봇·촬영 도구를 활용한 시각 검토 자동화. 생성물의 형태와 실제 이동 경로를 검토하고 있습니다." },
      { label: "설계 범위", text: "플레이어 행동 → 소문 → 세력 반응 → 지역 상태 → 후속 사건으로 이어지는 월드 변화 구조를 문서화했습니다. 전체 루프의 인게임 연동 완료를 뜻하지 않습니다." },
    ],
  },
  {
    id: "portfolio-blog",
    title: "Portfolio & Blog",
    subtitle: "portfolio-blog",
    status: "공개 운영",
    description: "개발 기록을 직접 작성하고 공개하기 위한 포트폴리오·블로그입니다.",
    tags: ["Spring Boot", "Next.js", "PostgreSQL", "Docker"],
    github: "https://github.com/jokwangwon/portfolio-blog",
    steps: [
      { label: "구현", text: "관리자 글 관리와 방문자 조회를 구분하고, 인증·초안·게시글 관리 기능을 구현했습니다." },
      { label: "운영", text: "Docker와 Cloudflare Tunnel로 홈서버에 공개하고, 테스트와 DB 백업·복원 검증 기록을 관리합니다." },
    ],
  },
  {
    id: "ai-development-tool",
    title: "AI 개발 도구",
    subtitle: "AI_development_tool",
    status: "실험 프로젝트",
    description: "AI를 활용하는 개발 과정에서 요구사항·설계·검사 기록을 함께 관리하기 위한 도구입니다.",
    tags: ["Python", "Git hooks", "GitHub Actions"],
    github: "https://github.com/jokwangwon/AI_development_tool",
    steps: [
      { label: "접근", text: "작업 지침과 명세를 코드와 함께 두고, Git hooks·검사 스크립트·Python 실행 도구를 연결합니다." },
      { label: "현재 상태", text: "개발 흐름에 적용하며 실험 중입니다. 자동화의 적용 범위와 검토할 지점을 다듬고 있습니다." },
    ],
  },
  {
    id: "alert-log",
    title: "Oracle Alert Log 분석",
    subtitle: "Alert-log-project",
    status: "학습·스터디 프로젝트",
    description: "Oracle alert log에서 이벤트와 ORA 코드, 미분류 항목을 확인하기 위한 분석 도구입니다.",
    tags: ["Python", "Oracle", "YAML"],
    github: "https://github.com/jokwangwon/Alert-log-project",
    steps: [
      { label: "접근", text: "타임스탬프 단위 파서와 YAML 이벤트 사전 기반 분류 코드를 두어 분류 규칙을 확인할 수 있게 했습니다." },
      { label: "현재 상태", text: "이벤트별 집계와 미분류 로그 확인을 구현한 스터디 결과물입니다. 실시간 감시와 자동 장애 진단은 범위에 포함하지 않습니다." },
    ],
  },
];
