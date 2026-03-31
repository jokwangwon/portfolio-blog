import Link from "next/link";
import type { PostResponse } from "@/src/types/api";
import { formatDate } from "@/src/shared/utils/format";

interface PostCardProps {
  post: PostResponse;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <Link href={`/blog/${post.id}`}>
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {post.category.name}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{post.author.username}</span>
          <div className="flex items-center gap-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="text-gray-400">
                #{tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span>조회 {post.viewCount}</span>
          <span>좋아요 {post.likeCount}</span>
        </div>
      </Link>
    </article>
  );
}
