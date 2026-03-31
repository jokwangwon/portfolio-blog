"use client";

import Link from "next/link";
import { useAuth } from "@shell/auth/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-foreground">
            Portfolio
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex gap-1">
            <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              블로그
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
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
