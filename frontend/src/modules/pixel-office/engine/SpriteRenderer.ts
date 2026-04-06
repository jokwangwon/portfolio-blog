import type {
  Agent,
  RenderState,
  ZoneType,
} from "../types/office.types";
import { TileMap } from "./TileMap";

const ZONE_COLORS: Record<ZoneType, string> = {
  WORK_AREA: "#E8D5B7",
  SERVER_ROOM: "#C5D5E4",
  LOUNGE: "#D5E8D0",
};

const WALL_COLOR = "#8B7355";
const CORRIDOR_COLOR = "#F0E6D3";
const GRID_COLOR = "rgba(0,0,0,0.05)";

const AGENT_COLORS: Record<string, string> = {
  BACKEND: "#4A90D9",
  FRONTEND: "#D94A8C",
  DEVOPS: "#6BD94A",
};

const AGENT_LABELS: Record<string, string> = {
  BACKEND: "BE",
  FRONTEND: "FE",
  DEVOPS: "OP",
};

export class SpriteRenderer {
  private ctx: CanvasRenderingContext2D;
  private tileSize: number;

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

    this.renderTiles(layout);
    this.renderZoneLabels(layout);
    this.renderFurniture(layout);
    this.renderAgents(agents, selectedAgentId);
  }

  private renderTiles(layout: OfficeLayout): void {
    for (let y = 0; y < layout.height; y++) {
      for (let x = 0; x < layout.width; x++) {
        const tile = layout.tiles[y][x];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        if (tile.type === "WALL") {
          this.ctx.fillStyle = WALL_COLOR;
        } else if (tile.zone) {
          this.ctx.fillStyle = ZONE_COLORS[tile.zone];
        } else {
          this.ctx.fillStyle = CORRIDOR_COLOR;
        }

        this.ctx.fillRect(px, py, this.tileSize, this.tileSize);

        // Grid lines
        if (tile.walkable) {
          this.ctx.strokeStyle = GRID_COLOR;
          this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        }
      }
    }
  }

  private renderZoneLabels(layout: OfficeLayout): void {
    this.ctx.font = `bold ${Math.max(10, this.tileSize * 0.4)}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillStyle = "rgba(0,0,0,0.3)";

    for (const zone of layout.zones) {
      const cx = (zone.bounds.x + zone.bounds.w / 2) * this.tileSize;
      const cy = (zone.bounds.y + 0.8) * this.tileSize;
      this.ctx.fillText(zone.label, cx, cy);
    }
  }

  private renderFurniture(layout: OfficeLayout): void {
    // Desks: small rectangles at desk positions
    this.ctx.fillStyle = "#A0856E";
    for (const pos of Object.values(layout.deskPositions)) {
      const px = pos.x * this.tileSize + this.tileSize * 0.1;
      const py = (pos.y - 0.5) * this.tileSize + this.tileSize * 0.1;
      this.ctx.fillRect(px, py, this.tileSize * 0.8, this.tileSize * 0.4);
    }

    // Lounge: sofa placeholders
    this.ctx.fillStyle = "#7EB5A6";
    for (const pos of layout.loungePositions) {
      const px = pos.x * this.tileSize + this.tileSize * 0.15;
      const py = pos.y * this.tileSize + this.tileSize * 0.2;
      this.ctx.fillRect(px, py, this.tileSize * 0.7, this.tileSize * 0.6);
    }
  }

  private renderAgents(agents: Agent[], selectedId: string | null): void {
    for (const agent of agents) {
      this.renderAgent(agent, agent.id === selectedId);
    }
  }

  private renderAgent(agent: Agent, selected: boolean): void {
    const pixel = TileMap.tileToPixel(agent.position, this.tileSize);
    const cx = pixel.x + this.tileSize / 2;
    const cy = pixel.y + this.tileSize / 2;
    const radius = this.tileSize * 0.35;
    const color = AGENT_COLORS[agent.role] ?? "#999";

    // Selection ring
    if (selected) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#FFD700";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Agent body (circle)
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(0,0,0,0.3)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Direction indicator
    this.renderDirectionIndicator(agent, cx, cy, radius);

    // Label
    const label = AGENT_LABELS[agent.role] ?? "?";
    this.ctx.font = `bold ${Math.max(8, this.tileSize * 0.3)}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = "#FFF";
    this.ctx.fillText(label, cx, cy);

    // State bubble
    this.renderStateBubble(agent, cx, cy - radius - 6);
  }

  private renderDirectionIndicator(
    agent: Agent,
    cx: number,
    cy: number,
    radius: number,
  ): void {
    if (agent.state !== "WALK") return;

    const offsets = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
    const [dx, dy] = offsets[agent.direction];
    const tipX = cx + dx * (radius + 4);
    const tipY = cy + dy * (radius + 4);

    this.ctx.beginPath();
    this.ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
    this.ctx.fillStyle = "#FFF";
    this.ctx.fill();
  }

  private renderStateBubble(agent: Agent, cx: number, cy: number): void {
    const icons: Record<string, string> = {
      WORK: "⌨",
      REST: "☕",
      WALK: "→",
    };
    const icon = icons[agent.state];
    if (!icon) return;

    this.ctx.font = `${Math.max(10, this.tileSize * 0.35)}px serif`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "bottom";
    this.ctx.fillStyle = "#333";
    this.ctx.fillText(icon, cx, cy);
  }
}
