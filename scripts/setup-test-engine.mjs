import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const dir=new URL('../.vendor/AIOStreams',import.meta.url);
export const ENGINE_COMMIT='1dcfa7665e7fa759b5604e39bf0f491e9aefaea5';
const run=(args,cwd)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||'git failed');return r.stdout.trim();};
try{await fs.access(dir);}catch{
 await fs.mkdir(new URL('../.vendor/',import.meta.url),{recursive:true});
 run(['clone','--depth','1','--branch','v2.35.9','https://github.com/Viren070/AIOStreams.git',dir.pathname.replace(/^\/([A-Za-z]:)/,'$1')]);
}
const root=await fs.realpath(dir);
if(run(['rev-parse','HEAD'],root)!==ENGINE_COMMIT)throw new Error('Test engine differs from pinned AIOStreams 2.35.9. Preserve local edits and restore the pinned checkout.');
if(run(['status','--porcelain'],root))throw new Error('Test engine has local edits');
console.log('Official AIOStreams 2.35.9 test engine verified.');
