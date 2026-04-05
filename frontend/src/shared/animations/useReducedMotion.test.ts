import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "./useReducedMotion";

describe("useReducedMotion", () => {
  let listeners: Array<() => void>;
  let currentMatches: boolean;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        get matches() {
          return currentMatches;
        },
        addEventListener: vi.fn((_: string, cb: () => void) => {
          listeners.push(cb);
        }),
        removeEventListener: vi.fn(),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when prefers-reduced-motion is not set", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion: reduce is active", () => {
    currentMatches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("responds to media query changes", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      currentMatches = true;
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });
});
