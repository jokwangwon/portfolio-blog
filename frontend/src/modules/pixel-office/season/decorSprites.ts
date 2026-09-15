import type { SpriteData } from "../pixel-engine/types";
import type { Season } from "./season";
import { ROOM_MATERIALS as M } from "./roomMaterials";

function pixels(rows:string[],palette:Record<string,string>,width:number,height:number):SpriteData {
  return Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>palette[rows[y]?.[x]]??""));
}
const catPalette:Record<string,string>={
  o:M.outline,s:"#8d795f",t:"#ab916b",f:"#c2aa82",l:"#d5c39f",
  c:"#dfd1b3",w:"#ece0c6",e:"#454b43",p:"#c78c83",n:"#936955",
};
const cats=new Map<string,SpriteData>();
/** Square fur silhouette with selective shadow edges, on the original pixel grid. */
export function detailedCat(sleeping:boolean,step:number,happy:boolean):SpriteData {
  const key=`${sleeping}-${step}-${happy}`;
  const cached=cats.get(key);if(cached)return cached;
  const sprite:SpriteData=Array.from({length:18},()=>Array<string>(22).fill(""));
  const rect=(x:number,y:number,w:number,h:number,tone:string)=>{
    for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)sprite[row][col]=catPalette[tone];
  };
  if(sleeping){
    rect(3,9,16,7,"s");rect(4,9,14,6,"f");rect(4,9,12,1,"l");
    rect(6,10,2,2,"t");rect(10,10,2,2,"t");
    rect(11,8,10,7,"s");rect(12,9,8,5,"c");
    rect(11,6,3,4,"t");rect(18,6,3,4,"s");
    rect(11,7,2,2,"f");rect(18,7,2,2,"f");
    rect(13,8,6,1,"l");rect(11,10,2,3,"f");
    rect(14,9,3,1,"f");rect(13,11,2,1,"e");rect(18,11,2,1,"e");
    rect(16,12,1,1,"n");rect(2,13,3,3,"s");rect(3,14,8,2,"s");
    rect(2,13,2,2,"c");rect(4,14,6,1,"c");
    rect(11,15,6,1,"o");
  }else{
    // Fur-colored upper edges connect the back, neck and head into one silhouette.
    rect(4,7,11,7,"s");rect(5,8,9,5,"f");rect(5,7,9,1,"t");
    rect(5,8,8,1,"l");rect(7,8,1,2,"t");rect(10,8,1,2,"t");
    rect(5,12,8,1,"t");rect(8,13,4,1,"o");
    // Narrow limbs have two fur pixels, rather than dark edges on both sides.
    rect(1,5,3,6,"s");rect(1,5,2,5,"f");
    rect(3,9,3,3,"s");rect(3,9,2,2,"f");
    for(const [x,dy] of [[5,step?1:0],[12,step?0:1]]){
      rect(x,13,3,3+dy,"s");rect(x,13,2,2+dy,"c");
      rect(x,15+dy,2,1,"o");
    }
    rect(11,3,10,9,"s");rect(12,4,8,7,"f");
    rect(12,3,8,1,"t");rect(11,1,3,4,"t");rect(18,1,3,4,"s");
    rect(11,2,2,2,"f");rect(18,2,2,2,"f");
    rect(13,4,6,1,"l");rect(14,4,1,2,"t");rect(17,4,1,2,"t");
    rect(11,8,9,3,"c");rect(11,7,1,2,"f");
    rect(13,7,happy?2:1,1,"e");rect(happy?17:18,7,happy?2:1,1,"e");
    rect(16,9,1,1,"n");rect(15,10,3,1,"w");
  }
  cats.set(key,sprite);return sprite;
}

const objects=new Map<Season,SpriteData>();
/** One ceramic vase across the year; only the stems change with the season. */
export function seasonalObject(season:Season):SpriteData {
  const cached=objects.get(season);if(cached)return cached;
  const palette:Record<string,string>={
    o:M.outline,s:"#929487",t:"#b6b8a7",l:"#d1d0bb",h:"#e1dcc4",
    g:"#687359",v:"#88957a",b:"#b1b79a",p:"#b6899d",r:"#d1a8b6",w:"#e7cdd1",
    a:"#94785b",c:"#b39970",y:"#cec09a",e:"#9c7165",
  };
  const stems:Record<Season,string[]>={
    spring:["       pp","   pp prwp","  prwp pwp","   pwpgpg","    gvg g","     g vg","    v gvg","     ggg","      g","      g"],
    summer:["        vv","       vbbv","   vv  vg","  vbbv gg","   vg ggvv","    g gvbv","     gggv","      gg","      g","      g"],
    autumn:["       a","   cc a","   cyaac","    aaa cy","    a a c","  cc a a","   ca aa","    aaa","      a","      a"],
    winter:["       a","   e  a e","   a a aa","    aaa","    a aa","  e  a a","   aaaa e","     aa","      a","      a"],
  };
  // Elliptical mouth, shaded ceramic body, narrow contact base.
  const vase=["    ooooo","   osllhso","    ottto","   otllsto","   otllsto","    otsto","    osso","     oo"];
  const sprite=pixels([...stems[season],...vase],palette,14,20);
  objects.set(season,sprite);return sprite;
}
