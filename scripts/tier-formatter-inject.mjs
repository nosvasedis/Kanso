/**
 * V2 tier formatter inject — RSE primary + releaseGroup fallback + unranked.
 */
import {
  FORMATTER_V2_INJECT_TIERS,
  getFormatterV2InjectTiers,
  GMS_IDS,
  loadTierGroupsFromBadgesSync,
  simulateTierInjectMarkers,
} from "./tier-inject-generator.mjs";
import { BADGE_MARKERS, resolveMarkerRef } from "./formatter-markers.mjs";
import { SOLID_BADGES_PATH } from "./badge-patch.mjs";
import { V1_SOLID_BADGES_PATH } from "./v1-badge-oracle.mjs";
import fs from "fs/promises";

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

let v1TierPatterns = null;

async function loadV1TierPatterns() {
  if (v1TierPatterns) return v1TierPatterns;
  const raw = await fs.readFile(V1_SOLID_BADGES_PATH, "utf8");
  const data = JSON.parse(raw);
  v1TierPatterns = Object.fromEntries(
    GMS_IDS.map((id) => {
      const f = data.filters.find((x) => x.id === id);
      return [id, f?.pattern ? nuvioRegex(f.pattern) : null];
    })
  );
  return v1TierPatterns;
}

/** @param {{ filename?: string, rseMatched?: string, releaseGroup?: string, quality?: string }} fields */
export async function tierBadgeIdsFromFields(fields) {
  const patterns = await loadV1TierPatterns();
  const rseLine = Array.isArray(fields.rseMatched)
    ? fields.rseMatched.join(" ")
    : fields.rseMatched ?? "";
  const candidates = [
    fields.filename,
    fields.releaseGroup,
    rseLine,
    fields.quality,
  ].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  const hits = new Set();
  for (const h of haystacks) {
    for (const id of GMS_IDS) {
      if (patterns[id]?.test(h)) hits.add(id);
    }
  }
  return [...hits];
}

/**
 * Simulate tier markers for tests (v1 parity oracle).
 * @param {object} fields
 * @param {Record<string, RegExp|null>} [patterns]
 */
export function buildTierMarkersSync(fields, patterns) {
  const rseLine = Array.isArray(fields.rseMatched)
    ? fields.rseMatched.join(" ")
    : fields.rseMatched ?? "";
  const candidates = [
    fields.filename,
    fields.releaseGroup,
    rseLine,
    fields.quality,
  ].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  const hits = new Set();
  for (const h of haystacks) {
    for (const id of GMS_IDS) {
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

export async function buildTierMarkers(fields) {
  const patterns = await loadV1TierPatterns();
  return buildTierMarkersSync(fields, patterns);
}

export { FORMATTER_V2_INJECT_TIERS, getFormatterV2InjectTiers, GMS_IDS, simulateTierInjectMarkers };
