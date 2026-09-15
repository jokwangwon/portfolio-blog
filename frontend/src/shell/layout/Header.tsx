"use client";

import Link from "next/link";
import { requestEditorLeave } from "@/src/shared/hooks/useNavigationGuard";
import { PUBLIC_READ_ONLY, canWritePosts } from "@shell/auth/publicAccess";
import { useAuth } from "@shell/auth/useAuth";
import { useTheme } from "@/src/shell/theme/useTheme";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { siteNavigation } from "./siteNavigation";
import { Sun, Moon } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Link href="/" className="text-lg font-bold text-foreground">
            KW
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <nav aria-label="주요 메뉴" className="flex gap-1">
            {siteNavigation.map((item) => (
              <Link key={item.href} href={item.href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              {canWritePosts(user) && (
                <>
                  <Link href="/blog/drafts" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    내 기록
                  </Link>
                  <Link href="/blog/editor" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    글쓰기
                  </Link>
                </>
              )}
              <Separator orientation="vertical" className="h-5" />
              <Link
                href="/mypage"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {user?.username}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => { if (requestEditorLeave()) void logout(); }}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {PUBLIC_READ_ONLY ? "관리자 로그인" : "로그인"}
              </Link>
              {!PUBLIC_READ_ONLY && (
                <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                  회원가입
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
