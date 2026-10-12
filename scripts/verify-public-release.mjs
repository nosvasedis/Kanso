/** Independently compare public bytes with local formatter/packs/PNG content. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,BADGE_IMAGE_FILES_DIR,ICON_CDN_OWNER,ICON_CDN_REPO} from './icon-cdn.mjs';
import {loadGistConfig,resolveGistTargets,parseGistId} from './gist-config.mjs';
import {github} from './github-release-client.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=async url=>{const r=await fetch(url,{headers:{'Cache-Control':'no-cache'}});if(!r.ok)throw new Error(`Public read-back ${r.status}: ${url}`);return Buffer.from(await r.arrayBuffer());};
const repo=`${ICON_CDN_OWNER}/${ICON_CDN_REPO}`;
const commit=(await github(`/repos/${repo}/commits/main`)).sha;
const base=`https://raw.githubusercontent.com/${repo}/${commit}`;
const repositoryFiles=['README.md','formatter.json','formatter-detailed.json',...['','-detailed'].flatMap(s=>['name','description'].map(f=>`formatter${s}-export-${f}.txt`)),...['solid','transparent','mono'].flatMap(t=>['','-detailed'].map(s=>`kanso-${t}${s}.json`))];
for(const file of repositoryFiles){
 const local=await fs.readFile(path.join(ROOT,file));const remote=await raw(base+'/'+file);
 if(sha(local)!==sha(remote))throw new Error(`Repository byte mismatch: ${file}`);
}
const icons=new Map();
for(const t of ['solid','transparent','mono'])for(const suffix of ['','-detailed']){
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${t}${suffix}.json`),'utf8'));
 for(const f of pack.filters){const file=path.basename(new URL(f.imageURL).pathname);icons.set(file,f.imageURL);}
}
const queue=[...icons.entries()];let done=0;
await Promise.all(Array.from({length:8},async()=>{for(;;){const next=queue.shift();if(!next)return;const [file,url]=next;
 const local=await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR,file));const remote=await raw(url);
 if(sha(local)!==sha(remote))throw new Error(`Public PNG byte mismatch: ${file}`);done++;
}}));
console.log(`PASS: public repository ${commit}; ${repositoryFiles.length} exports/docs and all ${done} referenced PNGs match local bytes.`);
const gists=[];
if(!process.argv.includes('--repository-only')){
 const targets=resolveGistTargets(await loadGistConfig());
 for(const theme of ['solid','transparent','mono']){
   const t=targets[theme],id=parseGistId(t.url);const meta=await github(`/gists/${id}?verification=${Date.now()}`);
   if(meta.owner?.login!==ICON_CDN_OWNER)throw new Error('Gist ownership differs');
   for(const suffix of ['','-detailed']){
     const filename=t.filename.replace(/\.json$/,suffix+'.json');const f=meta.files[filename];if(!f)throw new Error(`Missing gist file ${filename}`);
     const local=await fs.readFile(path.join(ROOT,`kanso-${theme}${suffix}.json`));
     const remote=await raw(f.raw_url);
     if(sha(local)!==sha(remote))throw new Error(`Public gist byte mismatch: ${filename}`);
     gists.push({theme,filename,sha256:sha(local),url:f.raw_url});
   }
 }
 console.log('PASS: all six public gist files match local exports.');
}
await fs.mkdir(path.join(ROOT,'docs/release-evidence'),{recursive:true});
await fs.writeFile(path.join(ROOT,'docs/release-evidence/public-verification.json'),JSON.stringify({verifiedAt:new Date().toISOString(),repo,commit,repositoryFiles,pngs:done,gists},null,2)+'\n');
