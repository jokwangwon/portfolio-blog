import type {
  Agent,
  AgentState,
  Direction,
  OfficeLayout,
  RenderState,
  ZoneType,
} from "../types/office.types";

// --- pixel-agents inspired dark office palette ---
const ZONE_FLOOR_COLORS: Record<ZoneType, { bg: string; pattern: string }> = {
  WORK_AREA: { bg: "#4A4A6A", pattern: "#52527A" },
  SERVER_ROOM: { bg: "#3A4A5A", pattern: "#42526A" },
  LOUNGE: { bg: "#4A5A4A", pattern: "#526A52" },
};

const WALL_COLOR = "#2A2A4C";
const WALL_TOP = "#3A3A5C";
const CORRIDOR_COLOR = "#3E3E5E";
const VOID_COLOR = "#1A1A2E";

const AGENT_PALETTES: Record<string, { body: string; hair: string; shirt: string }> = {
  BACKEND: { body: "#F5D6B8", hair: "#5A3825", shirt: "#4A90D9" },
  FRONTEND: { body: "#F5D6B8", hair: "#8B4513", shirt: "#D94A8C" },
  DEVOPS: { body: "#F5D6B8", hair: "#2F4F4F", shirt: "#6BD94A" },
};

const AGENT_LABELS: Record<string, string> = {
  BACKEND: "BE",
  FRONTEND: "FE",
  DEVOPS: "OP",
};

// Simple 8x12 pixel character template (row-major, 0=transparent)
// h=hair, b=body(skin), s=shirt, p=pants, f=feet
type P = "" | "h" | "b" | "s" | "p" | "f" | "e"; // e=eye
const CHAR_DOWN: P[][] = [
  ["", "", "h", "h", "h", "h", "", ""],
  ["", "h", "h", "h", "h", "h", "h", ""],
  ["", "h", "h", "h", "h", "h", "h", ""],
  ["", "b", "e", "b", "b", "e", "b", ""],
  ["", "b", "b", "b", "b", "b", "b", ""],
  ["", "", "s", "s", "s", "s", "", ""],
  ["", "s", "s", "s", "s", "s", "s", ""],
  ["", "s", "s", "s", "s", "s", "s", ""],
  ["", "", "s", "s", "s", "s", "", ""],
  ["", "", "p", "p", "p", "p", "", ""],
  ["", "", "p", "", "", "p", "", ""],
  ["", "", "f", "", "", "f", "", ""],
];

const CHAR_UP: P[][] = [
  ["", "", "h", "h", "h", "h", "", ""],
  ["", "h", "h", "h", "h", "h", "h", ""],
  ["", "h", "h", "h", "h", "h", "h", ""],
  ["", "h", "h", "h", "h", "h", "h", ""],
  ["", "b", "b", "b", "b", "b", "b", ""],
  ["", "", "s", "s", "s", "s", "", ""],
  ["", "s", "s", "s", "s", "s", "s", ""],
  ["", "s", "s", "s", "s", "s", "s", ""],
  ["", "", "s", "s", "s", "s", "", ""],
  ["", "", "p", "p", "p", "p", "", ""],
  ["", "", "p", "", "", "p", "", ""],
  ["", "", "f", "", "", "f", "", ""],
];

const CHAR_SIDE: P[][] = [
  ["", "", "h", "h", "h", "", "", ""],
  ["", "h", "h", "h", "h", "h", "", ""],
  ["", "h", "h", "h", "h", "h", "", ""],
  ["", "b", "e", "b", "b", "", "", ""],
  ["", "b", "b", "b", "", "", "", ""],
  ["", "", "s", "s", "s", "", "", ""],
  ["", "", "s", "s", "s", "s", "", ""],
  ["", "b", "s", "s", "s", "", "", ""],
  ["", "", "s", "s", "s", "", "", ""],
  ["", "", "p", "p", "", "", "", ""],
  ["", "", "p", "", "p", "", "", ""],
  ["", "", "f", "", "f", "", "", ""],
];

