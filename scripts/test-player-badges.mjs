/**
 * Kanso Player proof against NuvioTV 1.1.0-beta.9 (and the NuvioMobile 0.6.6
 * port). The functions below are line-for-line ports of PlaybackMatchText.kt,
 * PlayerMediaInfo.kt (mpv path) and StreamBadgeMatcher.matchedPlayerBadges.
 *
 * 1. Decoder matrix: every decoder state gets an independently written truth,
 *    never derived from the regexes; every skin must light exactly that set.
 * 2. Filename/stream-name phase: names that spell out codecs, languages and
 *    resolutions must never light a decoder group.
 * 3. Real titles: the Kanso formatter's stream.name drives specials, streaming,
 *    tiers, source and subtitles exactly as the stream list shows them.
 * `--java` repeats every regex decision in native java.util.regex.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { nuvioRegex } from './benchmark-badge-patterns.mjs';
import { PLAYER_SKINS, PLAYER_ID_PREFIX, NAME_GROUPS, playerPackFile, buildPlayerPack } from './build-player-packs.mjs';

// ---- Port of NuvioTV 1.1.0-beta.9 ----
const mpvCodecLabel = codec => {
  const c = codec.trim().toLowerCase();
  const fixed = { '': null, h264: 'AVC', ac3: 'AC-3', eac3: 'E-AC-3', truehd: 'TrueHD', opus: 'Opus', vorbis: 'Vorbis', dts: 'DTS' };
  if (c in fixed) return fixed[c];
  return c.startsWith('pcm') ? 'PCM' : codec.trim().toUpperCase();
};
function resolutionTokens({ videoWidth: w, videoHeight: h }) {
  if (w == null || h == null) return [];
  if (w >= 3800 || h >= 2100) return ['2160p', '4K', 'UHD'];
  if (w >= 2500 || h >= 1400) return ['1440p', '2K'];
  if (w >= 1900 || h >= 1000) return ['1080p', 'FHD'];
  if (w >= 1260 || h >= 700) return ['720p'];
  return [`${h}p`, 'SD'];
}
function videoCodecTokens(codec) {
  if (codec == null) return [];
  const u = codec.toUpperCase();
  if (u === 'HEVC') return ['HEVC', 'H.265', 'H265', 'x265'];
  if (u === 'AVC') return ['AVC', 'H.264', 'H264', 'x264'];
  return [codec];
}
function audioTokens(codec, profiles) {
  if (codec == null) return [];
  const label = codec.toUpperCase(), p = profiles.map(x => x.toUpperCase()), out = [];
  if (label.startsWith('E-AC-3')) out.push('DD+', 'DDP', 'EAC3');
  else if (label === 'AC-3') out.push('DD', 'AC3');
  else if (label === 'AC-4') out.push('AC-4', 'AC4');
  else if (label.startsWith('DTS')) {
    out.push('DTS');
    if (label.includes('HD') || p.some(x => x.includes('DTS-HD'))) out.push('DTS-HD');
    if (p.some(x => x.includes('MA'))) out.push('DTS-HD MA');
    if (p.some(x => x.includes('DTS:X'))) out.push('DTS:X');
  } else out.push(codec);
  if (label.endsWith('JOC') || p.some(x => x.includes('ATMOS'))) out.push('Atmos');
  return out;
}
const channelsToken = n => ({ 1: '1.0', 2: '2.0', 6: '5.1', 8: '7.1' })[n] ?? null;
export function playbackMatchText(info, languages) {
  const out = [...resolutionTokens(info), ...videoCodecTokens(info.videoCodec)];
  if (info.hdr.includes('DV')) out.push('DV', 'DoVi', 'Dolby Vision');
  if (info.hdr.includes('HDR10')) out.push('HDR', 'HDR10');
  if (info.hdr.includes('HLG')) out.push('HDR', 'HLG');
  const bit = info.bitDepth ?? (info.hdr.length ? 10 : null);
  if (bit != null) out.push(`${bit}bit`);
  out.push(...audioTokens(info.audioCodec, info.audioProfiles));
  const ch = channelsToken(info.audioChannels); if (ch) out.push(ch);
  out.push(...languages);
  return [...new Set(out)].join(' ');
}
const REFINE_DTS_HD_MA = /dts-?hd[ ._-]?ma\b|master[ ._-]?audio/i, REFINE_DTS_X = /\bdts[ ._:-]?x\b/i, REFINE_HDR10_PLUS = /\bhdr10\+/i;
export function refinePlaybackText(decoder, metadata) {
  if (!decoder.trim() || !metadata.length) return decoder;
  const joined = metadata.join(' '), lower = joined.toLowerCase(), extra = [];
  const eac3OrTruehd = ['DD+', 'DDP', 'EAC3', 'TrueHD'].some(x => decoder.includes(x));
  if (eac3OrTruehd && !decoder.includes('Atmos') && lower.includes('atmos')) extra.push('Atmos');
  if (decoder.includes('DTS-HD') && !decoder.includes('DTS-HD MA') && REFINE_DTS_HD_MA.test(joined)) extra.push('DTS-HD MA');
  if (decoder.includes('DTS') && !decoder.includes('DTS:X') && REFINE_DTS_X.test(joined)) extra.push('DTS:X');
  if (decoder.includes('HDR10') && !decoder.includes('HDR10+') && REFINE_HDR10_PLUS.test(joined)) extra.push('HDR10+');
  return extra.length ? `${decoder} ${extra.join(' ')}` : decoder;
}
const ws = s => s.replace(/[ \t\n\x0B\f\r]+/g, ' '); // Kotlin Regex("\\s+") is ASCII-only
/** StreamBadgeMatcher.matchedPlayerBadges: decoder wins per group; names fill empty groups. */
export function matchedPlayerBadges(playback, meta, filters) {
  const p = playback == null ? null : ws(playback), m = meta.map(ws);
  const hits = filters.map(f => p != null && f.re.test(p));
  const covered = new Set(filters.filter((f, i) => hits[i] && f.groupId).map(f => f.groupId));
  const out = new Map();
  filters.forEach((f, i) => {
    const hit = hits[i] || ((!f.groupId || !covered.has(f.groupId)) && m.some(c => f.re.test(c)));
    const key = f.imageURL || f.name;
    if (hit && !out.has(key)) out.set(key, f.id);
  });
  return [...out.values()];
}
export function playerText(info, langs, meta) {
  const text = playbackMatchText(info, langs);
  return refinePlaybackText(text, meta.map(s => s.trim()).filter(Boolean)) || null;
}

