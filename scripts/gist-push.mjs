/** Publish both presets; preserve all other gist files; verify each write. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from './icon-cdn.mjs';
import {loadGistConfig,resolveGistTargets,parseGistId} from './gist-config.mjs';
import {github,requireOwner} from './github-release-client.mjs';
import {PRESET_SKINS} from './preset-badges.mjs';
import {readFileSync} from 'node:fs';
const VERSION=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
/** GitHub titles a gist by its first file; a space sorts before `-`, so this leads. */
export const gistIndexName=theme=>`Kanso ${theme[0].toUpperCase()}${theme.slice(1)}.md`;
/** Files from earlier releases that this publish removes. */
export const retiredGistFiles=theme=>[`kanso-player-${theme}.json`];
export function gistIndex(theme,id){
 const raw=f=>`https://gist.githubusercontent.com/nosvasedis/${id}/raw/${f}`;
 return `# Kanso ${VERSION} · ${theme[0].toUpperCase()}${theme.slice(1)}\n\nImport one link per Nuvio setting. Each file is a separate badge pack.\n\n| Use it for | File | Link |\n|---|---|---|\n`+
  `| Stream list, Compact formatter | \`kanso-${theme}.json\` | ${raw(`kanso-${theme}.json`)} |\n`+
  `| Stream list, Detailed formatter | \`kanso-${theme}-detailed.json\` | ${raw(`kanso-${theme}-detailed.json`)} |\n`+
  `| Player badges (Nuvio player badge pack) | \`kanso-${theme}-player.json\` | ${raw(`kanso-${theme}-player.json`)} |\n\n`+
  `Stream-list packs need the matching Kanso formatter: https://github.com/nosvasedis/Kanso\n`;
}
export async function pushGist(theme,{dryRun=false}={}){
 const target=resolveGistTargets(await loadGistConfig())[theme];
 const id=parseGistId(target.url);if(!id)return{skipped:true,reason:'no_gist_url',theme};
 if(!target.filename?.endsWith('.json'))throw new Error('Gist filename must end in .json');
 const names=[target.filename,target.filename.replace(/\.json$/,'-detailed.json'),`kanso-${theme}-player.json`];
 const localNames=[`kanso-${theme}.json`,`kanso-${theme}-detailed.json`,`kanso-${theme}-player.json`];
 const bodies=await Promise.all(localNames.map(f=>fs.readFile(path.join(ROOT,f),'utf8')));
 names.unshift(gistIndexName(theme));bodies.unshift(gistIndex(theme,id));
 if(dryRun)return{ok:true,dryRun:true,theme,gistId:id,filename:names.join(', '),bytes:bodies.reduce((n,b)=>n+Buffer.byteLength(b),0)};
 await requireOwner('nosvasedis');
 const before=await github(`/gists/${id}`);
 if(before.owner?.login!=='nosvasedis')throw new Error('Gist ownership mismatch');
 const evidence=path.join(ROOT,'docs/release-evidence');await fs.mkdir(evidence,{recursive:true});
 const backup=path.join(evidence,`gist-${id}-before-${before.history?.[0]?.version??Date.now()}.json`);
 try{await fs.writeFile(backup,JSON.stringify(before,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
 const retired=retiredGistFiles(theme).filter(name=>before.files[name]);
 const files=Object.fromEntries([...names.map((name,i)=>[name,{content:bodies[i]}]),...retired.map(name=>[name,null])]);
 await github(`/gists/${id}`,{method:'PATCH',body:JSON.stringify({description:`Kanso ${VERSION} ${theme}: stream-list badges (Compact, Detailed) and player badges for Nuvio`,files})});
 const after=await github(`/gists/${id}?verification=${Date.now()}`);
 for(let i=0;i<names.length;i++){
   const f=after.files[names[i]];if(!f)throw new Error('Published gist file missing');
   const body=f.truncated?await(await fetch(f.raw_url)).text():f.content;
   if(sha(body)!==sha(bodies[i]))throw new Error(`Gist read-back mismatch: ${names[i]}`);
 }
 for(const name of retired)if(after.files[name])throw new Error(`Retired gist file still present: ${name}`);
 for(const name of Object.keys(before.files))if(!names.includes(name)&&!retired.includes(name)){
   if(!after.files[name]||sha(after.files[name].content)!==sha(before.files[name].content))throw new Error(`Unrelated gist file changed: ${name}`);
 }
 const result={ok:true,theme,gistId:id,filename:names.join(', '),htmlUrl:after.html_url,updatedAt:after.updated_at,bytes:bodies.reduce((n,b)=>n+Buffer.byteLength(b),0),hashes:names.map((name,i)=>({name,sha256:sha(bodies[i])}))};
 await fs.writeFile(path.join(evidence,`gist-${theme}-verified.json`),JSON.stringify(result,null,2)+'\n');return result;
}
export async function pushAllGists(options={}){const out=[];for(const t of options.themes??PRESET_SKINS)out.push(await pushGist(t,options));return out;}
/** Local patching never uploads; explicit push/release commands publish. */
export async function pushGistAfterPatch(theme){return{skipped:true,reason:'explicit_publish_required',theme};}
