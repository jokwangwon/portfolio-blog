"use client";

import { useEffect, useRef, useCallback } from "react";

const PREFIX = "blog_draft_";
const SAVE_INTERVAL = 30_000; // 30 seconds
const EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface DraftData {
  title: string;
  content: string;
  excerpt: string;
  categoryId?: number;
  tagIds: number[];
  status: "DRAFT" | "PUBLISHED";
  savedAt: number;
}

function getKey(postId?: number): string {
  return postId ? `${PREFIX}edit_${postId}` : `${PREFIX}new`;
}

export function loadDraft(postId?: number): DraftData | null {
  try {
    const raw = localStorage.getItem(getKey(postId));
    if (!raw) return null;
    const data: DraftData = JSON.parse(raw);
    if (Date.now() - data.savedAt > EXPIRY) {
      localStorage.removeItem(getKey(postId));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearDraft(postId?: number): void {
  try {
    localStorage.removeItem(getKey(postId));
  } catch { /* ignore */ }
}

export function listLocalDrafts(): Array<DraftData & { key: string }> {
  const drafts: Array<DraftData & { key: string }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data: DraftData = JSON.parse(raw);
      if (Date.now() - data.savedAt > EXPIRY) {
        localStorage.removeItem(key);
        continue;
      }
      drafts.push({ ...data, key });
    }
  } catch { /* ignore */ }
  return drafts.sort((a, b) => b.savedAt - a.savedAt);
}

export function useAutoSave(
  getData: () => DraftData,
  postId?: number,
) {
  const getDataRef = useRef(getData);
  useEffect(() => {
    getDataRef.current = getData;
  });

  const saveDraft = useCallback(() => {
    try {
      const data = getDataRef.current();
      if (!data.title.trim() && !data.content.trim()) return;
      localStorage.setItem(getKey(postId), JSON.stringify(data));
    } catch { /* ignore */ }
  }, [postId]);

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(saveDraft, SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveDraft]);

  // Save on beforeunload
  useEffect(() => {
    const handler = () => saveDraft();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveDraft]);

  return { saveDraft };
}
