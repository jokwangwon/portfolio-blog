"use client";

import { useEffect } from "react";
import axios from "axios";
import {
  useAppDispatch,
  useAppSelector,
} from "@shell/state/store";
import { setCredentials, clearCredentials } from "@shell/state/authSlice";
import type { AuthResponse, UserInfo } from "@/src/types/api";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    async function tryRefresh() {
      try {
        const { data } = await axios.post<AuthResponse>(
          "/api/portal/auth/refresh",
          null,
          { withCredentials: true }
        );

        const meResponse = await axios.get<UserInfo>("/api/portal/auth/me", {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });

        dispatch(
          setCredentials({
            accessToken: data.accessToken,
            user: {
              username: meResponse.data.username,
              role: meResponse.data.authorities[0] || "ROLE_USER",
            },
          })
        );
      } catch {
        dispatch(clearCredentials());
      }
    }

    tryRefresh();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return <>{children}</>;
}
