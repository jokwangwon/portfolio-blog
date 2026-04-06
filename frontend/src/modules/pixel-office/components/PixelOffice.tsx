"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { useAgentStatus } from "../hooks/useAgentStatus";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";
import { SpriteRenderer } from "../engine/SpriteRenderer";
import { TileMap } from "../engine/TileMap";
import { PathFinder } from "../engine/PathFinder";
import { StateMachine } from "../engine/StateMachine";
import { EventMapper } from "../engine/EventMapper";
import type {
  Agent,
  AgentRole,
  RenderState,
} from "../types/office.types";
import { InteractionPanel } from "./InteractionPanel";

const TILE_SIZE = 32;
const MOVE_SPEED = 3; // tiles per second
const WANDER_MIN = 8;
const WANDER_MAX = 15;

function randomWanderDelay(): number {
  return WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN);
}

function createInitialAgents(layout: ReturnType<typeof TileMap.createDefaultLayout>): Agent[] {
  const roles: { role: AgentRole; name: string; color: string }[] = [
    { role: "BACKEND", name: "백엔드 개발자", color: "#4A90D9" },
    { role: "FRONTEND", name: "프론트엔드 개발자", color: "#D94A8C" },
    { role: "DEVOPS", name: "DevOps 엔지니어", color: "#6BD94A" },
  ];

  return roles.map(({ role, name, color }) => {
    const pos = layout.deskPositions[role];
    return {
      id: role,
      role,
      name,
      state: "IDLE" as const,
      position: { ...pos },
      renderPosition: { x: pos.x * TILE_SIZE, y: pos.y * TILE_SIZE },
      targetPosition: null,
      path: [],
      direction: "DOWN" as const,
      color,
      moveProgress: 0,
      bubble: null,
      wanderTimer: randomWanderDelay(),
    };
  });
}

