"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useNavigationGuard } from "@/src/shared/hooks/useNavigationGuard";
import type { PostRequest, PostResponse, CategoryResponse, TagResponse } from "@/src/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "./MarkdownRenderer";
import { useAutoSave, loadDraft, clearDraft, type DraftData } from "../hooks/useAutoSave";

const RichEditor = dynamic(() => import("./editor/RichEditor"), {
  ssr: false,
  loading: () => <div role="status" className="min-h-[320px] p-6 text-muted-foreground">편집기를 준비하고 있습니다…</div>,
});
interface PostEditorProps {
  initialData?: PostResponse;
  categories: CategoryResponse[];
  tags: TagResponse[];
  onSubmit: (data: PostRequest) => Promise<PostResponse>;
  onSaved?: (post: PostResponse) => void;
  isPending: boolean;
  onCreateCategory?: (name: string) => Promise<CategoryResponse>;
  onDeleteCategory?: (id: number) => Promise<void>;
  onCreateTag?: (name: string) => Promise<TagResponse>;
  onDeleteTag?: (id: number) => Promise<void>;
  onSummarize?: (content: string, title: string) => Promise<string>;
  isSummarizing?: boolean;
}
const fingerprint = (data: { title: string; content: string; excerpt?: string; categoryId?: number; tagIds: number[]; visibility?: "PUBLIC" | "PRIVATE" }) =>
  JSON.stringify([data.title, data.content, data.excerpt || "", data.categoryId, data.tagIds, data.visibility ?? "PUBLIC"]);

