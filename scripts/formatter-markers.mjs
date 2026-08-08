/**
 * V2 invisible marker registry — single source of truth for formatter inject + badge patterns.
 *
 * Namespace (existing — do not reassign):
 *   SeaDex     U+200B U+200C U+200D
 *   Streaming  U+2060 + U+2061–U+2069
 *   Editions   U+206A (hue) U+206B (bw) U+206C (dc) U+206D (ext)
 *   DR         U+206E + U+2061–U+2063
 *
 * New V2 atoms use 3-codeunit sequences from U+180B–U+180D / U+200E / U+200F / U+FEFF,
 * assigned at build time with substring-collision checks against RESERVED_MARKERS.
 */
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { DR_DV_MARKER, DR_HDR10P_MARKER, DR_HDR_MARKER } from "./dr-formatter-markers.mjs";
import {
  EDITION_BW_MARKER,
  EDITION_DC_MARKER,
  EDITION_EXT_MARKER,
  EDITION_HUE_MARKER,
} from "./edition-badge-patterns.mjs";
import { SEADEX_MARKER, RANK_VISIBLE, RANK_STAR_ANY } from "./quality-rank-patterns.mjs";
import { STREAMING_MARKERS } from "./streaming-formatter-patterns.mjs";

/** @type {readonly string[]} */
export const RESERVED_MARKERS = [
  SEADEX_MARKER,
  ...Object.values(STREAMING_MARKERS),
  EDITION_HUE_MARKER,
  EDITION_BW_MARKER,
  EDITION_DC_MARKER,
  EDITION_EXT_MARKER,
  DR_DV_MARKER,
  DR_HDR10P_MARKER,
  DR_HDR_MARKER,
];

const TRIPLET_BASES = [0x180b, 0x180c, 0x180d, 0x200e, 0x200f, 0xfeff];
// Terminates every allocated marker with a code point outside TRIPLET_BASES.
// Without it, marker A + marker B can synthesize another valid triplet across
// their boundary and make unrelated badges match the combined Nuvio haystack.
export const MARKER_SEPARATOR = "\u206f";

/** @returns {Generator<string>} */
function* generateTripletMarkers() {
  for (const a of TRIPLET_BASES) {
    for (const b of TRIPLET_BASES) {
      for (const c of TRIPLET_BASES) {
        yield String.fromCharCode(a, b, c) + MARKER_SEPARATOR;
      }
    }
  }
}

/** @param {string} haystack @param {string} needle */
function containsMarker(haystack, needle) {
  return haystack.includes(needle);
}

/** @param {string} marker @param {readonly string[]} reserved */
function collides(marker, reserved) {
  if (marker !== marker.trim()) return true;
  for (const r of reserved) {
    if (marker === r) return true;
    if (containsMarker(marker, r) || containsMarker(r, marker)) return true;
  }
  return false;
}

/** @param {number} count @param {readonly string[]} reserved */
export function allocateMarkers(count, reserved = RESERVED_MARKERS) {
  const out = [];
  const used = [...reserved];
  for (const candidate of generateTripletMarkers()) {
    if (collides(candidate, used)) continue;
    out.push(candidate);
    used.push(candidate);
    if (out.length >= count) break;
  }
  if (out.length < count) {
    throw new Error(`Could only allocate ${out.length}/${count} unique markers`);
  }
  return out;
}

/** Shared atoms referenced by multiple badges (combo patterns). */
export const MARKER_ATOMS = {
  seadex: SEADEX_MARKER,
  ...STREAMING_MARKERS,
  editionDc: EDITION_DC_MARKER,
  editionExt: EDITION_EXT_MARKER,
  editionHue: EDITION_HUE_MARKER,
  editionBw: EDITION_BW_MARKER,
  drDv: DR_DV_MARKER,
  drHdr10p: DR_HDR10P_MARKER,
  drHdr: DR_HDR_MARKER,
};