// ---- 1. Decoder states ----
const RES = [[3840, 2160, 'r-4k'], [3840, 1600, 'r-4k'], [2560, 1440, 'r-1440'], [1920, 1080, 'r-1080'], [1920, 800, 'r-1080'],
  [1280, 720, 'r-720'], [720, 576, 'r-576'], [720, 480, 'r-480'], [640, 360, 'r-360'], [704, 396, null]];
const PIC = [ // [hdr, bitDepth, truth]
  [[], null, []], [[], 8, []], [[], 10, ['v-10bit']], [[], 12, []],
  [['HDR10'], null, ['v-hdr10']], [['HDR10'], 10, ['v-hdr10']], [['HLG'], 10, ['v-hlg']],
  [['DV'], null, ['a-dv']], [['DV', 'HDR10'], 10, ['a-dv']], [['DV', 'HDR10'], 12, ['a-dv']], [['DV', 'HLG'], 10, ['a-dv', 'v-hlg']],
];
const AUD = [ // [engine, codec (mpv name or exo label), profiles, truth]
  ['mpv', 'truehd', ['Dolby TrueHD + Dolby Atmos'], ['a-at-th']], ['mpv', 'truehd', [], ['a-th']], ['exo', 'TrueHD', [], ['a-th']],
  ['mpv', 'eac3', ['Dolby Digital Plus + Dolby Atmos'], ['a-at-dp']], ['mpv', 'eac3', [], ['a-dp']],
  ['exo', 'E-AC-3-JOC', [], ['a-at-dp']], ['exo', 'E-AC-3', ['Atmos'], ['a-at-dp']], ['exo', 'E-AC-3', [], ['a-dp']],
  ['mpv', 'ac3', [], ['a-dd']], ['exo', 'AC-3', [], ['a-dd']], ['exo', 'AC-4', [], []],
  ['mpv', 'dts', ['DTS-HD MA'], ['a-dtsma']], ['mpv', 'dts', ['DTS-HD MA + DTS:X'], ['a-dtsx-ma']], ['mpv', 'dts', ['DTS-HD HRA'], ['a-dtshd']],
  ['mpv', 'dts', ['DTS'], ['a-dts']], ['mpv', 'dts', [], ['a-dts']], ['mpv', 'dts', ['DTS-ES Matrix'], ['a-dts']], ['mpv', 'dts', ['DTS Express'], ['a-dts']],
  ['exo', 'DTS', [], ['a-dts']], ['exo', 'DTS-HD', [], ['a-dtshd']], ['exo', 'DTS-HD', ['DTS-HD'], ['a-dtshd']], ['exo', 'DTS-HD', ['DTS-HD MA'], ['a-dtsma']],
  ['exo', 'DTS-HD', ['DTS:X', 'DTS-HD MA'], ['a-dtsx-ma']], ['exo', 'DTS:X', ['DTS:X'], ['a-dtsx']], ['exo', 'DTS Express', [], ['a-dts']],
  ['mpv', 'aac', [], ['a-aac']], ['exo', 'AAC', [], ['a-aac']], ['mpv', 'flac', [], ['a-flac']], ['mpv', 'opus', [], ['a-opus']],
  ['mpv', 'mp3', [], ['a-mp3']], ['mpv', 'pcm_s16le', [], ['a-pcm']], ['mpv', 'pcm_s24le', [], ['a-pcm']], ['mpv', 'pcm_bluray', [], ['a-pcm']],
  ['mpv', 'vorbis', [], []], ['exo', 'MPEG-H', [], []], ['mpv', 'mp2', [], []], [null, null, [], []],
];
const CH = [[1, ['ch-10']], [2, ['ch-20']], [6, ['ch-51']], [8, ['ch-71']], [3, []], [4, []], [5, []], [7, []], [null, []]];
const LANG = [ // [track language, localized name, truth]
  ['eng', 'English', ['l-en']], ['en', 'English', ['l-en']], ['el', 'Greek', ['l-el']], ['gre', 'Ελληνικά', ['l-el']], ['ell', 'Greek', ['l-el']],
  ['jpn', 'Japanese', ['l-ja']], ['pt-BR', 'Portuguese (Brazil)', ['l-pt']], ['por', 'Portuguese', ['l-pt']], ['es-419', 'Spanish (Latinoamérica)', ['l-es']],
  ['spa', 'Español', ['l-es']], ['zh-Hant', 'Chinese (Traditional)', ['l-zh']], ['hin', 'Hindi', ['l-in']], ['tam', 'Tamil', ['l-in']], ['nob', 'Norwegian Bokmål', ['l-no']],
  ['und', 'Unknown', []], ['isl', 'Icelandic', []], ['cat', 'Catalan', []], ['fil', 'Filipino', []], ['tgl', 'Tagalog', []], ['gle', 'Irish', []],
  ['ita', 'Italiano', ['l-it']], ['fre', 'Français', ['l-fr']], ['ger', 'Deutsch', ['l-de']], ['kor', 'Korean', ['l-ko']], ['ara', 'Arabic', ['l-ar']],
  ['heb', 'Hebrew', ['l-he']], ['may', 'Malay', ['l-ms']], [null, null, []],
];
const decoderCases = [];
for (const [w, h, r] of RES) for (const [hdr, bitDepth, pic] of PIC) for (const [engine, codec, profiles, aud] of AUD) for (const [ch, cht] of CH) {
  const audioCodec = codec == null ? null : engine === 'mpv' ? mpvCodecLabel(codec) : codec;
  const info = { videoWidth: w, videoHeight: h, videoCodec: hdr.includes('DV') ? 'HEVC' : 'AVC', hdr, bitDepth, audioCodec, audioProfiles: profiles, audioChannels: ch };
  decoderCases.push({ info, langs: [], meta: [], truth: [r, ...pic, ...aud, ...cht].filter(Boolean) });
}
const busy = { videoWidth: 3840, videoHeight: 2160, videoCodec: 'HEVC', hdr: ['DV', 'HDR10'], bitDepth: 10, audioCodec: 'TrueHD', audioProfiles: ['Dolby TrueHD + Dolby Atmos'], audioChannels: 8 };
for (const [code, name, l] of LANG) decoderCases.push({ info: busy, langs: [code, name].filter(Boolean), meta: [], truth: ['r-4k', 'a-dv', 'a-at-th', 'ch-71', ...l] });
// Without video dimensions the decoder text has no anchor, so nothing is claimed.
decoderCases.push({ info: { ...busy, videoWidth: null, videoHeight: null }, langs: ['eng', 'English'], meta: [], truth: [] });
// Filename refinement only adds what the decoder's base format allows.
const hdr10 = { videoWidth: 3840, videoHeight: 2160, videoCodec: 'HEVC', hdr: ['HDR10'], bitDepth: 10, audioProfiles: [], audioChannels: 6 };
for (const [info, meta, truth] of [
  [{ ...hdr10, audioCodec: 'TrueHD' }, ['Movie.2160p.UHD.BluRay.REMUX.HDR10+.TrueHD.7.1.Atmos-GRP.mkv'], ['r-4k', 'v-hdr10p', 'a-at-th', 'ch-51']],
  [{ ...hdr10, audioCodec: 'E-AC-3' }, ['Show.S01E01.2160p.WEB-DL.DDP5.1.Atmos.HDR10.H.265-GRP.mkv'], ['r-4k', 'v-hdr10', 'a-at-dp', 'ch-51']],
  [{ ...hdr10, audioCodec: 'DTS-HD' }, ['Movie.2160p.BluRay.DTS-HD.MA.5.1-GRP.mkv'], ['r-4k', 'v-hdr10', 'a-dtsma', 'ch-51']],
  [{ ...hdr10, audioCodec: 'DTS-HD' }, ['Movie German DTS-HD HRA 7.1 Remastered'], ['r-4k', 'v-hdr10', 'a-dtshd', 'ch-51']],
  [{ ...hdr10, audioCodec: 'DTS' }, ['Movie.2160p.DTS-X.7.1-GRP.mkv'], ['r-4k', 'v-hdr10', 'a-dtsx', 'ch-51']],
  [{ ...hdr10, audioCodec: 'AC-3' }, ['Movie.MULTi.VFF.ITA.ENG.TrueHD.Atmos.2160p.mkv'], ['r-4k', 'v-hdr10', 'a-dd', 'ch-51']],
  [{ ...hdr10, hdr: ['DV', 'HDR10'], audioCodec: 'AAC' }, ['Movie.2160p.DV.HDR10+.mkv'], ['r-4k', 'a-dv', 'a-aac', 'ch-51']],
]) decoderCases.push({ info, langs: [], meta, truth });

