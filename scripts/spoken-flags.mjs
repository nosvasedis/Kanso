/** Shared speech silhouette, with exact flag paths rather than generated emblems. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT} from './icon-cdn.mjs';
export const SPOKEN_FLAGS={EN:'gb',ES:'es',FR:'fr',DE:'de',IT:'it',PT:'pt',TR:'tr',PL:'pl',UK:'ua',ID:'id',TH:'th',VI:'vn',JA:'jp',KO:'kr',ZH:'cn',IN:'in',AR:'sa',RU:'ru',EL:'gr',SV:'se',NL:'nl',DA:'dk',NO:'no',FI:'fi',CS:'cz',SK:'sk',HU:'hu',RO:'ro',BG:'bg',HR:'hr',SR:'rs',SL:'si',ET:'ee',LV:'lv',LT:'lt',HE:'il',FA:'ir',MS:'my'};
export const SPEECH_SHAPE='M12 2H68Q78 2 78 12V38Q78 48 68 48H25L11 59L14 48H12Q2 48 2 38V12Q2 2 12 2Z';
export async function flagArtSvg(code,width=80,height=48){
 const country=SPOKEN_FLAGS[code];if(!country)throw new Error(`Missing flag for ${code}`);
 const original=(await fs.readFile(path.join(ROOT,'assets/flag-sources',country+'.svg'),'utf8')).replace(/<\?xml[^>]*>/,'');
 return original.replace(/<svg\b([^>]*)>/,(_,attrs)=>`<svg ${attrs.replace(/\b(?:width|height)="[^"]*"/g,'')} width="${width}" height="${height}" preserveAspectRatio="none">`);
}
export async function spokenFlagSvg(code){
 const flag=await flagArtSvg(code);
 const {data,info}=await sharp(Buffer.from(flag)).resize(80,48).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const pixel=((info.height-1)*info.width+8)*4;
 const tailColor='#'+[data[pixel],data[pixel+1],data[pixel+2]].map(v=>v.toString(16).padStart(2,'0')).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60"><defs><clipPath id="speech"><path d="${SPEECH_SHAPE}"/></clipPath></defs><g clip-path="url(#speech)"><rect width="80" height="60" fill="${tailColor}"/>${flag}</g></svg>`;
}
export async function subtitleDocumentSvg(code,ink){
 const flag=await flagArtSvg(code,78,56);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="82" height="60" viewBox="0 0 82 60"><defs><clipPath id="captionDocument"><path d="M7 2H62L79 19v34q0 5-5 5H7q-5 0-5-5V7q0-5 5-5z"/></clipPath></defs><g clip-path="url(#captionDocument)"><g transform="translate(2 2)">${flag}</g><rect x="7" y="35" width="37" height="19" rx="4" fill="#151A21" opacity=".7"/><path d="M12 41h26m-26 7h20" stroke="${ink}" stroke-width="3" stroke-linecap="round"/></g><path d="M62 2v17h17" fill="${ink}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
}
