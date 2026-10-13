/** Kanso 2 presets. Requires the verified AIOStreams 2.35.9 formatter engine. */
import { MARKER_ATOMS as M, TIER_MARKERS } from './formatter-markers.mjs';
import { loadTierGroupsFromBadgesSync, tierRseRuleNames } from './tier-inject-generator.mjs';
import { SYNC_TIER_IDS } from './tier-group-sync.mjs';
import { FORMATTER_STREAMING_SEGMENTS } from './streaming-formatter-patterns.mjs';
import { TITLE_TRANSPORT } from './formatter-layout.mjs';
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
const RESOLUTION=Object.entries(Object.groupBy(resolutions,([,atom])=>atom)).map(([atom,items])=>gate(`stream.resolution::in(${items.map(([value])=>`'${value}'`).join(',')})`,marker(atom))).join('') +
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
const tagValues=trackTags.map(([t])=>`'${t}'`).join(',');
const canonicalAudio="::lower::replace('eac3','dd+')::replace('ac3','dd')::replace('_s16le','')::replace('_s24le','')";
const values=entries=>entries.map(([value])=>`'${value}'`).join(',');
const replacementChain=entries=>[...entries].sort((a,b)=>b[0].length-a[0].length).map(([value,atom])=>`::replace('${value.toUpperCase()}','${marker(atom)}')`).join('');
const rawValues=values(trackCodecs);
const TRACK_AUDIO=gate(`track.tag::in(${tagValues})`,`{track.tag::upper${replacementChain(trackTags)}}`) +
 gate(`track.tag::exists::isfalse::and::track.codec::in(${rawValues})`,`{track.codec::upper${replacementChain(trackCodecs)}}`) +
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
const AUDIO=gate('stream.audioTracks::exists',selectedTrack(TRACK_AUDIO),fallbackAudio);
const realTrackLanguage="track.lang::in('Unknown','Original','Multi','Dual Audio','Dubbed')::isfalse";
const trackLanguage='{track.lang::languageemoji}';
const flatLanguage=list=>gate(`${list}::first::languageemoji::exists`,`🎧 {${list}::first::languageemoji}`);
const fallbackLanguageRow=gate(reliable,gate('user.languages::exists',flatLanguage(preferredLanguages),flatLanguage(knownLanguages)));
function audioLanguageRow(detailed){
 const one=selectedTrack(gate(realTrackLanguage+'::and::track.lang::languageemoji::exists','🎧 '+trackLanguage));
 // The stable engine has no previous-track field or nested each(). Render four
 // slots explicitly so a flag appears only at the start of a language run.
 const details=list=>{
   const primary=`${list}::slice(0,1)`;
   const primaryTag=`${primary}::pluck('tag')::first::lower`;
   const primaryCodec=`${primary}::pluck('codec')::first${canonicalAudio}`;
   const slots=Array.from({length:4},(_,i)=>{
     const firstCodec=gate(`track.tag::in(${tagValues})`,'','{? {track.tag}?}')+gate(`track.codec::in(${rawValues})::isfalse::and::track.tag::exists::isfalse`,'{? {track.codec::upper}?}');
     // The first track's known codec is owned by its original image badge.
     // Later tracks sharing that codec need only their language/channels.
     const sameTag=`track.tag::lower::equal::${primaryTag}`;
     const tagMatchesRaw=`track.tag::lower::equal::${primaryCodec}`;
     const sameRaw=`track.codec${canonicalAudio}::equal::${primaryTag}::or::${primary}::where('codec={track.codec}')::exists::or::track.tag::exists`;
     const codec=i?gate(sameTag,'',gate(tagMatchesRaw,'','{? {track.tag}?}'))+gate(sameRaw,'','{? {track.codec::upper}?}'):firstCodec;
     const previous=`${list}::slice(${i-1},${i})::pluck('lang')::first`;
     const flag=gate((i?`track.lang::neq::${previous}::and::`:'')+realTrackLanguage+'::and::track.lang::languageemoji::exists',trackLanguage);
     const content=flag+codec+'{? {track.channels}?}';
     return `{${list}::slice(${i},${i+1})::each('{?${i?' · ':''}${content}?}')::join('')${i?"::replace('  ',' ')":''}}`;
   }).join('');
   return `{?🎧 ${slots}?}`;
 };
 // Detailed keeps only configured preferred tracks, rather than every language.
 if(!detailed)return gate('stream.audioTracks::exists',one,fallbackLanguageRow);
 // Keep branches flat to respect the stable engine's five-level nesting cap.
 return gate(`user.languages::exists::and::${PREFERRED_TRACKS}::exists`,details(PREFERRED_TRACKS))+
   gate(`${usableTracks}::pluck('lang')::languageemoji::exists::or::${usableTracks}::pluck('channels')::exists::and::user.languages::exists::isfalse`,details(usableTracks))+
   gate('stream.audioTracks::exists::isfalse',fallbackLanguageRow);
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

// Nuvio TV aligns the entire title by its first strong bidi character. Emoji
// and stars are neutral, so a later U+200F badge marker could choose RTL.
export const TITLE_LTR_ANCHOR='\u200e';
export const PRESET_NAME=TITLE_LTR_ANCHOR+TITLE_TRANSPORT+FORMATTER_RANK_STARS;

/** Optional parts carry a separator only after an earlier nonempty field. */
function row(parts){return parts.map((p,i)=>{
 const text=(i?gate(parts.slice(0,i).map(x=>x.condition).join('::or::'),' · '):'')+p.text;
 return p.field?`{?${text}?}`:gate(p.condition,text);
}).join('');}
const part=(field,text=`{${field}}`)=>({field,condition:present(field),text});
const greekSubCondition='stream.subtitles::~Greek';
const context=gate('stream.quality::=TS','📹 Telesync (TS)\n')+
 gate('stream.quality::=TC','📹 Telecine (TC)\n')+gate('stream.quality::=SCR','📼 Screener (SCR)\n')+
 gate('stream.regexMatched::lower::~bad',"🚩 {stream.regexMatched::replace('Radarr ','')::replace('Sonarr ','')}\n") +
 gate('stream.upscaled::istrue','🔼 Upscaled\n') +
 gate(VISUAL_CONFLICT,'⚠️ Conflicting HDR/SDR tags\n');
const healthMessage="{stream.message::replace('NZB Health: 🚫','❌')::replace('NZB Health: ','')::replace('AvailNZB 💚','💚')}";
const messages=gate('stream.message::exists',gate('stream.message::$NZB Health::or::stream.message::$AvailNZB','\n','\n💬 ')+healthMessage);
const noPreferred=gate('user.languages::exists',gate('stream.audioTracks::exists',gate(`${PREFERRED_TRACKS}::exists::isfalse`,'🗣️ Preferred audio unavailable\n'),
 gate(`${reliable}::and::${knownLanguages}::exists::and::${preferredLanguages}::exists::isfalse`,'🗣️ Preferred audio unavailable\n')));

export function buildPresetFormatter(preset='compact'){
 if(!['compact','detailed'].includes(preset))throw new Error(`Unknown preset ${preset}`);
 const detailed=preset==='detailed';
 const release=row([part('stream.container','📦 {stream.container::upper}'),part('stream.encode','🎞️ {stream.encode::upper}'),part('stream.releaseGroup','👥 {stream.releaseGroup::truncate(11)}'),...(detailed?[part('stream.country')]:[])]);
 const fileCore=row([
   {condition:'stream.seasonPack::istrue',text:'📚 Season pack'},
   part('stream.size','💾 {stream.size::sbytes}'),part('stream.folderSize','📁 {stream.folderSize::sbytes}'),
 ]);
 const file=fileCore+(detailed?'{? 📶 {stream.bitrate::sbitrate}?}{? 🕐 {stream.age}?}':'');
 const debrid="stream.type::in('debrid','usenet','stremio-usenet')";
 const cache=gate('service.cached::istrue','✅',gate('service.cached::isfalse','⏳ Uncached','❔ Cache unknown'));
 const servicePath=gate(debrid,cache)+gate('service.shortName::exists',gate(debrid,' ')+'☁️ {service.shortName}');
 const deliveryCore=row([
   {condition:debrid+'::or::service.shortName::exists',text:servicePath},
   part('addon.name',gate('stream.proxied::istrue','🛡️','🧩')+' {addon.name::truncate(14)}'),
   {condition:'addon.name::exists::isfalse::and::stream.proxied::istrue',text:'🛡️'},
 ]);
 // Each extra has its own icon, so use a single space rather than quadratic
 // separator gates. Suppress an indexer that already equals the addon label.
 const deliveryRow=deliveryCore+(detailed?
   gate('stream.indexer::lower::neq::addon.name::lower::and::stream.indexer::exists',' 🔍 {stream.indexer::truncate(18)}')+
   gate('stream.private::istrue',' 🔐 Private')+gate('stream.freeleech::istrue',' 🆓 Freeleech')+
   gate('stream.library::istrue::or::stream.preloading::istrue',' '+gate('stream.library::istrue','📚 Library','⬇️ Preloading')):'')+
   gate('stream.type::=p2p::and::stream.seeders::>0',' ⇋ {stream.seeders} seeders 🌱');
 const joinRows=rows=>rows.join('\n{tools.removeLine}\n');
 let visible=context+noPreferred+joinRows([release,file,deliveryRow]);
 visible+='\n{tools.removeLine}\n'+audioLanguageRow(detailed);
 if(detailed){
   visible+=gate('stream.audioTracks::exists::isfalse::and::stream.audioChannels::exists','\n🔊 {stream.audioChannels::join("/")}');
 }
 visible+=messages;
 // Subtitles are the last visible row, after spoken audio and provider messages.
 visible+=gate(greekSubCondition,'\n💬 ELˢ')+
   gate('stream.subtitles::exists::isfalse',gate(`${token('Ell.Sub')}::or::${token('Greek.Sub')}`,'\n💬 ELˢ?'));
 let name=PRESET_NAME+PRESET_MARKER;
 let description=visible;
 // Source and tier share a field so native per-field scans cannot echo the source.
 const segments=[(detailed?tierInject():'')+SOURCE,SPECIAL,RESOLUTION,VISUAL,AUDIO,...(detailed?FORMATTER_STREAMING_SEGMENTS:[])];
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
