export interface ExperienceItem {
  year: string;
  title: string;
  organization: string;
  description: string;
}

// Based on the owner's supplied career record; internal metrics and client details are omitted.
export const career: ExperienceItem[] = [
  {
    year: "2025.07 — 2026.01",
    title: "AI사업본부 · 주임",
    organization: "기원테크",
    description: "AI 상담 서비스의 백엔드 고도화와 운영 업무를 담당했습니다.",
  },
  {
    year: "2025.01 — 2025.06",
    title: "백엔드 개발 · 정규직",
    organization: "트러스트에이아이",
    description: "AI 상담 서비스의 백엔드 개발에 참여했습니다.",
  },
  {
    year: "2024.07 — 2024.12",
    title: "데이터 전처리·모델 검증 · 인턴",
    organization: "트러스트에이아이",
    description: "AI 서비스 개발에 필요한 데이터 전처리와 모델 검증을 보조했습니다.",
  },
];

export const experience: ExperienceItem[] = [
  {
    year: "2026.09",
    title: "개인 포트폴리오 공개",
    organization: "개인 프로젝트",
    description: "홈서버에 포트폴리오와 블로그를 배포하고, gwangwon.dev 도메인으로 공개했습니다.",
  },
  {
    year: "2026.03.18 — 2026.08.12",
    title: "Oracle DBA 과정 94기 수료",
    organization: "아이티윌",
    description: "Oracle 데이터베이스를 학습하고, 학습 문서·도구 제작과 스터디 기록을 이어갔습니다.",
  },
];
