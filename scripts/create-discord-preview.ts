/** Illustrative Nuvio-style screenshot, with real engine output and exported PNGs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {CustomFormatter} from '../.vendor/AIOStreams/packages/core/src/formatters/custom.ts';
import {nuvioHaystacks,nuvioRegex} from './benchmark-badge-patterns.mjs';
import {ROOT,BADGE_IMAGE_FILES_DIR} from './icon-cdn.mjs';
const out=path.join(ROOT,'docs/discord');await fs.mkdir(out,{recursive:true});
const version=JSON.parse(await fs.readFile(path.join(ROOT,'package.json'),'utf8')).version;
const formatter=JSON.parse(await fs.readFile(path.join(ROOT,'formatter-detailed.json'),'utf8'));
const pack=JSON.parse(await fs.readFile(path.join(ROOT,'kanso-outline-detailed.json'),'utf8'));
const engine=new CustomFormatter(formatter.name,formatter.description,{userData:{preferredLanguages:['English'],preferredSubtitles:['Greek']},queryType:'movie',maxSeScore:100} as any);
const common={filename:null,proxied:false,rankedStreamExpressionsMatched:[],streamExpressionScore:80};
const inputs=[
 {...common,type:'debrid',size:18.2e9,addon:{name:'Comet'},service:{id:'realdebrid',cached:true},parsedFile:{quality:'WEB-DL',resolution:'2160p',encode:'hevc',container:'mkv',releaseGroup:'FLUX',network:'Amazon',visualTags:['DV','HDR10+'],audioTracks:[{lang:'English',tags:['DD+','Atmos'],channels:'5.1'}],subtitles:['Greek'],subtitleTracks:[{lang:'Greek',hearingImpaired:true}],mediaInfoQuality:'probe'}},
 {...common,type:'debrid',size:52.4e9,addon:{name:'Comet'},service:{id:'realdebrid',cached:false},parsedFile:{quality:'BluRay REMUX',resolution:'2160p',encode:'hevc',container:'mkv',releaseGroup:'FraMeSToR',visualTags:['DV','HDR10'],audioTracks:[{lang:'English',tags:['TrueHD','Atmos'],channels:'7.1'}],subtitles:['Greek'],mediaInfoQuality:'probe'}},
 {...common,type:'usenet',size:12.8e9,bitrate:21e6,age:36,indexer:'NZBGeek',message:'NZB Health: 💚 Complete',addon:{name:'AIOStreams'},service:{id:'torbox',cached:true},parsedFile:{quality:'WEB-DL',resolution:'2160p',encode:'hevc',container:'mkv',releaseGroup:'NTb',network:'Netflix',visualTags:['HDR10'],audioTracks:[{lang:'English',tags:['DD+'],channels:'5.1'}],subtitles:['Greek'],mediaInfoQuality:'probe'}},
 {...common,type:'http',size:4.6e9,addon:{name:'Direct'},parsedFile:{quality:'WEBRip',resolution:'1080p',encode:'avc',container:'mp4',audioTracks:[{lang:'English',tags:['AAC'],channels:'2.0'}],subtitles:['Greek'],mediaInfoQuality:'probe'}},
];
const clean=(s:string)=>s.replace(/[\u180b-\u180d\u200b-\u200f\u2060-\u206f\ufeff]/g,'');
const examples=[];
for(const stream of inputs){const f=await engine.format(stream as any);const hay=nuvioHaystacks([f.name,f.description]);examples.push({stream,name:clean(f.name),description:clean(f.description),badges:pack.filters.filter((b:any)=>hay.some((h:string)=>nuvioRegex(b.pattern).test(h)))});}
await fs.writeFile(path.join(out,'preview-evidence.json'),JSON.stringify(examples.map(e=>({...e,badges:e.badges.map((b:any)=>b.id)})),null,2)+'\n');
const W=1920,H=1080,layers:any[]=[];
const fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf');
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
async function text(s:string,x:number,y:number,size=24,color='#DAE0E9',bold=false){
 const input=await sharp({text:{text:`<span foreground="${color}">${esc(s)}</span>`,font:`Manrope ${bold?'Bold':'Medium'} ${size}`,fontfile,rgba:true}}).png().toBuffer();layers.push({input,left:x,top:y});
}
const background=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#101b29"/><stop offset="1" stop-color="#080b10"/></linearGradient><radialGradient id="glow"><stop stop-color="#445a76" stop-opacity=".33"/><stop offset="1" stop-color="#15202e" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#bg)"/><ellipse cx="190" cy="450" rx="620" ry="700" fill="url(#glow)"/><path d="M578 85v900" stroke="#273142" stroke-width="1"/><rect x="616" y="66" width="1240" height="76" rx="15" fill="#121924"/></svg>`);
layers.push({input:background,left:0,top:0});
await text('nuvio',64,62,42,'#F3F6FC',true);
await text('SELECT A STREAM',64,170,16,'#8494A9',true);
await text('Kanso',60,218,90,'#F5F7FB',true);
await text('Detailed',64,327,51,'#E3E9F2',true);
await text('The stream details,\nbeautifully arranged.',66,416,28,'#A4B2C6');
await text('OUTLINE  /  MANROPE',66,544,15,'#889BB7',true);
const mark=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="430" height="300"><rect x="1" y="1" width="428" height="298" rx="20" fill="#101a27" stroke="#2b394c"/></svg>');
layers.push({input:mark,left:64,top:610});
const brand=await sharp(path.join(ROOT,'assets/Kanso/kanso-icon-transparent.png')).trim({background:'#00000000'}).resize({width:330}).png().toBuffer();
layers.push({input:brand,left:114,top:697});
await text('Every detail once.',151,810,21,'#B4C2D5');
await text('FORMATTER + BADGES',65,943,17,'#A0B2CA',true);
await text(`Kanso ${version} · Nuvio TV preview`,65,977,16,'#71849E');
await text('Sources',645,84,27,'#EAF0F9',true);
await text('All providers',1290,91,18,'#8F9FB5');
await text('4 demo streams',1649,91,18,'#8F9FB5');
for(const [i,e] of examples.entries()){
 const x=616,y=166+i*214,width=1240,height=198;
 const card=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="1.5" y="1.5" width="${width-3}" height="${height-3}" rx="15" fill="${i===0?'#192537':'#121b28'}" stroke="${i===0?'#94B9F4':'#273448'}" stroke-width="${i===0?2.5:1}"/></svg>`);
 layers.push({input:card,left:x,top:y});
 await text(e.name,x+27,y+19,25,'#EDF2FA',true);
 // The real formatter controls line breaks and all cache/dot positions.
 const lines=e.description.split('\n');
 for(const [j,line] of lines.entries())await text(line,x+28,y+55+j*25,20,'#B8C6D9');
 let bx=x+28;const by=y+height-41;
 for(const f of e.badges){
  const input=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,path.basename(new URL(f.imageURL).pathname)));
  const m=await sharp(input).metadata();const artH=22,artW=Math.max(47,Math.min(127,Math.round(m.width!/64*artH))),bw=artW+9,bh=28;
  const frame=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><rect x=".75" y=".75" width="${bw-1.5}" height="${bh-1.5}" rx="6" fill="none" stroke="${f.borderColor.slice(-6).padStart(7,'#')}" stroke-width="1.5"/></svg>`);
  const chip=await sharp(frame).composite([{input:await sharp(input).resize({width:artW,height:artH,fit:'contain',background:'#00000000'}).png().toBuffer(),left:4,top:3}]).png().toBuffer();
  layers.push({input:chip,left:bx,top:by});bx+=bw+9;
 }
 if(bx>x+width-24)throw new Error('Badges overflow preview card');
}
await text('ILLUSTRATIVE NUVIO-STYLE MOCKUP · ACTUAL FORMATTER OUTPUT AND BADGE ASSETS · NOT A DEVICE CAPTURE',64,1048,13,'#697B94');
const dest=path.join(out,'kanso-nuvio-detailed-preview.png');
await sharp({create:{width:W,height:H,channels:4,background:'#080b10'}}).composite(layers).png().toFile(dest);
console.log(dest);