/** @type {Record<string, string>} */
const ATOM_SLOTS = {
  // Release / quality source (grl + gq combos)
  srcRemux: "",
  srcBluray: "",
  srcWebdl: "",
  srcWebrip: "",
  srcCam: "",
  srcHdtv: "",
  // Resolution
  res4k: "",
  res1440: "",
  res1080: "",
  res720: "",
  res576: "",
  res480: "",
  res360: "",
  res240: "",
  // Visual tags
  visHdr10p: "",
  visHdr10: "",
  visHdr: "",
  visHlg: "",
  vis10bit: "",
  visAi: "",
  visSdr: "",
  visImaxE: "",
  visImax: "",
  vis3d: "",
  // Audio tags
  audAtmos: "",
  audTruehd: "",
  audDdplus: "",
  audDd: "",
  audDtsx: "",
  audDtsma: "",
  audDtshd: "",
  audDtses: "",
  audDts: "",
  audFlac: "",
  audOpus: "",
  audAac: "",
  audMp3: "",
  audPcm: "",
  // Channels
  ch71: "",
  ch61: "",
  ch51: "",
  ch20: "",
  // gst special (beyond existing edition/seadex)
  gstHybrid: "",
  gstCriterion: "",
  gstProper: "",
  gstRepack: "",
  gstRemaster: "",
  gstOpenMatte: "",
  gstRegraded: "",
  gstUncut: "",
  gstUncensored: "",
  gstTheatrical: "",
};

const TIER_BADGE_IDS = MONO_FILTER_ORDER.gms;
const LANGUAGE_BADGE_IDS = MONO_FILTER_ORDER.gl;

/** @type {Record<string, string | string[]>} */
export const BADGE_MARKERS = {
  "seadex-release": MARKER_ATOMS.seadex,
  "edition-directors-cut": MARKER_ATOMS.editionDc,
  "edition-extended": MARKER_ATOMS.editionExt,
  "edition-true-hue": MARKER_ATOMS.editionHue,
  "edition-bw": MARKER_ATOMS.editionBw,
  "s-nflx": MARKER_ATOMS["s-nflx"],
  "s-amzn": MARKER_ATOMS["s-amzn"],
  "s-atvp": MARKER_ATOMS["s-atvp"],
  "s-dsnp": MARKER_ATOMS["s-dsnp"],
  "s-hmax": MARKER_ATOMS["s-hmax"],
  "s-hulu": MARKER_ATOMS["s-hulu"],
  "s-pcok": MARKER_ATOMS["s-pcok"],
  "s-pamp": MARKER_ATOMS["s-pamp"],
  "s-croll": MARKER_ATOMS["s-croll"],
  "a-dv": MARKER_ATOMS.drDv,
  "v-hdr10p": MARKER_ATOMS.drHdr10p,
  "v-hdr": MARKER_ATOMS.drHdr,
  // Combos — multi-marker (formatter emits atoms; badge matches all)
  "v-dv-hdr10p": ["drDv", "visHdr10p"],
  "v-dv-hdr10": ["drDv", "visHdr10"],
  "v-dv-hdr": ["drDv", "visHdr"],
  "a-at-th": ["audAtmos", "audTruehd"],
  "a-at-dp": ["audAtmos", "audDdplus"],
  "a-dtsx-ma": ["audDtsx", "audDtsma"],
  "a-dtsx-hd": ["audDtsx", "audDtshd"],
  "q-br": ["srcRemux"],
  "q-bb": ["srcBluray"],
  "q-bw": ["srcWebdl"],
  "q-gr": ["srcRemux"],
  "q-gb": ["srcBluray"],
  "q-gw": ["srcWebdl"],
  "q-or": ["srcRemux"],
  "q-ob": ["srcBluray"],
  "q-ow": ["srcWebdl"],
  "q-r": ["srcRemux"],
  "q-b": ["srcBluray"],
  "q-w": ["srcWebdl"],
  "q-wr": ["srcWebrip"],
  "q-cam": ["srcCam"],
  "q-hdtv": ["srcHdtv"],
  "r-4k": ["res4k"],
  "r-1440": ["res1440"],
  "r-1080": ["res1080"],
  "r-720": ["res720"],
  "r-576": ["res576"],
  "r-480": ["res480"],
  "r-360": ["res360"],
  "r-240": ["res240"],
  "v-hdr10": ["visHdr10"],
  "v-hlg": ["visHlg"],
  "v-10bit": ["vis10bit"],
  "v-ai": ["visAi"],
  "v-sdr": ["visSdr"],
  "v-imax-e": ["visImaxE"],
  "v-imax": ["visImax"],
  "v-3d": ["vis3d"],
  "a-dtsx": ["audDtsx"],
  "a-dtsma": ["audDtsma"],
  "a-dtshd": ["audDtshd"],
  "a-dtses": ["audDtses"],
  "a-dts": ["audDts"],
  "a-at": ["audAtmos"],
  "a-th": ["audTruehd"],
  "a-dp": ["audDdplus"],
  "a-dd": ["audDd"],
  "a-flac": ["audFlac"],
  "a-opus": ["audOpus"],
  "a-aac": ["audAac"],
  "a-mp3": ["audMp3"],
  "a-pcm": ["audPcm"],
  "ch-71": ["ch71"],
  "ch-61": ["ch61"],
  "ch-51": ["ch51"],
  "ch-20": ["ch20"],
  "hybrid-release": ["gstHybrid"],
  "criterion-collection": ["gstCriterion"],
  "proper-release": ["gstProper"],
  "repack-release": ["gstRepack"],
  "remastered-release": ["gstRemaster"],
  "open-matte-edition": ["gstOpenMatte"],
  "regraded-release": ["gstRegraded"],
  "uncut-edition": ["gstUncut"],
  "uncensored-edition": ["gstUncensored"],
  "edition-theatrical": ["gstTheatrical"],
};

