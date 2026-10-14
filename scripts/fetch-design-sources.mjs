import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const commons=name=>{const h=crypto.createHash('md5').update(name).digest('hex');return `https://upload.wikimedia.org/wikipedia/commons/${h[0]}/${h.slice(0,2)}/${encodeURIComponent(name)}`;};
const dir=new URL('../assets/badge-sources/',import.meta.url);
await fs.mkdir(dir,{recursive:true});
const sources={
 'dts.png':'https://dts.com/wp-content/themes/dts-master-theme/assets/img/DTS-Logo.png',
 'hdr10plus.png':'https://hdr10plus.org/wp-content/uploads/2023/10/cropped-header_logo.png',
 'opus.svg':'https://opus-codec.org/assets/img/opus-logo.svg',
 'bluray.svg':commons('Blu-ray_Disc.svg'),
 'criterion.svg':commons('The_Criterion_Collection_Logo.svg'),
 'hdr10.svg':commons('HDR_10_logo_(black).svg'),
 'flac.gif':'https://xiph.org/flac/images/logo130.gif',
 'apple-tv.svg':'https://hdr10plus.org/wp-content/uploads/2025/11/Apple_TV_Logo_Wht_CI_082925.svg',
 'disney.png':'https://hdr10plus.org/wp-content/uploads/2025/10/DisneyLogo_2024_VECTOR_White_RGB-scaled.png',
 'netflix.png':'https://hdr10plus.org/wp-content/uploads/2025/04/Netflix_logo_white.png',
 'prime.png':'https://hdr10plus.org/wp-content/uploads/2023/12/prime.png',
 'hulu.png':'https://hdr10plus.org/wp-content/uploads/2023/12/hulu.png',
 'paramount.png':'https://hdr10plus.org/wp-content/uploads/2023/12/paramount.png',
 'dolby.svg':'https://www.dolby.com/globalassets/logo/dolby_logo_white.svg',
 'dolby-vision.svg':commons('Dolby_Vision_2021_logo.svg'),
 'dolby-atmos.svg':commons('Logo_Dolby_Atmos.svg'),
 'dolby-truehd.svg':commons('Dolby_TrueHD.svg'),
 'dolby-digital-plus.svg':commons('Dolby-Digital-Plus.svg'),
 'dolby-digital.svg':commons('Dolby-Digital.svg'),
 'dts-ma.svg':commons('DTS-HD-MA.svg'),
 'hbo-max.svg':commons('HBO_Max_May_2025_(Horizontal).svg'),
 'crunchyroll.svg':commons('Crunchyroll_2024.svg'),
 'peacock.jpg':'https://www.peacocktv.com/dam/growth/assets/Logos/peacock-logo-contentpromo-2026.jpg',
 'imax.svg':commons('IMAX_blue_logo.svg'),
 'dts-x.png':commons('DTS_X_B&W.png'),
};
const manifest={};
for(const [file,url] of Object.entries(sources)){
 try{
  const cached=await fs.readFile(new URL(file,dir)).catch(()=>null);
  if(cached){manifest[file]={url,bytes:cached.length,sha256:crypto.createHash('sha256').update(cached).digest('hex')};console.log(file,'cached');continue;}
  await new Promise(resolve=>setTimeout(resolve,1500));
  const r=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const b=Buffer.from(await r.arrayBuffer());
  await fs.writeFile(new URL(file,dir),b);manifest[file]={url,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};console.log(file,b.length);
 }catch(e){throw new Error(`Cannot fetch ${file}: ${e.message}`);}
}
await fs.writeFile(new URL('sources.json',dir),JSON.stringify(manifest,null,2)+'\n');
