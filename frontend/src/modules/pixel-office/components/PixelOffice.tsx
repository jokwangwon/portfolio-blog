"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePixelOffice } from "../hooks/usePixelOffice";
import { startGameLoop } from "../pixel-engine/engine/gameLoop";
import { renderFrame } from "../pixel-engine/engine/renderer";
import { TILE_SIZE, ZOOM_MIN, ZOOM_MAX, ZOOM_SCROLL_THRESHOLD } from "../pixel-engine/constants";

const STATE_LABELS: Record<string, string> = {
  idle: "대기 중",
  walk: "이동 중",
  type: "작업 중",
};

const DEFAULT_ZOOM = 2; // will be auto-calculated to fit container

export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const zoomAccum = useRef(0);

  const {
    officeState,
    isLoading,
    setSelectedAgentId,
    getAgentName,
    getAgentRole,
    getSelectedCharacter,
    replayActive,
  } = usePixelOffice();

  // Resize canvas to fill container (DPR-aware)
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
      update(dt) {
        officeState.update(dt);
      },
      render(ctx) {
        ctx.imageSmoothingEnabled = false;
        const chars = Array.from(officeState.characters.values());
        renderFrame(
          ctx,
          canvas.width,
          canvas.height,
          officeState.tileMap,
          officeState.furniture,
          chars,
          zoom,
          panRef.current.x,
          panRef.current.y,
          {
            selectedAgentId: officeState.selectedAgentId,
            hoveredAgentId: officeState.hoveredAgentId,
            hoveredTile: officeState.hoveredTile,
            seats: officeState.seats,
            characters: officeState.characters,
          },
          officeState.layout.tileColors ?? undefined,
          officeState.layout.cols,
          officeState.layout.rows,
        );
      },
    });

    return stop;
  }, [officeState, zoom]);

  // Click handler
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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

      const worldX = (x - offsetX) / zoom;
      const worldY = (y - offsetY) / zoom;

      const hit = officeState.getCharacterAt(worldX, worldY);
      if (hit != null) {
        officeState.setSelection(hit);
        setSelectedAgentId(hit);
      } else {
        officeState.setSelection(null);
        setSelectedAgentId(null);
      }
    },
    [officeState, zoom, setSelectedAgentId],
  );

  // Auto-fit zoom to container on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !officeState) return;
    const cols = officeState.layout.cols ?? 20;
    const rows = officeState.layout.rows ?? 11;
    const mapPxW = cols * TILE_SIZE;
    const mapPxH = rows * TILE_SIZE;
    const rect = container.getBoundingClientRect();
    const fitZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX,
      Math.floor(Math.min(rect.width / mapPxW, rect.height / mapPxH)),
    ));
    setZoom(fitZoom);
  }, [officeState]);

  // Zoom with scroll — native event to allow preventDefault on non-passive
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      zoomAccum.current += e.deltaY;
      if (Math.abs(zoomAccum.current) >= ZOOM_SCROLL_THRESHOLD) {
        const direction = zoomAccum.current > 0 ? -1 : 1;
        setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + direction)));
        zoomAccum.current = 0;
      }
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, []);

  // Pan with left-click drag (or middle-click)
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Left click (0) or middle click (1)
    if (e.button === 0 || e.button === 1) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      panRef.current = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/9] rounded-lg bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading Pixel Office...</span>
      </div>
    );
  }

  const selectedChar = getSelectedCharacter();

  return (
    <div className="relative w-full" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full aspect-[16/9] rounded-lg border border-border cursor-pointer"
        style={{ imageRendering: "pixelated" }}
      />
      {/* Zoom controls + replay badge */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
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
        {replayActive && (
          <div className="text-[10px] text-muted-foreground bg-background/70 px-1.5 py-0.5 rounded">
            Based on actual git history
          </div>
        )}
      </div>
      {selectedChar && (
        <div className="absolute top-2 right-2 w-64 rounded-lg border border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{getAgentName(selectedChar.id)}</h3>
            <button
              onClick={() => {
                if (officeState) officeState.setSelection(null);
                setSelectedAgentId(null);
              }}
              className="text-muted-foreground hover:text-foreground text-sm"
              aria-label="Close panel"
            >
              X
            </button>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">역할</dt>
              <dd>{getAgentRole(selectedChar.id)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">상태</dt>
              <dd>{STATE_LABELS[selectedChar.state] ?? selectedChar.state}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">위치</dt>
              <dd>({selectedChar.tileCol}, {selectedChar.tileRow})</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
