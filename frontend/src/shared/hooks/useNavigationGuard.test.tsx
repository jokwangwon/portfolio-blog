import { fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Link from "next/link";
import { requestEditorLeave, useNavigationGuard } from "./useNavigationGuard";

afterEach(() => vi.restoreAllMocks());
describe("편집 화면 이탈 확인", () => {
  it("프로그램 이동과 로그아웃 요청을 취소하고 해제 후에는 통과시킨다", () => {
    const { unmount } = renderHook(() => useNavigationGuard(() => false));
    expect(requestEditorLeave()).toBe(false);
    unmount();
    expect(requestEditorLeave()).toBe(true);
  });
  it("확인된 이동은 한 번 검사하고 통과시킨다", () => {
    const allow = vi.fn(() => true);
    renderHook(() => useNavigationGuard(allow));
    expect(requestEditorLeave()).toBe(true);
    expect(allow).toHaveBeenCalledTimes(1);
  });
  it("새 탭과 앵커 이동은 편집 화면을 떠나지 않는다", () => {
    const guard = vi.fn(() => false);
    renderHook(() => useNavigationGuard(guard));
    const { getByText } = render(<><Link href="/blog" target="_blank">새 탭</Link><Link href="#body">본문</Link><Link href="/blog">목록</Link></>);
    fireEvent.click(getByText("새 탭"));
    fireEvent.click(getByText("본문"));
    fireEvent.click(getByText("목록"), { ctrlKey: true });
    expect(guard).not.toHaveBeenCalled();
  });
});
