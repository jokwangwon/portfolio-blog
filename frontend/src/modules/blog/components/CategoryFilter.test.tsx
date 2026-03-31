import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import CategoryFilter from "./CategoryFilter";

const categories = [
  { id: 1, name: "Tech" },
  { id: 2, name: "Life" },
  { id: 3, name: "Dev" },
];

describe("CategoryFilter", () => {
  it("should render all category buttons plus '전체'", () => {
    render(
      <CategoryFilter categories={categories} onSelect={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: "전체" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tech" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Life" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dev" })).toBeInTheDocument();
  });

  it("should call onSelect with category id when clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoryFilter categories={categories} onSelect={onSelect} />
    );

    await user.click(screen.getByRole("button", { name: "Tech" }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("should call onSelect with undefined when '전체' clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoryFilter
        categories={categories}
        selectedId={1}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole("button", { name: "전체" }));
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("should handle empty categories", () => {
    render(<CategoryFilter categories={[]} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "전체" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
