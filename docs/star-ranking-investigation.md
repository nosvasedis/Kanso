# Star ranking investigation — is ☆☆☆☆☆ normal?

Date: investigation completed · Scope: formatter.json / nosvasedis badge packs / Nuvio display /
AIOStreams engine (vendored `.vendor/AIOStreams`) + live ecosystem docs.

---

## 1. TL;DR answer

**Yes — five empty stars (☆☆☆☆☆) on most streams is NORMAL, expected behavior, not a bug in
your formatter or badges.** The five stars are **not** a movie/quality rating and they are
**not** computed by Nuvio. They are a glyph rendering of AIOStreams' **normalized "Stream
Expression" score** (`nSeScore`, 0–100), which is only meaningful when (a) you have
**Ranked Stream Expressions** (e.g. Vidhin's Releases-Regex `expressions.json`) loaded with
scores, and (b) the stream matched at least one such rule with a score large enough to
survive per-request normalization against the **best-scoring stream in that same result set**.

For an anime request (Vinland Saga S01E01), the anime scoring ladder is low (100–600) while
the top of the set (e.g. SeaDex Best = 2000, Anime BD T1 = 1400, a TrueHD+Atmos audio bonus =
5000) is far higher, so most streams normalize to `<20` → `☆☆☆☆☆`. Only the top few streams
of each request get filled stars. Your "Tier 1 / Netflix" badges come from **different
fields** and can legitimately appear on a 0-score stream.

---

## 2. What the stars actually are (engine-verified, vendored source)

Path traced in `.vendor/AIOStreams/packages/core/src`:

| Step | Location | Behavior |
|---|---|---|
| 1. No ranked rules configured | `streams/precomputer.ts:154–159` | scoring skipped entirely |
| 2. Score init | `precomputer.ts:167–171` | every stream: `streamExpressionScore = 0` |
| 3. Score accumulation | `precomputer.ts:173–204` | each enabled Ranked Stream Expression adds its score (may be negative); rule names → `rankedStreamExpressionsMatched` |
| 4. Normalization denominator | `streams/context.ts:618–627` | `maxSeScore = max(streamExpressionScore)` **across the request's result set** (undefined if none > 0) |
| 5. nSeScore | `formatters/base.ts:539–554` | `null` when score/maxSeScore missing or `maxSeScore ≤ 0`; else `clamp(round(score/maxSeScore*100), 0, 100)` |
| 6. pstar | `base.ts:1257–1273` | `★`×`floor(v/20)` + `⯪` if `v%20 ≥ 10`, padded to 5 with `☆` |
| 7. exists gate | `base.ts:1320–1327` | `0` is "existing"; `null`/`undefined` is not |
| 8. Formatter block | `formatter.json` name | `{stream.nSeScore::exists["{stream.nSeScore::pstar::replace('⯪','☆')}"||""]}` |

Resulting glyph mapping (empirically confirmed by `scripts/investigate-star-matrix.ts`):

| nSeScore | Nuvio display |
|---|---|
| `null` (no scoring active / nothing scored > 0 in the set) | **no stars at all** |
| 0–19 | ☆☆☆☆☆ |
| 20–39 | ★☆☆☆☆ |
| 40–59 | ★★☆☆☆ |
| 60–79 | ★★★☆☆ |
| 80–99 | ★★★★☆ |
| 100 | ★★★★★ |

So `☆☆☆☆☆` means: **nSeScore exists and is 0–19** — i.e. the stream scored, but less than
~20% of the best stream in the same request. It does **not** mean "bad quality".

---

## 3. Why most Vinland Saga S01E01 streams show ☆☆☆☆☆

1. **Anime requests use a separate, low scoring ladder.** AIOStreams sets
   `queryType = "anime.series"` for anime (context.ts), and Vidhin's expressions gate the
   generic Sonarr/Radarr Web/BluRay rules (1700–1900) on `queryType == 'series'`, so an anime
   stream can only score from the anime ladder: Anime Web T1–T6 = **600/500/400/300/200/100**,
   Anime BD T1–T8 = 1400–700, SeaDex Best/Alt = **2000/1750** (Vidhin `English/expressions.json`).
2. **Normalization is relative to the request's max.** A request containing a SeaDex Best
   (2000): Anime Web T1 (600) → `nSeScore 30` → ~1.5★; Anime Web T4 (300) → `15` → ~0★;
   unmatched (0) → `0` → ☆☆☆☆☆. Any stream below ~20% of the max renders ☆☆☆☆☆ in Nuvio.
3. **Streams with no matched rule score 0.** Debrid-cached or obscure releases that match no
   anime rule get `0` → ☆☆☆☆☆ (as long as at least one stream in the set scored > 0, which is
   almost always true).
4. **Nuvio does not compute anything.** Nuvio (github.com/NuvioMedia) is a Stremio-compatible
   *client*; it displays the name AIOStreams produced and matches badge regexes against it.
   There is no independent Nuvio "ranking" that could fill the stars.

---

## 4. Badge independence — "Tier 1 + Netflix + ☆☆☆☆☆" is a consistent combination

| Badge family | Input field | Independent of score? |
|---|---|---|
| Tier badges (web-1…, blu-ray-…, remux-…) | `stream.rseMatched` names (marker `\u180c\u200e\u200f\u206f` etc., `nosvasedis-badges-solid.json:400`) or `releaseGroup` fallback gated by `rseMatched::length::=0` | **Yes** — a matched rule's *name* badges regardless of its *score*; Vidhin even uses score-0 regex "tags" (scored-sorting docs). RG-fallback fires when NO rule matched → score 0 → ☆☆☆☆☆. |
| Network badges (NETFLIX, PRIME…) | `stream.network` ← `parsedFile.network` (filename parsing, `base.ts:534`) | **Yes** — Vidhin's Netflix rule scores **0 for movies / 75 for series**; the badge says nothing about the score. |
| Quality/visual/audio/resolution/language | `parsedFile.*` fields | **Yes** |
| Quality-rank badges (q-br/q-bb/q-bw, q-g*, q-o*) | **the star glyphs themselves** + source text (`quality-rank-patterns.mjs:16–20,111–120`) | **No** — the only family coupled to the stars (see §6). |
| Gray release pills (q-r/q-b/q-w/q-wr) | filename quality text, suppressed when any 5-glyph star run present | Partially (exclusion only) |

---

## 5. Config checks — when it is NOT just "normal"

The behavior is by-design, but these configuration gaps produce the same empty stars and are
fixable:

1. **No Ranked Stream Expressions loaded** → `seScore` stays 0 → `nSeScore` null → **no stars
   at all** (your case shows ☆☆☆☆☆, so scoring IS active — but check anyway).
2. **Ranked rules loaded but the "Stream Expression Score" is missing from Sorting**
   (Vidhin README: *"Requires Stream Expression Score in sort (not Regex)"*). Sorting doesn't
   change nSeScore, but it changes which streams top the set.
3. **Synced rule URLs silently failed to load** (known failure mode, AIOStreams issue #707;
   selfhosters need `SEL_SYNC_ACCESS=all` / `REGEX_FILTER_ACCESS=all` per Tamtaro's README).
4. **Formatter-context bug** (upstream PR #974, fixed 2026-05-23): if the streams list isn't
   passed to the formatter context, nSeScore/nRegexScore return **null** → no stars at all.

Your stars ARE present-but-empty, which means none of the "null" paths apply — it is the
"scored low relative to the set" case.

---

## 6. Correction to this project's prior docs

`docs/badge-audit-report.md` §6 stated *" 'Fusion' is the name of Nuvio's badge feature, not a
separate repo (github.com/Fusion-Project/badges does not exist)"*. **That claim is refuted by
the online investigation:** Fusion is a separate media-center app ("Fusion - Media Center on
Apple Devices"; its repo github.com/42degrees/fusion is currently 404). Nuvio's UI labels
imported regex badge packs as "Fusion badges" because both apps share the same badge JSON
format (evidence: NuvioMobile issues #1658/#1617, NuvioWeb #157/#252/#568,
tenhobi/fusion-settings). The badge format itself (groups[] + filters[] with pattern regexes,
e.g. kingsizew/badges) is unchanged by this correction.

---

## 7. Real UX wart (confirmed) + optional fixes

### 7.1 The wart: the "OK" rank badge fires on unscored streams

`RANK_VISIBLE.ok` = `(?:★★☆☆☆|★☆☆☆☆|☆☆☆☆☆)` (`scripts/quality-rank-patterns.mjs:19`), and
the quality-rank badge patterns (`q-or`, `q-ob`, `q-ow`, …) require those glyphs + the source
text. Empirically confirmed with the real engine (`scripts/investigate-star-matrix.ts`):

- `NF WEB-DL, no RSE, score 0` → ☆☆☆☆☆ + **q-ow ("OK" web)**
- `REMUX 2160p FLUX, score 0` → ☆☆☆☆☆ + **q-or ("OK" remux)** — a top-quality 4K remux
  from a Tier-1 release group badges as "OK" merely because its SE score is 0.

The stars are a **score rank** (relative to the request's best), but the badges present them
as a **quality rank**. Every unscored / low-scored stream — including premium remuxes — is
labeled "OK".

### 7.2 Optional fixes (none applied — pick with your go-ahead)

| # | Fix | Effect | Trade-off |
|---|---|---|---|
| F1 | Gate stars behind `nSeScore::>=20` (or `::>=10`) instead of `::exists` | 0-score streams show **no stars** (community templates use this, e.g. AIOStreams issue #707) | q-o* badges vanish entirely (they need star glyphs) — "OK" concept disappears unless remapped |
| F2 | Redefine the OK band: exclude `☆☆☆☆☆` from `RANK_VISIBLE.ok` (ok = `★★☆☆☆\|★☆☆☆☆` only) | unscored streams get **no rank badge** (gray pills still show source); 1–2★ streams stay "OK" | "OK" still conflates score-rank with quality for 1–2★ remuxes |
| F3 | Show the raw score in the description: `{stream.seScore::>0[" · {stream.seScore} pts"||""]}` | users see the actual score behind the stars (Tamtaro's formatter does this) | more description length; budget headroom is 1,562 chars |
| F4 | Add anime-tier badges (Vidhin Anime Web/BD/Remux tiers) to the pack | anime streams get real tier badges instead of none (currently `Anime Web T1` matches → rseMatched non-empty → web-unranked is suppressed → no tier badge) | new badge assets + patterns; tier sync needs the anime rule names |
| F5 | No change; document semantics | truthful; keeps current look | "OK" badge stays misleading on remuxes |

Recommended default if you want a fix: **F2** (smallest, keeps the badge ecosystem intact,
stops calling premium remuxes "OK") optionally combined with **F3** for transparency.
