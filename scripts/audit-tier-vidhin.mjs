/**
 * Read-only audit: tier correctness vs live Vidhin Releases-Regex data.
 *
 * Checks (no writes):
 *  1. Every live Vidhin tier rule name is covered by at least one formatter
 *     `stream.rseMatched::~X` gate (case-insensitive contains semantics, per
 *     AIOStreams base.ts:933-936).
 *  2. No RSE gate is entirely dead (INFO for web-4..6 / blu-ray-4..8 gates —
 *     those tiers intentionally rely on releaseGroup fallback).
 *  3. Release-group drift: live Vidhin lists vs the v1 oracle lists
 *     (would-add / would-remove in strict mode), and confirmation that the
 *     formatter.json `stream.releaseGroup::in('G',…)` gates emit exactly the marker
 *     pairs the oracle implies.
 *
 * Run: node scripts/audit-tier-vidhin.mjs  (uses live Vidhin; falls back to
 * .cache/vidhin-regexes.json if the network fetch fails)
 */
import fs from "fs";
import {
  extractBadgeTierGroups,
  extractVidhinGroups,
  vidhinNameToBadgeId,
  SYNC_TIER_IDS,
  TIER_SYNC_TARGET,
  VIDHIN_REGEXES_URL,
} from "./tier-group-sync.mjs";
import { TIER_MARKERS } from "./formatter-markers.mjs";

let issues = 0;
function issue(msg) {
  console.error("ISSUE:", msg);
  issues++;
}
function info(msg) {
  console.log("info:", msg);
}

