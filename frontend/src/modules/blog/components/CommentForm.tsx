"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isPending: boolean;
  placeholder?: string;
  submitLabel?: string;
  initialContent?: string;
  onCancel?: () => void;
}

export default function CommentForm({
  onSubmit,
  isPending,
  placeholder = "댓글을 작성하세요...",
  submitLabel = "댓글 작성",
  initialContent = "",
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px]"
        required
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !content.trim()}
        >
          {isPending ? "작성 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
