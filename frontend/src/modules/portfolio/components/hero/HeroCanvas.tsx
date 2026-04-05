"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/src/shared/animations/useReducedMotion";
import { useTheme } from "@/src/shell/theme/useTheme";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0" />,
});

// Check mobile viewport via useSyncExternalStore to avoid ESLint set-state-in-effect
function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getIsMobile() {
  return window.innerWidth < 768;
}

function getIsMobileServer() {
  return false;
}

// Check WebGL support (static after first check)
let webglSupported: boolean | null = null;

function checkWebGL(): boolean {
  if (webglSupported !== null) return webglSupported;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    webglSupported = !!gl;
  } catch {
    webglSupported = false;
  }
  return webglSupported;
}

function subscribeNoop(callback: () => void) {
  // WebGL support doesn't change
  void callback;
  return () => {};
}

export default function HeroCanvas({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const isMobile = useSyncExternalStore(subscribeResize, getIsMobile, getIsMobileServer);
  const supportsWebGL = useSyncExternalStore(subscribeNoop, checkWebGL, () => false);

  if (reduced || isMobile || !supportsWebGL) {
    return null;
  }

  return (
    <div className={className} aria-hidden="true">
      <HeroScene isDark={theme === "dark"} />
    </div>
  );
}
