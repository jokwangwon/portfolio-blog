import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarkdownRenderer from "./MarkdownRenderer";

describe("Published rich content", () => {
  it("renders stored HTML tables and formatting", () => {
    render(<MarkdownRenderer content={'<p><strong>제목</strong></p><table><tbody><tr><td>셀 내용</td></tr></tbody></table>'} />);
    expect(screen.getByText("제목").tagName).toBe("STRONG");
    expect(screen.getByRole("cell")).toHaveTextContent("셀 내용");
  });
  it("removes scripts, event handlers and javascript links", () => {
    const { container } = render(<MarkdownRenderer content={'<script>alert(1)</script><img src="/safe.png" onerror="alert(1)" alt="safe" /><a href="javascript:alert(1)">unsafe</a>'} />);
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByAltText("safe")).not.toHaveAttribute("onerror");
    expect(screen.getByText("unsafe")).not.toHaveAttribute("href");
  });
});
