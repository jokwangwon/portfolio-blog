import Link from "next/link";
import type { PostResponse } from "@/src/types/api";
import { formatDate } from "@/src/shared/utils/format";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: PostResponse;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.id}`}>
      <Card className="glass-card transition-all duration-200 ease-out hover:-translate-y-0.5">
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            {post.category && (
              <Badge variant="secondary">{post.category.name}</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 tracking-tight">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{post.author.username}</span>
            <div className="flex items-center gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground gap-4">
          <span>조회 {post.viewCount}</span>
          <span>좋아요 {post.likeCount}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
