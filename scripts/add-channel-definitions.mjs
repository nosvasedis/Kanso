/** One-time local artwork bootstrap for new channel facts. */
import fs from 'node:fs/promises';
const libPath=new URL('../badges/badge-library.json',import.meta.url),artPath=new URL('../badges/illustrated-appearance.json',import.meta.url);
const lib=JSON.parse(await fs.readFile(libPath)),art=JSON.parse(await fs.readFile(artPath));
for(const [id,name] of [['ch-81','8.1'],['ch-21','2.1'],['ch-10','1.0']]){
 if(!lib.filters.some(f=>f.id===id))lib.filters.push({id,groupId:'gc',name});
 for(const theme of Object.values(art.themes))if(!theme.filters[id])theme.filters[id]={...theme.filters['ch-20'],name};
}
await fs.writeFile(libPath,JSON.stringify(lib,null,2)+'\n');
await fs.writeFile(artPath,JSON.stringify(art,null,2)+'\n');
