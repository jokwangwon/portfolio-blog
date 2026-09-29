import type { Season } from "./season";
import { ROOM_MATERIALS as M } from "./roomMaterials";
import { seasonalObject } from "./decorSprites";
import { getCachedSprite } from "../pixel-engine/sprites/spriteCache";

/** Tabletop still life, shaded at the same native pixel scale as the original furniture. */
export function renderSeasonOrnament(ctx:CanvasRenderingContext2D,offset:{offsetX:number;offsetY:number},zoom:number,season:Season) {
  const x=offset.offsetX+(18*16-7)*zoom,y=offset.offsetY+(10*16)*zoom;
  ctx.save();
  ctx.globalAlpha=0.20;ctx.fillStyle=M.shadow;ctx.fillRect(x+4*zoom,y+17*zoom,7*zoom,2*zoom);
  ctx.globalAlpha=1;
  ctx.drawImage(getCachedSprite(seasonalObject(season),zoom),x,y);
  ctx.restore();
}
