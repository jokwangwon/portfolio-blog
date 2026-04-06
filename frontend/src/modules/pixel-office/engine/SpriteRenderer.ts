import type {
  Agent,
  OfficeLayout,
  RenderState,
  ZoneType,
} from "../types/office.types";
import {
  getCharacterSprites,
  renderSpriteToCanvas,
  generateOutline,
  DESK_SPRITE,
  MONITOR_SPRITE,
  SOFA_SPRITE,
  type CharacterSprites,
} from "./SpriteData";
import { colorizeGray, wallColorToHex, type ColorValue } from "./Colorize";

// --- pixel-agents color constants ---
const ZONE_COLORS: Record<ZoneType, ColorValue> = {
  WORK_AREA: { h: 25, s: 48, b: -43, c: -88 },
  SERVER_ROOM: { h: 209, s: 39, b: -25, c: -80 },
  LOUNGE: { h: 209, s: 0, b: -16, c: -8 },
};

const WALL_CV: ColorValue = { h: 214, s: 30, b: -100, c: -55 };
const VOID_COLOR = "#1A1A2E";
const GRID_LINE = "rgba(255,255,255,0.08)";

const WALK_FRAME_SEC = 0.15;

export class SpriteRenderer {
  private ctx: CanvasRenderingContext2D;
  private ts: number; // tile size
  private zoom: number;
  private tileCache: HTMLCanvasElement | null = null;
  private charSprites: Record<string, CharacterSprites> = {};
  private time = 0;

  constructor(ctx: CanvasRenderingContext2D, tileSize: number) {
    this.ctx = ctx;
    this.ts = tileSize;
    this.zoom = tileSize / 16; // base tile = 16px
  }

  render(state: RenderState, dt: number = 0): void {
    this.time += dt;
    const { layout, agents, selectedAgentId } = state;
    const w = layout.width * this.ts;
    const h = layout.height * this.ts;

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, w, h);

    // Layer 1: Tiles (cached)
    this.renderTilesFromCache(layout, w, h);

    // Collect all drawables for Z-sorting
    const drawables: { zY: number; draw: () => void }[] = [];

    // Furniture drawables
    this.collectFurnitureDrawables(layout, drawables);

    // Agent drawables
    for (const agent of agents) {
      const selected = agent.id === selectedAgentId;
      const zY = agent.renderPosition.y + this.ts * 0.5;
      drawables.push({
        zY,
        draw: () => this.renderAgent(agent, selected),
      });
    }

    // Z-sort and draw
    drawables.sort((a, b) => a.zY - b.zY);
    for (const d of drawables) d.draw();

