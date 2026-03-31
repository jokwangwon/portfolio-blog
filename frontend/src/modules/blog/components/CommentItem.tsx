"use client";

import { useState } from "react";
import type { CommentResponse } from "@/src/types/api";
import { useAuth } from "@/src/shell/auth/useAuth";
import {
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/src/modules/blog/hooks/usePosts";
import { formatDateTime } from "@/src/shared/utils/format";
import { Button } from "@/components/ui/button";
import CommentForm from "./CommentForm";
import { toast } from "sonner";

interface CommentItemProps {
  comment: CommentResponse;
  postId: number;
  depth?: number;
}

export default function CommentItem({
  comment,
  postId,
  depth = 0,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const createComment = useCreateComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const isOwner = isAuthenticated && user?.username === comment.author.username;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const maxDepth = 1; // 대댓글 최대 2단계 (0, 1)

  function handleReply(content: string) {
    createComment.mutate(
      { postId, request: { content, parentId: comment.id } },
      {
        onSuccess: () => {
          setReplying(false);
          toast.success("답글이 작성되었습니다.");
        },
      }
    );
  }

  function handleEdit(content: string) {
    updateCommentMutation.mutate(
      { postId, commentId: comment.id, request: { content } },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success("댓글이 수정되었습니다.");
        },
      }
    );
  }

  function handleDelete() {
    deleteCommentMutation.mutate(
      { postId, commentId: comment.id },
      {
        onSuccess: () => {
          setConfirmDelete(false);
          toast.success("댓글이 삭제되었습니다.");
        },
      }
    );
  }

  if (comment.deleted) {
    return (
      <div className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
        <p className="text-sm text-muted-foreground italic py-2">
          삭제된 댓글입니다.
        </p>
        {comment.replies?.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            postId={postId}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  const initial = comment.author.username.charAt(0).toUpperCase();

  return (
    <div className={`${depth > 0 ? "ml-10 border-l-2 border-muted pl-4" : ""}`}>
      <div className="py-3 flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">
                {comment.author.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isAuthenticated && depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                  onClick={() => setReplying(!replying)}
                >
                  답글
                </Button>
              )}
              {isOwner && !confirmDelete && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                    onClick={() => setEditing(!editing)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                    onClick={() => setConfirmDelete(true)}
                  >
                    삭제
                  </Button>
                </>
              )}
              {confirmDelete && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">삭제할까요?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setConfirmDelete(false)}
                  >
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleDelete}
                    disabled={deleteCommentMutation.isPending}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <CommentForm
              onSubmit={handleEdit}
              isPending={updateCommentMutation.isPending}
              initialContent={comment.content}
              placeholder="댓글을 수정하세요..."
              submitLabel="수정"
              onCancel={() => setEditing(false)}
            />
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {replying && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                isPending={createComment.isPending}
                placeholder={`@${comment.author.username} 에게 답글 작성`}
                submitLabel="답글 작성"
                onCancel={() => setReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
