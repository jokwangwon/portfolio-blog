import { afterEach, describe, expect, it, vi } from "vitest";
import { attachmentPath, convertInlineImages, uploadImage } from "./attachmentApi";
import apiClient from "@/src/shell/api/client";

vi.mock("@/src/shell/api/client", () => ({ default: { post: vi.fn() } }));
const url = "/api/portal/attachments/12345678-1234-1234-1234-123456789abc";
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("attachment contract", () => {
  it("uploads normalized pixels with a browser-generated multipart boundary", async () => {
    vi.stubGlobal("Image", class { src = ""; naturalWidth = 3; naturalHeight = 2; decode = async () => {}; });
    const revoke = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:input");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revoke);
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["pixels"], { type: "image/png" })));
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "id", url, mediaType: "image/png", byteSize: 6, width: 3, height: 2 } });
    expect((await uploadImage(new File(["png"], "photo.png", { type: "image/png" }))).url).toBe(url);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(apiClient.post).toHaveBeenCalledWith("/attachments", expect.any(FormData), { headers: { "Content-Type": undefined } });
    expect(revoke).toHaveBeenCalledWith("blob:input");
  });
  it("accepts only the exact local attachment route", () => {
    expect(attachmentPath(url)).toBe("/attachments/12345678-1234-1234-1234-123456789abc");
    for (const value of ["//evil.test" + url, "https://evil.test" + url, url + "?token=x", "/api/portal/attachments/../auth/me"]) expect(attachmentPath(value)).toBeNull();
  });
  it("rejects unsupported and oversized files before uploading", async () => {
    await expect(uploadImage(new File(["gif"], "a.gif", { type: "image/gif" }))).rejects.toThrow("PNG");
    await expect(uploadImage(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "a.png", { type: "image/png" }))).rejects.toThrow("10MB");
    expect(apiClient.post).not.toHaveBeenCalled();
  });
  it("converts actual inline images once while preserving code examples", async () => {
    const data = "data:image/png;base64,aGVsbG8=";
    const upload = vi.fn().mockResolvedValue({ url });
    const original = `![one](${data})\n![two](${data})\n\`![code](${data})\`\n\n\`\`\`md\n![example](${data})\n\`\`\``;
    const converted = await convertInlineImages(original, upload);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(converted).toBe(original.replace(`![one](${data})`, `![one](${url})`).replace(`![two](${data})`, `![two](${url})`));
  });
  it("converts used reference definitions but preserves unused definitions and comments", async () => {
    const data = "data:image/png;base64,aGVsbG8=";
    const source = `![description][Photo A]\n![shortcut]\n\n[photo a]: ${data}\n[shortcut]: <${data}>\n[unused]: ${data}\n<!-- ![hidden](${data}) -->`;
    const upload = vi.fn().mockResolvedValue({ url });
    expect(await convertInlineImages(source, upload)).toBe(source.replace(`[photo a]: ${data}`, `[photo a]: ${url}`).replace(`[shortcut]: <${data}>`, `[shortcut]: <${url}>`));
    expect(upload).toHaveBeenCalledTimes(1);
  });
  it("does not return a partially converted body when upload fails", async () => {
    await expect(convertInlineImages("![a](data:image/png;base64,aGVsbG8=)", vi.fn().mockRejectedValue(new Error("offline")))).rejects.toThrow("offline");
  });
});