// ---- 2. Names that spell decoder facts must stay dark when the decoder cannot speak ----
// Real filenames open with the title and Kanso's stream.name with an LTR mark,
// so neither can start with Nuvio's exact resolution tokens ("1080p FHD …").
const NOISY_NAMES = [
  'Movie 2160p 4K UHD HEVC DV HDR10 10bit TrueHD Atmos 7.1 ENG ITA', '720p.WEB-DL.AAC2.0.eng.mkv', 'Movie 1080p FHD x264 DTS-HD MA 5.1 gre Greek',
  '2160p 4K UHD.Movie.mkv', '‎🔗 ★★★★☆ · 87% 1080p FHD eng',
  'Movie.2023.1080p.WEB-DL.DDP5.1.Atmos.H.264-FLUX.mkv', '[SubsPlease] Frieren - 01 (1080p) [ENG].mkv', 'eng English el Greek pt-BR', 'PCM FLAC Opus MP3 AC3 DD+',
];

const loadPack = skin => {
  const pack = JSON.parse(fs.readFileSync(playerPackFile(skin), 'utf8'));
  return { pack, filters: pack.filters.map(f => ({ ...f, re: nuvioRegex(f.pattern), short: f.id.slice(PLAYER_ID_PREFIX.length) })) };
};
const short = (filters, ids) => ids.map(id => filters.find(f => f.id === id).short).sort();
const lines = [], b64 = s => Buffer.from(s).toString('base64');
let checked = 0;
for (const skin of PLAYER_SKINS) {
  const { pack, filters } = loadPack(skin);
  assert.deepEqual(pack, buildPlayerPack(skin), `${skin}: player pack is stale; run npm run build`);
  const source = JSON.parse(fs.readFileSync(`kanso-${skin}.json`, 'utf8'));
  for (const f of pack.filters) {
    const original = source.filters.find(s => PLAYER_ID_PREFIX + s.id === f.id);
    assert.equal(f.imageURL, original.imageURL, `${f.id}: player uses the same artwork`);
    assert.ok(f.isEnabled && pack.groups.some(g => g.id === f.groupId));
    if (NAME_GROUPS.has(original.groupId)) assert.equal(f.pattern, original.pattern, `${f.id}: name groups keep the stream-list pattern`);
    lines.push(['P', `player-${skin}`, f.id, b64(f.pattern)].join('\t'));
  }
  const decoderIds = filters.filter(f => !NAME_GROUPS.has(f.groupId.slice(PLAYER_ID_PREFIX.length)));
  for (const c of decoderCases) {
    const text = playerText(c.info, c.langs, c.meta);
    const got = short(filters, matchedPlayerBadges(text, c.meta, filters));
    assert.deepEqual(got, [...c.truth].sort(), `${skin}: decoder "${text}" meta ${JSON.stringify(c.meta)}`);
    if (text) lines.push(['C', `player-${skin}`, b64(text), b64(text), filters.filter(f => f.re.test(ws(text))).map(f => f.id).join(',')].join('\t'));
    checked++;
  }
  for (const name of NOISY_NAMES) {
    for (const decoder of [null, 'SD']) { // no decoder text, or one without the resolution anchor
      const lit = matchedPlayerBadges(decoder, [name], decoderIds);
      assert.deepEqual(lit, [], `${skin}: name lit decoder groups: "${name}" -> ${lit}`);
      checked++;
    }
    lines.push(['C', `player-${skin}`, b64(name), b64(ws(name)), filters.filter(f => f.re.test(ws(name))).map(f => f.id).join(',')].join('\t'));
  }
}

