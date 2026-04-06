import { describe, it, expect } from "vitest";
import { createCharacter, updateCharacter, isReadingTool } from "./characters";
import { CharacterState, Direction, TileType } from "../types";
import type { Seat } from "../types";

function makeGrid(rows: number, cols: number): TileType[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(TileType.FLOOR_1));
}

function makeSeat(col: number, row: number): Seat {
  return {
    uid: `seat-${col}-${row}`,
    seatCol: col,
    seatRow: row,
    facingDir: Direction.DOWN,
    isElectronics: false,
    occupantId: null,
  };
}

describe("characters", () => {
  describe("isReadingTool", () => {
    it("should return true for Read, Grep, Glob", () => {
      expect(isReadingTool("Read")).toBe(true);
      expect(isReadingTool("Grep")).toBe(true);
      expect(isReadingTool("Glob")).toBe(true);
    });

    it("should return false for Edit, Write, Bash", () => {
      expect(isReadingTool("Edit")).toBe(false);
      expect(isReadingTool("Write")).toBe(false);
      expect(isReadingTool("Bash")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isReadingTool(null)).toBe(false);
    });
  });

  describe("createCharacter", () => {
    it("should create character at seat position", () => {
      const seat = makeSeat(5, 3);
      const ch = createCharacter(1, 0, "seat-5-3", seat);
      expect(ch.id).toBe(1);
      expect(ch.tileCol).toBe(5);
      expect(ch.tileRow).toBe(3);
      expect(ch.state).toBe(CharacterState.TYPE);
      expect(ch.isActive).toBe(true);
      expect(ch.seatId).toBe("seat-5-3");
    });

    it("should create character at (1,1) when no seat", () => {
      const ch = createCharacter(2, 1, null, null);
      expect(ch.tileCol).toBe(1);
      expect(ch.tileRow).toBe(1);
    });
  });

  describe("updateCharacter", () => {
    const grid = makeGrid(10, 10);
    const blocked = new Set<string>();
    const walkable = [{ col: 3, row: 3 }, { col: 4, row: 4 }, { col: 5, row: 5 }];
    const seats = new Map<string, Seat>();
    const seat = makeSeat(5, 5);
    seats.set("s1", seat);

    it("should cycle TYPE animation frames", () => {
      const ch = createCharacter(1, 0, "s1", seat);
      ch.state = CharacterState.TYPE;
      ch.isActive = true;
      ch.frame = 0;
      ch.frameTimer = 0.29;

      updateCharacter(ch, 0.02, walkable, seats, grid, blocked);
      expect(ch.frame).toBe(1); // 0.29 + 0.02 >= 0.3 → frame advances
    });

    it("should transition TYPE → IDLE when deactivated and seatTimer expires", () => {
      const ch = createCharacter(1, 0, "s1", seat);
      ch.state = CharacterState.TYPE;
      ch.isActive = false;
      ch.seatTimer = 0.1;

      // First tick: seatTimer counting down (0.1 - 0.05 = 0.05, still > 0)
      updateCharacter(ch, 0.05, walkable, seats, grid, blocked);
      expect(ch.state).toBe(CharacterState.TYPE);

      // Second tick: seatTimer goes negative (0.05 - 0.06 = -0.01), break this tick
      updateCharacter(ch, 0.06, walkable, seats, grid, blocked);
      expect(ch.state).toBe(CharacterState.TYPE); // still TYPE, transition happens next tick

      // Third tick: seatTimer <= 0, transitions to IDLE
      updateCharacter(ch, 0.01, walkable, seats, grid, blocked);
      expect(ch.state).toBe(CharacterState.IDLE);
    });

    it("should transition IDLE → WALK when activated with seat", () => {
      const ch = createCharacter(1, 0, "s1", seat);
      ch.state = CharacterState.IDLE;
      ch.isActive = true;
      ch.tileCol = 3;
      ch.tileRow = 3;

      updateCharacter(ch, 0.1, walkable, seats, grid, blocked);
      // Should either WALK (if path found) or TYPE (if already at seat)
      expect([CharacterState.WALK, CharacterState.TYPE]).toContain(ch.state);
    });

    it("should move character during WALK state", () => {
      const ch = createCharacter(1, 0, null, null);
      ch.state = CharacterState.WALK;
      ch.tileCol = 1;
      ch.tileRow = 1;
      ch.path = [{ col: 2, row: 1 }, { col: 3, row: 1 }];
      ch.moveProgress = 0;

      const oldX = ch.x;
      updateCharacter(ch, 0.1, walkable, seats, grid, blocked);
      // x should change (moving right)
      expect(ch.x).not.toBe(oldX);
    });

    it("should arrive at destination and transition to IDLE or TYPE", () => {
      const ch = createCharacter(1, 0, null, null);
      ch.state = CharacterState.WALK;
      ch.tileCol = 2;
      ch.tileRow = 1;
      ch.path = [{ col: 3, row: 1 }];
      ch.moveProgress = 0.99;

      // First tick: moveProgress >= 1 → tile arrival, path.shift() → path empty
      updateCharacter(ch, 0.5, walkable, seats, grid, blocked);
      expect(ch.path).toEqual([]);
      expect(ch.tileCol).toBe(3); // moved to destination tile

      // Second tick: path.length === 0 → transitions out of WALK
      updateCharacter(ch, 0.01, walkable, seats, grid, blocked);
      expect([CharacterState.IDLE, CharacterState.TYPE]).toContain(ch.state);
    });

    it("should decrement wanderTimer in IDLE state", () => {
      const ch = createCharacter(1, 0, null, null);
      ch.state = CharacterState.IDLE;
      ch.isActive = false;
      ch.wanderTimer = 5.0;

      updateCharacter(ch, 1.0, walkable, seats, grid, blocked);
      expect(ch.wanderTimer).toBeCloseTo(4.0, 1);
    });
  });
});
