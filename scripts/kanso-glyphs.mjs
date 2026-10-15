/** Production vectors interpreted from the generated Kanso glyph direction board. */
export const GLYPHS={
 'hard-sub':'<rect x="3" y="4" width="26" height="24" rx="3"/><path d="M8 18h16M8 23h12M12 10h8m-4-3v6"/>',
 'side-by-side':'<rect x="2" y="5" width="28" height="22" rx="3"/><path d="M16 5v22M7 12h4v8H7zM21 12h4v8h-4z"/>',
 'over-under':'<rect x="2" y="5" width="28" height="22" rx="3"/><path d="M2 16h28M10 9h12v3H10zM10 20h12v3H10z"/>',
 'audio-description':'<circle cx="12" cy="9" r="4"/><path d="M4 27v-4a8 8 0 0 1 16 0v4M23 10c3 3 3 9 0 12m4-16c5 6 5 14 0 20"/>',
 'forced-caption':'<rect x="3" y="5" width="26" height="23" rx="3"/><path d="M8 21h16M8 25h11M16 7v9m-4-4 4 4 4-4"/>',
 sdh:'<path d="M9 18v-7a8 8 0 0 1 16 0c0 5-5 6-5 11a5 5 0 0 1-10 0M14 13a3 3 0 0 1 6 0c0 3-4 3-4 6M3 29 29 3"/>',
 tier:'<path d="M16 2 29 9v14l-13 7-13-7V9z"/>',
 download:'<path d="M8 24H7a6 6 0 0 1-.6-12A9 9 0 0 1 24 11a6.5 6.5 0 0 1 1 13h-1M16 16v13m-5-5 5 5 5-5"/>',
 capture:'<rect x="3" y="5" width="26" height="21" rx="4"/><path d="m13 11 8 5-8 5zM7 30h18"/>',
 remux:'<rect x="2" y="3" width="11" height="11" rx="2"/><rect x="19" y="3" width="11" height="11" rx="2"/><path d="M5 7h.1M5 10h.1M22 7h.1M22 10h.1M7.5 15c0 4 8.5 3 8.5 7m8.5-7c0 4-8.5 3-8.5 7"/><rect x="10" y="22" width="12" height="8" rx="2"/>',
 speech:'<path d="M22 10a8 8 0 0 0-8-7H11a9 9 0 0 0-9 9v1a9 9 0 0 0 4 7v7l6-5h3a8 8 0 0 0 7-7M25 9c3 3 3 8 0 11m4-15c5 6 5 13 0 19"/>',
 subtitle:'<rect x="2" y="5" width="28" height="22" rx="4"/><path d="M8 14h16M8 20h10"/>',
 speaker:'<path d="M3 11h6l11-8v26L9 21H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" fill="currentColor" stroke="none"/><path d="M26 7a13 13 0 0 1 0 18" stroke-width="3"/>',
 screen:'<path d="M3 11V5h7m12 0h7v6m0 10v5h-7m-12 0H3v-5M12 30h8m-4-4v4"/>',
 range:'<circle cx="16" cy="16" r="8"/><path d="M16 8v16M16 1v3m0 24v3M1 16h3m24 0h3M5 5l2 2m18 18 2 2M5 27l2-2M25 7l2-2"/><path d="M16 8a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
 cut:'<circle cx="7" cy="7" r="4"/><circle cx="7" cy="25" r="4"/><path d="m10 10 14 14M10 22 24 8M26 4h4v24h-4"/>',
 extend:'<path d="M4 10h22m-16-6-6 6 6 6m18 6H6m16-6 6 6-6 6"/>',
 clapper:'<rect x="3" y="13" width="26" height="16" rx="3"/><path d="m3 13-1-7 25-5 2 7-26 5M8 5l4 5m5-7 4 5M3 19h26"/>',
 film:'<rect x="3" y="5" width="26" height="22" rx="3"/><path d="M9 5v22M23 5v22M3 12h6M3 20h6m14-8h6m-6 8h6"/>',
 eye:'<path d="M2 16s6-10 14-10 14 10 14 10-6 10-14 10S2 16 2 16z"/><circle cx="16" cy="16" r="5"/>',
 monochrome:'<circle cx="16" cy="16" r="12"/><path d="M16 4v24a12 12 0 0 0 0-24z" fill="currentColor" stroke="none"/>',
 corners:'<path d="M11 3H3v8m18-8h8v8M3 21v8h8m18-8v8h-8"/>',
 remaster:'<path d="M15 7H4v22h24V18M4 13h6m-6 8h6M10 7v22m12-28 2.5 6.5L31 10l-6.5 2.5L22 19l-2.5-6.5L13 10l6.5-2.5z"/>',
 sliders:'<path d="M3 7h12m7 0h7M3 16h4m7 0h15M3 25h17m7 0h2"/><circle cx="18" cy="7" r="3"/><circle cx="10" cy="16" r="3"/><circle cx="23" cy="25" r="3"/>',
 check:'<rect x="3" y="5" width="26" height="22" rx="3"/><path d="m9 16 5 5 9-10"/>',
 repack:'<path d="m3 8 12-6 12 6-12 6zM3 8v15l12 6V14m12-6v7M21 26a6 6 0 1 1 9-8m-4-1h4v-4M15 29v-9"/>',
 merge:'<path d="M3 7h5c6 0 7 9 13 9h8M3 25h5c6 0 7-9 13-9m3-5 5 5-5 5"/>',
 nodes:'<rect x="3" y="3" width="18" height="18" rx="3"/><rect x="11" y="11" width="18" height="18" rx="3"/>',
 audio:'<path d="M12 26c0-6-8-8-8-15a8 8 0 0 1 16-1M12 21c0-5-5-6-5-10a5 5 0 0 1 9-3M21 15v10m5-15v19m5-13v7"/>',
 frames:'<path d="m3 7 19-5v19L3 26zM12 12l18-5v19l-18 5z"/>',
 disc:'<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="3"/>',
 broadcast:'<path d="M16 15v14m-5 0h10M10 9a9 9 0 0 0 0 13m12-13a9 9 0 0 1 0 13M6 5a15 15 0 0 0 0 21M26 5a15 15 0 0 1 0 21"/><circle cx="16" cy="11" r="2"/>',
 camera:'<rect x="3" y="9" width="19" height="16" rx="3"/><path d="m22 13 8-4v16l-8-4M8 9V5h10v4"/>',
 quality:'<path d="M16 3 28 9v14l-12 6-12-6V9z"/><path d="M10 16h12"/>',
 bits:'<rect x="5" y="5" width="22" height="22" rx="3"/><path d="M10 1v4m6-4v4m6-4v4M10 27v4m6-4v4m6-4v4M1 10h4m-4 6h4m-4 6h4m22-12h4m-4 6h4m-4 6h4M11 11h10v10H11z"/>',
 music:'<path d="M12 24V7l16-4v17M12 12l16-4"/><ellipse cx="8" cy="25" rx="4" ry="3"/><ellipse cx="24" cy="21" rx="4" ry="3"/>',
 waveform:'<path d="M2 16h4l3-10 5 20 5-20 4 10h7"/>',
 anime:'<path d="m16 3 4 9 10 4-10 4-4 9-4-9-10-4 10-4z"/>',
 hue:'<circle cx="16" cy="16" r="12"/><path d="M16 4v24M4 16h24"/><circle cx="16" cy="16" r="4"/>',
 hdrip:'<rect x="3" y="5" width="26" height="22" rx="3"/><path d="m12 10 10 6-10 6z"/>',
 screener:'<rect x="3" y="5" width="26" height="22" rx="3"/><path d="M8 16h16m-8-7v14"/>',
 telecine:'<path d="M4 6h11v20H4zM20 11h9v15h-9M15 16h5M7 10h5m-5 6h5m-5 6h5"/>',
 sync:'<path d="M27 11a12 12 0 0 0-20-5L3 10m0-7v7h7M5 21a12 12 0 0 0 20 5l4-4m0 7v-7h-7"/>',
 hlg:'<path d="M2 25h28M4 22c6 0 8-7 12-10s7-4 12-4"/>',
 sdr:'<rect x="3" y="5" width="26" height="22" rx="3"/><path d="M9 11h14M9 16h10M9 21h6"/>',
};
export function glyphSvg(name,ink='white'){
 if(!GLYPHS[name])throw new Error(`Unknown Kanso glyph ${name}`);
 const color=ink==='black'?'#000000':ink.startsWith('#')?ink:'#FFFFFF';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 34 34" color="${color}"><g transform="translate(1 1)" stroke="${color}" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" fill="none">${GLYPHS[name]}</g></svg>`;
}
export function glyphForBadge(id,groupId){
 const exact={'q-hc':'hard-sub','q-dvd-remux':'disc','v-3d-sbs':'side-by-side','v-3d-ou':'over-under','a-description':'audio-description','caption-forced':'forced-caption','caption-sdh':'sdh','q-w':'download','q-wr':'capture','q-r':'remux','q-hdtv':'broadcast','q-hdrip':'hdrip','q-dvdrip':'disc','q-scr':'screener','q-tc':'telecine','q-ts':'sync','q-cam':'camera','seadex-release':'anime','hybrid-release':'merge','edition-directors-cut':'cut','edition-extended':'extend','edition-theatrical':'clapper','uncut-edition':'film','uncensored-edition':'eye','edition-bw':'monochrome','edition-true-hue':'hue','open-matte-edition':'corners','remastered-release':'remaster','regraded-release':'sliders','proper-release':'check','repack-release':'repack','v-hdr':'range','v-hlg':'hlg','v-sdr':'sdr','v-10bit':'bits','v-ai':'nodes','v-3d':'frames','a-aac':'audio','a-mp3':'music','a-pcm':'waveform'};
 if(exact[id])return exact[id];
 if(id.startsWith('l-'))return'speech';
 if(id.startsWith('sub-'))return'subtitle';
 if(groupId==='gr')return'screen';
 if(groupId==='gc')return'speaker';
 if(id.startsWith('web-'))return id.endsWith('-webrip')?'capture':'download';
 if(id.startsWith('remux-'))return'remux';
 return null;
}
