"use client";

import { useState } from "react";
import Link from "next/link";
import { usePosts, useCategories } from "@/src/modules/blog/hooks/usePosts";
import { useAuth } from "@/src/shell/auth/useAuth";
import PostCard from "@/src/modules/blog/components/PostCard";
import CategoryFilter from "@/src/modules/blog/components/CategoryFilter";
import Pagination from "@/src/modules/blog/components/Pagination";
import Loading from "@/src/shared/components/Loading";
import { buttonVariants } from "@/components/ui/button";

export default function BlogPage() {
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const { isAuthenticated } = useAuth();

  const { data: postsData, isLoading: postsLoading } = usePosts({
    page,
    categoryId,
  });
  const { data: categories } = useCategories();

  function handleCategorySelect(id?: number) {
    setCategoryId(id);
    setPage(0);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">블로그</h1>
        {isAuthenticated && (
          <Link href="/blog/editor" className={buttonVariants()}>
            글쓰기
          </Link>
        )}
      </div>

      {categories && (
        <CategoryFilter
          categories={categories}
          selectedId={categoryId}
          onSelect={handleCategorySelect}
        />
      )}

      {postsLoading ? (
        <Loading />
      ) : postsData?.empty ? (
        <div className="text-center py-20 text-muted-foreground">
          아직 게시글이 없습니다.
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {postsData?.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {postsData && (
            <Pagination
              currentPage={postsData.number}
              totalPages={postsData.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
