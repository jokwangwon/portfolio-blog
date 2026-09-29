import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePresence } from "./usePresence";

class FakeSource extends EventTarget {
  static instance: FakeSource;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor() { super(); FakeSource.instance = this; }
  send(data: unknown) { this.dispatchEvent(new MessageEvent("presence", { data: JSON.stringify(data) })); }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("presence connection", () => {
  it("clears live occupants on transport failure, reconnects, and closes on unmount", () => {
    vi.stubGlobal("EventSource", FakeSource);
    const { result, unmount } = renderHook(() => usePresence());
    const snapshot = { connection: "connected", enabled: true, updatedAt: Date.now(), recentProject: {projectName:"portfolio-blog",lastActiveAt:1}, sessions: [
      { id: "123e4567-e89b-42d3-a456-426614174000", source: "codex", activity: "working", startedAt: 1 },
    ] };
    act(() => FakeSource.instance.send(snapshot));
    expect(result.current.sessions).toHaveLength(1);
    act(() => FakeSource.instance.onerror?.());
    expect(result.current.connection).toBe("unavailable");
    expect(result.current.sessions).toEqual([]);
    expect(result.current.recentProject).toBeUndefined();
    act(() => FakeSource.instance.send(snapshot));
    expect(result.current.sessions).toHaveLength(1);
    unmount(); expect(FakeSource.instance.close).toHaveBeenCalled();
  });
  it("does not keep showing work when an open connection silently stalls", () => {
    vi.useFakeTimers(); vi.stubGlobal("EventSource", FakeSource);
    const { result, unmount } = renderHook(() => usePresence());
    act(() => FakeSource.instance.send({ connection: "connected", enabled: true, updatedAt: Date.now(), sessions: [] }));
    expect(result.current.connection).toBe("connected");
    act(() => vi.advanceTimersByTime(13000));
    expect(result.current.connection).toBe("unavailable");
    unmount();
  });
});
