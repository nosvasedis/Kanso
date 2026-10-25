/**
 * Kanso Player proof. `playbackMatchText` below is a line-for-line port of
 * NuvioTV PlaybackMatchText.kt + PlayerMediaInfo.kt (mpv and ExoPlayer paths).
 * Every decoder state in the matrix gets an independently written truth
 * (`truth()`), never derived from the regexes, and every skin must light
 * exactly that set: in JS here and in native java.util.regex (`--java`).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { nuvioRegex } from './benchmark-badge-patterns.mjs';
import { PLAYER_SKINS, PLAYER_ID_PREFIX, playerPackFile, buildPlayerPack } from './build-player-packs.mjs';

// ---- Port of NuvioTV (PlaybackMatchText.kt, PlayerMediaInfo.kt) ----
const mpvCodecLabel = c => ({ '': null, h264: 'AVC', ac3: 'AC-3', eac3: 'E-AC-3', truehd: 'TrueHD', opus: 'Opus', vorbis: 'Vorbis' })[c.trim().toLowerCase()] ?? c.trim().toUpperCase();
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
  if (u === 'HEVC' || u === 'DOLBY VISION') return ['HEVC', 'H.265', 'H265', 'x265'];
  if (u === 'AVC') return ['AVC', 'H.264', 'H264', 'x264'];
  return [codec];
}
function audioTokens(codec, profile) {
  if (codec == null) return [];
  const label = codec.toUpperCase(), p = (profile ?? '').toUpperCase(), out = [];
  if (label.startsWith('E-AC-3')) out.push('DD+', 'DDP', 'EAC3');
  else if (label === 'AC-3') out.push('DD', 'AC3');
  else if (label.startsWith('DTS')) {
    out.push('DTS');
    if (label.includes('HD') || p.includes('DTS-HD')) out.push('DTS-HD');
    if (p.includes('MA')) out.push('DTS-HD MA');
    if (p.includes('DTS:X')) out.push('DTS:X');
  } else out.push(codec);
  if (label.endsWith('JOC') || p.includes('ATMOS')) out.push('Atmos');
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
  out.push(...audioTokens(info.audioCodec, info.audioProfile));
  const ch = channelsToken(info.audioChannels); if (ch) out.push(ch);
  out.push(...languages);
  return [...new Set(out)].join(' ');
}

// ---- Decoder states ----
const RES = [[3840, 2160, 'r-4k'], [3840, 1600, 'r-4k'], [2560, 1440, 'r-1440'], [1920, 1080, 'r-1080'], [1920, 800, 'r-1080'],
  [1280, 720, 'r-720'], [720, 576, 'r-576'], [720, 480, 'r-480'], [640, 360, 'r-360'], [704, 396, null], [null, null, null]];
const PIC = [ // [hdr, bitDepth, truth]
  [[], null, []], [[], 8, []], [[], 10, ['v-10bit']], [[], 12, []],
  [['HDR10'], null, ['v-hdr10']], [['HDR10'], 10, ['v-hdr10']], [['HLG'], 10, ['v-hlg']],
  [['DV'], null, ['a-dv']], [['DV', 'HDR10'], 10, ['a-dv']], [['DV', 'HDR10'], 12, ['a-dv']], [['DV', 'HLG'], 10, ['a-dv', 'v-hlg']],
];
const AUD = [ // [mpv codec name | exo label, profile, truth]  (engine: 'mpv' runs mpvCodecLabel)
  ['mpv', 'truehd', 'Dolby TrueHD + Dolby Atmos', ['a-at-th']], ['mpv', 'truehd', null, ['a-th']], ['exo', 'TrueHD', null, ['a-th']],
  ['mpv', 'eac3', 'Dolby Digital Plus + Dolby Atmos', ['a-at-dp']], ['mpv', 'eac3', null, ['a-dp']],
  ['exo', 'E-AC-3-JOC', null, ['a-at-dp']], ['exo', 'E-AC-3', null, ['a-dp']],
  ['mpv', 'ac3', null, ['a-dd']], ['exo', 'AC-3', null, ['a-dd']],
  ['mpv', 'dts', 'DTS-HD MA', ['a-dtsma']], ['mpv', 'dts', 'DTS-HD MA + DTS:X', ['a-dtsx-ma']], ['mpv', 'dts', 'DTS-HD HRA', ['a-dtshd']],
  ['mpv', 'dts', 'DTS', ['a-dts']], ['mpv', 'dts', null, ['a-dts']], ['mpv', 'dts', 'DTS-ES Matrix', ['a-dts']], ['mpv', 'dts', 'DTS Express', ['a-dts']],
  ['exo', 'DTS', null, ['a-dts']], ['exo', 'DTS-HD', null, ['a-dtshd']], ['exo', 'DTS Express', null, ['a-dts']],
  ['mpv', 'aac', null, ['a-aac']], ['exo', 'AAC', null, ['a-aac']], ['mpv', 'flac', null, ['a-flac']], ['mpv', 'opus', null, ['a-opus']],
  ['mpv', 'mp3', null, ['a-mp3']], ['mpv', 'pcm_s16le', null, ['a-pcm']], ['mpv', 'pcm_s24le', null, ['a-pcm']], ['mpv', 'pcm_f32le', null, ['a-pcm']],
  ['mpv', 'vorbis', null, []], ['exo', 'AC-4', null, []], ['exo', 'MPEG-H', null, []], ['mpv', 'mp2', null, []], [null, null, null, []],
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

const cases = [];
for (const [w, h, r] of RES) for (const [hdr, bitDepth, pic] of PIC) for (const [engine, codec, profile, aud] of AUD) for (const [ch, cht] of CH) {
  const audioCodec = codec == null ? null : engine === 'mpv' ? mpvCodecLabel(codec) : codec;
  const info = { videoWidth: w, videoHeight: h, videoCodec: hdr.includes('DV') ? 'HEVC' : 'AVC', hdr, bitDepth, audioCodec, audioProfile: engine === 'mpv' ? profile : null, audioChannels: ch };
  cases.push({ info, langs: [], truth: [r, ...pic, ...aud, ...cht].filter(Boolean) });
}
// Languages sweep with a fixed, busy decoder state so codes sit beside every token.
const busy = { videoWidth: 3840, videoHeight: 2160, videoCodec: 'HEVC', hdr: ['DV', 'HDR10'], bitDepth: 10, audioCodec: 'TrueHD', audioProfile: 'Dolby TrueHD + Dolby Atmos', audioChannels: 8 };
for (const [code, name, l] of LANG) cases.push({ info: busy, langs: [code, name].filter(Boolean), truth: ['r-4k', 'a-dv', 'a-at-th', 'ch-71', ...l] });

// ---- Check every skin ----
const lines = [];
let checked = 0;
for (const skin of PLAYER_SKINS) {
  const pack = JSON.parse(fs.readFileSync(playerPackFile(skin), 'utf8'));
  assert.deepEqual(pack, buildPlayerPack(skin), `${skin}: player pack is stale; run npm run build`);
  const source = JSON.parse(fs.readFileSync(`kanso-${skin}-detailed.json`, 'utf8'));
  for (const f of pack.filters) {
    const original = source.filters.find(s => PLAYER_ID_PREFIX + s.id === f.id);
    assert.equal(f.imageURL, original.imageURL, `${f.id}: player uses the same artwork`);
    assert.ok(f.isEnabled && pack.groups.some(g => g.id === f.groupId));
    lines.push(['P', `player-${skin}`, f.id, Buffer.from(f.pattern).toString('base64')].join('\t'));
  }
  const compiled = pack.filters.map(f => [f.id.slice(PLAYER_ID_PREFIX.length), nuvioRegex(f.pattern)]);
  for (const c of cases) {
    const text = playbackMatchText(c.info, c.langs);
    const hits = compiled.filter(([, re]) => re.test(text)).map(([id]) => id).sort();
    assert.deepEqual(hits, [...c.truth].sort(), `${skin}: "${text}"`);
    // Formatter markers never appear in player text, so the stream-list pack stays dark there.
    if (skin === 'outline' && checked < cases.length) assert.equal(source.filters.filter(b => nuvioRegex(b.pattern).test(text)).length, 0);
    lines.push(['C', `player-${skin}`, Buffer.from(text).toString('base64'), Buffer.from(text).toString('base64'), c.truth.map(id => PLAYER_ID_PREFIX + id).sort().join(',')].join('\t'));
    checked++;
  }
}
let native = 'native Java not run (pass --java to enable)';
const java = process.argv.find(a => a.startsWith('--java'));
if (java) {
  // The shared checker also demands one title-direction record; the player has
  // no title, so a fixed LTR-anchored sentinel satisfies it without affecting badges.
  lines.push(['T', Buffer.from('player sentinel').toString('base64'), Buffer.from('‎א').toString('base64')].join('\t'));
  const input = path.resolve('docs/release-evidence/player-native-cases.tsv');
  fs.mkdirSync(path.dirname(input), { recursive: true });
  fs.writeFileSync(input, lines.join('\n') + '\n');
  const bin = java.includes('=') ? java.split('=')[1] : 'java';
  const r = spawnSync(bin, [path.resolve('scripts/KansoNuvioChecks.java'), input], { encoding: 'utf8', timeout: 120000, windowsHide: true });
  if (r.status !== 0) throw new Error(r.stderr || r.error?.message || 'Java player validation failed');
  native = r.stdout.trim();
}
console.log(`PASS: Kanso Player ${PLAYER_SKINS.length} skins × ${cases.length} decoder states (${checked} checks), exact chips from Nuvio player text. ${native}`);