export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  const layout = useMemo(() => TileMap.createDefaultLayout(), []);
  const [agents, setAgents] = useState<Agent[]>(() => createInitialAgents(layout));
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [replayActive, setReplayActive] = useState(true);

  const agentsRef = useRef(agents);
  useEffect(() => { agentsRef.current = agents; });

  const stateMachines = useRef<Record<string, StateMachine>>({} as Record<string, StateMachine>);
  useEffect(() => {
    if (Object.keys(stateMachines.current).length === 0) {
      stateMachines.current = Object.fromEntries(
        agents.map((a) => [a.id, new StateMachine(a.state)]),
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rendererRef = useRef<SpriteRenderer | null>(null);

  const { data: activityData } = useAgentStatus();

  // Process GitHub events
  useEffect(() => {
    if (!activityData) return;

    setAgents((prev) => {
      const updated = [...prev];

      for (const event of activityData.events) {
        const updates = EventMapper.mapEvent(event);
        for (const update of updates) {
          const idx = updated.findIndex((a) => a.id === update.agentId);
          if (idx === -1) continue;

          const sm = stateMachines.current[update.agentId];
          if (!sm || !sm.canTransition("COMMIT")) continue;

          sm.transition("COMMIT");
          updated[idx] = {
            ...updated[idx],
            state: "WORK",
            bubble: {
              text: update.task?.slice(0, 20) ?? "작업 중...",
              expiresAt: Date.now() + 5000,
            },
          };
        }
      }

      // Inactivity check
      if (activityData.lastActivity) {
        const inactiveUpdates = EventMapper.checkInactivity(
          new Date(activityData.lastActivity), new Date(), 12,
        );
        for (const update of inactiveUpdates) {
          const idx = updated.findIndex((a) => a.id === update.agentId);
          if (idx === -1) continue;
          const sm = stateMachines.current[update.agentId];
          if (!sm || sm.current !== "IDLE") continue;

          const loungePos = TileMap.getRandomLoungePosition(layout);
          const path = PathFinder.findPath(layout.tiles, updated[idx].position, loungePos);
          if (path && path.length > 1) {
            sm.transition("MOVE");
            updated[idx] = {
              ...updated[idx],
              state: "WALK",
              targetPosition: loungePos,
              path,
              moveProgress: 0,
              bubble: { text: "☕ 휴식", icon: "☕", expiresAt: 0 },
            };
          }
        }
      }

      return updated;
    });
  }, [activityData, layout]);

  // Timelapse replay: simulate activity on page load
  useEffect(() => {
    if (!replayActive) return;

    const events = [
      { delay: 2000, agentId: "FRONTEND", task: "UI 컴포넌트 작업" },
      { delay: 5000, agentId: "BACKEND", task: "JWT 인증 구현" },
      { delay: 8000, agentId: "DEVOPS", task: "Docker 빌드" },
      { delay: 12000, agentId: "FRONTEND", task: "블로그 에디터" },
      { delay: 16000, agentId: "BACKEND", task: "API 테스트" },
    ];

    const timers = events.map(({ delay, agentId, task }) =>
      setTimeout(() => {
        setAgents((prev) => {
          const idx = prev.findIndex((a) => a.id === agentId);
          if (idx === -1) return prev;
          const updated = [...prev];
          const sm = stateMachines.current[agentId];
          if (sm && sm.current !== "WORK") {
            if (sm.canTransition("COMMIT")) sm.transition("COMMIT");
            else if (sm.current === "WALK") {
              sm.transition("ARRIVE");
              sm.transition("COMMIT");
            }
          }
          updated[idx] = {
            ...updated[idx],
            state: "WORK",
            bubble: { text: task, expiresAt: Date.now() + 4000 },
            wanderTimer: randomWanderDelay(),
          };
          return updated;
        });

        // Return to IDLE after work
        setTimeout(() => {
          setAgents((prev) => {
            const idx = prev.findIndex((a) => a.id === agentId);
            if (idx === -1) return prev;
            const updated = [...prev];
            const sm = stateMachines.current[agentId];
            if (sm && sm.current === "WORK" && sm.canTransition("COMPLETE")) {
              sm.transition("COMPLETE");
            }
            updated[idx] = { ...updated[idx], state: "IDLE", wanderTimer: randomWanderDelay() };
            return updated;
          });
        }, 3000);
      }, delay),
    );

    const stopTimer = setTimeout(() => setReplayActive(false), 20000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(stopTimer);
    };
  }, [replayActive]);

  // Game frame: lerp movement + wander
  const onFrame = useCallback(
    (ctx: CanvasRenderingContext2D, deltaMs: number) => {
      const dt = deltaMs / 1000;
      const currentAgents = agentsRef.current;
      const nextAgents = [...currentAgents];
      let needsUpdate = false;

      for (let i = 0; i < nextAgents.length; i++) {
        const agent = nextAgents[i];

        // --- Wander behavior ---
        if (agent.state === "IDLE") {
          const newTimer = agent.wanderTimer - dt;
          if (newTimer <= 0) {
            // Pick random walkable tile in zone or corridor
            const zone = layout.zones.find((z) => {
              const { x, y, w, h } = z.bounds;
              return agent.position.x >= x && agent.position.x < x + w &&
                     agent.position.y >= y && agent.position.y < y + h;
            });
            const targets: { x: number; y: number }[] = [];
            const bounds = zone?.bounds ?? { x: 1, y: 1, w: layout.width - 2, h: layout.height - 2 };
            for (let ty = bounds.y; ty < bounds.y + bounds.h; ty++) {
              for (let tx = bounds.x; tx < bounds.x + bounds.w; tx++) {
                if (layout.tiles[ty]?.[tx]?.walkable && (tx !== agent.position.x || ty !== agent.position.y)) {
                  targets.push({ x: tx, y: ty });
                }
              }
            }
            if (targets.length > 0) {
              const target = targets[Math.floor(Math.random() * targets.length)];
              const path = PathFinder.findPath(layout.tiles, agent.position, target);
              if (path && path.length > 1) {
                const sm = stateMachines.current[agent.id];
                if (sm?.canTransition("MOVE")) {
                  sm.transition("MOVE");
                  nextAgents[i] = {
                    ...agent,
                    state: "WALK",
                    targetPosition: target,
                    path,
                    moveProgress: 0,
                    wanderTimer: randomWanderDelay(),
                  };
                  needsUpdate = true;
                  continue;
                }
              }
            }
            nextAgents[i] = { ...agent, wanderTimer: randomWanderDelay() };
            needsUpdate = true;
            continue;
          }
          if (newTimer !== agent.wanderTimer) {
            nextAgents[i] = { ...agent, wanderTimer: newTimer };
            needsUpdate = true;
          }
          continue;
        }

        // --- Lerp movement ---
        if (agent.state === "WALK" && agent.path.length >= 2) {
          const progress = agent.moveProgress + dt * MOVE_SPEED;
          const pathIndex = Math.floor(progress);

          if (pathIndex >= agent.path.length - 1) {
            // Arrived
            const finalPos = agent.path[agent.path.length - 1];
            const sm = stateMachines.current[agent.id];
            sm?.transition("ARRIVE");

            const isLounge = layout.zones.some(
              (z) => z.type === "LOUNGE" &&
                finalPos.x >= z.bounds.x && finalPos.x < z.bounds.x + z.bounds.w &&
                finalPos.y >= z.bounds.y && finalPos.y < z.bounds.y + z.bounds.h,
            );

            nextAgents[i] = {
              ...agent,
              state: isLounge ? "REST" : "IDLE",
              position: finalPos,
              renderPosition: { x: finalPos.x * TILE_SIZE, y: finalPos.y * TILE_SIZE },
              path: [],
              targetPosition: null,
              moveProgress: 0,
              wanderTimer: randomWanderDelay(),
              bubble: isLounge ? { text: "☕", expiresAt: 0 } : null,
            };
          } else {
            // Interpolate between tiles
            const from = agent.path[pathIndex];
            const to = agent.path[pathIndex + 1];
            const t = progress - pathIndex; // fractional 0-1

            const rx = (from.x + (to.x - from.x) * t) * TILE_SIZE;
            const ry = (from.y + (to.y - from.y) * t) * TILE_SIZE;

            let direction = agent.direction;
            if (to.x > from.x) direction = "RIGHT";
            else if (to.x < from.x) direction = "LEFT";
            else if (to.y > from.y) direction = "DOWN";
            else if (to.y < from.y) direction = "UP";

            nextAgents[i] = {
              ...agent,
              position: from,
              renderPosition: { x: rx, y: ry },
              moveProgress: progress,
              direction,
            };
          }
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      }

      // Render
      if (!rendererRef.current) {
        rendererRef.current = new SpriteRenderer(ctx, TILE_SIZE);
      }
      const renderState: RenderState = {
        agents: agentsRef.current,
        layout,
        tileSize: TILE_SIZE,
        selectedAgentId,
      };
      rendererRef.current.render(renderState, dt);
    },
    [layout, selectedAgentId],
  );

  useGameLoop(canvasRef, onFrame, !reducedMotion);

  // Static render for reduced motion
  useEffect(() => {
    if (!reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderer = new SpriteRenderer(ctx, TILE_SIZE);
    renderer.render({ agents, layout, tileSize: TILE_SIZE, selectedAgentId }, 0);
  }, [reducedMotion, agents, layout, selectedAgentId]);

  // Click handler — use renderPosition for sub-pixel accuracy
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const clicked = agents.find((a) => {
        const cx = a.renderPosition.x + TILE_SIZE / 2;
        const cy = a.renderPosition.y + TILE_SIZE / 2;
        const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);
        return dist < TILE_SIZE * 0.5;
      });

      setSelectedAgentId(clicked ? clicked.id : null);
    },
    [agents],
  );

  const canvasWidth = layout.width * TILE_SIZE;
  const canvasHeight = layout.height * TILE_SIZE;
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleClick}
        className="border border-border rounded-lg cursor-pointer"
        style={{ imageRendering: "pixelated", maxWidth: "100%", height: "auto" }}
      />
      {replayActive && (
        <div className="absolute top-2 left-2 text-[10px] text-muted-foreground bg-background/70 px-1.5 py-0.5 rounded">
          Based on actual git history
        </div>
      )}
      {selectedAgent && (
        <InteractionPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </div>
  );
}
