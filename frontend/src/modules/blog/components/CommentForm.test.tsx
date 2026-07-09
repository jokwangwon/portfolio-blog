import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import CommentForm from "./CommentForm";

describe("CommentForm", () => {
  it("should render with default placeholder and submit label", () => {
    render(<CommentForm onSubmit={vi.fn()} isPending={false} />);

    expect(screen.getByPlaceholderText("댓글을 작성하세요...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "댓글 작성" })).toBeInTheDocument();
  });

  it("should render with custom placeholder and submit label", () => {
    render(
      <CommentForm
        onSubmit={vi.fn()}
        isPending={false}
        placeholder="답글을 작성하세요..."
        submitLabel="답글 작성"
      />
    );

    expect(screen.getByPlaceholderText("답글을 작성하세요...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "답글 작성" })).toBeInTheDocument();
  });

  it("should disable submit button when empty", () => {
    render(<CommentForm onSubmit={vi.fn()} isPending={false} />);

    expect(screen.getByRole("button", { name: "댓글 작성" })).toBeDisabled();
  });

  it("should enable submit button when has content", async () => {
    const user = userEvent.setup();
    render(<CommentForm onSubmit={vi.fn()} isPending={false} />);

    await user.type(screen.getByPlaceholderText("댓글을 작성하세요..."), "Hello");
    expect(screen.getByRole("button", { name: "댓글 작성" })).toBeEnabled();
  });

  it("should call onSubmit and clear input on submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CommentForm onSubmit={onSubmit} isPending={false} />);

    const textarea = screen.getByPlaceholderText("댓글을 작성하세요...");
    await user.type(textarea, "Test comment");
    await user.click(screen.getByRole("button", { name: "댓글 작성" }));

    expect(onSubmit).toHaveBeenCalledWith("Test comment");
    expect(textarea).toHaveValue("");
  });

  it("should not submit whitespace-only content", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<CommentForm onSubmit={onSubmit} isPending={false} />);

    await user.type(screen.getByPlaceholderText("댓글을 작성하세요..."), "   ");
    expect(screen.getByRole("button", { name: "댓글 작성" })).toBeDisabled();
  });

  it("should show pending state", () => {
    render(<CommentForm onSubmit={vi.fn()} isPending={true} />);

    expect(screen.getByRole("button", { name: "작성 중..." })).toBeDisabled();
  });

  it("should show cancel button when onCancel is provided", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <CommentForm onSubmit={vi.fn()} isPending={false} onCancel={onCancel} />
    );

    const cancelBtn = screen.getByRole("button", { name: "취소" });
    expect(cancelBtn).toBeInTheDocument();
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it("should not show cancel button when onCancel is not provided", () => {
    render(<CommentForm onSubmit={vi.fn()} isPending={false} />);

    expect(screen.queryByRole("button", { name: "취소" })).not.toBeInTheDocument();
  });
});
