"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePixelOffice } from "../hooks/usePixelOffice";
import { useHookEvents } from "../hooks/useHookEvents";
import { startGameLoop } from "../pixel-engine/engine/gameLoop";
import { renderFrame } from "../pixel-engine/engine/renderer";
import { TILE_SIZE, ZOOM_MIN, ZOOM_MAX, ZOOM_SCROLL_THRESHOLD } from "../pixel-engine/constants";
import { EventMapper } from "../engine/EventMapper";

const STATE_LABELS: Record<string, string> = {
  idle: "대기 중",
  walk: "이동 중",
  type: "작업 중",
};

const TOOL_LABELS: Record<string, string> = {
  Edit: "코드 편집",
  Write: "파일 작성",
  Read: "파일 읽기",
  Grep: "코드 검색",
  Glob: "파일 탐색",
  Bash: "명령 실행",
};

export default function AdminOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(2);
  const zoomAccum = useRef(0);

  const {
    officeState,
    isLoading,
    setSelectedAgentId,
    getAgentName,
    getAgentRole,
    getSelectedCharacter,
  } = usePixelOffice();

  const { events, latestEvent, connected, getAnimationForTool } = useHookEvents();

  // Process hook events → activate agents in real-time
  useEffect(() => {
    if (!latestEvent || !officeState) return;

    const animation = getAnimationForTool(latestEvent.tool);
    if (!animation) return;

    // Determine which agent based on file path
    const role = EventMapper.detectRoleFromPath(latestEvent.file);
    if (!role) return;

    const agentIdMap: Record<string, number> = { BACKEND: 1, FRONTEND: 2, DEVOPS: 3 };
    const agentId = agentIdMap[role];
    if (!agentId) return;

    // Activate the agent
    officeState.setAgentActive(agentId, true);
    officeState.setAgentTool(agentId, latestEvent.tool);

    // Deactivate after 3 seconds
    const timer = setTimeout(() => {
      officeState.setAgentActive(agentId, false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [latestEvent, officeState, getAnimationForTool]);

  // Auto-fit zoom (no DPR — canvas DPR is handled separately)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !officeState) return;
    const cols = officeState.layout.cols ?? 20;
    const rows = officeState.layout.rows ?? 11;
    const rect = container.getBoundingClientRect();
    const fitZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX,
      Math.floor(Math.min(rect.width / (cols * TILE_SIZE), rect.height / (rows * TILE_SIZE))),
    ));
    setZoom(Math.max(ZOOM_MIN, fitZoom));
  }, [officeState]);

  // Resize canvas
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !officeState) return;
    const stop = startGameLoop(canvas, {
      update(dt) { officeState.update(dt); },
      render(ctx) {
        ctx.imageSmoothingEnabled = false;
        renderFrame(
          ctx, canvas.width, canvas.height,
          officeState.tileMap, officeState.furniture,
          Array.from(officeState.characters.values()),
          zoom, panRef.current.x, panRef.current.y,
          {
            selectedAgentId: officeState.selectedAgentId,
            hoveredAgentId: officeState.hoveredAgentId,
            hoveredTile: officeState.hoveredTile,
            seats: officeState.seats,
            characters: officeState.characters,
          },
          officeState.layout.tileColors ?? undefined,
          officeState.layout.cols, officeState.layout.rows,
        );
      },
    });
    return stop;
  }, [officeState, zoom]);

  // Native wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      zoomAccum.current += e.deltaY;
      if (Math.abs(zoomAccum.current) >= ZOOM_SCROLL_THRESHOLD) {
        setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + (zoomAccum.current > 0 ? -1 : 1))));
        zoomAccum.current = 0;
      }
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, []);

  // Click + Pan
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!officeState || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const mapW = (officeState.layout.cols ?? 20) * TILE_SIZE * zoom;
    const mapH = (officeState.layout.rows ?? 11) * TILE_SIZE * zoom;
    const offsetX = Math.floor((canvas.width - mapW) / 2) + Math.round(panRef.current.x);
    const offsetY = Math.floor((canvas.height - mapH) / 2) + Math.round(panRef.current.y);
    const hit = officeState.getCharacterAt((x - offsetX) / zoom, (y - offsetY) / zoom);
    if (hit != null) {
      officeState.setSelection(hit);
      setSelectedAgentId(hit);
    } else {
      officeState.setSelection(null);
      setSelectedAgentId(null);
    }
  }, [officeState, zoom, setSelectedAgentId]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      panRef.current = { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y };
    }
  }, []);
  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse rounded-lg">
        <span className="text-muted-foreground text-sm">Loading Admin Office...</span>
      </div>
    );
  }

  const selectedChar = getSelectedCharacter();

  return (
    <div className="flex h-full gap-4">
      {/* Canvas */}
      <div className="flex-1 relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full rounded-lg border border-border cursor-grab active:cursor-grabbing"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Connection status + Zoom controls */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
            connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}>
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Live" : "Disconnected"}
          </div>
          <div className="flex items-center gap-1 bg-background/80 rounded px-1 py-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 1))}
              className="text-xs px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground"
              aria-label="Zoom out"
            >−</button>
            <span className="text-xs text-muted-foreground w-8 text-center">{zoom}x</span>
            <button
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 1))}
              className="text-xs px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground"
              aria-label="Zoom in"
            >+</button>
          </div>
        </div>

        {/* Selected agent panel */}
        {selectedChar && (
          <div className="absolute top-2 right-2 w-56 rounded-lg border border-border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{getAgentName(selectedChar.id)}</h3>
              <button onClick={() => { officeState?.setSelection(null); setSelectedAgentId(null); }}
                className="text-muted-foreground hover:text-foreground text-xs" aria-label="Close">X</button>
            </div>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">역할</dt><dd>{getAgentRole(selectedChar.id)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">상태</dt><dd>{STATE_LABELS[selectedChar.state] ?? selectedChar.state}</dd></div>
            </dl>
          </div>
        )}
      </div>

      {/* Event log sidebar */}
      <div className="w-72 flex flex-col border border-border rounded-lg bg-background/50 backdrop-blur-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-muted/50">
          <h2 className="text-sm font-semibold">Hook Events</h2>
          <p className="text-xs text-muted-foreground">{events.length} events received</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2">
              Claude Code에서 도구를 사용하면 여기에 실시간으로 표시됩니다.
            </p>
          ) : (
            [...events].reverse().map((event, i) => (
              <div key={`${event.timestamp}-${i}`} className="text-xs p-2 rounded bg-muted/30 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-primary">
                    {TOOL_LABELS[event.tool] ?? event.tool}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString("ko-KR")}
                  </span>
                </div>
                <p className="text-muted-foreground truncate" title={event.file}>
                  {event.file}
                </p>
                {event.result && (
                  <span className={`inline-block px-1 py-0.5 rounded text-[10px] ${
                    event.result === "PASS" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {event.result}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
