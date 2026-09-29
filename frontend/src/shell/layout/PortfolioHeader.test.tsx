import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PortfolioHeader from "./PortfolioHeader";

vi.mock("@/src/shell/theme/useTheme", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));

describe("Portfolio navigation", () => {
  it("connects the three spaces from any portfolio route", () => {
    render(<PortfolioHeader />);
    expect(screen.getByRole("link", { name: "포트폴리오" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "기록" })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: "작업실" })).toHaveAttribute("href", "/office");
  });
  it("announces expansion and closes with Escape, returning focus", async () => {
    const user = userEvent.setup();
    render(<PortfolioHeader />);
    const toggle = screen.getByRole("button", { name: "메뉴" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const mobile = screen.getByRole("navigation", { name: "모바일 메뉴" });
    within(mobile).getByRole("link", { name: "기록" }).focus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "모바일 메뉴" })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
  it("closes the mobile menu when following a section link", async () => {
    const user = userEvent.setup();
    render(<PortfolioHeader />);
    await user.click(screen.getByRole("button", { name: "메뉴" }));
    const mobile = screen.getByRole("navigation", { name: "모바일 메뉴" });
    await user.click(within(mobile).getByRole("link", { name: "포트폴리오" }));
    expect(screen.queryByRole("navigation", { name: "모바일 메뉴" })).not.toBeInTheDocument();
  });
});