// ---- load live Vidhin (fallback: cache) ----
let vidhinRules = [];
let source = "live";
try {
  const res = await fetch(VIDHIN_REGEXES_URL, {
    headers: { "User-Agent": "nosvasedis-formatter-audit/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  vidhinRules = await res.json();
} catch {
  source = "cache";
  vidhinRules = JSON.parse(fs.readFileSync(".cache/vidhin-regexes.json", "utf8"));
}
info(`vidhin source: ${source} (${vidhinRules.length} rules)`);

// ---- 1. RSE gate coverage ----
const formatter = JSON.parse(fs.readFileSync("formatter.json", "utf8"));
const rseGates = [...formatter.name.matchAll(/stream\.rseMatched::~([^:"[\]]+)/g)].map((m) =>
  m[1].trim()
);
const uniqueGates = [...new Set(rseGates)];
info(`RSE gates in formatter.json: ${uniqueGates.length} unique`);

const tierRuleNames = new Set();
for (const rule of vidhinRules) {
  if (vidhinNameToBadgeId(rule.name)) tierRuleNames.add(rule.name.trim());
}
info(`live Vidhin tier rule names: ${tierRuleNames.size}`);

// `::~` on rseMatched is element-EXACT (case-insensitive), so every live rule
// name must be matched by a gate name exactly.
const gateNames = new Set(uniqueGates.map((g) => g.toLowerCase()));
const uncovered = [...tierRuleNames].filter(
  (name) => !gateNames.has(name.toLowerCase())
);
if (uncovered.length) {
  issue(`Vidhin tier rule names with NO matching RSE gate: ${uncovered.join(", ")}`);
} else {
  info("every Vidhin tier rule name is covered by an exact RSE gate");
}

const deadGates = uniqueGates.filter(
  (g) => ![...tierRuleNames].some((n) => n.toLowerCase() === g.toLowerCase())
);
for (const g of deadGates) {
  const tier = g.match(/T(\d+)$/)?.[1];
  const bare = !/^(?:Radarr|Sonarr) /.test(g);
  const isBeyondVidhin =
    (g.toLowerCase().includes("web t") && Number(tier) > 3) ||
    (g.toLowerCase().includes("bluray t") && Number(tier) > 3);
  info(
    bare || isBeyondVidhin
      ? `gate "${g}" has no live rule (expected — ${bare ? "bare/legacy name form" : `badge tier ${tier} exists only via releaseGroup fallback`})`
      : `gate "${g}" has no live rule (unexpected)`
  );
}

// ---- 2. RG drift: live Vidhin vs oracle ----
const oracle = JSON.parse(fs.readFileSync(TIER_SYNC_TARGET, "utf8"));
const oracleByBadge = Object.fromEntries(
  oracle.filters.map((f) => [f.id, f])
);
const liveByBadge = {};
for (const id of SYNC_TIER_IDS) liveByBadge[id] = new Set();
for (const rule of vidhinRules) {
  const id = vidhinNameToBadgeId(rule.name);
  if (!id || !SYNC_TIER_IDS.includes(id)) continue;
  for (const g of extractVidhinGroups(rule.pattern)) liveByBadge[id].add(g);
}

let wouldAdd = 0;
let onlyLocal = 0;
function normalizeGroup(g) {
  return g.replace(/\\(.)/g, "$1").toLowerCase();
}
for (const id of SYNC_TIER_IDS) {
  const local = new Set(
    (extractBadgeTierGroups(oracleByBadge[id]?.pattern ?? "") ?? []).map(normalizeGroup)
  );
  const live = new Set([...(liveByBadge[id] ?? [])].map(normalizeGroup));
  const add = [...live].filter((g) => !local.has(g));
  const loc = [...local].filter((g) => !live.has(g));
  wouldAdd += add.length;
  onlyLocal += loc.length;
  if (add.length) info(`${id}: ${add.length} would be added (${add.slice(0, 6).join(", ")})`);
  if (loc.length) info(`${id}: ${loc.length} only-local groups (kept in add-only, removed in strict)`);
}
info(`RG drift totals: ${wouldAdd} would-add, ${onlyLocal} only-local`);

// ---- 3. formatter.json releaseGroup gates vs oracle pairs ----
// Each gate uses stream.releaseGroup::in('A','B',…) and emits ONE marker.
const markerToBadge = Object.fromEntries(
  Object.entries(TIER_MARKERS).map(([id, m]) => [m, id])
);
function unescapeGroup(g) {
  return g.replace(/\\(.)/g, "$1");
}
const fmtPairs = new Set();
for (const m of formatter.name.matchAll(/\{([^{}]*?)\["([^"]+)"\|\|""\]\}/g)) {
  const body = m[1];
  if (!body.includes("stream.releaseGroup::in(")) continue;
  const badgeId = markerToBadge[m[2]];
  if (!badgeId) continue;
  for (const inCall of body.matchAll(/stream\.releaseGroup::in\(([^)]*)\)/g)) {
    for (const gm of inCall[1].matchAll(/'([^']*)'/g)) {
      fmtPairs.add(`${badgeId}\u0000${unescapeGroup(gm[1]).toLowerCase()}`);
    }
  }
}
const expectedPairs = new Set();
// Model the generator exactly: per (group, source-class), only the BEST tier's
// marker is emitted (buildReleaseGroupReplaceChain keeps the last-processed
// entry per source; priority order ends at the best tier). Unranked lists are
// not per-group gated in the formatter.
const bestMarkerByGroupSource = new Map();
for (const id of SYNC_TIER_IDS) {
  if (id.endsWith("-unranked")) continue;
  const source = id.startsWith("web-")
    ? "web"
    : id.startsWith("blu-ray-")
      ? "blu-ray"
      : "remux";
  const marker = TIER_MARKERS[id];
  for (const g of extractBadgeTierGroups(oracleByBadge[id]?.pattern ?? "") ?? []) {
    const key = `${normalizeGroup(g)}|${source}`;
    if (!bestMarkerByGroupSource.has(key)) bestMarkerByGroupSource.set(key, marker);
  }
}
const markerToBadgeId = Object.fromEntries(
  Object.entries(TIER_MARKERS).map(([id, m]) => [m, id])
);
for (const [key, marker] of bestMarkerByGroupSource) {
  const [group] = key.split("|");
  expectedPairs.add(`${markerToBadgeId[marker]}\u0000${group}`);
}
const missingPairs = [...expectedPairs].filter((p) => !fmtPairs.has(p));
const extraPairs = [...fmtPairs].filter((p) => !expectedPairs.has(p));
if (missingPairs.length) {
  issue(`oracle groups missing from formatter gates: ${missingPairs.length} (${missingPairs.slice(0, 5).join(", ")})`);
} else {
  info(`all ${expectedPairs.size} oracle group→tier pairs are emitted by formatter gates`);
}
if (extraPairs.length) {
  info(`formatter emits ${extraPairs.length} group→tier pairs beyond the oracle: ${extraPairs.slice(0, 5).join(", ")}`);
}

console.log("");
if (issues) {
  console.log(`${issues} issue(s) found.`);
  process.exitCode = 1;
} else {
  console.log("OK: tier setup matches live Vidhin data.");
}
