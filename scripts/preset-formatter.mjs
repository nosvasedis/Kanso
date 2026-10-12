/** Kanso 2 presets. Requires the verified AIOStreams 2.35.9 formatter engine. */
import { MARKER_ATOMS as M, TIER_MARKERS } from './formatter-markers.mjs';
import { FORMATTER_V2_INJECT_AUDIO } from './audio-formatter-inject.mjs';
import { loadTierGroupsFromBadgesSync, tierRseRuleNames } from './tier-inject-generator.mjs';
import { SYNC_TIER_IDS } from './tier-group-sync.mjs';
import { FORMATTER_STREAMING_INJECT } from './streaming-formatter-patterns.mjs';
import { MESSAGE_BLOCK, TITLE_TRANSPORT } from './formatter-layout.mjs';
import { FORMATTER_RANK_STARS } from './quality-rank-patterns.mjs';

export const PRESET_MAX_LENGTH = 15000;
export const MIN_AIOSTREAMS_VERSION = '2.35.9';
export const PRESET_MARKER = '\u206f\u200b\u206f\u200b\u206f';
const gate=(condition,yes,no='')=>`{${condition}["${yes}"||"${no}"]}`;
const marker=id=>M[id];
const fn="stream.filename::replace({stream.releaseGroup},'')::replace({stream.title},'')";
// Normalize separators once; still require delimiters on both token edges.
const token=text=>`${fn}::replace('_','.')::replace(' ','.')::~.${text.replaceAll('_','.').replaceAll(' ','.')}.`;
const present=field=>`${field}::exists`;

/** Match exact rule/group names. Dedup by source before grouping, best tier wins. */
function tierInject(){
 const quote=s=>`'${s.replace(/\\(.)/g,'$1').replaceAll("'","\\'")}'`;
 const groups=loadTierGroupsFromBadgesSync();
 const rse=SYNC_TIER_IDS.map(id=>gate(`stream.rseMatched::in(${tierRseRuleNames(id).map(quote).join(',')})`,TIER_MARKERS[id])).join('');
 let rg='';
 for(const [prefix,quality] of [['web','WEB'],['blu-ray','BluRay'],['remux','REMUX']]){
   const seen=new Set();
   let body='';
   for(const id of SYNC_TIER_IDS.filter(id=>id.startsWith(prefix+'-')).sort((a,b)=>Number(a.split('-').at(-1))-Number(b.split('-').at(-1)))){
     const names=(groups[id]??[]).filter(name=>{const key=name.replace(/\\(.)/g,'$1').toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});
     if(names.length)body+=gate(`stream.releaseGroup::in(${names.map(quote).join(',')})`,TIER_MARKERS[id]);
   }
   rg+=gate(`stream.quality::~${quality}${quality==='BluRay'?'::and::stream.quality::~REMUX::isfalse':''}`,body);
 }
 return rse+gate('stream.rseMatched::length::=0::and::metadata.isAnime::istrue::isfalse',rg);
}

/** No regex is passed to ::~: AIOStreams uses substring/array membership. */
const SOURCE = gate('stream.quality::~REMUX',M.srcRemux)+
 gate('stream.quality::~BluRay::and::stream.quality::~REMUX::isfalse',M.srcBluray)+
 gate('stream.quality::~CAM',M.srcCam)+gate('stream.quality::~HDTV',M.srcHdtv)+
 gate('stream.quality::=WEBRip',M.srcWebrip)+gate('stream.quality::=WEB-DL',M.srcWebdl)+
 gate('stream.quality::=WEB',gate('stream.filename::exists',gate(`${token('WEBRip')}::or::${token('WEB-Rip')}`,M.srcWebrip,M.srcWebdl),M.srcWebdl))+
 gate('stream.quality::exists::isfalse::and::stream.resolution::exists',[
   ['REMUX','srcRemux'],['BluRay','srcBluray'],['Blu-ray','srcBluray'],['HDCAM','srcCam'],['HDTV','srcHdtv'],['WEB-DL','srcWebdl'],['WEBDL','srcWebdl'],['WEBRip','srcWebrip']
 ].map(([t,a])=>gate(token(t),M[a])).join(''));

