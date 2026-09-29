import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useOfficeCalendar } from "./useOfficeCalendar";
afterEach(()=>vi.useRealTimers());
it("updates across Seoul midnight and refreshes immediately on returning to the tab",()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date("2026-08-31T14:59:55Z"));
  const {result,unmount}=renderHook(()=>useOfficeCalendar());
  expect(result.current.season).toBe("summer");
  act(()=>vi.advanceTimersByTime(30000));
  expect(result.current.season).toBe("autumn");
  vi.setSystemTime(new Date("2026-11-30T15:00:00Z"));
  act(()=>window.dispatchEvent(new Event("focus")));
  expect(result.current.season).toBe("winter");
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("updates daylight on the same date", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-15T09:59:55Z"));
  const {result,unmount}=renderHook(()=>useOfficeCalendar());
  expect(result.current.night).toBe(false);
  act(()=>vi.advanceTimersByTime(30000));
  expect(result.current.night).toBe(true);
  unmount();
});
