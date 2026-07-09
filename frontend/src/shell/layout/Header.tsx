"use client";

import Link from "next/link";
import { useAuth } from "@shell/auth/useAuth";
import { useTheme } from "@/src/shell/theme/useTheme";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-foreground">
            KW
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex gap-1">
            <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              블로그
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
          <Separator orientation="vertical" className="h-5" />
          {isAuthenticated ? (
            <>
              <Link href="/blog/drafts" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                임시저장
              </Link>
              <Link href="/blog/editor" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                글쓰기
              </Link>
              <Separator orientation="vertical" className="h-5" />
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                로그인
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