const resolutions=[['2160p','res4k'],['4K','res4k'],['UHD','res4k'],['1440p','res1440'],['1080p','res1080'],['1080i','res1080'],['720p','res720'],['576p','res576'],['480p','res480'],['360p','res360'],['240p','res240']];
const RESOLUTION=resolutions.map(([value,atom])=>gate(`stream.resolution::=${value}`,marker(atom))).join('') +
 gate('stream.resolution::exists::isfalse',resolutions.filter(([v])=>/p$/.test(v)).map(([v,a])=>gate(token(v),marker(a))).join(''));

const hdr='stream.visualTags::keep(\'DV\',\'HDR\',\'HDR10\',\'HDR10+\',\'HLG\')::exists';
export const VISUAL_CONFLICT=`stream.visualTags::~SDR::and::${hdr}`;
const visual=[['DV','drDv'],['HDR10','visHdr10'],['HLG','visHlg'],['SDR','visSdr']]
 .map(([tag,atom])=>gate(`stream.visualTags::~${tag}`,marker(atom))).join('')+
 gate('stream.visualTags::~HDR10+',gate('stream.visualTags::~DV',M.visHdr10p,M.drHdr10p))+
 gate('stream.visualTags::~HDR',gate('stream.visualTags::~DV',M.visHdr,M.drHdr));
const VISUAL=gate(VISUAL_CONFLICT,'',visual) +
 gate(`stream.visualTags::~10bit::and::${hdr}::isfalse`,marker('vis10bit')) +
 gate('stream.visualTags::~AI',marker('visAi')) +
 gate('stream.editions::~IMAX Enhanced::or::stream.visualTags::~IMAX Enhanced',marker('visImaxE'),gate('stream.editions::~IMAX::or::stream.visualTags::~IMAX',marker('visImax'))) +
 gate('stream.visualTags::~3D',marker('vis3d'));

export const PREFERRED_TRACKS="stream.audioTracks::where('lang={user.languages}','!lang=Unknown|Original|Multi|Dual Audio|Dubbed','!commentary','!title~commentary')";
const usableTracks="stream.audioTracks::where('!commentary','!title~commentary')";
/** File order selects one matching track. Codec/channels/language share this exact selection. */
export function selectedTrack(content){
 const each=list=>`{${list}::slice(0,1)::each('${content}')::join('')}`;
 return gate('user.languages::exists',each(PREFERRED_TRACKS),each(usableTracks));
}
const trackTags=[['Atmos','audAtmos'],['TrueHD','audTruehd'],['DD+','audDdplus'],['DD','audDd'],['DTS:X','audDtsx'],['DTS-HD MA','audDtsma'],['DTS-HD','audDtshd'],['DTS-ES','audDtses'],['DTS','audDts'],['FLAC','audFlac'],['Opus','audOpus'],['AAC','audAac'],['MP3','audMp3'],['PCM','audPcm']];
const trackCodecs=[['truehd','audTruehd'],['eac3','audDdplus'],['ac3','audDd'],['aac','audAac'],['flac','audFlac'],['opus','audOpus'],['mp3','audMp3'],['pcm_s16le','audPcm'],['pcm_s24le','audPcm']];
const TRACK_AUDIO=trackTags.map(([tag,atom])=>gate(`track.tag::=${tag}`,marker(atom))).join('') +
 gate('track.tag::exists::isfalse',trackCodecs.map(([codec,atom])=>gate(`track.codec::=${codec}`,marker(atom))).join('')) +
 gate('track.title::~Atmos',marker('audAtmos')) +
 gate('track.title::~DTS:X',marker('audDtsx'))+
 gate('stream.audioTracks::length::=1::and::stream.audioTags::~Atmos',M.audAtmos)+
 gate('stream.audioTracks::length::=1::and::stream.audioTags::~DTS:X',M.audDtsx);
