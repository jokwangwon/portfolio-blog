import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, authenticatedState, unauthenticatedState } from "@/src/test/test-utils";
import { server } from "@/src/test/mocks/server";
import { mockPageResponse, mockPost } from "@/src/test/mocks/handlers";
import DraftsPage from "./page";

describe("Drafts page", () => {
  it("requests drafts and links to the editor", async () => {
    server.use(http.get("/api/portal/posts/my", ({ request }) => {
      expect(new URL(request.url).searchParams.get("status")).toBe("DRAFT");
      return HttpResponse.json({ ...mockPageResponse, content: [{ ...mockPost, status: "DRAFT" }] });
    }));
    renderWithProviders(<DraftsPage />, { preloadedState: authenticatedState });
    expect(await screen.findByRole("link", { name: /Test Post/ })).toHaveAttribute("href", "/blog/editor/1");
  });
  it("shows an empty state", async () => {
    server.use(http.get("/api/portal/posts/my", () => HttpResponse.json({ ...mockPageResponse, content: [], totalPages: 0 })));
    renderWithProviders(<DraftsPage />, { preloadedState: authenticatedState });
    expect(await screen.findByText("임시저장한 글이 없습니다.")).toBeInTheDocument();
  });
  it("shows fetch errors instead of an empty state", async () => {
    server.use(http.get("/api/portal/posts/my", () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<DraftsPage />, { preloadedState: authenticatedState });
    expect(await screen.findByRole("alert")).toHaveTextContent("불러오지 못했습니다");
  });
  it("does not request private posts before login", async () => {
    const request = vi.fn(() => HttpResponse.json(mockPageResponse));
    server.use(http.get("/api/portal/posts/my", request));
    renderWithProviders(<DraftsPage />, { preloadedState: unauthenticatedState });
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(request).not.toHaveBeenCalled();
  });
});
