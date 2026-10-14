import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {SPOKEN_FLAGS} from './spoken-flags.mjs';
const dir=new URL('../assets/flag-sources/',import.meta.url);
await fs.mkdir(dir,{recursive:true});
const records={};
for(const [code,country] of Object.entries(SPOKEN_FLAGS)){
 const url=`https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/${country}.svg`;
 let b=await fs.readFile(new URL(country+'.svg',dir)).catch(()=>null);
 if(!b){const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`${code} HTTP ${r.status}`);b=Buffer.from(await r.arrayBuffer());await fs.writeFile(new URL(country+'.svg',dir),b);}
 records[code]={country,url,sha256:crypto.createHash('sha256').update(b).digest('hex')};
}
const licenseUrl='https://raw.githubusercontent.com/lipis/flag-icons/main/LICENSE';
try{await fs.access(new URL('LICENSE.txt',dir));}catch{const r=await fetch(licenseUrl);if(!r.ok)throw new Error('Flag license fetch failed');await fs.writeFile(new URL('LICENSE.txt',dir),await r.text());}
await fs.writeFile(new URL('manifest.json',dir),JSON.stringify({licenseUrl,flags:records},null,2)+'\n');
console.log(`Cached ${Object.keys(records).length} exact flag vectors.`);
