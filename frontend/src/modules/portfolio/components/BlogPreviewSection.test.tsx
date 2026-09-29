import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/src/test/test-utils";
import { server } from "@/src/test/mocks/server";
import { mockPageResponse } from "@/src/test/mocks/handlers";
import BlogPreviewSection from "./BlogPreviewSection";

vi.mock("@/src/shared/animations/MotionSection", () => ({
  MotionSection: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

describe("Home recent posts", () => {
  it("fetches the three most recently published posts and links to the article", async () => {
    server.use(http.get("/api/portal/posts", ({ request }) => {
      const params = new URL(request.url).searchParams;
      expect(params.get("size")).toBe("3");
      expect(params.get("sort")).toBe("publishedAt,desc");
      return HttpResponse.json(mockPageResponse);
    }));
    renderWithProviders(<BlogPreviewSection />);
    expect(await screen.findByRole("link", { name: /Test Post/ })).toHaveAttribute("href", "/blog/1");
    expect(screen.queryByText("아직 작성된 글이 없습니다.")).not.toBeInTheDocument();
  });
  it("shows an empty state only when there are no published posts", async () => {
    server.use(http.get("/api/portal/posts", () => HttpResponse.json({ ...mockPageResponse, content: [], empty: true })));
    renderWithProviders(<BlogPreviewSection />);
    expect(await screen.findByText("아직 작성된 글이 없습니다.")).toBeInTheDocument();
  });
  it("distinguishes request failure from no posts and retries", async () => {
    server.use(http.get("/api/portal/posts", () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<BlogPreviewSection />);
    expect(await screen.findByRole("alert")).toHaveTextContent("불러오지 못했습니다");
    expect(screen.queryByText("아직 작성된 글이 없습니다.")).not.toBeInTheDocument();
    server.use(http.get("/api/portal/posts", () => HttpResponse.json(mockPageResponse)));
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByRole("link", { name: /Test Post/ })).toHaveAttribute("href", "/blog/1");
  });
});
