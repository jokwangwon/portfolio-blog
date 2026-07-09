import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useMyProfile, useChangePassword } from "./useProfile";

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

describe("useProfile", () => {
  it("내 프로필을 조회한다", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMyProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.username).toBe("testuser");
    expect(result.current.data?.email).toBe("test@test.com");
    expect(result.current.data?.role).toBe("USER");
  });

  it("비밀번호를 변경한다", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useChangePassword(), { wrapper });

    result.current.mutate({
      currentPassword: "OldPass123!",
      newPassword: "NewPass456!",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("현재 비밀번호가 틀리면 에러를 반환한다", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useChangePassword(), { wrapper });

    result.current.mutate({
      currentPassword: "WrongPass999!",
      newPassword: "NewPass456!",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
