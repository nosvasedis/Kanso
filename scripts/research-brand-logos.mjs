/** Inventory original marks on brand-owned pages; does not generate or publish. */
import fs from 'node:fs/promises';
const pages=[
 'https://www.dolby.com/technologies/dolby-atmos/',
 'https://www.dolby.com/technologies/dolby-vision/',
 'https://www.dolby.com/technologies/dolby-truehd/',
 'https://www.dolby.com/technologies/dolby-digital-plus/',
 'https://www.dolby.com/technologies/dolby-digital/',
 'https://news.dolby.com/en-WW/assets/categories/1219/',
 'https://dts.com/dtsx/',
 'https://dts.com/patents-automotive/',
 'https://www.imaxenhanced.com/',
 'https://www.imax.com/',
 'https://www.peacocktv.com/',
 'https://www.crunchyroll.com/about',
 'https://hdr10plus.org/',
 'https://releases.moe/',
];
const records=await Promise.all(pages.map(async page=>{
 try{
  const r=await fetch(page,{signal:AbortSignal.timeout(25000)}),html=await r.text();
  const matches=[...html.matchAll(/(?:src|href|content|data-src)=["']([^"']+\.(?:png|svg|webp|gif|jpg)[^"']*)/gi)].map(m=>new URL(m[1].replaceAll('&amp;','&'),page).href);
  const urls=[...new Set(matches)].filter(v=>/logo|atmos|vision|truehd|digital|master|dtsx|dts-x|imax|peacock|crunchy|seadex|hdr/i.test(v));
  return {page,status:r.status,assets:urls};
 }catch(e){return{page,error:e.message,assets:[]};}
}));
await fs.writeFile(new URL('../assets/badge-sources/research.json',import.meta.url),JSON.stringify(records,null,2)+'\n');
for(const r of records)console.log(r.page,r.status??r.error,'\n'+r.assets.slice(0,14).join('\n'));
