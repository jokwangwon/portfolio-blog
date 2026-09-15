import type { ColorValue, OfficeLayout, FurnitureInstance } from "../pixel-engine/types";
import { getColorizedSprite } from "../pixel-engine/colorize";
import type { Season } from "./season";

const color = (h:number,s:number,b:number,c=-76):ColorValue=>({h,s,b,c});
const wood=color(31,24,9,-72),wall=color(31,20,16,-72);
export const ROOM_THEMES = {
  spring: { wall, wood, floor:color(36,16,18), sofa:color(344,25,0,10), rug:"#ded3b8", stitch:"#a88b85", outside:"#5f6055", frame:"#a38a6c", board:"#3d4c42", curtain:"#c599a8", caption:"벚꽃 창가 · 봄빛 패브릭" },
  summer: { wall, wood, floor:color(85,12,12), sofa:color(165,23,-8,10), rug:"#cfc3a2", stitch:"#839078", outside:"#535d53", frame:"#a38a6c", board:"#34493e", curtain:"#799e8d", caption:"녹음 진 창가 · 초록 패브릭" },
  autumn: { wall, wood, floor:color(35,20,12), sofa:color(25,28,-5,10), rug:"#d3c09d", stitch:"#a17c58", outside:"#61584e", frame:"#a38a6c", board:"#47483a", curtain:"#b38b5e", caption:"단풍 창가 · 따뜻한 패브릭" },
  winter: { wall:color(35,14,16,-72), wood, floor:color(205,12,18), sofa:color(210,20,-6,10), rug:"#ccd2cc", stitch:"#879998", outside:"#565f62", frame:"#a38a6c", board:"#3a4749", curtain:"#8da4af", caption:"눈 덮인 창가 · 포근한 패브릭" },
} satisfies Record<Season,{wall:ColorValue;wood:ColorValue;floor:ColorValue;sofa:ColorValue;rug:string;stitch:string;outside:string;frame:string;board:string;curtain:string;caption:string}>;

export function seasonalTileColors(layout:OfficeLayout, season:Season) {
  const theme=ROOM_THEMES[season];
  return layout.tiles.map((tile,index):ColorValue|null=>{
    if(tile===255)return null;
    if(tile===0)return theme.wall;
    return index%layout.cols<10 ? theme.wood : theme.floor;
  });
}

export function seasonalFurniture(furniture:FurnitureInstance[], layout:OfficeLayout, season:Season) {
  const sofas=new Set(layout.furniture.filter(f=>f.type.startsWith("SOFA")).map(f=>`${f.col*16}:${f.row*16}`));
  return furniture.map(f=>sofas.has(`${f.x}:${f.y}`) ? {...f,sprite:getColorizedSprite(
    `season-sofa-${season}-${f.x}-${f.y}`,f.sprite,{...ROOM_THEMES[season].sofa,colorize:true})} : f);
}
