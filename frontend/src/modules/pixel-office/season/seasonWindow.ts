import { ROOM_MATERIALS as M } from "./roomMaterials";
import { ROOM_THEMES } from "./roomTheme";
import type { Season } from "./season";
import type { FurnitureInstance, SpriteData } from "../pixel-engine/types";

const cache = new Map<string, FurnitureInstance>();
const OUTLOOK = {
  spring:{sky:"#cedbd4",horizon:"#a3b6a0",leaf:"#c59baa",light:"#dec2c8",shade:"#a78191"},
  summer:{sky:"#c6d8da",horizon:"#90a793",leaf:"#658971",light:"#88a187",shade:"#4f715e"},
  autumn:{sky:"#ded4bd",horizon:"#b2ab8e",leaf:"#b18b5f",light:"#c6a577",shade:"#967550"},
  winter:{sky:"#cbd8de",horizon:"#aebfc6",leaf:"#bdcdd1",light:"#e0e7e4",shade:"#92a7b0"},
} satisfies Record<Season,{sky:string;horizon:string;leaf:string;light:string;shade:string}>;

/** A recessed two-pane window: continuous cropped scenery, not separate tree pictures. */
export function seasonWindow(season:Season,night:boolean):FurnitureInstance {
  const key=`${season}-${night}`;
  const cached=cache.get(key);if(cached)return cached;
  const sprite:SpriteData=Array.from({length:28},()=>Array<string>(48).fill(""));
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{
    for(let row=Math.max(0,y);row<Math.min(28,y+h);row++)
      for(let col=Math.max(0,x);col<Math.min(48,x+w);col++)sprite[row][col]=c;
  };
  const view=OUTLOOK[season];
  const tint=(hex:string)=>night?"#"+hex.slice(1).match(/../g)!.map(v=>Math.round(parseInt(v,16)*0.48).toString(16).padStart(2,"0")).join(""):hex;
  // Recessed frame: dark reveal above/right, a projecting lit sill below.
  rect(4,0,40,25,M.outline);rect(5,1,38,23,M.wood);
  rect(6,2,36,21,M.woodShadow);
  rect(7,3,34,19,night?"#344753":view.sky);
  rect(7,3,34,1,night?"#2c3c47":"#adbdb7");
  rect(40,4,1,18,night?"#2c3c47":"#adbdb7");
  // Distant trees are a single low horizon. A near branch enters from the right.
  rect(7,18,33,4,tint(view.horizon));
  rect(7,17,8,2,tint(view.horizon));rect(27,16,13,3,tint(view.horizon));
  rect(37,10,2,12,tint("#796a53"));rect(34,14,4,1,tint("#796a53"));
  rect(32,12,3,1,tint("#796a53"));rect(36,9,1,6,tint("#927e61"));
  rect(33,5,7,7,tint(view.shade));rect(30,6,9,5,tint(view.leaf));
  rect(31,5,6,4,tint(view.light));rect(29,8,4,3,tint(view.leaf));
  rect(36,11,5,6,tint(view.shade));rect(35,11,5,4,tint(view.leaf));
  rect(35,11,3,2,tint(view.light));
  // Small glass reflections stop at the sash and never become extra crossbars.
  const reflection=night?"#62757b":"#e4e9dc";
  rect(9,6,1,6,reflection);rect(10,6,2,1,reflection);
  rect(27,6,1,4,reflection);
  rect(22,2,3,21,M.woodShadow);rect(22,2,1,21,M.woodLight);
  rect(24,14,1,3,M.outline);rect(21,14,1,3,M.outline);
  rect(6,22,36,2,M.woodLight);
  rect(2,24,44,2,M.woodLight);rect(3,24,42,1,M.woodHighlight);
  rect(4,26,40,1,M.woodShadow);rect(5,27,38,1,M.shadow);
  // Curtains hang beside the opening, instead of painting over the glazing.
  const curtain=ROOM_THEMES[season].curtain;
  rect(0,1,3,19,curtain);rect(45,1,3,19,curtain);
  rect(0,2,1,18,M.woodShadow);rect(47,2,1,18,M.woodShadow);
  rect(1,14,2,1,M.wood);rect(45,14,2,1,M.wood);
  const instance={sprite,x:14*16,y:2,zY:32.1};
  cache.set(key,instance);return instance;
}
