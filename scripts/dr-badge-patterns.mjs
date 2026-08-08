/**
 * DR marker regex fragments for badge pattern merge.
 */
import {
  DR_ALL_MARKERS,
  DR_DV_MARKER,
  DR_HDR10P_MARKER,
  DR_HDR_MARKER,
} from "./dr-formatter-markers.mjs";

/** @param {string} marker one or more code units */
export function drMarkerRegex(marker) {
  return [...marker]
    .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)
    .join("");
}

export const DR_MARKER_ALT = {
  dv: drMarkerRegex(DR_DV_MARKER),
  hdr10p: drMarkerRegex(DR_HDR10P_MARKER),
  hdr: drMarkerRegex(DR_HDR_MARKER),
};

/** Alternation of all DR inject markers. */
export const DR_MARKER_ANY = DR_ALL_MARKERS.map(drMarkerRegex).join("|");
