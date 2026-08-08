/**
 * V2 special-tag formatter inject — gst filename gates + edition hue/bw.
 */
import { BADGE_MARKERS, resolveMarkerRef } from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { SPECIAL_TAG_PATTERNS } from "./special-tag-patterns.mjs";
import {
  EDITION_BW_BADGE_PATTERN,
  EDITION_HUE_BADGE_PATTERN,
  EDITION_BW_MARKER,
  EDITION_HUE_MARKER,
} from "./edition-badge-patterns.mjs";
import { BW_HIT, HUE_HIT } from "./formatter-editions.mjs";
import { applyFilterMeta } from "./badge-filter-meta.mjs";

const GST_BASELINE_INJECT = new Set([
  "seadex-release",
  "edition-directors-cut",
  "edition-extended",
]);

/** gst badges that need new v2 filename inject (excludes seadex/dc/ext in baseline). */
export const GST_V2_INJECT_IDS = MONO_FILTER_ORDER.gst.filter(
  (id) => !GST_BASELINE_INJECT.has(id)
);

const SPECIAL_ONLY_IDS = GST_V2_INJECT_IDS.filter(
  (id) => id !== "edition-true-hue" && id !== "edition-bw"
);

function gate(cond, marker) {
  return `{${cond}["${marker}"||""]}`;
}

/** Filename gates for kingsizew-era special tags (compact; v1 regex is oracle). */
export const SPECIAL_FILENAME_CONDITIONS = {
  "hybrid-release":
    "stream.filename::~HYBRID::or::stream.filename::~\\.Hybrid\\.",
  "criterion-collection":
    "stream.filename::~Criterion.Collection::or::stream.filename::~Criterion\\.",
  "proper-release":
    "stream.filename::~PROPER::or::stream.filename::~\\.Proper\\.",
  "repack-release":
    "stream.filename::~REPACK::or::stream.filename::~\\.Repack\\.",
  "remastered-release":
    "stream.filename::~Remastered::or::stream.filename::~Remaster\\.",
  "open-matte-edition":
    "stream.filename::~Open.Matte::or::stream.filename::~Open-Matte",
  "regraded-release":
    "stream.filename::~Regraded::or::stream.filename::~Regrade",
  "uncut-edition": "stream.filename::~Uncut",
  "uncensored-edition": "stream.filename::~Uncensored",
  "edition-theatrical":
    "stream.filename::~Theatrical::or::stream.filename::~THTR",
};

let specialInject = "";
for (const id of SPECIAL_ONLY_IDS) {
  const cond = SPECIAL_FILENAME_CONDITIONS[id];
  if (!cond) continue;
  specialInject += gate(cond, BADGE_MARKERS[id] ? resolveMarkerRef(BADGE_MARKERS[id])[0] : "");
}

/** Hue + B&W markers (v2 only — v1 production edition inject stays DC/EXT). */
export const FORMATTER_V2_INJECT_EDITION_HUE_BW =
  gate(HUE_HIT, EDITION_HUE_MARKER) + gate(BW_HIT, EDITION_BW_MARKER);

export const FORMATTER_V2_INJECT_SPECIAL_FILENAME = specialInject;

export const FORMATTER_V2_INJECT_SPECIAL =
  FORMATTER_V2_INJECT_SPECIAL_FILENAME + FORMATTER_V2_INJECT_EDITION_HUE_BW;

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

const v1Special = Object.fromEntries(
  SPECIAL_ONLY_IDS.map((id) => [
    id,
    nuvioRegex(SPECIAL_TAG_PATTERNS[id]?.pattern ?? applyFilterMeta({ id, pattern: "" }).pattern),
  ])
);

const v1Edition = {
  "edition-true-hue": nuvioRegex(EDITION_HUE_BADGE_PATTERN),
  "edition-bw": nuvioRegex(EDITION_BW_BADGE_PATTERN),
};

/** @param {{ filename?: string }} fields */
export function specialBadgeIdsFromFields(fields) {
  const candidates = [fields.filename].filter(Boolean);
  const hits = new Set();
  for (const h of candidates) {
    for (const id of SPECIAL_ONLY_IDS) {
      if (v1Special[id]?.test(h)) hits.add(id);
    }
    for (const id of ["edition-true-hue", "edition-bw"]) {
      if (v1Edition[id]?.test(h)) hits.add(id);
    }
  }
  return [...hits];
}

/** v1 oracle markers for tests. @param {{ filename?: string }} fields */
export function buildSpecialMarkersSync(fields) {
  const ids = specialBadgeIdsFromFields(fields);
  let out = "";
  for (const id of ids) {
    for (const m of resolveMarkerRef(BADGE_MARKERS[id])) {
      if (m && !out.includes(m)) out += m;
    }
  }
  return out;
}

export { GST_V2_INJECT_IDS as GST_IDS, SPECIAL_ONLY_IDS };
