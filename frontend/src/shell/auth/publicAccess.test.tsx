import { afterAll, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, authenticatedState, unauthenticatedState } from "@/src/test/test-utils";
import Header from "@/src/shell/layout/Header";
import SignupPage from "@/app/(auth)/signup/page";
import SocialLoginButtons from "./SocialLoginButtons";

const previousPolicy = vi.hoisted(() => {
  const previous = process.env.NEXT_PUBLIC_PUBLIC_READ_ONLY;
  process.env.NEXT_PUBLIC_PUBLIC_READ_ONLY = "true";
  return previous;
});
afterAll(() => {
  if (previousPolicy === undefined) delete process.env.NEXT_PUBLIC_PUBLIC_READ_ONLY;
  else process.env.NEXT_PUBLIC_PUBLIC_READ_ONLY = previousPolicy;
});
vi.mock("@/src/shell/theme/useTheme", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));

describe("Public read-only launch", () => {
  it("offers admin login without registration to visitors", () => {
    renderWithProviders(<Header />, { preloadedState: unauthenticatedState });
    expect(screen.getByRole("link", { name: "관리자 로그인" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "회원가입" })).not.toBeInTheDocument();
  });
  it("hides authoring links from existing members", () => {
    renderWithProviders(<Header />, { preloadedState: authenticatedState });
    expect(screen.queryByRole("link", { name: "글쓰기" })).not.toBeInTheDocument();
  });
  it("keeps authoring links for admins", () => {
    renderWithProviders(<Header />, { preloadedState: { auth: { ...authenticatedState.auth, user: { username: "admin", role: "ROLE_ADMIN" } } } });
    expect(screen.getByRole("link", { name: "글쓰기" })).toHaveAttribute("href", "/blog/editor");
  });
  it("does not render registration or social login forms", () => {
    renderWithProviders(<><SignupPage /><SocialLoginButtons /></>);
    expect(screen.getByText("현재 회원가입을 받지 않습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /계속하기/ })).not.toBeInTheDocument();
  });
});
