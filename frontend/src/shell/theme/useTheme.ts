"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // SSR hydration mismatch 방지를 위해 mount 후 한 번만 동기화 (FOUC는 ThemeScript가 방지)
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return { theme, toggleTheme };
}