// Allocate atoms + per-tier + per-language markers
const atomKeys = Object.keys(ATOM_SLOTS);
const tierAndLangCount = TIER_BADGE_IDS.length + LANGUAGE_BADGE_IDS.length;
const allocated = allocateMarkers(atomKeys.length + tierAndLangCount);

let i = 0;
for (const key of atomKeys) {
  ATOM_SLOTS[key] = allocated[i++];
  MARKER_ATOMS[key] = ATOM_SLOTS[key];
}

/** @type {Record<string, string>} */
export const TIER_MARKERS = Object.fromEntries(
  TIER_BADGE_IDS.map((id) => [id, allocated[i++]])
);

/** @type {Record<string, string>} */
export const LANGUAGE_MARKERS = Object.fromEntries(
  LANGUAGE_BADGE_IDS.map((id) => [id, allocated[i++]])
);

for (const id of TIER_BADGE_IDS) {
  BADGE_MARKERS[id] = TIER_MARKERS[id];
}
for (const id of LANGUAGE_BADGE_IDS) {
  BADGE_MARKERS[id] = LANGUAGE_MARKERS[id];
}

/** Resolve atom key or raw marker string. @param {string | string[]} ref */
export function resolveMarkerRef(ref) {
  const keys = Array.isArray(ref) ? ref : [ref];
  return keys.map((k) => MARKER_ATOMS[k] ?? k);
}

/** @param {string} marker */
export function markerRegexLiteral(marker) {
  return [...marker]
    .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)
    .join("");
}

/** @param {string | string[]} markerOrRefs */
export function markerOnlyPattern(markerOrRefs) {
  const markers = Array.isArray(markerOrRefs)
    ? resolveMarkerRef(markerOrRefs)
    : resolveMarkerRef([markerOrRefs]);
  const parts = markers.map((m) => `(?:${markerRegexLiteral(m)})`).join("");
  if (markers.length === 1) {
    return `(?s)^(?=.*${parts})`;
  }
  return `(?s)^${markers.map((m) => `(?=.*(?:${markerRegexLiteral(m)}))`).join("")}`;
}

/** @param {string[]} excludeKeys atom keys or badge IDs */
function exclusionSuffix(excludeKeys) {
  if (!excludeKeys?.length) return "";
  const parts = excludeKeys.map((k) => {
    let m = MARKER_ATOMS[k];
    if (!m) {
      const fromBadge = markersForBadge(k);
      m = fromBadge?.[0];
    }
    return m ? `(?!.*(?:${markerRegexLiteral(m)}))` : "";
  });
  return parts.join("");
}

/** @param {string} badgeId */
export function markersForBadge(badgeId) {
  const entry = BADGE_MARKERS[badgeId];
  if (!entry) return null;
  return resolveMarkerRef(entry);
}

/** @param {string} badgeId */
function qualityComboV2Pattern(badgeId) {
  const tierChar = badgeId[2];
  const srcChar = badgeId[3];
  const starBand =
    tierChar === "b"
      ? RANK_VISIBLE.best
      : tierChar === "g"
        ? RANK_VISIBLE.good
        : RANK_VISIBLE.ok;
  const srcAtom =
    srcChar === "r" ? "srcRemux" : srcChar === "b" ? "srcBluray" : "srcWebdl";
  const srcMarkers =
    srcChar === "w"
      ? [MARKER_ATOMS.srcWebdl, MARKER_ATOMS.srcWebrip].filter(Boolean)
      : [MARKER_ATOMS[srcAtom]].filter(Boolean);
  if (!srcMarkers.length) return null;
  const srcAlt = srcMarkers.map((m) => markerRegexLiteral(m)).join("|");
  const srcPart = `(?=.*(?:${srcAlt}))`;
  const noBad = `(?![\\s\\S]*(?:\\bhdcam\\b|\\bhdtv\\b|\\bpdtv\\b))`;
  const noRemux =
    srcChar === "b"
      ? `(?![\\s\\S]*(?:${markerRegexLiteral(MARKER_ATOMS.srcRemux)}))`
      : "";
  return `(?s)^${noBad}${noRemux}(?=.*(?:${starBand}))${srcPart}`;
}

