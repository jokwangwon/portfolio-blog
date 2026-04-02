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
import dynamic from "next/dynamic";
import EditorToolbar from "./EditorToolbar";
import MarkdownRenderer from "./MarkdownRenderer";

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
}

export default function PostEditor({
  initialData,
  categories,
  tags,
  onSubmit,
  isPending,
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
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">(
    "edit"
  );
  const [draftBanner, setDraftBanner] = useState<DraftData | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
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
        <Label htmlFor="excerpt">요약 (선택)</Label>
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
          <Label htmlFor="category">카테고리</Label>
          <select
            id="category"
            value={categoryId ?? ""}
            onChange={(e) =>
              setCategoryId(
                e.target.value ? Number(e.target.value) : undefined
              )
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
            onChange={(e) =>
              setStatus(e.target.value as "DRAFT" | "PUBLISHED")
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="DRAFT">임시저장</option>
            <option value="PUBLISHED">발행</option>
          </select>
        </div>
      </div>

      {/* 태그 */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>태그</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={
                  selectedTagIds.includes(tag.id) ? "default" : "outline"
                }
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

      {/* 에디터 본문 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>본문</Label>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("edit")}
            >
              에디터
            </Button>
            <Button
              variant={viewMode === "split" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("split")}
            >
              마크다운
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("preview")}
            >
              미리보기
            </Button>
          </div>
        </div>

        {/* 리치 에디터 모드 (기본) */}
        {viewMode === "edit" && (
          <div className="rounded-lg border border-input overflow-hidden">
            <RichEditor content={content} onChange={setContent} />
          </div>
        )}

        {/* 마크다운 직접 편집 모드 */}
        {viewMode === "split" && (
          <div>
            <EditorToolbar
              textareaRef={textareaRef}
              onInsert={setContent}
            />
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="마크다운으로 직접 작성하세요..."
              className="min-h-[400px] font-mono text-sm leading-relaxed"
              required
            />
          </div>
        )}

        {/* 미리보기 모드 */}
        {viewMode === "preview" && (
          <div className="glass-card rounded-lg p-6 min-h-[400px]">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-muted-foreground">
                미리보기할 내용이 없습니다.
              </p>
            )}
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
