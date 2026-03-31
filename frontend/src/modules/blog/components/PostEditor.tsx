"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PostRequest, PostResponse, CategoryResponse, TagResponse } from "@/src/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PostEditorProps {
  initialData?: PostResponse;
  categories: CategoryResponse[];
  tags: TagResponse[];
  onSubmit: (data: PostRequest) => void;
  isPending: boolean;
}

export default function PostEditor({
  initialData,
  categories,
  tags,
  onSubmit,
  isPending,
}: PostEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialData?.category?.id
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    initialData?.tags.map((t) => t.id) ?? []
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialData?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"
  );
  const [previewMode, setPreviewMode] = useState(false);

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  function handleSubmit() {
    onSubmit({
      title,
      content,
      excerpt: excerpt || undefined,
      categoryId,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      status,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="게시글 제목을 입력하세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">요약 (선택)</Label>
        <Input
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="게시글 요약 (목록에 표시됩니다)"
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <select
            id="category"
            value={categoryId ?? ""}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">카테고리 없음</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">상태</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="DRAFT">임시저장</option>
            <option value="PUBLISHED">발행</option>
          </select>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>태그</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.id)}
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>본문 (마크다운)</Label>
          <div className="flex gap-1">
            <Button
              variant={previewMode ? "outline" : "default"}
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              편집
            </Button>
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(true)}
            >
              미리보기
            </Button>
          </div>
        </div>

        {previewMode ? (
          <Card>
            <CardContent className="prose prose-neutral max-w-none min-h-[300px]">
              {content ? (
                <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
              ) : (
                <p className="text-muted-foreground">미리보기할 내용이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="마크다운으로 게시글을 작성하세요..."
            className="min-h-[300px] font-mono"
            required
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isPending}
        >
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !content.trim()}
        >
          {isPending
            ? "저장 중..."
            : initialData
              ? "수정"
              : "저장"}
        </Button>
      </div>
    </div>
  );
}
