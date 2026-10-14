/** Presentation groups only. Detection tokens and preferred-track selection stay exact. */
export const LANGUAGE_FAMILIES=[
 {id:'l-es',code:'ES',name:'Spanish',members:['l-es','l-lat']},
 {id:'l-pt',code:'PT',name:'Portuguese',members:['l-pt-pt','l-pt-br']},
 {id:'l-in',code:'IN',name:'Indian languages',members:['l-hi','l-bn','l-ta','l-te','l-ml','l-kn','l-mr','l-gu','l-pa']},
];
export const DISPLAY_LANGUAGE_ALIASES=Object.fromEntries(LANGUAGE_FAMILIES.flatMap(g=>g.members.flatMap(id=>[[id,g.id],[id.replace(/^l-/,'sub-'),g.id.replace(/^l-/,'sub-')]])));
export const displayLanguageId=id=>DISPLAY_LANGUAGE_ALIASES[id]??id;
export function languageDisplayInfo(id,label){
 const audioId=id.replace(/^sub-/,'l-');
 const family=LANGUAGE_FAMILIES.find(f=>f.id===audioId);
 return {code:family?.code??label.replace(/ SUB$/,''),name:family?.name??label.replace(/ SUB$/,'')};
}
export function groupLanguageFilters(filters,appearance){
 let out=[...filters];
 for(const group of LANGUAGE_FAMILIES)for(const subtitles of [false,true]){
  const id=subtitles?group.id.replace(/^l-/,'sub-'):group.id;
  const members=group.members.map(m=>subtitles?m.replace(/^l-/,'sub-'):m);
  const matches=out.filter(f=>members.includes(f.id));
  if(!matches.length)continue;
  const base=matches[0];
  const custom=appearance.filters[id];
  const f={...base,id,name:`${group.code}${subtitles?' SUB':''}`,label:`${group.code}${subtitles?' SUB':''}`,description:group.name,
   pattern:'(?s)(?:'+matches.map(f=>f.pattern.replace(/^\(\?s\)/,'')).join('|')+')',
   imageURL:custom?.imageURL??base.imageURL};
  out=out.filter(f=>!members.includes(f.id));out.push(f);
 }
 return out;
}
