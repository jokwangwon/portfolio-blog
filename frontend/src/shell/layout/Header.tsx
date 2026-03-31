"use client";

import Link from "next/link";
import { useAuth } from "@shell/auth/useAuth";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Portfolio
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/blog"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              블로그
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-700">{user?.username}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
