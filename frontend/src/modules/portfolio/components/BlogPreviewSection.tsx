"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { MotionSection } from "@/src/shared/animations/MotionSection";
import { usePosts } from "@/src/modules/blog/hooks/usePosts";
import PostCard from "@/src/modules/blog/components/PostCard";
import PostCardSkeleton from "@/src/modules/blog/components/PostCardSkeleton";

export default function BlogPreviewSection() {
  const { data, isLoading, error, refetch } = usePosts({ size: 3, sort: "publishedAt,desc" });

  return (
    <MotionSection id="blog" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Blog</p>
            <h2 className="text-3xl font-bold tracking-tight">최근 기록</h2>
            <p className="text-sm text-muted-foreground mt-3">학습한 내용과 프로젝트에서 해결한 문제를 기록합니다.</p>
          </div>
          <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            전체 글 보기 <ArrowRight className="size-4 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <div role="status" aria-label="최근 글을 불러오는 중입니다" className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((key) => <PostCardSkeleton key={key} />)}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground mb-4">최근 글을 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={() => void refetch()}>다시 시도</Button>
          </div>
        ) : data?.content.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {data.content.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <BookOpen className="size-6 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
            <p className="font-medium mb-2">아직 작성된 글이 없습니다.</p>
            <p className="text-sm text-muted-foreground">프로젝트 소스와 작업 이력은 위 프로젝트 목록에서 확인할 수 있습니다.</p>
          </div>
        )}
      </div>
    </MotionSection>
  );
}