function requireMarker(marker) {
  return `(?=.*(?:${markerRegexLiteral(marker)}))`;
}

function forbidMarker(marker) {
  return `(?!.*(?:${markerRegexLiteral(marker)}))`;
}

/** Dolby audio hierarchy, including cross-group Atmos+DV de-duplication. */
function priorityAudioPattern(badgeId) {
  const atmos = MARKER_ATOMS.audAtmos;
  const truehd = MARKER_ATOMS.audTruehd;
  const ddplus = MARKER_ATOMS.audDdplus;
  if (badgeId === "a-at-th") {
    return `(?s)^${requireMarker(atmos)}${requireMarker(truehd)}`;
  }
  if (badgeId === "a-at-dp") {
    return `(?s)^${forbidMarker(truehd)}${requireMarker(atmos)}${requireMarker(ddplus)}`;
  }
  return null;
}

/** @param {string} badgeId */
function releaseV2Pattern(badgeId) {
  const markers = markersForBadge(badgeId);
  if (!markers?.length) return null;
  const parts = markers.map((m) => `(?=.*(?:${markerRegexLiteral(m)}))`).join("");
  const noStars =
    badgeId === "q-cam" || badgeId === "q-hdtv"
      ? ""
      : `(?![\\s\\S]*${RANK_STAR_ANY})`;
  const exclusions = V2_PATTERN_MARKER_EXCLUSIONS[badgeId];
  const suffix = exclusionSuffix(exclusions ?? []);
  return `(?s)^${suffix}${noStars}${parts}`;
}

/** @param {string} badgeId */
export function v2PatternForBadge(badgeId) {
  if (/^q-[bgo][rbw]$/.test(badgeId)) {
    return qualityComboV2Pattern(badgeId);
  }
  if (/^q-(?:r|b|w|wr|cam|hdtv)$/.test(badgeId)) {
    return releaseV2Pattern(badgeId);
  }
  const audioPriority = priorityAudioPattern(badgeId);
  if (audioPriority) return audioPriority;
  const entry = BADGE_MARKERS[badgeId];
  if (!entry) return null;
  const base = markerOnlyPattern(entry);
  const exclusions = V2_PATTERN_MARKER_EXCLUSIONS[badgeId];
  if (!exclusions?.length) return base;
  const suffix = exclusionSuffix(exclusions);
  if (!suffix) return base;
  if (base.startsWith("(?s)^") && base.length > 5) {
    return `(?s)^${suffix}${base.slice(5)}`;
  }
  return base;
}

/** All badge IDs with registry entries. */
export const ALL_V2_BADGE_IDS = Object.keys(BADGE_MARKERS);

