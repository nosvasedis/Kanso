/** Actual exported assets, before/after compact artwork and four-skin comparison. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,BADGE_IMAGE_FILES_DIR} from './icon-cdn.mjs';
const dir=path.join(ROOT,'badges/design');
const version=process.argv[2]??'2.3.3',balance=version==='2.4.0',clipping=version==='2.3.4'||balance;
const before=JSON.parse(await fs.readFile(path.join(dir,`layout-before-${version}.json`),'utf8'));
const after=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf'),layers=[];
async function label(s,x,y,size=18,color='#ACB9CD'){
 const input=await sharp({text:{text:`<span foreground="${color}">${s}</span>`,font:`Manrope SemiBold ${size}`,fontfile,rgba:true}}).png().toBuffer();
 layers.push({input,left:x,top:y});
}
async function art(id,m,x,y,skin='outline',height=40){
 const ref=m.filters[id].skins[skin];
 const input=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,ref.file));
 const meta=await sharp(input).metadata();
 const ah=Math.round(height*.8),aw=Math.max(Math.round(height*1.7),Math.min(Math.round(height*4.6),Math.round(meta.width/meta.height*ah))),w=aw+Math.round(height*.3);
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${skin}-detailed.json`),'utf8'));
 const f=pack.filters.find(f=>f.id===id),fill=f.tagColor==='#00000000'?'none':f.tagColor;
 const frame=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}"><rect x=".75" y=".75" width="${w-1.5}" height="${height-1.5}" rx="${height*.24}" fill="${fill}" stroke="${f.borderColor.replace(/^#FF/,'#')}" stroke-width="1.5"/></svg>`);
 const rendered=await sharp(frame).composite([{input:await sharp(input).resize({width:aw,height:ah,fit:'contain',background:'#00000000'}).png().toBuffer(),left:Math.floor((w-aw)/2),top:Math.floor((height-ah)/2)}]).png().toBuffer();
 layers.push({input:rendered,left:x,top:y});return w;
}
await label(balance?'Kanso / stronger logos and readable channels':clipping?'Kanso / clean edges and compact labels':'Kanso / compact artwork',36,28,30,'#F1F5FA');
await label('Previous',300,90);await label('Updated',660,90);
const ids=balance?['v-dv-hdr','v-dv-hdr10','v-dv-hdr10p','a-at-dp','a-at-th','ch-20','ch-51','ch-71']:clipping?['q-hc','caption-forced','ch-51','r-4k','r-1440','sub-ms','edition-theatrical','uncensored-edition']:['q-dvd-remux','ch-51','r-4k','r-1080','edition-extended','edition-theatrical','uncensored-edition','criterion-collection'];
for(const [i,id] of ids.entries()){
 const y=128+i*58;await label(before.filters[id].label,36,y+12,16);
 await art(id,before,300,y);await art(id,after,660,y);
}
await label(balance?'Full-height ink / all four skins':clipping?'Complete lettering / all four skins':'One channel layout / all four skins',36,616,22,'#E5EDF7');
for(const [i,skin] of ['outline','transparent','solid','mono'].entries()){
 await label(skin,36+i*234,660,16);
 if(clipping){for(const [j,id] of (balance?['ch-51','ch-20','v-dv-hdr10','a-at-th']:['ch-71','r-1080','sub-ms','caption-forced']).entries())await art(id,after,36+i*234,688+j*60,skin,40);}
 else await art('ch-71',after,36+i*234,688,skin,56);
}
const offset=clipping?180:0;
await label('Native 20px / exact values and decimal points',36,780+offset,21,'#E5EDF7');
let x=36;for(const id of (balance?['v-dv-hdr','v-dv-hdr10p','a-at-th','a-at-dp','ch-10','ch-20','ch-51','ch-71']:clipping?['q-hc','caption-forced','r-4k','r-1440','r-1080','sub-ms','sub-en','ch-10','ch-51','ch-71']:['q-dvd-remux','r-4k','r-1440','r-1080','ch-10','ch-20','ch-21','ch-51','ch-61','ch-71','ch-81']))x+=await art(id,after,x,826+offset,'outline',20)+10;
await label('Actual exported PNGs. Nuvio geometry approximation; not a device capture.',36,885+offset,15);
const file=path.join(dir,`compact-refinements-${version}.png`);
await sharp({create:{width:1000,height:935+offset,channels:4,background:'#151A21'}}).composite(layers).png().toFile(file);
console.log(file);
