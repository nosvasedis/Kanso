/** Kanso presets. Requires the verified AIOStreams 2.36.0 formatter engine. */
import { MARKER_ATOMS as M, TIER_MARKERS, LANGUAGE_MARKERS, SUBTITLE_MARKERS } from './formatter-markers.mjs';
import { loadTierGroupsFromBadgesSync, tierRseRuleNames } from './tier-inject-generator.mjs';
import { SYNC_TIER_IDS } from './tier-group-sync.mjs';
import { FORMATTER_STREAMING_SEGMENTS } from './streaming-formatter-patterns.mjs';
import { TITLE_TRANSPORT } from './formatter-layout.mjs';
import { FORMATTER_RANK_STARS, FORMATTER_RANK_STARS_DETAILED } from './quality-rank-patterns.mjs';
import { LANGUAGE_CATALOG, subtitleIdForLanguage } from './language-catalog.mjs';

/** Self-hosted AIOStreams: set MAX_FORMATTER_TEMPLATE_LENGTH to at least this (engine default 15000). */
export const PRESET_MAX_LENGTH = 20000;
export const MIN_AIOSTREAMS_VERSION = '2.36.0';
export const PRESET_MARKER = '\u206f\u200b\u206f\u200d\u206f';
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
const SOURCE = gate('stream.quality::~REMUX::and::stream.quality::~DVD::isfalse',M.srcRemux)+
 gate('stream.quality::=DVD REMUX',M.srcDvdRemux)+gate('stream.quality::=HC HD-Rip',M.srcHcRip)+
 gate('stream.quality::~BluRay::and::stream.quality::~REMUX::isfalse',M.srcBluray)+
 gate('stream.quality::~CAM',M.srcCam)+gate('stream.quality::~HDTV',M.srcHdtv)+
 gate('stream.quality::=WEBRip',M.srcWebrip)+gate('stream.quality::=WEB-DL',M.srcWebdl)+
 gate('stream.quality::=WEB',gate('stream.filename::exists',gate(`${token('WEBRip')}::or::${token('WEB-Rip')}`,M.srcWebrip,M.srcWebdl),M.srcWebdl))+
 gate('stream.quality::~HDRip',M.srcHdrip)+gate('stream.quality::~DVDRip',M.srcDvdrip)+
 gate('stream.quality::=SCR',M.srcScr)+gate('stream.quality::=TC',M.srcTc)+gate('stream.quality::=TS',M.srcTs)+
 gate('stream.quality::exists::isfalse::and::stream.resolution::exists',[
   ['REMUX','srcRemux'],['BluRay','srcBluray'],['Blu-ray','srcBluray'],['HDCAM','srcCam'],['HDTV','srcHdtv'],['WEB-DL','srcWebdl'],['WEBDL','srcWebdl'],['WEBRip','srcWebrip'],
   ['HDRip','srcHdrip'],['DVDRip','srcDvdrip'],['SCR','srcScr']
 ].map(([t,a])=>gate(token(t),M[a])).join(''));

const resolutions=[['2160p','res4k'],['4K','res4k'],['UHD','res4k'],['1440p','res1440'],['1080p','res1080'],['1080i','res1080'],['720p','res720'],['576p','res576'],['480p','res480'],['360p','res360'],['240p','res240'],['144p','res144']];
const RESOLUTION=Object.entries(Object.groupBy(resolutions,([,atom])=>atom)).map(([atom,items])=>gate(`stream.resolution::in(${items.map(([value])=>`'${value}'`).join(',')})`,marker(atom))).join('') +
 gate('stream.resolution::exists::isfalse',resolutions.filter(([v])=>/p$/.test(v)).map(([v,a])=>gate(token(v),marker(a))).join(''));

const hdr='stream.visualTags::keep(\'DV\',\'HDR\',\'HDR10\',\'HDR10+\',\'HLG\')::exists';
export const VISUAL_CONFLICT=`stream.visualTags::~SDR::and::${hdr}`;
const visual=[['DV','drDv'],['HDR10','visHdr10'],['HLG','visHlg'],['SDR','visSdr']]
 .map(([tag,atom])=>gate(`stream.visualTags::~${tag}`,marker(atom))).join('')+
 gate('stream.visualTags::~HDR10+',gate('stream.visualTags::~DV',M.visHdr10p,M.drHdr10p))+
 gate('stream.visualTags::~HDR',gate('stream.visualTags::~DV',M.visHdr,M.drHdr));
