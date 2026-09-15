import { describe, expect, it } from "vitest";
import { OfficeState } from "../pixel-engine/engine/officeState";
import { Direction } from "../pixel-engine/types";
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
  it("waits, walks to the exit, then removes and releases the seat", () => {
    const state = new OfficeState(); const attendance = new Attendance();
    const tile=state.walkableTiles[0];
    state.seats.set("test-seat",{uid:"test-seat",seatCol:tile.col,seatRow:tile.row,facingDir:Direction.UP,assigned:false});
    attendance.sync(state, [first]);
    for (let i=0;i<400;i++) state.update(.05);
    const id=attendance.idFor(first.id)!; const ch=state.characters.get(id)!;
    const origin={x:ch.x,y:ch.y}; const seat=ch.seatId!;
    attendance.sync(state, []);
    expect(attendance.idFor(first.id)).toBeUndefined();
    expect(ch.matrixEffect).toBeNull(); expect(ch.isActive).toBe(false);
    expect(attendance.update(state,.5)).toBe(1);
    expect({x:ch.x,y:ch.y}).toEqual(origin);
    let moved=false;
    for(let i=0;i<320;i++){attendance.sync(state,[]);state.update(.05);attendance.update(state,.05);if(ch.x!==origin.x||ch.y!==origin.y)moved=true;}
    expect(moved).toBe(true);expect(state.characters.size).toBe(0);
    expect(state.seats.get(seat)?.assigned).toBe(false);
  });
  it("cancels departure when the same session returns without duplicating it", () => {
    const state=new OfficeState();const attendance=new Attendance();
    attendance.sync(state,[first]);const id=attendance.idFor(first.id);
    attendance.sync(state,[]);attendance.update(state,.5);attendance.sync(state,[first]);
    expect(attendance.idFor(first.id)).toBe(id);expect(state.characters.size).toBe(1);
    expect(attendance.update(state,20)).toBe(0);expect(state.characters.get(id!)?.isActive).toBe(true);
  });
  it("clears all current and departing people immediately when unavailable or off", () => {
    const state=new OfficeState();const attendance=new Attendance();
    attendance.sync(state,[first,{...first,id:"b"}]);attendance.sync(state,[first]);
    attendance.sync(state,[],false);
    expect(state.characters.size).toBe(0);expect(attendance.update(state,1)).toBe(0);
  });
  it("skips exit motion when reduced motion is enabled", () => {
    const state=new OfficeState();const attendance=new Attendance();
    attendance.sync(state,[first]);attendance.sync(state,[]);
    expect(attendance.update(state,.01,true)).toBe(0);expect(state.characters.size).toBe(0);
  });
  it("bounds departure duration when no exit path exists", () => {
    const state=new OfficeState();const attendance=new Attendance();
    attendance.sync(state,[first]);state.walkableTiles=[];attendance.sync(state,[]);
    expect(attendance.update(state,16)).toBe(0);expect(state.characters.size).toBe(0);
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
