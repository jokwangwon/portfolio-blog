"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/src/shell/state/store";
import { setCredentials } from "@/src/shell/state/authSlice";
import apiClient from "@/src/shell/api/client";
import type { UserInfo } from "@/src/types/api";
import Loading from "@/src/shared/components/Loading";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");

    if (!accessToken) {
      setError("인증 토큰을 받지 못했습니다.");
      return;
    }

    async function processToken(token: string) {
      try {
        const { data: userInfo } = await apiClient.get<UserInfo>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        dispatch(
          setCredentials({
            accessToken: token,
            user: {
              username: userInfo.username,
              role: userInfo.authorities[0] || "ROLE_USER",
            },
          })
        );

        router.push("/blog");
      } catch {
        setError("사용자 정보를 가져오는데 실패했습니다.");
      }
    }

    processToken(accessToken);
  }, [searchParams, dispatch, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-muted-foreground hover:underline"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loading />
      <p className="mt-4 text-sm text-muted-foreground">로그인 처리 중...</p>
    </div>
  );
}
