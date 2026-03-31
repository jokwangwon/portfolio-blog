"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  usePosts,
  useSearchPosts,
  useCategories,
} from "@/src/modules/blog/hooks/usePosts";
import { useAuth } from "@/src/shell/auth/useAuth";
import PostCard from "@/src/modules/blog/components/PostCard";
import CategoryFilter from "@/src/modules/blog/components/CategoryFilter";
import SearchBar from "@/src/modules/blog/components/SearchBar";
import Pagination from "@/src/modules/blog/components/Pagination";
import Loading from "@/src/shared/components/Loading";
import { buttonVariants } from "@/components/ui/button";

export default function BlogPage() {
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [searchKeyword, setSearchKeyword] = useState("");
  const { isAuthenticated } = useAuth();

  const isSearching = searchKeyword.trim().length > 0;

  const { data: postsData, isLoading: postsLoading } = usePosts({
    page,
    categoryId,
  });

  const { data: searchData, isLoading: searchLoading } = useSearchPosts({
    keyword: searchKeyword,
    page,
  });

  const { data: categories } = useCategories();

  const displayData = isSearching ? searchData : postsData;
  const isLoading = isSearching ? searchLoading : postsLoading;

  function handleCategorySelect(id?: number) {
    setCategoryId(id);
    setPage(0);
    setSearchKeyword("");
  }

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    setPage(0);
  }, []);

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

      <div className="flex items-center gap-4 mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>

      {!isSearching && categories && (
        <CategoryFilter
          categories={categories}
          selectedId={categoryId}
          onSelect={handleCategorySelect}
        />
      )}

      {isLoading ? (
        <Loading />
      ) : displayData?.empty ? (
        <div className="text-center py-20 text-muted-foreground">
          {isSearching
            ? `"${searchKeyword}"에 대한 검색 결과가 없습니다.`
            : "아직 게시글이 없습니다."}
        </div>
      ) : (
        <>
          {isSearching && (
            <p className="text-sm text-muted-foreground mb-4">
              &quot;{searchKeyword}&quot; 검색 결과 ({displayData?.totalElements}건)
            </p>
          )}

          <div className="grid gap-4">
            {displayData?.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {displayData && (
            <Pagination
              currentPage={displayData.number}
              totalPages={displayData.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
