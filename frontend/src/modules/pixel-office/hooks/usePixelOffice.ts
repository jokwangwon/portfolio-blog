"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { OfficeState } from "../pixel-engine/engine/officeState";
import { loadPixelOfficeAssets } from "../pixel-engine/assetLoader";
import { usePresence } from "./usePresence";
import { Attendance } from "../presence/attendance";
import { ACTIVITY_LABELS, SOURCE_LABELS } from "../presence/presence";

export function usePixelOffice(legacy = false) {
  const [officeState, setOfficeState] = useState<OfficeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assetError, setAssetError] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const attendance = useRef(new Attendance());
  const presence = usePresence(!legacy);

  useEffect(() => {
    let disposed = false;
    loadPixelOfficeAssets("/assets/pixel-office/").then(({ layout }) => {
      if (disposed) return;
      const state = new OfficeState(layout ?? undefined);
      if (legacy) for (let id = 1; id <= 3; id++) state.addAgent(id, id - 1, 0);
      setOfficeState(state);
      setIsLoading(false);
    }).catch(() => {
      if (!disposed) { setAssetError(true); setIsLoading(false); }
    });
    return () => { disposed = true; };
  }, [legacy]);

  useEffect(() => {
    if (officeState && !legacy) attendance.current.sync(officeState, presence.sessions, presence.connection === "connected" && presence.enabled);
  }, [officeState, presence, legacy]);

  const advanceAttendance = useCallback((dt: number, reducedMotion: boolean) =>
    officeState && !legacy ? attendance.current.update(officeState, dt, reducedMotion) : 0,
    [officeState, legacy]);

  const getSession = useCallback((id: number) =>
    presence.sessions.find(s => attendance.current.idFor(s.id) === id), [presence]);
  const getAgentName = useCallback((id: number) => {
    if (legacy) return ["", "백엔드 개발자", "프론트엔드 개발자", "DevOps 엔지니어"][id] ?? "작업";
    const session = getSession(id);
    return session ? SOURCE_LABELS[session.source] + " · 세션 " + id : "종료된 작업";
  }, [getSession, legacy]);
  const getAgentRole = useCallback((id: number) => {
    const session = getSession(id);
    return session ? ACTIVITY_LABELS[session.activity] : "작업";
  }, [getSession]);
  const getSelectedCharacter = useCallback(() => {
    if (selectedAgentId === null || (!legacy && !getSession(selectedAgentId))) return null;
    return officeState?.characters.get(selectedAgentId) ?? null;
  }, [selectedAgentId, officeState, legacy, getSession]);

  return { officeState, isLoading, assetError, selectedAgentId, setSelectedAgentId,
    getAgentName, getAgentRole, getSelectedCharacter, presence, advanceAttendance,
    sessionAgentId: (id: string) => attendance.current.idFor(id) };
}
