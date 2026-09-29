export const SOURCES = ["claude", "codex", "local"] as const;
export const ACTIVITIES = ["working", "reading", "editing", "running", "testing", "waiting"] as const;
export type Activity = typeof ACTIVITIES[number];
export interface PresenceSession {
  id: string;
  source: typeof SOURCES[number];
  activity: Activity;
  startedAt: number;
  publicTitle?: string;
  projectName?: string;
}
export interface RecentProject {
  projectName: string;
  lastActiveAt: number;
}
export interface PresenceSnapshot {
  connection: "connected" | "unavailable";
  enabled: boolean;
  updatedAt: number | null;
  sessions: PresenceSession[];
  recentProject?: RecentProject;
}
export const SOURCE_LABELS = { claude: "Claude", codex: "Codex", local: "로컬 작업" };
export const ACTIVITY_LABELS: Record<Activity, string> = {
  working: "작업 진행 중", reading: "자료 읽는 중", editing: "코드 수정 중",
  running: "명령 실행 중", testing: "테스트 실행 중", waiting: "응답 대기",
};
export const unavailableSnapshot = (): PresenceSnapshot => ({
  connection: "unavailable", enabled: false, updatedAt: null, sessions: [],
});
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export function publicTitle(value: unknown): string | undefined {
  if (typeof value !== "string" || /[\p{C}]/u.test(value)) return undefined;
  const title = value.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!title || Array.from(title).length > 48 || !/^[\p{L}\p{N}\p{M} .,!?'()·+\-]+$/u.test(title)) return undefined;
  return title;
}

export function publicProjectName(value: unknown): string | undefined {
  if (typeof value !== "string" || /[\p{C}]/u.test(value)) return undefined;
  const name = value.normalize("NFC").trim();
  if (!name || name === "." || name === ".." || Array.from(name).length > 64
    || !/^[\p{L}\p{N}\p{M} ._()\-]+$/u.test(name)) return undefined;
  return name;
}

/** Reconstruct allowlisted fields. Never forward raw input. */
export function parseSnapshot(value: unknown, now = Date.now()): PresenceSnapshot {
  if (!object(value) || value.version !== 1 || typeof value.updatedAt !== "number"
    || !Number.isFinite(value.updatedAt) || now - value.updatedAt > 15000 || value.updatedAt > now + 5000
    || typeof value.enabled !== "boolean" || !Array.isArray(value.sessions) || value.sessions.length > 24) return unavailableSnapshot();
  const sessions: PresenceSession[] = [];
  const ids = new Set<string>();
  for (const item of value.sessions) {
    if (!object(item) || typeof item.id !== "string" || !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(item.id)
      || ids.has(item.id) || !SOURCES.includes(item.source as PresenceSession["source"])
      || !ACTIVITIES.includes(item.activity as Activity) || typeof item.startedAt !== "number"
      || !Number.isFinite(item.startedAt) || item.startedAt < 0 || item.startedAt > value.updatedAt) return unavailableSnapshot();
    ids.add(item.id);
    const title = publicTitle(item.publicTitle);
    const projectName = publicProjectName(item.projectName);
    sessions.push({ ...(projectName ? { projectName } : {}), ...(title ? { publicTitle: title } : {}), id: item.id, source: item.source as PresenceSession["source"], activity: item.activity as Activity, startedAt: item.startedAt });
  }
  let recentProject: RecentProject | undefined;
  if (value.enabled && object(value.recentProject)) {
    const projectName = publicProjectName(value.recentProject.projectName);
    const lastActiveAt = value.recentProject.lastActiveAt;
    if (projectName && typeof lastActiveAt === "number" && Number.isSafeInteger(lastActiveAt)
      && lastActiveAt >= 0 && lastActiveAt <= value.updatedAt) {
      recentProject = { projectName, lastActiveAt };
    }
  }
  return { connection: "connected", enabled: value.enabled, updatedAt: value.updatedAt,
    sessions: value.enabled ? sessions : [], ...(recentProject ? { recentProject } : {}) };

}
