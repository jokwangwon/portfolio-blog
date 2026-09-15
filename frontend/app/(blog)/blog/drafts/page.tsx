"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/shell/auth/useAuth";
import { canWritePosts } from "@/src/shell/auth/publicAccess";
import { useMyPosts } from "@/src/modules/blog/hooks/usePosts";
import Pagination from "@/src/modules/blog/components/Pagination";
import Loading from "@/src/shared/components/Loading";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/src/shared/utils/format";

export default function DraftsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(0);
  const allowed = isAuthenticated && canWritePosts(user);
  const { data, isLoading, error, refetch } = useMyPosts({ status: "DRAFT", page }, !authLoading && allowed);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated || isLoading) return <Loading />;
  if (!allowed) return <p>글 관리는 관리자만 사용할 수 있습니다.</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">임시저장 글</h1>
      {error ? (
        <div role="alert" className="space-y-3">
          <p>임시저장 글을 불러오지 못했습니다.</p>
          <Button onClick={() => refetch()}>다시 시도</Button>
        </div>
      ) : data?.content.length ? (
        <>
          <ul className="space-y-3">
            {data.content.map(post => (
              <li key={post.id}>
                <Link href={`/blog/editor/${post.id}`} className="block rounded-lg border border-border p-4 hover:bg-muted">
                  <span className="font-semibold">{post.title}</span>
                  <span className="block text-sm text-muted-foreground">{formatDate(post.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      ) : <p className="text-muted-foreground">임시저장한 글이 없습니다.</p>}
      <Link href="/mypage" className="underline underline-offset-4">마이페이지로</Link>
    </section>
  );
}
