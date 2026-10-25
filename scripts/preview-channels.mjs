/** Channel additions shown with actual exported PNGs and Nuvio-style frames. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,BADGE_IMAGE_FILES_DIR} from './icon-cdn.mjs';
const layers=[],fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf');
const skins=['outline','transparent','solid','mono'];
const packs=Object.fromEntries(await Promise.all(skins.map(async s=>[s,JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${s}-detailed.json`),'utf8'))])));
async function label(s,x,y,size=20,color='#ACB9CD'){
 layers.push({input:await sharp({text:{text:`<span foreground="${color}">${s}</span>`,font:`Manrope SemiBold ${size}`,fontfile,rgba:true}}).png().toBuffer(),left:x,top:y});
}
async function chip(id,skin,x,y,h=48){
 const f=packs[skin].filters.find(f=>f.id===id),input=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,path.basename(new URL(f.imageURL).pathname)));
 const m=await sharp(input).metadata(),ah=Math.round(h*.8),aw=Math.max(Math.round(h*1.7),Math.min(Math.round(h*4.6),Math.round(m.width/m.height*ah))),w=aw+Math.round(h*.3);
 const frame=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x=".75" y=".75" width="${w-1.5}" height="${h-1.5}" rx="${h*.24}" fill="${f.tagColor==='#00000000'?'none':f.tagColor}" stroke="${f.borderColor.replace(/^#FF/,'#')}" stroke-width="1.5"/></svg>`);
 layers.push({input:await sharp(frame).composite([{input:await sharp(input).resize({width:aw,height:ah,fit:'contain',background:'#00000000'}).png().toBuffer(),left:Math.floor((w-aw)/2),top:Math.floor((h-ah)/2)}]).png().toBuffer(),left:x,top:y});return w;
}
await label('Kanso / new channel layouts',36,27,32,'#F1F5FA');
for(const [i,value] of ['3.0','4.0','5.0','6.0'].entries()){
 await label(value,222+i*180,94,22);
 for(const [j,skin] of skins.entries())await chip('ch-'+value.replace('.',''),skin,200+i*180,134+j*72);
}
for(const [i,skin] of skins.entries())await label(skin,36,149+i*72,18);
await label('All 11 layouts / native 20px approximation',36,438,21,'#E2EBF7');
let x=36;for(const f of packs.outline.filters.filter(f=>f.groupId==='gc'))x+=await chip(f.id,'outline',x,483,20)+10;
await label('Actual exported artwork; not a device screenshot.',36,539,15);
const file=path.join(ROOT,'badges/design/channels-2.5.0.png');
await sharp({create:{width:980,height:583,channels:4,background:'#151A21'}}).composite(layers).png().toFile(file);
console.log(file);
