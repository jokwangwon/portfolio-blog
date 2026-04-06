import type {
  AgentRole,
  AgentStatusUpdate,
  GitHubEvent,
  ZoneType,
} from "../types/office.types";

const BACKEND_PATTERNS = [/^backend\//, /^api-server\//];
const FRONTEND_PATTERNS = [/^frontend\//, /^src\//];
const DEVOPS_PATTERNS = [
  /^\.github\//,
  /docker-compose/,
  /Dockerfile/,
  /\.yml$/,
  /nginx/,
];

const ALL_ROLES: AgentRole[] = ["BACKEND", "FRONTEND", "DEVOPS"];

const ROLE_ZONE: Record<AgentRole, ZoneType> = {
  BACKEND: "WORK_AREA",
  FRONTEND: "WORK_AREA",
  DEVOPS: "SERVER_ROOM",
};

export class EventMapper {
  static mapEvent(event: GitHubEvent): AgentStatusUpdate[] {
    if (event.type === "ACTION_RUN" || event.type === "ACTION_COMPLETE") {
      return [
        {
          agentId: "DEVOPS",
          newState: "WORK",
          targetZone: "SERVER_ROOM",
          task: `CI/CD: ${event.path}`,
        },
      ];
    }

    const role = EventMapper.detectRole(event.path);
    if (!role) return [];

    return [
      {
        agentId: role,
        newState: "WORK",
        targetZone: ROLE_ZONE[role],
        task: `Commit: ${event.path}`,
      },
    ];
  }

  static checkInactivity(
    lastActivity: Date,
    now: Date,
    thresholdHours: number,
  ): AgentStatusUpdate[] {
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= thresholdHours) return [];

    return ALL_ROLES.map((role) => ({
      agentId: role,
      newState: "REST" as const,
      targetZone: "LOUNGE" as const,
    }));
  }

  private static detectRole(path: string): AgentRole | null {
    if (DEVOPS_PATTERNS.some((p) => p.test(path))) return "DEVOPS";
    if (BACKEND_PATTERNS.some((p) => p.test(path))) return "BACKEND";
    if (FRONTEND_PATTERNS.some((p) => p.test(path))) return "FRONTEND";
    return null;
  }
}
