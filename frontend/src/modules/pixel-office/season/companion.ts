import type { FurnitureInstance } from "../pixel-engine/types";
import { detailedCat } from "./decorSprites";
import { ROOM_MATERIALS as M } from "./roomMaterials";

/** Ambient visitor, intentionally separate from working agents, seats and presence. */
export class OfficeCompanion {
  x=204;y=165;sleeping=true;reaction=0;coffee=0;
  private clock=0;private pause=0.5;private target=0;private facingLeft=false;
  private route=[{x:188,y:156},{x:188,y:52},{x:291,y:52},{x:291,y:149},{x:250,y:157},{x:204,y:165}];
  pet(){this.reaction=3;}
  brew(){this.coffee=4;}
  update(dt:number,reduced:boolean){
    dt=Math.min(Math.max(dt,0),0.1);this.clock+=dt;
    this.reaction=Math.max(0,this.reaction-dt);this.coffee=Math.max(0,this.coffee-dt);
    if(reduced){this.x=204;this.y=165;this.pause=0.5;this.target=0;this.sleeping=true;return;}
    if(this.reaction>0)return;
    if(this.pause>0){this.pause-=dt;return;}
    this.sleeping=false;
    const goal=this.route[this.target],dx=goal.x-this.x,dy=goal.y-this.y,d=Math.hypot(dx,dy);
    const step=dt*15;
    if(d<=step){this.x=goal.x;this.y=goal.y;this.target=(this.target+1)%this.route.length;this.sleeping=this.target===0;this.pause=this.sleeping?4:0.35;}
    else {this.facingLeft=dx<0;this.x+=dx/d*step;this.y+=dy/d*step;}
  }
  hit(x:number,y:number){return Math.abs(x-this.x)<13&&y>this.y-20&&y<this.y+5;}
  furniture():FurnitureInstance {
    return {sprite:detailedCat(this.sleeping,this.pause>0||this.reaction>0?0:Math.floor(this.clock*6)%2,this.reaction>0),
      x:Math.round(this.x)-11,y:Math.round(this.y)-17,zY:this.y,mirrored:this.facingLeft};
  }
  drawFloor(ctx:CanvasRenderingContext2D,x:number,y:number,color:string){
    ctx.save();
    // A stable floor contact shadow follows the feet, including walking frames.
    ctx.fillStyle=M.shadow;ctx.globalAlpha=0.20;
    ctx.fillRect(x+Math.round(this.x)-7,y+Math.round(this.y)-1,16,2);
    ctx.fillRect(x+Math.round(this.x)-4,y+Math.round(this.y)+1,10,1);
    ctx.globalAlpha=1;
    ctx.translate(x+189,y+156);
    const rect=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    // Wicker rim, rounded corners, recessed cushion and woven front edge.
    ctx.globalAlpha=0.18;rect(3,14,25,2,M.shadow);ctx.globalAlpha=1;rect(1,4,29,9,M.outline);rect(4,1,23,14,M.outline);
    rect(2,4,27,8,M.wood);rect(5,2,21,12,M.woodLight);
    rect(5,4,21,8,M.woodShadow);rect(7,3,17,10,M.woodShadow);
    rect(6,5,19,6,color);rect(8,4,15,8,color);
    rect(4,11,23,3,M.wood);rect(5,11,21,1,M.woodHighlight);
    for(let i=0;i<7;i++)rect(5+i*3,12,1,2,M.woodShadow);
    rect(2,6,1,4,M.woodHighlight);rect(28,6,1,4,M.woodShadow);
    ctx.restore();
  }

  drawReaction(ctx:CanvasRenderingContext2D,x:number,y:number,reduced:boolean){
    ctx.save();ctx.translate(x,y);
    if(this.reaction>0){
      const px=Math.round(this.x),py=Math.round(this.y)-24;
      ctx.fillStyle="#875668";ctx.fillRect(px-4,py,4,3);ctx.fillRect(px,py,4,3);ctx.fillRect(px-3,py+3,6,2);ctx.fillRect(px-2,py+5,4,1);
      ctx.fillStyle="#d4919f";ctx.fillRect(px-3,py,2,2);ctx.fillRect(px+1,py,2,2);
      ctx.fillRect(px-3,py+2,6,2);ctx.fillRect(px-2,py+4,4,1);ctx.fillRect(px-1,py+5,2,1);ctx.fillStyle="#f4c4ca";ctx.fillRect(px-2,py,1,1);
    }
    if(this.coffee>0){
      ctx.fillStyle="#eadcc3";ctx.globalAlpha=0.65;
      for(let i=0;i<3;i++){
        const bob=reduced?0:Math.floor(this.clock*3+i)%3;
        ctx.fillRect(232+i*3,95-bob-i*2,1,3);
      }
    }
    ctx.restore();
  }
}
