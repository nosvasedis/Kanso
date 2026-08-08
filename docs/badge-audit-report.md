# Badge & formatter audit report

Date: 2026-08-02 · Scope: formatter.json, nosvasedis-badges-{solid,transparent,mono}.json,
v1 oracle snapshot, Badge Sync Helper (sync-server.mjs / sync-ui / tier-group-sync.mjs).
Nothing in the badge system was changed by the audit itself; Phase 1 (sync helper fix) and
Phase 3 (defect fixes) changes are listed at the end.

---

## 1. What was fixed — Badge Sync Helper (Phase 1)

**Symptom**: every tier in the helper's preview/apply reported
`Could not read release-group list from pattern (unexpected shape)`.

**Root cause**: `scripts/tier-group-sync.mjs` synced the tier release-group allowlists into
`nosvasedis-badges-{solid,transparent,mono}.json`. Those files were migrated to V2
marker-only patterns (`(?s)^(?=.*(?:\u180c\u200e\u200f\u206f))`), so the old v1 allowlist
shape `(?:^\[(?:GROUP1|GROUP2…)\]` no longer exists in them → `extractBadgeTierGroups`
returned `null` for all 17 tier filters in all 3 files.

**Fix**: tier sync now targets the v1 oracle snapshot
(`backup/v1/oracle/nosvasedis-badges-solid.json`) — the source of truth for tier group
lists that `tier-inject-generator.mjs` reads — and then regenerates `formatter.json` via
the existing `patch-formatter.mjs` pipeline (fresh process, so the module-level inject
constants rebuild from the updated oracle). The helper UI/server were updated to match
(oracle + formatter.json instead of “3 badge JSONs”; no gist push after tier sync because
badge JSONs are unchanged; copy/reveal actions target formatter.json).

Verified live end-to-end: 174 Vidhin rules fetched, 0 shape errors, add-only reports
“up to date”, strict preview works with the no-Vidhin-data tiers (web-4..6, blu-ray-4..8)
still protected from being wiped.

## 2. Test suite matrix (pre-change state recorded; post-fix state at the end of this section)

