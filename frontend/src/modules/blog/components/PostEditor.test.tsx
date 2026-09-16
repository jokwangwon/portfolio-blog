import { fetchPostById } from "../api/blogApi";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Link from "next/link";
import PostEditor from "./PostEditor";
import { clearDraft, loadDraft } from "../hooks/useAutoSave";
import { convertInlineImages } from "../api/attachmentApi";
vi.mock("../api/attachmentApi", () => ({ convertInlineImages: vi.fn() }));
import type { PostResponse } from "@/src/types/api";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/dynamic", () => ({ default: () => function Editor({ content, onChange, onBusyChange }: { content: string; onChange: (s: string) => void; onBusyChange?: (busy: boolean) => void }) { return <><textarea aria-label="본문 편집" value={content} onChange={e => onChange(e.target.value)} /><button onClick={() => onBusyChange?.(true)}>업로드 시작 테스트</button></>; } }));
vi.mock("./MarkdownRenderer", () => ({ default: ({ content }: { content: string }) => <article>{content}</article> }));
vi.mock("../api/blogApi", () => ({ fetchPostById: vi.fn() }));
const savedPost = { editVersion: 0, id: 7, title: "제목", content: "본문", status: "DRAFT", tags: [], author: { id: 1, username: "admin" }, updatedAt: "2026-09-13T00:00:00" } as PostResponse;
function write() { fireEvent.change(screen.getByLabelText("제목"), { target: { value: "제목" } }); fireEvent.change(screen.getByLabelText("본문 편집"), { target: { value: "본문" } }); }
beforeEach(() => { localStorage.clear(); clearDraft(); clearDraft(7); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("글 작성 저장 흐름", () => {
  it("이미지 업로드 중 서버 저장과 키보드 저장을 잠근다", () => {
    const onSubmit = vi.fn();
    render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} />);
    write();
    fireEvent.click(screen.getByRole("button", { name: "업로드 시작 테스트" }));
    expect(screen.getByRole("button", { name: "임시저장" })).toBeDisabled();
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it("기존 인라인 이미지 변환 후 글 저장 실패 시 원래 본문과 복구본을 유지한다", async () => {
    const content = "![image](data:image/png;base64,aGVsbG8=)";
    const converted = "![image](/api/portal/attachments/12345678-1234-1234-1234-123456789abc)";
    vi.mocked(convertInlineImages).mockResolvedValue(converted);
    const onSubmit = vi.fn().mockRejectedValue(new Error("offline"));
    render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} />);
    write(); fireEvent.change(screen.getByLabelText("본문 편집"), { target: { value: content } });
    fireEvent.click(screen.getByRole("button", { name: "임시저장" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ content: converted })));
    expect(await screen.findByRole("alert")).toHaveTextContent("서버에 저장하지 못했습니다");
    expect(screen.getByLabelText("본문 편집")).toHaveValue(content);
    expect(loadDraft()?.content).toBe(content);
  });
  it("인라인 이미지 변환 성공 후 저장 본문을 확정하고 복구본을 정리한다", async () => {
    const converted = "![image](/api/portal/attachments/12345678-1234-1234-1234-123456789abc)";
    vi.mocked(convertInlineImages).mockResolvedValue(converted);
    const onSubmit = vi.fn().mockResolvedValue({ ...savedPost, content: converted });
    render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} />);
    write(); fireEvent.change(screen.getByLabelText("본문 편집"), { target: { value: "![image](data:image/png;base64,aGVsbG8=)" } });
    fireEvent.click(screen.getByRole("button", { name: "임시저장" }));
    await waitFor(() => expect(screen.getByLabelText("본문 편집")).toHaveValue(converted));
    expect(loadDraft()).toBeNull();
  });
  it("비공개 완성 글을 저장하고 실패해도 공개 범위를 복구본에 보존한다", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("offline"));
    render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} />);
    write();
    fireEvent.change(screen.getByLabelText("공개 범위"), { target: { value: "PRIVATE" } });
    fireEvent.click(screen.getByRole("button", { name: "비공개 저장" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: "PUBLISHED", visibility: "PRIVATE" })));
    expect(await screen.findByRole("alert")).toHaveTextContent("서버에 저장하지 못했습니다");
    expect(loadDraft()?.visibility).toBe("PRIVATE");
    expect(screen.getByLabelText("공개 범위")).toHaveValue("PRIVATE");
  });
  it("공개 범위만 변경해도 Ctrl+S가 작성 상태를 유지해 저장한다", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ...savedPost, status: "PUBLISHED", visibility: "PRIVATE" });
    render(<PostEditor initialData={{ ...savedPost, status: "PUBLISHED", visibility: "PUBLIC" }} categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("공개 범위"), { target: { value: "PRIVATE" } });
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: "PUBLISHED", visibility: "PRIVATE" })));
  });
  it("이전 형식 복구본을 복원해도 서버의 비공개 설정을 유지한다", () => {
    localStorage.setItem("blog_draft_edit_7", JSON.stringify({ title: "복구 제목", content: "복구 본문", excerpt: "", tagIds: [], status: "PUBLISHED", savedAt: Date.now() }));
    render(<PostEditor initialData={{ ...savedPost, status: "PUBLISHED", visibility: "PRIVATE" }} categories={[]} tags={[]} isPending={false} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "복원" }));
    expect(screen.getByLabelText("공개 범위")).toHaveValue("PRIVATE");
    expect(screen.getByLabelText("본문 편집")).toHaveValue("복구 본문");
  });

  it("서버 내용으로 원복하면 중간 복구본이 재진입 때 나타나지 않는다", () => {
    vi.useFakeTimers();
    const props = { initialData: savedPost, categories: [], tags: [], isPending: false, onSubmit: vi.fn() };
    const { unmount } = render(<PostEditor {...props} />);
    fireEvent.change(screen.getByLabelText("본문 편집"), { target: { value: "취소할 수정" } });
    act(() => vi.advanceTimersByTime(2000));
    expect(loadDraft(7)?.content).toBe("취소할 수정");
    fireEvent.change(screen.getByLabelText("본문 편집"), { target: { value: savedPost.content } });
    unmount();
    expect(loadDraft(7)).toBeNull();
    render(<PostEditor {...props} />);
    expect(screen.queryByRole("button", { name: "복원" })).not.toBeInTheDocument();
  });
  it("보관 실패 중 메뉴 이동 취소 시 마지막 입력을 유지한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<><Link href="/blog">블로그</Link><PostEditor categories={[]} tags={[]} isPending={false} onSubmit={vi.fn()} /></>);
    write();
    expect(fireEvent.click(screen.getByRole("link", { name: "블로그" }))).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("본문 편집")).toHaveValue("본문");
  });
  it("보관 실패 후 내부 이동으로 해제돼도 이 탭에서 복원한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    const props = { categories: [], tags: [], isPending: false, onSubmit: vi.fn() };
    const { unmount } = render(<PostEditor {...props} />);
    write(); unmount();
    render(<PostEditor {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "복원" }));
    expect(screen.getByLabelText("본문 편집")).toHaveValue("본문");
  });
  it("서버 저장 실패 시 복구본을 남기고 오류를 안내한다", async () => {
    render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={vi.fn().mockRejectedValue(new Error("offline"))} />);
    write(); fireEvent.click(screen.getByRole("button", { name: "임시저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("서버에 저장하지 못했습니다");
    expect(loadDraft()?.content).toBe("본문");
    expect(screen.getByLabelText("본문 편집")).toHaveValue("본문");
  });
  it("성공 응답 전에는 복구본을 지우지 않고 중복 요청을 막는다", async () => {
    let resolve!: (p: PostResponse) => void;
    const onSubmit = vi.fn(() => new Promise<PostResponse>(done => { resolve = done; }));
    const onSaved = vi.fn();
    const { unmount } = render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} onSaved={onSaved} />);
    write(); fireEvent.click(screen.getByRole("button", { name: "임시저장" }));
    expect(loadDraft()?.content).toBe("본문");
    expect(screen.getByLabelText("제목")).toBeDisabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => resolve(savedPost));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(savedPost));
    unmount(); expect(loadDraft()).toBeNull();
  });
  it("복원 선택 전에 편집을 잠그고 복원 후 내용을 유지한다", async () => {
    localStorage.setItem("blog_draft_new", JSON.stringify({ title: "복구 제목", content: "복구 본문", excerpt: "", tagIds: [], status: "DRAFT", savedAt: Date.now() }));
    render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("제목")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "복원" }));
    expect(screen.getByLabelText("제목")).toHaveValue("복구 제목");
    expect(screen.getByLabelText("본문 편집")).toHaveValue("복구 본문");
  });
  it("발행된 글의 저장은 PUBLISHED 상태를 유지한다", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ...savedPost, status: "PUBLISHED" });
    render(<PostEditor initialData={{ ...savedPost, status: "PUBLISHED" }} categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} />);
    expect(screen.queryByRole("button", { name: "임시저장" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "변경 사항 저장" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: "PUBLISHED" })));
  });
  it("Ctrl+S로 새 글을 발행하지 않고 임시저장한다", async () => {
    const onSubmit = vi.fn().mockResolvedValue(savedPost);
    render(<PostEditor categories={[]} tags={[]} isPending={false} onSubmit={onSubmit} />);
    write(); fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: "DRAFT" })));
  });
  it("본문을 비웠다가 이동해도 삭제한 상태를 복구할 수 있다", async () => {
    const { unmount } = render(<PostEditor initialData={savedPost} categories={[]} tags={[]} isPending={false} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("본문 편집"), { target: { value: "" } });
    unmount(); expect(loadDraft(7)?.content).toBe("");
  });

  it("저장 후 다시 입력하면 이전 저장 완료 안내를 표시하지 않는다", async () => {
    render(<PostEditor initialData={savedPost} categories={[]} tags={[]} isPending={false} onSubmit={vi.fn().mockResolvedValue(savedPost)} />);
    fireEvent.click(screen.getByRole("button", { name: "임시저장" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("서버에 임시저장했습니다"));
    fireEvent.change(screen.getByLabelText("본문 편집"), { target: { value: "아직 저장하지 않은 수정" } });
    expect(screen.getByRole("status")).not.toHaveTextContent("서버에 임시저장했습니다");
  });

});


