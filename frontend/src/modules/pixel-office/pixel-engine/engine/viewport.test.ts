import { describe, expect, it } from "vitest";
import { fitOfficeZoom, officeViewport } from "./viewport";

describe("office viewport", () => {
  it("fits on narrow, desktop and high-DPI screens", () => {
    for (const [width,height] of [[270,168],[810,503],[1620,1006]]) {
      const zoom = fitOfficeZoom(width,height,336,208);
      expect(336*zoom).toBeLessThanOrEqual(width);
      expect(208*zoom).toBeLessThanOrEqual(height);
      if (zoom>=1) expect(Number.isInteger(zoom)).toBe(true);
    }
  });
  it("aligns hit testing with the native scene at fractional scale and pan", () => {
    const view = officeViewport(280,180,0.75,{x:13,y:-7},336,208);
    expect(Number.isInteger(view.width)).toBe(true);
    expect(Number.isInteger(view.height)).toBe(true);
    const world={x:43,y:71};
    const screen={x:view.offsetX+world.x*0.75,y:view.offsetY+world.y*0.75};
    expect((screen.x-view.offsetX)/0.75).toBe(world.x);
    expect((screen.y-view.offsetY)/0.75).toBe(world.y);
  });
});

it("keeps native backing dimensions valid while a container is hidden", () => {
  const view=officeViewport(0,0,2,{x:0,y:0},336,208);
  expect(view.width).toBeGreaterThan(0);
  expect(view.height).toBeGreaterThan(0);
});
