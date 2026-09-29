import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { readSnapshot } from "@/src/modules/pixel-office/presence/readSnapshot";
vi.mock("@/src/modules/pixel-office/presence/readSnapshot", () => ({ readSnapshot: vi.fn() }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
describe("public read-only stream", () => {
  it("sends snapshots without caching and stops reading files when aborted", async () => {
    vi.useFakeTimers();
    vi.mocked(readSnapshot).mockResolvedValue({ connection: "connected", enabled: true, updatedAt: 1, sessions: [] });
    const abort = new AbortController();
    const response = GET(new Request("http://localhost/api/office/events", { signal: abort.signal }));
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const reader = response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: presence");
    abort.abort();
    expect((await reader.read()).done).toBe(true);
    await vi.advanceTimersByTimeAsync(10000);
    expect(readSnapshot).toHaveBeenCalledTimes(1);
  });
  it("cleans up when the response consumer cancels without an abort signal", async () => {
    vi.useFakeTimers();
    vi.mocked(readSnapshot).mockResolvedValue({ connection: "unavailable", enabled: false, updatedAt: null, sessions: [] });
    const reader = GET(new Request("http://localhost/api/office/events")).body!.getReader();
    await reader.read(); await reader.cancel();
    await vi.advanceTimersByTimeAsync(10000);
    expect(readSnapshot).toHaveBeenCalledTimes(1);
  });
});
