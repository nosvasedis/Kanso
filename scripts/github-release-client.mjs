import {githubToken} from './gist-config.mjs';
export async function github(path,options={}){
 const token=await githubToken();if(!token)throw new Error('GitHub token missing');
 const r=await fetch('https://api.github.com'+path,{...options,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Kanso-release','Content-Type':'application/json',...options.headers}});
 if(!r.ok)throw new Error(`GitHub ${options.method??'GET'} ${path.split('?')[0]} returned ${r.status}`);
 return r.json();
}
export async function requireOwner(owner){
 const user=await github('/user');if(user.login!==owner)throw new Error(`Authenticated account must be ${owner}`);
}
