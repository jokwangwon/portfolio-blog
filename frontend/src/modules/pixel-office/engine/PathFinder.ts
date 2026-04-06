import type { Tile, TilePosition } from "../types/office.types";

const DIRECTIONS: TilePosition[] = [
  { x: 0, y: -1 }, // UP
  { x: 0, y: 1 },  // DOWN
  { x: -1, y: 0 }, // LEFT
  { x: 1, y: 0 },  // RIGHT
];

export class PathFinder {
  static findPath(
    grid: Tile[][],
    start: TilePosition,
    end: TilePosition,
  ): TilePosition[] | null {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;

    if (!PathFinder.isInBounds(start, rows, cols) || !PathFinder.isInBounds(end, rows, cols)) {
      return null;
    }

    if (start.x === end.x && start.y === end.y) {
      return [{ ...start }];
    }

    if (!grid[end.y][end.x].walkable) {
      return null;
    }

    const visited = new Set<string>();
    const parent = new Map<string, TilePosition>();
    const queue: TilePosition[] = [start];
    const key = (p: TilePosition) => `${p.x},${p.y}`;

    visited.add(key(start));

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === end.x && current.y === end.y) {
        return PathFinder.reconstructPath(parent, start, end);
      }

      for (const dir of DIRECTIONS) {
        const next: TilePosition = {
          x: current.x + dir.x,
          y: current.y + dir.y,
        };

        if (
          PathFinder.isInBounds(next, rows, cols) &&
          grid[next.y][next.x].walkable &&
          !visited.has(key(next))
        ) {
          visited.add(key(next));
          parent.set(key(next), current);
          queue.push(next);
        }
      }
    }

    return null;
  }

  private static isInBounds(pos: TilePosition, rows: number, cols: number): boolean {
    return pos.x >= 0 && pos.x < cols && pos.y >= 0 && pos.y < rows;
  }

  private static reconstructPath(
    parent: Map<string, TilePosition>,
    start: TilePosition,
    end: TilePosition,
  ): TilePosition[] {
    const path: TilePosition[] = [];
    const key = (p: TilePosition) => `${p.x},${p.y}`;
    let current: TilePosition = end;

    while (current.x !== start.x || current.y !== start.y) {
      path.unshift({ ...current });
      current = parent.get(key(current))!;
    }
    path.unshift({ ...start });

    return path;
  }
}