const IMAX_PLAIN=gate('stream.editions::~IMAX::or::stream.visualTags::~IMAX',marker('visImax'));
const VISUAL=gate(VISUAL_CONFLICT,'',visual) +
 gate(`stream.visualTags::~10bit::and::${hdr}::isfalse`,marker('vis10bit')) +
 gate('stream.visualTags::~AI',marker('visAi')) +
 // The parser folds IMAX.Enhanced into IMAX; the bounded token keeps the specific claim.
 gate('stream.editions::~IMAX Enhanced::or::stream.visualTags::~IMAX Enhanced',marker('visImaxE'),gate('stream.filename::exists',gate(token('IMAX.Enhanced'),marker('visImaxE'),IMAX_PLAIN),IMAX_PLAIN)) +
 gate('stream.visualTags::~3D',marker('vis3d'))+
 gate('stream.visualTags::~H-SBS',M.visSbs)+gate('stream.visualTags::~H-OU',M.visOu);

export const PREFERRED_TRACKS="stream.audioTracks::where('lang={user.languages}','!lang=Unknown|Original|Multi|Dual Audio|Dubbed','!commentary','!title~commentary')";
const usableTracks="stream.audioTracks::where('!commentary','!title~commentary')";
/** File order selects one matching track. Codec/channels/language share this exact selection. */
export function selectedTrack(content){
 const each=list=>`{${list}::slice(0,1)::each('${content}')::join('')}`;
 return gate('user.languages::exists',each(PREFERRED_TRACKS),each(usableTracks));
}
const trackTags=[['Atmos','audAtmos'],['TrueHD','audTruehd'],['DD+','audDdplus'],['DD','audDd'],['DTS:X','audDtsx'],['DTS-HD MA','audDtsma'],['DTS-HD','audDtshd'],['DTS-ES','audDtses'],['DTS','audDts'],['FLAC','audFlac'],['Opus','audOpus'],['AAC','audAac'],['MP3','audMp3'],['PCM','audPcm']];
const trackCodecs=[['truehd','audTruehd'],['eac3','audDdplus'],['ac3','audDd'],['aac','audAac'],['flac','audFlac'],['opus','audOpus'],['mp3','audMp3'],['pcm_s16le','audPcm'],['pcm_s24le','audPcm']];
// Probes and indexers spell Dolby/DTS several ways; each alias maps to one artwork.
const trackTagAliases=[...trackTags,['E-AC-3','audDdplus'],['EAC3','audDdplus'],['DDP','audDdplus'],['AC3','audDd'],['AC-3','audDd'],['DTS-X','audDtsx']];
const tagValues=trackTagAliases.map(([t])=>`'${t}'`).join(',');
const canonicalAudio="::lower::replace('eac3','dd+')::replace('ac3','dd')::replace('_s16le','')::replace('_s24le','')";
const values=entries=>entries.map(([value])=>`'${value}'`).join(',');
const replacementChain=entries=>[...entries].sort((a,b)=>b[0].length-a[0].length).map(([value,atom])=>`::replace('${value.toUpperCase()}','${marker(atom)}')`).join('');
const rawValues=values(trackCodecs);
const TRACK_AUDIO=gate('track.tags::exists',`{track.tags::keep(${tagValues})${replacementChain(trackTagAliases)}::join('')}`,
 gate(`track.tag::in(${tagValues})`,`{track.tag::upper${replacementChain(trackTagAliases)}}`)) +
 gate(`track.tags::exists::isfalse::and::track.tag::exists::isfalse::and::track.codec::in(${rawValues})`,`{track.codec::upper${replacementChain(trackCodecs)}}`) +
 gate('track.title::~Atmos',marker('audAtmos')) +
 gate('track.title::~DTS:X',marker('audDtsx'))+
 gate('stream.audioTracks::length::=1::and::stream.audioTags::~Atmos',M.audAtmos)+
 gate('stream.audioTracks::length::=1::and::stream.audioTags::~DTS:X',M.audDtsx);
