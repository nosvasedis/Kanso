import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CustomFormatter } from '../.vendor/AIOStreams/packages/core/src/formatters/custom.ts';
import { validateTemplate } from '../.vendor/AIOStreams/packages/core/src/formatters/engine/parser.ts';
import { buildPresetFormatter, PRESET_MARKER, TITLE_LTR_ANCHOR } from './preset-formatter.mjs';
import { RETIRED_BADGE_IDS } from './retired-badges.mjs';
import {coverageFixtures,audioBadgeFacts} from './preset-coverage-fixtures.mjs';
import { nuvioHaystacks,nuvioRegex } from './benchmark-badge-patterns.mjs';
const clean=(s:string)=>s.replace(/[\u180b-\u180d\u200b-\u200f\u2060-\u206f\ufeff]/g,'');
type FX={label:string;file?:string;parsed?:any;prefs?:string[];required?:string[];included?:string[];originalLanguage?:string;type?:string;cache?:boolean|null;service?:boolean;score?:number;rse?:string[];anime?:boolean;flags?:any;common?:string[];compact?:string[];detailed?:string[];forbid?:string[];text?:string[];absent?:string[];detailText?:string[]};
const fx:FX[]=[
 {label:'4K WEB DV HDR10+ Atmos',file:'Movie.2160p.AMZN.WEB-DL.DDP.Atmos.FLUX.mkv',parsed:{quality:'WEB',resolution:'2160p',encode:'hevc',container:'mkv',visualTags:['DV','HDR10+'],audioTags:['Atmos','DD+'],audioChannels:['5.1'],languages:['English'],network:'Amazon',releaseGroup:'FLUX',mediaInfoQuality:'probe'},common:['r-4k','l-en','v-dv-hdr10p','a-at-dp'],compact:['q-w'],detailed:['web-1','s-amzn'],forbid:['v-hdr10p','a-at','a-dp','ch-51','q-gw'],text:['📦 MKV','🎞️ HEVC','👥 FLUX','💾','✅','☁️ RD','🧩'],detailText:['🔊 5.1']},
 {label:'unknown remux range',parsed:{quality:'REMUX',resolution:'2160p'},common:['r-4k','q-r'],forbid:['v-hdr','v-sdr']},
 {label:'explicit SDR remux',parsed:{quality:'REMUX',resolution:'2160p',visualTags:['SDR']},common:['v-sdr','q-r'],forbid:['v-hdr']},
 {label:'HLG is not generic HDR',parsed:{quality:'REMUX',resolution:'2160p',visualTags:['HLG']},common:['v-hlg'],forbid:['v-hdr','v-sdr']},
 {label:'conflicting HDR SDR',parsed:{visualTags:['HDR','SDR']},forbid:['v-hdr','v-sdr'],text:['⚠️ Conflicting HDR/SDR tags']},
 {label:'DV HDR10 evidenced combination',parsed:{visualTags:['DV','HDR10']},common:['v-dv-hdr10'],forbid:['a-dv','v-hdr10']},
 {label:'DV only',parsed:{visualTags:['DV']},common:['a-dv'],forbid:['v-hdr']},
 {label:'HDR10+ only',parsed:{visualTags:['HDR10+']},common:['v-hdr10p'],forbid:['v-hdr','v-hdr10']},
 {label:'SDR 10bit detail',parsed:{visualTags:['SDR','10bit']},common:['v-sdr'],detailed:['v-10bit'],forbid:['v-hdr']},
 {label:'HDR does not also show 10bit',parsed:{visualTags:['HDR10','10bit']},common:['v-hdr10'],forbid:['v-10bit']},
 {label:'English AAC vs Japanese FLAC',prefs:['English'],parsed:{quality:'WEB',resolution:'1080p',languages:['English','Japanese'],audioTags:['FLAC','AAC'],audioChannels:['5.1','2.0'],audioTracks:[{lang:'Japanese',codec:'flac',tag:'FLAC',channels:'5.1',default:true},{lang:'English',codec:'aac',tag:'AAC',channels:'2.0'}],mediaInfoQuality:'probe'},common:['l-en','a-aac'],forbid:['l-ja','a-flac','ch-51'],detailText:['🇬🇧 2.0'],absent:['JA: FLAC 5.1']},
 {label:'commentary is not selected',parsed:{audioTracks:[{lang:'English',tag:'FLAC',commentary:true},{lang:'English',tag:'AAC',channels:'2.0'}]},common:['l-en','a-aac'],forbid:['a-flac']},
 {label:'commentary title is not selected',parsed:{audioTracks:[{lang:'English',tag:'FLAC',title:'Director commentary'},{lang:'English',tag:'AAC'}]},common:['a-aac'],forbid:['a-flac']},
 {label:'preferred language absent',parsed:{languages:['Japanese'],audioTracks:[{lang:'Japanese',tag:'FLAC'}],mediaInfoQuality:'probe'},forbid:['l-en','l-ja','a-flac'],text:['Preferred audio unavailable']},
 {label:'no preferences chooses first usable track',prefs:[],parsed:{audioTracks:[{lang:'French',tag:'AAC'},{lang:'English',tag:'FLAC',default:true}]},common:['l-fr','a-aac'],forbid:['l-en','a-flac']},
 {label:'single track Atmos association',parsed:{audioTracks:[{lang:'English',tag:'TrueHD',codec:'truehd',channels:'7.1'}],audioTags:['TrueHD','Atmos']},common:['l-en','a-at-th'],forbid:['a-at','a-th','ch-71']},
 {label:'do not borrow another track Atmos',parsed:{audioTracks:[{lang:'English',tag:'AAC'},{lang:'Japanese',tag:'TrueHD',title:'Atmos'}],audioTags:['TrueHD','Atmos','AAC']},common:['l-en','a-aac'],forbid:['a-at','a-at-th']},
 {label:'missing tag uses track codec',parsed:{audioTracks:[{lang:'English',codec:'eac3'}]},common:['a-dp','l-en']},
 {label:'Japanese preferences respected',prefs:['Japanese'],parsed:{audioTracks:[{lang:'English',tag:'AAC'},{lang:'Japanese',tag:'FLAC'}]},common:['l-ja','a-flac'],forbid:['l-en','a-aac']},
 {label:'English subtitle token is not audio proof',file:'Movie.1080p.WEB-DL.Eng.Sub.mkv',parsed:{quality:'WEB',resolution:'1080p',languages:['English']},forbid:['l-en']},
 {label:'probed Greek subtitles distinct from audio',parsed:{quality:'WEB',languages:['English'],subtitles:['Greek'],mediaInfoQuality:'probe'},common:['l-en'],forbid:['l-el'],text:['💬 ELˢ']},
 {label:'Greek audio is not subtitle cue',prefs:['Greek'],parsed:{languages:['Greek'],mediaInfoQuality:'probe'},common:['l-el'],absent:['💬 ELˢ']},
 {label:'subtitle only has no leading separator',flags:{size:undefined},parsed:{subtitles:['Greek']},text:['💬 ELˢ']},
 {label:'library only has no leading separator',flags:{size:undefined,proxied:undefined,library:true},detailText:['Library']},
 {label:'reported Greek subtitles not audio cue',file:'Movie.1080p.WEB-DL.Ell.Sub.mkv',parsed:{quality:'WEB',resolution:'1080p',languages:['Greek']},forbid:['l-el'],text:['💬 ELˢ?']},
 {label:'trusted language beats filename',file:'Movie.English.1080p.WEB-DL.mkv',prefs:['French'],parsed:{languages:['French'],mediaInfoQuality:'indexer'},common:['l-fr'],forbid:['l-en']},
 {label:'missing preferred probed language',parsed:{languages:['Russian'],mediaInfoQuality:'probe'},forbid:['l-ru'],text:['Preferred audio unavailable']},
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
 {label:'telesync warning retained',parsed:{quality:'TS'},text:['📹 Telesync (TS)']},
 {label:'telecine warning retained',parsed:{quality:'TC'},text:['📹 Telecine (TC)']},
 {label:'screener warning retained',parsed:{quality:'SCR'},text:['📼 Screener (SCR)']},
 {label:'structured WebRip without filename',parsed:{quality:'WEBRip'},common:['q-wr'],forbid:['q-w']},
 {label:'structured WEB-DL beats filename',file:'Movie.1080p.WEBRip.mkv',parsed:{quality:'WEB-DL'},common:['q-w'],forbid:['q-wr']},
 {label:'mixed filename delimiters remain bounded',file:'Movie_1080p WEB-DL_AAC.mkv',parsed:{quality:'WEB',resolution:'1080p'},common:['q-w','a-aac'],forbid:['q-wr']},
 {label:'technical movie title cannot claim Atmos',file:'Some.Atmos.Movie.1080p.WEB-DL.mkv',parsed:{title:'Some.Atmos.Movie',quality:'WEB',resolution:'1080p'},forbid:['a-at']},
 {label:'extended and IMAX retained',parsed:{editions:['Extended','IMAX'],quality:'WEB'},common:['edition-extended','v-imax']},
 {label:'IMAX Enhanced distinct',parsed:{editions:['IMAX Enhanced']},common:['v-imax-e'],forbid:['v-imax']},
 {label:'B&W and 3D retained',parsed:{editions:['B&W'],visualTags:['3D']},common:['edition-bw','v-3d']},
 {label:'unsupported cut has contextual filename fallback',file:'Movie.1080p.WEB-DL.Directors.Cut.mkv',parsed:{quality:'WEB',resolution:'1080p'},common:['edition-directors-cut']},
 {label:'parsed edition beats conflicting filename',file:'Movie.1080p.WEB-DL.Directors.Cut.mkv',parsed:{quality:'WEB',editions:['Extended']},common:['edition-extended'],forbid:['edition-directors-cut']},
 {label:'remastered edition remains Detailed',parsed:{editions:['Remastered']},detailed:['remastered-release']},
 {label:'named Uncut movie is not an edition',file:'The.Uncut.Movie.1080p.WEB-DL.mkv',parsed:{title:'The.Uncut.Movie',quality:'WEB',resolution:'1080p'},forbid:['uncut-edition']},
 {label:'cache false',cache:false,text:['Uncached']},
 {label:'cache unknown',cache:null,text:['Cache unknown']},
 {label:'HTTP is not debrid cache',type:'http',service:false,text:['🌐'],absent:['Cached','Uncached','Cache unknown']},
 {label:'P2P swarm',type:'p2p',service:false,flags:{torrent:{seeders:125}},text:['🧲','125 seeders']},
 {label:'Usenet health warning preserved',type:'usenet',flags:{message:'NZB Health: ⚠️ missing blocks'},text:['⚠️ missing blocks'],absent:['💬','NZB Health:']},
 {label:'upstream bad-release warning preserved',flags:{regexMatched:{name:'Bad release'}},text:['🚩 Bad release'],absent:['Release warning']},
 {label:'Tamtaro exact bad dual reason',flags:{regexMatched:{name:'Radarr Bad Dual Groups'}},text:['🚩 Bad Dual Groups'],absent:['Radarr','Release warning']},
 {label:'ranked bad rule reason',flags:{rankedRegexesMatched:['Sonarr Bad WEB Groups']},text:['🚩 Bad WEB Groups'],absent:['Sonarr','Release warning']},
 {label:'case insensitive bad reason',flags:{regexMatched:{name:'bad audio sync'}},text:['🚩 bad audio sync']},
 {label:'positive release rule stays quiet',flags:{regexMatched:{name:'Radarr Remux Tier 1'}},absent:['🚩']},
 {label:'failed health details preserved',type:'usenet',flags:{message:'NZB Health: 🚫 missing 12 blocks'},text:['❌ missing 12 blocks'],absent:['💬','NZB Health:']},
 {label:'ordinary provider message preserved',flags:{message:'Download pending; retry in 30 seconds'},text:['💬 Download pending; retry in 30 seconds']},
 {label:'same English language flag once',parsed:{quality:'REMUX',resolution:'2160p',releaseGroup:'FraMeSToR',encode:'hevc',subtitles:['Greek'],audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1',title:'Atmos'},{lang:'English',tag:'DD',channels:'5.1'}]},common:['a-at-th'],detailText:['🎧 🇬🇧 7.1 · DD 5.1'],text:['💬 ELˢ'],absent:['· 🇬🇧']},
 {label:'specific reason with grouped audio and bottom subtitles',type:'usenet',flags:{regexMatched:{name:'Radarr Bad Dual Groups'},message:'NZB Health: ⚠️ missing blocks',bitrate:66e6,age:86,indexer:'altHUB',addon:{name:'altHUB'},size:50.6e9},parsed:{quality:'REMUX',resolution:'2160p',releaseGroup:'FraMeSToR',encode:'hevc',subtitles:['Greek'],visualTags:['DV','HDR10'],audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1',title:'Atmos'},{lang:'English',tag:'DD',channels:'5.1'}]},common:['a-at-th','v-dv-hdr10'],text:['🚩 Bad Dual Groups','⚠️ missing blocks','💬 ELˢ'],detailText:['🎧 🇬🇧 7.1 · DD 5.1'],absent:['· 🇬🇧','Release warning']},
 {label:'four tracks keep language transitions',prefs:['English','Greek'],parsed:{audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1'},{lang:'English',tag:'DD',channels:'5.1'},{lang:'Greek',tag:'AAC',channels:'2.0'},{lang:'Greek',tag:'DD+',channels:'5.1'},{lang:'English',tag:'FLAC'}]},detailText:['🎧 🇬🇧 7.1 · DD 5.1 · 🇬🇷 AAC 2.0 · DD+ 5.1'],absent:['FLAC','· 🇬🇧']},
 {label:'returning language flag keeps association',prefs:['English','Greek'],parsed:{audioTracks:[{lang:'English',tag:'TrueHD'},{lang:'Greek',tag:'AAC'},{lang:'English',tag:'DD'}]},detailText:['🎧 🇬🇧 · 🇬🇷 AAC · 🇬🇧 DD']},
 {label:'commentary exclusion does not repeat language',parsed:{audioTracks:[{lang:'English',tag:'TrueHD',channels:'7.1'},{lang:'English',tag:'FLAC',commentary:true},{lang:'English',tag:'DD',channels:'5.1'}]},detailText:['🎧 🇬🇧 7.1 · DD 5.1'],absent:['FLAC','· 🇬🇧']},
 {label:'upscaled flag stays visible',parsed:{upscaled:true},text:['Upscaled']},
 {label:'Detailed delivery diagnostics',parsed:{encode:'hevc',container:'mkv',releaseGroup:'GROUP'},flags:{bitrate:30e6,age:24,indexer:'NZBGeek',torrent:{private:true,freeleech:true}},text:['HEVC'],detailText:['MKV','GROUP','NZBGeek','Private','Freeleech']},
 {label:'season pack and folder size retained',parsed:{seasonPack:true},flags:{folderSize:100e9},text:['📚 Season pack','📁']},
 {label:'library wins over preload',flags:{library:true,preloading:true},detailText:['Library'],absent:['Preloading']},
 {label:'preloading distinct',flags:{library:false,preloading:true},detailText:['Preloading']},
 {label:'empty stream has no punctuation',flags:{size:undefined},service:false,absent:['\n\n']},
 {label:'commentary only has no orphan headphones',parsed:{audioTracks:[{lang:'English',tag:'AAC',commentary:true}]},text:['Preferred audio unavailable'],absent:['🎧']},
 {label:'unknown channels stay quiet',parsed:{audioChannels:[]},absent:['🔊']},
 {label:'missing addon has no orphan puzzle',flags:{addon:undefined},absent:['🧩']},
 {label:'proxy without addon retains shield',flags:{addon:undefined,proxied:true},text:['🛡️'],absent:['🧩']},
 {label:'multiple file channels are compact values',parsed:{audioChannels:['5.1','2.0']},detailText:['🔊 5.1/2.0']},
 {label:'two preferred languages exclude an unrelated track',prefs:['English','Greek'],parsed:{languages:['English','Greek','Japanese'],mediaInfoQuality:'probe',audioTracks:[{lang:'English',tag:'DD+',channels:'5.1'},{lang:'Greek',tag:'AAC',channels:'2.0'},{lang:'Japanese',tag:'FLAC',channels:'7.1'}]},common:['a-dp'],text:['🇬🇧'],detailText:['🇬🇷 AAC 2.0'],absent:['🇯🇵','JA: FLAC']},
 {label:'Swedish works without a legacy flag badge',prefs:['Swedish'],parsed:{audioTracks:[{lang:'Swedish',tag:'AAC',channels:'2.0'}]},common:['a-aac'],text:['🇸🇪']},
 {label:'placeholder languages do not become preferred flags',prefs:['English','Original','Multi','Dubbed','Unknown'],parsed:{languages:['Multi','Dubbed','Unknown'],mediaInfoQuality:'indexer'},absent:['🎧','🇬🇧','Preferred audio unavailable']},
 {label:'Tamtaro Original resolves to the media language',prefs:['English','Original','Multi','Dual Audio','Dubbed','Unknown'],originalLanguage:'Japanese',parsed:{languages:['Japanese'],mediaInfoQuality:'probe',audioTracks:[{lang:'Japanese',tag:'FLAC'}]},common:['a-flac'],text:['🇯🇵']},
 {label:'required languages participate in the AIO preference context',prefs:['English'],required:['Greek'],parsed:{languages:['Greek'],mediaInfoQuality:'indexer'},text:['🇬🇷']},
 {label:'flat preferred order is respected',prefs:['Greek','English'],parsed:{languages:['English','Greek'],mediaInfoQuality:'probe'},text:['🇬🇷'],absent:['🇬🇧']},
 {label:'uncertain language metadata stays quiet',prefs:['English'],parsed:{languages:['English'],mediaInfoQuality:'filename'},absent:['🎧','🇬🇧']},
 {label:'Tamtaro English DD+ 5.1 without duplicate flags',prefs:['English','Original','Multi','Dual Audio','Dubbed','Unknown'],originalLanguage:'English',parsed:{quality:'WEB',resolution:'2160p',encode:'hevc',container:'mkv',releaseGroup:'FLUX',network:'Amazon',visualTags:['DV','HDR10+'],languages:['English','Japanese'],mediaInfoQuality:'probe',audioTags:['DD+','Atmos','FLAC'],audioTracks:[{lang:'Japanese',tag:'FLAC',channels:'7.1'},{lang:'English',codec:'eac3',tag:'DD+',channels:'5.1',title:'Main Atmos'}]},common:['r-4k','v-dv-hdr10p','a-at-dp'],compact:['q-w'],detailed:['web-1','s-amzn'],text:['🇬🇧'],detailText:['🇬🇧 5.1'],absent:['🇯🇵','JA: FLAC']},
 {label:'rank score does not change badge opinion',score:100,parsed:{quality:'WEB',resolution:'1080p'},common:['q-w','r-1080'],forbid:['q-bw','q-gw','q-ow']},
 {label:'missing language does not leave orphan audio row',prefs:[],parsed:{audioTracks:[{tag:'AAC'}]},common:['a-aac'],absent:['🎧']},
 {label:'unknown language codec stays in its badge',prefs:[],parsed:{audioTracks:[{lang:'Unknown',tag:'AAC'}]},common:['a-aac'],absent:['🎧']},
 {label:'same codec across preferred languages stays in image',prefs:['English','Greek'],parsed:{audioTracks:[{lang:'English',tag:'AAC',channels:'5.1'},{lang:'Greek',tag:'AAC',channels:'2.0'}]},common:['a-aac'],detailText:['🎧 🇬🇧 5.1 · 🇬🇷 2.0']},
 {label:'raw DD plus and canonical tag do not repeat',parsed:{audioTracks:[{lang:'English',codec:'eac3',channels:'7.1'},{lang:'English',tag:'DD+',channels:'5.1'}]},common:['a-dp'],detailText:['🎧 🇬🇧 7.1 · 5.1']},
 {label:'raw PCM and canonical tag do not repeat',parsed:{audioTracks:[{lang:'English',codec:'pcm_s24le',channels:'7.1'},{lang:'English',tag:'PCM',channels:'2.0'}]},common:['a-pcm'],detailText:['🎧 🇬🇧 7.1 · 2.0']},
 {label:'canonical codec and raw alternate do not repeat',parsed:{audioTracks:[{lang:'English',tag:'DD+',channels:'7.1'},{lang:'English',codec:'eac3',channels:'5.1'}]},common:['a-dp'],detailText:['🎧 🇬🇧 7.1 · 5.1']},
 {label:'uppercase OPUS preserves its artwork',parsed:{audioTracks:[{lang:'English',tag:'OPUS',channels:'2.0'}]},common:['a-opus'],detailText:['🎧 🇬🇧 2.0']},
 {label:'generic HDR does not repeat HDR10',parsed:{visualTags:['HDR','HDR10']},common:['v-hdr10'],forbid:['v-hdr']},
 {label:'HDR10 plus does not repeat base HDR labels',parsed:{visualTags:['HDR','HDR10','HDR10+']},common:['v-hdr10p'],forbid:['v-hdr','v-hdr10']},
 {label:'HLG suppresses generic HDR duplicate',parsed:{visualTags:['HLG','HDR']},common:['v-hlg'],forbid:['v-hdr']},
 {label:'DV HDR10 plus keeps only combined artwork',parsed:{visualTags:['DV','HDR','HDR10','HDR10+']},common:['v-dv-hdr10p'],forbid:['v-dv-hdr','v-dv-hdr10','v-hdr10p','v-hdr10','v-hdr','a-dv']},
 {label:'DTS master audio wins over generic DTS HD',parsed:{audioTags:['DTS-HD MA','DTS-HD','DTS']},common:['a-dtsma'],forbid:['a-dtshd','a-dts']},
 {label:'structured file codec ignores unrelated filename codec',file:'Movie.1080p.WEB-DL.Atmos.TrueHD.mkv',parsed:{quality:'WEB',resolution:'1080p',audioTags:['AAC']},common:['a-aac'],forbid:['a-at-th','a-at','a-th']},
];
fx.push(...coverageFixtures);
const nativeLanguage:Record<string,string>={'l-en':'🇬🇧','l-ja':'🇯🇵','l-fr':'🇫🇷','l-el':'🇬🇷','l-ru':'🇷🇺'};
const evidence:any[]=[];
for(const preset of ['compact','detailed']){
 const suffix=preset==='compact'?'':'-detailed';
 const templates=JSON.parse(fs.readFileSync(`formatter${suffix}.json`,'utf8'));
 assert.deepEqual(templates,buildPresetFormatter(preset));
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
   const descriptionLines=clean(out.description).trim().split('\n');
   if(descriptionLines.some(line=>line.startsWith('💬 ELˢ')))assert.match(descriptionLines.at(-1)!,/^💬 ELˢ\??$/,'Subtitles must be the bottom row, below audio and provider messages');
   assert.ok(out.name.includes(PRESET_MARKER));
   assert.ok(out.name.startsWith(TITLE_LTR_ANCHOR),'Emoji/star titles must begin with the invisible LTR anchor');
   for(const line of visible.split('\n').filter(s=>s.startsWith('🎧')))assert.doesNotMatch(line,/\b(?:EN|EL|JA|FR|SV)\b|:/,'Native flags replace language codes in the audio row');
   assert.doesNotMatch(visible,/Audio: file tags|Audio unverified|File channels|^\s*(?:🎧|🔊|💬|🧩)\s*$/m,'Remove diagnostic wording and orphaned emoji rows');
   assert.doesNotMatch(visible,/🧩\s*·\s*Comet/,'Attach the addon cue to its name');
   assert.match(clean(out.name),/🔗|🧲|🌐|📰/,`Restored transport imagery: ${f.label}`);
   if((f.score??80)>=20)assert.match(clean(out.name),/[★☆]/,'Keep original title stars');
   assert.doesNotMatch(visible,/\{(?:stream|track|user|cannot_|unknown_|unable_)/,`${preset}/${f.label}: template/rank leak ${visible}`);
   assert.doesNotMatch(clean(out.description),/^\s*·|\n\s*·|·\s*$|\n\n/,`${preset}/${f.label}: separator leak`);
   for(const id of f.common??[])if(nativeLanguage[id])assert.ok(visible.includes(nativeLanguage[id]),`${preset}/${f.label}: preferred language missing from formatter`);
   if(prefs.length||preset==='compact')for(const id of f.forbid??[])if(nativeLanguage[id])assert.ok(!visible.includes(nativeLanguage[id]),`${preset}/${f.label}: non-preferred language in formatter`);
   for(const t of [...f.text??[],...(preset==='detailed'?f.detailText??[]:[])])assert.ok(visible.includes(t),`${preset}/${f.label}: missing ${t}: ${visible}`);
   for(const t of f.absent??[])assert.ok(!visible.includes(t),`${preset}/${f.label}: unexpected ${t}: ${visible}`);
   let reference:string[]|undefined;
   for(const skin of ['solid','transparent','mono']){
     const pack=JSON.parse(fs.readFileSync(`kanso-${skin}${suffix}.json`,'utf8'));
     assert.ok(pack.filters.every((b:any)=>b.isEnabled&&!RETIRED_BADGE_IDS.has(b.id)), 'Retired badges must be deleted, not disabled');
     assert.ok(pack.groups.every((g:any)=>pack.filters.some((b:any)=>b.groupId===g.id)), 'No empty retired groups');
     const hay=nuvioHaystacks([out.name,out.description,f.file].filter(Boolean));
     const hits=pack.filters.filter((b:any)=>b.isEnabled&&hay.some((s:string)=>nuvioRegex(b.pattern).test(s))).map((b:any)=>b.id);
     const audioRow=visible.split('\n').filter(s=>s.startsWith('🎧')).join(' ');
     for(const id of hits)for(const fact of audioBadgeFacts[id]??[]){
       const word=fact.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
       assert.doesNotMatch(audioRow,new RegExp(`(?:^|[ ·])${word}(?=$|[ ·])`,'i'),`${preset}/${f.label}: ${fact} duplicated between the audio row and ${id} image`);
     }
     if(reference)assert.deepEqual(hits,reference,`${preset}/${f.label}: skin changes detection`);else reference=hits;
     for(const id of [...f.common??[],...f[preset]??[]].filter(id=>!RETIRED_BADGE_IDS.has(id)))assert.ok(hits.includes(id),`${preset}/${f.label}: missing ${id}: ${hits}`);
     for(const id of f.forbid??[])assert.ok(!hits.includes(id),`${preset}/${f.label}: forbidden ${id}: ${hits}`);
     assert.ok(hits.filter((id:string)=>/^q-(?:r|b|w|wr|cam|hdtv)$|^(?:web|blu-ray|remux)-\d/.test(id)).length<=1,`${preset}/${f.label}: duplicated source ${hits}`);
     const legacyHay=nuvioHaystacks([clean(out.name),clean(out.description),f.file].filter(Boolean));
     assert.equal(pack.filters.filter((b:any)=>b.isEnabled&&legacyHay.some((s:string)=>nuvioRegex(b.pattern).test(s))).length,0,'Mismatched legacy formatter must fail closed');
   }
   evidence.push({preset,label:f.label,name:clean(out.name),description:clean(out.description),rawName:out.name,rawDescription:out.description,badges:reference,stream});
 }
}
fs.mkdirSync('docs/release-evidence',{recursive:true});
fs.writeFileSync('docs/release-evidence/engine-fixtures.json',JSON.stringify(evidence,null,2)+'\n');
for(const preset of ['compact','detailed']){
 const inventory=JSON.parse(fs.readFileSync(`kanso-solid${preset==='compact'?'':'-detailed'}.json`,'utf8')).filters;
 const covered=new Set(evidence.filter(f=>f.preset===preset).flatMap(f=>f.badges));
 assert.deepEqual(inventory.map((f:any)=>f.id).filter((id:string)=>!covered.has(id)),[],`${preset}: every exported badge must have a positive real-engine fixture`);
}
console.log(`PASS: ${fx.length} fixtures × 2 presets × 3 skins; real AIOStreams 2.35.9 syntax, output, metadata precedence and matching.`);