const reliable="stream.mediaInfoQuality::in('probe','indexer')";
const knownLanguages="stream.languages::remove('Unknown','Original','Multi','Dual Audio','Dubbed')";
const preferredLanguages="stream.uLanguages::remove('Unknown','Original','Multi','Dual Audio','Dubbed')";
const filenameAudio=[['Atmos','audAtmos'],['TrueHD','audTruehd'],['DDP','audDdplus'],['AC3','audDd'],['DTS-X','audDtsx'],['DTS-HD.MA','audDtsma'],['FLAC','audFlac'],['Opus','audOpus'],['AAC','audAac'],['MP3','audMp3']].map(([t,a])=>gate(token(t),M[a])).join('');
const fallbackAudio=gate('stream.audioTags::exists',FORMATTER_V2_INJECT_AUDIO,gate('stream.quality::exists::or::stream.resolution::exists',filenameAudio));
const AUDIO=gate('stream.audioTracks::exists',selectedTrack(TRACK_AUDIO),fallbackAudio);
const realTrackLanguage="track.lang::exists::and::track.lang::in('Unknown','Original','Multi','Dual Audio','Dubbed')::isfalse";
const trackLanguage='{track.lang::languageemoji}';
const flatLanguage=list=>gate(`${list}::first::languageemoji::exists`,`🎧 {${list}::first::languageemoji}`);
const fallbackLanguageRow=gate(reliable,gate('user.languages::exists',flatLanguage(preferredLanguages),flatLanguage(knownLanguages)));
function audioLanguageRow(detailed){
 const one=selectedTrack(gate(realTrackLanguage+'::and::track.lang::languageemoji::exists','🎧 '+trackLanguage));
 const details=list=>gate(`${list}::exists`,`{?🎧 {${list}::slice(0,4)::each('${gate(realTrackLanguage+'::and::track.lang::languageemoji::exists',trackLanguage+' ')}{track.tag::exists["{track.tag}"||"{track.codec::upper}"]}{? {track.channels}?}')::join(' · ')}?}`);
 // Detailed keeps only configured preferred tracks, rather than every language.
 const tracks=detailed?gate('user.languages::exists',details(PREFERRED_TRACKS),details(usableTracks)):one;
 return gate('stream.audioTracks::exists',tracks,fallbackLanguageRow);
}

/** Prefer structured editions/flags; contextual filename fallback only for unsupported provenance. */
const SPECIAL=gate('stream.seadexBest::istrue::or::stream.seadex::istrue',M.seadex) +
 gate("stream.editions::~Director's Cut",M.editionDc) + gate('stream.editions::~Extended',M.editionExt) +
 gate('stream.editions::~Black and White::or::stream.editions::~B&W',M.editionBw) +
 gate('stream.editions::~True-Hue',M.editionHue) + gate('stream.editions::~Open Matte',M.gstOpenMatte) +
 gate('stream.proper::istrue',M.gstProper) + gate('stream.repack::istrue',M.gstRepack) +
 gate('stream.remastered::istrue::or::stream.editions::~Remastered',M.gstRemaster) + gate('stream.regraded::istrue',M.gstRegraded) +
 gate('stream.uncensored::istrue',M.gstUncensored) + gate('stream.editions::~Uncut',M.gstUncut) +
 gate('stream.editions::~Theatrical',M.gstTheatrical) +
 gate('stream.quality::exists',gate(token('HYBRID'),M.gstHybrid)+gate(`${token('CRITERION')}::or::${token('Criterion.Collection')}`,M.gstCriterion)+
   gate('stream.editions::exists::isfalse',[
     ["Director's.Cut",'editionDc'],['Directors.Cut','editionDc'],['Extended','editionExt'],['B&W','editionBw'],['Black.and.White','editionBw'],['Open.Matte','gstOpenMatte'],['Uncut','gstUncut'],['Theatrical','gstTheatrical'],['True-Hue','editionHue'],['Remastered','gstRemaster']
   ].map(([t,a])=>gate(token(t),M[a])).join('')));

export const PRESET_NAME=TITLE_TRANSPORT+FORMATTER_RANK_STARS;

/** Optional parts carry a separator only after an earlier nonempty field. */
function row(parts){return parts.map((p,i)=>gate(p.condition,
  (i?gate(parts.slice(0,i).map(x=>x.condition).join('::or::'),' · '):'')+p.text)).join('');}
const part=(field,text=`{${field}}`)=>({condition:present(field),text});
const greekSubCondition='stream.subtitles::~Greek';
const context=gate("stream.quality::in('TS','TC','SCR')",'⚠️ {stream.quality}\n')+
 gate('stream.regexMatched::~Bad','⚠️ Release warning\n') + gate('stream.upscaled::istrue','🔼 Upscaled\n') +
 gate(VISUAL_CONFLICT,'⚠️ HDR/SDR conflict\n');
