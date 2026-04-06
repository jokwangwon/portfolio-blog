import type { TilePosition } from "../types/office.types";

const MAX_DELTA_MS = 100;

interface MovingAgent {
  position: TilePosition;
  targetPosition: TilePosition | null;
  path: TilePosition[];
  state: string;
  moveProgress: number;
}

interface MovementResult {
  position: TilePosition;
  pathIndex: number;
  moveProgress: number;
  arrived: boolean;
}

export class GameLoop {
  private updateFn: (dt: number) => void;

  constructor(updateFn: (dt: number) => void) {
    this.updateFn = updateFn;
  }

  tick(deltaMs: number): void {
    if (deltaMs <= 0) return;
    const clamped = Math.min(deltaMs, MAX_DELTA_MS);
    const dtSeconds = clamped / 1000;
    this.updateFn(dtSeconds);
  }

  static updateAgentMovement(
    agent: MovingAgent,
    dt: number,
    speed: number,
  ): MovementResult {
    const path = agent.path;
    if (path.length < 2) {
      return {
        position: agent.position,
        pathIndex: 0,
        moveProgress: 0,
        arrived: true,
      };
    }

    const progress = agent.moveProgress + dt * speed;
    const pathIndex = Math.floor(progress);

    if (pathIndex >= path.length - 1) {
      return {
        position: path[path.length - 1],
        pathIndex: path.length - 1,
        moveProgress: 0,
        arrived: true,
      };
    }

    return {
      position: path[pathIndex],
      pathIndex,
      moveProgress: progress,
      arrived: false,
    };
  }
}
