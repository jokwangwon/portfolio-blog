export interface ExperienceItem {
  year: string;
  title: string;
  organization: string;
  description: string;
}

export const experience: ExperienceItem[] = [
  {
    year: "2026",
    title: "AI 개발",
    organization: "기원테크",
    description: "AI 기반 솔루션 개발 및 운영",
  },
  {
    year: "2025",
    title: "부트캠프 수료",
    organization: "",
    description: "풀스택 웹 개발 과정 수료",
  },
];
