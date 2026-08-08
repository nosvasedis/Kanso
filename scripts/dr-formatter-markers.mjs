/**
 * Invisible DR haystack markers for formatter inject → gv badge matching.
 *
 * Namespace (do not reuse):
 * - SeaDex: U+200B–U+200D
 * - Streaming: U+2060 + U+2061–U+2069
 * - Editions: U+206A–U+206D
 * - DR: U+206E + U+2061–U+2064 (do not match standalone U+206E — collides with gst THTR if used)
 */

export const DR_DV_MARKER = "\u206E\u2061";
export const DR_HDR10P_MARKER = "\u206E\u2062";
export const DR_HDR_MARKER = "\u206E\u2063";

/** Injected DR markers — for collision / inject coverage tests. */
export const DR_ALL_MARKERS = [DR_DV_MARKER, DR_HDR10P_MARKER, DR_HDR_MARKER];
