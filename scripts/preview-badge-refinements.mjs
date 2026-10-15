/** Focused before/after and transparency proof using the actual badge PNGs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,BADGE_IMAGE_FILES_DIR} from './icon-cdn.mjs';
const dir=path.join(ROOT,'badges/design');
const before=JSON.parse(await fs.readFile(path.join(dir,'layout-before-2.3.2.json'),'utf8'));
const after=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf'),layers=[];
async function label(s,x,y,size=20,color='#C3CDDD'){
 const input=await sharp({text:{text:`<span foreground="${color}">${s}</span>`,font:`Manrope SemiBold ${size}`,fontfile,rgba:true}}).png().toBuffer();layers.push({input,left:x,top:y});
}
async function art(id,m,x,y,skin='outline',height=40){
 const f=m.filters[id].skins[skin];const input=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,f.file));const meta=await sharp(input).metadata();
 const ah=Math.round(height*.8),aw=Math.max(Math.round(height*1.7),Math.min(Math.round(height*4.6),Math.round(meta.width/meta.height*ah))),w=aw+Math.round(height*.3);
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}"><rect x=".75" y=".75" width="${w-1.5}" height="${height-1.5}" rx="7" fill="none" stroke="${f.ink}" stroke-width="1.5"/></svg>`);
 layers.push({input:await sharp(svg).composite([{input:await sharp(input).resize({width:aw,height:ah,fit:'contain'}).png().toBuffer(),left:Math.floor((w-aw)/2),top:Math.floor((height-ah)/2)}]).png().toBuffer(),left:x,top:y});
}
await label('Kanso / refined spacing and real transparency',36,29,29,'#F1F5FA');
await label('Previous',285,92,19);await label('Updated',660,92,19);
const ids=['web-1','web-6-webrip','blu-ray-1','remux-1','q-w','q-wr'];
for(const [i,id] of ids.entries()){
 const y=133+i*56;await label(after.filters[id].label,36,y+11,16);
 await art(id,before,285,y);await art(id,after,660,y);
}
await label('Subtitle artwork on a checkerboard background',36,499,22,'#E4EBF6');
const check=[];for(let y=0;y<98;y+=14)for(let x=0;x<925;x+=14)check.push(`<rect x="${x}" y="${y}" width="14" height="14" fill="${(x/14+y/14)%2?'#29435B':'#1C3046'}"/>`);
layers.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="925" height="98">${check.join('')}</svg>`),left:36,top:546});
await label('Before',52,559,15);await art('sub-en',before,135,575);
await label('After',338,559,15);await art('sub-en',after,411,575);await art('sub-el',after,551,575);await art('sub-ja',after,691,575);
await label('Captions retain their original size. Tier numbers share the icon row.',36,673,17,'#94A5BD');
await sharp({create:{width:1000,height:721,channels:4,background:'#151A21'}}).composite(layers).png().toFile(path.join(dir,'refinements-2.3.2.png'));
console.log(path.join(dir,'refinements-2.3.2.png'));
