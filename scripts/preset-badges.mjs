import { readFileSync } from 'node:fs';
import { v2PatternForBadge, MARKER_ATOMS as M, TIER_MARKERS } from './formatter-markers.mjs';
import { PRESET_MARKER } from './preset-formatter.mjs';
const library=JSON.parse(readFileSync(new URL('../badges/badge-library.json',import.meta.url),'utf8'));
const literal=m=>[...m].map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
const requireMarker=m=>`(?=.*(?:${literal(m)}))`;
const forbid=m=>`(?!.*(?:${literal(m)}))`;
const editionIds=['edition-directors-cut','edition-extended','uncut-edition','uncensored-edition','edition-bw','open-matte-edition','seadex-release'];
const groupOrder=['gwarn','gst','gr','gms','grl','gl','gv','ga','gc','gs','gprovenance','gq'];
const groups={gwarn:'Warnings',gst:'Cuts and anime',gr:'Resolution',gms:'Source tiers',grl:'Source',gl:'Audio language',gv:'Picture',ga:'Audio',gc:'Channels',gs:'Streaming origin',gprovenance:'Release detail',gq:'Legacy score badges (disabled)'};
export const LABELS={
 'edition-directors-cut':'DIR CUT','edition-extended':'EXTENDED','edition-true-hue':'TRUE HUE','edition-bw':'B&W','edition-theatrical':'THEATRICAL','seadex-release':'SEADEX',
 'criterion-collection':'CRITERION','proper-release':'PROPER','repack-release':'REPACK','remastered-release':'REMASTER','open-matte-edition':'OPEN MATTE','regraded-release':'REGRADED','uncensored-edition':'UNCENSORED','uncut-edition':'UNCUT','hybrid-release':'HYBRID',
 'q-r':'REMUX','q-b':'BLU-RAY','q-w':'WEB-DL','q-wr':'WEBRip','q-cam':'CAM','q-hdtv':'HDTV',
 'r-4k':'4K','r-1440':'1440p',
 'v-dv-hdr10p':'DV/HDR10+','v-dv-hdr10':'DV/HDR10','v-dv-hdr':'DV/HDR','v-hdr10p':'HDR10+','v-hdr10':'HDR10','v-hdr':'HDR','v-hlg':'HLG','v-10bit':'10bit','v-imax-e':'IMAX ENH.','v-imax':'IMAX','a-dv':'DOLBY VISION','v-sdr':'SDR','v-ai':'AI','v-3d':'3D',
 'a-at-th':'TrueHD Atmos','a-at-dp':'DD+ Atmos','a-dtsx-ma':'DTS:X MA','a-dtsx-hd':'DTS:X HD','a-dtsx':'DTS:X','a-dtsma':'DTS-HD MA','a-dtshd':'DTS-HD','a-dtses':'DTS-ES','a-th':'TrueHD','a-at':'Atmos','a-dp':'DD+','a-dd':'DD',
 'l-en':'EN','l-es':'ES','l-fr':'FR','l-de':'DE','l-it':'IT','l-pt-br':'PT-BR','l-pt-pt':'PT','l-tr':'TR','l-pl':'PL','l-uk':'UK','l-id':'ID','l-th':'TH','l-vi':'VI','l-ja':'JA','l-ko':'KO','l-zh':'ZH','l-hi':'HI','l-ar':'AR','l-ru':'RU','l-el':'EL','l-mu':'MULTI'
};
const sourceAtoms={'q-r':'srcRemux','q-b':'srcBluray','q-w':'srcWebdl','q-wr':'srcWebrip','q-cam':'srcCam','q-hdtv':'srcHdtv'};
const priority=['q-cam','q-r','q-b','q-w','q-wr','q-hdtv'];
function plainSource(id,preset){
 let p='(?s)^'+requireMarker(M[sourceAtoms[id]]);
 for(const higher of priority.slice(0,priority.indexOf(id)))p+=forbid(M[sourceAtoms[higher]]);
 if(preset==='detailed'){
   const family=id==='q-r'?'remux-':id==='q-b'?'blu-ray-':['q-w','q-wr'].includes(id)?'web-':null;
   if(family)for(const [key,m] of Object.entries(TIER_MARKERS))if(key.startsWith(family)&&!key.endsWith('unranked'))p+=forbid(m);
 }
 return p;
}
export function colorsFor(group,theme){
 const palette={gwarn:['B3261E','FFFFFF'],gst:['5C6BC0','FFFFFF'],gr:['1565C0','FFFFFF'],gms:['455A64','FFFFFF'],grl:['455A64','FFFFFF'],gl:['455A64','FFFFFF'],gv:['FFD54F','141414'],ga:['FFFFFF','141414'],gc:['FFFFFF','141414'],gs:['455A64','FFFFFF'],gprovenance:['455A64','FFFFFF'],gq:['455A64','FFFFFF']};
 const [fill,ink]=palette[group];
 return theme==='solid'?{fill:'#'+fill,ink:'#'+ink,border:'#FF'+fill}:{fill:theme==='mono'?'#000000':'#00000000',ink:'#FFFFFF',border:theme==='mono'?'#FFFFFFFF':'#FF'+fill};
}
export function buildPresetBadges(theme,preset){
 if(!['solid','transparent','mono'].includes(theme)||!['compact','detailed'].includes(preset))throw new Error('Unknown preset/skin');
 const filters=library.filters.map(original=>{
   const f={...original,type:'filter',isEnabled:true};
   if(f.id==='q-cam')f.groupId='gwarn';
   else if(f.groupId==='gst'&&!editionIds.includes(f.id))f.groupId='gprovenance';
   f.label=LABELS[f.id]??f.name;
   if(sourceAtoms[f.id])f.pattern=plainSource(f.id,preset);
   else f.pattern=v2PatternForBadge(f.id);
   if(f.groupId==='gq'||f.id.endsWith('unranked')||f.groupId==='gc'||f.id==='l-mu')f.isEnabled=false;
   if(preset==='compact'&&['gms','gs','gprovenance'].includes(f.groupId))f.isEnabled=false;
   if(preset==='compact'&&f.id==='v-10bit')f.isEnabled=false;
   if(f.groupId==='gms'&&!f.id.endsWith('unranked')){
     const family=f.id.startsWith('web-')?'web':f.id.startsWith('blu-ray-')?'bluray':'remux';
     const source=family==='web'?M.srcWebdl:family==='bluray'?M.srcBluray:M.srcRemux;
     f.label=(family==='web'?'WEB-DL':family==='bluray'?'BLU-RAY':'REMUX')+' T'+f.id.split('-').at(-1);
     f.pattern+=requireMarker(source)+forbid(M.srcCam);
     if(family==='bluray')f.pattern+=forbid(M.srcRemux);
   }
   return f;
 });
 if(preset==='detailed')for(let n=1;n<=6;n++){
   const f=filters.find(f=>f.id===`web-${n}`);
   filters.push({...f,id:`web-${n}-webrip`,name:`WEBRip T${n}`,label:`WEBRip T${n}`,pattern:v2PatternForBadge(`web-${n}`)+requireMarker(M.srcWebrip)+forbid(M.srcWebdl)+forbid(M.srcCam)});
 }
 for(const f of filters){
   f.name=f.label;
   if(f.id==='v-10bit')f.pattern+=['drDv','drHdr','drHdr10p','visHdr10','visHlg'].map(a=>forbid(M[a])).join('');
   f.pattern=f.pattern.replace('(?s)^','(?s)^'+requireMarker(PRESET_MARKER));
   if(!f.pattern)throw new Error(`Missing pattern ${f.id}`);
   const c=colorsFor(f.groupId,theme);f.tagColor=c.fill;f.borderColor=c.border;f.textColor=c.ink;f.tagStyle='filled';
 }
 filters.sort((a,b)=>groupOrder.indexOf(a.groupId)-groupOrder.indexOf(b.groupId));
 return {filters,groups:groupOrder.map(id=>{const c=colorsFor(id,theme);return{id,name:groups[id],color:c.fill,borderColor:c.border,isExpanded:true};})};
}
