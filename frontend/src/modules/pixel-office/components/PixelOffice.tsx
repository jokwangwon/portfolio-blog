"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { usePixelOffice } from "../hooks/usePixelOffice";
import { startGameLoop } from "../pixel-engine/engine/gameLoop";
import { renderFrame } from "../pixel-engine/engine/renderer";
import { TILE_SIZE, ZOOM_MAX, ZOOM_SCROLL_THRESHOLD } from "../pixel-engine/constants";

import { SEASONS, type Season } from "../season/season";
import { useOfficeCalendar } from "../season/useOfficeCalendar";
import { OfficeCompanion } from "../season/companion";
import { ROOM_THEMES, seasonalTileColors, seasonalFurniture } from "../season/roomTheme";
import { renderSeasonFloor } from "../season/renderSeasonRoom";
import { seasonWindow } from "../season/seasonWindow";
import { fitOfficeZoom, officeViewport } from "../pixel-engine/engine/viewport";
import { WorkBoard } from "./WorkBoard";
import styles from "./office.module.css";
import { renderSeasonOrnament } from "../season/renderSeasonOrnament";

const DEFAULT_ZOOM = 2; // will be auto-calculated to fit container

export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const zoomAccum = useRef(0);
  const companion = useRef(new OfficeCompanion());
  const dragged = useRef(false);
  const dragOrigin = useRef({x:0,y:0});
  const [feedback,setFeedback]=useState<{message:string;nonce:number}|null>(null);
  const interact=useCallback((action:"pet"|"coffee")=>{
    if(action==="pet")companion.current.pet();else companion.current.brew();
    setFeedback({message:action==="pet"?"고양이가 기분 좋게 눈을 감습니다.":"따뜻한 커피 한 잔이 준비됐습니다.",nonce:performance.now()});
  },[]);
  useEffect(()=>{
    if(!feedback)return;
    const timer=setTimeout(()=>setFeedback(null),4500);
    return ()=>clearTimeout(timer);
  },[feedback]);
  const fitZoom = useRef(DEFAULT_ZOOM);
  const calendar = useOfficeCalendar();
  const [previewSeason, setPreviewSeason] = useState<Season | "auto">("auto");
  const season = previewSeason === "auto" ? calendar.season : previewSeason;
  const theme = SEASONS[season];
  const roomTheme = ROOM_THEMES[season];

  const {
    officeState,
    isLoading,
    setSelectedAgentId,
    getAgentName,
    getAgentRole,
    getSelectedCharacter,
    presence,
    assetError,
    sessionAgentId,
  } = usePixelOffice();


  // Resize canvas to fill container (DPR-aware)
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width < 1 || height < 1) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (officeState) {
        const fit = fitOfficeZoom(width*dpr, height*dpr, officeState.layout.cols*TILE_SIZE, officeState.layout.rows*TILE_SIZE);
        fitZoom.current = Math.min(ZOOM_MAX, fit);
        panRef.current = {x:0,y:0};
        setZoom(fitZoom.current);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isLoading, officeState]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !officeState) return;

    const tileColors=seasonalTileColors(officeState.layout,season);
    const scene = document.createElement("canvas");
    const ctx = scene.getContext("2d");
    if (!ctx) return;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = startGameLoop(canvas, {
      update(dt) {
        officeState.update(dt);
        companion.current.update(dt,motion.matches);
      },
      render(display) {
        if (canvas.width < 1 || canvas.height < 1) return;
        const view = officeViewport(canvas.width,canvas.height,zoom,panRef.current,
          officeState.layout.cols*TILE_SIZE,officeState.layout.rows*TILE_SIZE);
        if(scene.width!==view.width) scene.width=view.width;
        if(scene.height!==view.height) scene.height=view.height;
        ctx.imageSmoothingEnabled = false;
        const chars = Array.from(officeState.characters.values());
        const offset = renderFrame(
          ctx,
          view.width,
          view.height,
          officeState.tileMap,
          [...seasonalFurniture(officeState.furniture,officeState.layout,season), seasonWindow(season, calendar.night),companion.current.furniture()],
          chars,
          1,
          view.panX,
          view.panY,
          {
            selectedAgentId: officeState.selectedAgentId,
            hoveredAgentId: officeState.hoveredAgentId,
            hoveredTile: officeState.hoveredTile,
            seats: officeState.seats,
            characters: officeState.characters,
          },
          tileColors,
          officeState.layout.cols,
          officeState.layout.rows,
          (context,x,y)=>{renderSeasonFloor(context,x,y,season,calendar.night);companion.current.drawFloor(context,x,y,ROOM_THEMES[season].rug);},
        );
        renderSeasonOrnament(ctx, offset, 1, season);
        companion.current.drawReaction(ctx,offset.offsetX,offset.offsetY,motion.matches);
        display.clearRect(0,0,canvas.width,canvas.height);
        display.imageSmoothingEnabled=false;
        display.drawImage(scene,0,0,scene.width*zoom,scene.height*zoom);
      },
    });

    return stop;
  }, [officeState, zoom, season, calendar.night]);

  // Click handler
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!officeState || !canvasRef.current || dragged.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;

      const view = officeViewport(canvas.width,canvas.height,zoom,panRef.current,
        officeState.layout.cols*TILE_SIZE,officeState.layout.rows*TILE_SIZE);
      const worldX = (x - view.offsetX) / zoom;
      const worldY = (y - view.offsetY) / zoom;

      if(companion.current.hit(worldX,worldY)){interact("pet");return;}
      if(worldX>=224&&worldX<=246&&worldY>=87&&worldY<=110){interact("coffee");return;}
      const hit = officeState.getCharacterAt(worldX, worldY);
      if (hit != null) {
        officeState.setSelection(hit);
        setSelectedAgentId(hit);
      } else {
        officeState.setSelection(null);
        setSelectedAgentId(null);
      }
    },
    [officeState, zoom, setSelectedAgentId, interact],
  );

  // Zoom with scroll — native event to allow preventDefault on non-passive
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      zoomAccum.current += e.deltaY;
      if (Math.abs(zoomAccum.current) >= ZOOM_SCROLL_THRESHOLD) {
        const direction = zoomAccum.current > 0 ? -1 : 1;
        setZoom((z) => Math.max(fitZoom.current, Math.min(ZOOM_MAX, direction>0 ? Math.floor(z)+1 : Math.ceil(z)-1)));
        zoomAccum.current = 0;
      }
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [isLoading]);

  // Pan with left-click drag (or middle-click)
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Left click (0) or middle click (1)
    if (e.button === 0 || e.button === 1) {
      isPanning.current = true;
      dragged.current=false;dragOrigin.current={x:e.clientX,y:e.clientY};
      const dpr = window.devicePixelRatio || 1;
      panStart.current = { x: e.clientX*dpr - panRef.current.x, y: e.clientY*dpr - panRef.current.y };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      if(Math.hypot(e.clientX-dragOrigin.current.x,e.clientY-dragOrigin.current.y)>4)dragged.current=true;
      panRef.current = {
        x: e.clientX*(window.devicePixelRatio||1) - panStart.current.x,
        y: e.clientY*(window.devicePixelRatio||1) - panStart.current.y,
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
  const connected = presence.connection === "connected";
  const empty = connected && presence.sessions.length === 0;
  const status = !connected ? "연결 확인 중" : !presence.enabled ? "방송 꺼짐"
    : empty ? "출근한 직원 없음" : `출근 ${presence.sessions.length}명`;
  if (assetError) return <p role="alert">사무실을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>;

  return (
    <div className={styles.shell} data-office-season={season} data-office-time={calendar.night ? "night" : "day"} style={{ "--season-accent":theme.accent,"--season-wall":theme.wall,"--season-outside":roomTheme.outside,"--season-board":roomTheme.board,"--season-frame":roomTheme.frame } as CSSProperties}>
      <div className={styles.toolbar}>
        <div className={styles.calendar}>
          <div className={styles.dateTile} aria-hidden="true"><small>{calendar.month}월</small><strong>{calendar.day}</strong></div>
          <div className={styles.dateText}><time dateTime={calendar.date}>{calendar.label}</time><span className={styles.seasonCaption}>{roomTheme.caption}</span></div>
        </div>
        <label className={styles.themeControl}>계절 테마
          <select value={previewSeason} onChange={event=>setPreviewSeason(event.target.value as Season | "auto")}>
            <option value="auto">자동 · {SEASONS[calendar.season].label}</option>
            {Object.entries(SEASONS).map(([key,value])=><option key={key} value={key}>{value.label} 미리보기</option>)}
          </select>
        </label>
      </div>
      <div className={styles.grid}>
      <div className={styles.room}>
        <div className={styles.roomHeader}>
          <div className={styles.status} role="status" aria-live="polite"><span className={styles.statusDot} aria-hidden="true"/>{status}</div>
          <span className={styles.roomLabel}>{connected ? "실시간 작업 세션" : "연결 확인 중"}</span>
        </div>
      <div className={styles.canvasRoom} ref={containerRef} data-office-light={empty ? "off" : connected ? "on" : "unknown"}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        aria-label="현재 작업 세션을 표현한 픽셀 사무실"
        className="w-full h-full cursor-pointer"
        style={{ imageRendering: "pixelated" }}
      />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none transition-opacity duration-1000 bg-slate-950"
        style={{ opacity: empty ? 0.38 : connected ? 0 : 0.22 }} />
      {empty && <div className="absolute bottom-3 inset-x-2 text-center text-xs text-slate-300 pointer-events-none">{presence.enabled ? "작업이 시작되면 불이 켜집니다" : "공개 방송을 쉬고 있습니다"}</div>}
      {selectedChar && (
        <div className="absolute top-12 right-2 w-56 max-w-[calc(100%-1rem)] rounded-lg border border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
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
              <dt className="text-muted-foreground">작업 상태</dt>
              <dd>{getAgentRole(selectedChar.id)}</dd>
            </div>
          </dl>
        </div>
      )}
      </div>
      <div className={styles.interactions}>
        <div><button onClick={()=>interact("pet")}>고양이 쓰다듬기</button><button onClick={()=>interact("coffee")}>커피 내리기</button></div>
        <span>고양이는 사무실의 장식 친구입니다</span>
      </div>
      <p className={styles.interactionFeedback} role="status" aria-live="polite">{feedback?.message ?? "고양이나 커피잔을 눌러 보세요."}</p>
      {/* Zoom controls */}
      <div className={styles.zoomControls}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(fitZoom.current, Math.ceil(z) - 1))}
            className="text-xs px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground"
            aria-label="축소"
          >−</button>
          <span className="text-xs text-muted-foreground min-w-12 text-center whitespace-nowrap">{Number(zoom.toFixed(2))}x</span>
          <button
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.floor(z) + 1))}
            className="text-xs px-1.5 py-0.5 rounded hover:bg-muted text-muted-foreground"
            aria-label="확대"
          >+</button>
          <button aria-label="사무실 전체 보기" className="text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground" onClick={() => {panRef.current={x:0,y:0};setZoom(fitZoom.current);}}>맞춤</button>
        </div>

      </div>
      <div className={styles.roomFooter}><span>{calendar.night ? "밤의 사무실" : "낮의 사무실"} · 서울 시간</span><span className={styles.seasonMark}>{theme.label}{previewSeason === "auto" ? " · 서울 달력" : " · 미리보기"}</span></div>
      </div>
      <WorkBoard presence={presence} onSelect={sessionId => {
        const id = sessionAgentId(sessionId);
        if (id !== undefined) { officeState?.setSelection(id); setSelectedAgentId(id); }
      }}/>
      </div>
    </div>
  );
}
