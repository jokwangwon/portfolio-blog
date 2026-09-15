import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProtectedImage from "./ProtectedImage";
import apiClient from "@/src/shell/api/client";

let identity: string | null = "admin";
vi.mock("@/src/shell/state/store", () => ({ useAppSelector: (select: (state: unknown) => unknown) => select({ auth: { user: identity ? { username: identity } : null, isLoading: false } }) }));
vi.mock("@/src/shell/api/client", () => ({ default: { get: vi.fn() } }));
const url = "/api/portal/attachments/12345678-1234-1234-1234-123456789abc";
afterEach(() => { identity = "admin"; vi.restoreAllMocks(); vi.clearAllMocks(); });
describe("protected images", () => {
  it("never sends external image URLs through the authenticated client", () => {
    render(<ProtectedImage src="https://example.com/photo.png" alt="external" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/photo.png");
    expect(apiClient.get).not.toHaveBeenCalled();
  });
  it("revokes the owner blob immediately on logout and aborts requests on unmount", async () => {
    const create = vi.fn().mockReturnValue("blob:private");
    const revoke = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: new Blob(["private"]) });
    const { rerender, unmount } = render(<ProtectedImage src={url} alt="private" />);
    await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "blob:private"));
    vi.mocked(apiClient.get).mockReturnValueOnce(new Promise(() => {}));
    identity = null;
    rerender(<ProtectedImage src={url} alt="private" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(revoke).toHaveBeenCalledWith("blob:private");
    unmount();
    expect(vi.mocked(apiClient.get).mock.calls[1][1]?.signal?.aborted).toBe(true);
  });
  it("ignores an owner response completing after logout", async () => {
    let complete!: (value: unknown) => void;
    vi.mocked(apiClient.get).mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
    const { rerender } = render(<ProtectedImage src={url} alt="private" />);
    identity = null;
    vi.mocked(apiClient.get).mockReturnValueOnce(new Promise(() => {}));
    rerender(<ProtectedImage src={url} alt="private" />);
    await act(async () => complete({ data: new Blob(["private"]) }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
