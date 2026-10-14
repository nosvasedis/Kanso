import {applyTransparentTheme} from './badge-transparent-theme.mjs';
import {borderArgb,chromeRgb6} from './badge-chrome-map.mjs';
import {contrast} from './badge-color-utils.mjs';
export {contrast,luminance} from './badge-color-utils.mjs';
export const OUTLINE_PALETTE={gst:'C4B5FD',gms:'79B4FF',grl:'B5C2D2',gv:'F6D365',ga:'65D8E8',gc:'72C4D2',gl:'E0A5EC',gsub:'BAA4E6'};
export const SOURCE_COLORS={'q-hc':'E5B786','q-dvd-remux':'CDB29C','q-w':'8DC4FF','q-wr':'66D6E8','q-r':'BCA5FF','q-b':'7FABFF','q-hdtv':'77CEDD','q-hdrip':'AABBD0','q-dvdrip':'D2B792','q-cam':'FFB4A8','q-ts':'FFB4A8','q-tc':'FFB4A8','q-scr':'FFB4A8'};
export function readableBrand(rgb){
 const src=rgb.match(/../g).map(h=>parseInt(h,16));
 for(let t=0;t<=100;t++){
  const result=src.map(v=>Math.round(v+(255-v)*t/100).toString(16).padStart(2,'0')).join('').toUpperCase();
  if(contrast(result)>=5)return result;
 }
 return'FFFFFF';
}
export function outlineRgb6(id,group){
 if(['v-imax','v-imax-e','v-3d','v-3d-sbs','v-3d-ou'].includes(id))return OUTLINE_PALETTE.gv;
 if(group==='gst')return readableBrand(chromeRgb6(id,group));
 if(group==='grl')return SOURCE_COLORS[id]??OUTLINE_PALETTE.grl;
 if(group==='gms')return id.startsWith('web-')?SOURCE_COLORS[id.endsWith('-webrip')?'q-wr':'q-w']:SOURCE_COLORS[id.startsWith('blu-ray-')?'q-b':'q-r'];
 if(group==='gs')return id==='s-atvp'?'CDD3DB':readableBrand(chromeRgb6(id,group));
 if(group==='gr')return id==='r-4k'?'66DEAC':['r-1440','r-1080'].includes(id)?'FFD166':'FFA18C';
 return OUTLINE_PALETTE[group]??'B5C2D2';
}
export function applyOutlineTheme(f){applyTransparentTheme(f);const rgb=outlineRgb6(f.id,f.groupId);f.borderColor=borderArgb(rgb);f.textColor='#'+rgb;return f;}