// ---- 3. Real titles: Kanso stream.name drives the name groups ----
let realChecked = 0;
const evidence = JSON.parse(fs.readFileSync('docs/release-evidence/real-title-renders.json', 'utf8'));
for (const skin of PLAYER_SKINS) {
  const { filters } = loadPack(skin);
  for (const e of evidence) {
    const streamPack = JSON.parse(fs.readFileSync(`kanso-${skin}.json`, 'utf8'));
    const groupOf = new Map(streamPack.filters.map(f => [f.id, f.groupId]));
    const want = e.hits.filter(id => NAME_GROUPS.has(groupOf.get(id))).sort();
    // Decoder plays the same file: its own groups are covered, the name fills the rest.
    const text = playerText(e.decoder, [], [e.filename, e.rawName]);
    const got = short(filters, matchedPlayerBadges(text, [e.filename, e.rawName], filters));
    const gotName = got.filter(id => NAME_GROUPS.has(groupOf.get(id) ?? filters.find(f => f.short === id).groupId.slice(PLAYER_ID_PREFIX.length))).sort();
    assert.deepEqual(gotName, want, `${skin}/${e.preset} ${e.label}: name groups differ from the stream list`);
    const gotDecoder = got.filter(id => !gotName.includes(id)).sort();
    const decoderOnly = short(filters, matchedPlayerBadges(text, [], filters));
    assert.deepEqual(gotDecoder, decoderOnly.filter(id => !gotName.includes(id)), `${skin}/${e.preset} ${e.label}: a name lit a decoder group`);
    realChecked++;
  }
}

