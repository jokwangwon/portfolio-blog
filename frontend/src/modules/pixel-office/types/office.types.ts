// Pixel Office — Type Definitions
// MVP-specific types removed after pixel-agents engine transplant.
// pixel-engine/types.ts now provides Agent, OfficeLayout, etc.
// This file retains GitHub integration types used by EventMapper + useAgentStatus.

export type AgentRole = "BACKEND" | "FRONTEND" | "DEVOPS";

export type AgentState = "IDLE" | "WALK" | "WORK" | "REST";

export type ZoneType = "WORK_AREA" | "SERVER_ROOM" | "LOUNGE";

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