    // Layer top: Bubbles (always on top)
    const now = Date.now();
    for (const agent of agents) {
      this.renderBubble(agent, now);
    }
  }

  // === TILES ===

  private renderTilesFromCache(layout: OfficeLayout, w: number, h: number): void {
    if (!this.tileCache) {
      this.tileCache = document.createElement("canvas");
      this.tileCache.width = w;
      this.tileCache.height = h;
      const c = this.tileCache.getContext("2d")!;
      this.renderTilesTo(c, layout);
    }
    this.ctx.drawImage(this.tileCache, 0, 0);
  }

  private renderTilesTo(ctx: CanvasRenderingContext2D, layout: OfficeLayout): void {
    const ts = this.ts;

    ctx.fillStyle = VOID_COLOR;
    ctx.fillRect(0, 0, layout.width * ts, layout.height * ts);

    const wallHex = wallColorToHex(WALL_CV);

    for (let y = 0; y < layout.height; y++) {
      for (let x = 0; x < layout.width; x++) {
        const tile = layout.tiles[y][x];
        const px = x * ts;
        const py = y * ts;

        if (tile.type === "WALL") {
          this.renderWallTile(ctx, px, py, ts, wallHex, layout, x, y);
        } else if (tile.walkable) {
          this.renderFloorTile(ctx, px, py, ts, tile.zone, x, y);
        }
      }
    }

    // Zone labels
    ctx.font = `bold ${Math.max(8, ts * 0.32)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (const zone of layout.zones) {
      ctx.fillText(
        zone.label,
        (zone.bounds.x + zone.bounds.w / 2) * ts,
        (zone.bounds.y + 0.5) * ts,
      );
    }
  }

  private renderFloorTile(
    ctx: CanvasRenderingContext2D,
    px: number, py: number, ts: number,
    zone: ZoneType | null, x: number, y: number,
  ): void {
    const cv = zone ? ZONE_COLORS[zone] : { h: 240, s: 10, b: -30, c: -50 };

    // Checkerboard: alternate gray values 115 / 128
    const gray = (x + y) % 2 === 0 ? 128 : 115;
    ctx.fillStyle = colorizeGray(gray, cv);
    ctx.fillRect(px, py, ts, ts);

    // Subtle grid
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
  }

  private renderWallTile(
    ctx: CanvasRenderingContext2D,
    px: number, py: number, ts: number,
    wallHex: string, layout: OfficeLayout, x: number, y: number,
  ): void {
    // Base wall
    ctx.fillStyle = wallHex;
    ctx.fillRect(px, py, ts, ts);

    // Top face (lighter) if not wall above
    const aboveIsWall = y > 0 && layout.tiles[y - 1][x].type === "WALL";
    if (!aboveIsWall) {
      const topHex = colorizeGray(145, WALL_CV);
      ctx.fillStyle = topHex;
      ctx.fillRect(px, py, ts, Math.floor(ts * 0.5));
    }

    // 4-bit bitmask for wall connections
    const n = y > 0 && layout.tiles[y - 1][x].type === "WALL" ? 1 : 0;
    const e = x < layout.width - 1 && layout.tiles[y][x + 1].type === "WALL" ? 2 : 0;
    const s = y < layout.height - 1 && layout.tiles[y + 1][x].type === "WALL" ? 4 : 0;
    const w = x > 0 && layout.tiles[y][x - 1].type === "WALL" ? 8 : 0;
    const mask = n | e | s | w;

    // Edge highlights based on bitmask
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    if (!(mask & 1)) { ctx.beginPath(); ctx.moveTo(px, py + 0.5); ctx.lineTo(px + ts, py + 0.5); ctx.stroke(); }
    if (!(mask & 4)) { ctx.beginPath(); ctx.moveTo(px, py + ts - 0.5); ctx.lineTo(px + ts, py + ts - 0.5); ctx.stroke(); }
    if (!(mask & 8)) { ctx.beginPath(); ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + ts); ctx.stroke(); }
    if (!(mask & 2)) { ctx.beginPath(); ctx.moveTo(px + ts - 0.5, py); ctx.lineTo(px + ts - 0.5, py + ts); ctx.stroke(); }

    // Inner shadow for depth
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    if (!(mask & 4)) ctx.fillRect(px, py + ts - 2, ts, 2);
    if (!(mask & 2)) ctx.fillRect(px + ts - 2, py, 2, ts);
  }

  // === FURNITURE ===

  private collectFurnitureDrawables(
    layout: OfficeLayout,
    drawables: { zY: number; draw: () => void }[],
  ): void {
    const ts = this.ts;
    const z = this.zoom;

    // Desks with monitors
    for (const pos of Object.values(layout.deskPositions)) {
      const deskY = (pos.y - 0.5) * ts;
      const deskX = pos.x * ts;
      drawables.push({
        zY: deskY + ts,
        draw: () => {
          const desk = renderSpriteToCanvas(DESK_SPRITE, z, "desk");
          this.ctx.drawImage(desk, deskX, deskY, ts, ts * 0.5);

          const mon = renderSpriteToCanvas(MONITOR_SPRITE, z, "monitor");
          const monW = mon.width * (ts / 16 / z);
          const monH = mon.height * (ts / 16 / z);
          this.ctx.drawImage(mon, deskX + (ts - monW) / 2, deskY - monH + 2, monW, monH);
        },
      });
    }

    // Sofas
    for (const pos of layout.loungePositions) {
      const sx = pos.x * ts;
      const sy = pos.y * ts;
      drawables.push({
        zY: sy + ts,
        draw: () => {
          const sofa = renderSpriteToCanvas(SOFA_SPRITE, z, "sofa");
          this.ctx.drawImage(sofa, sx, sy, ts, ts * 0.4);
        },
      });
    }

    // Server rack
    const serverZone = layout.zones.find((z) => z.type === "SERVER_ROOM");
    if (serverZone) {
      const rackX = (serverZone.bounds.x + 2) * ts;
      const rackY = (serverZone.bounds.y + 1) * ts;
      drawables.push({
        zY: rackY + ts * 2,
        draw: () => {
          // Rack body
          this.ctx.fillStyle = "#2A2A3A";
          this.ctx.fillRect(rackX, rackY, ts * 0.8, ts * 1.5);
          this.ctx.fillStyle = "#353545";
          this.ctx.fillRect(rackX + 2, rackY + 2, ts * 0.8 - 4, ts * 1.5 - 4);
          // LEDs
          const ledColors = ["#4ADE80", "#4ADE80", "#4ADE80", "#FBBF24"];
          for (let i = 0; i < 4; i++) {
            this.ctx.fillStyle = ledColors[i];
            this.ctx.fillRect(rackX + 4, rackY + 5 + i * ts * 0.3, 3, 3);
          }
          // Vent
          this.ctx.strokeStyle = "#454555";
          this.ctx.lineWidth = 0.5;
          for (let i = 0; i < 5; i++) {
            const ly = rackY + ts * 0.35 + i * 4;
            this.ctx.beginPath();
            this.ctx.moveTo(rackX + ts * 0.25, ly);
            this.ctx.lineTo(rackX + ts * 0.7, ly);
            this.ctx.stroke();
          }
        },
      });
    }
  }

  // === CHARACTERS ===

  private renderAgent(agent: Agent, selected: boolean): void {
    const rx = agent.renderPosition.x;
    const ry = agent.renderPosition.y;
    const ts = this.ts;
    const z = this.zoom;

    // Get or create sprite set
    if (!this.charSprites[agent.role]) {
      this.charSprites[agent.role] = getCharacterSprites(agent.role);
    }
    const sprites = this.charSprites[agent.role];

    // Select sprite based on state
    const sprite = this.selectSprite(agent, sprites);

    // Shadow
    this.ctx.fillStyle = "rgba(0,0,0,0.25)";
    this.ctx.beginPath();
    this.ctx.ellipse(rx + ts / 2, ry + ts - 1, ts * 0.3, ts * 0.08, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Selection outline (behind character)
    if (selected) {
      const outline = generateOutline(sprite);
      const outCanvas = renderSpriteToCanvas(outline, z);
      this.ctx.globalAlpha = 1.0;
      this.ctx.drawImage(outCanvas, rx - z, ry - z, ts + z * 2, ts + z * 2);
    }

    // Character sprite
    const charCanvas = renderSpriteToCanvas(sprite, z,
      `${agent.role}-${agent.state}-${agent.direction}-${Math.floor(this.time / WALK_FRAME_SEC) % 2}`);
    this.ctx.drawImage(charCanvas, rx, ry, ts, ts);
  }

  private selectSprite(agent: Agent, sprites: CharacterSprites): string[][] {
    const dir = agent.direction;

    switch (agent.state) {
      case "WORK":
        return sprites.typing;
      case "WALK": {
        const frames = sprites.walk[dir] ?? sprites.walk.DOWN;
        const idx = Math.floor(this.time / WALK_FRAME_SEC) % frames.length;
        return frames[idx];
      }
      case "REST":
      case "IDLE":
      default:
        return sprites.idle[dir] ?? sprites.idle.DOWN;
    }
  }

  // === BUBBLES ===

  private renderBubble(agent: Agent, now: number): void {
    if (!agent.bubble) return;
    if (agent.bubble.expiresAt > 0 && now > agent.bubble.expiresAt) return;

    const cx = agent.renderPosition.x + this.ts / 2;
    const cy = agent.renderPosition.y - 6;
    const text = agent.bubble.text;
    const fontSize = Math.max(7, this.ts * 0.22);

    this.ctx.font = `${fontSize}px monospace`;
    const metrics = this.ctx.measureText(text.length > 18 ? text.slice(0, 18) + "…" : text);
    const displayText = text.length > 18 ? text.slice(0, 18) + "…" : text;
    const padX = 4;
    const padY = 2;
    const bw = metrics.width + padX * 2;
    const bh = fontSize + padY * 2;
    const bx = cx - bw / 2;
    const by = cy - bh;

    // Fade
    let alpha = 1;
    if (agent.bubble.expiresAt > 0) {
      const rem = agent.bubble.expiresAt - now;
      if (rem < 800) alpha = Math.max(0, rem / 800);
    }
    this.ctx.globalAlpha = alpha;

    // Dark bubble (pixel-agents style)
    this.ctx.fillStyle = "#555566";
    this.ctx.beginPath();
    this.ctx.roundRect(bx, by, bw, bh, 2);
    this.ctx.fill();

    // Pointer
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 2, by + bh);
    this.ctx.lineTo(cx, by + bh + 3);
    this.ctx.lineTo(cx + 2, by + bh);
    this.ctx.fill();

    // Text
    this.ctx.fillStyle = "#EEEEFF";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(displayText, cx, by + bh / 2);

    this.ctx.globalAlpha = 1;
  }
}
