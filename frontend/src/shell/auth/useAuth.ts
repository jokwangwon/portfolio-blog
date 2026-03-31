import { useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@shell/api/client";
import {
  useAppDispatch,
  useAppSelector,
} from "@shell/state/store";
import { setCredentials, clearCredentials } from "@shell/state/authSlice";
import type {
  AuthResponse,
  UserInfo,
  SignupRequest,
  LoginRequest,
} from "@/src/types/api";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth
  );

  const fetchUserAndSetCredentials = useCallback(
    async (accessToken: string) => {
      const { data: userInfo } = await apiClient.get<UserInfo>("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      dispatch(
        setCredentials({
          accessToken,
          user: {
            username: userInfo.username,
            role: userInfo.authorities[0] || "ROLE_USER",
          },
        })
      );
    },
    [dispatch]
  );

  const login = useCallback(
    async (request: LoginRequest) => {
      const { data } = await apiClient.post<AuthResponse>(
        "/auth/login",
        request
      );
      await fetchUserAndSetCredentials(data.accessToken);
      router.push("/blog");
    },
    [fetchUserAndSetCredentials, router]
  );

  const signup = useCallback(
    async (request: SignupRequest) => {
      const { data } = await apiClient.post<AuthResponse>(
        "/auth/signup",
        request
      );
      await fetchUserAndSetCredentials(data.accessToken);
      router.push("/blog");
    },
    [fetchUserAndSetCredentials, router]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      dispatch(clearCredentials());
      router.push("/");
    }
  }, [dispatch, router]);

  return { user, isAuthenticated, isLoading, login, signup, logout };
}
