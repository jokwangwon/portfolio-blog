import { describe, it, expect } from "vitest";
import { isWalkable, getWalkableTiles, findPath } from "./tileMap";
import { TileType } from "../types";

// Helper: create a small grid
function grid(rows: number, cols: number, fill: TileType = TileType.FLOOR_1): TileType[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

describe("tileMap", () => {
  describe("isWalkable", () => {
    it("should return true for floor tiles", () => {
      const map = grid(3, 3);
      expect(isWalkable(1, 1, map, new Set())).toBe(true);
    });

    it("should return false for wall tiles", () => {
      const map = grid(3, 3);
      map[1][1] = TileType.WALL;
      expect(isWalkable(1, 1, map, new Set())).toBe(false);
    });

    it("should return false for void tiles", () => {
      const map = grid(3, 3);
      map[0][0] = TileType.VOID;
      expect(isWalkable(0, 0, map, new Set())).toBe(false);
    });

    it("should return false for out-of-bounds", () => {
      const map = grid(3, 3);
      expect(isWalkable(-1, 0, map, new Set())).toBe(false);
      expect(isWalkable(0, 3, map, new Set())).toBe(false);
      expect(isWalkable(5, 0, map, new Set())).toBe(false);
    });

    it("should return false for blocked tiles (furniture)", () => {
      const map = grid(3, 3);
      const blocked = new Set(["1,1"]);
      expect(isWalkable(1, 1, map, blocked)).toBe(false);
    });
  });

  describe("getWalkableTiles", () => {
    it("should return all floor tiles excluding walls and blocked", () => {
      const map = grid(3, 3);
      map[0][0] = TileType.WALL;
      map[2][2] = TileType.VOID;
      const blocked = new Set(["1,1"]);
      const tiles = getWalkableTiles(map, blocked);
      expect(tiles).toHaveLength(6); // 9 - wall - void - blocked = 6
      expect(tiles.find((t) => t.col === 0 && t.row === 0)).toBeUndefined();
      expect(tiles.find((t) => t.col === 1 && t.row === 1)).toBeUndefined();
    });
  });

  describe("findPath", () => {
    it("should return empty array when start equals end", () => {
      const map = grid(3, 3);
      expect(findPath(1, 1, 1, 1, map, new Set())).toEqual([]);
    });

    it("should find straight path on open grid", () => {
      const map = grid(5, 5);
      const path = findPath(0, 0, 4, 0, map, new Set());
      expect(path.length).toBe(4); // excludes start
      expect(path[path.length - 1]).toEqual({ col: 4, row: 0 });
    });

    it("should navigate around walls", () => {
      const map = grid(5, 5);
      map[0][2] = TileType.WALL;
      map[1][2] = TileType.WALL;
      map[2][2] = TileType.WALL;
      const path = findPath(0, 0, 4, 0, map, new Set());
      expect(path.length).toBeGreaterThan(4); // must go around
      // Should not pass through walls
      for (const p of path) {
        expect(map[p.row][p.col]).not.toBe(TileType.WALL);
      }
    });

    it("should return empty when no path exists", () => {
      const map = grid(3, 3);
      // Block all neighbors of (0,0)
      map[0][1] = TileType.WALL;
      map[1][0] = TileType.WALL;
      const path = findPath(0, 0, 2, 2, map, new Set());
      expect(path).toEqual([]);
    });

    it("should respect blocked tiles from furniture", () => {
      const map = grid(3, 3);
      const blocked = new Set(["1,0", "0,1"]);
      const path = findPath(0, 0, 2, 2, map, blocked);
      // Must not pass through blocked
      for (const p of path) {
        expect(blocked.has(`${p.col},${p.row}`)).toBe(false);
      }
    });

    it("should only move in 4 directions (no diagonals)", () => {
      const map = grid(5, 5);
      const path = findPath(0, 0, 3, 3, map, new Set());
      for (let i = 1; i < path.length; i++) {
        const prev = i === 0 ? { col: 0, row: 0 } : path[i - 1];
        const curr = path[i];
        const dc = Math.abs(curr.col - prev.col);
        const dr = Math.abs(curr.row - prev.row);
        expect(dc + dr).toBe(1);
      }
    });
  });
});