export default function PostEditor({ initialData, categories, tags, onSubmit, onSaved, isPending,
  onCreateCategory, onDeleteCategory, onCreateTag, onDeleteTag, onSummarize, isSummarizing }: PostEditorProps) {
  const router = useRouter();
  const postId = initialData?.id;
  const published = initialData?.status === "PUBLISHED";
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState<number | undefined>(initialData?.category?.id);
  const [tagIds, setTagIds] = useState(initialData?.tags.map(t => t.id) ?? []);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(initialData?.visibility ?? "PUBLIC");
  const [mode, setMode] = useState<"edit" | "source" | "preview">("edit");
  const [draftBanner, setDraftBanner] = useState<DraftData | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const requestInFlight = useRef(false);
  const initialSnapshot = useRef(fingerprint({ title, content, excerpt, categoryId, tagIds, visibility }));
  const [baseline, setBaseline] = useState(initialSnapshot.current);
  const snapshot = fingerprint({ title, content, excerpt, categoryId, tagIds, visibility });
  const dirty = snapshot !== baseline;
  const blocked = !checked || !!draftBanner || busy || isPending || actionBusy;

  useEffect(() => {
    const saved = loadDraft(postId);
    if (saved && fingerprint(saved) !== initialSnapshot.current) setDraftBanner(saved);
    setChecked(true);
  }, [postId]);

  const getData = useCallback((): DraftData => ({ title, content, excerpt, categoryId, tagIds,
    status: published ? "PUBLISHED" : "DRAFT", visibility, savedAt: Date.now() }),
  [title, content, excerpt, categoryId, tagIds, published, visibility]);
  const { saveDraft, markSaved, lastSavedAt, error: storageError } = useAutoSave(getData, postId, {
    enabled: checked && !draftBanner, dirty,
  });

  const canLeave = useCallback(() => {
    if (!checked || draftBanner) return true;
    return saveDraft() || window.confirm("브라우저 보관에 실패했습니다. 새로고침하거나 탭을 닫으면 내용이 사라질 수 있습니다. 서버에 저장하거나 내용을 복사하려면 취소해 주세요. 이동할까요?");
  }, [checked, draftBanner, saveDraft]);
  useNavigationGuard(canLeave);

  function restoreDraft() {
    if (!draftBanner) return;
    setTitle(draftBanner.title); setContent(draftBanner.content); setExcerpt(draftBanner.excerpt);
    setCategoryId(draftBanner.categoryId); setTagIds(draftBanner.tagIds);
    setVisibility(draftBanner.visibility ?? initialData?.visibility ?? "PUBLIC"); setDraftBanner(null);
    setMessage("브라우저 복구본을 불러왔습니다. 공개 범위를 확인한 뒤 서버에 저장해 주세요.");
  }
  function dismissDraft() {
    if (!window.confirm("이 브라우저의 복구본을 버리고 현재 서버 내용으로 시작할까요?")) return;
    if (clearDraft(postId)) setDraftBanner(null);
    else setSubmitError("복구본을 지우지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
  }

  const handleSubmit = useCallback(async (status: "DRAFT" | "PUBLISHED") => {
    if (blocked || requestInFlight.current) return;
    if (!title.trim() || !content.trim() || title.length > 255 || excerpt.length > 200) {
      setSubmitError("제목(255자 이하)과 본문을 입력하고 요약을 200자 이하로 작성해 주세요.");
      return;
    }
    saveDraft();
    requestInFlight.current = true;
    setBusy(true); setSubmitError(""); setMessage("");
    try {
      const post = await onSubmit({ title: title.trim(), content, excerpt: excerpt || undefined,
        categoryId, tagIds, visibility, status: published ? "PUBLISHED" : status });
      markSaved();
      setBaseline(snapshot);
      setMessage(post.status === "PUBLISHED" ? (post.visibility === "PRIVATE" ? "비공개 글을 저장했습니다." : "공개 글을 저장했습니다.") : "서버에 임시저장했습니다. 계속 작성할 수 있습니다.");
      onSaved?.(post);
    } catch {
      setSubmitError("서버에 저장하지 못했습니다. 내용은 이 화면에 남아 있습니다. 연결 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      requestInFlight.current = false;
      setBusy(false);
    }
  }, [blocked, title, content, excerpt, saveDraft, onSubmit, categoryId, tagIds, visibility, published, markSaved, snapshot, onSaved]);

  useEffect(() => {
    const save = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSubmit(published ? "PUBLISHED" : "DRAFT");
      }
    };
    window.addEventListener("keydown", save);
    return () => window.removeEventListener("keydown", save);
  }, [handleSubmit, published]);

  async function runAction(action: () => Promise<void>) {
    if (blocked) return;
    setActionBusy(true); setSubmitError("");
    try { await action(); }
    catch { setSubmitError("요청을 처리하지 못했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요."); }
    finally { setActionBusy(false); }
  }

  return (
    <div className="space-y-5 min-w-0">
      {draftBanner && (
        <div className="rounded-xl border border-border bg-muted p-4 space-y-3" role="status">
          <p className="font-medium">이 브라우저에 복구할 글이 있습니다.</p>
          <p className="text-sm text-muted-foreground break-words">{draftBanner.title || "제목 없는 글"} · {new Date(draftBanner.savedAt).toLocaleString("ko-KR")}</p>
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-11" onClick={restoreDraft}>복원</Button>
            <Button variant="outline" className="min-h-11" onClick={dismissDraft}>복구본 버리기</Button>
          </div>
        </div>
      )}
      <fieldset disabled={blocked} className="space-y-5 min-w-0" aria-busy={busy || isPending}>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-3"><Label htmlFor="title">제목</Label><span className="text-xs text-muted-foreground">{title.length}/255</span></div>
          <Input id="title" value={title} onChange={e => { setTitle(e.target.value); setMessage(""); }} placeholder="어떤 경험을 기록할까요?" maxLength={255} className="h-12 text-lg md:text-lg" />
        </div>
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2">
            <div className="flex gap-1" role="group" aria-label="본문 보기 방식">
              {([['edit', '편집'], ['source', '마크다운'], ['preview', '미리보기']] as const).map(([value, label]) => (
                <Button key={value} variant={mode === value ? "secondary" : "ghost"} className="min-h-11" aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</Button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground px-2">본문 {content.length.toLocaleString()}자</span>
          </div>
          <div inert={blocked}>
            {mode === "preview" ? (
              <section aria-label="글 미리보기" className="p-4 sm:p-6 min-h-[320px] break-keep [overflow-wrap:anywhere]">
                <h2 className="text-2xl font-bold mb-4">{title || "제목 없는 글"}</h2>
                {excerpt && <p className="text-muted-foreground mb-6">{excerpt}</p>}
                {content.trim() ? <MarkdownRenderer content={content} /> : <p className="text-muted-foreground">본문을 입력하면 발행 화면의 형식으로 확인할 수 있습니다.</p>}
              </section>
            ) : mode === "source" ? (
              <Textarea aria-label="마크다운 본문" value={content} onChange={e => setContent(e.target.value)} placeholder="마크다운으로 작성하세요…" className="min-h-[400px] border-0 rounded-none font-mono text-sm leading-relaxed p-4" />
            ) : <RichEditor content={content} onChange={setContent} />}
          </div>
        </div>
        <details className="rounded-xl border border-border p-4">
          <summary className="cursor-pointer font-medium min-h-8">요약·카테고리·태그 <span className="text-sm font-normal text-muted-foreground">(선택)</span></summary>
          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <Label htmlFor="excerpt">요약 · {excerpt.length}/200</Label>
                {onSummarize && <Button variant="outline" className="min-h-11" disabled={isSummarizing || !content.trim()} onClick={() => void runAction(async () => { const result = await onSummarize(content, title); if (result) setExcerpt(result.slice(0, 200)); })}>{isSummarizing ? "요약 생성 중…" : "AI 요약 생성"}</Button>}
              </div>
              <Textarea id="excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)} maxLength={200} placeholder="글 목록에서 보여줄 짧은 소개를 작성하세요." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <select id="category" value={categoryId ?? ""} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)} className="w-full min-h-11 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">카테고리 없음</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>태그</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => <Button key={tag.id} variant={tagIds.includes(tag.id) ? "secondary" : "outline"} aria-pressed={tagIds.includes(tag.id)} className="min-h-11 max-w-full whitespace-normal break-all" onClick={() => setTagIds(ids => ids.includes(tag.id) ? ids.filter(id => id !== tag.id) : [...ids, tag.id])}>#{tag.name}</Button>)}
                {!tags.length && <p className="text-sm text-muted-foreground">등록된 태그가 없습니다.</p>}
              </div>
            </div>
            <details className="border-t border-border pt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground min-h-8">카테고리·태그 관리</summary>
              <div className="space-y-3 pt-3">
                {onCreateCategory && <div className="flex gap-2"><Input aria-label="새 카테고리 이름" maxLength={100} value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="새 카테고리 이름" className="min-h-11" /><Button variant="outline" className="min-h-11" disabled={!newCategoryName.trim()} onClick={() => void runAction(async () => { const cat = await onCreateCategory(newCategoryName.trim()); setCategoryId(cat.id); setNewCategoryName(""); })}>추가</Button></div>}
                {onCreateTag && <div className="flex gap-2"><Input aria-label="새 태그 이름" maxLength={50} value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="새 태그 이름" className="min-h-11" /><Button variant="outline" className="min-h-11" disabled={!newTagName.trim()} onClick={() => void runAction(async () => { const tag = await onCreateTag(newTagName.trim()); setTagIds(ids => [...new Set([...ids, tag.id])]); setNewTagName(""); })}>추가</Button></div>}
                {onDeleteCategory && categoryId && <Button variant="ghost" className="min-h-11 text-destructive" onClick={() => { if (confirm("선택한 카테고리를 삭제할까요? 다른 글의 분류에도 영향을 줄 수 있습니다.")) void runAction(async () => { await onDeleteCategory(categoryId); setCategoryId(undefined); }); }}>선택한 카테고리 삭제</Button>}
                {onDeleteTag && <div className="flex flex-wrap gap-2">{tags.map(tag => <Button key={tag.id} variant="ghost" className="min-h-11 max-w-full whitespace-normal break-all text-destructive" onClick={() => { if (confirm(`“${tag.name}” 태그를 삭제할까요? 다른 글에도 영향을 줄 수 있습니다.`)) void runAction(async () => { await onDeleteTag(tag.id); setTagIds(ids => ids.filter(id => id !== tag.id)); }); }}>#{tag.name} 삭제</Button>)}</div>}
              </div>
            </details>
          </div>
        </details>
      </fieldset>
      <div className="md:sticky bottom-0 z-30 rounded-xl border border-border bg-background p-4 shadow-sm space-y-3">
        {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
        {storageError && <p role="alert" className="text-sm text-destructive">{storageError}</p>}
        <p role="status" className="text-xs text-muted-foreground">
          {(!dirty && message) || (dirty ? (lastSavedAt ? `브라우저 복구본 보관: ${new Date(lastSavedAt).toLocaleTimeString("ko-KR")} · 서버에는 아직 저장하지 않았습니다.` : "변경 내용을 브라우저에 보관하고 있습니다…") : published ? (initialData?.visibility === "PRIVATE" ? "현재 비공개 글입니다." : "현재 공개된 글입니다.") : "임시저장한 글은 방문자에게 공개되지 않습니다.")}
        </p>
        <div className="space-y-2">
          <Label htmlFor="post-visibility">공개 범위</Label>
          <select id="post-visibility" value={visibility} disabled={blocked} onChange={event => { setVisibility(event.target.value as "PUBLIC" | "PRIVATE"); setMessage(""); }} className="block w-full min-h-11 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="PUBLIC">공개 — 누구나 읽을 수 있음</option>
            <option value="PRIVATE">비공개 — 나만 읽을 수 있음</option>
          </select>
          <p className="text-xs text-muted-foreground">공개 범위는 저장할 때 적용됩니다. 초안은 선택과 관계없이 나만 볼 수 있습니다.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" className="min-h-11" disabled={blocked} onClick={() => { if (canLeave()) router.push("/blog/drafts"); }}>내 기록</Button>
          <div className="flex flex-wrap gap-2">
            {!published && <Button variant="outline" className="min-h-11" disabled={blocked || !title.trim() || !content.trim()} onClick={() => void handleSubmit("DRAFT")}>{busy ? "저장 중…" : "임시저장"}</Button>}
            <Button className="min-h-11" disabled={blocked || !title.trim() || !content.trim()} onClick={() => void handleSubmit("PUBLISHED")}>{busy ? "저장 중…" : visibility === "PRIVATE" ? "비공개 저장" : published ? "변경 사항 저장" : "발행하기"}</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{visibility === "PRIVATE" ? "비공개로 저장한 글은 본인만 읽을 수 있습니다." : published ? "저장하면 누구나 읽을 수 있습니다." : "발행하면 누구나 읽을 수 있습니다."} Ctrl/Cmd+S로 {published ? "변경 사항을 저장" : "임시저장"}할 수 있습니다.</p>
      </div>
    </div>
  );
}
