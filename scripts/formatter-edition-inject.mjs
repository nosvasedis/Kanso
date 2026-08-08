/**
 * Invisible haystack markers for edition badges (like SeaDex / streaming).
 */
import { EDITION_DC_MARKER, EDITION_EXT_MARKER } from "./edition-badge-patterns.mjs";
import { DC_HIT, EXT_HIT } from "./formatter-editions.mjs";

/**
 * DC + EXT only — saves formatter space for DR inject + stats row.
 * True-Hue / COLORIZED / B&W: badge filename patterns (Spider-Noir etc.), no inject markers.
 */
export const FORMATTER_EDITION_INJECT =
  `{${DC_HIT}["${EDITION_DC_MARKER}"||""]}` +
  `{${EXT_HIT}["${EDITION_EXT_MARKER}"||""]}`;
