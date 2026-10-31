/**
 * Real-title proof: engine FileParser -> Kanso formatter -> every Nuvio pack.
 * Exact chip sets (no extra chip may light), visible-text grammar (no language
 * code or template residue), and the % score. `DUMP=1` prints what renders.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CustomFormatter } from '../.vendor/AIOStreams/packages/core/src/formatters/custom.ts';
import FileParser from '../.vendor/AIOStreams/packages/core/src/parser/file.ts';
import { nuvioHaystacks, nuvioRegex } from './benchmark-badge-patterns.mjs';
import { displayLanguageId } from './display-language-families.mjs';
import { REAL_TITLE_FIXTURES } from './real-title-fixtures.mjs';

const clean = (s: string) => s.replace(/[᠋-᠍​-‏⁠-⁯﻿]/g, '');
const dump = !!process.env.DUMP;
const TRANSPORT = '(?:🔗|🧲|🌐|📰|📺|▶️|🗄️|↗️)';
const NAME_GRAMMAR = new RegExp(`^${TRANSPORT} ?(?:[★☆]{5}(?: · \\d{1,3}%)?)?(?: 🌱 \\d+)?$`, 'u');
const LINE_GRAMMAR = [
  /^🚩 .+$/u, /^🔼 Upscaled$/u, /^⚠️ HDR\/SDR conflict$/u, /^🗣️ Preferred audio missing$/u,
  /^(?:[⚡⏳❔](?: · |$))?(?:📦 [A-Z0-9]+(?: · |$))?(?:🎞️ [A-Za-z0-9]+(?: · |$))?(?:👥 [^\s·]+(?: · |$))?(?:[A-Z]{2})?$/u,
  /^(?:📚 Pack(?: · |$))?(?:💾 [\d.]+ [KMGT]?B(?: · |$))?(?:📁 [\d.]+ [KMGT]?B)?(?: 📶 \S+ \S+)?(?: 🕐 \S+)?$/u,
  /^☁️ RD · 🧩 Comet(?: 🔍 \S+)?$/u,
];
let failures = 0;
// Renders reused by test-player-badges.mjs (player reads filename + stream.name).
const renders: any[] = [];
const DIMS: Record<string, [number, number]> = { '2160p': [3840, 2160], '1440p': [2560, 1440], '1080p': [1920, 1080], '720p': [1280, 720], '576p': [720, 576], '480p': [720, 480] };
const fixtures = REAL_TITLE_FIXTURES as any[];
for (const preset of ['detailed']) {
  const suffix = '';
  const templates = JSON.parse(fs.readFileSync(`formatter${suffix}.json`, 'utf8'));
  const packs = ['solid', 'transparent', 'mono', 'outline'].map(skin => JSON.parse(fs.readFileSync(`kanso-${skin}${suffix}.json`, 'utf8')));
  for (const f of fixtures) {
    const parsed: any = FileParser.parse(f.file);
    if (f.tracks) Object.assign(parsed, { audioTracks: f.tracks, mediaInfoQuality: 'probe' });
    if (f.subtitleTracks) Object.assign(parsed, { subtitleTracks: f.subtitleTracks, subtitles: f.subtitleTracks.map((t: any) => t.lang), mediaInfoQuality: 'probe' });
    if (f.pack) parsed.seasonPack = true;
    const engine = new CustomFormatter(templates.name, templates.description, {
      userData: { preferredLanguages: f.prefs ?? ['English'], preferredSubtitles: f.subs ?? [] },
      queryType: f.anime ? 'anime.series' : 'movie', isAnime: !!f.anime, maxSeScore: 100,
    } as any);
    const stream: any = { type: 'debrid', filename: f.file, rankedStreamExpressionsMatched: f.rse ?? [], size: 18.2e9, proxied: false, streamExpressionScore: 87,
      parsedFile: parsed, addon: { name: 'Comet' }, service: { id: 'realdebrid', cached: true },
      ...(f.seadex ? { seadex: { isSeadex: true, isBest: true } } : {}) };
    const out = await engine.format(stream);
    const name = clean(out.name).trim(), lines = clean(out.description).split('\n').filter(Boolean);
    const hay = nuvioHaystacks([out.name, out.description, f.file]);
    const hitSets = packs.map(p => p.filters.filter((b: any) => b.isEnabled && hay.some((s: string) => nuvioRegex(b.pattern).test(s))).map((b: any) => b.id).sort());
    const [w, h] = DIMS[parsed.resolution] ?? [1920, 1080];
    renders.push({ preset, label: f.label, filename: f.file, rawName: out.name, hits: hitSets[0],
      decoder: { videoWidth: w, videoHeight: h, videoCodec: 'HEVC', hdr: (parsed.visualTags ?? []).filter((t: string) => ['DV', 'HDR10', 'HLG'].includes(t)), bitDepth: null, audioCodec: 'AAC', audioProfiles: [], audioChannels: 2 } });
    const expected = [...f.badges, ...(f[preset] ?? [])].map(displayLanguageId).sort();
    if (dump) { console.log(`\n[${preset}] ${f.label}\n  parsed: ${JSON.stringify({ q: parsed.quality, r: parsed.resolution, v: parsed.visualTags, a: parsed.audioTags, c: parsed.audioChannels, n: parsed.network, e: parsed.editions, g: parsed.releaseGroup })}\n  name: ${name}\n  desc: ${lines.join(' ⏎ ')}\n  hits: ${hitSets[0].join(' ')}\n  want: ${expected.join(' ')}`); }
    try {
      for (const h of hitSets) assert.deepEqual(h, hitSets[0], 'skins disagree');
      assert.deepEqual(hitSets[0], expected, `exact chip set`);
      for (const id of (f.forbid ?? []).map(displayLanguageId)) assert.ok(!hitSets[0].includes(id), `forbidden ${id}`);
      assert.match(name, NAME_GRAMMAR, `title grammar: ${name}`);
      if (preset === 'detailed') assert.ok(name.includes('· 87%'), `score with %: ${name}`); else assert.ok(!/\d%/.test(name), 'Compact hides the score');
      for (const line of lines) if (!/^💬 /.test(line)) assert.ok(LINE_GRAMMAR.some(re => re.test(line)), `unexpected visible text: "${line}"`);
      for (const t of f.text ?? []) assert.ok(lines.join('\n').includes(t), `missing text ${t}`);
      for (const t of f.absent ?? []) assert.ok(!lines.join('\n').includes(t), `unexpected text ${t}`);
    } catch (e: any) {
      failures++;
      console.error(`FAIL [${preset}] ${f.label}: ${e.message.split('\n')[0]}\n  hits ${hitSets[0].join(' ')}\n  want ${expected.join(' ')}\n  name ${name}\n  desc ${lines.join(' ⏎ ')}`);
    }
  }
}
fs.mkdirSync('docs/release-evidence', { recursive: true });
fs.writeFileSync('docs/release-evidence/real-title-renders.json', JSON.stringify(renders, null, 2) + '\n');
if (failures) { console.error(`\n${failures} real-title failures`); process.exit(1); }
console.log(`PASS: ${fixtures.length} real titles × 4 skins; exact chips, no residue, % score.`);
