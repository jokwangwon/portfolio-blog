import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Portfolio Platform
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        개발 블로그, AI 벤치마크, 프로젝트 쇼케이스를 위한 통합 플랫폼
      </p>
      <Link
        href="/blog"
        className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
      >
        블로그 보기
      </Link>
    </div>
  );
}
