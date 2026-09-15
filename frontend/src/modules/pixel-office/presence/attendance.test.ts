import { describe, expect, it } from "vitest";
import { OfficeState } from "../pixel-engine/engine/officeState";
import { Attendance } from "./attendance";
import type { PresenceSession } from "./presence";
const first: PresenceSession = { id: "a", source: "claude", activity: "editing", startedAt: 1 };
describe("session attendance", () => {
  it("starts empty and does not add people for repeated tool events", () => {
    const state = new OfficeState(); const attendance = new Attendance();
    attendance.sync(state, []); expect(state.characters.size).toBe(0);
    attendance.sync(state, [first]); attendance.sync(state, [{ ...first, activity: "reading" }]);
    expect(state.characters.size).toBe(1);
    expect([...state.characters.values()][0].currentTool).toBe("Read");
  });
  it("adds independent sessions, releases seats on departure, and survives re-entry", () => {
    const state = new OfficeState(); const attendance = new Attendance();
    attendance.sync(state, [first, { ...first, id: "b" }]);
    expect(state.characters.size).toBe(2);
    attendance.sync(state, []);
    expect([...state.characters.values()].every(ch => !ch.isActive && ch.matrixEffect === "despawn")).toBe(true);
    attendance.sync(state, [first]);
    expect([...state.characters.values()].filter(ch => ch.matrixEffect !== "despawn")).toHaveLength(1);
    state.update(2);
    expect(state.characters.size).toBe(1);
  });
  it("keeps waiting sessions present without showing typing or wandering", () => {
    const state = new OfficeState(); const attendance = new Attendance();
    attendance.sync(state, [{ ...first, activity: "waiting" }]);
    state.update(2); state.update(20);
    const ch = [...state.characters.values()][0];
    expect(ch.currentTool).toBe("AwaitInput");
    expect(ch.isActive).toBe(true);
    expect(ch.frame).toBe(0);
  });
});
