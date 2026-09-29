import { expect, it } from "vitest";
import layout from "../../../../public/assets/pixel-office/default-layout-1.json";
import { seasonalTileColors, ROOM_THEMES } from "./roomTheme";
import type { OfficeLayout } from "../pixel-engine/types";

it("changes all four room palettes without changing navigation or source colors", () => {
  const before=JSON.stringify(layout);
  const themes=Object.keys(ROOM_THEMES) as Array<keyof typeof ROOM_THEMES>;
  const colors=themes.map(season=>seasonalTileColors(layout as OfficeLayout,season));
  expect(new Set(colors.map(value=>JSON.stringify(value))).size).toBe(4);
  expect(JSON.stringify(layout)).toBe(before);
  for(const palette of colors) {
    expect(palette).toHaveLength(layout.tiles.length);
    layout.tiles.forEach((tile,index)=>{if(tile===255)expect(palette[index]).toBeNull();});
  }
});
