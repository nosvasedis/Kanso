/** Native Java direction/regex validation using actual engine output. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {nuvioHaystacks,nuvioRegex} from './benchmark-badge-patterns.mjs';
const java=process.argv.find(a=>a.startsWith('--java='))?.slice(7)??'java';
const evidence=JSON.parse(await fs.readFile('docs/release-evidence/engine-fixtures.json','utf8'));
const b64=text=>Buffer.from(text,'utf8').toString('base64');
const lines=[];
for(const preset of ['compact','detailed'])for(const skin of ['solid','transparent','mono','outline']){
 const key=`${preset}-${skin}`;
 const pack=JSON.parse(await fs.readFile(`kanso-${skin}${preset==='compact'?'':'-detailed'}.json`,'utf8'));
 for(const f of pack.filters)lines.push(['P',key,f.id,b64(f.pattern)].join('\t'));
 for(const e of evidence.filter(e=>e.preset===preset)){
   const p=e.stream.parsedFile??{};
   // Mirrors StreamBadgeMatcher.badgeMatchCandidates for populated fields.
   const fields=[e.stream.filename,e.rawName,e.rawDescription,p.title,p.resolution,p.quality,p.encode,p.editions?.[0],p.audioTags?.join(' '),p.audioChannels?.join(' '),p.visualTags?.join(' '),p.releaseGroup,e.stream.addon?.name].filter(Boolean);
   const candidates=nuvioHaystacks(fields);
   const expected=pack.filters.filter(f=>candidates.some(c=>nuvioRegex(f.pattern).test(c))).map(f=>f.id);
   if(JSON.stringify(expected)!==JSON.stringify(e.badges))throw new Error(`Native candidate fields change badge facts: ${key}/${e.label}`);
   lines.push(['C',key,b64(e.label),b64(candidates.join('\0')),expected.join(',')].join('\t'));
 }
}
for(const e of evidence)lines.push(['T',b64(e.preset+'/'+e.label),b64(e.rawName)].join('\t'));
const input=path.resolve('docs/release-evidence/nuvio-native-cases.tsv');
await fs.writeFile(input,lines.join('\n')+'\n');
const result=spawnSync(java,[path.resolve('scripts/KansoNuvioChecks.java'),input],{encoding:'utf8',timeout:60000,windowsHide:true});
if(result.status!==0)throw new Error(result.stderr||result.error?.message||'Java validation failed');
console.log(result.stdout.trim());
await fs.writeFile('docs/release-evidence/nuvio-native-verification.json',JSON.stringify({verifiedAt:new Date().toISOString(),sourceTag:'NuvioTV 1.0.0',sourceCommit:'9f17e8bf4abc799dc8c832d2894a8b3b166e4353',result:result.stdout.trim()},null,2)+'\n');