const reliable="stream.mediaInfoQuality::in('probe','indexer')";
const knownLanguages="stream.languages::remove('Unknown','Original','Multi','Dual Audio','Dubbed')";
const preferredLanguages="stream.uLanguages::remove('Unknown','Original','Multi','Dual Audio','Dubbed')";
const filenameAudio=[['Atmos','audAtmos'],['TrueHD','audTruehd'],['DDP','audDdplus'],['AC3','audDd'],['DTS-X','audDtsx'],['DTS-HD.MA','audDtsma'],['FLAC','audFlac'],['Opus','audOpus'],['AAC','audAac'],['MP3','audMp3']].map(([t,a])=>gate(token(t),M[a])).join('');
// Structured file tags are authoritative; filename tokens cannot add a codec
// to their combinations. The badge hierarchy decides which original logo wins.
const fileTagEntries=[...trackTags,['E-AC-3','audDdplus'],['DDP','audDdplus'],['AC3','audDd'],['DTS-X','audDtsx']];
const fileAudio=`{stream.audioTags::keep(${values(fileTagEntries)})${replacementChain(fileTagEntries)}::join('')}`;
const fallbackAudio=gate('stream.audioTags::exists',fileAudio,gate('stream.quality::exists::or::stream.resolution::exists',filenameAudio));
// ISO codes shorten repeated chains without broadening preferred-language
// matching. AIOStreams keeps ES-MX and PT-BR distinct before display grouping.
const languageCodes=LANGUAGE_CATALOG.map(({id})=>[id==='l-lat'?'ES-MX':id==='l-pt-pt'?'PT':id.slice(2).toUpperCase(),id]).sort((a,b)=>b[0].length-a[0].length);
// Replace whole list items, never substrings of a joined string: an
// uncatalogued code (IS, CA, TAIWANESE, FILIPINO) must neither leak as text
// nor light TA/SE/FI/NO. keep() then drops every item that is not a marker.
const listChain=markers=>languageCodes.map(([code,id])=>`::replace('${code}','${markers(id)}')`).join('')+`::keep(${languageCodes.map(([,id])=>`'${markers(id)}'`).join(',')})`;
const languageChain=listChain(id=>LANGUAGE_MARKERS[id]);
const subtitleChain=listChain(id=>SUBTITLE_MARKERS[subtitleIdForLanguage(id)]);
const placeholders="'Unknown','Original','Multi','Dual Audio','Dubbed'";
/** Exact catalog codes only; the limit counts displayable languages, after unknown ones are dropped. */
// One-track Compact keeps the file-order selection shared with codec/channels.
const languageNames=(list,limit,selected=false)=>selected&&limit===1
 ?`{${list}::remove(${placeholders})::slice(0,1)::languageCode${languageChain}::join(' ')}`
 :`{${list}::remove(${placeholders})::languageCode${languageChain}::slice(0,${limit})::join(' ')}`;
function languageMarkers(detailed){
 const limit=detailed?4:1;
 const fromTracks=gate('stream.audioTracks::exists',
   gate('user.languages::exists',
     languageNames(`${PREFERRED_TRACKS}::pluck('lang')::keep({user.languages})`,limit,true),
     languageNames(`${usableTracks}::pluck('lang')`,limit,true)));
 const fromNames=gate(`${reliable}::and::stream.audioTracks::exists::isfalse`,
   gate('user.languages::exists',languageNames('stream.uLanguages::keep({user.languages})',limit),
     languageNames('stream.languages',limit)));
 return fromTracks+fromNames;
}
// keep() emits nothing for an empty preference list, so an outer gate is redundant.
const SUBTITLE_MARKERS_INJECT=`{stream.uSubtitles::keep({user.subtitles})::remove(${placeholders})::languageCode${subtitleChain}::join(' ')}`;
const channelFacts=[['8.1','ch81'],['7.1','ch71'],['6.1','ch61'],['6.0','ch60'],['5.1','ch51'],['5.0','ch50'],['4.0','ch40'],['3.0','ch30'],['2.1','ch21'],['2.0','ch20'],['1.0','ch10']];
// Track channels are one exact value. File-level arrays choose one layout by
// precedence, filtering and sorting known values without nested conditions.
function channelMarkers(field,single=false){
 const known=channelFacts.map(([value])=>`'${value}'`).join(',');
 const chain=channelFacts.map(([value,atom])=>`::replace('${value}','${M[atom]}')`).join('');
 // Filter whole values before replacement; never turn e.g. 15.0 into 5.0.
 // Sorting known file-level layouts preserves the highest-layout precedence.
 return single?gate(`${field}::in(${known})`,`{${field}${chain}}`):`{${field}::keep(${known})::rsort::first${chain}}`;
}
const CHANNELS=gate('stream.audioTracks::exists',selectedTrack(channelMarkers('track.channels',true)),channelMarkers('stream.audioChannels'));
// Accessibility belongs to the same audio selection as codec/channels. Do not
// advertise a different-language or commentary track as the chosen audio.
const AUDIO_ACCESS=gate('track.visualImpaired::istrue::or::track.title::lower::~audio description::or::track.title::lower::~descriptive audio',M.accessAd);
const subtitleAccess=list=>`{${list}::each('${gate('track.forced::istrue::or::track.title::lower::~forced',M.captionForced)+gate('track.hearingImpaired::istrue::or::track.title::lower::~sdh::or::track.title::lower::~hearing impaired',M.captionSdh)}')::join('')}`;
const AUDIO=gate('stream.audioTracks::exists',selectedTrack(TRACK_AUDIO+AUDIO_ACCESS),fallbackAudio);
const SUBTITLE_ACCESS=gate('user.subtitles::exists',subtitleAccess("stream.subtitleTracks::where('lang={user.subtitles}')"),subtitleAccess('stream.subtitleTracks'));
/** Canonical encode names; `{? ?}` keeps separators aligned with a real value. */
const encodeShown="{stream.encode::upper::replace('X265','HEVC')::replace('H265','HEVC')::replace('X264','AVC')::replace('H264','AVC')::replace('XVID','XviD')::replace('DIVX','DivX')}";

