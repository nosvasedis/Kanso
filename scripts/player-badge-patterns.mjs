/**
 * Kanso Player: the same artwork, matched against Nuvio's player text instead
 * of formatter markers. NuvioTV `playbackMatchText` (PlaybackMatchText.kt)
 * joins a fixed vocabulary read from the decoder, e.g.
 *   "2160p 4K UHD HEVC H.265 H265 x265 DV DoVi Dolby Vision HDR HDR10 10bit
 *    TrueHD Atmos 7.1 eng English"
 * Every chip below is a fact that vocabulary proves; where it cannot tell two
 * cases apart, the chip claims only what both have in common.
 */

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** One whitespace-delimited token (or literal multi-word token). */
const t = s => `(?<!\\S)${esc(s)}(?!\\S)`;
const has = s => `(?=.*${t(s)})`;
const not = s => `(?!.*${t(s)})`;
const rule = (...parts) => `(?s)^${parts.join('')}`;

// Resolution: Nuvio emits exactly one of these heights.
const RESOLUTION = [['r-4k', '2160p'], ['r-1440', '1440p'], ['r-1080', '1080p'], ['r-720', '720p'],
  ['r-576', '576p'], ['r-480', '480p'], ['r-360', '360p'], ['r-240', '240p'], ['r-144', '144p']]
  .map(([id, h]) => [id, rule(has(h))]);

// Picture. `HDR10` means a PQ transfer, `DV` a Dolby Vision track. DV profile 5
// has no HDR10 base and is indistinguishable here, so DV never claims HDR10.
// HDR10+ metadata is not reported; its HDR10 base is what HDR10 states.
// Without PQ/HLG the transfer may still be unknown, so SDR is never claimed.
const PICTURE = [
  ['a-dv', rule(has('DV'))],
  ['v-hdr10', rule(has('HDR10'), not('DV'))],
  ['v-hlg', rule(has('HLG'))],
  ['v-10bit', rule(has('10bit'), not('HDR'), not('DV'))],
];

// Audio: one codec chip. Atmos is emitted only for E-AC-3 JOC or an Atmos
// codec profile. Nuvio adds `DTS-HD MA` for any profile containing "MA"
// (including DTS-ES Matrix), so MA also requires the `DTS-HD` token.
// `DTS-HD` alone is a different token from the two-word `DTS-HD MA`.
const HD = `(?<!\S)DTS-HD(?! MA(?!\S))(?!\S)`;
const hasHd = `(?=.*${HD})`, notHd = `(?!.*${HD})`;
const ma = [hasHd, has('DTS-HD MA')].join('');
const AUDIO = [
  ['a-at-th', rule(has('TrueHD'), has('Atmos'))],
  ['a-th', rule(has('TrueHD'), not('Atmos'))],
  ['a-at-dp', rule(has('DD+'), has('Atmos'))],
  ['a-dp', rule(has('DD+'), not('Atmos'))],
  ['a-at', rule(has('Atmos'), not('TrueHD'), not('DD+'))],
  ['a-dd', rule(has('AC3'), not('DD+'))],
  ['a-dtsx-ma', rule(has('DTS:X'), ma)],
  ['a-dtsx-hd', rule(has('DTS:X'), hasHd, not('DTS-HD MA'))],
  ['a-dtsx', rule(has('DTS:X'), notHd)],
  ['a-dtsma', rule(not('DTS:X'), ma)],
  ['a-dtshd', rule(not('DTS:X'), hasHd, not('DTS-HD MA'))],
  ['a-dts', rule(has('DTS'), not('DTS:X'), notHd)],
  ['a-aac', rule(has('AAC'))],
  ['a-flac', rule(has('FLAC'))],
  ['a-opus', rule(has('Opus'))],
  ['a-mp3', rule(has('MP3'))],
  ['a-pcm', rule('(?=.*(?<!\\S)PCM_[SUF]\\d+(?:LE|BE)?(?!\\S))')],
];

// Nuvio reports only these channel counts (1, 2, 6, 8).
const CHANNELS = [['ch-10', '1.0'], ['ch-20', '2.0'], ['ch-51', '5.1'], ['ch-71', '7.1']]
  .map(([id, c]) => [id, rule(has(c))]);

/** Selected audio track language: the raw code always precedes the localized name. */
export const PLAYER_LANGUAGE_CODES = {
  'l-en': ['en', 'eng'], 'l-es': ['es', 'spa'], 'l-fr': ['fr', 'fre', 'fra'], 'l-de': ['de', 'ger', 'deu'],
  'l-it': ['it', 'ita'], 'l-pt': ['pt', 'por', 'pob'], 'l-tr': ['tr', 'tur'], 'l-pl': ['pl', 'pol'],
  'l-uk': ['uk', 'ukr'], 'l-id': ['id', 'ind'], 'l-th': ['th', 'tha'], 'l-vi': ['vi', 'vie'],
  'l-ja': ['ja', 'jpn'], 'l-ko': ['ko', 'kor'], 'l-zh': ['zh', 'chi', 'zho', 'cmn'],
  'l-in': ['hi', 'hin', 'bn', 'ben', 'ta', 'tam', 'te', 'tel', 'ml', 'mal', 'kn', 'kan', 'mr', 'mar', 'gu', 'guj', 'pa', 'pan'],
  'l-ar': ['ar', 'ara'], 'l-ru': ['ru', 'rus'], 'l-el': ['el', 'ell', 'gre'], 'l-sv': ['sv', 'swe'],
  'l-nl': ['nl', 'dut', 'nld'], 'l-da': ['da', 'dan'], 'l-no': ['no', 'nor', 'nb', 'nob', 'nn', 'nno'],
  'l-fi': ['fi', 'fin'], 'l-cs': ['cs', 'cze', 'ces'], 'l-sk': ['sk', 'slo', 'slk'], 'l-hu': ['hu', 'hun'],
  'l-ro': ['ro', 'rum', 'ron'], 'l-bg': ['bg', 'bul'], 'l-hr': ['hr', 'hrv'], 'l-sr': ['sr', 'srp'],
  'l-sl': ['sl', 'slv'], 'l-et': ['et', 'est'], 'l-lv': ['lv', 'lav'], 'l-lt': ['lt', 'lit'],
  'l-he': ['he', 'heb', 'iw'], 'l-fa': ['fa', 'per', 'fas'], 'l-ms': ['ms', 'may', 'msa'],
};
// A code with an optional region/script (pt-BR, es-419, zh-Hant) is one token.
const LANGUAGE = Object.entries(PLAYER_LANGUAGE_CODES).map(([id, codes]) =>
  [id, `(?i)(?s)^(?=.*(?<!\\S)(?:${codes.join('|')})(?:[-_][a-z0-9]{2,4})*(?!\\S))`]);

/** Badge id -> Java/Kotlin regex, in the order chips should read. */
export const PLAYER_PATTERNS = new Map([...RESOLUTION, ...PICTURE, ...AUDIO, ...CHANNELS, ...LANGUAGE]);
