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
  const [status, setStatus] = useState<"" | "DRAFT" | "PUBLISHED" | "ARCHIVED">("");
  const [visibility, setVisibility] = useState<"" | "PUBLIC" | "PRIVATE">("");
  const allowed = isAuthenticated && canWritePosts(user);
  const { data, isLoading, error, refetch } = useMyPosts({ status: status || undefined, visibility: visibility || undefined, page }, !authLoading && allowed);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) return <Loading />;
  if (!allowed) return <p>글 관리는 관리자만 사용할 수 있습니다.</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">내 기록</h1>
      <div className="flex flex-wrap gap-4">
        <label className="space-y-1 text-sm">작성 상태
          <select aria-label="작성 상태" value={status} onChange={event=>{setStatus(event.target.value as typeof status);setPage(0);}} className="block min-h-11 rounded-lg border border-input bg-background px-3">
            <option value="">전체</option><option value="DRAFT">초안</option><option value="PUBLISHED">작성 완료</option><option value="ARCHIVED">보관</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">공개 범위
          <select aria-label="공개 범위" value={visibility} onChange={event=>{setVisibility(event.target.value as typeof visibility);setPage(0);}} className="block min-h-11 rounded-lg border border-input bg-background px-3">
            <option value="">전체</option><option value="PUBLIC">공개</option><option value="PRIVATE">비공개</option>
          </select>
        </label>
      </div>
      {isLoading ? <Loading /> : error ? (
        <div role="alert" className="space-y-3">
          <p>내 기록을 불러오지 못했습니다.</p>
          <Button onClick={() => refetch()}>다시 시도</Button>
        </div>
      ) : data?.content.length ? (
        <>
          <ul className="space-y-3">
            {data.content.map(post => (
              <li key={post.id}>
                <Link href={`/blog/editor/${post.id}`} className="block rounded-lg border border-border p-4 hover:bg-muted">
                  <span className="font-semibold">{post.title}</span>
                  <span className="block text-sm text-muted-foreground">{post.status === "DRAFT" ? "초안" : post.status === "ARCHIVED" ? "보관" : "작성 완료"} · {post.visibility === "PRIVATE" ? "비공개" : "공개"} · {formatDate(post.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      ) : <p className="text-muted-foreground">선택한 조건에 맞는 기록이 없습니다.</p>}
      <Link href="/mypage" className="underline underline-offset-4">마이페이지로</Link>
    </section>
  );
}
