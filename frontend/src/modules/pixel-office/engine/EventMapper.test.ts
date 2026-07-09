import { describe, it, expect } from "vitest";
import { EventMapper } from "./EventMapper";
import type { GitHubEvent, AgentStatusUpdate } from "../types/office.types";

describe("EventMapper", () => {
  describe("mapEvent", () => {
    it("should map backend commit to BACKEND agent WORK state", () => {
      const event: GitHubEvent = {
        type: "COMMIT",
        path: "backend/module-auth/src/main/java/Service.java",
        timestamp: "2026-04-06T10:00:00Z",
        actor: "kwangwon",
      };
      const updates = EventMapper.mapEvent(event);
      expect(updates).toHaveLength(1);
      expect(updates[0].agentId).toBe("BACKEND");
      expect(updates[0].newState).toBe("WORK");
      expect(updates[0].targetZone).toBe("WORK_AREA");
    });

    it("should map frontend commit to FRONTEND agent WORK state", () => {
      const event: GitHubEvent = {
        type: "COMMIT",
        path: "frontend/src/modules/blog/components/PostCard.tsx",
        timestamp: "2026-04-06T10:00:00Z",
        actor: "kwangwon",
      };
      const updates = EventMapper.mapEvent(event);
      expect(updates).toHaveLength(1);
      expect(updates[0].agentId).toBe("FRONTEND");
      expect(updates[0].newState).toBe("WORK");
    });

    it("should map CI/CD action to DEVOPS agent WORK state", () => {
      const event: GitHubEvent = {
        type: "ACTION_COMPLETE",
        path: ".github/workflows/ci.yml",
        timestamp: "2026-04-06T10:00:00Z",
        actor: "github-actions",
      };
      const updates = EventMapper.mapEvent(event);
      expect(updates).toHaveLength(1);
      expect(updates[0].agentId).toBe("DEVOPS");
      expect(updates[0].newState).toBe("WORK");
      expect(updates[0].targetZone).toBe("SERVER_ROOM");
    });

    it("should map infrastructure file commit to DEVOPS", () => {
      const event: GitHubEvent = {
        type: "COMMIT",
        path: "docker-compose.yml",
        timestamp: "2026-04-06T10:00:00Z",
        actor: "kwangwon",
      };
      const updates = EventMapper.mapEvent(event);
      expect(updates[0].agentId).toBe("DEVOPS");
    });

    it("should map docs commit to no specific agent", () => {
      const event: GitHubEvent = {
        type: "COMMIT",
        path: "docs/architecture/pixel-office-design.md",
        timestamp: "2026-04-06T10:00:00Z",
        actor: "kwangwon",
      };
      const updates = EventMapper.mapEvent(event);
      expect(updates).toHaveLength(0);
    });
  });

  describe("checkInactivity", () => {
    it("should return REST updates for all agents when inactive > threshold", () => {
      const lastActivity = new Date("2026-04-05T10:00:00Z");
      const now = new Date("2026-04-06T10:00:00Z"); // 24h later
      const updates = EventMapper.checkInactivity(lastActivity, now, 12);
      expect(updates).toHaveLength(3);
      updates.forEach((u: AgentStatusUpdate) => {
        expect(u.newState).toBe("REST");
        expect(u.targetZone).toBe("LOUNGE");
      });
    });

    it("should return empty when within activity threshold", () => {
      const lastActivity = new Date("2026-04-06T08:00:00Z");
      const now = new Date("2026-04-06T10:00:00Z"); // 2h later
      const updates = EventMapper.checkInactivity(lastActivity, now, 12);
      expect(updates).toHaveLength(0);
    });
  });
});
