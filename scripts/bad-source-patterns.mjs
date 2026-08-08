/**
 * CAM / HDTV release patterns (grl gray pills) + shared lookahead for combo suppress.
 */
import { TOK } from "./dv-combo-patterns.mjs";

const ANY = "(?:[\\s\\S]*)";

/** Token-bounded bad-source signals (TRaSH-aligned). */
export const CAM_BODY =
  "(?:\\bhdcam\\b|\\bcamrip\\b|\\btelesync\\b|\\btelecine\\b|\\bhdts\\b|\\bdvdscr\\b|" +
  `(?:^|${TOK})cam(?:${TOK}|$)|(?:^|${TOK})ts(?:${TOK}|$)|(?:^|${TOK})tc(?:${TOK}|$)|(?:^|${TOK})scr(?:${TOK}|$))`;

/** HDTV / TV rip — exclude web-dl context for hdrip. */
export const HDTV_BODY =
  `(?:\\bhdtv\\b|\\bpdtv\\b|\\bsdtv\\b|\\btvrip\\b|(?<!web[-_. ]?)(?:^|${TOK})hdrip(?:${TOK}|$))`;

/** Lookahead body for combo / WebRip suppression. */
export const BAD_SOURCE_LOOKAHEAD = `(?:${CAM_BODY}|${HDTV_BODY})`;

/**
 * CAM/HDTV gray release pills — no star exclusion (show even when N★ present).
 * @param {"q-cam"|"q-hdtv"} id
 */
export function badReleaseFilterPattern(id) {
  const body = id === "q-cam" ? CAM_BODY : HDTV_BODY;
  return `(?i)^(?=${ANY}${body})`;
}

export const BAD_RELEASE_FILTER_PATTERNS = {
  "q-cam": badReleaseFilterPattern("q-cam"),
  "q-hdtv": badReleaseFilterPattern("q-hdtv"),
};
