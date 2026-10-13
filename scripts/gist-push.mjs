/** Publish both presets; preserve all other gist files; verify each write. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from './icon-cdn.mjs';
import {loadGistConfig,resolveGistTargets,parseGistId} from './gist-config.mjs';
import {github,requireOwner} from './github-release-client.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export async function pushGist(theme,{dryRun=false}={}){
 const target=resolveGistTargets(await loadGistConfig())[theme];
 const id=parseGistId(target.url);if(!id)return{skipped:true,reason:'no_gist_url',theme};
 if(!target.filename?.endsWith('.json'))throw new Error('Gist filename must end in .json');
 const names=[target.filename,target.filename.replace(/\.json$/,'-detailed.json')];
 const localNames=[`kanso-${theme}.json`,`kanso-${theme}-detailed.json`];
 const bodies=await Promise.all(localNames.map(f=>fs.readFile(path.join(ROOT,f),'utf8')));
 if(dryRun)return{ok:true,dryRun:true,theme,gistId:id,filename:names.join(', '),bytes:bodies.reduce((n,b)=>n+Buffer.byteLength(b),0)};
 await requireOwner('nosvasedis');
 const before=await github(`/gists/${id}`);
 if(before.owner?.login!=='nosvasedis')throw new Error('Gist ownership mismatch');
 const evidence=path.join(ROOT,'docs/release-evidence');await fs.mkdir(evidence,{recursive:true});
 const backup=path.join(evidence,`gist-${id}-before-${before.history?.[0]?.version??Date.now()}.json`);
 try{await fs.writeFile(backup,JSON.stringify(before,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
 const files=Object.fromEntries(names.map((name,i)=>[name,{content:bodies[i]}]));
 await github(`/gists/${id}`,{method:'PATCH',body:JSON.stringify({description:`Kanso 2.1.2 ${theme}: illustrated Compact + Detailed badges and emoji formatter for Nuvio`,files})});
 const after=await github(`/gists/${id}?verification=${Date.now()}`);
 for(let i=0;i<names.length;i++){
   const f=after.files[names[i]];if(!f)throw new Error('Published gist file missing');
   const body=f.truncated?await(await fetch(f.raw_url)).text():f.content;
   if(sha(body)!==sha(bodies[i]))throw new Error(`Gist read-back mismatch: ${names[i]}`);
 }
 for(const name of Object.keys(before.files))if(!names.includes(name)){
   if(!after.files[name]||sha(after.files[name].content)!==sha(before.files[name].content))throw new Error(`Unrelated gist file changed: ${name}`);
 }
 const result={ok:true,theme,gistId:id,filename:names.join(', '),htmlUrl:after.html_url,updatedAt:after.updated_at,bytes:bodies.reduce((n,b)=>n+Buffer.byteLength(b),0),hashes:names.map((name,i)=>({name,sha256:sha(bodies[i])}))};
 await fs.writeFile(path.join(evidence,`gist-${theme}-verified.json`),JSON.stringify(result,null,2)+'\n');return result;
}
export async function pushAllGists(options={}){const out=[];for(const t of options.themes??['solid','transparent','mono'])out.push(await pushGist(t,options));return out;}
/** Local patching never uploads; explicit push/release commands publish. */
export async function pushGistAfterPatch(theme){return{skipped:true,reason:'explicit_publish_required',theme};}
