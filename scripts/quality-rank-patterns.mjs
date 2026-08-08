/**
 * Quality-rank markers for Nuvio Best/Good/OK combo badges.
 * Title shows visible pstar glyphs (★★★★☆); badge regex matches those bands in haystack.
 */
import {
  BAD_RELEASE_FILTER_PATTERNS,
  BAD_SOURCE_LOOKAHEAD,
} from "./bad-source-patterns.mjs";

export const RANK_BEST = "♛";

/** Nuvio cannot render pstar half-star (⯪) — show an empty star instead. */
export const PSTAR_NUVIO_SAFE = "::replace('⯪','☆')";

/** Visible rank bands on formatter title (must match qualityRankPattern). */
export const RANK_VISIBLE = {
  best: "★★★★★",
  good: "(?:★★★★☆|★★★☆☆)",
  ok: "(?:★★☆☆☆|★☆☆☆☆)",
};

/**
 * nSeScore threshold that renders at least one filled star (pstar: value/20).
 * Scores below this (0-19, incl. null/no SE scoring) emit NO star glyphs, so
 * unscored streams get no empty ☆☆☆☆☆ row and fall back to the gray release pill.
 */
export const RANK_MIN_SCORE = 20;

/** Any 5-glyph pstar rating from formatter title. */
export const RANK_STAR_ANY = "(?:[★☆]{5})";

/** @deprecated use RANK_STAR_ANY */
export const RANK_DIAMOND_ANY = RANK_STAR_ANY;

/** @deprecated Invisible marker approach removed — Nuvio matches filename separately. */
export const RELEASE_MARKER = "\u206F";
/** @deprecated */
export const UNRANKED_RELEASE_MARKER = RELEASE_MARKER;

/** @deprecated Invisible markers — use RANK_VISIBLE + title-only nSeScore. */
export const RANK_BEST_MARKER = "\u2060\u2060\u2060";
/** @deprecated */
export const RANK_GOOD_MARKER = "\u2062\u2062";
/** @deprecated */
export const RANK_OK_MARKER = "\u2064";

/** ZWSP + ZWNJ + ZWJ — invisible SeaDex haystack. */
export const SEADEX_MARKER = "\u200B\u200C\u200D";

/** Web rank combos: WebDL or WebRip (aligned with q-w / q-wr release badge naming). */
export const WEB_RANK_SOURCE =
  "(?:web[-_. ]?dl|webdl|webrip|\\bweb[-_. ]?rip\\b)(?!.*\\bweb[-_. ]?dl\\b)";

const SOURCE = {
  remux: "remux",
  bluray: "(?:bluray|blu-ray)",
  webdl: WEB_RANK_SOURCE,
};

/** Visible rank on formatter title — ★/☆ only (Nuvio-safe); spacing from transport trailing space. */
export const FORMATTER_RANK_STARS =
  `{stream.nSeScore::>=${RANK_MIN_SCORE}["{stream.nSeScore::pstar${PSTAR_NUVIO_SAFE}}"||""]}`;

/** @deprecated */
export const FORMATTER_RANK_DIAMONDS = FORMATTER_RANK_STARS;
/** @deprecated */
export const FORMATTER_RANK_HAYSTACK = "";
/** @deprecated */
export const RANK_DIAMOND_LADDER = {};

/** Hidden haystack for Nuvio seadex-release badge (API tags, not filename). */
export const FORMATTER_SEADEX_INJECT =
  `{stream.seadexBest::istrue::or::stream.seadex::istrue["${SEADEX_MARKER}"||""]}`;

/** Dot-all span for lookaheads — must not start with `[` after `(?![` in templates. */
const ANY = "(?:[\\s\\S]*)";

/**
 * Gray release pills (q-r/q-b/q-w/q-wr): filename-style match like tiers / Fusion tags.
 * Star exclusion suppresses gray when the same haystack includes title rank glyphs.
 */
const WEBRIP_BODY = "(?:\\bwebrip\\b|\\bweb[-_. ]?rip\\b)";
const NO_BAD_SOURCE = `(?![\\s\\S]*${BAD_SOURCE_LOOKAHEAD})`;

/** @param {"q-r"|"q-b"|"q-w"|"q-wr"|"q-cam"|"q-hdtv"} id */
export function releaseFilterPattern(id) {
  if (id === "q-cam" || id === "q-hdtv") {
    return BAD_RELEASE_FILTER_PATTERNS[id];
  }
  const body = {
    "q-r": "(?:\\b|(?<=hd))remux\\b",
    "q-b": "\\b(?:bluray|blu-ray)\\b",
    "q-w": "\\b(?:web[-_. ]?dl|webdl)\\b(?!.*rip)",
    "q-wr": WEBRIP_BODY,
  }[id];
  const blurayNoRemux = id === "q-b" ? "(?![\\s\\S]*remux)" : "";
  const noRankInHaystack = `(?![\\s\\S]*${RANK_STAR_ANY})`;
  const badSourceBlock = id === "q-wr" ? NO_BAD_SOURCE : "";
  return `(?i)^(?=${ANY}${body})${blurayNoRemux}${badSourceBlock}${noRankInHaystack}`;
}

/** @deprecated use releaseFilterPattern */
export const unrankedReleasePattern = releaseFilterPattern;

export const RELEASE_FILTER_PATTERNS = {
  "q-r": releaseFilterPattern("q-r"),
  "q-b": releaseFilterPattern("q-b"),
  "q-w": releaseFilterPattern("q-w"),
  "q-wr": releaseFilterPattern("q-wr"),
  "q-cam": releaseFilterPattern("q-cam"),
  "q-hdtv": releaseFilterPattern("q-hdtv"),
};

/** @deprecated */
export const RELEASE_UNRANKED_PATTERNS = RELEASE_FILTER_PATTERNS;

/** @param {"best"|"good"|"ok"} tier @param {"remux"|"bluray"|"webdl"} source */
export function qualityRankPattern(tier, source) {
  const mark =
    tier === "best" ? RANK_VISIBLE.best : tier === "good" ? RANK_VISIBLE.good : RANK_VISIBLE.ok;
  const src = SOURCE[source];
  const noBadSource = `(?![\\s\\S]*${BAD_SOURCE_LOOKAHEAD})`;
  if (source === "bluray") {
    return `(?i)^(?=${ANY}${mark})(?=${ANY}${src})${noBadSource}(?!${ANY}remux)`;
  }
  return `(?i)^(?=${ANY}${mark})(?=${ANY}${src})${noBadSource}`;
}

export const QUALITY_RANK_PATTERNS = {
  "q-br": qualityRankPattern("best", "remux"),
  "q-bb": qualityRankPattern("best", "bluray"),
  "q-bw": qualityRankPattern("best", "webdl"),
  "q-gr": qualityRankPattern("good", "remux"),
  "q-gb": qualityRankPattern("good", "bluray"),
  "q-gw": qualityRankPattern("good", "webdl"),
  "q-or": qualityRankPattern("ok", "remux"),
  "q-ob": qualityRankPattern("ok", "bluray"),
  "q-ow": qualityRankPattern("ok", "webdl"),
};
