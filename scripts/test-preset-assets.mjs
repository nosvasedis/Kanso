import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {buildPresetBadges} from './preset-badges.mjs';
import {BADGE_IMAGE_FILES_DIR,hashIconBuffer,iconFileName} from './icon-cdn.mjs';
const luminance=hex=>{
 const a=hex.replace('#','').match(/../g).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return a[0]*.2126+a[1]*.7152+a[2]*.0722;
};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const checked=new Set();let minimum=Infinity;
for(const preset of ['compact','detailed'])for(const skin of ['solid','transparent','mono']){
 const suffix=preset==='compact'?'':'-detailed';
 const pack=JSON.parse(await fs.readFile(`kanso-${skin}${suffix}.json`,'utf8'));
 const expected=buildPresetBadges(skin,preset);
 assert.equal(pack.filters.length,preset==='compact'?124:130);
 assert.equal(new Set(pack.filters.map(f=>f.id)).size,pack.filters.length);
 for(let i=0;i<pack.filters.length;i++){
   const f=pack.filters[i],ref=expected.filters[i];
   for(const key of ['id','pattern','isEnabled','tagColor','textColor','borderColor'])assert.equal(f[key],ref[key]);
   const ratio=contrast(f.textColor,skin==='transparent'?'#202028':f.tagColor);
   assert.ok(ratio>=4.5,`${skin}/${f.id}: contrast ${ratio}`);minimum=Math.min(minimum,ratio);
   const file=path.basename(new URL(f.imageURL).pathname);
   const buffer=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,file));
   assert.equal(file,iconFileName(hashIconBuffer(buffer)),'PNG name must match its content hash');
   if(checked.has(file))continue;checked.add(file);
   const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   assert.equal(info.height,80);assert.ok(info.width<=460&&info.width>=120);
   const rgb=f.textColor.slice(1).match(/../g).map(h=>parseInt(h,16));
   let count=0,minX=info.width,maxX=0,minY=80,maxY=0;
   for(let y=0;y<80;y++)for(let x=0;x<info.width;x++){
     const p=(y*info.width+x)*4;
     if(data[p+3]<220)continue;
     count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
     for(let c=0;c<3;c++)assert.ok(Math.abs(data[p+c]-rgb[c])<=2,`${f.id}: incorrect embedded PNG ink`);
   }
   assert.ok(count>100,'Nonempty text');
   assert.ok(minX>=4&&maxX<info.width-4&&minY>=4&&maxY<76,`${skin}/${f.id}: glyph clipping/padding ${minX}/${maxX}/${minY}/${maxY}`);
 }
}
console.log(`PASS: all six packs, ${checked.size} PNG hashes/embedded ink/padding; minimum modeled text contrast ${minimum.toFixed(2)}:1.`);
