import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import {
  renderWithProviders,
  authenticatedState,
  unauthenticatedState,
} from "@/src/test/test-utils";
import LikeButton from "./LikeButton";

describe("LikeButton", () => {
  it("should render like count", () => {
    renderWithProviders(<LikeButton postId={1} likeCount={5} />, {
      preloadedState: authenticatedState,
    });

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should be disabled when not authenticated", () => {
    renderWithProviders(<LikeButton postId={1} likeCount={5} />, {
      preloadedState: unauthenticatedState,
    });

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should be enabled when authenticated", () => {
    renderWithProviders(<LikeButton postId={1} likeCount={5} />, {
      preloadedState: authenticatedState,
    });

    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("should optimistically update count on like", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LikeButton postId={1} likeCount={5} />, {
      preloadedState: authenticatedState,
    });

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("should optimistically update count on unlike", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LikeButton postId={1} likeCount={5} />, {
      preloadedState: authenticatedState,
    });

    // Like then unlike
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("6")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
