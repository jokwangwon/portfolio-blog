"use client";

import { useRef, useEffect } from "react";

export function useGameLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onFrame: (ctx: CanvasRenderingContext2D, dt: number) => void,
  active: boolean = true,
) {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    if (!active) return;

    lastTimeRef.current = 0;

    const loop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const deltaMs = lastTimeRef.current
        ? timestamp - lastTimeRef.current
        : 16.67;
      lastTimeRef.current = timestamp;

      onFrameRef.current(ctx, Math.min(deltaMs, 100));
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [canvasRef, active]);
}
