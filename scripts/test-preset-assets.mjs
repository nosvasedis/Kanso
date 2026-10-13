import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {RETIRED_BADGE_IDS} from './retired-badges.mjs';
import {buildPresetBadges,DISPLAY_GROUP_ORDER,ILLUSTRATED_APPEARANCE,PRESENTATION_SPECIAL_IDS,PRESET_SKINS} from './preset-badges.mjs';
import {BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
const checked=new Set();
for(const preset of ['compact','detailed'])for(const skin of PRESET_SKINS){
 const suffix=preset==='compact'?'':'-detailed';
 const pack=JSON.parse(await fs.readFile(`kanso-${skin}${suffix}.json`,'utf8'));const expected=buildPresetBadges(skin,preset);
 assert.ok(pack.filters.every(f=>f.isEnabled&&!RETIRED_BADGE_IDS.has(f.id)),'Retired filters are removed from the product');
 assert.ok(pack.groups.every(g=>pack.filters.some(f=>f.groupId===g.id)),'No empty groups');
 assert.deepEqual(pack.groups.map(g=>g.id),DISPLAY_GROUP_ORDER.filter(id=>pack.filters.some(f=>f.groupId===id)),`${skin}/${preset} group order`);
 for(const id of PRESENTATION_SPECIAL_IDS){
   const f=pack.filters.find(x=>x.id===id);
   assert.ok(f,`${id} exported`);
   assert.equal(f.groupId,'gst',`${id} sits with specials`);
 }
 const at=id=>pack.filters.findIndex(f=>f.id===id);
 const firstPresent=(...ids)=>ids.map(at).find(i=>i>=0);
 const special=firstPresent('seadex-release','v-imax','edition-extended','edition-bw');
 const streaming=firstPresent('s-nflx','s-amzn');
 const tier=firstPresent('web-1','blu-ray-1','remux-1');
 const picture=firstPresent('v-dv-hdr10p','v-hdr10','a-dv','v-sdr');
 const audio=firstPresent('a-at-th','a-aac','a-dp');
 const codec=firstPresent('ge-av1','ge-hevc','ge-avc');
 const story=[special,streaming,tier,picture,audio,codec].filter(i=>i!==undefined);
 for(let i=1;i<story.length;i++)assert.ok(story[i-1]<story[i],`${skin}/${preset} chip story ${story}`);
 if(preset==='detailed'){
   assert.ok(at('v-imax')<at('s-nflx')&&at('s-nflx')<at('web-1')&&at('web-1')<at('v-dv-hdr10p')&&at('v-dv-hdr10p')<at('a-at-th')&&at('a-at-th')<at('ge-hevc'));
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
