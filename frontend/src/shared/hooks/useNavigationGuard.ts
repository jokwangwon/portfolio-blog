"use client";

import { useEffect } from "react";

const LEAVE_EVENT = "editor:request-leave";

/** Call before actions that unmount the editor without a link click (e.g. logout). */
export function requestEditorLeave(): boolean {
  return window.dispatchEvent(new Event(LEAVE_EVENT, { cancelable: true }));
}

export function useNavigationGuard(canLeave: () => boolean) {
  useEffect(() => {
    const request = (event: Event) => { if (!canLeave()) event.preventDefault(); };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const next = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(next.protocol)) return;
      if (next.origin === location.origin && next.pathname === location.pathname && next.search === location.search) return;
      if (!canLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", click, true);
    window.addEventListener(LEAVE_EVENT, request);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener(LEAVE_EVENT, request);
    };
  }, [canLeave]);
}
