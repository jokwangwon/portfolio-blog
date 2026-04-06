import { describe, it, expect } from "vitest";
import { PathFinder } from "./PathFinder";
import type { Tile, TilePosition } from "../types/office.types";

function createGrid(rows: number, cols: number, blocked: TilePosition[] = []): Tile[][] {
  const grid: Tile[][] = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      const isBlocked = blocked.some((b) => b.x === x && b.y === y);
      grid[y][x] = {
        type: isBlocked ? "WALL" : "FLOOR",
        walkable: !isBlocked,
        zone: null,
      };
    }
  }
  return grid;
}

describe("PathFinder", () => {
  describe("findPath (BFS 4-direction)", () => {
    it("should find a straight path with no obstacles", () => {
      const grid = createGrid(5, 5);
      const path = PathFinder.findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 });
      expect(path).not.toBeNull();
      expect(path!.length).toBe(5);
      expect(path![0]).toEqual({ x: 0, y: 0 });
      expect(path![4]).toEqual({ x: 4, y: 0 });
    });

    it("should navigate around obstacles", () => {
      const blocked = [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ];
      const grid = createGrid(5, 5, blocked);
      const path = PathFinder.findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 });
      expect(path).not.toBeNull();
      // Path must avoid blocked cells
      for (const pos of path!) {
        expect(blocked.some((b) => b.x === pos.x && b.y === pos.y)).toBe(false);
      }
      expect(path![path!.length - 1]).toEqual({ x: 4, y: 0 });
    });

    it("should return null when no path exists", () => {
      const blocked = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];
      const grid = createGrid(3, 3, blocked);
      const path = PathFinder.findPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
      expect(path).toBeNull();
    });

    it("should return single tile path when start equals end", () => {
      const grid = createGrid(3, 3);
      const path = PathFinder.findPath(grid, { x: 1, y: 1 }, { x: 1, y: 1 });
      expect(path).toEqual([{ x: 1, y: 1 }]);
    });

    it("should find shortest path (BFS guarantees this)", () => {
      const grid = createGrid(5, 5);
      const path = PathFinder.findPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
      // Manhattan distance = 4, so shortest path length = 5 (including start)
      expect(path!.length).toBe(5);
    });

    it("should only move in 4 directions (no diagonals)", () => {
      const grid = createGrid(3, 3);
      const path = PathFinder.findPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
      for (let i = 1; i < path!.length; i++) {
        const dx = Math.abs(path![i].x - path![i - 1].x);
        const dy = Math.abs(path![i].y - path![i - 1].y);
        expect(dx + dy).toBe(1); // exactly one step in one direction
      }
    });

    it("should return null for out-of-bounds targets", () => {
      const grid = createGrid(3, 3);
      const path = PathFinder.findPath(grid, { x: 0, y: 0 }, { x: 5, y: 5 });
      expect(path).toBeNull();
    });
  });
});
