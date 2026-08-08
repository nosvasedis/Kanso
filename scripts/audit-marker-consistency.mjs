/**
 * Read-only audit: marker ↔ formatter-inject ↔ badge-pattern consistency.
 *
 * Checks (no writes):
 *  1. Every invisible marker token emitted by formatter.json appears in at
 *     least one badge pattern, and vice versa.
 *  2. No two badge filters share a marker token (1:1 ownership), except when
 *     the filter is an explicit combo/haystack that intentionally references
 *     several markers.
 *  3. Tier badge patterns contain exactly their TIER_MARKERS token and no
 *     other tier's token.
 *  4. Formatter budget: name/description lengths vs 5000 (AIOStreams default)
 *     and vs the local FORMATTER_MAX_LENGTH.
 *
 * Run: node scripts/audit-marker-consistency.mjs
 */
import fs from "fs";
import { TIER_MARKERS, V2_PATTERN_MARKER_EXCLUSIONS } from "./formatter-markers.mjs";
import { FORMATTER_MAX_LENGTH } from "./formatter-layout.mjs";
import { SOLID_BADGES_PATH, TRANSPARENT_BADGES_PATH, MONO_BADGES_PATH } from "./badge-patch.mjs";

const INVISIBLE = /[\u180b-\u180d\u200b-\u200f\u2060-\u206f\ufeff]+/g;
const ESCAPE_RUN = /(?:\\u[0-9a-fA-F]{4})+/g;

/** Extract invisible-char runs from formatter text (real characters). */
export function extractMarkerTokens(text) {
  return [...new Set(text.match(INVISIBLE) ?? [])];
}

/**
 * Extract marker tokens from a badge pattern: patterns store markers as
 * `\uXXXX` escape text (regex source), which the Nuvio regex engine decodes.
 * Decode those runs to real characters so they compare with formatter tokens.
 */
export function extractPatternMarkerTokens(pattern) {
  const out = [];
  for (const m of pattern.matchAll(ESCAPE_RUN)) {
    const decoded = m[0].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    );
    out.push(decoded);
  }
  return [...new Set(out)];
}

let issues = 0;
let notes = 0;
function issue(msg) {
  console.error("ISSUE:", msg);
  issues++;
}
function note(msg) {
  console.log("note:", msg);
  notes++;
}

// ---- load sources ----
const formatter = JSON.parse(fs.readFileSync("formatter.json", "utf8"));
const nameTokens = extractMarkerTokens(formatter.name);
const descTokens = extractMarkerTokens(formatter.description);
const fmtTokens = new Set([...nameTokens, ...descTokens]);
note(`formatter.json name tokens: ${nameTokens.length}, description tokens: ${descTokens.length}`);

const badges = {};
for (const p of [SOLID_BADGES_PATH, TRANSPARENT_BADGES_PATH, MONO_BADGES_PATH]) {
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  badges[p] = data.filters.map((f) => ({
    id: f.id,
    pattern: f.pattern ?? "",
    tokens: extractPatternMarkerTokens(f.pattern ?? ""),
  }));
}

const solid = badges[SOLID_BADGES_PATH];
const patternTokens = new Set(solid.flatMap((f) => f.tokens));
note(`solid badge filters: ${solid.length}, distinct pattern tokens: ${patternTokens.size}`);

// ---- 1. bidirectional coverage ----
const orphansFmt = [...fmtTokens].filter((t) => ![...patternTokens].some((p) => p.includes(t) || t.includes(p)));
const orphansBadge = [...patternTokens].filter((t) => ![...fmtTokens].some((p) => p.includes(t) || t.includes(p)));
if (orphansFmt.length) {
  issue(`formatter tokens not covered by any badge pattern: ${JSON.stringify(orphansFmt.slice(0, 5))}${orphansFmt.length > 5 ? ` (+${orphansFmt.length - 5} more)` : ""}`);
} else {
  note("all formatter tokens are covered by badge patterns");
}
if (orphansBadge.length) {
  issue(`badge-pattern tokens never emitted by the formatter: ${JSON.stringify(orphansBadge.slice(0, 5))}${orphansBadge.length > 5 ? ` (+${orphansBadge.length - 5} more)` : ""}`);
} else {
  note("all badge-pattern tokens are emitted by the formatter");
}

