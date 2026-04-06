"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/src/shell/auth/useAuth";
import { AxiosError } from "axios";
import type { ApiError } from "@/src/types/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import SocialLoginButtons from "@/src/shell/auth/SocialLoginButtons";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ username, password });
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as ApiError;
        setError(data.message || "로그인에 실패했습니다.");
      } else {
        setError("서버에 연결할 수 없습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>계정에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">사용자명</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              또는
            </span>
          </div>

          <SocialLoginButtons />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground hover:underline"
            >
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
