"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OfficeState } from "../pixel-engine/engine/officeState";
import { loadPixelOfficeAssets } from "../pixel-engine/assetLoader";
import { useAgentStatus } from "./useAgentStatus";
import { EventMapper } from "../engine/EventMapper";
import type { Character } from "../pixel-engine/types";

const AGENT_IDS = {
  BACKEND: 1,
  FRONTEND: 2,
  DEVOPS: 3,
} as const;

const AGENT_NAMES: Record<number, string> = {
  1: "백엔드 개발자",
  2: "프론트엔드 개발자",
  3: "DevOps 엔지니어",
};

const AGENT_ROLES: Record<number, string> = {
  1: "BACKEND",
  2: "FRONTEND",
  3: "DEVOPS",
};

interface UsePixelOfficeReturn {
  officeState: OfficeState | null;
  isLoading: boolean;
  selectedAgentId: number | null;
  setSelectedAgentId: (id: number | null) => void;
  getAgentName: (id: number) => string;
  getAgentRole: (id: number) => string;
  getSelectedCharacter: () => Character | null;
  replayActive: boolean;
}

export function usePixelOffice(): UsePixelOfficeReturn {
  const officeStateRef = useRef<OfficeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [replayActive, setReplayActive] = useState(true);
  const initializedRef = useRef(false);

  const { data: activityData } = useAgentStatus();

  // Load assets and initialize OfficeState
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const { layout } = await loadPixelOfficeAssets("/assets/pixel-office/");

        const state = new OfficeState(layout ?? undefined);
        officeStateRef.current = state;

        // Add 3 agents
        state.addAgent(AGENT_IDS.BACKEND, 0, 0, undefined, false);
        state.addAgent(AGENT_IDS.FRONTEND, 1, 0, undefined, false);
        state.addAgent(AGENT_IDS.DEVOPS, 2, 0, undefined, false);

        setIsLoading(false);
      } catch (err) {
        console.error("[PixelOffice] Failed to load assets:", err);
        setIsLoading(false);
      }
    })();
  }, []);

  // Process GitHub events → activate/deactivate agents
  useEffect(() => {
    if (!activityData || !officeStateRef.current) return;
    const state = officeStateRef.current;

    for (const event of activityData.events) {
      const updates = EventMapper.mapEvent(event);
      for (const update of updates) {
        const agentId = AGENT_IDS[update.agentId as keyof typeof AGENT_IDS];
        if (!agentId) continue;
        const ch = state.characters.get(agentId);
        if (!ch) continue;

        if (!ch.isActive) {
          state.setAgentActive(agentId, true);
          if (update.task) {
            state.showWaitingBubble(agentId);
          }
          // Deactivate after 5 seconds
          setTimeout(() => {
            if (officeStateRef.current) {
              officeStateRef.current.setAgentActive(agentId, false);
            }
          }, 5000);
        }
      }
    }

    // Inactivity check — rest all agents
    if (activityData.lastActivity) {
      const inactiveUpdates = EventMapper.checkInactivity(
        new Date(activityData.lastActivity), new Date(), 12,
      );
      if (inactiveUpdates.length > 0) {
        for (const update of inactiveUpdates) {
          const agentId = AGENT_IDS[update.agentId as keyof typeof AGENT_IDS];
          if (agentId) {
            state.setAgentActive(agentId, false);
          }
        }
      }
    }
  }, [activityData]);

  // Timelapse replay on mount
  useEffect(() => {
    if (!replayActive) return;

    const events = [
      { delay: 2000, agentId: AGENT_IDS.FRONTEND, tool: "Edit" },
      { delay: 5000, agentId: AGENT_IDS.BACKEND, tool: "Read" },
      { delay: 8000, agentId: AGENT_IDS.DEVOPS, tool: "Bash" },
      { delay: 12000, agentId: AGENT_IDS.FRONTEND, tool: "Write" },
      { delay: 16000, agentId: AGENT_IDS.BACKEND, tool: "Grep" },
    ];

    const timers = events.map(({ delay, agentId, tool }) =>
      setTimeout(() => {
        const state = officeStateRef.current;
        if (!state) return;
        state.setAgentActive(agentId, true);
        state.setAgentTool(agentId, tool);
        state.showWaitingBubble(agentId);

        setTimeout(() => {
          if (officeStateRef.current) {
            officeStateRef.current.setAgentActive(agentId, false);
            officeStateRef.current.setAgentTool(agentId, null);
          }
        }, 3000);
      }, delay),
    );

    const stopTimer = setTimeout(() => setReplayActive(false), 20000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(stopTimer);
    };
  }, [replayActive]);

  const getAgentName = useCallback((id: number) => AGENT_NAMES[id] ?? `Agent ${id}`, []);
  const getAgentRole = useCallback((id: number) => AGENT_ROLES[id] ?? "UNKNOWN", []);

  const getSelectedCharacter = useCallback((): Character | null => {
    if (selectedAgentId == null || !officeStateRef.current) return null;
    return officeStateRef.current.characters.get(selectedAgentId) ?? null;
  }, [selectedAgentId]);

  const [officeState, setOfficeState] = useState<OfficeState | null>(null);

  // Sync ref → state when loading completes
  useEffect(() => {
    if (!isLoading && officeStateRef.current && !officeState) {
      setOfficeState(officeStateRef.current);
    }
  }, [isLoading, officeState]);

  return {
    officeState,
    isLoading,
    selectedAgentId,
    setSelectedAgentId,
    getAgentName,
    getAgentRole,
    getSelectedCharacter,
    replayActive,
  };
}
