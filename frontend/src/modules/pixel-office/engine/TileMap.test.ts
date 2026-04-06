import { describe, it, expect } from "vitest";
import { TileMap } from "./TileMap";

describe("TileMap", () => {
  describe("createDefaultLayout", () => {
    it("should create a layout with 3 zones", () => {
      const layout = TileMap.createDefaultLayout();
      expect(layout.zones).toHaveLength(3);
      expect(layout.zones.map((z) => z.type)).toEqual(
        expect.arrayContaining(["WORK_AREA", "SERVER_ROOM", "LOUNGE"]),
      );
    });

    it("should have desk positions for all 3 agent roles", () => {
      const layout = TileMap.createDefaultLayout();
      expect(layout.deskPositions.BACKEND).toBeDefined();
      expect(layout.deskPositions.FRONTEND).toBeDefined();
      expect(layout.deskPositions.DEVOPS).toBeDefined();
    });

    it("should have at least one lounge position", () => {
      const layout = TileMap.createDefaultLayout();
      expect(layout.loungePositions.length).toBeGreaterThan(0);
    });

    it("should have walkable floor tiles within zones", () => {
      const layout = TileMap.createDefaultLayout();
      for (const zone of layout.zones) {
        const { x, y, w, h } = zone.bounds;
        // Interior tiles should be walkable floors
        for (let ty = y + 1; ty < y + h - 1; ty++) {
          for (let tx = x + 1; tx < x + w - 1; tx++) {
            expect(layout.tiles[ty][tx].walkable).toBe(true);
          }
        }
      }
    });

    it("should have wall tiles on the outer boundary", () => {
      const layout = TileMap.createDefaultLayout();
      // Top row
      for (let x = 0; x < layout.width; x++) {
        expect(layout.tiles[0][x].type).toBe("WALL");
        expect(layout.tiles[0][x].walkable).toBe(false);
      }
    });
  });

  describe("tileToPixel / pixelToTile", () => {
    it("should convert tile position to pixel coordinates", () => {
      const pixel = TileMap.tileToPixel({ x: 3, y: 2 }, 32);
      expect(pixel).toEqual({ x: 96, y: 64 });
    });

    it("should convert pixel coordinates to tile position", () => {
      const tile = TileMap.pixelToTile({ x: 100, y: 70 }, 32);
      expect(tile).toEqual({ x: 3, y: 2 });
    });

    it("should be reversible", () => {
      const original = { x: 5, y: 7 };
      const pixel = TileMap.tileToPixel(original, 16);
      const back = TileMap.pixelToTile(pixel, 16);
      expect(back).toEqual(original);
    });
  });

  describe("getDeskPosition", () => {
    it("should return desk position for a valid role", () => {
      const layout = TileMap.createDefaultLayout();
      const pos = TileMap.getDeskPosition(layout, "BACKEND");
      expect(pos).toBeDefined();
      expect(layout.tiles[pos.y][pos.x].walkable).toBe(true);
    });
  });

  describe("getRandomLoungePosition", () => {
    it("should return a walkable lounge position", () => {
      const layout = TileMap.createDefaultLayout();
      const pos = TileMap.getRandomLoungePosition(layout);
      expect(pos).toBeDefined();
      expect(layout.tiles[pos.y][pos.x].walkable).toBe(true);
    });
  });
});