// ---- 2. token ownership: how many filters reference each token ----
const owners = new Map();
for (const f of solid) {
  for (const t of f.tokens) {
    const list = owners.get(t) ?? [];
    list.push(f.id);
    owners.set(t, list);
  }
}
const shared = [...owners.entries()].filter(([, ids]) => ids.length > 1);
note(`tokens referenced by >1 filter: ${shared.length}`);
for (const [t, ids] of shared.slice(0, 10)) {
  // Combo patterns legitimately reference several markers (atoms); report only
  // filters that reference a token WITHOUT being a combo: combos contain >1 token.
  const nonCombos = ids.filter((id) => {
    const f = solid.find((x) => x.id === id);
    return (f?.tokens.length ?? 0) === 1;
  });
  if (nonCombos.length > 1) {
    issue(`token ${JSON.stringify(t)} owned by multiple single-token filters: ${nonCombos.join(", ")}`);
  } else {
    note(`token ${JSON.stringify(t)} shared across combo filters: ${ids.join(", ")}`);
  }
}

// ---- 3. tier 1:1 (token-level; lower-tier patterns legitimately list better
// tiers of the same source as negative lookaheads — best-wins display — and
// unranked patterns list all ranked markers of their source; reported as notes)
const byId = Object.fromEntries(solid.map((f) => [f.id, f]));
const tierTokens = Object.entries(TIER_MARKERS);
for (const [id, marker] of tierTokens) {
  const f = byId[id];
  if (!f) {
    issue(`tier badge filter missing: ${id}`);
    continue;
  }
  const hasOwn = f.tokens.includes(marker);
  const others = tierTokens.filter(([oid, om]) => oid !== id && f.tokens.includes(om));
  if (!hasOwn) issue(`tier ${id} pattern does not contain its own marker`);
  if (others.length) {
    const expected = new Set(V2_PATTERN_MARKER_EXCLUSIONS[id] ?? []);
    const unexpected = others.filter(([oid]) => !expected.has(oid));
    if (unexpected.length) {
      issue(`tier ${id} references unexpected tier markers: ${unexpected.map(([o]) => o).join(", ")}`);
    } else {
      note(`tier ${id} excludes ${others.map(([o]) => o).join(", ")} (best-wins)`);
    }
  }
}
note(`tier markers checked: ${tierTokens.length}`);

// ---- 4. budget ----
note(`formatter name ${formatter.name.length} / description ${formatter.description.length} vs local max ${FORMATTER_MAX_LENGTH}`);
if (formatter.name.length > FORMATTER_MAX_LENGTH || formatter.description.length > FORMATTER_MAX_LENGTH) {
  issue("formatter exceeds local FORMATTER_MAX_LENGTH");
}
const DEFAULT_AIO_MAX = 5000;
if (formatter.name.length > DEFAULT_AIO_MAX || formatter.description.length > DEFAULT_AIO_MAX) {
  note(`formatter exceeds AIOStreams DEFAULT ${DEFAULT_AIO_MAX}/template — instance must raise MAX_FORMATTER_TEMPLATE_LENGTH`);
}

// ---- identical marker set across the three themes ----
const themeCounts = [SOLID_BADGES_PATH, TRANSPARENT_BADGES_PATH, MONO_BADGES_PATH].map((p) => ({
  p,
  n: badges[p].length,
  tokens: new Set(badges[p].flatMap((f) => f.tokens)),
}));
for (let i = 1; i < themeCounts.length; i++) {
  const a = themeCounts[0].tokens;
  const b = themeCounts[i].tokens;
  if (a.size !== b.size || [...a].some((t) => !b.has(t))) {
    issue(`theme marker sets differ: ${themeCounts[0].p} vs ${themeCounts[i].p}`);
  }
}

console.log("");
if (issues) {
  console.log(`${issues} issue(s) found.`);
  process.exitCode = 1;
} else {
  console.log("OK: marker system is internally consistent.");
}
