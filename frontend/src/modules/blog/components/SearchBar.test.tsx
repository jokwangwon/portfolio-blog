import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render with default placeholder", () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText("게시글 검색...")).toBeInTheDocument();
  });

  it("should render with custom placeholder", () => {
    render(<SearchBar onSearch={vi.fn()} placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("should call onSearch after 300ms debounce", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    onSearch.mockClear();

    const input = screen.getByPlaceholderText("게시글 검색...");
    fireEvent.change(input, { target: { value: "react" } });

    // Not called yet (before debounce)
    expect(onSearch).not.toHaveBeenCalledWith("react");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith("react");
  });

  it("should debounce rapid input", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    onSearch.mockClear();

    const input = screen.getByPlaceholderText("게시글 검색...");

    fireEvent.change(input, { target: { value: "r" } });
    act(() => vi.advanceTimersByTime(100));

    fireEvent.change(input, { target: { value: "re" } });
    act(() => vi.advanceTimersByTime(100));

    fireEvent.change(input, { target: { value: "react" } });
    act(() => vi.advanceTimersByTime(300));

    // Final call should be "react"
    const calls = onSearch.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls[calls.length - 1]).toBe("react");
  });

  it("should call onSearch with empty string initially", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith("");
  });
});
