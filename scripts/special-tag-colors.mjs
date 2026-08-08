/**
 * Per-badge hues for kingsizew-era special tags (gst).
 * SEADEX, DC, EXT, B&W, and TRUE-HUE keep legacy colors in theme modules.
 */

/** @type {Record<string, string>} filter id -> 6-digit RRGGBB */
export const NEW_SPECIAL_TAG_RGB6 = {
  "hybrid-release": "00838F",
  "criterion-collection": "C62828",
  "proper-release": "1976D2",
  "repack-release": "F9A825",
  "remastered-release": "7B1FA2",
  "open-matte-edition": "6D4C41",
  "regraded-release": "D81B60",
  "uncut-edition": "558B2F",
  "uncensored-edition": "EF6C00",
  "edition-theatrical": "283593",
};

export const NEW_SPECIAL_TAG_IDS = Object.freeze(Object.keys(NEW_SPECIAL_TAG_RGB6));

/** @param {string} id @returns {string | null} */
export function specialTagRgb6(id) {
  return NEW_SPECIAL_TAG_RGB6[id] ?? null;
}

/** Transparent / mono stroke — #AARRGGBB */
export function specialTagStroke(id) {
  const rgb6 = specialTagRgb6(id);
  return rgb6 ? `#FF${rgb6}` : null;
}
