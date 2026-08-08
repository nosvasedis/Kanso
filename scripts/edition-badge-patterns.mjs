/**
 * Edition badges — presentation cuts + common scene editions.
 * Invisible markers in formatter haystack; badges also match filename / parsed editions.
 */

/** Must not overlap SEADEX (U+200B–D) or streaming (U+2060–69). */
export const EDITION_DC_MARKER = "\u206C";
export const EDITION_EXT_MARKER = "\u206D";
export const EDITION_HUE_MARKER = "\u206A";
export const EDITION_BW_MARKER = "\u206B";

function markerRegex(marker) {
  return [...marker]
    .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)
    .join("");
}

const DC_TOKENS = "Director'?s?[\\s._-]?Cut|Director\\.Cut|DIRCUT";

const EXT_TOKENS =
  "Extended(?:[\\s._-]?(?:Cut|Edition))?|EXT[\\s._-]?CUT";

const HUE_TRUE_TOKENS =
  "True[\\s._-]?Hue(?:[\\s._-]?(?:Full[\\s._-]?)?Color)?|True\\.Hue";

/** Scene tag for True-Hue colorized cuts (e.g. Spider-Noir `.COLORIZED.`). */
const HUE_COLORIZED_TOKEN = "COLORIZED";

/** Standalone color-edition tag (e.g. `.Full.Color.` without `True-Hue` in the name). */
const HUE_FULL_COLOR_TOKEN = "Full[\\s._-]?Color";

/** Word-bounded hue tokens (badge + BW negative lookahead). */
export const HUE_WORD_BOUNDED =
  `${HUE_TRUE_TOKENS}|${HUE_COLORIZED_TOKEN}|${HUE_FULL_COLOR_TOKEN}`;

const BW_AUTHENTIC_TOKENS =
  "Authentic[\\s._-]?(?:BW|Black(?:[\\s._-]?(?:and|&)[\\s._-]?White)?)|Authentic\\.BW";

const BW_BLACK_TOKENS = "Black[\\s._-]?(?:and|&)[\\s._-]?White";

/**
 * Scene `.BW.` token — separators are dot/space/underscore only (not hyphen),
 * so release-group suffixes like `GROUP-BW` do not match.
 */
export const BW_DOT_TOKEN = "(?:[\\s._]|^)BW(?:[\\s._]|$)";

/**
 * Scene `B&W` token — same separator rules as `.BW.` (not `GROUP-BW`).
 */
export const BW_AMP_TOKEN = "(?:[\\s._]|^)B\\s*[&＆]\\s*W(?:[\\s._]|$)";

export const BW_WORD_BOUNDED = `${BW_AUTHENTIC_TOKENS}|${BW_BLACK_TOKENS}`;

export const EDITION_DC_BADGE_PATTERN = `(?i)(?:${markerRegex(
  EDITION_DC_MARKER
)}|\\b${DC_TOKENS}\\b)`;

export const EDITION_EXT_BADGE_PATTERN =
  `(?i)(?!.*\\bExtended\\s+Clip\\b)(?!.*\\bExtended[\\s._-]+Mix\\b)(?:${markerRegex(
    EDITION_EXT_MARKER
  )}|\\b${EXT_TOKENS}\\b)`;

export const EDITION_HUE_BADGE_PATTERN = `(?i)(?:${markerRegex(
  EDITION_HUE_MARKER
)}|\\b(?:${HUE_WORD_BOUNDED})\\b)`;

/** Hue wins when both could match a noisy title. */
export const EDITION_BW_BADGE_PATTERN = `(?i)(?!.*\\b(?:${HUE_WORD_BOUNDED})\\b)(?:${markerRegex(
  EDITION_BW_MARKER
)}|\\b(?:${BW_WORD_BOUNDED})\\b|${BW_DOT_TOKEN}|${BW_AMP_TOKEN})`;
