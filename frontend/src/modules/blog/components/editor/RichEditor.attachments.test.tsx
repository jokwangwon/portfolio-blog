import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RichEditor from "./RichEditor";
import { uploadImage } from "../../api/attachmentApi";
import type { AttachmentResponse } from "../../api/attachmentApi";
vi.mock("../../api/attachmentApi", () => ({ uploadImage: vi.fn() }));
vi.mock("../ProtectedImage", () => ({ default: ({ src }: { src: string }) => <span data-testid="image-source">{src}</span> }));
afterEach(() => vi.clearAllMocks());
const url = "/api/portal/attachments/12345678-1234-1234-1234-123456789abc";
describe("rich editor image uploads", () => {
  it("locks editing during upload and stores the canonical URL through its node view", async () => {
    let finish!: (value: AttachmentResponse) => void;
    vi.mocked(uploadImage).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const onChange = vi.fn(); const onBusyChange = vi.fn();
    render(<RichEditor content="existing paragraph" onChange={onChange} onBusyChange={onBusyChange} />);
    const fileInput = await screen.findByLabelText("이미지 파일");
    fireEvent.change(fileInput, { target: { files: [new File(["png"], "a.png", { type: "image/png" })] } });
    expect(onBusyChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("textbox")).toHaveAttribute("contenteditable", "false");
    await act(async () => finish({ id: "id", url, mediaType: "image/png", byteSize: 3, width: 1, height: 1 }));
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    expect(screen.getByRole("textbox")).toHaveAttribute("contenteditable", "true");
    expect(onChange.mock.calls.at(-1)?.[0]).toContain(url);
    expect(onChange.mock.calls.at(-1)?.[0]).not.toContain("blob:");
    expect(screen.getByTestId("image-source")).toHaveTextContent(url);
  });
  it("preserves content and unlocks on failed upload", async () => {
    vi.mocked(uploadImage).mockRejectedValue(new Error("PNG 또는 JPEG 이미지를 선택해 주세요."));
    const onChange = vi.fn();
    render(<RichEditor content="keep this text" onChange={onChange} />);
    fireEvent.change(await screen.findByLabelText("이미지 파일"), { target: { files: [new File(["bad"], "a.gif", { type: "image/gif" })] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("PNG");
    expect(screen.getByRole("textbox")).toHaveTextContent("keep this text");
    expect(screen.getByRole("textbox")).toHaveAttribute("contenteditable", "true");
    expect(onChange).not.toHaveBeenCalled();
  });
});
