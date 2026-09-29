"use client";
import { useEffect, useState } from "react";
import { parseSnapshot, unavailableSnapshot, type PresenceSnapshot } from "../presence/presence";

export function usePresence(enabled = true) {
  const [snapshot, setSnapshot] = useState<PresenceSnapshot>(unavailableSnapshot);
  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource("/api/office/events");
    let lastMessage = 0;
    const receive = (event: MessageEvent) => {
      try {
        const input = JSON.parse(event.data);
        lastMessage = Date.now();
        // Server checks collector freshness; client checks transport silence locally.
        setSnapshot(input.connection === "connected"
          ? parseSnapshot({ ...input, version: 1 }, input.updatedAt)
          : unavailableSnapshot());
      } catch { setSnapshot(unavailableSnapshot()); }
    };
    source.addEventListener("presence", receive);
    source.onerror = () => setSnapshot(unavailableSnapshot());
    const watchdog = setInterval(() => {
      if (Date.now() - lastMessage > 10000) setSnapshot(unavailableSnapshot());
    }, 2500);
    return () => {
      clearInterval(watchdog);
      source.removeEventListener("presence", receive);
      source.close();
    };
  }, [enabled]);
  return snapshot;
}
