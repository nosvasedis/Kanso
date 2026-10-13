import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {RETIRED_BADGE_IDS} from './retired-badges.mjs';
import {buildPresetBadges,DISPLAY_FILTER_ORDER,DISPLAY_GROUP_ORDER,ILLUSTRATED_APPEARANCE,PRESET_SKINS,SPECIAL_DISPLAY_IDS} from './preset-badges.mjs';
import {MONO_FILTER_ORDER} from './badge-transparent-theme.mjs';
import {BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
assert.deepEqual([...MONO_FILTER_ORDER.gst].sort(),SPECIAL_DISPLAY_IDS.filter(id=>!['v-imax-e','v-imax','v-3d'].includes(id)).sort(),'Every library special is in the leading specials block');
const checked=new Set();
for(const preset of ['compact','detailed'])for(const skin of PRESET_SKINS){
 const suffix=preset==='compact'?'':'-detailed';
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
 if(preset==='detailed'){
   assert.ok(at('hybrid-release')<at('s-nflx')&&at('s-nflx')<at('web-1')&&at('web-1')<at('v-dv-hdr10p')&&at('v-dv-hdr10p')<at('a-at-th')&&at('a-at-th')<at('ch-71')&&at('ch-71')<at('l-en'));
   assert.ok(at('web-1')<at('web-1-webrip')&&at('web-1-webrip')<at('web-2'));
 }
 assert.equal(pack.filters.length,expected.filters.length);
 assert.equal(new Set(pack.filters.map(f=>f.id)).size,pack.filters.length);
 for(let i=0;i<pack.filters.length;i++){
   const f=pack.filters[i],ref=expected.filters[i];
   for(const key of ['id','pattern','isEnabled','tagColor','textColor','borderColor'])assert.equal(f[key],ref[key]);
   const original=ILLUSTRATED_APPEARANCE[skin].filters[f.id.replace(/-webrip$/,'')];
   assert.equal(f.imageURL,original.imageURL,`Kingsize glyph missing for ${skin}/${f.id}`);
   const file=path.basename(new URL(f.imageURL).pathname),buffer=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,file));
   assert.equal(file,iconFileName(hashIconBuffer(buffer)),'PNG bytes must match the content hash');
   checked.add(file);
 }
}
assert.ok(checked.size>100,'Enough unique rehosted glyphs');
console.log(`PASS: ${PRESET_SKINS.length} skins retain rehosted Kingsize artwork; ${checked.size} unique PNG hashes.`);