/** Badges whose formatter inject is implemented today (grows per migration phase). */
export const V2_INJECT_IMPLEMENTED_IDS = new Set([
  "seadex-release",
  "s-nflx",
  "s-amzn",
  "s-atvp",
  "s-dsnp",
  "s-hmax",
  "s-hulu",
  "s-pcok",
  "s-pamp",
  "s-croll",
  "edition-directors-cut",
  "edition-extended",
  // Phase 1 — gv (15)
  "v-dv-hdr10p",
  "v-dv-hdr10",
  "v-dv-hdr",
  "v-hdr10p",
  "v-hdr10",
  "v-hdr",
  "v-hlg",
  "v-10bit",
  "v-imax-e",
  "v-imax",
  "a-dv",
  "v-sdr",
  "v-ai",
  "v-3d",
  // Phase 2 — ga (18)
  "a-at-th",
  "a-dtsx-ma",
  "a-at-dp",
  "a-dtsx-hd",
  "a-dtsx",
  "a-dtsma",
  "a-dtshd",
  "a-dtses",
  "a-dts",
  "a-at",
  "a-th",
  "a-dp",
  "a-dd",
  "a-flac",
  "a-opus",
  "a-aac",
  "a-mp3",
  "a-pcm",
  // Phase 3 — gc (4)
  "ch-71",
  "ch-61",
  "ch-51",
  "ch-20",
  // Phase 4 — gms (20)
  "web-unranked",
  "web-6",
  "web-5",
  "web-4",
  "web-3",
  "web-2",
  "web-1",
  "blu-ray-unranked",
  "blu-ray-8",
  "blu-ray-7",
  "blu-ray-6",
  "blu-ray-5",
  "blu-ray-4",
  "blu-ray-3",
  "blu-ray-2",
  "blu-ray-1",
  "remux-unranked",
  "remux-3",
  "remux-2",
  "remux-1",
  // Phase 5 — gq (9) + grl (6) + gr (8)
  "q-br",
  "q-bb",
  "q-bw",
  "q-gr",
  "q-gb",
  "q-gw",
  "q-or",
  "q-ob",
  "q-ow",
  "q-r",
  "q-b",
  "q-w",
  "q-wr",
  "q-cam",
  "q-hdtv",
  "r-4k",
  "r-1440",
  "r-1080",
  "r-720",
  "r-576",
  "r-480",
  "r-360",
  "r-240",
  // Phase 6 — gl (20)
  "l-en",
  "l-es",
  "l-fr",
  "l-de",
  "l-it",
  "l-pt-br",
  "l-pt-pt",
  "l-tr",
  "l-pl",
  "l-uk",
  "l-id",
  "l-th",
  "l-vi",
  "l-ja",
  "l-ko",
  "l-zh",
  "l-hi",
  "l-ar",
  "l-ru",
  "l-el",
  "l-mu",
  // Phase 7 — gst (12)
  "hybrid-release",
  "criterion-collection",
  "proper-release",
  "repack-release",
  "remastered-release",
  "open-matte-edition",
  "regraded-release",
  "uncut-edition",
  "uncensored-edition",
  "edition-bw",
  "edition-true-hue",
  "edition-theatrical",
]);

/**
 * Marker-only patterns with extra negative markers (standalone vs combo parity).
 * @type {Record<string, string[]>}
 */
export const V2_PATTERN_MARKER_EXCLUSIONS = {
  "v-dv-hdr10": ["visHdr10p"],
  "v-dv-hdr": ["visHdr10p", "visHdr10"],
  "v-hdr10": ["drDv"],
  "a-dv": ["visHdr10p", "visHdr10", "visHdr"],
  "a-at": ["audTruehd", "audDdplus"],
  "a-th": ["audAtmos", "audDdplus"],
  "a-dp": ["audAtmos", "audTruehd"],
  "a-dd": ["audDdplus", "audAtmos", "audTruehd"],
  "a-dtsx": ["audDtsma", "audDtshd"],
  "a-dtsx-hd": ["audDtsma"],
  "a-dtsma": ["audDtsx", "audDtshd"],
  "a-dtshd": ["audDtsx", "audDtsma"],
  "a-dtses": ["audDtsx", "audDtsma", "audDtshd"],
  "a-dts": ["audDtsx", "audDtsma", "audDtshd", "audDtses"],
  "a-opus": ["audFlac"],
  "a-aac": ["audFlac", "audOpus"],
  "web-unranked": ["web-1", "web-2", "web-3", "web-4", "web-5", "web-6"],
  // Best-wins: a lower tier never shows when a better tier of the same source
  // already matched (RSE rules can multi-match — e.g. BLUTONiUM is in both
  // Radarr Web T1 and Sonarr Web T2 — and the formatter emits every matched
  // tier's marker; the badge patterns decide which one is displayed).
  "web-2": ["web-1"],
  "web-3": ["web-1", "web-2"],
  "web-4": ["web-1", "web-2", "web-3"],
  "web-5": ["web-1", "web-2", "web-3", "web-4"],
  "web-6": ["web-1", "web-2", "web-3", "web-4", "web-5"],
  "blu-ray-unranked": [
    "blu-ray-1",
    "blu-ray-2",
    "blu-ray-3",
    "blu-ray-4",
    "blu-ray-5",
    "blu-ray-6",
    "blu-ray-7",
    "blu-ray-8",
  ],
  "blu-ray-2": ["blu-ray-1"],
  "blu-ray-3": ["blu-ray-1", "blu-ray-2"],
  "blu-ray-4": ["blu-ray-1", "blu-ray-2", "blu-ray-3"],
  "blu-ray-5": ["blu-ray-1", "blu-ray-2", "blu-ray-3", "blu-ray-4"],
  "blu-ray-6": ["blu-ray-1", "blu-ray-2", "blu-ray-3", "blu-ray-4", "blu-ray-5"],
  "blu-ray-7": ["blu-ray-1", "blu-ray-2", "blu-ray-3", "blu-ray-4", "blu-ray-5", "blu-ray-6"],
  "blu-ray-8": [
    "blu-ray-1",
    "blu-ray-2",
    "blu-ray-3",
    "blu-ray-4",
    "blu-ray-5",
    "blu-ray-6",
    "blu-ray-7",
  ],
  "remux-unranked": ["remux-1", "remux-2", "remux-3"],
  "remux-2": ["remux-1"],
  "remux-3": ["remux-1", "remux-2"],
  "r-4k": ["res1440", "res1080", "res720", "res576", "res480", "res360", "res240"],
  "r-1440": ["res4k", "res1080", "res720", "res576", "res480", "res360", "res240"],
  "r-1080": ["res4k", "res1440", "res720", "res576", "res480", "res360", "res240"],
  "r-720": ["res4k", "res1440", "res1080", "res576", "res480", "res360", "res240"],
  "r-576": ["res4k", "res1440", "res1080", "res720", "res480", "res360", "res240"],
  "r-480": ["res4k", "res1440", "res1080", "res720", "res576", "res360", "res240"],
  "r-360": ["res4k", "res1440", "res1080", "res720", "res576", "res480", "res240"],
  "r-240": ["res4k", "res1440", "res1080", "res720", "res576", "res480", "res360"],
  "q-w": ["srcWebrip"],
  "q-b": ["srcRemux"],
  "q-bb": ["srcRemux"],
  "q-gb": ["srcRemux"],
  "q-ob": ["srcRemux"],
  "l-pt-pt": ["l-pt-br"],
  "edition-bw": ["edition-true-hue"],
};

