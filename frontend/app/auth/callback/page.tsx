"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/src/shell/state/store";
import { setCredentials } from "@/src/shell/state/authSlice";
import apiClient from "@/src/shell/api/client";
import type { UserInfo } from "@/src/types/api";
import Loading from "@/src/shared/components/Loading";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");
  const processed = useRef(false);

  useEffect(() => {
    // StrictMode 중복 실행 방지
    if (processed.current) return;
    processed.current = true;

    // Fragment(#)에서 토큰 추출 — query param과 달리 서버 로그/Referrer에 노출 안 됨
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    // 읽은 즉시 fragment 제거 (브라우저 히스토리에서도 삭제)
    if (hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    async function processToken() {
      if (!accessToken) {
        setError("인증 토큰을 받지 못했습니다.");
        return;
      }
      try {
        // OAuth2 refresh token 쿠키 설정 — Next.js 프록시 경유로 프론트 도메인에 쿠키 저장
        if (refreshToken) {
          await apiClient.post("/auth/oauth-session", { refreshToken });
        }

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

        router.push("/blog");
      } catch {
        setError("사용자 정보를 가져오는데 실패했습니다.");
      }
    }

    processToken();
  }, [dispatch, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => router.push("/auth/login")}
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
