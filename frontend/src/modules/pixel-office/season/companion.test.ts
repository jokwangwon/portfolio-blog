import { expect, it } from "vitest";
import { OfficeCompanion } from "./companion";
import layout from "../../../../public/assets/pixel-office/default-layout-1.json";

it("roams without a work-state input, rests at the basket, and starts another lap",()=>{
 const cat=new OfficeCompanion();
 let walked=false,restedAfterWalking=false,resumed=false;
 const visited=new Set<string>();
 for(let i=0;i<1000;i++){
   cat.update(0.1,false);
   const tile=layout.tiles[Math.floor(cat.y/16)*layout.cols+Math.floor(cat.x/16)];
   expect([0,255]).not.toContain(tile);
   visited.add(`${Math.floor(cat.x/16)}:${Math.floor(cat.y/16)}`);
   if(!cat.sleeping){walked=true;if(restedAfterWalking)resumed=true;}
   if(walked&&cat.sleeping){restedAfterWalking=true;expect([cat.x,cat.y]).toEqual([204,165]);}
 }
 expect(visited.size).toBeGreaterThan(12);
 expect(restedAfterWalking).toBe(true);expect(resumed).toBe(true);
});
it("pauses for petting and then resumes walking",()=>{
 const cat=new OfficeCompanion();for(let i=0;i<40;i++)cat.update(0.1,false);
 const before=[cat.x,cat.y];cat.pet();
 for(let i=0;i<15;i++)cat.update(0.1,false);
 expect([cat.x,cat.y]).toEqual(before);
 for(let i=0;i<40;i++)cat.update(0.1,false);
 expect([cat.x,cat.y]).not.toEqual(before);
});
it("respects reduced motion and expires a reaction",()=>{
 const cat=new OfficeCompanion();cat.pet();
 for(let i=0;i<40;i++)cat.update(0.1,true);
 expect([cat.x,cat.y]).toEqual([204,165]);expect(cat.reaction).toBe(0);expect(cat.sleeping).toBe(true);
});
