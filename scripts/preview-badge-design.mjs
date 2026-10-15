import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,BADGE_IMAGE_FILES_DIR} from './icon-cdn.mjs';
const fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf');
const out=path.join(ROOT,'badges/design');
const version=JSON.parse(await fs.readFile(path.join(ROOT,'package.json'),'utf8')).version;
const families=[['gst','Special editions'],['gs','Streaming'],['gms','Source tiers'],['grl','Sources'],['gr','Resolution'],['gv','Picture'],['ga','Audio'],['gc','Channels'],['gl','Languages'],['gsub','Subtitles']];
async function label(value,size,color){return sharp({text:{text:`<span foreground="${color}">${value.replaceAll('&','&amp;')}</span>`,font:`Manrope SemiBold ${size}`,fontfile,rgba:true}}).png().toBuffer();}
async function chip(f,height){
 const b=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,path.basename(new URL(f.imageURL).pathname)));
 const m=await sharp(b).metadata();
 const artH=Math.round(height*.8),artW=Math.max(Math.round(height*1.7),Math.min(Math.round(height*4.6),Math.round(m.width/m.height*artH)));
 const art=await sharp(b).resize({width:artW,height:artH,fit:'contain',background:'#00000000'}).png().toBuffer();
 const width=artW+Math.round(height*.3),pad=Math.floor((width-artW)/2);
 const color=f.borderColor.replace(/^#FF/,'#');
 const fill=f.tagColor==='#00000000'?'none':f.tagColor;
 const frame=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x=".75" y=".75" width="${width-1.5}" height="${height-1.5}" rx="${height*.24}" fill="${fill}" stroke="${color}" stroke-width="1.5"/></svg>`);
 return {input:await sharp(frame).composite([{input:art,left:pad,top:Math.floor((height-artH)/2)}]).png().toBuffer(),width};
}
async function sheet(native=false,skin='outline'){
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${skin}-detailed.json`),'utf8'));
 const width=1420,margin=55,layers=[];
 let y=50;
 layers.push({input:await label('Kanso',48,'#ffffff'),left:margin,top:y});y+=74;
 layers.push({input:await label(native?'Outline / native 20px chip scale':`${skin[0].toUpperCase()+skin.slice(1)} / Manrope Semibold / original brand marks`,20,'#9da7b4'),left:margin,top:y});y+=64;
 for(const [group,name] of families){
  layers.push({input:await label(name,22,'#dbe1ea'),left:margin,top:y});y+=43;
  let x=margin;const height=native?20:40;
  for(const f of pack.filters.filter(f=>f.groupId===group)){
   const c=await chip(f,height);
   if(x+c.width>width-margin){x=margin;y+=height+14;}
   layers.push({input:c.input,left:x,top:y});x+=c.width+10;
  }
  y+=height+49;
 }
 const dest=path.join(out,native?'native-preview.png':skin==='outline'?'preview.png':`${skin}-preview.png`);
 await sharp({create:{width,height:y,channels:4,background:'#151a21'}}).composite(layers).png().toFile(dest);
 console.log(dest);
}
await sheet();await sheet(true);
await sheet(false,'solid');await sheet(false,'mono');
await sheet(false,'transparent');
// Focused reference sheet for reviewing the display-shaped resolution family.
const resolutionLayers=[];
for(const [i,skin] of ['outline','solid','transparent','mono'].entries()){
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${skin}-detailed.json`),'utf8'));
 const y=24+i*88;
 resolutionLayers.push({input:await label(skin[0].toUpperCase()+skin.slice(1),16,'#dbe1ea'),left:24,top:y});
 let x=24;
 for(const f of pack.filters.filter(f=>f.groupId==='gr')){
  const c=await chip(f,40);resolutionLayers.push({input:c.input,left:x,top:y+26});x+=c.width+10;
 }
}
await sharp({create:{width:960,height:380,channels:4,background:'#151a21'}}).composite(resolutionLayers).png().toFile(path.join(out,'resolution-preview.png'));
const data=Object.fromEntries(await Promise.all(['outline','solid','transparent','mono'].map(async skin=>[skin,JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${skin}-detailed.json`),'utf8'))])));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kanso badge design</title><style>@font-face{font-family:Manrope;src:url('../../assets/fonts/Manrope.ttf');font-weight:200 800}*{box-sizing:border-box}body{margin:0;background:#151a21;color:#eef2f8;font-family:Manrope,system-ui,sans-serif}main{max-width:1350px;margin:auto;padding:48px 28px}h1{font-size:48px;letter-spacing:-2px;margin:0}p{color:#a4aebd}header{margin-bottom:35px}button{font:inherit;border:1px solid #485365;border-radius:9px;padding:8px 16px;background:transparent;color:inherit;cursor:pointer}button[aria-pressed=true]{background:#eef2f8;color:#151a21}nav{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}h2{font-size:18px;font-weight:600;margin-top:32px}.row{display:flex;flex-wrap:wrap;gap:10px}.chip{height:40px;border:1.5px solid;border-radius:9px;padding:3px 6px;display:flex;align-items:center;justify-content:center}.chip img{height:32px;min-width:68px;max-width:184px;object-fit:contain}.native .chip{height:20px;border-width:1px;border-radius:5px;padding:1px 3px}.native .chip img{height:16px;min-width:34px;max-width:92px}.note{font-size:13px;margin-top:40px}</style><main><header><h1>Kanso</h1><p>Original marks. Quiet typography. One outline system.</p><nav aria-label="Badge skin">${Object.keys(data).map((s,i)=>`<button data-skin="${s}" aria-pressed="${i===0}">${s[0].toUpperCase()+s.slice(1)}</button>`).join('')}</nav><button id="scale" aria-pressed="false">Show native 20px size</button></header><div id="library"></div><p class="note">Local generated PNGs. Native-size view approximates Nuvio TV geometry; device rendering has not been verified. Kanso ${version} uses the matching formatter and badge packs.</p></main><script>const packs=${JSON.stringify(data)},families=${JSON.stringify(families)};let skin='outline';function render(){const root=document.querySelector('#library');root.replaceChildren();for(const [g,name] of families){const title=document.createElement('h2');title.textContent=name;root.append(title);const row=document.createElement('div');row.className='row';for(const f of packs[skin].filters.filter(f=>f.groupId===g)){const chip=document.createElement('span');chip.className='chip';chip.title=f.name;chip.style.borderColor=f.borderColor.replace(/^#FF/,'#');chip.style.background=f.tagColor==='#00000000'?'transparent':f.tagColor;const img=document.createElement('img');img.alt=f.name;img.src='../badge-images/files/'+new URL(f.imageURL).pathname.split('/').pop();chip.append(img);row.append(chip)}root.append(row)}}document.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{skin=b.dataset.skin;document.querySelectorAll('[data-skin]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()});document.querySelector('#scale').onclick=e=>{const on=document.body.classList.toggle('native');e.target.setAttribute('aria-pressed',String(on));e.target.textContent=on?'Show enlarged 40px size':'Show native 20px size'};render()</script></html>`;
const annotated=html.replace('Original marks. Quiet typography. One outline system.','Sourced logos. Speech-shaped flags. Manrope Semibold.')
 .replace('<p class="note">','<p class="note">Outline uses colored ink matching its border; Transparent uses white ink. Speech-shaped flags retain real colors in both. Flag-filled documents with vertically stacked language codes and SUB identify subtitles. Source captions sit below icons; tiers use large plain labels. IN groups the nine Indian languages; ES and PT group their regional variants. ');
await fs.writeFile(path.join(out,'gallery.html'),annotated);
const samples=['hybrid-release','q-w','q-wr','q-r','q-cam','r-4k','a-dv','a-at-th','ch-71','ch-81','l-el','sub-el','web-1'];
const layers=[{input:await label('Kanso / clear skins',38,'#ffffff'),left:45,top:35},
 {input:await label('Outline / colored ink',22,'#b8c1cf'),left:45,top:115},
 {input:await label('Transparent / white ink',22,'#b8c1cf'),left:475,top:115}];
for(let i=0;i<samples.length;i++)for(const [col,skin] of ['outline','transparent'].entries()){
 const f=data[skin].filters.find(f=>f.id===samples[i]),c=await chip(f,40);
 layers.push({input:c.input,left:45+col*430,top:175+i*54});
}
await sharp({create:{width:900,height:175+samples.length*54+35,channels:4,background:'#151a21'}}).composite(layers).png().toFile(path.join(out,'clear-skins-comparison.png'));
