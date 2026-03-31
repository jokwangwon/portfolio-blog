"use client";

import { use } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePostDetail } from "@/src/modules/blog/hooks/usePosts";
import { formatDateTime } from "@/src/shared/utils/format";
import Loading from "@/src/shared/components/Loading";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const postId = parseInt(id, 10);
  const { data: post, isLoading, error } = usePostDetail(postId);

  if (isLoading) return <Loading />;

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
        <Link href="/blog" className="text-blue-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href="/blog"
        className="inline-block text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        &larr; 목록으로
      </Link>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {post.category.name}
            </span>
          )}
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded"
            >
              #{tag.name}
            </span>
          ))}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{post.author.username}</span>
          <span>{formatDateTime(post.publishedAt || post.createdAt)}</span>
          <span>조회 {post.viewCount}</span>
          <span>좋아요 {post.likeCount}</span>
        </div>
      </header>

      <div className="prose prose-gray max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{post.content}</Markdown>
      </div>
    </article>
  );
}
