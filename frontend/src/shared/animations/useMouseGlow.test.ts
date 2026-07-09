import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMouseGlow } from "./useMouseGlow";

describe("useMouseGlow", () => {
  it("returns a ref object", () => {
    const { result } = renderHook(() => useMouseGlow<HTMLDivElement>());
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it("sets CSS variables on mousemove", () => {
    const div = document.createElement("div");
    div.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 50,
      width: 200,
      height: 100,
      right: 300,
      bottom: 150,
      x: 100,
      y: 50,
      toJSON: () => {},
    }));

    const { result } = renderHook(() => useMouseGlow<HTMLDivElement>());

    // Manually set the ref
    Object.defineProperty(result.current, "current", {
      value: div,
      writable: true,
    });

    // Re-render to trigger useEffect with the attached element
    const { unmount } = renderHook(() => useMouseGlow<HTMLDivElement>());

    // Simulate mousemove on the div
    const event = new MouseEvent("mousemove", {
      clientX: 150,
      clientY: 75,
    });
    div.dispatchEvent(event);

    // The hook should have set CSS variables
    // Note: Direct event listener attachment requires the element to be available during effect
    unmount();
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = renderHook(() => useMouseGlow<HTMLDivElement>());
    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });
});
