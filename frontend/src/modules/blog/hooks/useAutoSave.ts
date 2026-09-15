"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const PREFIX = "blog_draft_";
// Only used when persistent storage fails; survives SPA navigation in this tab.
const fallbackDrafts = new Map<string, DraftData>();
function protectFallbackDrafts(event: BeforeUnloadEvent) {
  if (!fallbackDrafts.size) return;
  event.preventDefault();
  event.returnValue = "";
}
function removeFallback(key: string) {
  fallbackDrafts.delete(key);
  if (!fallbackDrafts.size) window.removeEventListener("beforeunload", protectFallbackDrafts);
}
export interface DraftData {
  title: string;
  content: string;
  excerpt: string;
  categoryId?: number;
  tagIds: number[];
  status: "DRAFT" | "PUBLISHED";
  visibility?: "PUBLIC" | "PRIVATE";
  savedAt: number;
}

function getKey(postId?: number) {
  return postId ? `${PREFIX}edit_${postId}` : `${PREFIX}new`;
}
function parseDraft(raw: string | null): DraftData | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (typeof data.title !== "string" || typeof data.content !== "string" ||
        typeof data.excerpt !== "string" || !Array.isArray(data.tagIds) ||
        !data.tagIds.every((id: unknown) => typeof id === "number") ||
        (data.categoryId !== undefined && typeof data.categoryId !== "number") ||
        (data.visibility !== undefined && !["PUBLIC", "PRIVATE"].includes(data.visibility)) ||
        !["DRAFT", "PUBLISHED"].includes(data.status) || !Number.isFinite(data.savedAt)) return null;
    return data;
  } catch { return null; }
}
export function loadDraft(postId?: number): DraftData | null {
  const fallback = fallbackDrafts.get(getKey(postId));
  if (fallback) return fallback;
  try { return parseDraft(localStorage.getItem(getKey(postId))); }
  catch { return null; }
}
export function clearDraft(postId?: number): boolean {
  try { localStorage.removeItem(getKey(postId)); removeFallback(getKey(postId)); return true; }
  catch { return false; }
}
export function listLocalDrafts(): Array<DraftData & { key: string }> {
  const drafts: Array<DraftData & { key: string }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const data = parseDraft(localStorage.getItem(key));
      if (data) drafts.push({ ...data, key });
    }
  } catch { /* Storage may be unavailable. */ }
  const combined = new Map(drafts.map(draft => [draft.key, draft]));
  fallbackDrafts.forEach((draft, key) => combined.set(key, { ...draft, key }));
  return [...combined.values()].sort((a, b) => b.savedAt - a.savedAt);
}
function signature(data: DraftData) {
  return JSON.stringify([data.title, data.content, data.excerpt, data.categoryId, data.tagIds, data.status, data.visibility]);
}

export function useAutoSave(getData: () => DraftData, postId?: number, { enabled = true, dirty = true }: { enabled?: boolean; dirty?: boolean } = {}) {
  const current = useRef({ getData, enabled, dirty });
  const serverSaved = useRef<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latestError = useRef(error);
  useEffect(() => { latestError.current = error; });
  useEffect(() => { current.current = { getData, enabled, dirty }; });

  const persist = useCallback((notify = true): boolean => {
    const { getData: read, enabled: active, dirty: changed } = current.current;
    if (!active) return false;
    const data = read();
    if (!changed || signature(data) === serverSaved.current) {
      const cleared = clearDraft(postId);
      if (notify) {
        setLastSavedAt(null);
        setError(cleared ? null : "이전 복구본을 지우지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
      }
      return cleared;
    }
    try {
      const savedAt = Date.now();
      localStorage.setItem(getKey(postId), JSON.stringify({ ...data, savedAt }));
      removeFallback(getKey(postId));
      if (notify) { setLastSavedAt(savedAt); setError(null); }
      return true;
    } catch {
      fallbackDrafts.set(getKey(postId), { ...data, savedAt: Date.now() });
      window.addEventListener("beforeunload", protectFallbackDrafts);
      if (notify) {
        setLastSavedAt(null);
        setError("이 브라우저에 복구본을 보관하지 못했습니다. 현재 탭에서만 임시로 유지됩니다. 새로고침·탭 닫기 전에 서버에 저장하거나 내용을 복사해 주세요.");
      }
      return false;
    }
  }, [postId]);
  const saveDraft = useCallback(() => persist(), [persist]);
  const markSaved = useCallback(() => {
    serverSaved.current = signature(current.current.getData());
    const cleared = clearDraft(postId);
    setLastSavedAt(null);
    setError(cleared ? null : "서버 저장은 완료했지만 브라우저의 이전 복구본을 지우지 못했습니다.");
  }, [postId]);

  useEffect(() => {
    if (!enabled) return;
    const timeout = setTimeout(saveDraft, dirty ? 1500 : 0);
    return () => clearTimeout(timeout);
  }, [getData, enabled, dirty, saveDraft]);

  useEffect(() => {
    const hide = () => { persist(false); };
    const visibility = () => { if (document.visibilityState === "hidden") hide(); };
    const unload = (event: BeforeUnloadEvent) => {
      if (!current.current.enabled || (!current.current.dirty && !latestError.current) || (signature(current.current.getData()) === serverSaved.current && !latestError.current)) return;
      persist(false);
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("pagehide", hide);
    window.addEventListener("beforeunload", unload);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      persist(false);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [persist]);

  return { saveDraft, markSaved, lastSavedAt, error };
}
