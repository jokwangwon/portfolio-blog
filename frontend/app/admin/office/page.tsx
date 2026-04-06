"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@shell/auth/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AdminOffice = dynamic(
  () => import("@/src/modules/pixel-office/components/AdminOffice"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-8rem)] rounded-lg bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading Admin Office...</span>
      </div>
    ),
  },
);

export default function AdminOfficePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isAdmin = user?.role === "ROLE_ADMIN";

  return (
    <main className="flex flex-col h-screen p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Admin Pixel Office</h1>
          <p className="text-xs text-muted-foreground">
            Claude Code 도구 사용을 실시간으로 추적합니다
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {user?.username} ({isAdmin ? "ADMIN" : "USER"})
          </span>
          {!isAdmin && (
            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
              읽기 전용
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AdminOffice />
      </div>
    </main>
  );
}
