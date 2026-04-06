import type { AgentState } from "../types/office.types";

type Trigger =
  | "COMMIT"
  | "COMPLETE"
  | "INACTIVE"
  | "ACTIVATE"
  | "MOVE"
  | "ARRIVE";

interface TransitionRule {
  from: AgentState;
  trigger: Trigger;
  to: AgentState;
}

const TRANSITIONS: TransitionRule[] = [
  { from: "IDLE", trigger: "COMMIT", to: "WORK" },
  { from: "IDLE", trigger: "INACTIVE", to: "REST" },
  { from: "IDLE", trigger: "MOVE", to: "WALK" },
  { from: "WORK", trigger: "COMPLETE", to: "IDLE" },
  { from: "WORK", trigger: "MOVE", to: "WALK" },
  { from: "REST", trigger: "ACTIVATE", to: "IDLE" },
  { from: "REST", trigger: "MOVE", to: "WALK" },
  { from: "WALK", trigger: "ARRIVE", to: "IDLE" },
];

export class StateMachine {
  private _current: AgentState;

  constructor(initial: AgentState) {
    this._current = initial;
  }

  get current(): AgentState {
    return this._current;
  }

  transition(trigger: string): AgentState | null {
    const rule = TRANSITIONS.find(
      (r) => r.from === this._current && r.trigger === trigger,
    );
    if (!rule) return null;
    this._current = rule.to;
    return rule.to;
  }

  canTransition(trigger: string): boolean {
    return TRANSITIONS.some(
      (r) => r.from === this._current && r.trigger === trigger,
    );
  }

  getAvailableTriggers(): string[] {
    return TRANSITIONS.filter((r) => r.from === this._current).map(
      (r) => r.trigger,
    );
  }
}
