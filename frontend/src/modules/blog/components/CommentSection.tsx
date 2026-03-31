"use client";

import Link from "next/link";
import { useAuth } from "@/src/shell/auth/useAuth";
import {
  useComments,
  useCreateComment,
} from "@/src/modules/blog/hooks/usePosts";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const { data: commentsData, isLoading } = useComments({ postId });
  const createComment = useCreateComment();

  function handleCreate(content: string) {
    createComment.mutate(
      { postId, request: { content } },
      {
        onSuccess: () => toast.success("댓글이 작성되었습니다."),
      }
    );
  }

  return (
    <section className="mt-12">
      <Separator className="mb-8" />
      <h2 className="text-lg font-semibold text-foreground mb-6">
        댓글 {commentsData ? `(${commentsData.totalElements})` : ""}
      </h2>

      {isAuthenticated ? (
        <div className="mb-6">
          <CommentForm
            onSubmit={handleCreate}
            isPending={createComment.isPending}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          댓글을 작성하려면{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            로그인
          </Link>
          하세요.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : commentsData?.empty ? (
        <p className="text-sm text-muted-foreground py-4">
          아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
        </p>
      ) : (
        <div className="divide-y divide-border">
          {commentsData?.content.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
