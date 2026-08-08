/**
 * V2 source formatter inject — release group markers (grl + gq source leg).
 */
import { MARKER_ATOMS, BADGE_MARKERS, resolveMarkerRef } from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { applyFilterMeta } from "./badge-filter-meta.mjs";

const M = MARKER_ATOMS;
const GRL_IDS = MONO_FILTER_ORDER.grl;
const GQ_IDS = MONO_FILTER_ORDER.gq;

function gate(cond, marker) {
  return `{${cond}["${marker}"||""]}`;
}

const noQuality = "stream.quality::exists::isfalse";

/** Primary source markers — single winner (remux > bluray > webdl > webrip). */
export const FORMATTER_V2_INJECT_SOURCE =
  gate("stream.quality::~REMUX", M.srcRemux) +
  gate("stream.quality::~BluRay", M.srcBluray) +
  gate("stream.quality::~WEB::and::stream.filename::~WEBRip::isfalse::and::stream.filename::~Web-Rip::isfalse", M.srcWebdl) +
  gate("stream.filename::~WEBRip::or::stream.filename::~Web-Rip", M.srcWebrip) +
  gate("stream.quality::~CAM", M.srcCam) +
  gate("stream.quality::~HDTV", M.srcHdtv) +
  gate(`${noQuality}::and::stream.filename::~Remux`, M.srcRemux) +
  gate(`${noQuality}::and::stream.filename::~BluRay`, M.srcBluray) +
  gate(`${noQuality}::and::stream.filename::~WEB-DL`, M.srcWebdl) +
  gate(`${noQuality}::and::stream.filename::~HDCAM`, M.srcCam);

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

const v1Release = Object.fromEntries(
  GRL_IDS.map((id) => [id, nuvioRegex(applyFilterMeta({ id, pattern: "" }).pattern)])
);

/**
 * v1 oracle — which grl badges match filename-only haystacks.
 * @param {{ filename?: string, quality?: string }} fields
 */
export function releaseBadgeIdsFromFields(fields) {
  const candidates = [fields.filename, fields.quality].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  const hits = new Set();
  for (const h of haystacks) {
    for (const id of GRL_IDS) {
      if (v1Release[id]?.test(h)) hits.add(id);
    }
  }
  return [...hits];
}

/**
 * Simulate source markers from filename (v1 grl oracle).
 * @param {{ filename?: string, quality?: string }} fields
 */
export function buildSourceMarkersSync(fields) {
  const ids = releaseBadgeIdsFromFields(fields);
  let out = "";
  for (const id of ids) {
    for (const m of resolveMarkerRef(BADGE_MARKERS[id])) {
      if (m && !out.includes(m)) out += m;
    }
  }
  return out;
}

export { GRL_IDS, GQ_IDS, FORMATTER_V2_INJECT_SOURCE as FORMATTER_V2_INJECT_QUALITY };
