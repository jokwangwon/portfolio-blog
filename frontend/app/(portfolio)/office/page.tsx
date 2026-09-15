import type { Metadata } from "next";
import OfficeCanvas from "@/src/modules/pixel-office/components/OfficeCanvas";

export const metadata: Metadata = {
  title: "작업실 | 조광원",
  description: "지금 작업하는 프로젝트와 업무, 가장 최근에 작업한 프로젝트를 살펴보는 개인 작업실입니다.",
};

export default function OfficePage() {
  return (
    <section className="bg-background flex flex-col items-center gap-6 px-4 pt-24 pb-12 sm:px-6">
      <h1 className="w-full max-w-6xl text-2xl font-bold tracking-tight">작업실</h1>
      <OfficeCanvas className="w-full max-w-6xl" />
    </section>
  );
}
