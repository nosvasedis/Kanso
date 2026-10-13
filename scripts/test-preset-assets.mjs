import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {RETIRED_BADGE_IDS} from './retired-badges.mjs';
import {buildPresetBadges,ILLUSTRATED_APPEARANCE,PRESET_SKINS} from './preset-badges.mjs';
import {BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
const checked=new Set();
for(const preset of ['compact','detailed'])for(const skin of PRESET_SKINS){
 const suffix=preset==='compact'?'':'-detailed';
 const pack=JSON.parse(await fs.readFile(`kanso-${skin}${suffix}.json`,'utf8'));const expected=buildPresetBadges(skin,preset);
 assert.ok(pack.filters.every(f=>f.isEnabled&&!RETIRED_BADGE_IDS.has(f.id)),'Retired filters are removed from the product');
 assert.ok(pack.groups.every(g=>pack.filters.some(f=>f.groupId===g.id)),'No empty groups');
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
