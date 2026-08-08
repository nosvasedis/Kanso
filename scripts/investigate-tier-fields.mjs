/**
 * Tier field investigation — documents AIOStreams stream fields for gms badge migration.
 *
 * Run: node scripts/investigate-tier-fields.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SYNC_TIER_IDS } from "./tier-group-sync.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DOC_PATH = path.join(ROOT, "docs", "v2-tier-field-investigation.md");

/** Vidhin Releases-Regex rule names (English template) — tier labels in RSE output. */
const VIDHIN_TIER_RULE_NAMES = {
  web: ["Radarr Web T6", "Radarr Web T5", "Radarr Web T4", "Radarr Web T3", "Radarr Web T2", "Radarr Web T1"],
  bluray: [
    "Radarr BluRay T8",
    "Radarr BluRay T7",
    "Radarr BluRay T6",
    "Radarr BluRay T5",
    "Radarr BluRay T4",
    "Radarr BluRay T3",
    "Radarr BluRay T2",
    "Radarr BluRay T1",
  ],
  remux: ["Radarr Remux T3", "Radarr Remux T2", "Radarr Remux T1"],
};

const FIELD_CANDIDATES = [
  {
    field: "stream.rseMatched",
    type: "string[]",
    reliability: "high (when Vidhin RSE loaded)",
    notes:
      "All matched Ranked Stream Expression rule names. Vidhin recommends this for tier badges. Values like `Radarr Web T1`.",
  },
  {
    field: "stream.rankedRegexMatched",
    type: "string[]",
    reliability: "medium",
    notes: "Names of ranked regex filters that matched. May overlap with RSE but depends on AIOStreams config.",
  },
  {
    field: "stream.regexMatched",
    type: "string",
    reliability: "low for tiers",
    notes:
      "Single first/highest match only. Used today for `Bad RG` context line in formatter. Vidhin warns it can show the wrong tier on multi-match streams.",
  },
  {
    field: "stream.releaseGroup",
    type: "string",
    reliability: "high for group identity, not tier rank",
    notes:
      "Raw release group token. nosvasedis tier badges today embed allowlists of groups per tier (synced from Vidhin regexes.json via tier-group-sync.mjs). Works without RSE but causes huge badge regex.",
  },
];

const RECOMMENDATION = `## Recommendation (Phase 0 — decide before Phase 4)

### Preferred path: \`stream.rseMatched\` (Kingsize-like)

When the user has **Vidhin Releases-Regex** (or equivalent RSE rules) loaded in AIOStreams:

\`\`\`text
{stream.rseMatched::string::~Radarr Web T1["<WEB_T1_MARKER>"||""]}
\`\`\`

- **Pros**: O(1) formatter expression per tier; marker-only gms patterns; no 150KB \`*-unranked\` composites.
- **Cons**: Requires RSE template; users without Vidhin need a fallback.

### Fallback path: \`stream.releaseGroup\` batched inject

Map \`releaseGroup\` against Vidhin group lists (same data as \`tier-group-sync.mjs\`) and emit tier markers in the formatter:

\`\`\`text
{stream.releaseGroup::string::~^(?:FLUX|GROUP2|...)$["<WEB_T1_MARKER>"||""]}
\`\`\`

- **Pros**: Works without RSE; parity with current badge allowlists.
- **Cons**: Many groups × 17 ranked tiers = large inject; risks **5000-char formatter budget** (Phase 8 may need name-side split).

### Do not use for tier rank

- \`stream.regexMatched\` — single string, wrong tier possible when multiple rules match.

### Eliminate in v2

- \`web-unranked\`, \`blu-ray-unranked\`, \`remux-unranked\` composite patterns (~152KB each, Node compile failures). Replace with:
  - **Unranked marker** when no tier marker fired for that source class, or
  - Explicit “no tier matched” inject branch in formatter.

### Open validation (manual / live AIOStreams)

1. Add a debug formatter line logging \`{stream.rseMatched}\` and \`{stream.rankedRegexMatched}\` on real RD streams.
2. Confirm Vidhin rule names appear verbatim in \`rseMatched\` for known groups (FLUX → Web T1, etc.).
3. Measure formatter inject size for releaseGroup fallback before committing.

**Phase 0 decision gate**: pick primary + fallback strategy, then implement Phase 4 tier inject.`;

function buildDoc() {
  const lines = [
    "# V2 tier field investigation",
    "",
    "Phase 0 output — informs Phase 4 (gms) marker inject. **Do not implement tier inject until strategy is chosen.**",
    "",
    "## Problem",
    "",
    "Today, **gms** tier badges match enormous release-group allowlists inside badge regex (synced from [Vidhin Releases-Regex](https://github.com/Vidhin05/Releases-Regex)). Three `*-unranked` filters alone account for ~84% of pattern bytes and fail Node `RegExp` compile (Nuvio still runs them). V2 should move tier detection into the formatter and use marker-only badge patterns.",
    "",
    "## AIOStreams custom formatter fields",
    "",
    "Reference: [AIOStreams Custom Formatter wiki](https://github.com/Viren070/AIOStreams/wiki/Custom-Formatter).",
    "",
    "| Field | Type | Tier suitability | Notes |",
    "|-------|------|------------------|-------|",
    ...FIELD_CANDIDATES.map(
      (f) => `| \`${f.field}\` | ${f.type} | ${f.reliability} | ${f.notes} |`
    ),
    "",
    "## Vidhin tier rule names (RSE)",
    "",
    "If `rseMatched` is populated, expect names like:",
    "",
    ...Object.entries(VIDHIN_TIER_RULE_NAMES).flatMap(([kind, names]) => [
      `### ${kind}`,
      "",
      names.map((n) => `- \`${n}\``).join("\n"),
      "",
    ]),
    "",
    "## Current nosvasedis approach (v1)",
    "",
    `- Tier badges synced via \`scripts/tier-group-sync.mjs\` for IDs: ${SYNC_TIER_IDS.join(", ")}.`,
    "- Unranked tiers rebuilt from ranked allowlists (`tier-patterns.mjs`).",
    "- Formatter uses `stream.regexMatched` only for **Bad RG** warning (`CONTEXT_BLOCK` in `formatter-layout.mjs`), not for tier badges.",
    "- `stream.releaseGroup` is visible in the formatter layout (not hidden markers).",
    "",
    "## V2 marker allocation (ready)",
    "",
    "`scripts/formatter-markers.mjs` already allocates unique markers for all 20 gms badge IDs (including `*-unranked`). Phase 4 wires formatter inject to emit them.",
    "",
    RECOMMENDATION,
    "",
    "## Related files",
    "",
    "- `scripts/formatter-markers.mjs` — `TIER_MARKERS` / `BADGE_MARKERS`",
    "- `scripts/tier-group-sync.mjs` — Vidhin group lists → v1 patterns",
    "- `scripts/tier-patterns.mjs` — unranked composite builders (to delete in v2)",
    "- `scripts/formatter-layout.mjs` — `FORMATTER_MAX_LENGTH` (5000)",
    "",
    `_Generated by scripts/investigate-tier-fields.mjs_`,
    "",
  ];
  return lines.join("\n");
}

export async function writeTierInvestigationDoc() {
  await fs.mkdir(path.dirname(DOC_PATH), { recursive: true });
  const content = buildDoc();
  await fs.writeFile(DOC_PATH, content);
  return { docPath: DOC_PATH, bytes: content.length };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { docPath, bytes } = await writeTierInvestigationDoc();
  console.log(`Wrote ${docPath} (${bytes} bytes)`);
}
