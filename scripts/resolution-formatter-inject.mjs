/**
 * V2 resolution formatter inject — stream.resolution replace chain + filename fallback.
 */
import { MARKER_ATOMS, BADGE_MARKERS, resolveMarkerRef } from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { RESOLUTION_PATTERNS } from "./resolution-patterns.mjs";
import { tagReplace } from "./formatter-chain-utils.mjs";

const M = MARKER_ATOMS;
const GR_IDS = MONO_FILTER_ORDER.gr;

function gate(cond, marker) {
  return `{${cond}["${marker}"||""]}`;
}

export const FORMATTER_V2_INJECT_RESOLUTION_CHAIN =
  `{stream.resolution::exists["{stream.resolution` +
  tagReplace("2160p", M.res4k) +
  tagReplace("2160i", M.res4k) +
  tagReplace("4K", M.res4k) +
  tagReplace("UHD", M.res4k) +
  tagReplace("1440p", M.res1440) +
  tagReplace("1440i", M.res1440) +
  tagReplace("2560x1440", M.res1440) +
  tagReplace("1080p", M.res1080) +
  tagReplace("1080i", M.res1080) +
  tagReplace("720p", M.res720) +
  tagReplace("720i", M.res720) +
  tagReplace("576p", M.res576) +
  tagReplace("576i", M.res576) +
  tagReplace("480p", M.res480) +
  tagReplace("480i", M.res480) +
  tagReplace("360p", M.res360) +
  tagReplace("360i", M.res360) +
  tagReplace("240p", M.res240) +
  tagReplace("240i", M.res240) +
  `}"||""]}`;

export const FORMATTER_V2_INJECT_RESOLUTION_FILENAME =
  gate("stream.filename::~2160p::or::stream.filename::~4K::or::stream.filename::~UHD", M.res4k) +
  gate(
    "stream.filename::~1440p::or::stream.filename::~2560x1440::and::stream.filename::~2160p::isfalse::and::stream.filename::~4K::isfalse",
    M.res1440
  ) +
  gate(
    "stream.filename::~1080p::and::stream.filename::~2160p::isfalse::and::stream.filename::~1440p::isfalse",
    M.res1080
  ) +
  gate(
    "stream.filename::~720p::and::stream.filename::~1080p::isfalse::and::stream.filename::~2160p::isfalse",
    M.res720
  ) +
  gate("stream.filename::~576p", M.res576) +
  gate("stream.filename::~480p::and::stream.filename::~576p::isfalse", M.res480) +
  gate("stream.filename::~360p", M.res360) +
  gate("stream.filename::~240p::and::stream.filename::~360p::isfalse", M.res240);

/** Highest resolution wins — 4K down to 240p. */
export const FORMATTER_V2_INJECT_RESOLUTION =
  FORMATTER_V2_INJECT_RESOLUTION_CHAIN + FORMATTER_V2_INJECT_RESOLUTION_FILENAME;

function nuvioRegex(pattern) {
  let flags = "";
  let body = pattern;
  while (body.startsWith("(?i)") || body.startsWith("(?s)")) {
    if (body.startsWith("(?i)")) {
      flags += "i";
      body = body.slice(4);
    } else if (body.startsWith("(?s)")) {
      flags += "s";
      body = body.slice(4);
    }
  }
  try {
    return new RegExp(body, flags);
  } catch {
    return null;
  }
}

function nuvioHaystacks(candidates) {
  const unique = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (unique.length <= 1) return unique;
  return [...unique, unique.join(" ")];
}

const v1Resolution = Object.fromEntries(
  GR_IDS.map((id) => [id, nuvioRegex(RESOLUTION_PATTERNS[id])])
);

/** @param {{ filename?: string, resolution?: string }} fields */
export function resolutionBadgeIdsFromFields(fields) {
  const candidates = [fields.filename, fields.resolution].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  for (const id of GR_IDS) {
    for (const h of haystacks) {
      if (v1Resolution[id]?.test(h)) return [id];
    }
  }
  return [];
}

/** @param {{ filename?: string, resolution?: string }} fields */
export function buildResolutionMarkersSync(fields) {
  const ids = resolutionBadgeIdsFromFields(fields);
  let out = "";
  for (const id of ids) {
    for (const m of resolveMarkerRef(BADGE_MARKERS[id])) {
      if (m && !out.includes(m)) out += m;
    }
  }
  return out;
}

export { GR_IDS };
