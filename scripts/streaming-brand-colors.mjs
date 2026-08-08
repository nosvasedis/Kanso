/**
 * Streaming service brand colors for solid fill + transparent/mono stroke.
 *
 * Nuvio badge JSON allows one tagColor and one borderColor per filter — no
 * gradient or multicolor stroke. Services with prism / fan logos use the best
 * single representative hex (see STREAMING_BRAND_NOTES).
 *
 * Sources: Netflix #E50914; Prime #00A8E1 (blue-leaning cerulean); Disney+ #00C7DC
 * (gradient cyan/turquoise from brand ref — greener than Prime); Paramount #0050D0
 * (navy blue, not cyan); Max, Hulu, etc.
 */

/** @type {Record<string, string>} id → 6-digit RGB (no #) */
export const STREAMING_BRAND_RGB = {
  "s-nflx": "E50914",
  /** Amazon Prime Video logo / smile — official #00A8E1 (not Disney/Paramount navy). */
  "s-amzn": "00A8E1",
  "s-atvp": "000000",
  /** Disney+ icon gradient cyan (turquoise; not Prime blue or Paramount navy). */
  "s-dsnp": "00C7DC",
  "s-hmax": "B100FF",
  "s-hulu": "1CE783",
  /** Paramount+ blue — deeper than old #0064FF, farther from Disney #0063E5. */
  "s-pamp": "0050D0",
  "s-pcok": "FFB81C",
  "s-croll": "F47521",
};

/** Human-readable notes for multicolor logos (docs / UI). */
export const STREAMING_BRAND_NOTES = {
  "s-atvp":
    "Apple TV (2025) uses a glass-prism violet→red spectrum; Nuvio cannot do a rainbow stroke — using #000000.",
  "s-pcok":
    "Peacock fan six dots (cyan/blue/green overlap Prime & Disney+); Nuvio one color — fan gold #FFB81C.",
};

/** @param {string} streamingId e.g. s-nflx */
export function streamingBrandRgb6(streamingId) {
  const rgb = STREAMING_BRAND_RGB[streamingId];
  if (!rgb) throw new Error(`Unknown streaming id: ${streamingId}`);
  return rgb.toUpperCase();
}

/** @param {string} streamingId @returns {string} #AARRGGBB for mono border */
export function streamingBrandStroke(streamingId) {
  return `#FF${streamingBrandRgb6(streamingId)}`;
}