it("충돌 후 입력과 기준 버전을 보존하고 비교한 버전을 명시적으로 선택한다", async () => {
 const onSubmit=vi.fn().mockRejectedValueOnce({response:{status:409,data:{code:"POST_EDIT_CONFLICT"}}}).mockResolvedValue({...savedPost,editVersion:2});
 vi.mocked(fetchPostById).mockResolvedValue({...savedPost,content:"다른 탭의 최신 글",editVersion:1});
 render(<PostEditor initialData={savedPost} categories={[]} tags={[]} isPending={false} onSubmit={onSubmit}/>);
 fireEvent.change(screen.getByLabelText("본문 편집"),{target:{value:"이 탭에서 작성한 글"}});
 fireEvent.click(screen.getByRole("button",{name:"임시저장"}));
 expect(await screen.findByText(/다른 곳에서 글이 변경되었습니다/)).toBeInTheDocument();
 expect(screen.getByLabelText("본문 편집")).toHaveValue("이 탭에서 작성한 글");
 expect(loadDraft(7)?.expectedEditVersion).toBe(0);
 fireEvent.click(screen.getByRole("button",{name:"최신 글 비교"}));
 expect(await screen.findByLabelText("최신 서버 본문")).toHaveValue("다른 탭의 최신 글");
 expect(onSubmit).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button",{name:"비교한 버전으로 계속 편집"}));
 expect(onSubmit).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button",{name:"임시저장"}));
 await waitFor(()=>expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({content:"이 탭에서 작성한 글",expectedEditVersion:1})));
});
it("연속 임시저장은 성공 응답 버전을 사용하고 배경 재조회는 기준을 바꾸지 않는다", async () => {
 const onSubmit=vi.fn().mockResolvedValue({...savedPost,editVersion:1});
 const props={categories:[],tags:[],isPending:false,onSubmit};
 const {rerender}=render(<PostEditor initialData={savedPost} {...props}/>);
 rerender(<PostEditor initialData={{...savedPost,editVersion:5}} {...props}/>);
 fireEvent.change(screen.getByLabelText("본문 편집"),{target:{value:"첫 편집"}});fireEvent.click(screen.getByRole("button",{name:"임시저장"}));
 await waitFor(()=>expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({expectedEditVersion:0})));
 await screen.findByText(/서버에 임시저장했습니다/);
 fireEvent.change(screen.getByLabelText("본문 편집"),{target:{value:"다음 편집"}});fireEvent.click(screen.getByRole("button",{name:"임시저장"}));
 await waitFor(()=>expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({expectedEditVersion:1})));
});
it("오래된 복구본의 버전을 최신 서버 버전으로 몰래 올리지 않는다", () => {
 localStorage.setItem("blog_draft_edit_7",JSON.stringify({title:"복구",content:"이전 글",excerpt:"",tagIds:[],status:"DRAFT",savedAt:Date.now(),expectedEditVersion:1}));
 render(<PostEditor initialData={{...savedPost,editVersion:3}} categories={[]} tags={[]} isPending={false} onSubmit={vi.fn()}/>);
 fireEvent.click(screen.getByRole("button",{name:"복원"}));
 expect(screen.getByLabelText("본문 편집")).toHaveValue("이전 글");
 expect(screen.getByRole("button",{name:"최신 글 비교"})).toBeInTheDocument();
 expect(screen.getByRole("button",{name:"임시저장"})).toBeDisabled();
});
