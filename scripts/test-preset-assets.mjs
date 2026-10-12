import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {RETIRED_BADGE_IDS} from './retired-badges.mjs';
import {buildPresetBadges,ILLUSTRATED_APPEARANCE,WHITE_COMPOSITE_IDS} from './preset-badges.mjs';
import {BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
const entries=Object.entries(ILLUSTRATED_APPEARANCE).flatMap(([skin,t])=>Object.entries(t.filters).map(([id,f])=>`${skin}/${id}=${f.imageURL}`)).sort();
assert.equal(crypto.createHash('sha256').update(entries.join('\n')).digest('hex'),'38bac6eb3f96a3da2fe8e1a9f90d5f6748efee543370ace7b0313892f1ddce58','Preserve the original retained-art contract; do not replace it with text');
const luminance=hex=>{const a=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const checked=new Set();let composites=0,minimum=Infinity;
for(const preset of ['compact','detailed'])for(const skin of ['solid','transparent','mono']){
 const suffix=preset==='compact'?'':'-detailed';
 const pack=JSON.parse(await fs.readFile(`kanso-${skin}${suffix}.json`,'utf8'));const expected=buildPresetBadges(skin,preset);
 assert.ok(pack.filters.every(f=>f.isEnabled&&!RETIRED_BADGE_IDS.has(f.id)),'Retired filters are removed from the product');
 assert.ok(pack.groups.every(g=>pack.filters.some(f=>f.groupId===g.id)),'No empty groups');
 assert.equal(pack.filters.length,preset==='compact'?52:93);assert.equal(new Set(pack.filters.map(f=>f.id)).size,pack.filters.length);
 for(let i=0;i<pack.filters.length;i++){
   const f=pack.filters[i],ref=expected.filters[i];
   for(const key of ['id','pattern','isEnabled','tagColor','textColor','borderColor'])assert.equal(f[key],ref[key]);
   const original=ILLUSTRATED_APPEARANCE[skin].filters[f.id.replace(/-webrip$/,'')];
   assert.equal(f.imageURL,original.imageURL,'Retain the original illustrated asset');
   const file=path.basename(new URL(f.imageURL).pathname),buffer=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,file));
   assert.equal(file,iconFileName(hashIconBuffer(buffer)),'Original PNG bytes must match the original hash');
   const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   assert.ok(info.width>0&&info.height>0&&info.width<=4096&&info.height<=4096);
   let count=0,white=0;
   for(let j=0;j<data.length;j+=4)if(data[j+3]>220){count++;if(Math.min(data[j],data[j+1],data[j+2])>=245)white++;}
   assert.ok(count>100,'Nonempty illustrated PNG');checked.add(file);
   if(WHITE_COMPOSITE_IDS.has(f.id)){
     assert.ok(white/count>.95,'Verify actual white ink in the composite PNG');
     const ratio=contrast('#FFFFFF',skin==='transparent'?'#202028':f.tagColor);
     assert.ok(ratio>=4.5,`${skin}/${f.id}: white artwork must be visible`);minimum=Math.min(minimum,ratio);composites++;
   }
 }
}
assert.equal(checked.size,136);
console.log(`PASS: all six cleaned packs retain their original illustrated artwork; ${checked.size} original PNG hashes; ${composites} composite/background checks, minimum ${minimum.toFixed(2)}:1 for the repaired white composites.`);
