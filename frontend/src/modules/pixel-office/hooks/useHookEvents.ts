"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface HookEvent {
  tool: string;
  file: string;
  result?: string;
  timestamp: string;
}

const TOOL_TO_ANIMATION: Record<string, "type" | "read"> = {
  Edit: "type",
  Write: "type",
  Bash: "type",
  Read: "read",
  Grep: "read",
  Glob: "read",
};

export function useHookEvents() {
  const [events, setEvents] = useState<HookEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/admin/office/events");
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (msg) => {
      try {
        const event: HookEvent = JSON.parse(msg.data);
        setEvents((prev) => [...prev.slice(-99), event]);
      } catch {
        // ignore malformed
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  const getAnimationForTool = useCallback((tool: string): "type" | "read" | null => {
    return TOOL_TO_ANIMATION[tool] ?? null;
  }, []);

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  return { events, latestEvent, connected, getAnimationForTool };
}