/** Prefer structured editions/flags; contextual filename fallback only for unsupported provenance. */
const SPECIAL=gate('stream.seadexBest::istrue::or::stream.seadex::istrue',M.seadex) +
 gate("stream.editions::~Director's Cut",M.editionDc) + gate("stream.editions::~Extended::or::stream.editions::~Extended Edition",M.editionExt) +
 gate('stream.editions::~Black and White::or::stream.editions::~B&W',M.editionBw) +
 gate('stream.editions::~True-Hue',M.editionHue) + gate('stream.editions::~Open Matte',M.gstOpenMatte) +
 gate('stream.proper::istrue',M.gstProper) + gate('stream.repack::istrue',M.gstRepack) +
 gate('stream.remastered::istrue::or::stream.editions::~Remastered',M.gstRemaster) + gate('stream.regraded::istrue',M.gstRegraded) +
 gate('stream.uncensored::istrue',M.gstUncensored) + gate('stream.editions::~Uncut',M.gstUncut) +
 gate('stream.editions::~Theatrical',M.gstTheatrical) +
 gate('stream.quality::exists',gate(token('HYBRID'),M.gstHybrid)+gate(`${token('CRITERION')}::or::${token('Criterion.Collection')}`,M.gstCriterion)+
   // Editions the parser itself reports stay structured-first; ones it never
   // reports (B&W, Open Matte, True-Hue) always read a bounded filename token.
   gate('stream.editions::exists::isfalse',[
     ["Director's.Cut",'editionDc'],['Directors.Cut','editionDc'],['Extended','editionExt'],['Uncut','gstUncut'],['Theatrical','gstTheatrical'],['Remastered','gstRemaster']
   ].map(([t,a])=>gate(token(t),M[a])).join(''))+
   [['B&W','editionBw'],['Black.and.White','editionBw'],['Open.Matte','gstOpenMatte'],['True-Hue','editionHue']]
   .map(([t,a])=>gate(token(t),M[a])).join(''));

// Nuvio TV aligns the entire title by its first strong bidi character. Emoji
// and stars are neutral, so a later U+200F badge marker could choose RTL.
export const TITLE_LTR_ANCHOR='\u200e';
const debridType="stream.type::in('debrid','usenet','stremio-usenet')";
const CACHE_STATE=gate('service.cached::istrue','⚡',gate('service.cached::isfalse','⏳','❔'));
const TITLE_SEEDERS=gate("stream.type::=p2p::and::stream.seeders::>0",' 🌱 {stream.seeders}')+
 gate(`${debridType}::and::service.cached::isfalse::and::stream.seeders::>0`,' 🌱 {stream.seeders}');
export const PRESET_NAME=TITLE_LTR_ANCHOR+TITLE_TRANSPORT+FORMATTER_RANK_STARS+TITLE_SEEDERS;

/** Optional parts carry a separator only after an earlier nonempty field. */
function row(parts){return parts.map((p,i)=>{
 const text=(i?gate(parts.slice(0,i).map(x=>x.condition).join('::or::'),' · '):'')+p.text;
 return p.field?`{?${text}?}`:gate(p.condition,text);
}).join('');}
const part=(field,text=`{${field}}`)=>({field,condition:present(field),text});
const context=gate('stream.regexMatched::lower::~bad',"🚩 {stream.regexMatched::replace('Radarr ','')::replace('Sonarr ','')}\n") +
 gate('stream.upscaled::istrue','🔼 Upscaled\n') +
 gate(VISUAL_CONFLICT,'⚠️ HDR/SDR conflict\n');
