/** Real structured inputs exercising every active illustrated badge. */
import fs from 'node:fs';
import {tierRseRuleNames} from './tier-inject-generator.mjs';
import {LANGUAGE_CATALOG, subtitleIdForLanguage} from './language-catalog.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../kanso-solid-detailed.json',import.meta.url),'utf8'));
const extensions={'q-hc':{quality:'HC HD-Rip'},'q-dvd-remux':{quality:'DVD REMUX'},'v-3d-sbs':{visualTags:['3D','H-SBS']},'v-3d-ou':{visualTags:['3D','H-OU']},'a-description':{audioTracks:[{lang:'English',tags:['AAC'],visualImpaired:true}]},'caption-forced':{subtitleTracks:[{lang:'English',forced:true}]},'caption-sdh':{subtitleTracks:[{lang:'English',hearingImpaired:true}]}};
const visual={'v-dv-hdr10p':['DV','HDR10+'],'v-dv-hdr10':['DV','HDR10'],'v-dv-hdr':['DV','HDR'],'a-dv':['DV'],'v-hdr10p':['HDR10+'],'v-hdr10':['HDR10'],'v-hdr':['HDR'],'v-hlg':'HLG','v-10bit':['10bit'],'v-ai':['AI'],'v-sdr':['SDR'],'v-3d':['3D']};
const audio={'a-at-th':['TrueHD','Atmos'],'a-at-dp':['DD+','Atmos'],'a-dtsx-ma':['DTS-HD MA','DTS:X'],'a-dtsx-hd':['DTS-HD','DTS:X'],'a-dtsx':['DTS:X'],'a-dtsma':['DTS-HD MA'],'a-dtshd':['DTS-HD'],'a-dtses':['DTS-ES'],'a-dts':['DTS'],'a-th':['TrueHD'],'a-at':['Atmos'],'a-dp':['DD+'],'a-dd':['DD'],'a-flac':['FLAC'],'a-opus':['OPUS'],'a-aac':['AAC'],'a-mp3':['MP3'],'a-pcm':['PCM']};
const editions={'edition-directors-cut':"Director's Cut",'edition-extended':'Extended','edition-true-hue':'True-Hue','edition-bw':'B&W','edition-theatrical':'Theatrical','open-matte-edition':'Open Matte','uncut-edition':'Uncut','remastered-release':'Remastered','v-imax':'IMAX','v-imax-e':'IMAX Enhanced'};
const flags={'proper-release':'proper','repack-release':'repack','remastered-release':'remastered','regraded-release':'regraded','uncensored-edition':'uncensored','seadex-release':'seadexBest'};
const networks={'s-nflx':'Netflix','s-amzn':'Amazon','s-atvp':'Apple TV','s-dsnp':'Disney','s-hmax':'HBO Max','s-hulu':'Hulu','s-pcok':'Peacock','s-pamp':'Paramount','s-croll':'Crunchyroll'};
const sources={'q-r':'REMUX','q-b':'BluRay','q-w':'WEB-DL','q-wr':'WEBRip','q-cam':'CAM','q-hdtv':'HDTV','q-hdrip':'HDRip','q-dvdrip':'DVDRip','q-scr':'SCR','q-tc':'TC','q-ts':'TS'};
const channels={'ch-81':'8.1','ch-71':'7.1','ch-61':'6.1','ch-60':'6.0','ch-51':'5.1','ch-50':'5.0','ch-40':'4.0','ch-30':'3.0','ch-21':'2.1','ch-20':'2.0','ch-10':'1.0'};
const encoders={'ge-av1':'av1','ge-hevc':'hevc','ge-avc':'avc','ge-xvid':'xvid','ge-divx':'divx'};
const languages={...Object.fromEntries(LANGUAGE_CATALOG.map(l=>[l.id,l.tokens[0]])),'l-in':'Hindi','l-pt':'Portuguese'};
export const coverageFixtures=pack.filters.map(({id})=>{
 const f={label:`inventory ${id}`,parsed:{},common:[id]};
 if(extensions[id])f.parsed=extensions[id];
 else if(visual[id])f.parsed.visualTags=Array.isArray(visual[id])?visual[id]:[visual[id]];
 else if(audio[id]){const [tag,title]=audio[id];f.parsed.audioTracks=[{lang:'English',tag,channels:'5.1',...(title?{title}:{})}];}
 else if(editions[id])f.parsed.editions=[editions[id]];
 else if(id==='seadex-release')f.flags={seadex:{isBest:true,isSeadex:true}};
 else if(flags[id])f.parsed[flags[id]]=true;
 else if(networks[id])f.parsed.network=networks[id];
 else if(sources[id])f.parsed.quality=sources[id];
 else if(id.startsWith('r-'))f.parsed.resolution=id==='r-4k'?'2160p':id.split('-')[1]+'p';
 else if(/^(web|blu-ray|remux)-\d/.test(id)){const base=id.replace(/-webrip$/,'');f.parsed.quality=id.startsWith('remux-')?'REMUX':id.startsWith('blu-ray-')?'BluRay':id.endsWith('-webrip')?'WEBRip':'WEB';f.rse=[tierRseRuleNames(base)[0]];}
 else if(['hybrid-release','criterion-collection'].includes(id)){f.parsed.quality='WEB';f.file=`Movie.1080p.WEB-DL.${id==='hybrid-release'?'HYBRID':'CRITERION'}.mkv`;}
 else if(channels[id]){f.parsed.audioTracks=[{lang:'English',tag:'AAC',channels:channels[id]}];}
 else if(encoders[id]){f.parsed.encode=encoders[id];}
 else if(languages[id]){f.prefs=[languages[id]];f.parsed.audioTracks=[{lang:languages[id],tag:'AAC'}];}
 else if(id.startsWith('sub-')){
   const lang=LANGUAGE_CATALOG.find(l=>subtitleIdForLanguage(l.id)===(id==='sub-in'?'sub-hi':id==='sub-pt'?'sub-pt-pt':id));
   f.prefs=[lang.tokens[0]];
   f.parsed.subtitles=[lang.tokens[0]];
 }
 else throw new Error(`Missing real metadata fixture for ${id}`);
 return f;
});

/** Information owned by the image, including its combined format artwork. */
export const audioBadgeFacts=audio;
