import fs from 'node:fs/promises';
const urls=['https://dts.com/imax-enhanced/'];
for(const url of urls){
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(20000)}),s=await r.text();console.log(url,r.status);
  if(url.includes('dts.com'))console.log(s.slice(s.indexOf('DTS-HD Master Audio')-500,s.indexOf('DTS-HD Master Audio')+350));
  const assets=[...s.matchAll(/["'(]([^"'()<>\s]+\.(?:svg|png|jpg|zip)(?:\?[^"'()<>\s]*)?)/gi)].map(m=>new URL(m[1].replaceAll('&amp;','&'),url).href);
  console.log([...new Set(assets)].filter(u=>/logo|atmos|vision|dts|seadex/i.test(u)).slice(0,18).join('\n'));
  const inline=[...s.matchAll(/<svg[\s\S]*?<\/svg>/g)].filter(m=>/peacock|logo|dolby|DTS/i.test(m[0]));
  console.log('inline logo svgs',inline.length);
  if(url.includes('peacock')&&inline.length)await fs.writeFile(new URL('../assets/badge-sources/peacock-inline.svg',import.meta.url),inline[0][0]);
 }catch(e){console.log(e.message)}
}
