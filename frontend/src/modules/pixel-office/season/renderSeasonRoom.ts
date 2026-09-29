import { ROOM_THEMES } from "./roomTheme";
import type { Season } from "./season";

/** Decorations below furniture and characters; never change navigation geometry. */
export function renderSeasonFloor(ctx:CanvasRenderingContext2D,x:number,y:number,season:Season,night:boolean) {
  const t=ROOM_THEMES[season];
  ctx.save();ctx.translate(x,y);
  const rect=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  // Thin woven border with corner medallions; quiet texture beneath furniture.
  ctx.globalAlpha=0.14;rect(197,57,84,91,"#4d493e");ctx.globalAlpha=1;
  rect(196,55,84,91,t.stitch);rect(197,56,82,89,t.rug);
  ctx.globalAlpha=0.45;rect(199,58,78,85,t.stitch);rect(200,59,76,83,t.rug);ctx.globalAlpha=1;
  for(let i=0;i<16;i++) {
    rect(199+i*5,53,1,2,t.rug);rect(199+i*5,146,1,2,t.rug);
  }
  ctx.globalAlpha=0.07;
  for(let row=0;row<40;row++)rect(201,61+row*2,74,1,t.stitch);
  ctx.globalAlpha=1;
  for(const [cx,cy] of [[205,64],[270,64],[205,137],[270,137]]){
    rect(cx-2,cy,5,1,t.stitch);rect(cx,cy-2,1,5,t.stitch);
    rect(cx-1,cy-1,3,3,t.stitch);rect(cx,cy,1,1,t.rug);
  }
  if(!night){
    ctx.globalAlpha=0.07;
    rect(14*16+3,2*16,20,20,"#fff0bf");rect(15*16+9,2*16,19,20,"#fff0bf");
  }
  ctx.restore();
}

