"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setThemeState(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setThemeState("dark");
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
