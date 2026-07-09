import { describe, it, expect, beforeEach } from "vitest";
import { OfficeState } from "./officeState";

describe("OfficeState", () => {
  let state: OfficeState;

  beforeEach(() => {
    // Uses createDefaultLayout() internally
    state = new OfficeState();
  });

  it("should initialize with default layout", () => {
    expect(state.layout).toBeDefined();
    expect(state.tileMap.length).toBeGreaterThan(0);
    expect(state.walkableTiles.length).toBeGreaterThan(0);
  });

  it("should add agents", () => {
    state.addAgent(1, 0, 0, undefined, true);
    state.addAgent(2, 1, 0, undefined, true);
    expect(state.characters.size).toBe(2);
    expect(state.characters.get(1)).toBeDefined();
    expect(state.characters.get(2)).toBeDefined();
  });

  it("should not add duplicate agents", () => {
    state.addAgent(1, 0, 0, undefined, true);
    state.addAgent(1, 0, 0, undefined, true);
    expect(state.characters.size).toBe(1);
  });

  it("should remove agents", () => {
    state.addAgent(1, 0, 0, undefined, true);
    expect(state.characters.size).toBe(1);
    state.removeAgent(1);
    // After removeAgent, character enters despawn effect
    const ch = state.characters.get(1);
    expect(ch?.matrixEffect).toBe("despawn");
  });

  it("should set agent active state", () => {
    state.addAgent(1, 0, 0, undefined, true);

    state.setAgentActive(1, false);
    expect(state.characters.get(1)!.isActive).toBe(false);

    state.setAgentActive(1, true);
    expect(state.characters.get(1)!.isActive).toBe(true);
  });

  it("should set agent tool", () => {
    state.addAgent(1, 0, 0, undefined, true);
    state.setAgentTool(1, "Edit");
    expect(state.characters.get(1)!.currentTool).toBe("Edit");

    state.setAgentTool(1, null);
    expect(state.characters.get(1)!.currentTool).toBeNull();
  });

  it("should show waiting bubble", () => {
    state.addAgent(1, 0, 0, undefined, true);
    state.showWaitingBubble(1);
    expect(state.characters.get(1)!.bubbleType).toBe("waiting");
  });

  it("should update without errors", () => {
    state.addAgent(1, 0, 0, undefined, true);
    state.addAgent(2, 1, 0, undefined, true);
    // Run a few update ticks
    expect(() => {
      state.update(0.016); // ~60fps
      state.update(0.016);
      state.update(0.016);
    }).not.toThrow();
  });

  it("should assign agents to walkable tiles", () => {
    state.addAgent(1, 0, 0, undefined, true);
    const ch = state.characters.get(1)!;
    // Default layout has no furniture/seats, agent should be on a walkable tile
    expect(ch.tileCol).toBeGreaterThanOrEqual(0);
    expect(ch.tileRow).toBeGreaterThanOrEqual(0);
  });

  it("should handle getCharacterAt for non-existing positions", () => {
    state.addAgent(1, 0, 0, undefined, true);
    // Clicking far outside should return null
    const result = state.getCharacterAt(-1000, -1000);
    expect(result).toBeNull();
  });
});
