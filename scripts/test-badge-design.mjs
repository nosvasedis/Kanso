import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {containedComposite} from './badge-layout.mjs';
import {ROOT,BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
import {contrast} from './badge-outline-theme.mjs';
import {MARKER_ATOMS,TIER_MARKERS,LANGUAGE_MARKERS,SUBTITLE_MARKERS,MARKER_REGISTRY_VALIDATION} from './formatter-markers.mjs';
const design=JSON.parse(await fs.readFile(path.join(ROOT,'badges/design/manifest.json'),'utf8'));
assert.equal(design.font.family,'Manrope');
assert.equal(design.defaultSkin,'outline');
const checked=new Set();
const preceding=JSON.parse(await fs.readFile(path.join(ROOT,'badges/design/layout-before-2.4.1.json'),'utf8'));
for(const [id,row] of Object.entries(design.filters))for(const skin of ['outline','transparent','solid','mono']){
 if(id==='v-dv-hdr10'||id==='v-dv-hdr10p')assert.notEqual(row.skins[skin].file,preceding.filters[id].skins[skin].file,`${id}: revised logo balance`);
 else if(preceding.filters[id])assert.equal(row.skins[skin].file,preceding.filters[id].skins[skin].file,`${id}: existing artwork is preserved`);
}
const empty=await sharp({create:{width:118,height:60,channels:4,background:'#00000000'}}).png().toBuffer();
const caption=await sharp({create:{width:50,height:20,channels:4,background:'#FFFFFF'}}).png().toBuffer();
await assert.rejects(()=>containedComposite(empty,[{input:caption,left:0,top:43}],'resolution caption'),/exceeds/,'Reject the former resolution overflow instead of silently cropping');
await assert.rejects(()=>containedComposite(empty,[{input:caption,left:70,top:3}],'subtitle lettering'),/exceeds/,'Reject lettering outside the subtitle canvas');
assert.deepEqual(MARKER_REGISTRY_VALIDATION,{ok:true,errors:[]},'Complete marker registry stays valid after the new channel facts');
const baseline=JSON.parse(await fs.readFile(path.join(ROOT,'badges/design/marker-baseline.json'),'utf8'));
for(const [name,current] of Object.entries({MARKER_ATOMS,TIER_MARKERS,LANGUAGE_MARKERS,SUBTITLE_MARKERS}))for(const [key,value] of Object.entries(baseline[name]))assert.equal(current[key],value,`${name}/${key}: preexisting markers must not move`);
for(const skin of ['outline','transparent','solid','mono'])for(const suffix of ['','-detailed']){
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${skin}${suffix}.json`),'utf8'));
 for(const f of pack.filters){
  const row=design.filters[f.id];assert.ok(row,`Missing design ${f.id}`);
  if(f.groupId==='gst')assert.ok(!f.name.includes('.'),`${f.id}: special-edition captions have no periods`);
  if(skin==='solid')assert.ok(contrast(f.textColor,f.tagColor)>=4.5,`${f.id}: Solid lettering is readable on its actual fill`);
  assert.equal(row.skins[skin].imageURL,f.imageURL,`${skin}/${f.id} uses the new design`);
  if(row.kind.includes('logo'))assert.ok(row.sources.length&&row.sources.every(s=>s.startsWith('https://')),`${f.id} requires provenance`);
  if(row.kind==='text')assert.equal(row.sources.length,0,`${f.id} must have no invented logo`);
  const ref=row.skins[skin];if(checked.has(ref.file))continue;
  const b=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,ref.file));
  assert.equal(iconFileName(hashIconBuffer(b)),ref.file);
  const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.height,64,`${f.id}: uniform canvas height`);
  assert.ok(info.width<=352,`${f.id}: fits the Nuvio image aspect ratio`);
  let visible=0;
  if(skin==='outline'){
   assert.equal(f.textColor,'#'+f.borderColor.slice(-6),`${f.id}: outline lettering matches its border`);
   assert.equal(ref.ink,f.textColor);
   assert.ok(contrast(f.textColor)>=5,`${f.id}: outline color is legible on the reference surface`);
   if(!['speech-flag','subtitle-flag'].includes(row.kind)){
    const target=f.textColor.slice(1).match(/../g).map(h=>parseInt(h,16));
    for(let i=0;i<data.length;i+=4)if(data[i+3]>230)for(let c=0;c<3;c++)assert.ok(Math.abs(data[i+c]-target[c])<=3,`${f.id}: actual glyph pixels match its border`);
   }
  }
  for(let i=0;i<data.length;i+=4)if(data[i+3]>16)visible++;
  assert.ok(visible>100,`${f.id}: image is not empty`);
  for(let x=0;x<info.width;x++){
   assert.equal(data[x*4+3],0,`${f.id}: clear top edge, no baked-in frame`);
   assert.equal(data[((info.height-1)*info.width+x)*4+3],0,`${f.id}: clear bottom edge`);
  }
  checked.add(ref.file);
 }
}
assert.notEqual(design.filters['web-1'].skins.outline.file,design.filters['web-1-webrip'].skins.outline.file,'WEBRip and WEB-DL artwork must differ');
for(const row of Object.values(design.filters))if(row.glyph)assert.ok(await fs.stat(path.join(ROOT,'assets/glyphs',row.glyph+'.svg')));
assert.equal(design.filters['ch-51'].glyph,'speaker','Channels need a speaker');
const previous=JSON.parse(await fs.readFile(path.join(ROOT,'badges/design/layout-before-2.3.3.json'),'utf8'));
for(const id of ['q-dvd-remux','r-4k','r-1440','r-1080','r-720'])for(const skin of ['outline','transparent','solid','mono']){
 const current=await sharp(path.join(BADGE_IMAGE_FILES_DIR,design.filters[id].skins[skin].file)).metadata();
 const old=previous.filters[id].skins[skin];
 assert.ok(current.width<old.width,`${skin}/${id}: narrower artwork than 2.3.2`);
}
assert.equal(design.filters['q-dvd-remux'].layout,'DVD above REMUX');
assert.equal(design.filters['q-hc'].layout,'HC above HDRIP');
assert.equal(design.filters['caption-forced'].layout,'icon above caption');
for(const [id,row] of Object.entries(design.filters)){
 if(id.includes('edition')||['remastered-release','regraded-release'].includes(id))assert.ok(!row.label.includes('.'),`${id}: edition labels have no abbreviation periods`);
}
const latestPrevious=JSON.parse(await fs.readFile(path.join(ROOT,'badges/design/layout-before-2.3.4.json'),'utf8'));
for(const [id,row] of Object.entries(design.filters))if(id==='q-hc'||id==='caption-forced')for(const skin of ['outline','transparent','solid','mono']){
 const m=await sharp(path.join(BADGE_IMAGE_FILES_DIR,row.skins[skin].file)).metadata();
 assert.ok(m.width<latestPrevious.filters[id].skins[skin].width,`${id}: tighter than 2.3.3 without squeezing the lettering`);
}
for(const [id,row] of Object.entries(design.filters))for(const skin of ['outline','transparent','solid','mono']){
 if(id.startsWith('ch-')){
  assert.equal(row.layout,'full-height speaker beside channel number');
  const input=path.join(BADGE_IMAGE_FILES_DIR,row.skins[skin].file);
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.ok(info.width<=152,`${id}: uses a compact image slot without tiny lettering`);
  const ys=[];for(let y=0;y<64;y++)for(let x=4;x<52;x++)if(data[(y*info.width+x)*4+3]>200)ys.push(y);
  assert.ok(Math.max(...ys)-Math.min(...ys)>=36,`${id}: speaker silhouette is large enough for native-size viewing`);
 }
 if(row.layout==='compound with vertical separator'){
  if(id==='v-dv-hdr10'||id==='v-dv-hdr10p'){
   assert.equal(row.secondaryKind,'logo');assert.equal(row.primaryHeight,52);
   assert.equal(row.secondaryHeight,id==='v-dv-hdr10'?48:38,`${id}: the HDR mark shares visual weight with Vision`);
  }else{assert.equal(row.primaryHeight,56);assert.ok(row.secondaryHeight>=18&&row.secondaryHeight<=24);}
 }
}
// Compare the complete caption alpha against independently rendered font ink.
// Canvas-edge checks alone cannot catch a glyph cropped inside an inner panel.
async function completeCaption(id,skin,label,height,position){
 const expected=await sharp({text:{text:`<span foreground="#FFFFFF" letter_spacing="500">${label}</span>`,font:'Manrope Bold 48',fontfile:path.join(ROOT,'assets/fonts/Manrope.ttf'),rgba:true,dpi:72}}).resize({height}).ensureAlpha().png().toBuffer();
 const em=await sharp(expected).metadata();
 const input=path.join(BADGE_IMAGE_FILES_DIR,design.filters[id].skins[skin].file),im=await sharp(input).metadata();
 const {left,top}=position(im,em);
 const expectedAlpha=await sharp(expected).extractChannel('alpha').raw().toBuffer();
 const actualAlpha=await sharp(input).extract({left,top,width:em.width,height:em.height}).extractChannel('alpha').raw().toBuffer();
 assert.deepEqual(actualAlpha,expectedAlpha,`${skin}/${id}: every pixel of ${label} survives compositing`);
}
for(const [id,row] of Object.entries(design.filters))for(const skin of ['outline','transparent','solid','mono']){
 if(row.quality)await completeCaption(id,skin,row.quality,20,(im,em)=>({left:6+Math.floor((im.width-12-em.width)/2),top:41}));
 if(row.kind==='subtitle-flag'){
  for(const [label,h,y] of [[row.code,30,5],['SUB',21,39]])await completeCaption(id,skin,label,h,(im,em)=>({left:76+Math.floor((im.width-84-em.width)/2),top:y}));
 }
}
assert.equal(design.filters['r-1440'].quality,'QHD','Keep 1440p accurate rather than relabeling it 2K');
assert.equal(design.filters['l-el'].kind,'speech-flag','Spoken languages need a speech-shaped flag');
assert.equal(design.filters['sub-el'].kind,'subtitle-flag','Subtitles need a flag-backed text document');
assert.equal(design.filters['sub-el'].layout,'flag document beside stacked language / SUB');
assert.equal(design.filters['sub-el'].code,'EL');
for(const row of Object.values(design.filters).filter(r=>r.code))assert.match(row.code,/^[A-Z]{2}$/,'Every language code is two letters');
for(const id of ['l-hi','l-ta','l-bn','l-te','l-ml','l-kn','l-mr','l-gu','l-pa','l-lat','l-pt-br','l-pt-pt'])for(const key of [id,id.replace(/^l-/,'sub-')])assert.ok(!design.filters[key],`${key}: redundant display badge removed`);
assert.equal(design.filters['l-in'].meaning,'Indian languages');
assert.equal(design.filters['sub-in'].meaning,'Indian languages');
for(const id of ['q-w','q-wr','q-r'])assert.equal(design.filters[id].kind,'custom-glyph',`${id}: new source glyph`);
for(const id of ['web-1','remux-1','blu-ray-1'])assert.equal(design.filters[id].tier,1,`${id}: tier emblem`);
for(const id of ['q-w','q-wr','q-r']){
 assert.equal(design.filters[id].layout,'icon above caption');
 const meta=await sharp(path.join(BADGE_IMAGE_FILES_DIR,design.filters[id].skins.outline.file)).metadata();
 assert.ok(meta.width<=176,`${id}: compact source stays within 44px of artwork at native size`);
}
for(const id of ['web-1','remux-1','blu-ray-1'])assert.equal(design.filters[id].layout,'icon and plain tier above source caption');
// The open gap between the language and SUB must expose any app background,
// rather than an opaque panel that happens to match the gallery surface.
for(const [id,row] of Object.entries(design.filters).filter(([,r])=>r.kind==='subtitle-flag'))for(const skin of ['outline','transparent','solid','mono']){
 const {data,info}=await sharp(path.join(BADGE_IMAGE_FILES_DIR,row.skins[skin].file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let x=80;x<126;x++)assert.equal(data[(37*info.width+x)*4+3],0,`${skin}/${id}: subtitle lettering has no opaque backing`);
}
assert.notEqual(design.filters['hybrid-release'].skins.outline.ink,design.filters['edition-directors-cut'].skins.outline.ink,'Specials keep individual hues');
for(const [id,row] of Object.entries(design.filters)){
 assert.notEqual(row.skins.outline.file,row.skins.transparent.file,`${id}: Outline and Transparent must differ`);
 if(row.kind==='speech-flag'){
  const b=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,row.skins.outline.file));
  const {data,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const tint=row.skins.outline.ink.slice(1).match(/../g).map(h=>parseInt(h,16));
  assert.ok([...Array(data.length/4).keys()].some(i=>i%info.width<77&&data[i*4+3]>230&&Math.max(...data.slice(i*4,i*4+3))-Math.min(...data.slice(i*4,i*4+3))>40&&tint.some((v,c)=>Math.abs(v-data[i*4+c])>40)),`${id}: retains flag colors rather than the Outline ink`);
 }
}
console.log(`PASS: ${Object.keys(design.filters).length} badge designs, ${checked.size} PNGs, transparent geometry, provenance, and all export references.`);
