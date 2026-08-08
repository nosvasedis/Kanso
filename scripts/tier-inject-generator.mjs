/**
 * Build tier marker inject from Vidhin RSE names + releaseGroup allowlists.
 */
import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SYNC_TIER_IDS,
  extractBadgeTierGroups,
} from "./tier-group-sync.mjs";
import { TIER_MARKERS } from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { UNRANKED_TIER_MAP } from "./tier-patterns.mjs";
import { SOLID_BADGES_PATH } from "./badge-patch.mjs";
import { V1_SOLID_BADGES_PATH } from "./v1-badge-oracle.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GMS_IDS = MONO_FILTER_ORDER.gms;

/**
 * Exact rule-name forms per tier. IMPORTANT: `::~` on an array is an
 * element-EXACT, case-insensitive check (Array.prototype.includes on the
 * lowercased elements, base.ts:933-936,1339) — NOT a substring check. A
 * gate `~Web T1` therefore only matches an rseMatched element literally
 * equal to "Web T1" (Vidhin's generic rule), never "Radarr Web T1". Each
 * real Vidhin name form needs its own gate.
 * @param {string} badgeId
 */
export function tierRseRuleNames(badgeId) {
  let m = badgeId.match(/^web-(\d+)$/);
  if (m) {
    const n = m[1];
    return [`Web T${n}`, `Radarr Web T${n}`, `Sonarr Web T${n}`];
  }
  m = badgeId.match(/^blu-ray-(\d+)$/);
  if (m) {
    const n = m[1];
    return [
      `BluRay T${n}`,
      `HD Bluray T${n}`,
      `UHD BluRay T${n}`,
      `Radarr UHD Bluray T${n}`,
      `Radarr HD Bluray T${n}`,
      `Sonarr HD Bluray T${n}`,
    ];
  }
  m = badgeId.match(/^remux-(\d+)$/);
  if (m) {
    const n = m[1];
    return [`Remux T${n}`, `Radarr Remux T${n}`, `Sonarr Remux T${n}`];
  }
  return [];
}

function gate(cond, marker) {
  return `{${cond}["${marker}"||""]}`;
}

/** Safe filename contains — null filename must not make OR operands undefined. */
function filenameContains(token) {
  return `stream.filename::exists::and::stream.filename` + `::~${token}`;
}

/** No ranked stream-expression matches (rseMatched is always an array in AIOStreams). */
const NO_RSE_MATCHED = "stream.rseMatched::length::=0";

/**
 * RSE inject — per-rule gates (markers only; custom SE names like "4K" must not echo).
 *
 * `::~` on rseMatched (an array) is an element-EXACT case-insensitive check, so
 * every real Vidhin name form gets its own gate (see tierRseRuleNames). No
 * anime guard is needed: "Anime Web T1" is never element-equal to "Web T1".
 * Best-tier display is handled by the badge patterns
 * (V2_PATTERN_MARKER_EXCLUSIONS) — the formatter emits every matched tier's
 * marker and the patterns show only the best.
 * @param {Record<string, string>} markers
 */
export function buildRseGates(markers) {
  let out = "";
  for (const id of SYNC_TIER_IDS) {
    const marker = markers[id];
    const names = tierRseRuleNames(id);
    if (!names.length) continue;
    const cond = names.map((name) => `stream.rseMatched::~${name}`).join("::or::");
    out += gate(cond, marker);
  }
  return out;
}

/** @deprecated use buildRseGates — join+replace echoes non-tier rseMatched names into the title */
export function buildRseReplaceChain(markers) {
  let chain = "";
  for (const id of SYNC_TIER_IDS) {
    const marker = markers[id];
    for (const name of tierRseRuleNames(id)) {
      chain += `::replace('${name}','${marker}')`;
    }
  }
  if (!chain) return "";
  return `{stream.rseMatched::exists["{stream.rseMatched::join(' ')${chain}}"||""]}`;
}

