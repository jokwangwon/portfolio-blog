import type { OfficeState } from "../pixel-engine/engine/officeState";
import { CharacterState, Direction } from "../pixel-engine/types";
import { TILE_SIZE } from "../pixel-engine/constants";
import type { PresenceSession } from "./presence";

export class Attendance {
  private ids = new Map<string, number>();
  private nextId = 1;
  private departures = new Map<string, { id: number; elapsed: number; walking: boolean }>();

  private finish(office: OfficeState, id: number) {
    office.removeAgent(id); // release the seat and selection
    office.characters.delete(id);
  }

  /** UI-only departure; ended sessions are never kept in the active registry. */
  update(office: OfficeState, dt: number, reducedMotion = false): number {
    for (const [key, departure] of this.departures) {
      const ch = office.characters.get(departure.id);
      departure.elapsed += dt;
      if (!ch || reducedMotion || departure.elapsed >= 15 || (departure.walking && ch.path.length === 0)) {
        this.finish(office, departure.id); this.departures.delete(key); continue;
      }
      if (!departure.walking && departure.elapsed >= 1.2) {
        const exit = office.walkableTiles.reduce<typeof office.walkableTiles[number] | undefined>(
          (best, tile) => !best || tile.row > best.row ? tile : best, undefined);
        ch.bubbleType = null;
        if (!exit || !office.walkToTile(ch.id, exit.col, exit.row)) {
          this.finish(office, ch.id); this.departures.delete(key); continue;
        }
        departure.walking = true;
      }
    }
    return this.departures.size;
  }

  idFor(sessionId: string) { return this.ids.get(sessionId); }

  sync(office: OfficeState, sessions: PresenceSession[], animateDepartures = true) {
    if (!animateDepartures) {
      for (const id of this.ids.values()) this.finish(office, id);
      for (const departure of this.departures.values()) this.finish(office, departure.id);
      this.ids.clear(); this.departures.clear();
      return;
    }
    const present = new Set(sessions.map(s => s.id));
    for (const [sessionId, id] of this.ids) {
      if (!present.has(sessionId)) {
        office.setAgentActive(id, false);
        const ch = office.characters.get(id);
        if (ch) {
          // Stand briefly, with no typing or idle wandering, before heading out.
          ch.matrixEffect = null; ch.matrixEffectTimer = 0; ch.matrixEffectSeeds = [];
          ch.state = CharacterState.IDLE; ch.dir = Direction.DOWN;
          ch.frame = 0; ch.frameTimer = 0; ch.currentTool = null;
          ch.wanderTimer = Infinity;
          office.showWaitingBubble(id);
          this.departures.set(sessionId, { id, elapsed: 0, walking: false });
        }
        this.ids.delete(sessionId);
      }
    }
    for (const session of sessions) {
      let id = this.ids.get(session.id);
      const returning = this.departures.get(session.id);
      if (id === undefined && returning && office.characters.has(returning.id)) {
        id = returning.id; this.departures.delete(session.id); this.ids.set(session.id, id);
        office.setAgentActive(id, true); office.sendToSeat(id);
      }
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
      if (session.activity === "waiting") office.showWaitingBubble(id);
      else { ch.bubbleType = null; ch.bubbleTimer = 0; }
    }
  }
}
