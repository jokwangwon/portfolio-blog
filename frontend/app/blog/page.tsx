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
import PostCardSkeleton from "@/src/modules/blog/components/PostCardSkeleton";
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">블로그</h1>
          <p className="text-sm text-muted-foreground mt-1">개발 경험과 기술을 공유합니다</p>
        </div>
        {isAuthenticated && (
          <Link href="/blog/editor" className={buttonVariants()}>
            글쓰기
          </Link>
        )}
      </div>

      <div className="flex gap-8">
        {/* 좌측 사이드바 */}
        {!isSearching && categories && (
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <div className="sticky top-20">
              <CategoryFilter
                categories={categories}
                selectedId={categoryId}
                onSelect={handleCategorySelect}
              />
            </div>
          </aside>
        )}

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* 모바일 카테고리 (lg 미만에서만 표시) */}
          {!isSearching && categories && (
            <div className="lg:hidden flex flex-wrap gap-2 mb-6">
              {[{ id: undefined, name: "전체" } as const, ...categories.map(c => ({ id: c.id, name: c.name } as const))].map((cat) => (
                <button
                  key={cat.id ?? "all"}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    (cat.id === undefined ? !categoryId : categoryId === cat.id)
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border hover:border-foreground"
                  }`}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
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
      </div>
    </div>
  );
}
