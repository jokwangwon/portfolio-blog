"use client";

import type { Agent } from "../types/office.types";

const STATE_LABELS: Record<string, string> = {
  IDLE: "대기 중",
  WALK: "이동 중",
  WORK: "작업 중",
  REST: "휴식 중",
};

const ROLE_LABELS: Record<string, string> = {
  BACKEND: "백엔드 개발자",
  FRONTEND: "프론트엔드 개발자",
  DEVOPS: "DevOps 엔지니어",
};

interface InteractionPanelProps {
  agent: Agent;
  onClose: () => void;
}

export function InteractionPanel({ agent, onClose }: InteractionPanelProps) {
  return (
    <div className="absolute top-2 right-2 w-64 rounded-lg border border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <h3 className="font-semibold text-sm">{agent.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-sm"
          aria-label="Close panel"
        >
          X
        </button>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">역할</dt>
          <dd>{ROLE_LABELS[agent.role] ?? agent.role}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">상태</dt>
          <dd>{STATE_LABELS[agent.state] ?? agent.state}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">위치</dt>
          <dd>({agent.position.x}, {agent.position.y})</dd>
        </div>
      </dl>
    </div>
  );
}
