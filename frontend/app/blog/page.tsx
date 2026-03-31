"use client";

import { useState } from "react";
import { usePosts, useCategories } from "@/src/modules/blog/hooks/usePosts";
import PostCard from "@/src/modules/blog/components/PostCard";
import CategoryFilter from "@/src/modules/blog/components/CategoryFilter";
import Pagination from "@/src/modules/blog/components/Pagination";
import Loading from "@/src/shared/components/Loading";

export default function BlogPage() {
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState<number | undefined>();

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">블로그</h1>

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
        <div className="text-center py-20 text-gray-500">
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
