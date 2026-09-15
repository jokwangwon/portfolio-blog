import type { OfficeState } from "../pixel-engine/engine/officeState";
import { TILE_SIZE } from "../pixel-engine/constants";
import type { PresenceSession } from "./presence";

export class Attendance {
  private ids = new Map<string, number>();
  private nextId = 1;

  idFor(sessionId: string) { return this.ids.get(sessionId); }

  sync(office: OfficeState, sessions: PresenceSession[]) {
    const present = new Set(sessions.map(s => s.id));
    for (const [sessionId, id] of this.ids) {
      if (!present.has(sessionId)) {
        office.setAgentActive(id, false);
        office.removeAgent(id);
        this.ids.delete(sessionId);
      }
    }
    for (const session of sessions) {
      let id = this.ids.get(session.id);
      if (id === undefined) {
        id = this.nextId++;
        this.ids.set(session.id, id);
        office.addAgent(id, (id - 1) % 6, 0);
        const ch = office.characters.get(id)!;
        // Arrive from the lower walkable edge, then walk to the assigned desk.
        const entrance = office.walkableTiles.reduce<typeof office.walkableTiles[number] | undefined>(
          (best, tile) => !best || tile.row > best.row ? tile : best, undefined);
        if (entrance && ch.seatId) {
          ch.tileCol = entrance.col; ch.tileRow = entrance.row;
          ch.x = entrance.col * TILE_SIZE + TILE_SIZE / 2;
          ch.y = entrance.row * TILE_SIZE + TILE_SIZE / 2;
          office.sendToSeat(id);
        }
      }
      const ch = office.characters.get(id)!;
      if (!ch.isActive) office.setAgentActive(id, true);
      office.setAgentTool(id, session.activity === "reading" ? "Read"
        : session.activity === "waiting" ? "AwaitInput"
        : session.activity === "editing" ? "Edit" : "Bash");
      if (session.activity === "waiting") office.showPermissionBubble(id);
      else office.clearPermissionBubble(id);
    }
  }
}
