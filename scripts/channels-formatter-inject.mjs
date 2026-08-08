/**
 * V2 channel formatter inject — audioChannels replace chain + filename fallback.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { MARKER_ATOMS, BADGE_MARKERS, resolveMarkerRef } from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { SOLID_BADGES_PATH } from "./badge-patch.mjs";
import { V1_SOLID_BADGES_PATH } from "./v1-badge-oracle.mjs";

const M = MARKER_ATOMS;
const GC_IDS = MONO_FILTER_ORDER.gc;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function gate(cond, marker) {
  return `{${cond}["${marker}"||""]}`;
}

/** Highest channel wins — order matters in replace chain (7.1 before 5.1 before 2.0). */
export const FORMATTER_V2_INJECT_CHANNELS =
  gate("stream.audioChannels::~7.1::or::stream.audioChannels::~8.1", M.ch71) +
  gate("stream.audioChannels::~6.1::and::stream.audioChannels::~7.1::isfalse::and::stream.audioChannels::~8.1::isfalse", M.ch61) +
  gate("stream.audioChannels::~5.1::and::stream.audioChannels::~7.1::isfalse::and::stream.audioChannels::~8.1::isfalse::and::stream.audioChannels::~6.1::isfalse", M.ch51) +
  gate("stream.audioChannels::~2.0::and::stream.audioChannels::~5.1::isfalse::and::stream.audioChannels::~6.1::isfalse::and::stream.audioChannels::~7.1::isfalse", M.ch20);

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

let v1ChannelPatterns = null;

async function loadV1ChannelPatterns() {
  if (v1ChannelPatterns) return v1ChannelPatterns;
  const raw = await fs.readFile(V1_SOLID_BADGES_PATH, "utf8");
  const data = JSON.parse(raw);
  v1ChannelPatterns = Object.fromEntries(
    GC_IDS.map((id) => {
      const f = data.filters.find((x) => x.id === id);
      return [id, f?.pattern ? nuvioRegex(f.pattern) : null];
    })
  );
  return v1ChannelPatterns;
}

/** @param {{ filename?: string, audioChannels?: string }} fields */
export async function channelBadgeIdsFromFields(fields) {
  const patterns = await loadV1ChannelPatterns();
  const candidates = [fields.filename, fields.audioChannels].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  const hits = new Set();
  for (const h of haystacks) {
    for (const id of GC_IDS) {
      if (patterns[id]?.test(h)) hits.add(id);
    }
  }
  return [...hits];
}

/**
 * @param {{ filename?: string, audioChannels?: string }} fields
 */
export async function buildChannelMarkers(fields) {
  const ids = await channelBadgeIdsFromFields(fields);
  let out = "";
  for (const id of ids) {
    for (const m of resolveMarkerRef(BADGE_MARKERS[id])) {
      if (m && !out.includes(m)) out += m;
    }
  }
  return out;
}

/** Sync oracle for tests (loads patterns once). */
export function buildChannelMarkersSync(fields, patterns) {
  const candidates = [fields.filename, fields.audioChannels].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  const hits = new Set();
  for (const h of haystacks) {
    for (const id of GC_IDS) {
      if (patterns[id]?.test(h)) hits.add(id);
    }
  }
  let out = "";
  for (const id of hits) {
    for (const m of resolveMarkerRef(BADGE_MARKERS[id])) {
      if (m && !out.includes(m)) out += m;
    }
  }
  return out;
}

export { GC_IDS };
