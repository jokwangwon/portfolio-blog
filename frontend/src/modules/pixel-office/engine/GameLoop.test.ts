import { describe, it, expect, vi } from "vitest";
import { GameLoop } from "./GameLoop";

describe("GameLoop", () => {
  describe("tick", () => {
    it("should call update callback with clamped delta time", () => {
      const update = vi.fn();
      const loop = new GameLoop(update);

      loop.tick(16.67); // ~60fps
      expect(update).toHaveBeenCalledWith(expect.closeTo(0.01667, 3));
    });

    it("should clamp delta time to max 100ms", () => {
      const update = vi.fn();
      const loop = new GameLoop(update);

      loop.tick(500); // 500ms spike
      expect(update).toHaveBeenCalledWith(0.1); // clamped to 100ms = 0.1s
    });

    it("should not call update with 0 delta", () => {
      const update = vi.fn();
      const loop = new GameLoop(update);

      loop.tick(0);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe("updateAgent", () => {
    it("should move agent along path on each tick", () => {
      const agent = {
        position: { x: 0, y: 0 },
        targetPosition: { x: 2, y: 0 },
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
        state: "WALK" as const,
        moveProgress: 0,
      };

      // Simulate movement speed: 4 tiles/sec, dt=0.5s → 2 tiles
      const result = GameLoop.updateAgentMovement(agent, 0.5, 4);
      expect(result.pathIndex).toBeGreaterThan(0);
    });

    it("should mark agent as arrived when path is complete", () => {
      const agent = {
        position: { x: 1, y: 0 },
        targetPosition: { x: 2, y: 0 },
        path: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
        state: "WALK" as const,
        moveProgress: 0.9,
      };

      const result = GameLoop.updateAgentMovement(agent, 0.5, 4);
      expect(result.arrived).toBe(true);
    });
  });
});
