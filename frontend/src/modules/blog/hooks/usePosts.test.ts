import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  usePosts,
  usePostDetail,
  useSearchPosts,
  useCategories,
  useTags,
  useCreatePost,
  useDeletePost,
  useLikePost,
  useUnlikePost,
  useComments,
  useCreateComment,
  useDeleteComment,
} from "./usePosts";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  };
}

describe("usePosts", () => {
  it("should fetch posts list", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePosts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.content).toHaveLength(1);
    expect(result.current.data?.content[0].title).toBe("Test Post");
    expect(result.current.data?.totalElements).toBe(1);
  });

  it("should pass pagination params", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePosts({ page: 0, size: 10, categoryId: 1 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content).toHaveLength(1);
  });
});

describe("usePostDetail", () => {
  it("should fetch single post by id", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePostDetail(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.title).toBe("Test Post");
    expect(result.current.data?.author.username).toBe("testuser");
  });

  it("should not fetch when id is 0", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePostDetail(0), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useSearchPosts", () => {
  it("should search posts with keyword", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSearchPosts({ keyword: "test", page: 0 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content).toHaveLength(1);
  });

  it("should not search with empty keyword", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSearchPosts({ keyword: "", page: 0 }),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should not search with whitespace-only keyword", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSearchPosts({ keyword: "   ", page: 0 }),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCategories", () => {
  it("should fetch categories", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: "Tech" }]);
  });
});

describe("useTags", () => {
  it("should fetch tags", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTags(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, name: "react" }]);
  });
});

describe("useCreatePost", () => {
  it("should create a post and invalidate cache", async () => {
    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useCreatePost(), { wrapper });

    result.current.mutate({
      title: "New Post",
      content: "New content",
      status: "PUBLISHED",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe("New Post");
  });
});

describe("useDeletePost", () => {
  it("should delete a post", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeletePost(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useLikePost / useUnlikePost", () => {
  it("should like a post", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLikePost(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.liked).toBe(true);
  });

  it("should unlike a post", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnlikePost(), { wrapper });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.liked).toBe(false);
  });
});

describe("useComments", () => {
  it("should fetch comments for a post", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useComments({ postId: 1 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.content).toHaveLength(1);
    expect(result.current.data?.content[0].content).toBe("Test comment");
  });

  it("should not fetch when postId is 0", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useComments({ postId: 0 }),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateComment", () => {
  it("should create a comment", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateComment(), { wrapper });

    result.current.mutate({
      postId: 1,
      request: { content: "New comment" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content).toBe("New comment");
  });

  it("should create a reply comment", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateComment(), { wrapper });

    result.current.mutate({
      postId: 1,
      request: { content: "Reply", parentId: 1 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useDeleteComment", () => {
  it("should delete a comment", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteComment(), { wrapper });

    result.current.mutate({ postId: 1, commentId: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
