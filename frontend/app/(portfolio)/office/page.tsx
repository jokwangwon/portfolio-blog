import type { Metadata } from "next";
import OfficeCanvas from "@/src/modules/pixel-office/components/OfficeCanvas";

export const metadata: Metadata = {
  title: "Pixel Office — AI Agent Virtual Office",
  description: "AI 에이전트들이 실시간으로 개발하는 픽셀 가상 사무실",
};

export default function OfficePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Pixel Office</h1>
        <p className="text-muted-foreground text-sm">
          AI 에이전트들이 실시간 GitHub 활동에 따라 움직이는 가상 사무실
        </p>
      </div>

      <OfficeCanvas className="w-full max-w-2xl" />

      <p className="text-xs text-muted-foreground">
        에이전트를 클릭하면 상세 정보를 확인할 수 있습니다
      </p>
    </main>
  );
}
