import path from "node:path";
import { fileURLToPath } from "node:url";
import { Suspense } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/src/test/test-utils";
import PostDetailPage from "./page";

describe("PostDetailPage 라우트", () => {
  it("동적 세그먼트 폴더명이 페이지가 읽는 파라미터(id)와 일치한다", () => {
    // 페이지는 params.id를 읽고 PostCard는 /blog/${post.id}로 링크하므로
    // 폴더명이 [id]가 아니면 params가 undefined가 되어 상세 페이지가 동작하지 않는다
    const dynamicSegment = path.basename(
      path.dirname(fileURLToPath(import.meta.url))
    );
    expect(dynamicSegment).toBe("[id]");
  });

  it("Next.js가 전달하는 params로 게시글을 로드해 렌더링한다", async () => {
    // use()가 suspend 없이 동기적으로 읽을 수 있도록 fulfilled thenable로 전달
    const params = Object.assign(Promise.resolve({ id: "1" }), {
      status: "fulfilled" as const,
      value: { id: "1" },
    });

    renderWithProviders(
      <Suspense fallback={null}>
        <PostDetailPage params={params} />
      </Suspense>
    );

    expect(await screen.findByText("Test Post")).toBeInTheDocument();
  });
});
