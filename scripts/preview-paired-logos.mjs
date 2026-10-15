/** Current exported logo pairs against the preceding release, at Nuvio chip scale. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,BADGE_IMAGE_FILES_DIR} from './icon-cdn.mjs';
const dir=path.join(ROOT,'badges/design'),fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf'),layers=[];
const before=JSON.parse(await fs.readFile(path.join(dir,'layout-before-2.4.1.json'),'utf8'));
const after=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
async function label(s,x,y,size=18,color='#ABB9CD'){
 layers.push({input:await sharp({text:{text:`<span foreground="${color}">${s}</span>`,font:`Manrope SemiBold ${size}`,fontfile,rgba:true}}).png().toBuffer(),left:x,top:y});
}
async function chip(id,skin,design,x,y,h=40){
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${skin}-detailed.json`),'utf8')),f=pack.filters.find(f=>f.id===id);
 const input=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,design.filters[id].skins[skin].file)),m=await sharp(input).metadata();
 const ah=Math.round(h*.8),aw=Math.max(Math.round(h*1.7),Math.min(Math.round(h*4.6),Math.round(m.width/m.height*ah))),w=aw+Math.round(h*.3);
 const frame=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x=".75" y=".75" width="${w-1.5}" height="${h-1.5}" rx="${h*.24}" fill="${f.tagColor==='#00000000'?'none':f.tagColor}" stroke="${f.borderColor.replace(/^#FF/,'#')}" stroke-width="1.5"/></svg>`);
 layers.push({input:await sharp(frame).composite([{input:await sharp(input).resize({width:aw,height:ah,fit:'contain',background:'#00000000'}).png().toBuffer(),left:Math.floor((w-aw)/2),top:Math.floor((h-ah)/2)}]).png().toBuffer(),left:x,top:y});
 return w;
}
await label('Kanso / balanced official logo pairs',32,28,30,'#F1F5FA');
await label('Previous',310,91);await label('Updated',660,91);
let row=0;
for(const skin of ['outline','transparent','solid','mono'])for(const id of ['v-dv-hdr10','v-dv-hdr10p']){
 const y=129+row++*61;
 await label(`DV + ${id.endsWith('p')?'HDR10+':'HDR10'} / ${skin}`,32,y+12,16);
 await chip(id,skin,before,310,y);await chip(id,skin,after,660,y);
}
await label('Native 20px',32,650,17);
let x=210;for(const id of ['v-dv-hdr10','v-dv-hdr10p'])x+=await chip(id,'outline',after,x,649,20)+16;
await label('Actual exported artwork. Native-size approximation; not a device capture.',32,699,15);
const file=path.join(dir,'paired-logos-2.4.1.png');
await sharp({create:{width:1000,height:744,channels:4,background:'#151A21'}}).composite(layers).png().toFile(file);
console.log(file);