let native = 'native Java not run (pass --java to enable)';
const java = process.argv.find(a => a.startsWith('--java'));
if (java) {
  // The shared checker also demands one title-direction record; the player has
  // no title, so a fixed LTR-anchored sentinel satisfies it without affecting badges.
  lines.push(['T', b64('player sentinel'), b64('‎א')].join('\t'));
  const input = path.resolve('docs/release-evidence/player-native-cases.tsv');
  fs.mkdirSync(path.dirname(input), { recursive: true });
  fs.writeFileSync(input, lines.join('\n') + '\n');
  const bin = java.includes('=') ? java.split('=')[1] : 'java';
  const r = spawnSync(bin, [path.resolve('scripts/KansoNuvioChecks.java'), input], { encoding: 'utf8', timeout: 300000, windowsHide: true });
  fs.rmSync(input, { force: true });
  if (r.status !== 0) throw new Error(r.stderr || r.error?.message || 'Java player validation failed');
  native = r.stdout.trim();
}
console.log(`PASS: Kanso Player (Nuvio TV 1.1.0-beta.9 two-phase) ${PLAYER_SKINS.length} skins: ${decoderCases.length} decoder states + ${NOISY_NAMES.length} noisy names (${checked} checks), ${realChecked} real-title name checks. ${native}`);
