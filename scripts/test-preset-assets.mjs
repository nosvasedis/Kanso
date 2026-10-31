import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {RETIRED_BADGE_IDS} from './retired-badges.mjs';
import {buildPresetBadges,DISPLAY_FILTER_ORDER,DISPLAY_GROUP_ORDER,ILLUSTRATED_APPEARANCE,PRESET_SKINS,SPECIAL_DISPLAY_IDS,PRESENTATION_SPECIAL_IDS} from './preset-badges.mjs';
import {LANGUAGE_BADGE_IDS} from './language-catalog.mjs';
import {applyTransparentTheme,MONO_FILTER_ORDER,TRANSPARENT_FILL} from './badge-transparent-theme.mjs';
import {applySolidTheme} from './badge-solid-theme.mjs';
import {applyOutlineTheme} from './badge-outline-theme.mjs';
import {borderArgb,chromeRgb6} from './badge-chrome-map.mjs';
import sharp from 'sharp';
import {BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
const LOCAL_EXTRA_IDS=new Set(['v-3d','a-mp3','a-pcm']);
async function opaqueAvgLum(buffer){
 const {data}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let n=0,s=0;
 for(let i=0;i<data.length;i+=4){
  if(data[i+3]<32)continue;
  n++;
  s+=0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
 }
 return n?s/n:0;
}
assert.deepEqual([...MONO_FILTER_ORDER.gst].sort(),SPECIAL_DISPLAY_IDS.filter(id=>!PRESENTATION_SPECIAL_IDS.includes(id)).sort(),'Every library special is in the leading specials block');
function expectChrome(pack,skin,id,groupId){
 const f=pack.filters.find(x=>x.id===id);
 assert.ok(f,`${skin} missing ${id}`);
 const rgb=chromeRgb6(id,groupId);
 if(skin==='solid'){
   const t=applySolidTheme({id,groupId});
   assert.equal(f.tagColor,t.tagColor,`${skin}/${id} fill`);
   assert.equal(f.borderColor,t.borderColor,`${skin}/${id} border`);
   assert.equal(f.textColor,t.textColor,`${skin}/${id} ink`);
   assert.equal(f.tagStyle,'filled');
 }else if(skin==='transparent'||skin==='outline'){
   const t=skin==='outline'?applyOutlineTheme({id,groupId}):applyTransparentTheme({id,groupId});
   assert.equal(f.tagColor,TRANSPARENT_FILL,`${skin}/${id} transparent fill`);
   assert.equal(f.borderColor,t.borderColor,`${skin}/${id} border`);
   assert.equal(f.textColor,t.textColor,`${skin}/${id} ink`);
   assert.equal(f.tagStyle,t.tagStyle);
 }else{
   assert.equal(f.tagColor.toUpperCase(),'#FFFFFF',`${skin}/${id} mono fill`);
   assert.ok(['#FFFFFF','#FFFFFFFF'].includes(f.borderColor.toUpperCase()),`${skin}/${id} mono border ${f.borderColor}`);
   assert.equal(f.textColor,'#000000',`${skin}/${id} mono ink`);
 }
}
const checked=new Set();
for(const preset of ['detailed'])for(const skin of PRESET_SKINS){
 const suffix='-detailed';
 const pack=JSON.parse(await fs.readFile(`kanso-${skin}${suffix}.json`,'utf8'));const expected=buildPresetBadges(skin,preset);
 assert.ok(pack.filters.every(f=>f.isEnabled&&!RETIRED_BADGE_IDS.has(f.id)),'Retired filters are removed from the product');
 assert.ok(pack.groups.every(g=>pack.filters.some(f=>f.groupId===g.id)),'No empty groups');
 assert.deepEqual(pack.groups.map(g=>g.id),DISPLAY_GROUP_ORDER.filter(id=>pack.filters.some(f=>f.groupId===id)),`${skin}/${preset} group order`);
 assert.ok(!pack.groups.some(g=>g.id==='gprovenance'),`${skin}/${preset} has no trailing provenance group`);
 const specials=new Set([...MONO_FILTER_ORDER.gst,...SPECIAL_DISPLAY_IDS]);
 for(const id of specials){
   const f=pack.filters.find(x=>x.id===id);
   assert.ok(f,`${skin}/${preset} missing special ${id}`);
   assert.equal(f.groupId,'gst',`${id} must sit with specials, not at the end`);
 }
 const packSpecials=pack.filters.filter(f=>f.groupId==='gst').map(f=>f.id);
 assert.deepEqual(packSpecials,DISPLAY_FILTER_ORDER.gst.filter(id=>pack.filters.some(f=>f.id===id)),`${skin}/${preset} specials order`);
 const lastSpecial=Math.max(...pack.filters.map((f,i)=>specials.has(f.id)?i:-1));
 const firstOther=pack.filters.findIndex(f=>!specials.has(f.id));
 assert.ok(firstOther===-1||lastSpecial<firstOther,`${skin}/${preset} specials must precede every other chip`);
 const at=id=>pack.filters.findIndex(f=>f.id===id);
 assert.ok(at('hybrid-release')>at('v-3d')&&at('hybrid-release')<at('edition-extended'),`${skin}/${preset} HYBRID belongs with early specials`);
 const firstPresent=(...ids)=>ids.map(at).find(i=>i>=0);
 const special=firstPresent('seadex-release','v-imax','hybrid-release','edition-extended','edition-bw');
 const streaming=firstPresent('s-nflx','s-amzn');
 const tier=firstPresent('web-1','blu-ray-1','remux-1');
 const picture=firstPresent('v-dv-hdr10p','v-hdr10','a-dv','v-sdr');
 const audio=firstPresent('a-at-th','a-aac','a-dp');
 const channels=firstPresent('ch-71','ch-51','ch-20');
 const language=firstPresent('l-en','l-el');
 const story=[special,streaming,tier,picture,audio,channels,language].filter(i=>i!==undefined);
 for(let i=1;i<story.length;i++)assert.ok(story[i-1]<story[i],`${skin}/${preset} chip story ${story}`);
 assert.ok(!pack.filters.some(f=>f.groupId==='ge'||f.id.startsWith('ge-')),`${skin}/${preset} encoder chips are deleted`);
 if(preset==='compact'){
   expectChrome(pack,skin,'a-at-th','ga');
   expectChrome(pack,skin,'ch-51','gc');
   expectChrome(pack,skin,'l-en','gl');
   expectChrome(pack,skin,'r-4k','gr');
   expectChrome(pack,skin,'r-144','gr');
   expectChrome(pack,skin,'q-w','grl');
   expectChrome(pack,skin,'v-hdr10','gv');
   expectChrome(pack,skin,'hybrid-release','gst');
 }
 if(preset==='detailed'){
   expectChrome(pack,skin,'s-nflx','gs');
   expectChrome(pack,skin,'web-1','gms');
   expectChrome(pack,skin,'sub-en','gsub');
   assert.ok(at('hybrid-release')<at('s-nflx')&&at('s-nflx')<at('web-1')&&at('web-1')<at('v-dv-hdr10p')&&at('v-dv-hdr10p')<at('a-at-th')&&at('a-at-th')<at('ch-71')&&at('ch-71')<at('l-en'));
   assert.ok(at('web-1')<at('web-1-webrip')&&at('web-1-webrip')<at('web-2'));
 }
 assert.equal(pack.filters.length,expected.filters.length);
 assert.equal(new Set(pack.filters.map(f=>f.id)).size,pack.filters.length);
 for(let i=0;i<pack.filters.length;i++){
   const f=pack.filters[i],ref=expected.filters[i];
   for(const key of ['id','pattern','isEnabled','tagColor','textColor','borderColor'])assert.equal(f[key],ref[key]);
   const original=ILLUSTRATED_APPEARANCE[skin].filters[f.id]??ILLUSTRATED_APPEARANCE[skin].filters[f.id.replace(/-webrip$/,'')];
   assert.equal(f.imageURL,original.imageURL,`Artwork missing for ${skin}/${f.id}`);
   const file=path.basename(new URL(f.imageURL).pathname),buffer=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,file));
   assert.equal(file,iconFileName(hashIconBuffer(buffer)),'PNG bytes must match the content hash');
   const lum=await opaqueAvgLum(buffer);
   if(skin==='solid'&&!f.id.startsWith('l-')&&!f.id.startsWith('sub-')){
     if(f.textColor==='#000000')assert.ok(lum<40,`solid/${f.id} needs dark ink on its bright fill (${lum.toFixed(1)})`);
     else assert.ok(lum>215,`solid/${f.id} needs light ink on its dark fill (${lum.toFixed(1)})`);
   }
   if(LOCAL_EXTRA_IDS.has(f.id)){
     const wantBlack=skin==='mono'||(skin==='solid'&&f.textColor==='#000000');
     if(wantBlack)assert.ok(lum<40,`${skin}/${f.id} glyph stays black (${lum.toFixed(1)})`);
     else if(skin!=='outline')assert.ok(lum>215,`${skin}/${f.id} glyph ink should be white like AAC/FLAC (${lum.toFixed(1)})`);
   }
   checked.add(file);
 }
}
assert.ok(checked.size>100,'Enough unique rehosted glyphs');
console.log(`PASS: ${PRESET_SKINS.length} skins have valid artwork and category chrome; ${checked.size} unique PNG hashes.`);
