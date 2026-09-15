import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearDraft, loadDraft, useAutoSave, type DraftData } from "./useAutoSave";

const draft: DraftData = { title: "복구할 글", content: "입력 중인 본문", excerpt: "", tagIds: [], status: "DRAFT", savedAt: 1 };

beforeEach(() => { localStorage.clear(); clearDraft(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("작성 내용 보관", () => {
  it("탭에만 남은 복구본은 편집기 해제 후에도 새로고침 경고를 유지한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    const { unmount } = renderHook(() => useAutoSave(() => draft));
    unmount();
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    clearDraft();
    const afterClear = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(afterClear);
    expect(afterClear.defaultPrevented).toBe(false);
  });
  it("오래된 보관본보다 저장 실패 직전의 최신 입력을 복원한다", () => {
    localStorage.setItem("blog_draft_new", JSON.stringify(draft));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    const { result } = renderHook(() => useAutoSave(() => ({ ...draft, content: "최신 입력" })));
    act(() => { result.current.saveDraft(); });
    expect(loadDraft()?.content).toBe("최신 입력");
    expect(result.current.lastSavedAt).toBeNull();
    act(() => result.current.markSaved());
    expect(loadDraft()).toBeNull();
  });
  it("보관 실패 시 새로고침 확인을 유지한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    renderHook(() => useAutoSave(() => draft));
    const event = new Event("beforeunload", { cancelable: true });
    act(() => { window.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
    expect(loadDraft()?.content).toBe(draft.content);
  });
  it("원복 후 저장소 정리 실패를 숨기지 않는다", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
    const { result } = renderHook(() => useAutoSave(() => draft, undefined, { dirty: false }));
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.error).toContain("지우지 못했습니다");
  });
  it("하루가 지난 복구본도 자동 삭제하지 않는다", () => {
    localStorage.setItem("blog_draft_new", JSON.stringify(draft));
    expect(loadDraft()?.content).toBe(draft.content);
  });
  it("복원 결정 전에는 기존 복구본을 덮어쓰지 않는다", () => {
    localStorage.setItem("blog_draft_new", JSON.stringify({ ...draft, savedAt: Date.now() }));
    const { unmount } = renderHook(() => useAutoSave(() => ({ ...draft, content: "서버의 이전 내용" }), undefined, { enabled: false }));
    act(() => { vi.advanceTimersByTime(60_000); window.dispatchEvent(new Event("pagehide")); });
    unmount();
    expect(loadDraft()?.content).toBe(draft.content);
  });
  it("변경 후 2초 안에 최신 내용을 보관한다", () => {
    renderHook(() => useAutoSave(() => draft));
    act(() => vi.advanceTimersByTime(2000));
    expect(loadDraft()?.content).toBe(draft.content);
  });
  it("화면을 떠날 때 마지막 입력도 보관한다", () => {
    const { unmount } = renderHook(() => useAutoSave(() => draft));
    unmount();
    expect(loadDraft()?.content).toBe(draft.content);
  });
  it("서버 저장을 마친 내용은 화면을 떠나도 복구본으로 다시 만들지 않는다", () => {
    const { result, unmount } = renderHook(() => useAutoSave(() => draft));
    act(() => { result.current.saveDraft(); result.current.markSaved(); });
    unmount();
    expect(loadDraft()).toBeNull();
  });
  it("브라우저 저장 실패를 성공으로 표시하지 않는다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    const { result } = renderHook(() => useAutoSave(() => draft));
    act(() => { result.current.saveDraft(); });
    expect(result.current.error).toBeTruthy();
    expect(result.current.lastSavedAt).toBeNull();
  });
  it("나가기 직전 바뀐 최신 입력을 보관한다", () => {
    const { rerender } = renderHook(({ content }) => useAutoSave(() => ({ ...draft, content })), { initialProps: { content: "이전 입력" } });
    rerender({ content: "마지막 입력" });
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(loadDraft()?.content).toBe("마지막 입력");
  });
  it("서버 저장 후 새로 입력한 내용은 다시 보관한다", () => {
    const { result, rerender } = renderHook(({ content }) => useAutoSave(() => ({ ...draft, content })), { initialProps: { content: "저장 완료한 내용" } });
    act(() => result.current.markSaved());
    rerender({ content: "이후 수정한 내용" });
    act(() => vi.advanceTimersByTime(2000));
    expect(loadDraft()?.content).toBe("이후 수정한 내용");
  });

});
