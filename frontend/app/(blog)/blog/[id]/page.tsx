"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "@/src/modules/blog/components/MarkdownRenderer";
import { PUBLIC_READ_ONLY, canWritePosts } from "@/src/shell/auth/publicAccess";
import { usePostDetail, useDeletePost } from "@/src/modules/blog/hooks/usePosts";
import { useAuth } from "@/src/shell/auth/useAuth";
import { formatDateTime } from "@/src/shared/utils/format";
import Loading from "@/src/shared/components/Loading";
import LikeButton from "@/src/modules/blog/components/LikeButton";
import CommentSection from "@/src/modules/blog/components/CommentSection";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const postId = parseInt(id, 10);
  const router = useRouter();
  const { data: post, isLoading, error } = usePostDetail(postId);
  const deletePost = useDeletePost();
  const { user, isAuthenticated } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isAuthor =
    isAuthenticated && canWritePosts(user) && user && post && user.username === post.author.username;

  function handleDelete() {
    deletePost.mutate(postId, {
      onSuccess: () => {
        setDeleteOpen(false);
        router.push("/blog");
      },
    });
  }

  if (isLoading) return <Loading />;

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          게시글을 찾을 수 없습니다.
        </p>
        <Link href="/blog" className={buttonVariants({ variant: "link" })}>
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href="/blog"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-6" })}
      >
        &larr; 목록으로
      </Link>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <Badge variant="secondary">{post.category.name}</Badge>
          )}
          {post.tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              #{tag.name}
            </Badge>
          ))}
        </div>

        {post.visibility === "PRIVATE" && <Badge variant="outline" className="mb-3">비공개 · 나만 볼 수 있는 글</Badge>}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{post.author.username}</span>
          <span>{formatDateTime(post.publishedAt || post.createdAt)}</span>
          <span>조회 {post.viewCount}</span>
          {!PUBLIC_READ_ONLY && post.visibility !== "PRIVATE" && <LikeButton postId={post.id} likeCount={post.likeCount} />}
        </div>

        {isAuthor && (
          <div className="flex items-center gap-2 mt-4">
            <Link
              href={`/blog/editor/${post.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              수정
            </Link>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger
                render={<Button variant="destructive" size="sm" />}
              >
                삭제
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>게시글 삭제</DialogTitle>
                  <DialogDescription>
                    이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deletePost.isPending}
                  >
                    {deletePost.isPending ? "삭제 중..." : "삭제"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </header>

      <Separator className="mb-8" />

      <MarkdownRenderer content={post.content} />

      {!PUBLIC_READ_ONLY && post.visibility !== "PRIVATE" && post.status === "PUBLISHED" && <CommentSection postId={post.id} />}
    </article>
  );
}