/** @returns {{ ok: boolean, errors: string[] }} */
export function validateMarkerRegistry() {
  const errors = [];

  for (const [id, entry] of Object.entries(BADGE_MARKERS)) {
    const markers = resolveMarkerRef(entry);
    const seenInBadge = new Set();
  for (const m of markers) {
    if (!m) {
      errors.push(`${id}: empty marker`);
      continue;
    }
    if (m !== m.trim()) {
      errors.push(`${id}: marker is trim-sensitive (Nuvio haystack trims ends)`);
    }
      if (seenInBadge.has(m)) {
        errors.push(`${id}: duplicate marker within badge`);
      }
      seenInBadge.add(m);

      for (const r of RESERVED_MARKERS) {
        if (m === r) continue;
        if (containsMarker(m, r) || containsMarker(r, m)) {
          errors.push(`${id}: substring collision with reserved ${JSON.stringify(r)}`);
        }
      }
    }
  }

  const allocated = [
    ...Object.values(ATOM_SLOTS),
    ...Object.values(TIER_MARKERS),
    ...Object.values(LANGUAGE_MARKERS),
  ].filter(Boolean);

  for (let i = 0; i < allocated.length; i++) {
    for (let j = i + 1; j < allocated.length; j++) {
      if (allocated[i] === allocated[j]) {
        errors.push(
          `allocated duplicate: ${JSON.stringify(allocated[i])} and ${JSON.stringify(allocated[j])}`
        );
      }
      if (
        containsMarker(allocated[i], allocated[j]) ||
        containsMarker(allocated[j], allocated[i])
      ) {
        errors.push(
          `allocated substring collision: ${JSON.stringify(allocated[i])} vs ${JSON.stringify(allocated[j])}`
        );
      }
    }
    for (const r of RESERVED_MARKERS) {
      const m = allocated[i];
      if (m === r) continue;
      if (containsMarker(m, r) || containsMarker(r, m)) {
        errors.push(`allocated marker collides with reserved ${JSON.stringify(r)}`);
      }
    }
  }

  const expected = Object.values(MONO_FILTER_ORDER).flat().length;
  if (ALL_V2_BADGE_IDS.length !== expected) {
    errors.push(`Expected ${expected} badge IDs, got ${ALL_V2_BADGE_IDS.length}`);
  }

  return { ok: errors.length === 0, errors };
}

export const MARKER_REGISTRY_VALIDATION = validateMarkerRegistry();
