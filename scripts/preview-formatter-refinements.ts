/** Before/after text from the pinned real formatter engine, using synthetic streams. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {CustomFormatter} from '../.vendor/AIOStreams/packages/core/src/formatters/custom.ts';
import {ROOT} from './icon-cdn.mjs';
const dir=path.join(ROOT,'badges/design');
const before=JSON.parse(await fs.readFile(path.join(dir,'formatter-before-2.4.0.json'),'utf8'));
const after=JSON.parse(await fs.readFile(path.join(ROOT,'formatter-detailed.json'),'utf8'));
const common={rankedStreamExpressionsMatched:[],streamExpressionScore:80,proxied:false,addon:{name:'Comet'}};
const examples=[
 {label:'Season pack',stream:{...common,type:'debrid',size:18.2e9,folderSize:100e9,service:{id:'realdebrid',cached:true},parsedFile:{seasonPack:true,container:'mkv',encode:'hevc'}}},
 {label:'Duplicate file/folder size',stream:{...common,type:'http',size:18.2e9,folderSize:18.2e9,parsedFile:{container:'mkv'}}},
 {label:'Swarm and delivery flags',stream:{...common,type:'p2p',size:8.2e9,preloading:true,torrent:{seeders:125,private:true,freeleech:true},parsedFile:{container:'mkv'}}},
];
const layers:any[]=[],evidence:any[]=[];
const fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf');
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
async function text(s:string,x:number,y:number,size=20,color='#DCE5F1'){
 const input=await sharp({text:{text:`<span foreground="${color}">${esc(s)}</span>`,font:`Manrope SemiBold ${size}`,fontfile,rgba:true}}).png().toBuffer();layers.push({input,left:x,top:y});
}
const clean=(s:string)=>s.replace(/[\u180b-\u180d\u200b-\u200f\u2060-\u206f\ufeff]/g,'').trim();
await text('Kanso / less wording, same meaning',36,28,30,'#F3F6FB');
await text('Previous',36,88);await text('Updated',535,88);
for(const [i,e] of examples.entries()){
 const y=133+i*200;await text(e.label,36,y,17,'#92A4BC');
 const outputs=[];
 for(const [j,template] of [before,after].entries()){
  const engine=new CustomFormatter(template.name,template.description,{userData:{preferredLanguages:[]},queryType:'movie',maxSeScore:100} as any);
  const raw=await engine.format(e.stream as any),name=clean(raw.name),description=clean(raw.description);
  await text(name,36+j*499,y+32,20,j?'#94D9E7':'#C2CDDC');
  for(const [k,line] of description.split('\n').entries())await text(line,36+j*499,y+68+k*29,19);
  outputs.push({name,description});
 }
 evidence.push({label:e.label,stream:e.stream,before:outputs[0],after:outputs[1]});
}
await text('Actual AIOStreams formatter output / synthetic examples / not a device screenshot',36,754,15,'#92A4BC');
await sharp({create:{width:1040,height:800,channels:4,background:'#151A21'}}).composite(layers).png().toFile(path.join(dir,'formatter-refinements-2.4.0.png'));
await fs.writeFile(path.join(ROOT,'docs/release-evidence/formatter-refinements-2.4.0.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(path.join(dir,'formatter-refinements-2.4.0.png'));
