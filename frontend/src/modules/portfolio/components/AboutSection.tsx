"use client";

import { MotionSection } from "@/src/shared/animations/MotionSection";

export default function AboutSection() {
  return (
    <MotionSection id="about" className="py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">About</h2>
            <h3 className="text-xl font-semibold">조광원</h3>
          </div>
          <div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                AI 분석 결과를 데이터·DB·API와 연결해 서비스 기능으로 만드는
                백엔드 개발자입니다. 트러스트에이아이와 기원테크에서
                Python·FastAPI 기반 백엔드 개발과 운영에 참여했습니다.
              </p>
              <p>
                데이터 집계와 권한별 접근 제어, LLM 연동을 담당했고,
                온프레미스 환경에서 운영과 장애 대응을 경험했습니다.
                현재는 혼천의 게임 월드 시스템, AI 활용 개발 도구,
                Oracle 데이터베이스 학습·분석 도구를 만들고 있습니다.
              </p>
              <p>
                AI 코딩 도구를 활용해 개발하며, 요구사항과 설계 문서, 테스트 결과,
                수정 이력을 함께 남기고 있습니다. 프로젝트마다 구현한 범위와
                앞으로 보완할 부분을 구분해 소개합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