const CHAR_TYPING: P[][] = [
  ["", "", "h", "h", "h", "h", "", ""],
  ["", "h", "h", "h", "h", "h", "h", ""],
  ["", "h", "h", "h", "h", "h", "h", ""],
  ["", "b", "e", "b", "b", "e", "b", ""],
  ["", "b", "b", "b", "b", "b", "b", ""],
  ["", "", "s", "s", "s", "s", "", ""],
  ["", "s", "s", "s", "s", "s", "s", ""],
  ["", "b", "s", "s", "s", "s", "b", ""],
  ["", "", "b", "s", "s", "b", "", ""],
  ["", "", "p", "p", "p", "p", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
];

function getCharSprite(dir: Direction, state: AgentState): P[][] {
  if (state === "WORK") return CHAR_TYPING;
  if (state === "REST") return CHAR_DOWN;
  if (dir === "UP") return CHAR_UP;
  if (dir === "LEFT" || dir === "RIGHT") return CHAR_SIDE;
  return CHAR_DOWN;
}

export class SpriteRenderer {
  private ctx: CanvasRenderingContext2D;
  private tileSize: number;
  private tileCache: HTMLCanvasElement | null = null;
  private charCache = new Map<string, HTMLCanvasElement>();

  constructor(ctx: CanvasRenderingContext2D, tileSize: number) {
    this.ctx = ctx;
    this.tileSize = tileSize;
  }

  render(state: RenderState): void {
    const { layout, agents, selectedAgentId } = state;
    const width = layout.width * this.tileSize;
    const height = layout.height * this.tileSize;

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, width, height);

    this.renderTilesFromCache(layout, width, height);
    this.renderFurniture(layout);

    // Z-sort by Y position
    const sorted = [...agents].sort((a, b) => a.renderPosition.y - b.renderPosition.y);
    for (const agent of sorted) {
      this.renderAgent(agent, agent.id === selectedAgentId);
    }

    // Bubbles on top
    const now = Date.now();
    for (const agent of sorted) {
      this.renderBubble(agent, now);
    }
  }

  // --- Tile rendering with cache ---

  private renderTilesFromCache(layout: OfficeLayout, width: number, height: number): void {
    if (!this.tileCache) {
      this.tileCache = document.createElement("canvas");
      this.tileCache.width = width;
      this.tileCache.height = height;
      const c = this.tileCache.getContext("2d")!;
      this.renderTilesTo(c, layout);
    }
    this.ctx.drawImage(this.tileCache, 0, 0);
  }

  private renderTilesTo(ctx: CanvasRenderingContext2D, layout: OfficeLayout): void {
    const ts = this.tileSize;

    // Fill void
    ctx.fillStyle = VOID_COLOR;
    ctx.fillRect(0, 0, layout.width * ts, layout.height * ts);

    for (let y = 0; y < layout.height; y++) {
      for (let x = 0; x < layout.width; x++) {
        const tile = layout.tiles[y][x];
        const px = x * ts;
        const py = y * ts;

        if (tile.type === "WALL") {
          this.renderWallTile(ctx, px, py, ts, layout, x, y);
        } else if (tile.walkable) {
          const zone = tile.zone;
          const colors = zone ? ZONE_FLOOR_COLORS[zone] : { bg: CORRIDOR_COLOR, pattern: "#464668" };

          ctx.fillStyle = colors.bg;
          ctx.fillRect(px, py, ts, ts);

          // Checkerboard pattern
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = colors.pattern;
            ctx.fillRect(px, py, ts, ts);
          }

          // Subtle grid
          ctx.strokeStyle = "rgba(255,255,255,0.04)";
          ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
        }
      }
    }

    // Zone labels
    ctx.font = `bold ${Math.max(9, ts * 0.35)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    for (const zone of layout.zones) {
      const cx = (zone.bounds.x + zone.bounds.w / 2) * ts;
      const cy = (zone.bounds.y + 0.6) * ts;
      ctx.fillText(zone.label, cx, cy);
    }
  }

  private renderWallTile(
    ctx: CanvasRenderingContext2D, px: number, py: number, ts: number,
    layout: OfficeLayout, x: number, y: number,
  ): void {
    // Wall base
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(px, py, ts, ts);

    // Top face (lighter) — if tile above is not wall, show "top"
    const aboveIsWall = y > 0 && layout.tiles[y - 1][x].type === "WALL";
    if (!aboveIsWall) {
      ctx.fillStyle = WALL_TOP;
      ctx.fillRect(px, py, ts, ts * 0.6);
    }

    // Brick pattern
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.5;
    const brickH = ts / 3;
    for (let row = 0; row < 3; row++) {
      const by = py + row * brickH;
      ctx.strokeRect(px, by, ts, brickH);
      // Offset bricks
      const offset = row % 2 === 0 ? 0 : ts / 2;
      ctx.beginPath();
      ctx.moveTo(px + offset + ts / 2, by);
      ctx.lineTo(px + offset + ts / 2, by + brickH);
      ctx.stroke();
    }

    // Edge highlight
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
  }

  // --- Furniture ---

  private renderFurniture(layout: OfficeLayout): void {
    const ts = this.tileSize;

    // Desks
    for (const [, pos] of Object.entries(layout.deskPositions)) {
      const px = pos.x * ts;
      const py = (pos.y - 0.4) * ts;

      // Desk surface
      this.ctx.fillStyle = "#6B5842";
      this.ctx.fillRect(px + 2, py + 2, ts - 4, ts * 0.45);
      // Desk highlight
      this.ctx.fillStyle = "#7D6B54";
      this.ctx.fillRect(px + 3, py + 3, ts - 6, ts * 0.15);
      // Monitor
      this.ctx.fillStyle = "#222";
      this.ctx.fillRect(px + ts * 0.25, py - ts * 0.15, ts * 0.5, ts * 0.35);
      // Screen glow
      this.ctx.fillStyle = "#3A6A8A";
      this.ctx.fillRect(px + ts * 0.3, py - ts * 0.1, ts * 0.4, ts * 0.25);
      // Monitor stand
      this.ctx.fillStyle = "#444";
      this.ctx.fillRect(px + ts * 0.42, py + ts * 0.2, ts * 0.16, ts * 0.08);
    }

    // Lounge sofas
    for (const pos of layout.loungePositions) {
      const px = pos.x * ts;
      const py = pos.y * ts;

      // Sofa back
      this.ctx.fillStyle = "#5A3A4A";
      this.ctx.fillRect(px + 2, py + 2, ts - 4, ts * 0.35);
      // Sofa seat
      this.ctx.fillStyle = "#7A4A5A";
      this.ctx.fillRect(px + 3, py + ts * 0.35, ts - 6, ts * 0.45);
      // Sofa cushion highlight
      this.ctx.fillStyle = "#8A5A6A";
      this.ctx.fillRect(px + 5, py + ts * 0.4, ts * 0.35, ts * 0.3);
      this.ctx.fillRect(px + ts * 0.55, py + ts * 0.4, ts * 0.35, ts * 0.3);
    }

    // Server room rack
    const serverZone = layout.zones.find((z) => z.type === "SERVER_ROOM");
    if (serverZone) {
      const rackX = (serverZone.bounds.x + 2) * ts;
      const rackY = (serverZone.bounds.y + 1.5) * ts;
      // Rack body
      this.ctx.fillStyle = "#333";
      this.ctx.fillRect(rackX, rackY, ts * 0.8, ts * 1.5);
      // Rack face
      this.ctx.fillStyle = "#444";
      this.ctx.fillRect(rackX + 2, rackY + 2, ts * 0.8 - 4, ts * 1.5 - 4);
      // LED lights
      for (let i = 0; i < 4; i++) {
        this.ctx.fillStyle = i < 3 ? "#4ADE80" : "#FBBF24";
        this.ctx.fillRect(rackX + 4, rackY + 6 + i * ts * 0.35, 3, 3);
      }
      // Vent lines
      this.ctx.strokeStyle = "#555";
      this.ctx.lineWidth = 0.5;
      for (let i = 0; i < 6; i++) {
        const ly = rackY + ts * 0.3 + i * 5;
        this.ctx.beginPath();
        this.ctx.moveTo(rackX + ts * 0.3, ly);
        this.ctx.lineTo(rackX + ts * 0.7, ly);
        this.ctx.stroke();
      }
    }
  }

  // --- Character rendering (pixel-art procedural sprites) ---

  private renderAgent(agent: Agent, selected: boolean): void {
    const rx = agent.renderPosition.x;
    const ry = agent.renderPosition.y;
    const ts = this.tileSize;
    const palette = AGENT_PALETTES[agent.role] ?? AGENT_PALETTES.BACKEND;
    const sprite = getCharSprite(agent.direction, agent.state);
    const flipH = agent.direction === "LEFT";

    // Shadow
    this.ctx.fillStyle = "rgba(0,0,0,0.25)";
    this.ctx.beginPath();
    this.ctx.ellipse(rx + ts / 2, ry + ts - 2, ts * 0.3, ts * 0.1, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Selection glow
    if (selected) {
      this.ctx.shadowColor = "#FFD700";
      this.ctx.shadowBlur = 8;
    }

    // Draw pixel character
    this.renderPixelSprite(rx, ry, ts, sprite, palette, flipH);

    if (selected) {
      this.ctx.shadowColor = "transparent";
      this.ctx.shadowBlur = 0;

      // Selection outline
      this.ctx.strokeStyle = "#FFD700";
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(rx + 2, ry - 2, ts - 4, ts + 2);
    }

    // Role badge
    const label = AGENT_LABELS[agent.role] ?? "?";
    const badgeX = rx + ts - 2;
    const badgeY = ry + 2;
    this.ctx.fillStyle = palette.shirt;
    this.ctx.beginPath();
    this.ctx.arc(badgeX, badgeY, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = "#FFF";
    this.ctx.font = "bold 6px monospace";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(label, badgeX, badgeY);

    // State icon above head
    const stateIcons: Record<string, string> = { WORK: "⌨", REST: "☕" };
    const icon = stateIcons[agent.state];
    if (icon) {
      this.ctx.font = `${Math.max(10, ts * 0.4)}px serif`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "bottom";
      this.ctx.fillStyle = "#FFF";
      this.ctx.fillText(icon, rx + ts / 2, ry - 6);
    }
  }

  private renderPixelSprite(
    rx: number, ry: number, ts: number,
    sprite: P[][], palette: { body: string; hair: string; shirt: string },
    flipH: boolean,
  ): void {
    const rows = sprite.length;
    const cols = sprite[0].length;
    const pixelW = ts / cols;
    const pixelH = ts / rows;

    const colorMap: Record<string, string> = {
      h: palette.hair,
      b: palette.body,
      s: palette.shirt,
      p: "#3A3A5A",
      f: "#4A3A2A",
      e: "#222",
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = sprite[r][flipH ? cols - 1 - c : c];
        if (p === "") continue;

        const color = colorMap[p];
        if (!color) continue;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          Math.floor(rx + c * pixelW),
          Math.floor(ry + r * pixelH),
          Math.ceil(pixelW),
          Math.ceil(pixelH),
        );
      }
    }
  }

  // --- Bubble ---

  private renderBubble(agent: Agent, now: number): void {
    if (!agent.bubble) return;
    if (agent.bubble.expiresAt > 0 && now > agent.bubble.expiresAt) return;

    const cx = agent.renderPosition.x + this.tileSize / 2;
    const cy = agent.renderPosition.y - 8;
    const text = agent.bubble.text;
    const fontSize = Math.max(7, this.tileSize * 0.25);

    this.ctx.font = `${fontSize}px monospace`;
    const metrics = this.ctx.measureText(text);
    const padX = 4;
    const padY = 2;
    const bw = Math.min(metrics.width + padX * 2, this.tileSize * 3);
    const bh = fontSize + padY * 2;
    const bx = cx - bw / 2;
    const by = cy - bh;

    // Fade out
    let alpha = 1;
    if (agent.bubble.expiresAt > 0) {
      const remaining = agent.bubble.expiresAt - now;
      if (remaining < 1000) alpha = Math.max(0, remaining / 1000);
    }

    this.ctx.globalAlpha = alpha;

    // Dark bubble background (pixel-agents style)
    this.ctx.fillStyle = "rgba(30,30,50,0.85)";
    this.ctx.beginPath();
    this.ctx.roundRect(bx, by, bw, bh, 2);
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(255,255,255,0.2)";
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();

    // Pointer
    this.ctx.fillStyle = "rgba(30,30,50,0.85)";
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 2, by + bh);
    this.ctx.lineTo(cx, by + bh + 3);
    this.ctx.lineTo(cx + 2, by + bh);
    this.ctx.fill();

    // Text
    this.ctx.fillStyle = "#EEEEFF";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(text.length > 15 ? text.slice(0, 15) + "…" : text, cx, by + bh / 2);

    this.ctx.globalAlpha = 1;
  }
}
