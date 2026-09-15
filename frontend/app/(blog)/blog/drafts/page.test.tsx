import { screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, authenticatedState, unauthenticatedState } from "@/src/test/test-utils";
import { server } from "@/src/test/mocks/server";
import { mockPageResponse, mockPost } from "@/src/test/mocks/handlers";
import DraftsPage from "./page";

describe("Drafts page", () => {
  it("작성 상태와 공개 범위를 독립적으로 필터링한다", async () => {
    const requests: URLSearchParams[] = [];
    server.use(http.get("/api/portal/posts/my", ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(mockPageResponse);
    }));
    renderWithProviders(<DraftsPage />, { preloadedState: authenticatedState });
    await screen.findByRole("link", { name: /Test Post/ });
    fireEvent.change(screen.getByLabelText("작성 상태"), { target: { value: "PUBLISHED" } });
    fireEvent.change(screen.getByLabelText("공개 범위"), { target: { value: "PRIVATE" } });
    await waitFor(() => expect(requests.some(params => params.get("status") === "PUBLISHED" && params.get("visibility") === "PRIVATE")).toBe(true));
  });

  it("requests all owned records and links to the editor", async () => {
    server.use(http.get("/api/portal/posts/my", ({ request }) => {
      expect(new URL(request.url).searchParams.get("status")).toBeNull();
      return HttpResponse.json({ ...mockPageResponse, content: [{ ...mockPost, status: "DRAFT" }] });
    }));
    renderWithProviders(<DraftsPage />, { preloadedState: authenticatedState });
    expect(await screen.findByRole("link", { name: /Test Post/ })).toHaveAttribute("href", "/blog/editor/1");
  });
  it("shows an empty state", async () => {
    server.use(http.get("/api/portal/posts/my", () => HttpResponse.json({ ...mockPageResponse, content: [], totalPages: 0 })));
    renderWithProviders(<DraftsPage />, { preloadedState: authenticatedState });
    expect(await screen.findByText("선택한 조건에 맞는 기록이 없습니다.")).toBeInTheDocument();
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
