import { describe, expect, it } from "vitest";
import { parseSnapshot, unavailableSnapshot } from "./presence";

const now = 1_800_000_000_000;
const session = { id: "123e4567-e89b-42d3-a456-426614174000", source: "claude", activity: "editing", startedAt: now - 1000 };
const snapshot = { version: 1, updatedAt: now, enabled: true, sessions: [session] };

describe("public presence boundary", () => {
  it("retains sessions while the collector is alive, without requiring tool calls", () => {
    expect(parseSnapshot(snapshot, now + 14000).sessions).toHaveLength(1);
  });
  it("distinguishes stale/missing collectors from confirmed empty offices", () => {
    expect(parseSnapshot(snapshot, now + 16000)).toEqual(unavailableSnapshot());
    expect(parseSnapshot(null, now).connection).toBe("unavailable");
    expect(parseSnapshot({ ...snapshot, sessions: [] }, now).connection).toBe("connected");
  });
  it("reconstructs allowlisted fields without leaking raw values", () => {
    const result = parseSnapshot({ ...snapshot, secret: "PRIVATE", sessions: [{ ...session, file: "PRIVATE", prompt: "PRIVATE" }] }, now);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(result.sessions[0]).toEqual(session);
  });
  it("rejects invalid IDs, enums, duplicates, oversized lists and future timestamps", () => {
    for (const input of [
      { ...snapshot, sessions: [{ ...session, id: "/private/path" }] },
      { ...snapshot, sessions: [{ ...session, activity: "secret command" }] },
      { ...snapshot, sessions: [session, session] },
      { ...snapshot, sessions: Array(25).fill(session) },
      { ...snapshot, updatedAt: now + 10000 },
    ]) expect(parseSnapshot(input, now).connection).toBe("unavailable");
  });
  it("never publishes occupants while broadcasting is disabled", () => {
    expect(parseSnapshot({ ...snapshot, enabled: false }, now).sessions).toEqual([]);
  });
});

it("only forwards valid explicit public titles", () => {
  const titled = (publicTitle: unknown) => parseSnapshot({ ...snapshot, sessions: [{...session, publicTitle}] }, now).sessions[0];
  expect(titled("Office 계절 테마 개선").publicTitle).toBe("Office 계절 테마 개선");
  for (const value of ["x".repeat(49), "<script>", "/home/private/key", "line\nbreak", "token@example.com"]) {
    expect(titled(value).publicTitle).toBeUndefined();
  }
});

it("validates project names and a recent project without forwarding paths or secrets", () => {
  const recentProject = { projectName: "oracle_study-game", lastActiveAt: now - 100, cwd: "PRIVATE" };
  const parsed = parseSnapshot({ ...snapshot, recentProject, sessions: [{ ...session, projectName: "portfolio-blog", cwd: "PRIVATE" }] }, now);
  expect(parsed.sessions[0].projectName).toBe("portfolio-blog");
  expect(parsed.recentProject).toEqual({ projectName: "oracle_study-game", lastActiveAt: now - 100 });
  expect(JSON.stringify(parsed)).not.toContain("PRIVATE");
  for (const projectName of ["/home/private", "..", "x".repeat(65), "line\nbreak"]) {
    expect(parseSnapshot({ ...snapshot, sessions: [{ ...session, projectName }], recentProject: { ...recentProject, projectName } }, now).recentProject).toBeUndefined();
    expect(parseSnapshot({ ...snapshot, sessions: [{ ...session, projectName }] }, now).sessions[0].projectName).toBeUndefined();
  }
  for (const lastActiveAt of [now + 1, -1, NaN, Infinity, 1.5]) {
    expect(parseSnapshot({ ...snapshot, recentProject: { ...recentProject, lastActiveAt } }, now).recentProject).toBeUndefined();
  }
  expect(parseSnapshot({ ...snapshot, enabled: false, recentProject }, now).recentProject).toBeUndefined();
  expect(parseSnapshot({ ...snapshot, recentProject }, now + 16000).recentProject).toBeUndefined();
});
