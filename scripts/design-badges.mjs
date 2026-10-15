/** Kanso typography and logo system. Offline, reproducible; never publishes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName,cdnUrlForHash} from './icon-cdn.mjs';
import {buildPresetBadges,LABELS} from './preset-badges.mjs';
import {applySolidTheme} from './badge-solid-theme.mjs';
import {applyOutlineTheme} from './badge-outline-theme.mjs';
import {spokenFlagSvg,subtitleDocumentSvg,SPOKEN_FLAGS} from './spoken-flags.mjs';
import {glyphSvg,glyphForBadge,GLYPHS} from './kanso-glyphs.mjs';
import {languageDisplayInfo,LANGUAGE_FAMILIES} from './display-language-families.mjs';
import {spawnSync} from 'node:child_process';
import {containedComposite} from './badge-layout.mjs';

const designDir=path.join(ROOT,'badges/design');
await fs.mkdir(designDir,{recursive:true});
const appearancePath=path.join(ROOT,'badges/illustrated-appearance.json');
const archivePath=path.join(designDir,'original-appearance.json');
try{await fs.access(archivePath);}catch{await fs.copyFile(appearancePath,archivePath);}
const original=JSON.parse(await fs.readFile(archivePath,'utf8'));
const appearance=JSON.parse(await fs.readFile(appearancePath,'utf8'));
const pack=buildPresetBadges('outline','detailed');
const fontfile=path.join(ROOT,'assets/fonts/Manrope.ttf');
const HEIGHT=64, INK_HEIGHT=46, GAP=12, PAD=8;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const inkColor=ink=>ink==='black'?'#000000':ink.startsWith('#')?ink:'#FFFFFF';
const sources=JSON.parse(await fs.readFile(path.join(ROOT,'assets/badge-sources/sources.json'),'utf8'));
const oldPath=id=>path.join(BADGE_IMAGE_FILES_DIR,path.basename(new URL(original.themes.outline.filters[id].imageURL).pathname));
const newPath=file=>path.join(ROOT,'assets/badge-sources',file);
const inherited={
 'v-imax':'https://brand.imax.com/', 'v-imax-e':'https://www.imaxenhanced.com/',
 'a-dv':'https://news.dolby.com/en-WW/assets/228231/',
 'a-at':'https://news.dolby.com/en-WW/assets/categories/1219/',
 'a-th':'https://www.dolby.com/technologies/dolby-truehd/',
 'a-dp':'https://www.dolby.com/technologies/dolby-digital-plus/',
 'a-dd':'https://www.dolby.com/technologies/dolby-digital/',
 'a-dtsx':'https://dts.com/dtsx/',
 'a-dtsma':'https://dts.com/', 'a-dtshd':'https://dts.com/', 'a-dtses':'https://dts.com/',
 's-amzn':'https://www.primevideo.com/', 's-hulu':'https://www.hulu.com/',
 's-hmax':'https://www.hbomax.com/', 's-pcok':'https://www.peacocktv.com/',
 's-pamp':'https://www.paramountplus.com/', 's-croll':'https://www.crunchyroll.com/',
};
const direct={'criterion-collection':'criterion.svg','q-b':'bluray.svg','v-hdr10p':'hdr10plus.svg','v-hdr10':'hdr10.svg',
 'a-dv':'dolby-vision.svg','a-at':'dolby-atmos.svg','a-th':'dolby-truehd.svg','a-dd':'dolby-digital.svg','a-dp':'dolby-digital-plus.svg','a-dtsma':'dts-ma.svg',
 'a-dts':'dts.png','a-dtsx':'dts-x.png','v-imax':'imax.svg','a-flac':'flac.gif','a-opus':'opus.svg',
 's-atvp':'apple-tv.svg','s-dsnp':'disney.png','s-nflx':'netflix.png','s-amzn':'prime.png','s-hulu':'hulu.png','s-pamp':'paramount.png','s-hmax':'hbo-max.svg','s-croll':'crunchyroll.svg','s-pcok':'peacock.jpg'};

async function recolor(buffer,ink,{removeBlack=false,removeWhite=false}={}){
 const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const [red,green,blue]=inkColor(ink).slice(1).match(/../g).map(h=>parseInt(h,16));
 for(let i=0;i<data.length;i+=4){
  if(removeBlack&&Math.max(data[i],data[i+1],data[i+2])<35)data[i+3]=0;
  if(removeWhite&&Math.min(data[i],data[i+1],data[i+2])>235)data[i+3]=0;
  data[i]=red;data[i+1]=green;data[i+2]=blue;
 }
 return sharp(data,{raw:info}).png().toBuffer();
}
async function text(label,ink='white',h=INK_HEIGHT,bold=false){
 const b=await sharp({text:{text:`<span foreground="${inkColor(ink)}" letter_spacing="500">${esc(label)}</span>`,font:`Manrope ${bold?'Bold':'SemiBold'} 48`,fontfile,rgba:true,dpi:72}}).png().toBuffer();
 return recolor(await sharp(b).resize({height:h}).png().toBuffer(),ink);
}
async function logo(id,ink='white',height=INK_HEIGHT){
 const file=direct[id];
 let b=await fs.readFile(file?newPath(file):oldPath(id));
 if(file?.endsWith('.svg'))b=await sharp(b,{density:160}).png().toBuffer();
 // FLAC's official web image has a black canvas and a secondary slogan.
 if(id==='a-flac')b=await sharp(b).extract({left:0,top:0,width:262,height:106}).png().toBuffer();
 // Flat vector HDR10+ artwork avoids the old header PNG's baked-in shadow.
 b=await recolor(b,ink,{removeBlack:id==='a-flac'||id==='s-pcok',removeWhite:id==='a-dtsx'});
 return sharp(b).trim({background:'#00000000'}).resize({height,width:270,fit:'inside'}).png().toBuffer();
}
async function join(parts,padding=PAD,gap=GAP){
 const metas=await Promise.all(parts.map(b=>sharp(b).metadata()));
 const width=metas.reduce((s,m)=>s+m.width,0)+gap*(parts.length-1)+padding*2;
 let x=padding;
 const layers=parts.map((input,i)=>{const layer={input,left:x,top:Math.floor((HEIGHT-metas[i].height)/2)};x+=metas[i].width+gap;return layer;});
 return containedComposite({create:{width,height:HEIGHT,channels:4,background:'#00000000'}},layers,'badge row');
}
async function icon(name,ink='white',height=44){return sharp(Buffer.from(glyphSvg(name,ink))).resize({height}).png().toBuffer();}
async function separator(ink){
 return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="4" height="56"><path d="M2 6v44" stroke="${inkColor(ink)}" stroke-width="2" opacity=".7"/></svg>`)).png().toBuffer();
}
async function bluraySymbol(ink){
 const originalSvg=await fs.readFile(newPath('bluray.svg'),'utf8');
 // Final two paths are the official disc/B emblem; earlier paths are lettering.
 const paths=[...originalSvg.matchAll(/<path\b[^>]*\/>/g)].map(m=>m[0]).slice(-2).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="69 106 274 120" width="274" height="120">${paths}</svg>`;
 await fs.writeFile(path.join(ROOT,'assets/glyphs/bluray-symbol.svg'),svg);
 return recolor(await sharp(Buffer.from(svg)).resize({height:30}).png().toBuffer(),ink);
}
async function stackedSource(glyph,label,ink,override,number){
 const caption=await text(label.toUpperCase(),ink,27,true),m=await sharp(caption).metadata();
 const emblem=override??await icon(glyph,ink,30),em=await sharp(emblem).metadata();
 const tierLabel=number?await text('T'+number,ink,32,true):null;
 const tm=tierLabel?await sharp(tierLabel).metadata():null;
 const topWidth=em.width+(tm?14+tm.width:0),width=Math.max(96,m.width,topWidth);
 const left=Math.floor((width-topWidth)/2),layers=[{input:emblem,left,top:1}];
 if(tierLabel&&tm){
  const line=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="3" height="28"><path d="M1.5 1v26" stroke="${inkColor(ink)}" stroke-width="1.75" opacity=".7"/></svg>`);
  layers.push({input:line,left:left+em.width+5,top:2},{input:tierLabel,left:left+em.width+14,top:0});
 }
 layers.push({input:caption,left:Math.floor((width-m.width)/2),top:33});
 return containedComposite({create:{width,height:60,channels:4,background:'#00000000'}},layers,'stacked source');
}
async function channelMark(label,ink){
 // A compact, filled silhouette remains visible at 16px artwork height.
 // Use the client's minimum width for full-height ink rather than a tiny stack.
 const speaker=await sharp(Buffer.from(glyphSvg('speaker',ink)),{density:160}).trim({background:'#00000000'}).resize({height:44}).png().toBuffer();
 return join([speaker,await text(label,ink,42,true)],4,7);
}
async function twoLineSource(glyph,upper,lower,ink){
 const disc=await icon(glyph,ink,27),dvd=await text(upper,ink,28,true);
 const dm=await sharp(disc).metadata(),tm=await sharp(dvd).metadata();
 const top=await containedComposite({create:{width:dm.width+7+tm.width,height:30,channels:4,background:'#00000000'}},[
  {input:disc,left:0,top:1},{input:dvd,left:dm.width+7,top:0},
 ],'source heading');
 return stackedSource(null,lower,ink,top);
}
const RESOLUTION_CAPTIONS={'r-4k':['4K','UHD'],'r-1440':['1440p','QHD'],'r-1080':['1080p','FHD'],'r-720':['720p','HD'],'r-576':['576p','SD'],'r-480':['480p','SD'],'r-360':['360p','SD'],'r-240':['240p','SD'],'r-144':['144p','SD']};
async function resolutionMark(id,ink,skin,f){
 const [number,quality]=RESOLUTION_CAPTIONS[id];
 const filled=skin==='mono'||skin==='solid';
 const reverseInk=skin==='mono'?'white':f.tagColor;
 const top=await text(number,filled?reverseInk:ink,id==='r-4k'?32:26,true),bottom=await text(quality,ink,20,true);
 const tm=await sharp(top).metadata(),bm=await sharp(bottom).metadata(),width=Math.max(84,tm.width+14,bm.width+12);
 // The screen is part of the resolution symbol. Nuvio owns the outer chip.
 // Clear skins use a hollow display; filled skins use a reversed display face.
 const screen=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="62"><rect x="2" y="2" width="${width-4}" height="36" rx="1.5" fill="${filled?inkColor(ink):'none'}" stroke="${inkColor(ink)}" stroke-width="2.5"/></svg>`);
 return containedComposite(screen,[{input:top,left:Math.floor((width-tm.width)/2),top:Math.floor((40-tm.height)/2)},{input:bottom,left:Math.floor((width-bm.width)/2),top:40}],'resolution '+id);
}
async function subtitleMark(code,ink){
 const svg=await subtitleDocumentSvg(code,inkColor(ink));
 await fs.mkdir(path.join(ROOT,'assets/subtitle-flags'),{recursive:true});
 await fs.writeFile(path.join(ROOT,'assets/subtitle-flags',code+'-background.svg'),svg);
 // Keep the whole flag document beside the text rather than hiding the overlap
 // beneath an opaque panel. The language/SUB area is transparent on every skin.
 const page=await sharp(Buffer.from(svg)).resize({width:62,height:46,fit:'inside'}).png().toBuffer();
 const top=await text(code,ink,30,true),bottom=await text('SUB',ink,21,true);
 const tm=await sharp(top).metadata(),bm=await sharp(bottom).metadata();
 const lane=Math.max(50,tm.width,bm.width)+8,width=68+lane;
 const panel=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="60"><path d="M65 8v44" stroke="${inkColor(ink)}" stroke-width="1.5" opacity=".55"/></svg>`);
 return containedComposite(panel,[{input:page,left:0,top:7},{input:top,left:68+Math.floor((lane-tm.width)/2),top:3},{input:bottom,left:68+Math.floor((lane-bm.width)/2),top:37}],'subtitle '+code);
}
const combinations={
 'v-dv-hdr10p':['a-dv','HDR10+'], 'v-dv-hdr10':['a-dv','HDR10'], 'v-dv-hdr':['a-dv','HDR'],
 'a-at-th':['a-at','TrueHD'], 'a-at-dp':['a-at','DD+'],
 'a-dtsx-ma':['a-dtsx','MA'], 'a-dtsx-hd':['a-dtsx','HD'],
 'a-dtshd':['a-dts','HD'], 'a-dtses':['a-dts','ES'],
};
const manifest={version:7,clippingGuard:'scripts/badge-layout.mjs',channelConcept:'badges/design/channels-concept.png',channelPrompt:'badges/design/channels-prompt.txt',concept:'badges/design/glyph-concept.png',spokenFlagConcept:'badges/design/spoken-flags-concept.png',compactConcept:'badges/design/compact-sources-subtitles-concept.png',spokenFlagSources:'assets/flag-sources/manifest.json',flagColorsPreserved:true,outlineInk:'matches borderColor',transparentInk:'white',customGlyphSource:'scripts/kanso-glyphs.mjs',font:{family:'Manrope',weight:600,captionWeight:700,file:'assets/fonts/Manrope.ttf',license:'assets/fonts/OFL-Manrope.txt'},defaultSkin:'outline',geometry:{height:HEIGHT,inkHeight:INK_HEIGHT,padding:PAD,gap:GAP,stroke:2.15},languageFamilies:LANGUAGE_FAMILIES,filters:{}};
await fs.mkdir(path.join(ROOT,'assets/glyphs'),{recursive:true});
for(const name of Object.keys(GLYPHS))await fs.writeFile(path.join(ROOT,'assets/glyphs',name+'.svg'),glyphSvg(name));
for(const f of pack.filters){
 const id=f.id;
 const pairedLogos=id==='v-dv-hdr10p'||id==='v-dv-hdr10';
 const row={label:f.name,kind:'text',sources:[],skins:{}};
 for(const skin of ['outline','transparent','solid','mono']){
  const ink=skin==='outline'?applyOutlineTheme({...f}).textColor:skin==='mono'||(skin==='solid'&&applySolidTheme({...f}).textColor==='#000000')?'black':'white';
  let parts;
  if(id.startsWith('l-')||id.startsWith('sub-')){
   const info=languageDisplayInfo(id,f.name),glyph=id.startsWith('sub-')?'subtitle':'speech';
   if(id.startsWith('l-')){
    const svg=await spokenFlagSvg(info.code);
    await fs.mkdir(path.join(ROOT,'assets/spoken-flags'),{recursive:true});
    await fs.writeFile(path.join(ROOT,'assets/spoken-flags',info.code+'.svg'),svg);
    parts=[await sharp(Buffer.from(svg)).resize({height:52}).png().toBuffer(),await text(info.code,ink)];
    row.kind='speech-flag';row.flagCountry=SPOKEN_FLAGS[info.code];row.glyph=null;
   }else{parts=[await subtitleMark(info.code,ink)];row.kind='subtitle-flag';row.glyph=null;row.flagCountry=SPOKEN_FLAGS[info.code];row.layout='flag document beside stacked language / SUB';}
   row.code=info.code;row.meaning=info.name;row.sources=[];
  }else if(combinations[id]){
   const [base,suffix]=combinations[id];parts=[await logo(base,ink,56),await text(suffix,ink,24,true)];
   row.kind='logo-label';row.sources=direct[base]?[sources[direct[base]].url]:[inherited[base],original.themes.outline.filters[base].imageURL];
   if(id==='v-dv-hdr10p'){parts=[await logo('a-dv',ink,52),await logo('v-hdr10p',ink,38)];row.sources.push(sources['hdr10plus.svg'].url);}
   if(id==='v-dv-hdr10'){parts=[await logo('a-dv',ink,52),await logo('v-hdr10',ink,48)];row.sources.push(sources['hdr10.svg'].url);}
   parts.splice(1,0,await separator(ink));row.layout='compound with vertical separator';
   const primary=await sharp(parts[0]).metadata(),secondary=await sharp(parts[2]).metadata();
   const secondaryWidth=352-PAD*2-(pairedLogos?12:14)-4-primary.width;
   if(secondary.width>secondaryWidth)parts[2]=await sharp(parts[2]).resize({width:secondaryWidth,height:secondary.height,fit:'inside'}).png().toBuffer();
   row.primaryHeight=primary.height;row.secondaryHeight=(await sharp(parts[2]).metadata()).height;
   row.secondaryKind=pairedLogos?'logo':'text';
  }else if(id==='criterion-collection'){
   const mark=await sharp(await logo(id,ink)).resize({height:30}).png().toBuffer();
   parts=[await stackedSource(null,'CRITERION',ink,mark)];row.kind='logo-label';row.sources=[sources['criterion.svg'].url];row.layout='icon above caption';
  }else if(id==='q-b'){
   parts=[await stackedSource(null,'BLU-RAY',ink,await bluraySymbol(ink))];
   row.kind='logo-label';row.sources=[sources['bluray.svg'].url];row.layout='icon above caption';
  }else if(id==='q-dvd-remux'){
   parts=[await twoLineSource('disc','DVD','REMUX',ink)];row.kind='custom-glyph';row.glyph='disc';row.layout='DVD above REMUX';
  }else if(id==='q-hc'){
   parts=[await twoLineSource('hard-sub','HC','HDRIP',ink)];row.kind='custom-glyph';row.glyph='hard-sub';row.layout='HC above HDRIP';
  }else if(id==='caption-forced'){
   parts=[await stackedSource('forced-caption','FORCED',ink)];row.kind='custom-glyph';row.glyph='forced-caption';row.layout='icon above caption';
  }else if(f.groupId==='gc'){
   parts=[await channelMark(f.name,ink)];row.kind='custom-glyph';row.glyph='speaker';row.layout='full-height speaker beside channel number';
  }else if(RESOLUTION_CAPTIONS[id]){
   parts=[await resolutionMark(id,ink,skin,skin==='solid'?applySolidTheme({...f}):f)];row.kind='text';row.layout='framed display above quality';row.quality=RESOLUTION_CAPTIONS[id][1];
  }else if(direct[id]||inherited[id]){
   parts=[await logo(id,ink)];row.kind='logo';row.sources=direct[id]?[sources[direct[id]].url]:[inherited[id],original.themes.outline.filters[id].imageURL];
  }else if(f.groupId==='gms'){
   const number=id.match(/\d+/)[0],web=id.startsWith('web-'),bluray=id.startsWith('blu-ray-');
   const glyph=glyphForBadge(id,f.groupId);
   const sourceLabel=web?(id.endsWith('-webrip')?'WEBRip':'WEB-DL'):'REMUX';
   parts=bluray?[await stackedSource(null,'BLU-RAY',ink,await bluraySymbol(ink),number)]:[await stackedSource(glyph,sourceLabel,ink,null,number)];
   row.kind=bluray?'logo-tier':'custom-glyph';row.glyph=bluray?null:glyph;row.tier=Number(number);row.sources=bluray?[sources['bluray.svg'].url]:[];
   row.layout='icon and plain tier above source caption';
  }else{
   const label=LABELS[id]??f.name;
   const glyph=glyphForBadge(id,f.groupId);
   parts=f.groupId==='grl'&&glyph?[await stackedSource(glyph,label,ink)]:glyph?[await icon(glyph,ink),await text(label,ink,f.groupId==='gst'?40:INK_HEIGHT)]:[await text(label,ink)];
   row.kind=glyph?'custom-glyph':'text';row.glyph=glyph;
   if(f.groupId==='grl')row.layout='icon above caption';
  }
  let b=f.groupId==='gc'?parts[0]:await join(parts,['gms','grl','gr'].includes(f.groupId)?6:PAD,combinations[id]?(pairedLogos?6:7):GAP);
  // Coil fits within 92/16: keep a 5.5:1 maximum aspect ratio at native chip size.
  const m=await sharp(b).metadata();
  if(combinations[id]&&m.width>352)throw new Error(`${id}: compound must fit without shrinking its primary logo`);
  if(m.width>352)b=await sharp(b).resize({width:336,height:HEIGHT,fit:'inside'}).extend({top:Math.floor((HEIGHT-Math.round(HEIGHT*336/m.width))/2),bottom:Math.ceil((HEIGHT-Math.round(HEIGHT*336/m.width))/2),left:8,right:8,background:'#00000000'}).png().toBuffer();
  // Seal the final ink after resampling: Lanczos can overshoot RGB at opaque
  // edges, so the actual Outline glyph pixels must be recolored last.
  if(skin==='outline'&&!['speech-flag','subtitle-flag'].includes(row.kind))b=await recolor(b,ink);
  const hash=hashIconBuffer(b),file=iconFileName(hash);
  await fs.writeFile(path.join(BADGE_IMAGE_FILES_DIR,file),b);
  const ref={imageURL:cdnUrlForHash(hash),file,ink};row.skins[skin]=ref;
  const key=id.replace(/-webrip$/,'');
  // WEBRip gets its own text artwork; buildPresetBadges resolves exact ids first.
  appearance.themes[skin].filters[id]={...(appearance.themes[skin].filters[id]??appearance.themes[skin].filters[key]),name:f.name,imageURL:ref.imageURL};
 }
 manifest.filters[id]=row;
}
appearance.source='Kanso Manrope typography, original brand marks and category outline system. See badges/design/manifest.json for per-badge provenance.';
await fs.writeFile(appearancePath,JSON.stringify(appearance,null,2)+'\n');
await fs.writeFile(path.join(designDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.mkdir(path.join(ROOT,'sync-ui/fonts'),{recursive:true});
await fs.copyFile(fontfile,path.join(ROOT,'sync-ui/fonts/Manrope.ttf'));
await fs.copyFile(path.join(ROOT,'assets/fonts/OFL-Manrope.txt'),path.join(ROOT,'sync-ui/fonts/OFL-Manrope.txt'));
const result=spawnSync(process.execPath,['scripts/build-presets.mjs'],{cwd:ROOT,stdio:'inherit'});
if(result.status!==0)throw new Error('Preset build failed');
console.log(`Designed ${pack.filters.length} badges across four skins. Manrope Semibold; Outline default.`);
