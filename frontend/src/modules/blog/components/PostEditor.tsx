"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type {
  PostRequest,
  PostResponse,
  CategoryResponse,
  TagResponse,
} from "@/src/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";

const RichEditor = dynamic(
  () => import("./editor/RichEditor"),
  { ssr: false, loading: () => <div className="min-h-[400px] animate-pulse bg-muted rounded-lg" /> }
);
import {
  useAutoSave,
  loadDraft,
  clearDraft,
  type DraftData,
} from "../hooks/useAutoSave";

interface PostEditorProps {
  initialData?: PostResponse;
  categories: CategoryResponse[];
  tags: TagResponse[];
  onSubmit: (data: PostRequest) => void;
  isPending: boolean;
  onCreateCategory?: (name: string) => Promise<CategoryResponse>;
  onDeleteCategory?: (id: number) => Promise<void>;
  onCreateTag?: (name: string) => Promise<TagResponse>;
  onDeleteTag?: (id: number) => Promise<void>;
  onSummarize?: (content: string, title: string) => Promise<string>;
  isSummarizing?: boolean;
}

export default function PostEditor({
  initialData,
  categories,
  tags,
  onSubmit,
  isPending,
  onCreateCategory,
  onDeleteCategory,
  onCreateTag,
  onDeleteTag,
  onSummarize,
  isSummarizing,
}: PostEditorProps) {
  const postId = initialData?.id;
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
  const [showSource, setShowSource] = useState(false);
  const [draftBanner, setDraftBanner] = useState<DraftData | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 임시저장 데이터 확인 (마운트 시 1회) — event callback으로 처리
  useEffect(() => {
    const saved = loadDraft(postId);
    if (!saved) return;
    const isNewer =
      !initialData ||
      saved.savedAt > new Date(initialData.updatedAt ?? initialData.createdAt).getTime();
    if (isNewer && (saved.title || saved.content)) {
      setDraftBanner(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 임시저장 복원
  function restoreDraft() {
    if (!draftBanner) return;
    setTitle(draftBanner.title);
    setContent(draftBanner.content);
    setExcerpt(draftBanner.excerpt);
    setCategoryId(draftBanner.categoryId);
    setSelectedTagIds(draftBanner.tagIds);
    setStatus(draftBanner.status);
    setDraftBanner(null);
  }

  // 임시저장 무시
  function dismissDraft() {
    clearDraft(postId);
    setDraftBanner(null);
  }

  // 자동 저장 데이터 수집
  const getData = useCallback(
    (): DraftData => ({
      title,
      content,
      excerpt,
      categoryId,
      tagIds: selectedTagIds,
      status,
      savedAt: Date.now(),
    }),
    [title, content, excerpt, categoryId, selectedTagIds, status]
  );

  // 자동 저장 훅
  const { saveDraft } = useAutoSave(getData, postId);

  // 저장 시각 갱신 (30초마다)
  useEffect(() => {
    if (!title.trim() && !content.trim()) return;
    const interval = setInterval(() => {
      const key = postId ? `blog_draft_edit_${postId}` : "blog_draft_new";
      try {
        const raw = localStorage.getItem(key);
        if (raw) setLastSavedAt(JSON.parse(raw).savedAt);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [postId, title, content]);

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
    // 제출 성공 후 임시저장 삭제 (onSuccess에서도 호출되지만 안전망)
    clearDraft(postId);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Tab → 들여쓰기
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent =
        content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        ta.setSelectionRange(start + 2, start + 2);
      });
    }
  }

  function formatSavedTime(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - ts) / 1000);
    if (diffSec < 60) return "방금 전";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      {/* 임시저장 복원 배너 */}
      {draftBanner && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-300/50 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700/50 px-4 py-3">
          <div className="text-sm">
            <span className="font-medium text-amber-800 dark:text-amber-200">
              임시저장된 글이 있습니다
            </span>
            <span className="text-amber-600 dark:text-amber-400 ml-2">
              ({formatSavedTime(draftBanner.savedAt)})
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={dismissDraft}>
              무시
            </Button>
            <Button size="sm" onClick={restoreDraft}>
              복원
            </Button>
          </div>
        </div>
      )}

      {/* 제목 */}
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

      {/* 요약 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="excerpt">요약 (선택)</Label>
          {onSummarize && (
            <button
              type="button"
              className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
              disabled={isSummarizing || !content.trim()}
              onClick={async () => {
                const summary = await onSummarize(content, title);
                if (summary) setExcerpt(summary);
              }}
            >
              {isSummarizing ? "AI 요약 생성 중..." : "AI 요약 생성"}
            </button>
          )}
        </div>
        <Input
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="게시글 요약 (목록에 표시됩니다)"
          maxLength={200}
        />
      </div>

      {/* 카테고리 / 상태 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="category">카테고리</Label>
            {onCreateCategory && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setShowCategoryInput((v) => !v)}
              >
                {showCategoryInput ? "취소" : "+ 추가"}
              </button>
            )}
          </div>
          {showCategoryInput && onCreateCategory && (
            <form
              className="flex gap-1"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCategoryName.trim()) return;
                const created = await onCreateCategory(newCategoryName.trim());
                setCategoryId(created.id);
                setNewCategoryName("");
                setShowCategoryInput(false);
              }}
            >
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="새 카테고리 이름"
                className="h-7 text-xs"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-7 text-xs px-2">
                생성
              </Button>
            </form>
          )}
          <div className="flex gap-1">
            <Select
              value={categoryId?.toString() ?? ""}
              onValueChange={(val) =>
                setCategoryId(val ? Number(val) : undefined)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="카테고리 없음" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">카테고리 없음</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {onDeleteCategory && categoryId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-destructive hover:text-destructive"
                title="선택한 카테고리 삭제"
                onClick={async () => {
                  if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
                  await onDeleteCategory(categoryId);
                  setCategoryId(undefined);
                }}
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">상태</Label>
          <Select
            value={status}
            onValueChange={(val) =>
              setStatus((val ?? "DRAFT") as "DRAFT" | "PUBLISHED")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">임시저장</SelectItem>
              <SelectItem value="PUBLISHED">발행</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 태그 */}
      <div className="space-y-2">
        <Label>태그</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={
                selectedTagIds.includes(tag.id) ? "default" : "outline"
              }
              className="cursor-pointer group"
              onClick={() => toggleTag(tag.id)}
            >
              #{tag.name}
              {onDeleteTag && (
                <button
                  type="button"
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`"${tag.name}" 태그를 삭제하시겠습니까?`)) return;
                    setSelectedTagIds((prev) => prev.filter((id) => id !== tag.id));
                    await onDeleteTag(tag.id);
                  }}
                >
                  ✕
                </button>
              )}
            </Badge>
          ))}
          {onCreateTag && (
            <form
              className="inline-flex items-center gap-1"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newTagName.trim()) return;
                const created = await onCreateTag(newTagName.trim());
                setSelectedTagIds((prev) => [...prev, created.id]);
                setNewTagName("");
              }}
            >
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="+ 새 태그"
                className="h-6 w-24 text-xs px-2 focus:w-32 transition-all"
              />
            </form>
          )}
        </div>
      </div>

      <Separator />

      {/* 에디터 본문 (WYSIWYG) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>본문</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowSource((v) => !v)}
          >
            {showSource ? "에디터로 돌아가기" : "마크다운 소스"}
          </button>
        </div>

        {showSource ? (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="마크다운으로 직접 작성하세요..."
            className="min-h-[400px] font-mono text-sm leading-relaxed rounded-lg border border-input"
            required
          />
        ) : (
          <div className="rounded-lg border border-input overflow-hidden">
            <RichEditor content={content} onChange={setContent} />
          </div>
        )}

        {/* 글자 수 + 자동 저장 상태 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {lastSavedAt && (
              <span>임시저장: {formatSavedTime(lastSavedAt)}</span>
            )}
            <button
              type="button"
              onClick={() => { saveDraft(); setLastSavedAt(Date.now()); }}
              className="text-primary hover:underline"
            >
              지금 저장
            </button>
          </div>
          <span>{content.length}자</span>
        </div>
      </div>

      {/* 제출 버튼 */}
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
