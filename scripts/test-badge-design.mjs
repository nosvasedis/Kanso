import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
import {contrast} from './badge-outline-theme.mjs';
import {MARKER_ATOMS,TIER_MARKERS,LANGUAGE_MARKERS,SUBTITLE_MARKERS,MARKER_REGISTRY_VALIDATION} from './formatter-markers.mjs';
const design=JSON.parse(await fs.readFile(path.join(ROOT,'badges/design/manifest.json'),'utf8'));
assert.equal(design.font.family,'Manrope');
assert.equal(design.defaultSkin,'outline');
const checked=new Set();
assert.deepEqual(MARKER_REGISTRY_VALIDATION,{ok:true,errors:[]},'Complete marker registry stays valid after the new channel facts');
const baseline=JSON.parse(await fs.readFile(path.join(ROOT,'badges/design/marker-baseline.json'),'utf8'));
for(const [name,current] of Object.entries({MARKER_ATOMS,TIER_MARKERS,LANGUAGE_MARKERS,SUBTITLE_MARKERS}))for(const [key,value] of Object.entries(baseline[name]))assert.equal(current[key],value,`${name}/${key}: preexisting markers must not move`);
for(const skin of ['outline','transparent','solid','mono'])for(const suffix of ['','-detailed']){
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${skin}${suffix}.json`),'utf8'));
 for(const f of pack.filters){
  const row=design.filters[f.id];assert.ok(row,`Missing design ${f.id}`);
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
assert.equal(design.filters['l-el'].kind,'speech-flag','Spoken languages need a speech-shaped flag');
assert.equal(design.filters['sub-el'].kind,'subtitle-flag','Subtitles need a flag-backed text document');
assert.equal(design.filters['sub-el'].layout,'flag document behind stacked language / SUB');
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
for(const id of ['web-1','remux-1','blu-ray-1'])assert.equal(design.filters[id].layout,'stacked source with large plain tier');
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
