"use client";
import { useEffect, useState } from "react";
import { officeCalendar } from "./season";

export function useOfficeCalendar() {
  const [calendar, setCalendar] = useState(() => officeCalendar(new Date()));
  useEffect(() => {
    const update = () => {
      const next = officeCalendar(new Date());
      setCalendar(previous => previous.date === next.date && previous.night === next.night ? previous : next);
    };
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return calendar;
}
