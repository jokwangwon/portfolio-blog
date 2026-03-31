import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PostCard from "./PostCard";
import type { PostResponse } from "@/src/types/api";

const mockPost: PostResponse = {
  id: 1,
  title: "Test Post Title",
  content: "Test content",
  excerpt: "This is a test excerpt",
  status: "PUBLISHED",
  viewCount: 42,
  likeCount: 7,
  author: { username: "testuser", role: "USER" },
  category: { id: 1, name: "Technology" },
  tags: [
    { id: 1, name: "react" },
    { id: 2, name: "nextjs" },
  ],
  createdAt: "2026-03-31T00:00:00",
  updatedAt: "2026-03-31T00:00:00",
  publishedAt: "2026-03-31T00:00:00",
};

describe("PostCard", () => {
  it("should render post title", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("should render excerpt", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("This is a test excerpt")).toBeInTheDocument();
  });

  it("should render category badge", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("should render tags", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByText("#nextjs")).toBeInTheDocument();
  });

  it("should render author", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("should render view and like counts", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("조회 42")).toBeInTheDocument();
    expect(screen.getByText("좋아요 7")).toBeInTheDocument();
  });

  it("should link to post detail page", () => {
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/1");
  });

  it("should handle post without category", () => {
    const postNoCategory = { ...mockPost, category: null };
    render(<PostCard post={postNoCategory as PostResponse} />);
    expect(screen.queryByText("Technology")).not.toBeInTheDocument();
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("should handle post without excerpt", () => {
    const postNoExcerpt = { ...mockPost, excerpt: null };
    render(<PostCard post={postNoExcerpt as unknown as PostResponse} />);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });
});