function escapeRegexGroup(g) {
  return g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize a release group for dedup/comparison (unescape + lowercase). */
function normalizeGroupKey(g) {
  return g.replace(/\\(.)/g, "$1").toLowerCase();
}

/**
 * @param {Record<string, string[]>} groupsByBadge
 * @param {Record<string, string>} markers
 */
export function buildReleaseGroupReplaceChain(groupsByBadge, markers) {
  /** @type {Map<string, Map<string, { badgeId: string, marker: string, raw: string }>>} */
  const groupBySource = new Map();

  const priority = [...SYNC_TIER_IDS].reverse();
  for (const badgeId of priority) {
    const marker = markers[badgeId];
    const groups = groupsByBadge[badgeId] ?? [];
    for (const g of groups) {
      const source = badgeId.startsWith("web-")
        ? "web"
        : badgeId.startsWith("blu-ray-")
          ? "blu-ray"
          : "remux";
      // Dedup case-insensitively and unescape regex-escaped names (e.g.
      // D\-Z0N3) so case-variant duplicates collapse to one gate per source
      // (best tier wins — priority ends at the best tier) and escaped
      // variants do not produce dead `::=` operands.
      const key = normalizeGroupKey(g);
      const bySource = groupBySource.get(key) ?? new Map();
      bySource.set(source, { badgeId, marker, raw: g.replace(/\\(.)/g, "$1") });
      groupBySource.set(key, bySource);
    }
  }

  const byTier = new Map();
  let ambiguous = "";
  for (const [, sources] of groupBySource) {
    if (sources.size === 1) {
      const { badgeId, marker, raw } = [...sources.values()][0];
      const entry = byTier.get(marker) ?? { badgeId, groups: [] };
      entry.groups.push(raw);
      byTier.set(marker, entry);
      continue;
    }
    for (const [source, { marker, raw }] of sources) {
      const quality = source === "web" ? "WEB" : source === "blu-ray" ? "BluRay" : "REMUX";
      const remuxExcl =
        quality === "BluRay" ? "::and::stream.quality::~REMUX::isfalse" : "";
      ambiguous += gate(
        `stream.quality::~${quality}::and::stream.releaseGroup::in('${escapeInArg(raw)}')${remuxExcl}::and::${RG_GUARD}`,
        marker
      );
    }
  }
  let out = "";
  for (const [marker, { badgeId, groups }] of byTier) {
    const source = badgeId.startsWith("web-")
      ? "web"
      : badgeId.startsWith("blu-ray-")
        ? "blu-ray"
        : "remux";
    // AIOStreams 2.32 ::in() — case-insensitive membership; replaces long
    // releaseGroup::=A::or::releaseGroup::=B chains.
    const membership = `stream.releaseGroup::in(${groups.map((g) => `'${escapeInArg(g)}'`).join(",")})`;
    // Left-associative: (in) and rse=0 and not-anime and <quality>
    out += gate(`${membership}::and::${RG_GUARD}::and::${sourceQualityCond(source)}`, marker);
  }
  return out + ambiguous;
}

/** Quote-safe argument for ::in('…') — group names must not break the list. */
function escapeInArg(name) {
  return String(name).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * Ranked RG fallback only when no RSE matched and the request is not anime.
 * `isAnime::istrue::isfalse` is true when isAnime is false or missing, false
 * when isAnime is true (2.32 exposes metadata.isAnime).
 */
const RG_GUARD =
  "stream.rseMatched::length::=0::and::metadata.isAnime::istrue::isfalse";

/** Quality precondition for a source class (blu-ray must not fire on REMUX). */
function sourceQualityCond(source) {
  return source === "web"
    ? "stream.quality::~WEB"
    : source === "blu-ray"
      ? "stream.quality::~BluRay::and::stream.quality::~REMUX::isfalse"
      : "stream.quality::~REMUX";
}

const WEB_SOURCE =
  `stream.quality::~WEB::or::${filenameContains("WEB-DL")}::or::${filenameContains("WEBDL")}`;
const BLURAY_SOURCE =
  `stream.quality::~BluRay::or::${filenameContains("BluRay")}::or::${filenameContains("Blu-ray")}`;
const REMUX_SOURCE =
  `stream.quality::~REMUX::or::${filenameContains("REMUX")}`;

/**
 * @param {string[]} rankedGroups escaped alternation body (without parens)
 * @param {string} sourceCond
 * @param {string} marker
 */
function unrankedGate(rankedGroups, sourceCond, marker) {
  if (!rankedGroups.length) return "";
  // Parsed quality is the compact, reliable source discriminator. Ranked
  // markers may emit alongside this fallback; badge exclusions suppress it.
  const quality =
    marker === TIER_MARKERS["web-unranked"]
      ? "stream.quality::~WEB"
      : marker === TIER_MARKERS["blu-ray-unranked"]
        ? "stream.quality::~BluRay::and::stream.quality::~REMUX::isfalse"
        : "stream.quality::~REMUX";
  return gate(`${NO_RSE_MATCHED}::and::stream.releaseGroup::exists::and::${quality}`, marker);
}

/**
 * @param {Record<string, string[]>} groupsByBadge
 */
export function buildTierInject(groupsByBadge) {
  const rse = buildRseGates(TIER_MARKERS);

  const rgChain = buildReleaseGroupReplaceChain(groupsByBadge, TIER_MARKERS);

  const webRanked = uniqueRankedGroups(groupsByBadge, "web-");
  const blurayRanked = uniqueRankedGroups(groupsByBadge, "blu-ray-");
  const remuxRanked = uniqueRankedGroups(groupsByBadge, "remux-");

  const unranked =
    unrankedGate(webRanked, WEB_SOURCE, TIER_MARKERS["web-unranked"]) +
    unrankedGate(blurayRanked, BLURAY_SOURCE, TIER_MARKERS["blu-ray-unranked"]) +
    unrankedGate(remuxRanked, REMUX_SOURCE, TIER_MARKERS["remux-unranked"]);

  return { rse, rgChain, unranked, tiers: rse + rgChain + unranked };
}

/** @param {Record<string, string[]>} groupsByBadge @param {string} prefix */
function uniqueRankedGroups(groupsByBadge, prefix) {
  const seen = new Set();
  const out = [];
  for (const id of SYNC_TIER_IDS) {
    if (!id.startsWith(prefix)) continue;
    for (const g of groupsByBadge[id] ?? []) {
      if (seen.has(g)) continue;
      seen.add(g);
      out.push(g);
    }
  }
  return out;
}

/** @param {object} data parsed badge JSON */
function tierGroupsFromBadgeData(data) {
  const byId = Object.fromEntries(data.filters.map((f) => [f.id, f]));
  /** @type {Record<string, string[]>} */
  const groupsByBadge = {};
  for (const id of [...SYNC_TIER_IDS, ...Object.keys(UNRANKED_TIER_MAP)]) {
    const pattern = byId[id]?.pattern;
    if (!pattern) {
      groupsByBadge[id] = [];
      continue;
    }
    groupsByBadge[id] = extractBadgeTierGroups(pattern) ?? [];
  }
  return groupsByBadge;
}

/** Load tier group lists from v1 snapshot badge JSON. */
export async function loadTierGroupsFromBadges(
  badgesPath = V1_SOLID_BADGES_PATH
) {
  const raw = await fs.readFile(badgesPath, "utf8");
  return tierGroupsFromBadgeData(JSON.parse(raw));
}

/** Sync load (formatter module init) — tier groups always from v1 snapshot (v2 patterns have no RG lists). */
export function loadTierGroupsFromBadgesSync(
  badgesPath = V1_SOLID_BADGES_PATH
) {
  const raw = readFileSync(badgesPath, "utf8");
  return tierGroupsFromBadgeData(JSON.parse(raw));
}

let cachedInject = null;

/** Tier inject string (built from current solid badge group lists). */
export async function getFormatterV2InjectTiers() {
  if (cachedInject) return cachedInject;
  const groups = await loadTierGroupsFromBadges();
  cachedInject = buildTierInject(groups).tiers;
  return cachedInject;
}

/** Sync build when groups provided (tests). */
export function buildFormatterV2InjectTiersSync(groupsByBadge) {
  return buildTierInject(groupsByBadge).tiers;
}

/** Split tier inject for budget packing (Phase 8). */
export function buildTierInjectPartsSync(groupsByBadge) {
  return buildTierInject(groupsByBadge);
}

/**
 * Simulate formatter tier inject markers in JS (test oracle for v2 inject).
 * @param {object} fields
 * @param {Record<string, string[]>} groupsByBadge
 */
export function simulateTierInjectMarkers(fields, groupsByBadge) {
  const rseLine = Array.isArray(fields.rseMatched)
    ? fields.rseMatched.join(" ")
    : fields.rseMatched ?? "";
  const hasRse = Boolean(rseLine.trim());

  /** @type {Set<string>} */
  const hits = new Set();

  if (hasRse) {
    // `::~` on rseMatched is element-EXACT (case-insensitive): "Anime Web T1"
    // can never match "Web T1", and "Radarr Web T1" needs its own gate.
    const rseElems = new Set(
      (Array.isArray(fields.rseMatched) ? fields.rseMatched : [rseLine])
        .map((n) => n.trim().toLowerCase())
        .filter(Boolean)
    );
    for (const id of SYNC_TIER_IDS) {
      const names = tierRseRuleNames(id);
      if (names.some((n) => rseElems.has(n.toLowerCase()))) hits.add(id);
    }
    let out = "";
    for (const id of hits) {
      const m = TIER_MARKERS[id];
      if (m && !out.includes(m)) out += m;
    }
    return out;
  }

  const rg = fields.releaseGroup?.trim();
  const filename = fields.filename ?? "";
  const quality = fields.quality ?? "";
  const webSrc =
    /WEB/i.test(quality) || /WEB[-_. ]?DL|WEBDL/i.test(filename);
  const bluraySrc =
    /BluRay/i.test(quality) || /BluRay|Blu-ray/i.test(filename);
  const remuxSrc = /REMUX/i.test(quality) || /REMUX/i.test(filename);

  if (fields.isAnime !== true && rg) {
    const rgKey = rg.toLowerCase();
    // Mirror the formatter: per source class only the best tier fires, and
    // only when the stream quality matches that source (blu-ray excludes REMUX).
    const sourceHit = new Set();
    for (const badgeId of SYNC_TIER_IDS) {
      if (!(groupsByBadge[badgeId] ?? []).some((g) => g.toLowerCase() === rgKey)) {
        continue;
      }
      const source = badgeId.startsWith("web-")
        ? "web"
        : badgeId.startsWith("blu-ray-")
          ? "blu-ray"
          : "remux";
      if (sourceHit.has(source)) continue;
      const qualityOk =
        source === "web"
          ? webSrc
          : source === "blu-ray"
            ? bluraySrc && !remuxSrc
            : remuxSrc;
      if (!qualityOk) continue;
      sourceHit.add(source);
      hits.add(badgeId);
    }
  }

  // Unranked fallback: mirrors the formatter's unranked gates — they fire on
  // releaseGroup::exists per source quality (independent per source), and the
  // badge patterns suppress them when a ranked marker of the same source is
  // present. Per-source so a "Bluray REMUX" shows only REMUX unranked.
  if (rg && !hits.size) {
    if (webSrc) hits.add("web-unranked");
    if (bluraySrc && !remuxSrc) hits.add("blu-ray-unranked");
    if (remuxSrc) hits.add("remux-unranked");
  }

  let out = "";
  for (const id of hits) {
    const m = TIER_MARKERS[id];
    if (m && !out.includes(m)) out += m;
  }
  return out;
}

const _tierParts = buildTierInjectPartsSync(loadTierGroupsFromBadgesSync());
export const FORMATTER_V2_INJECT_TIERS_RSE = _tierParts.rse;
export const FORMATTER_V2_INJECT_TIERS_RG = _tierParts.rgChain;
export const FORMATTER_V2_INJECT_TIERS_UNRANKED = _tierParts.unranked;
export const FORMATTER_V2_INJECT_TIERS = _tierParts.tiers;

export { GMS_IDS, SYNC_TIER_IDS };