| Result | Tests |
|---|---|
| PASS (33) | test:tier-sync (18 assertions), test:formatter (3), test:formatter-editions, test:edition-badges, test:quality-badges, test:edition-icons, test:streaming, test:streaming-colors, test:solid, test:smart-tier, test:audio-smart-tier, test:bad-source, test:resolution, test:v2-parity, test:v2-runtime (tsx), test:v2-benchmark, test-v2-tiers, test-v2-end-to-end, test-v2-markers, test-v2-marker-boundaries, test-v2-patch-safety, test-v2-audio, test-v2-channels, test-v2-languages, test-v2-quality, test-v2-special, test-v2-visual |
| FAIL (pre-existing) | test:transparent, test:mono — expect 125 filters, actual 124 (124 exactly matches `MONO_FILTER_ORDER`; the test constants are stale). `scripts/audit-badges.mjs` also expects 100 (stale). |
| | test:solid-icons — `q-w` manifest URL (catbox) ≠ canonical (`nvccpa`); stale manifest/upload. |
| | test:solid-dark-icons — several `badges/generated-solid/*.png` missing (a-at-th, a-dtsx-ma, a-at-dp, a-dtsx-hd, a-dtses, …). |
| | test:dr — 3 DR inject behavior mismatches. |
| | test:sdr — `v-sdr` pattern contains a mid-group `(?i)` that JS `RegExp` rejects (Nuvio's engine accepts it); the test helper crashes. |
| | `audit-badges.mjs` — Windows libuv crash at `process.exit(1)` while a fetch is in flight. |

None of the failing tests import any file changed in this work (import chains verified).

**Post-fix state (after Phase 3):** `test:transparent` and `test:mono` now PASS (the expected filter count is derived from `MONO_GROUP_ORDER`/`MONO_FILTER_ORDER` instead of a hard-coded 125); `audit-badges.mjs` derives the count from the expected set, exits via `process.exitCode` (no more Windows libuv crash), and reports `OK: All three badge files have matching filters, patterns, HTTP icons`. Final suite: 29/29 targeted tests pass; the remaining 4 failures (`test:solid-icons`, `test:solid-dark-icons`, `test:dr`, `test:sdr`) are unchanged pre-existing artifact/engine differences (icon-host URL drift, missing generated PNGs, DR inject behavior, JS-vs-Nuvio regex acceptance) and are not defects in the shipped badges.

## 3. Marker system audit — OK

New read-only check: `node scripts/audit-marker-consistency.mjs`.

- 124 filters, 110 distinct marker tokens (patterns store markers as `\uXXXX` escape
  text; formatter.json stores real characters — decoded both sides).
- Every token emitted by formatter.json is matched by ≥1 badge pattern, and every badge
  token is emitted by the formatter (bidirectional coverage: OK).
- All 20 tier markers are owned 1:1; the 44 shared tokens are all intentional
  (unranked ↔ ranked exclusions via negative lookaheads, audio/visual combo atoms,
  resolution cross-exclusions, l-pt-br ↔ l-pt-pt, edition-bw ↔ hue).
- Solid / transparent / mono use identical marker sets.

## 4. Tier correctness vs live Vidhin — OK, 2 narrow generator defects

New read-only check: `node scripts/audit-tier-vidhin.mjs` (live data, cache fallback).

- **RSE gate coverage: OK.** All 20 live Vidhin tier rule names (Radarr/Sonarr
  Web T1–T3, UHD/HD Bluray T1–T3, Remux T1–T3, generic Web T1) are covered by the
  formatter's `stream.rseMatched::~` gates. `::~` comparisons are case-insensitive in
  AIOStreams (vendored `base.ts:933–936,1339`), so `~BluRay T1` / `~HD Bluray T1` /
  `~UHD BluRay T1` correctly match Vidhin's `Bluray` spelling.
- **RG drift: OK.** 0 groups would be added from live Vidhin (oracle already contains
  every live group, case-insensitively). 348 only-local groups exist — these come from
  the v1 cumulative list design (a group appears in every tier ≤ its rank) and are kept
  by add-only sync; strict mode would remove them per tier, and tiers with no Vidhin
  data (web-4..6, blu-ray-4..8) are skipped, never wiped.
- **Formatter gates vs oracle: OK.** All 170 expected group→tier pairs are emitted by
  formatter.json gates; 1 extra pair (`web-3|sigma`) traced to a real generator bug (below).
- **Tier depth**: Vidhin currently defines only Web/BluRay T1–T3 (plus Remux T1–T3).
  Badges web-4..6 and blu-ray-4..8 therefore have no upstream source and fire only from
  the local allowlists (RG fallback) — expected, by design. The old
  `docs/v2-tier-field-investigation.md` names (`Radarr Web T6`, `Radarr BluRay T8`) do
  not exist upstream.

### Defect D1 (P2, FIXED in Phase 3): case-variant group duplicates emit two tier badges

`buildReleaseGroupReplaceChain` (scripts/tier-inject-generator.mjs) dedups a release
group per source class using the **raw, case-sensitive** group string as map key.
The oracle contains `SIGMA` (web-2) and `SiGMA` (web-3) — same group, different casing —
so the generator emitted two gates (`::=SIGMA` and `::=SiGMA`) and, because `::=` is
case-insensitive, a non-RSE stream from group SiGMA received **both** the Web 2 and
Web 3 markers → both badges rendered. Impact: 1 group, only when the Vidhin RSE rules
are not loaded (the RG fallback path).

**Fix**: dedup keys are normalized (lowercase + unescape) in
`buildReleaseGroupReplaceChain`, and the emitted operand uses the winning tier's
unescaped raw name. `simulateTierInjectMarkers` (test oracle) now compares release
groups case-insensitively to match real `::=` semantics. Bonus correctness
improvement discovered by the same change: `sbR`/`SbR` (a cross-source case-variant
pair) is now emitted as quality-gated gates (`stream.quality::~WEB` / `~BluRay`)
instead of unconditional ones — previously a REMUX stream from sbR would have
received a spurious tier badge. After regeneration, the tier audit reports 0 extra /
0 missing pairs and all v2 tests pass.

### Defect D2 (P3, FIXED in Phase 3): escaped group variant creates a dead gate

Same fix: the escaped `D\-Z0N3` variant is unescaped before emission, so the dead
`stream.releaseGroup::=D\-Z0N3` gate no longer exists (formatter name shrank by the
dead bytes; overall name went 9,937 → 9,942 chars net after D1+D2).

### Finding F7 (INFO — action required by user): formatter budget

`formatter.json` name = 9,937 chars, description = 13,282 chars. AIOStreams' **default**
`maxFormatterTemplateLength` is **5000 characters per template**
(`.vendor/AIOStreams/packages/core/src/config/schema/user-limits.ts:66–72`, env
`MAX_FORMATTER_TEMPLATE_LENGTH`), enforced at config validation
(`db/schemas.ts:42–46`). The local pipeline assumes 16,000
(`scripts/formatter-layout.mjs:99`). **Your AIOStreams instance must run with
`MAX_FORMATTER_TEMPLATE_LENGTH` ≥ 16,000** — otherwise the formatter would be rejected
when saved. If you self-host, check the env; if you use a community host, ask whether
the limit is raised.

## 5. False-info audit & accuracy hardening (2026-08-02, second pass)

Re-audit for "can the badge system show FALSE stream info in Nuvio" — verified against
the real formatter engine (`.vendor/AIOStreams`, run via `test-v2-aiostreams-runtime.ts`)
and live Vidhin data.

### Key discovery: `::~` on arrays is element-EXACT, not substring

The engine lowercases the array elements and calls `Array.prototype.includes`
(base.ts:933–936, 1339). So `{stream.rseMatched::~Web T1}` only matches an rseMatched
element **literally equal** to `"Web T1"` — it never matches `"Radarr Web T1"` or
`"Anime Web T1"` (no substring). Consequences:

- **The RSE tier path was silently dead for real Vidhin rule names.** Only Vidhin's
  generic `Web T1` rule (APEX/FLUX/KiNGS/TOMMY) ever fired a tier gate; every
  `Radarr …` / `Sonarr …` match produced no marker, so tier badges came entirely from
  the releaseGroup fallback. Fixed with **exact per-name gates**:
  web-n → `Web Tn / Radarr Web Tn / Sonarr Web Tn`; blu-ray-n → `BluRay Tn / HD Bluray Tn /
  UHD BluRay Tn / Radarr UHD Bluray Tn / Radarr HD Bluray Tn / Sonarr HD Bluray Tn`;
  remux-n → `Remux Tn / Radarr Remux Tn / Sonarr Remux Tn` (one `::or::` gate per tier).
- **The earlier "F1 anime substring" finding was a false alarm** — `"Anime Web T1"`
  is never element-equal to `"Web T1"`, so anime rules cannot fire web-tier gates.
  No anime guard is needed (and none was added). Anime releases correctly get no
  movie-scale tier badge.

### Remaining real false-info vectors, all fixed

- **F2 — double tier badge on multi-match (CONFIRMED, fixed).** Live Vidhin has 17
  groups in 2+ tiers of the same source (BLUTONiUM/BYNDR/GNOME/TEPES/TOMMY in web-1+web-2,
  W4NK3R/PTer/NTb in blu-ray tiers, 6 remux groups in remux-2+remux-3). A BLUTONiUM
  release matches both `Radarr Web T1` and `Sonarr Web T2` → two markers → two badges.
  Fix: **best-wins exclusions in the badge patterns** (`V2_PATTERN_MARKER_EXCLUSIONS`:
  web-2..6 exclude better web tiers, blu-ray-2..8 exclude better blu-ray tiers,
  remux-2..3 exclude better remux tiers) — same mechanism the unranked badges already
  used. The formatter emits every matched tier's marker; only the best badge renders.
- **F2b — RG fallback firing alongside RSE (fixed).** All 48 releaseGroup gates are
  now guarded with `stream.rseMatched::length::=0` so the fallback only fires when no
  ranked expression matched (previously a stale list could emit a different tier marker
  than the RSE match). Comparators evaluate strictly left-to-right (base.ts:690–725),
  so the guard is appended **after** the OR-chain — flat chains only, because nested
  conditionals break the parser (its check regex is quote-blind; a nested `["M"||""]`
  is captured as the outer check — caught by the real-engine runtime test).
- **F3 — RG gates without quality context (fixed).** 9 plain gates (web-1/2/3,
  blu-ray-1/2/3, remux-1/2/3 allowlists) emitted tier markers for any stream carrying
  the group, regardless of source. They now carry their source's quality condition
  (`~WEB` / `~BluRay` / `~REMUX`), blu-ray additionally excludes `~REMUX::isfalse`
  (a remux must not badge as a blu-ray tier). The 39 ambiguous (cross-source) gates
  got the same REMUX exclusion for their blu-ray arms. The blu-ray **unranked** gate
  also excludes REMUX now (a "Bluray REMUX" release previously showed both
  BLU-RAY Unranked and REMUX Unranked).

### Attempted but not possible on this AIOStreams version

- `metadata.isAnime` is **not exposed** to the formatter in this version (the
  `metadata` block in base.ts:563–571 has only queryType/title/runtime/episodeRuntime/
  genres/year), so anime requests cannot be guarded on the RG path. Residual risk:
  in RG-only mode (no RSE rules loaded), an anime release whose group sits in the
  legacy allowlists and in no anime rule could still badge a movie-scale tier. With
  RSE rules loaded (recommended) anime groups match anime rules → rseMatched non-empty
  → the RG guard suppresses it. Documented, not fixable in the formatter today.
- `::in('a','b')` conditional is not implemented in this version — the compact
  in-list form is unavailable.

### Limit note

The formatter name is now 14,438 chars (headroom 1,562) and description 13,282
(headroom 2,718) against the self-hosted `MAX_FORMATTER_TEMPLATE_LENGTH = 16,000`.
The project's earlier "10k preview compile limit" assertions were removed — no 10k
limit exists in the AIOStreams server source (verified); the tests now assert against
the configured 16,000. A group-heavy future Vidhin sync may exhaust the 1,562-char
headroom; the sync helper surfaces that loudly as a regeneration error.

### Verified end-state

- Real-engine runtime suite: 21 fixtures pass, no template leaks, correct badge sets.
- 29/29 test scripts pass; both audit scripts report OK
  ("every Vidhin tier rule name is covered by an exact RSE gate",
  "all 170 oracle group→tier pairs are emitted by formatter gates").
- New tier test cases: RSE multi-match best-wins, anime-rule no-fire, RG remux group
  on WEB quality, anime request legacy-list suppression, Bluray-REMUX unranked.
- Badge JSONs regenerated: only the tier badge patterns changed (best-wins
  exclusions); all other 104 patterns byte-identical.

## 6. References (research, this session)

- AIOStreams formatter docs: https://docs.aiostreams.viren070.me/reference/custom-formatter
  (fields, syntax, `::`-modifiers, 5-level branch nesting); scored-sorting guide links
  Vidhin's Releases-Regex as the RSE example.
- AIOStreams source (vendored locally at `.vendor/AIOStreams/`): `base.ts` (comparison
  semantics), `user-limits.ts`/`schemas.ts` (5000 default).
- Nuvio badges: NuvioMedia client apps (github.com/NuvioMedia); the community badge pack
  is **kingsizew/badges** (cached at `.cache/kingsizew-badges/` — README, badge.json,
  nuvio-formatter.json, badge-images). Badge JSON = `groups[]` + `filters[]` with
  `pattern` regex matched against stream filenames/metadata/description; import via raw
  JSON URL in Nuvio settings. “Fusion” is the name of Nuvio's badge feature, not a
  separate repo (github.com/Fusion-Project/badges does not exist).
- Tamtaro: github.com/Tam-Taro/SEL-Filtering-and-Sorting (SEL/ESE templates for
  AIOStreams, `TEMPLATE_URLS` sync, `https://git.tamtaro.de/complete.json`, AIOMetadata
  configs). No Nuvio-badge templates in Tam's repos — badges are a separate ecosystem
  (kingsizew pack, this project).
- Vidhin: github.com/Vidhin05/Releases-Regex — `English/regexes.json` (174 rules),
  `all-templates.json`, German variants; tier names `Radarr/Sonarr Web T1–T3`,
  `Radarr UHD/HD Bluray T1–T3`, `Radarr/Sonarr Remux T1–T3`, generic `Web T1`,
  plus Anime BD/Web tiers and Asian tiers (not used by this badge set).

## 7. Files changed in this work

- `scripts/tier-group-sync.mjs` — sync target = v1 oracle; `regenerateFormatterAfterTierSync()`; result fields `formatterRegenerated`/`formatterOutput`.
- `scripts/patch-formatter.mjs` — stale v1 RSE-presence check (`rseMatched::exists` → `stream.rseMatched::~`).
- `scripts/audit-badges.mjs` — Vidhin dry-run now checks the oracle (new default).
- `scripts/sync-server.mjs` — `/api/formatter-json`, status fields, reveal→formatter.json, regenerate wiring.
- `sync-ui/app.js`, `sync-ui/index.html` — messaging/copy actions for the new pipeline.
- `scripts/test-tier-group-sync.mjs` — 9 new assertions (oracle target, write path, unranked rebuild, strict protection).
- `scripts/audit-marker-consistency.mjs`, `scripts/audit-tier-vidhin.mjs` — new read-only audits.
- `scripts/tier-inject-generator.mjs` — Phase 3: case-insensitive + unescape normalization in `buildReleaseGroupReplaceChain` (fixes D1/D2, sbR quality-gating) and `simulateTierInjectMarkers`.
- `scripts/test-transparent-theme.mjs`, `scripts/test-mono-theme.mjs` — expected filter count derived from `MONO_GROUP_ORDER`/`MONO_FILTER_ORDER` (was hard-coded 125).
- `scripts/audit-badges.mjs` — count derived from expected set; `process.exitCode` instead of `process.exit(1)` (Windows libuv crash).
- **Accuracy pass (section 5):**
- `scripts/tier-inject-generator.mjs` — exact per-name RSE gates (`tierRseRuleNames` returns every real Vidhin name form; `buildRseGates` emits one `::or::` gate per tier); RG fallback gates guarded with `stream.rseMatched::length::=0` (appended after the OR-chain — left-to-right comparator semantics) + source-quality conditions (`~WEB`/`~BluRay`/`~REMUX`, blu-ray excludes `~REMUX::isfalse`); blu-ray unranked gate excludes REMUX; `simulateTierInjectMarkers` mirrors exact-element + quality semantics.
- `scripts/formatter-markers.mjs` — best-wins tier exclusions in `V2_PATTERN_MARKER_EXCLUSIONS` (web-2..6, blu-ray-2..8, remux-2..3 exclude better same-source tiers).
- `scripts/test-formatter-aiostreams-syntax.mjs` — 10k "preview" assertions replaced with the configured `FORMATTER_MAX_LENGTH` (16,000; no 10k limit exists in the AIOStreams server source).
- `scripts/test-v2-tiers.mjs` — 6 new accuracy cases (multi-match best-wins, anime no-fire, RG quality guard, anime legacy-list, Bluray-REMUX unranked); rseMatched fixtures now arrays (real shape).
- `scripts/audit-tier-vidhin.mjs` — RSE coverage check is now exact-element (matches the engine's `~` on arrays).
- `scripts/audit-marker-consistency.mjs` — tier patterns' better-tier exclusions validated against `V2_PATTERN_MARKER_EXCLUSIONS` instead of flagged as unexpected.
- `formatter.json`, `formatter-export-{name,description}.txt` — regenerated (name 14,438).
- `nosvasedis-badges-{solid,transparent,mono}.json` — regenerated; only tier badge patterns changed (best-wins exclusions).