const healthMessage="{stream.message::replace('NZB Health: 🚫','❌')::replace('NZB Health: ','')::replace('AvailNZB 💚','💚')}";
const messages=gate('stream.message::exists',gate('stream.message::$NZB Health::or::stream.message::$AvailNZB','\n','\n💬 ')+healthMessage);
const noPreferred=gate('user.languages::exists',gate('stream.audioTracks::exists',gate(`${PREFERRED_TRACKS}::exists::isfalse`,'🗣️ Preferred audio missing\n'),
 gate(`${reliable}::and::${knownLanguages}::exists::and::${preferredLanguages}::exists::isfalse`,'🗣️ Preferred audio missing\n')));

export function buildPresetFormatter(preset='compact'){
 if(!['compact','detailed'].includes(preset))throw new Error(`Unknown preset ${preset}`);
 const detailed=preset==='detailed';
 const release=row([
   {condition:'stream.type::=debrid',text:CACHE_STATE},
   part('stream.container','📦 {stream.container::upper}'),
   part('stream.encode',`🎞️ ${encodeShown}`),
   part('stream.releaseGroup','👥 {stream.releaseGroup}'),
   ...(detailed?[part('stream.country')]:[]),
 ]);
 const fileCore=row([
   {condition:'stream.seasonPack::istrue',text:'📚 Pack'},
   part('stream.size','💾 {stream.size::sbytes}'),
   {condition:'stream.folderSize::neq::stream.size::and::stream.folderSize::>0',text:'📁 {stream.folderSize::sbytes}'},
 ]);
 const file=fileCore+(detailed?'{? 📶 {stream.bitrate::sbitrate}?}{? 🕐 {stream.age}?}':'');
 const debrid="stream.type::in('debrid','usenet','stremio-usenet')";
 const servicePath='☁️ {service.shortName}';
 const deliveryCore=row([
   {condition:'service.shortName::exists',text:servicePath},
   part('addon.name',gate('stream.proxied::istrue','🛡️','🧩')+' {addon.name::truncate(14)}'),
   {condition:'addon.name::exists::isfalse::and::stream.proxied::istrue',text:'🛡️'},
 ]);
 // Each extra has its own icon, so use a single space rather than quadratic
 // separator gates. Suppress an indexer that already equals the addon label.
 const deliveryRow=deliveryCore+(detailed?
   gate('stream.indexer::lower::neq::addon.name::lower::and::stream.indexer::exists',' 🔍 {stream.indexer::truncate(18)}')+
   gate('stream.private::istrue',' 🔐')+gate('stream.freeleech::istrue',' 🆓')+
   gate('stream.library::istrue::or::stream.preloading::istrue',' '+gate('stream.library::istrue','📂 Library','⬇️ Preload')):'');
 const joinRows=rows=>rows.join('\n{tools.removeLine}\n');
 let visible=context+noPreferred+joinRows([release,file,deliveryRow]);
 visible+=messages;
 let name=(detailed?TITLE_LTR_ANCHOR+TITLE_TRANSPORT+FORMATTER_RANK_STARS_DETAILED+TITLE_SEEDERS:PRESET_NAME)+PRESET_MARKER;
 let description=visible;
 // Source and tier share a field so native per-field scans cannot echo the source.
const segments=[(detailed?tierInject():'')+SOURCE,SPECIAL,RESOLUTION,VISUAL,AUDIO,CHANNELS,languageMarkers(detailed),SUBTITLE_MARKERS_INJECT+SUBTITLE_ACCESS,...(detailed?FORMATTER_STREAMING_SEGMENTS:[])];
 // Find an exact two-field partition; greedy packing can reject a valid fit.
 const active=segments.filter(Boolean);
 let partition;
 for(let bits=0;bits<(1<<active.length);bits++){
   let n=name,d=description;
   active.forEach((s,i)=>{if(bits&(1<<i))n+=s;else d+=s;});
   if(Math.max(n.length,d.length)<=PRESET_MAX_LENGTH&&(!partition||Math.max(n.length,d.length)<Math.max(partition.n.length,partition.d.length)))partition={n,d};
 }
 if(!partition)throw new Error(`Preset ${preset}: templates cannot fit the ${PRESET_MAX_LENGTH} character budget (visible ${name.length}/${description.length}; badge segments ${active.map(s=>s.length).join('/')})`);
 name=partition.n;description=partition.d;
 if(Math.max(name.length,description.length)>PRESET_MAX_LENGTH)throw new Error(`Preset ${preset} exceeds ${PRESET_MAX_LENGTH}: ${name.length}/${description.length}`);
 return {name,description};
}
