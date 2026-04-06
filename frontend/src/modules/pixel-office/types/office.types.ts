// Pixel Office — Core Type Definitions (ADR-008)

// --- Agent ---

export type AgentRole = "BACKEND" | "FRONTEND" | "DEVOPS";

export type AgentState = "IDLE" | "WALK" | "WORK" | "REST";

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  state: AgentState;
  position: TilePosition;
  renderPosition: { x: number; y: number }; // sub-pixel lerp position
  targetPosition: TilePosition | null;
  path: TilePosition[];
  direction: Direction;
  color: string;
  moveProgress: number;
  bubble: AgentBubble | null;
  wanderTimer: number; // seconds until next wander
}

export interface AgentBubble {
  text: string;
  icon?: string;
  expiresAt: number; // timestamp ms
}

// --- Tile Map ---

export interface TilePosition {
  x: number;
  y: number;
}

export type TileType = "FLOOR" | "WALL" | "FURNITURE";

export interface Tile {
  type: TileType;
  walkable: boolean;
  zone: ZoneType | null;
}

export type ZoneType = "WORK_AREA" | "SERVER_ROOM" | "LOUNGE";

export interface OfficeLayout {
  width: number;
  height: number;
  tiles: Tile[][];
  zones: ZoneConfig[];
  deskPositions: Record<AgentRole, TilePosition>;
  loungePositions: TilePosition[];
}

export interface ZoneConfig {
  type: ZoneType;
  label: string;
  bounds: { x: number; y: number; w: number; h: number };
}

// --- State Machine ---

export interface StateTransition {
  from: AgentState;
  to: AgentState;
  trigger: string;
}

// --- Events ---

export type GitHubEventType = "COMMIT" | "PR" | "ACTION_RUN" | "ACTION_COMPLETE";

export interface GitHubEvent {
  type: GitHubEventType;
  path: string;
  timestamp: string;
  actor: string;
  url?: string;
}

export interface AgentStatusUpdate {
  agentId: string;
  newState: AgentState;
  targetZone?: ZoneType;
  task?: string;
}

// --- Rendering ---

export interface RenderState {
  agents: Agent[];
  layout: OfficeLayout;
  tileSize: number;
  selectedAgentId: string | null;
}