const noPreferred=gate('user.languages::exists',gate('stream.audioTracks::exists',gate(`${PREFERRED_TRACKS}::exists::isfalse`,'🗣️ Preferred audio unavailable\n'),
 gate(`${reliable}::and::${knownLanguages}::exists::and::${preferredLanguages}::exists::isfalse`,'🗣️ Preferred audio unavailable\n')));

export function buildPresetFormatter(preset='compact'){
 if(!['compact','detailed'].includes(preset))throw new Error(`Unknown preset ${preset}`);
 const detailed=preset==='detailed';
 const release=row([part('stream.container','📦 {stream.container::upper}'),part('stream.encode','🎞️ {stream.encode::upper}'),part('stream.releaseGroup','👥 {stream.releaseGroup::truncate(11)}'),...(detailed?[part('stream.country')]:[])]);
 const file=row([
   {condition:'stream.seasonPack::istrue',text:'📚 Season pack'},
   part('stream.size','💾 {stream.size::sbytes}'),part('stream.folderSize','📁 {stream.folderSize::sbytes}'),
   ...(detailed?[part('stream.bitrate','📶 {stream.bitrate::sbitrate}'),part('stream.age','🕐 {stream.age}')]:[])
 ]);
 const debrid="stream.type::in('debrid','usenet','stremio-usenet')";
 const cache=gate('service.cached::istrue','✅',gate('service.cached::isfalse','⏳ Uncached','❔ Cache unknown'));
 const servicePath=gate(debrid,cache)+gate('service.shortName::exists',gate(debrid,' ')+'☁️ {service.shortName}');
 const deliveryRow=row([
   {condition:debrid+'::or::service.shortName::exists',text:servicePath},
   part('addon.name',gate('stream.proxied::istrue','🛡️','🧩')+' {addon.name::truncate(14)}'),
   {condition:'addon.name::exists::isfalse::and::stream.proxied::istrue',text:'🛡️'},
   ...(detailed?[part('stream.indexer','🔍 {stream.indexer::truncate(18)}'),
     {condition:'stream.private::istrue',text:'🔐 Private'},{condition:'stream.freeleech::istrue',text:'🆓 Freeleech'},
     {condition:'stream.library::istrue::or::stream.preloading::istrue',text:gate('stream.library::istrue','📚 Library','⬇️ Preloading')}]:[]),
   {condition:'stream.type::=p2p::and::stream.seeders::>0',text:'⇋ {stream.seeders} seeders 🌱'}
 ]);
 const joinRows=rows=>rows.join('\n{tools.removeLine}\n');
 let visible=context+noPreferred+joinRows([release,file,deliveryRow])+gate(greekSubCondition,'\n💬 ELˢ')+
   gate('stream.subtitles::exists::isfalse',gate(`${token('Ell.Sub')}::or::${token('Greek.Sub')}`,'\n💬 ELˢ?'));
 visible+='\n{tools.removeLine}\n'+audioLanguageRow(detailed);
 if(detailed){
   visible+=gate('stream.audioTracks::exists::isfalse::and::stream.audioChannels::exists','\n🔊 {stream.audioChannels::join("/")}');
 }
 visible+=MESSAGE_BLOCK;
 let name=PRESET_NAME+PRESET_MARKER;
 let description=visible;
 // Source and tier share a field so native per-field scans cannot echo the source.
 const segments=[(detailed?tierInject():'')+SOURCE,SPECIAL,RESOLUTION,VISUAL,AUDIO,detailed?FORMATTER_STREAMING_INJECT:''];
 // Find an exact two-field partition; greedy packing can reject a valid fit.
 const active=segments.filter(Boolean);
 let partition;
 for(let bits=0;bits<(1<<active.length);bits++){
   let n=name,d=description;
   active.forEach((s,i)=>{if(bits&(1<<i))n+=s;else d+=s;});
   if(Math.max(n.length,d.length)<=PRESET_MAX_LENGTH&&(!partition||Math.max(n.length,d.length)<Math.max(partition.n.length,partition.d.length)))partition={n,d};
 }
 if(!partition)throw new Error(`Preset ${preset}: templates cannot fit the ${PRESET_MAX_LENGTH} character budget`);
 name=partition.n;description=partition.d;
 if(Math.max(name.length,description.length)>PRESET_MAX_LENGTH)throw new Error(`Preset ${preset} exceeds ${PRESET_MAX_LENGTH}: ${name.length}/${description.length}`);
 return {name,description};
}
