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
import { GameLoop } from "../engine/GameLoop";
import type {
  Agent,
  AgentRole,
  RenderState,
} from "../types/office.types";
import { InteractionPanel } from "./InteractionPanel";

const TILE_SIZE = 32;
const MOVE_SPEED = 3; // tiles per second

function createInitialAgents(layout: ReturnType<typeof TileMap.createDefaultLayout>): Agent[] {
  const roles: { role: AgentRole; name: string; color: string }[] = [
    { role: "BACKEND", name: "백엔드 개발자", color: "#4A90D9" },
    { role: "FRONTEND", name: "프론트엔드 개발자", color: "#D94A8C" },
    { role: "DEVOPS", name: "DevOps 엔지니어", color: "#6BD94A" },
  ];

  return roles.map(({ role, name, color }) => ({
    id: role,
    role,
    name,
    state: "IDLE" as const,
    position: { ...layout.deskPositions[role] },
    targetPosition: null,
    path: [],
    direction: "DOWN" as const,
    color,
  }));
}

export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  const layout = useMemo(() => TileMap.createDefaultLayout(), []);
  const [agents, setAgents] = useState<Agent[]>(() => createInitialAgents(layout));
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const agentsRef = useRef(agents);
  useEffect(() => {
    agentsRef.current = agents;
  });

  const stateMachines = useRef<Record<string, StateMachine>>(
    {} as Record<string, StateMachine>,
  );

  useEffect(() => {
    if (Object.keys(stateMachines.current).length === 0) {
      stateMachines.current = Object.fromEntries(
        agents.map((a) => [a.id, new StateMachine(a.state)]),
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moveProgressRef = useRef<Record<string, number>>({});

  const { data: activityData } = useAgentStatus();

  // Process GitHub events → agent state updates
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
          updated[idx] = { ...updated[idx], state: "WORK" };
        }
      }

      // Check inactivity
      if (activityData.lastActivity) {
        const inactiveUpdates = EventMapper.checkInactivity(
          new Date(activityData.lastActivity),
          new Date(),
          12,
        );
        for (const update of inactiveUpdates) {
          const idx = updated.findIndex((a) => a.id === update.agentId);
          if (idx === -1) continue;

          const sm = stateMachines.current[update.agentId];
          if (!sm) continue;

          if (sm.current === "IDLE" && sm.canTransition("INACTIVE")) {
            sm.transition("INACTIVE");
            const loungePos = TileMap.getRandomLoungePosition(layout);
            const path = PathFinder.findPath(
              layout.tiles,
              updated[idx].position,
              loungePos,
            );
            if (path && path.length > 1) {
              sm.transition("ACTIVATE"); // back to IDLE first
              sm.transition("MOVE");
              updated[idx] = {
                ...updated[idx],
                state: "WALK",
                targetPosition: loungePos,
                path,
              };
              moveProgressRef.current[update.agentId] = 0;
            } else {
              updated[idx] = { ...updated[idx], state: "REST", position: loungePos };
            }
          }
        }
      }

      return updated;
    });
  }, [activityData, layout]);

  // Game frame update
  const onFrame = useCallback(
    (ctx: CanvasRenderingContext2D, deltaMs: number) => {
      const dt = deltaMs / 1000;
      const currentAgents = agentsRef.current;
      let needsUpdate = false;
      const nextAgents = [...currentAgents];

      for (let i = 0; i < nextAgents.length; i++) {
        const agent = nextAgents[i];
        if (agent.state !== "WALK" || agent.path.length < 2) continue;

        const result = GameLoop.updateAgentMovement(
          { ...agent, moveProgress: moveProgressRef.current[agent.id] ?? 0 },
          dt,
          MOVE_SPEED,
        );

        // Update direction
        const pathIdx = Math.min(result.pathIndex, agent.path.length - 2);
        const curr = agent.path[pathIdx];
        const next = agent.path[pathIdx + 1] ?? curr;
        let direction = agent.direction;
        if (next.x > curr.x) direction = "RIGHT";
        else if (next.x < curr.x) direction = "LEFT";
        else if (next.y > curr.y) direction = "DOWN";
        else if (next.y < curr.y) direction = "UP";

        if (result.arrived) {
          const sm = stateMachines.current[agent.id];
          sm?.transition("ARRIVE");
          const finalState = agent.targetPosition
            ? (layout.zones.find(
                (z) => z.type === "LOUNGE" &&
                  agent.targetPosition!.x >= z.bounds.x &&
                  agent.targetPosition!.x < z.bounds.x + z.bounds.w,
              )
                ? "REST"
                : "IDLE")
            : "IDLE";

          nextAgents[i] = {
            ...agent,
            state: finalState as Agent["state"],
            position: result.position,
            path: [],
            targetPosition: null,
            direction,
          };
          moveProgressRef.current[agent.id] = 0;
        } else {
          nextAgents[i] = {
            ...agent,
            position: result.position,
            direction,
          };
          moveProgressRef.current[agent.id] = result.moveProgress;
        }
        needsUpdate = true;
      }

      if (needsUpdate) {
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      }

      // Render
      const renderer = new SpriteRenderer(ctx, TILE_SIZE);
      const renderState: RenderState = {
        agents: agentsRef.current,
        layout,
        tileSize: TILE_SIZE,
        selectedAgentId,
      };
      renderer.render(renderState);
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
    renderer.render({
      agents,
      layout,
      tileSize: TILE_SIZE,
      selectedAgentId,
    });
  }, [reducedMotion, agents, layout, selectedAgentId]);

  // Click handler
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;
      const tile = TileMap.pixelToTile({ x: clickX, y: clickY }, TILE_SIZE);

      const clicked = agents.find(
        (a) => a.position.x === tile.x && a.position.y === tile.y,
      );

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
      {selectedAgent && (
        <InteractionPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </div>
  );
}
