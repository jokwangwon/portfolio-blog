import type {
  AgentRole,
  OfficeLayout,
  Tile,
  TilePosition,
  ZoneConfig,
} from "../types/office.types";

// Default office: 16x12 tiles
const DEFAULT_WIDTH = 16;
const DEFAULT_HEIGHT = 12;

const DEFAULT_ZONES: ZoneConfig[] = [
  { type: "WORK_AREA", label: "Work Area", bounds: { x: 1, y: 1, w: 7, h: 5 } },
  { type: "SERVER_ROOM", label: "Server Room", bounds: { x: 9, y: 1, w: 6, h: 5 } },
  { type: "LOUNGE", label: "Lounge", bounds: { x: 1, y: 7, w: 14, h: 4 } },
];

const DEFAULT_DESKS: Record<AgentRole, TilePosition> = {
  BACKEND: { x: 3, y: 3 },
  FRONTEND: { x: 5, y: 3 },
  DEVOPS: { x: 11, y: 3 },
};

const DEFAULT_LOUNGE_POSITIONS: TilePosition[] = [
  { x: 3, y: 9 },
  { x: 7, y: 9 },
  { x: 11, y: 9 },
];

export class TileMap {
  static createDefaultLayout(): OfficeLayout {
    const tiles = TileMap.buildTiles(DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_ZONES);

    return {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      tiles,
      zones: DEFAULT_ZONES,
      deskPositions: DEFAULT_DESKS,
      loungePositions: DEFAULT_LOUNGE_POSITIONS,
    };
  }

  static tileToPixel(tile: TilePosition, tileSize: number): TilePosition {
    return { x: tile.x * tileSize, y: tile.y * tileSize };
  }

  static pixelToTile(pixel: TilePosition, tileSize: number): TilePosition {
    return {
      x: Math.floor(pixel.x / tileSize),
      y: Math.floor(pixel.y / tileSize),
    };
  }

  static getDeskPosition(layout: OfficeLayout, role: AgentRole): TilePosition {
    return layout.deskPositions[role];
  }

  static getRandomLoungePosition(layout: OfficeLayout): TilePosition {
    const positions = layout.loungePositions;
    const idx = Math.floor(Math.random() * positions.length);
    return positions[idx];
  }

  private static buildTiles(
    width: number,
    height: number,
    zones: ZoneConfig[],
  ): Tile[][] {
    // Initialize all as walls
    const tiles: Tile[][] = [];
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = { type: "WALL", walkable: false, zone: null };
      }
    }

    // Carve out zone interiors as walkable floor
    for (const zone of zones) {
      const { x: zx, y: zy, w, h } = zone.bounds;
      for (let y = zy; y < zy + h; y++) {
        for (let x = zx; x < zx + w; x++) {
          if (y > zy && y < zy + h - 1 && x > zx && x < zx + w - 1) {
            tiles[y][x] = { type: "FLOOR", walkable: true, zone: zone.type };
          }
        }
      }
    }

    // Carve corridors between zones (connecting walkable areas)
    TileMap.carveCorridors(tiles, zones);

    return tiles;
  }

  private static carveCorridors(tiles: Tile[][], zones: ZoneConfig[]): void {
    // Corridor between Work Area and Server Room (horizontal, row 3)
    const workArea = zones.find((z) => z.type === "WORK_AREA")!;
    const serverRoom = zones.find((z) => z.type === "SERVER_ROOM")!;
    const corridorY = workArea.bounds.y + Math.floor(workArea.bounds.h / 2);
    for (let x = workArea.bounds.x + workArea.bounds.w - 1; x <= serverRoom.bounds.x + 1; x++) {
      tiles[corridorY][x] = { type: "FLOOR", walkable: true, zone: null };
    }

    // Corridor between upper zones and Lounge (vertical)
    const lounge = zones.find((z) => z.type === "LOUNGE")!;
    const connX = workArea.bounds.x + Math.floor(workArea.bounds.w / 2);
    for (let y = workArea.bounds.y + workArea.bounds.h - 1; y <= lounge.bounds.y + 1; y++) {
      tiles[y][connX] = { type: "FLOOR", walkable: true, zone: null };
    }

    // Second corridor for server room to lounge
    const connX2 = serverRoom.bounds.x + Math.floor(serverRoom.bounds.w / 2);
    for (let y = serverRoom.bounds.y + serverRoom.bounds.h - 1; y <= lounge.bounds.y + 1; y++) {
      tiles[y][connX2] = { type: "FLOOR", walkable: true, zone: null };
    }
  }
}
