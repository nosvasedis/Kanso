/** Overlay a verified release on a fresh checkout. Preserve history and unrelated files. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {githubToken} from './gist-config.mjs';
import {github,requireOwner} from './github-release-client.mjs';
import {ROOT,BADGE_IMAGE_FILES_DIR,ICON_CDN_OWNER,ICON_CDN_REPO} from './icon-cdn.mjs';
import {PRESET_SKINS} from './preset-badges.mjs';
import {readFileSync} from 'node:fs';
const VERSION=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const repo=`${ICON_CDN_OWNER}/${ICON_CDN_REPO}`;
const dryRun=process.argv.includes('--dry-run');
await requireOwner(ICON_CDN_OWNER);
const meta=await github(`/repos/${repo}`);if(!meta.permissions?.push||meta.default_branch!=='main')throw new Error('Expected writable main branch');
const projectToken=await githubToken();
// A project gist token may lack repository write scope. Use an existing CLI
// login when available, without printing or persisting its credential.
const cliEnv={...process.env};delete cliEnv.GITHUB_TOKEN;delete cliEnv.GH_TOKEN;
const saved=spawnSync('gh',['auth','token'],{env:cliEnv,encoding:'utf8'});
const token=saved.status===0&&saved.stdout.trim()?saved.stdout.trim():projectToken;
const publishingUser=await github('/user',{headers:{Authorization:`Bearer ${token}`}});
if(publishingUser.login!==ICON_CDN_OWNER)throw new Error('Publishing account differs from repository owner');
const env={...process.env,GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+token).toString('base64')};
const run=(args,cwd,quiet=false)=>{const r=spawnSync('git',args,{cwd,env,encoding:'utf8',maxBuffer:12e6});if(r.status!==0)throw new Error(`git ${args[0]} failed: ${r.stderr}`);if(!quiet&&r.stdout)console.log(r.stdout.trim());return r.stdout.trim();};
const work=path.join(ROOT,'badges/badge-images/.release-worktree',String(Date.now()));
await fs.mkdir(path.dirname(work),{recursive:true});
run(['clone','--branch','main',`https://github.com/${repo}.git`,work],ROOT,true);
const before=run(['rev-parse','HEAD'],work,true);
const files=['README.md','package.json','package-lock.json','.gitignore','.gitattributes','.env.example','sync-helper.bat','formatter.json','formatter-detailed.json',
 ...['','-detailed'].flatMap(s=>['name','description'].map(f=>`formatter${s}-export-${f}.txt`)),
 ...PRESET_SKINS.flatMap(t=>['','-detailed'].map(s=>`kanso-${t}${s}.json`)),
 'backup/v1/oracle/nosvasedis-badges-solid.json','docs/kanso-v2.md','docs/badge-design.md','badges/badge-images/README.md','badges/badge-images/manifest.json'];
const copy=async(src,dest)=>{await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(src,dest);};
for(const f of files)await copy(path.join(ROOT,f),path.join(work,f));
const ignored=new Set(['generated','generated-solid','generated-transparent','badge-images','user-config.json','probe-preset-engine.ts']);
const overlay=async(src,dest)=>{for(const e of await fs.readdir(src,{withFileTypes:true})){if(ignored.has(e.name))continue;const s=path.join(src,e.name),d=path.join(dest,e.name);if(e.isDirectory())await overlay(s,d);else if(e.isFile())await copy(s,d);}};
for(const dir of ['scripts','badges','sync-ui','assets/Kanso','assets/fonts','assets/badge-sources','assets/glyphs','assets/flag-sources','assets/spoken-flags','assets/subtitle-flags'])await overlay(path.join(ROOT,dir),path.join(work,dir));
// Ship current references only; previously published hashes stay in the checkout.
const referenced=new Set();
for(const theme of PRESET_SKINS)for(const suffix of ['','-detailed']){
 const pack=JSON.parse(await fs.readFile(path.join(ROOT,`kanso-${theme}${suffix}.json`),'utf8'));
 for(const f of pack.filters)referenced.add(path.basename(new URL(f.imageURL).pathname));
}
for(const file of referenced)await copy(path.join(BADGE_IMAGE_FILES_DIR,file),path.join(work,'files',file));
run(['add','--',...files,'scripts','badges','sync-ui','assets/Kanso','assets/fonts','assets/badge-sources','assets/glyphs','assets/flag-sources','assets/spoken-flags','assets/subtitle-flags','files'],work,true);
run(['diff','--cached','--check'],work);
const paths=run(['diff','--cached','--name-only'],work,true).split('\n').filter(Boolean);
if(paths.some(f=>/(^|\/)(\.env|user-config\.json|\.vendor|node_modules|release-evidence)(\/|$)/.test(f)))throw new Error('Private/runtime file reached staging');
for(const file of paths){const bytes=await fs.readFile(path.join(work,file));if([token,projectToken].some(t=>t&&bytes.includes(Buffer.from(t))))throw new Error('Publishing credential reached a staged file');}
const staged=run(['diff','--cached','--diff-filter=D','--name-only'],work,true);if(staged)throw new Error('Overlay release unexpectedly deletes files');
const evidence=path.join(ROOT,'docs/release-evidence');await fs.mkdir(evidence,{recursive:true});
const record={repo,before,work,dryRun,changedFiles:paths.length};
await fs.writeFile(path.join(evidence,'repository-release.json'),JSON.stringify(record,null,2)+'\n');
console.log(`Reviewed overlay: ${paths.length} files, no deletions, base ${before}`);
if(dryRun){console.log('Dry run: checkout ready for review, no remote writes.');process.exit(0);}
if(paths.length){
 run(['-c','user.email=nosvasedis@users.noreply.github.com','-c','user.name=nosvasedis','commit','-m',`Kanso ${VERSION}: verified formatter and badge packs`],work,true);
 run(['push','origin','HEAD:main'],work,true);
}
const commit=run(['rev-parse','HEAD'],work,true);
if(run(['ls-remote','origin','refs/heads/main'],work,true).split(/\s/)[0]!==commit)throw new Error('Remote main does not match the release commit');
record.commit=commit;record.url=`https://github.com/${repo}/commit/${commit}`;
await fs.writeFile(path.join(evidence,'repository-release.json'),JSON.stringify(record,null,2)+'\n');
console.log(`Published and verified ${record.url}`);
