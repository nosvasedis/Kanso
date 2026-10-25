import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CustomFormatter } from '../.vendor/AIOStreams/packages/core/src/formatters/custom.ts';
import { validateTemplate } from '../.vendor/AIOStreams/packages/core/src/formatters/engine/parser.ts';
import { buildPresetFormatter, PRESET_MARKER, TITLE_LTR_ANCHOR } from './preset-formatter.mjs';
import { RETIRED_BADGE_IDS } from './retired-badges.mjs';
import {coverageFixtures,audioBadgeFacts} from './preset-coverage-fixtures.mjs';
import { nuvioHaystacks,nuvioRegex } from './benchmark-badge-patterns.mjs';
import { displayLanguageId } from './display-language-families.mjs';
import {LANGUAGE_CATALOG} from './language-catalog.mjs';
const clean=(s:string)=>s.replace(/[\u180b-\u180d\u200b-\u200f\u2060-\u206f\ufeff]/g,'');
type FX={label:string;file?:string;parsed?:any;prefs?:string[];required?:string[];included?:string[];originalLanguage?:string;type?:string;cache?:boolean|null;service?:boolean;score?:number;rse?:string[];anime?:boolean;flags?:any;common?:string[];compact?:string[];detailed?:string[];forbid?:string[];text?:string[];absent?:string[];detailText?:string[];descriptionAbsent?:string[]};
const fx:FX[]=[
 ...['3.0','4.0','5.0','6.0'].flatMap(ch=>{
   const id='ch-'+ch.replace('.','');
   return [
    {label:`exact selected track ${ch}`,parsed:{audioTracks:[{lang:'English',tag:'AAC',channels:ch}],audioChannels:['7.1']},common:[id]},
    {label:`file-level ${ch} unordered layouts`,parsed:{audioChannels:['2.0',ch]},common:[id]},
    {label:`file-level ${ch} reversed layouts`,parsed:{audioChannels:[ch,'2.0']},common:[id]},
   ];
 }),
 {label:'6.0 wins over 5.1 at file level',parsed:{audioChannels:['5.1','6.0']},common:['ch-60'],forbid:['ch-51']},
 {label:'6.1 remains distinct from 6.0',parsed:{audioChannels:['6.0','6.1']},common:['ch-61'],forbid:['ch-60']},
 {label:'unknown track 15.0 does not become 5.0',parsed:{audioTracks:[{lang:'English',tag:'AAC',channels:'15.0'}]},forbid:['ch-50','ch-51']},
 {label:'unknown file layouts do not become known layouts',parsed:{audioChannels:['15.0','6.01','9.1']},forbid:['ch-50','ch-60','ch-61','ch-51']},
 {label:'preferred 4.0 is not borrowed from another track',parsed:{audioTracks:[{lang:'Japanese',tag:'FLAC',channels:'7.1'},{lang:'English',tag:'AAC',channels:'4.0'}]},common:['ch-40','a-aac'],forbid:['ch-71','a-flac']},
 ...['debrid','usenet','stremio-usenet','http','p2p','live','youtube','archive','external'].flatMap(type=>[true,false,null].map(cache=>({label:`cache row ${type}/${cache}`,type,cache,parsed:{container:'mkv',encode:'hevc'},text:[type==='debrid'?`${cache===true?'⚡':cache===false?'⏳':'❔'} · 📦 MKV · 🎞️ HEVC`:'📦 MKV · 🎞️ HEVC'],...(type==='debrid'?{}:{absent:['⚡','⏳','❔']})}))),
 ...Array.from({length:16},(_,bits)=>({label:`conditional release separators ${bits}`,parsed:{...(bits&1?{container:'mkv'}:{}),...(bits&2?{encode:'hevc'}:{}),...(bits&4?{releaseGroup:'GROUP'}:{}),...(bits&8?{country:'US'}:{})}})),
 {label:'debrid cache alone has no dot',flags:{size:undefined,addon:undefined},service:false,text:['❔'],descriptionAbsent:['·']},
 {label:'multi-tag DD+ Atmos without title',parsed:{audioTracks:[{lang:'English',tags:['DD+','Atmos'],channels:'5.1'}]},common:['a-at-dp','ch-51','l-en'],forbid:['a-at','a-dp']},
 {label:'multi-tag TrueHD Atmos without title',parsed:{audioTracks:[{lang:'English',tags:['TrueHD','Atmos']}]},common:['a-at-th'],forbid:['a-th','a-at']},
 {label:'multi-tag DTS:X MA without title',parsed:{audioTracks:[{lang:'English',tags:['DTS-HD MA','DTS:X']}]},common:['a-dtsx-ma'],forbid:['a-dtsma','a-dtsx']},
 {label:'multi-tag codec stays selected',prefs:['English'],parsed:{audioTracks:[{lang:'Japanese',tags:['TrueHD','Atmos']},{lang:'English',tags:['AAC']}]},common:['a-aac','l-en'],forbid:['a-at-th','l-ja']},
 {label:'audio description selected flag',parsed:{audioTracks:[{lang:'English',tags:['AAC'],visualImpaired:true}]},common:['a-description','a-aac']},
 {label:'audio description selected title',parsed:{audioTracks:[{lang:'English',tags:['AAC'],title:'English Audio Description'}]},common:['a-description']},
 {label:'nonselected description does not claim AD',parsed:{audioTracks:[{lang:'English',tags:['AAC']},{lang:'English',tags:['AAC'],visualImpaired:true}]},forbid:['a-description']},
 {label:'commentary description excluded',parsed:{audioTracks:[{lang:'English',tags:['AAC'],commentary:true,visualImpaired:true},{lang:'English',tags:['AAC']}]},forbid:['a-description']},
 {label:'forced and SDH subtitles selected',prefs:['Greek'],parsed:{subtitleTracks:[{lang:'Greek',forced:true,hearingImpaired:true}]},common:['caption-forced','caption-sdh']},
 {label:'subtitle titles provide accessibility',prefs:['Greek'],parsed:{subtitleTracks:[{lang:'Greek',title:'GREEK SDH FORCED'}]},common:['caption-forced','caption-sdh']},
 {label:'other language accessibility stays dark',prefs:['Greek'],parsed:{subtitleTracks:[{lang:'English',forced:true,hearingImpaired:true}]},forbid:['caption-forced','caption-sdh']},
 {label:'no subtitle preference shows known accessibility',prefs:[],parsed:{subtitleTracks:[{lang:'English',forced:true}]},common:['caption-forced']},
 {label:'DVD remux cannot claim Blu-ray tiers',parsed:{quality:'DVD REMUX',releaseGroup:'FraMeSToR'},common:['q-dvd-remux'],forbid:['q-r','q-b','remux-1','blu-ray-1']},
 {label:'hardcoded source has specific artwork',parsed:{quality:'HC HD-Rip'},common:['q-hc'],forbid:['q-hdrip']},
 {label:'SBS replaces generic 3D',parsed:{visualTags:['3D','H-SBS']},common:['v-3d-sbs'],forbid:['v-3d']},
 {label:'OU replaces generic 3D',parsed:{visualTags:['3D','H-OU']},common:['v-3d-ou'],forbid:['v-3d']},
 {label:'conflicting 3D layouts cannot claim either layout',parsed:{visualTags:['3D','H-SBS','H-OU']},forbid:['v-3d-sbs','v-3d-ou','v-3d']},
 {label:'8.1 is not mislabeled 7.1',parsed:{audioTracks:[{lang:'English',tag:'AAC',channels:'8.1'}]},common:['ch-81'],forbid:['ch-71','ch-51','ch-20']},
 {label:'mono 1.0 stays mono',parsed:{audioTracks:[{lang:'English',tag:'PCM',channels:'1.0'}]},common:['ch-10'],forbid:['ch-20']},
 {label:'2.1 stays separate from stereo',parsed:{audioTracks:[{lang:'English',tag:'AAC',channels:'2.1'}]},common:['ch-21'],forbid:['ch-20']},
 {label:'file channel precedence includes new layouts',parsed:{audioChannels:['1.0','2.1','8.1','7.1']},common:['ch-81'],forbid:['ch-71','ch-21','ch-10']},
 ...LANGUAGE_CATALOG.filter(l=>['l-hi','l-bn','l-ta','l-te','l-ml','l-kn','l-mr','l-gu','l-pa'].includes(l.id)).map(l=>({label:`Indian family retains ${l.tokens[0]} preference`,prefs:[l.tokens[0]],parsed:{audioTracks:[{lang:l.tokens[0],tag:'AAC'}],subtitles:[l.tokens[0]]},common:['l-in','sub-in']})),
 ...LANGUAGE_CATALOG.filter(l=>['l-es','l-lat','l-pt-br','l-pt-pt'].includes(l.id)).map(l=>({label:`Regional family retains ${l.tokens[0]} preference`,prefs:[l.tokens[0]],parsed:{audioTracks:[{lang:l.tokens[0],tag:'AAC'}],subtitles:[l.tokens[0]]},common:[displayLanguageId(l.id),displayLanguageId(l.id.replace(/^l-/,'sub-'))]})),
 {label:'Indian badge does not bypass Hindi audio preference',prefs:['Hindi'],parsed:{audioTracks:[{lang:'Tamil',tag:'AAC'}],subtitles:['Tamil']},forbid:['l-in','sub-in'],text:['Preferred audio missing']},
 {label:'4K WEB DV HDR10+ Atmos',file:'Movie.2160p.AMZN.WEB-DL.DDP.Atmos.FLUX.mkv',parsed:{quality:'WEB',resolution:'2160p',encode:'hevc',container:'mkv',visualTags:['DV','HDR10+'],audioTags:['Atmos','DD+'],audioChannels:['5.1'],languages:['English'],network:'Amazon',releaseGroup:'FLUX',mediaInfoQuality:'probe'},common:['r-4k','l-en','v-dv-hdr10p','a-at-dp','ch-51'],compact:['q-w'],detailed:['web-1','s-amzn'],forbid:['v-hdr10p','a-at','a-dp','q-gw','ge-hevc','ge-av1','ge-avc'],text:['📦 MKV · 🎞️ HEVC · 👥 FLUX','💾','⚡','☁️ RD','🧩'],absent:['✅','🔊','🎧','…']},
 {label:'unknown remux range',parsed:{quality:'REMUX',resolution:'2160p'},common:['r-4k','q-r'],forbid:['v-hdr','v-sdr']},
 {label:'explicit SDR remux',parsed:{quality:'REMUX',resolution:'2160p',visualTags:['SDR']},common:['v-sdr','q-r'],forbid:['v-hdr']},
 {label:'HLG is not generic HDR',parsed:{quality:'REMUX',resolution:'2160p',visualTags:['HLG']},common:['v-hlg'],forbid:['v-hdr','v-sdr']},
 {label:'conflicting HDR SDR',parsed:{visualTags:['HDR','SDR']},forbid:['v-hdr','v-sdr'],text:['⚠️ HDR/SDR conflict']},
 {label:'DV HDR10 evidenced combination',parsed:{visualTags:['DV','HDR10']},common:['v-dv-hdr10'],forbid:['a-dv','v-hdr10']},
 {label:'DV only',parsed:{visualTags:['DV']},common:['a-dv'],forbid:['v-hdr']},
 {label:'HDR10+ only',parsed:{visualTags:['HDR10+']},common:['v-hdr10p'],forbid:['v-hdr','v-hdr10']},
 {label:'SDR 10bit detail',parsed:{visualTags:['SDR','10bit']},common:['v-sdr'],detailed:['v-10bit'],forbid:['v-hdr']},
 {label:'HDR does not also show 10bit',parsed:{visualTags:['HDR10','10bit']},common:['v-hdr10'],forbid:['v-10bit']},
 {label:'English AAC vs Japanese FLAC',prefs:['English'],parsed:{quality:'WEB',resolution:'1080p',languages:['English','Japanese'],audioTags:['FLAC','AAC'],audioChannels:['5.1','2.0'],audioTracks:[{lang:'Japanese',codec:'flac',tag:'FLAC',channels:'5.1',default:true},{lang:'English',codec:'aac',tag:'AAC',channels:'2.0'}],mediaInfoQuality:'probe'},common:['l-en','a-aac','ch-20'],forbid:['l-ja','a-flac','ch-51'],absent:['🇬🇧','🇯🇵','JA: FLAC 5.1']},
 {label:'commentary is not selected',parsed:{audioTracks:[{lang:'English',tag:'FLAC',commentary:true},{lang:'English',tag:'AAC',channels:'2.0'}]},common:['l-en','a-aac'],forbid:['a-flac']},
 {label:'commentary title is not selected',parsed:{audioTracks:[{lang:'English',tag:'FLAC',title:'Director commentary'},{lang:'English',tag:'AAC'}]},common:['a-aac'],forbid:['a-flac']},
 {label:'preferred language absent',parsed:{languages:['Japanese'],audioTracks:[{lang:'Japanese',tag:'FLAC'}],mediaInfoQuality:'probe'},forbid:['l-en','l-ja','a-flac'],text:['Preferred audio missing']},
 {label:'no preferences chooses first usable track',prefs:[],parsed:{audioTracks:[{lang:'French',tag:'AAC'},{lang:'English',tag:'FLAC',default:true}]},common:['l-fr','a-aac'],detailed:['l-en'],forbid:['a-flac']},
 {label:'single track Atmos association',parsed:{audioTracks:[{lang:'English',tag:'TrueHD',codec:'truehd',channels:'7.1'}],audioTags:['TrueHD','Atmos']},common:['l-en','a-at-th','ch-71'],forbid:['a-at','a-th']},
 {label:'do not borrow another track Atmos',parsed:{audioTracks:[{lang:'English',tag:'AAC'},{lang:'Japanese',tag:'TrueHD',title:'Atmos'}],audioTags:['TrueHD','Atmos','AAC']},common:['l-en','a-aac'],forbid:['a-at','a-at-th']},
 {label:'missing tag uses track codec',parsed:{audioTracks:[{lang:'English',codec:'eac3'}]},common:['a-dp','l-en']},
 {label:'Japanese preferences respected',prefs:['Japanese'],parsed:{audioTracks:[{lang:'English',tag:'AAC'},{lang:'Japanese',tag:'FLAC'}]},common:['l-ja','a-flac'],forbid:['l-en','a-aac']},
 {label:'English subtitle token is not audio proof',file:'Movie.1080p.WEB-DL.Eng.Sub.mkv',parsed:{quality:'WEB',resolution:'1080p',languages:['English']},forbid:['l-en']},
 {label:'probed Greek subtitles distinct from audio',prefs:['English','Greek'],parsed:{quality:'WEB',languages:['English'],subtitles:['Greek'],mediaInfoQuality:'probe'},common:['sub-el'],forbid:['l-el'],absent:['💬 ELˢ','🇬🇷']},
 {label:'Greek audio is not subtitle cue',prefs:['Greek'],parsed:{languages:['Greek'],mediaInfoQuality:'probe',audioTracks:[{lang:'Greek',tag:'AAC'}]},common:['l-el'],forbid:['sub-el'],absent:['💬 ELˢ']},
 {label:'subtitle only has no leading separator',prefs:['Greek'],flags:{size:undefined},parsed:{subtitles:['Greek']},common:['sub-el'],absent:['💬 ELˢ']},
 {label:'library only has no leading separator',flags:{size:undefined,proxied:undefined,library:true},detailText:['Library']},
 {label:'reported Greek subtitles not audio cue',file:'Movie.1080p.WEB-DL.Ell.Sub.mkv',parsed:{quality:'WEB',resolution:'1080p',languages:['Greek']},forbid:['l-el','sub-el'],absent:['💬 ELˢ']},
 {label:'trusted language beats filename',file:'Movie.English.1080p.WEB-DL.mkv',prefs:['French'],parsed:{languages:['French'],mediaInfoQuality:'indexer'},common:['l-fr'],forbid:['l-en']},
 {label:'missing preferred probed language',parsed:{languages:['Russian'],mediaInfoQuality:'probe'},forbid:['l-ru'],text:['Preferred audio missing']},
 {label:'parsed resolution beats filename',file:'Movie.2160p.WEB-DL.mkv',parsed:{quality:'WEB',resolution:'1080p'},common:['r-1080'],forbid:['r-4k']},
 {label:'movie title not technical metadata',file:'Atmos.WEBRip.UHD.2026.mkv',parsed:{title:'Atmos.WEBRip.UHD.2026'},forbid:['a-at','q-wr','r-4k']},
 {label:'release group named Atmos not codec',file:'Movie.1080p.WEB-DL-Atmos.mkv',parsed:{quality:'WEB',resolution:'1080p',releaseGroup:'Atmos'},forbid:['a-at']},
 {label:'source remux beats Bluray',file:'Movie.2160p.BluRay.REMUX.mkv',parsed:{quality:'REMUX',resolution:'2160p',releaseGroup:'EPSiLON'},compact:['q-r'],detailed:['remux-2'],forbid:['q-b','blu-ray-1','blu-ray-unranked']},
 {label:'tier multi-match best wins',parsed:{quality:'WEB'},rse:['Radarr Web T1','Sonarr Web T2'],compact:['q-w'],detailed:['web-1'],forbid:['web-2']},
 {label:'custom ranking does not invent tiers',parsed:{quality:'WEB',releaseGroup:'FLUX'},rse:['Netflix preference'],common:['q-w'],forbid:['web-1']},
 {label:'unranked source is one badge',parsed:{quality:'WEB',releaseGroup:'Unknown'},common:['q-w'],forbid:['web-unranked']},
 {label:'anime does not borrow movie group tier',anime:true,parsed:{quality:'BluRay',releaseGroup:'Moxie'},common:['q-b'],forbid:['blu-ray-1','blu-ray-2']},
 {label:'WebRip tier label preserves actual source',file:'Movie.1080p.WEBRip.FLUX.mkv',parsed:{quality:'WEB',resolution:'1080p',releaseGroup:'FLUX'},compact:['q-wr'],detailed:['web-1-webrip'],forbid:['web-1','q-w']},
 {label:'CAM warning retained',parsed:{quality:'CAM',resolution:'1080p'},common:['q-cam','r-1080'],forbid:['q-w','q-gw']},
 {label:'telesync is a source chip',parsed:{quality:'TS'},common:['q-ts'],absent:['📹 Telesync']},
 {label:'telecine is a source chip',parsed:{quality:'TC'},common:['q-tc'],absent:['📹 Telecine']},
 {label:'screener is a source chip',parsed:{quality:'SCR'},common:['q-scr'],absent:['📼 Screener']},
 {label:'structured WebRip without filename',parsed:{quality:'WEBRip'},common:['q-wr'],forbid:['q-w']},
 {label:'structured WEB-DL beats filename',file:'Movie.1080p.WEBRip.mkv',parsed:{quality:'WEB-DL'},common:['q-w'],forbid:['q-wr']},
 {label:'mixed filename delimiters remain bounded',file:'Movie_1080p WEB-DL_AAC.mkv',parsed:{quality:'WEB',resolution:'1080p'},common:['q-w','a-aac'],forbid:['q-wr']},
 {label:'technical movie title cannot claim Atmos',file:'Some.Atmos.Movie.1080p.WEB-DL.mkv',parsed:{title:'Some.Atmos.Movie',quality:'WEB',resolution:'1080p'},forbid:['a-at']},
 {label:'extended and IMAX retained',parsed:{editions:['Extended','IMAX'],quality:'WEB'},common:['edition-extended','v-imax']},
 {label:'IMAX Enhanced distinct',parsed:{editions:['IMAX Enhanced']},common:['v-imax-e'],forbid:['v-imax']},
 {label:'B&W and 3D retained',parsed:{editions:['B&W'],visualTags:['3D']},common:['edition-bw','v-3d']},
 {label:'unsupported cut has contextual filename fallback',file:'Movie.1080p.WEB-DL.Directors.Cut.mkv',parsed:{quality:'WEB',resolution:'1080p'},common:['edition-directors-cut']},
 {label:'parsed edition beats conflicting filename',file:'Movie.1080p.WEB-DL.Directors.Cut.mkv',parsed:{quality:'WEB',editions:['Extended']},common:['edition-extended'],forbid:['edition-directors-cut']},
 {label:'remastered edition is a special',parsed:{editions:['Remastered']},common:['remastered-release']},
 {label:'named Uncut movie is not an edition',file:'The.Uncut.Movie.1080p.WEB-DL.mkv',parsed:{title:'The.Uncut.Movie',quality:'WEB',resolution:'1080p'},forbid:['uncut-edition']},
 {label:'cache false',cache:false,text:['⏳'],absent:['Uncached','✅']},
 {label:'cache unknown',cache:null,text:['❔'],absent:['Cache unknown']},
 {label:'HTTP is not debrid cache',type:'http',service:false,text:['🌐'],absent:['Cached','Uncached','Cache unknown']},
 {label:'P2P swarm',type:'p2p',service:false,flags:{torrent:{seeders:125}},text:['🧲','🌱 125']},
 {label:'Usenet health warning preserved',type:'usenet',flags:{message:'NZB Health: ⚠️ missing blocks'},text:['⚠️ missing blocks'],absent:['💬','NZB Health:']},
 {label:'upstream bad-release warning preserved',flags:{regexMatched:{name:'Bad release'}},text:['🚩 Bad release'],absent:['Release warning']},
 {label:'Tamtaro exact bad dual reason',flags:{regexMatched:{name:'Radarr Bad Dual Groups'}},text:['🚩 Bad Dual Groups'],absent:['Radarr','Release warning']},
 {label:'ranked bad rule reason',flags:{rankedRegexesMatched:['Sonarr Bad WEB Groups']},text:['🚩 Bad WEB Groups'],absent:['Sonarr','Release warning']},
 {label:'case insensitive bad reason',flags:{regexMatched:{name:'bad audio sync'}},text:['🚩 bad audio sync']},
 {label:'positive release rule stays quiet',flags:{regexMatched:{name:'Radarr Remux Tier 1'}},absent:['🚩']},
 {label:'failed health details preserved',type:'usenet',flags:{message:'NZB Health: 🚫 missing 12 blocks'},text:['❌ missing 12 blocks'],absent:['💬','NZB Health:']},
 {label:'ordinary provider message preserved',flags:{message:'Download pending; retry in 30 seconds'},text:['💬 Download pending; retry in 30 seconds']},
 {label:'same English language flag once',prefs:['English','Greek'],parsed:{quality:'REMUX',resolution:'2160p',container:'mkv',releaseGroup:'FraMeSToR',encode:'hevc',subtitles:['Greek'],audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1',title:'Atmos'},{lang:'English',tag:'DD',channels:'5.1'}]},common:['a-at-th','l-en','sub-el','ch-71'],forbid:['ge-hevc'],text:['📦 MKV · 🎞️ HEVC · 👥 FraMeSToR'],absent:['🎧','🇬🇧','💬 ELˢ','7.1','…']},
 {label:'specific reason with grouped audio and bottom subtitles',prefs:['English','Greek'],type:'usenet',flags:{regexMatched:{name:'Radarr Bad Dual Groups'},message:'NZB Health: ⚠️ missing blocks',bitrate:66e6,age:86,indexer:'altHUB',addon:{name:'altHUB'},size:50.6e9},parsed:{quality:'REMUX',resolution:'2160p',releaseGroup:'FraMeSToR',encode:'hevc',subtitles:['Greek'],visualTags:['DV','HDR10'],audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1',title:'Atmos'},{lang:'English',tag:'DD',channels:'5.1'}]},common:['a-at-th','v-dv-hdr10','l-en','sub-el'],text:['🚩 Bad Dual Groups','⚠️ missing blocks'],absent:['🎧','🇬🇧','💬 ELˢ','Release warning']},
 {label:'four tracks keep language transitions',prefs:['English','Greek'],parsed:{audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1'},{lang:'English',tag:'DD',channels:'5.1'},{lang:'Greek',tag:'AAC',channels:'2.0'},{lang:'Greek',tag:'DD+',channels:'5.1'},{lang:'English',tag:'FLAC'}]},common:['a-th','l-en','ch-71'],detailed:['l-el'],forbid:['a-flac'],absent:['🎧','🇬🇧','🇬🇷','FLAC']},
 {label:'returning language flag keeps association',prefs:['English','Greek'],parsed:{audioTracks:[{lang:'English',tag:'TrueHD'},{lang:'Greek',tag:'AAC'},{lang:'English',tag:'DD'}]},common:['a-th','l-en'],detailed:['l-el'],absent:['🎧','🇬🇧','🇬🇷']},
 {label:'commentary exclusion does not repeat language',parsed:{audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1'},{lang:'English',tag:'FLAC',commentary:true},{lang:'English',tag:'DD',channels:'5.1'}]},common:['a-th','l-en','ch-71'],forbid:['a-flac'],absent:['🎧','FLAC']},
 {label:'upscaled flag stays visible',parsed:{upscaled:true},text:['Upscaled']},
 {label:'Detailed delivery diagnostics',parsed:{encode:'hevc',container:'mkv',releaseGroup:'GROUP'},flags:{bitrate:30e6,age:24,indexer:'NZBGeek',torrent:{private:true,freeleech:true}},forbid:['ge-hevc'],text:['📦 MKV · 🎞️ HEVC · 👥 GROUP'],detailText:['NZBGeek','🔐','🆓'],absent:['Private','Freeleech']},
 {label:'season pack and folder size retained',parsed:{seasonPack:true},flags:{folderSize:100e9},text:['📚 Pack','📁']},
 {label:'pack alone has no trailing separator',parsed:{seasonPack:true},service:false,flags:{size:undefined,addon:undefined},text:['📚 Pack'],absent:['Season pack','📁','💾']},
 {label:'identical folder size is redundant',flags:{folderSize:18.2e9},text:['💾'],absent:['📁']},
 {label:'folder size without file size remains visible',flags:{folderSize:100e9,size:undefined},text:['📁'],absent:['💾']},
 {label:'zero folder size stays quiet',flags:{folderSize:0},absent:['📁']},
 {label:'cached debrid does not need swarm count',flags:{torrent:{seeders:125}},absent:['🌱','seeders']},
 {label:'uncached debrid keeps compact swarm count',cache:false,flags:{torrent:{seeders:125}},text:['🌱 125'],absent:['seeders']},
 {label:'zero seeders has no orphan sprout',type:'p2p',service:false,flags:{torrent:{seeders:0}},absent:['🌱','seeders']},
 {label:'library wins over preload',flags:{library:true,preloading:true},detailText:['Library'],absent:['Preloading']},
 {label:'preloading distinct',flags:{library:false,preloading:true},detailText:['⬇️ Preload'],absent:['Preloading']},
 {label:'empty stream has no punctuation',flags:{size:undefined},service:false,absent:['\n\n']},
 {label:'commentary only has no orphan headphones',parsed:{audioTracks:[{lang:'English',tag:'AAC',commentary:true}]},text:['Preferred audio missing'],absent:['🎧'],forbid:['a-aac','l-en']},
 {label:'unknown channels stay quiet',parsed:{audioChannels:[]},absent:['🔊'],forbid:['ch-51','ch-20']},
 {label:'missing addon has no orphan puzzle',flags:{addon:undefined},absent:['🧩']},
 {label:'proxy without addon retains shield',flags:{addon:undefined,proxied:true},text:['🛡️'],absent:['🧩']},
 {label:'multiple file channels are compact values',parsed:{audioChannels:['5.1','2.0']},common:['ch-51'],forbid:['ch-20'],absent:['🔊']},
 {label:'two preferred languages exclude an unrelated track',prefs:['English','Greek'],parsed:{languages:['English','Greek','Japanese'],mediaInfoQuality:'probe',audioTracks:[{lang:'English',tag:'DD+',channels:'5.1'},{lang:'Greek',tag:'AAC',channels:'2.0'},{lang:'Japanese',tag:'FLAC',channels:'7.1'}]},common:['a-dp','l-en','ch-51'],detailed:['l-el'],forbid:['l-ja','a-flac'],absent:['🇬🇧','🇯🇵','🇬🇷','JA: FLAC']},
 {label:'non-preferred file languages stay dark',prefs:['English'],parsed:{languages:['English','Japanese','French','Spanish','German'],mediaInfoQuality:'probe',audioTracks:[{lang:'English',tag:'AAC',channels:'2.0'},{lang:'Japanese',tag:'FLAC'},{lang:'French',tag:'DD+'},{lang:'Spanish',tag:'AAC'},{lang:'German',tag:'AAC'}]},common:['l-en','a-aac','ch-20'],forbid:['l-ja','l-fr','l-es','l-de','a-flac','a-dp']},
 {label:'non-preferred file subtitles stay dark',prefs:['English'],parsed:{languages:['English'],subtitles:['English','Spanish','French','German','Japanese','Polish','Arabic','Chinese'],audioTracks:[{lang:'English',tag:'AAC'}],mediaInfoQuality:'probe'},common:['l-en','sub-en','a-aac'],forbid:['sub-es','sub-fr','sub-de','sub-ja','sub-pl','sub-ar','sub-zh','l-es','l-fr','l-ja']},
 {label:'preferred subtitle only among many',prefs:['English','Greek'],parsed:{subtitles:['Greek','Spanish','French','German','Japanese'],audioTracks:[{lang:'English',tag:'AAC'}],mediaInfoQuality:'probe'},common:['l-en','sub-el','a-aac'],forbid:['sub-es','sub-fr','sub-de','sub-ja','l-el','l-es']},
 {label:'concatenated MULTI language dump does not light the catalog',prefs:['English','Greek'],parsed:{audioTracks:[{lang:'English, Japanese, French, Spanish, German, Italian, Portuguese, Russian, Korean, Chinese',tag:'AAC'}],mediaInfoQuality:'probe'},forbid:['l-ja','l-fr','l-es','l-de','l-it','l-pt-pt','l-ru','l-ko','l-zh']},
 {label:'Swedish works without a legacy flag badge',prefs:['Swedish'],parsed:{audioTracks:[{lang:'Swedish',tag:'AAC',channels:'2.0'}]},common:['a-aac','l-sv','ch-20'],absent:['🇸🇪']},
 {label:'placeholder languages do not become preferred flags',prefs:['English','Original','Multi','Dubbed','Unknown'],parsed:{languages:['Multi','Dubbed','Unknown'],mediaInfoQuality:'indexer'},absent:['🎧','🇬🇧','Preferred audio missing'],forbid:['l-en']},
 {label:'Tamtaro Original resolves to the media language',prefs:['English','Original','Multi','Dual Audio','Dubbed','Unknown'],originalLanguage:'Japanese',parsed:{languages:['Japanese'],mediaInfoQuality:'probe',audioTracks:[{lang:'Japanese',tag:'FLAC'}]},common:['a-flac','l-ja'],absent:['🇯🇵']},
 {label:'required languages participate in the AIO preference context',prefs:['English'],required:['Greek'],parsed:{languages:['Greek'],mediaInfoQuality:'indexer',audioTracks:[{lang:'Greek',tag:'AAC'}]},common:['l-el'],forbid:['l-en'],absent:['🇬🇷']},
 {label:'flat preferred order is respected',prefs:['Greek','English'],parsed:{languages:['English','Greek'],mediaInfoQuality:'probe',audioTracks:[{lang:'Greek',tag:'AAC'},{lang:'English',tag:'AAC'}]},common:['l-el','a-aac'],detailed:['l-en'],absent:['🇬🇷','🇬🇧']},
 {label:'uncertain language metadata stays quiet',prefs:['English'],parsed:{languages:['English'],mediaInfoQuality:'filename'},absent:['🎧','🇬🇧'],forbid:['l-en']},
 {label:'Tamtaro English DD+ 5.1 without duplicate flags',prefs:['English','Original','Multi','Dual Audio','Dubbed','Unknown'],originalLanguage:'English',parsed:{quality:'WEB',resolution:'2160p',encode:'hevc',container:'mkv',releaseGroup:'FLUX',network:'Amazon',visualTags:['DV','HDR10+'],languages:['English','Japanese'],mediaInfoQuality:'probe',audioTags:['DD+','Atmos','FLAC'],audioTracks:[{lang:'Japanese',tag:'FLAC',channels:'7.1'},{lang:'English',codec:'eac3',tag:'DD+',channels:'5.1',title:'Main Atmos'}]},common:['r-4k','v-dv-hdr10p','a-at-dp','l-en','ch-51'],compact:['q-w'],detailed:['web-1','s-amzn'],forbid:['ge-hevc'],text:['📦 MKV · 🎞️ HEVC · 👥 FLUX'],absent:['🇬🇧','🇯🇵','JA: FLAC']},
 {label:'rank score does not change badge opinion',score:100,parsed:{quality:'WEB',resolution:'1080p'},common:['q-w','r-1080'],forbid:['q-bw','q-gw','q-ow']},
 {label:'minimum visible score',score:20},
 {label:'score below star threshold stays quiet',score:19},
 {label:'zero score stays quiet',score:0},
 {label:'missing score stays quiet',flags:{streamExpressionScore:undefined}},
 {label:'normalized score differs from raw score',score:160},
 {label:'precise score within a star band',score:87},
 {label:'missing language does not leave orphan audio row',prefs:[],parsed:{audioTracks:[{tag:'AAC'}]},common:['a-aac'],absent:['🎧']},
 {label:'unknown language codec stays in its badge',prefs:[],parsed:{audioTracks:[{lang:'Unknown',tag:'AAC'}]},common:['a-aac'],absent:['🎧'],forbid:['l-en']},
 {label:'same codec across preferred languages stays in image',prefs:['English','Greek'],parsed:{audioTracks:[{lang:'English',tag:'AAC',channels:'5.1'},{lang:'Greek',tag:'AAC',channels:'2.0'}]},common:['a-aac','l-en','ch-51'],detailed:['l-el'],absent:['🎧','🇬🇧','🇬🇷']},
 {label:'raw DD plus and canonical tag do not repeat',parsed:{audioTracks:[{lang:'English',codec:'eac3',channels:'7.1'},{lang:'English',tag:'DD+',channels:'5.1'}]},common:['a-dp','l-en','ch-71'],absent:['🎧']},
 {label:'raw PCM and canonical tag do not repeat',parsed:{audioTracks:[{lang:'English',codec:'pcm_s24le',channels:'7.1'},{lang:'English',tag:'PCM',channels:'2.0'}]},common:['a-pcm','l-en','ch-71'],absent:['🎧']},
 {label:'canonical codec and raw alternate do not repeat',parsed:{audioTracks:[{lang:'English',tag:'DD+',channels:'7.1'},{lang:'English',codec:'eac3',channels:'5.1'}]},common:['a-dp','l-en','ch-71'],absent:['🎧']},
 {label:'uppercase OPUS preserves its artwork',parsed:{audioTracks:[{lang:'English',tag:'OPUS',channels:'2.0'}]},common:['a-opus','l-en','ch-20'],absent:['🎧']},
 {label:'generic HDR does not repeat HDR10',parsed:{visualTags:['HDR','HDR10']},common:['v-hdr10'],forbid:['v-hdr']},
 {label:'HDR10 plus does not repeat base HDR labels',parsed:{visualTags:['HDR','HDR10','HDR10+']},common:['v-hdr10p'],forbid:['v-hdr','v-hdr10']},
 {label:'HLG suppresses generic HDR duplicate',parsed:{visualTags:['HLG','HDR']},common:['v-hlg'],forbid:['v-hdr']},
 {label:'DV HDR10 plus keeps only combined artwork',parsed:{visualTags:['DV','HDR','HDR10','HDR10+']},common:['v-dv-hdr10p'],forbid:['v-dv-hdr','v-dv-hdr10','v-hdr10p','v-hdr10','v-hdr','a-dv']},
 {label:'DTS master audio wins over generic DTS HD',parsed:{audioTags:['DTS-HD MA','DTS-HD','DTS']},common:['a-dtsma'],forbid:['a-dtshd','a-dts']},
 {label:'structured file codec ignores unrelated filename codec',file:'Movie.1080p.WEB-DL.Atmos.TrueHD.mkv',parsed:{quality:'WEB',resolution:'1080p',audioTags:['AAC']},common:['a-aac'],forbid:['a-at-th','a-at','a-th']},
 {label:'x265 is shown as HEVC beside the container',parsed:{encode:'x265',container:'mkv',releaseGroup:'FLUX'},forbid:['ge-hevc'],text:['📦 MKV · 🎞️ HEVC · 👥 FLUX'],absent:['x265','X265','…']},
 {label:'h264 is shown as AVC beside the container',parsed:{encode:'h264',container:'mp4'},forbid:['ge-avc'],text:['📦 MP4 · 🎞️ AVC'],absent:['H264','…']},
 {label:'AV1 sits with the container without a chip',parsed:{encode:'av1',container:'mkv',releaseGroup:'Group'},forbid:['ge-av1'],text:['📦 MKV · 🎞️ AV1 · 👥 Group'],absent:['…']},
 {label:'encode without a container does not lead with a separator',parsed:{encode:'hevc',releaseGroup:'FLUX'},flags:{size:undefined},forbid:['ge-hevc'],text:['🎞️ HEVC · 👥 FLUX'],absent:['📦','…']},
 {label:'container without encode has no film emoji',parsed:{container:'mkv',releaseGroup:'FLUX'},absent:['🎞️','…']},
 {label:'long release group is not truncated',parsed:{container:'mkv',encode:'hevc',releaseGroup:'SuperLongReleaseGroup'},text:['📦 MKV · 🎞️ HEVC · 👥 SuperLongReleaseGroup'],absent:['…']},
 {label:'XviD and DivX keep their chip names as text',parsed:{container:'avi',encode:'xvid',releaseGroup:'GROUP'},forbid:['ge-xvid','ge-divx'],text:['📦 AVI · 🎞️ XviD · 👥 GROUP'],absent:['XVID','…']},
 {label:'filename HEVC does not invent encode text',file:'Movie.1080p.WEB-DL.HEVC.FLUX.mkv',parsed:{quality:'WEB',container:'mkv',releaseGroup:'FLUX'},absent:['🎞️','…']},
];
fx.push(...coverageFixtures);
const evidence:any[]=[];
for(const preset of ['compact','detailed']){
 const suffix=preset==='compact'?'':'-detailed';
 const templates=JSON.parse(fs.readFileSync(`formatter${suffix}.json`,'utf8'));
 assert.deepEqual(templates,buildPresetFormatter(preset));
 assert.ok(templates.description.includes('🎞️'),`${preset}: encode sits beside the container`);
 assert.ok(!templates.description.includes('releaseGroup::truncate'),`${preset}: release group must not be truncated`);
 for(const [key,value] of Object.entries(templates)){
   assert.deepEqual(validateTemplate(value as string),[],`${preset} ${key}: invalid real-engine syntax`);
   assert.ok((value as string).length<=15000);
   assert.equal(fs.readFileSync(`formatter${suffix}-export-${key}.txt`,'utf8').trimEnd(),value);
 }
 for(const f of fx){
   const prefs=f.prefs??['English'];
   const engine=new CustomFormatter(templates.name,templates.description,{userData:{preferredLanguages:prefs,requiredLanguages:f.required??[],includedLanguages:f.included??[]},originalLanguage:f.originalLanguage,queryType:f.anime?'anime.series':'movie',isAnime:f.anime??false,maxSeScore:100} as any);
   const stream:any={type:f.type??'debrid',filename:f.file??null,size:18.2e9,proxied:false,rankedStreamExpressionsMatched:f.rse??[],streamExpressionScore:f.score??80,parsedFile:f.parsed??{},addon:{name:'Comet'},...(f.service===false?{}:{service:{id:'realdebrid',cached:f.cache===undefined?true:f.cache}}),...f.flags};
   const out=await engine.format(stream);
   const visible=clean(out.name+'\n'+out.description);
   assert.ok(out.name.includes(PRESET_MARKER));
   assert.ok(out.name.startsWith(TITLE_LTR_ANCHOR),'Emoji/star titles must begin with the invisible LTR anchor');
   assert.doesNotMatch(visible,/🇬🇧|🇯🇵|🇫🇷|🇬🇷|🇷🇺|🇸🇪|💬 ELˢ/,`${preset}/${f.label}: formatter echoed a chip-owned fact`);
   assert.doesNotMatch(visible,/Audio: file tags|Audio unverified|File channels|^\s*(?:🎧|🔊|💬|🧩)\s*$/m,'Remove diagnostic wording and orphaned emoji rows');
   assert.doesNotMatch(visible,/🧩\s*·\s*Comet/,'Attach the addon cue to its name');
   assert.match(clean(out.name),/🔗|🧲|🌐|📰|📺|▶️|🗄️|↗️/,`Restored transport imagery: ${f.label}`);
   if(stream.streamExpressionScore>=20)assert.match(clean(out.name),/[★☆]/,'Keep original title stars');
   const title=clean(out.name).trimEnd(),rawScore=stream.streamExpressionScore;
   const normalizedScore=rawScore==null?null:Math.max(0,Math.min(100,Math.round(rawScore)));
   if(preset==='detailed'&&normalizedScore!==null&&normalizedScore>=20){
     assert.match(title,new RegExp(`[★☆]{5} · ${normalizedScore}(?:$| 🌱)`),`${f.label}: precise normalized score sits after the stars and before seeders`);
   }else assert.doesNotMatch(title,/[★☆]{5} · \d| · \d+(?:$| 🌱)/,`${f.label}: no numeric rating in Compact or without visible stars`);
   assert.doesNotMatch(visible,/\{(?:stream|track|user|cannot_|unknown_|unable_)/,`${preset}/${f.label}: template/rank leak ${visible}`);
   assert.doesNotMatch(clean(out.description),/^\s*·|\n\s*·|·\s*(?:\n|$)|·\s*·|\n\n/,`${preset}/${f.label}: separator leak`);
   assert.doesNotMatch(clean(out.name),/[⚡⏳❔]/u,`${preset}/${f.label}: cache status belongs in the description`);
   for(const t of [...f.text??[],...(preset==='detailed'?f.detailText??[]:[])])assert.ok(visible.includes(t),`${preset}/${f.label}: missing ${t}: ${visible}`);
   for(const t of f.absent??[])assert.ok(!visible.includes(t),`${preset}/${f.label}: unexpected ${t}: ${visible}`);
   for(const t of f.descriptionAbsent??[])assert.ok(!clean(out.description).includes(t),`${preset}/${f.label}: unexpected ${t} in description`);
   let reference:string[]|undefined;
   for(const skin of ['solid','transparent','mono','outline']){
     const pack=JSON.parse(fs.readFileSync(`kanso-${skin}${suffix}.json`,'utf8'));
     assert.ok(pack.filters.every((b:any)=>b.isEnabled&&!RETIRED_BADGE_IDS.has(b.id)), 'Retired badges must be deleted, not disabled');
     assert.ok(pack.groups.every((g:any)=>pack.filters.some((b:any)=>b.groupId===g.id)), 'No empty retired groups');
     const hay=nuvioHaystacks([out.name,out.description,f.file].filter(Boolean));
     const hits=pack.filters.filter((b:any)=>b.isEnabled&&hay.some((s:string)=>nuvioRegex(b.pattern).test(s))).map((b:any)=>b.id);
     assert.ok(hits.filter((id:string)=>id.startsWith('ch-')).length<=1,`${preset}/${f.label}: only the selected channel layout is shown`);
     const audioRow=visible.split('\n').filter(s=>s.startsWith('🎧')).join(' ');
     for(const id of hits)for(const fact of audioBadgeFacts[id]??[]){
       const word=fact.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
       assert.doesNotMatch(audioRow,new RegExp(`(?:^|[ ·])${word}(?=$|[ ·])`,'i'),`${preset}/${f.label}: ${fact} duplicated between the audio row and ${id} image`);
     }
     if(reference)assert.deepEqual(hits,reference,`${preset}/${f.label}: skin changes detection`);else reference=hits;
     const required=[...f.common??[],...f[preset]??[]].filter(id=>!RETIRED_BADGE_IDS.has(id)).map(displayLanguageId);
     for(const id of required)assert.ok(hits.includes(id),`${preset}/${f.label}: missing ${id}: ${hits}`);
     for(const id of (f.forbid??[]).map(displayLanguageId).filter(id=>!required.includes(id)))assert.ok(!hits.includes(id),`${preset}/${f.label}: forbidden ${id}: ${hits}`);
     assert.ok(hits.filter((id:string)=>/^q-(?:r|b|w|wr|cam|hdtv|hdrip|dvdrip|scr|tc|ts|hc|dvd-remux)$|^(?:web|blu-ray|remux)-\d/.test(id)).length<=1,`${preset}/${f.label}: duplicated source ${hits}`);
     const legacyHay=nuvioHaystacks([clean(out.name),clean(out.description),f.file].filter(Boolean));
     assert.equal(pack.filters.filter((b:any)=>b.isEnabled&&legacyHay.some((s:string)=>nuvioRegex(b.pattern).test(s))).length,0,'Mismatched legacy formatter must fail closed');
   }
   evidence.push({preset,label:f.label,name:clean(out.name),description:clean(out.description),rawName:out.name,rawDescription:out.description,badges:reference,stream});
 }
}
fs.mkdirSync('docs/release-evidence',{recursive:true});
// A formatter from the previously published contract must not accidentally
// light new badges, even though the old metadata marker IDs stay stable.
for(const oldPresetMarker of ['\u206f\u200b\u206f\u200b\u206f','\u206f\u200b\u206f\u200c\u206f']){
for(const e of evidence.slice(0,8)){
 const hay=nuvioHaystacks([e.rawName.replaceAll(PRESET_MARKER,oldPresetMarker),e.rawDescription.replaceAll(PRESET_MARKER,oldPresetMarker)]);
 const pack=JSON.parse(fs.readFileSync(`kanso-outline${e.preset==='compact'?'':'-detailed'}.json`,'utf8'));
 assert.equal(pack.filters.filter((b:any)=>hay.some((s:string)=>nuvioRegex(b.pattern).test(s))).length,0,'Old formatter / new badges must fail closed');
}
}
fs.writeFileSync('docs/release-evidence/engine-fixtures.json',JSON.stringify(evidence,null,2)+'\n');
for(const preset of ['compact','detailed']){
 const inventory=JSON.parse(fs.readFileSync(`kanso-solid${preset==='compact'?'':'-detailed'}.json`,'utf8')).filters;
 const covered=new Set(evidence.filter(f=>f.preset===preset).flatMap(f=>f.badges));
 assert.deepEqual(inventory.map((f:any)=>f.id).filter((id:string)=>!covered.has(id)),[],`${preset}: every exported badge must have a positive real-engine fixture`);
}
console.log(`PASS: ${fx.length} fixtures × 2 presets × 4 skins; Instant markers, no echo, AIOStreams 2.36.0.`);
