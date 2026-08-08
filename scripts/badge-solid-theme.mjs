/**
 * Solid badge theme — opaque Nuvio fills (6-digit tagColor) + border (8-digit).
 */
import { streamingBrandRgb6 } from "./streaming-brand-colors.mjs";
import { RELEASE_FILTER_IDS } from "./badge-transparent-theme.mjs";
import { specialTagRgb6 } from "./special-tag-colors.mjs";

export const SOLID_TAG_STYLE = "filled";
export const SOLID_TEXT_LIGHT = "#FFFFFF";
export const SOLID_TEXT_DARK = "#000000";

const QUALITY_BEST = new Set(["q-br", "q-bb", "q-bw"]);
const QUALITY_GOOD = new Set(["q-gr", "q-gb", "q-gw"]);
const QUALITY_OK = new Set(["q-or", "q-ob", "q-ow"]);
const RELEASE_FILTERS = new Set(RELEASE_FILTER_IDS);

const VISUAL_IDS = new Set([
  "v-dv-hdr10p",
  "v-dv-hdr10",
  "v-dv-hdr",
  "v-hdr10p",
  "v-hdr10",
  "v-hdr",
  "v-hlg",
  "v-10bit",
  "v-sdr",
  "v-ai",
  "v-imax-e",
  "v-imax",
  "a-dv",
  "v-3d",
]);

/** Single media/streaming blue (former tier-2 / transparent media stroke). */
export const MEDIA_TIER2_RGB = "1565C0";

/** @param {string} rgb6 six hex digits */
export function fillRgb6(rgb6) {
  return `#${rgb6.replace("#", "").slice(0, 6).toUpperCase()}`;
}

/** @param {string} rgb6 @returns {string} #AARRGGBB border */
export function borderArgb(rgb6) {
  return `#FF${rgb6.replace("#", "").slice(0, 6).toUpperCase()}`;
}

/** @param {string} color #RRGGBB or #AARRGGBB */
export function fillFromColor(color) {
  const h = color.replace("#", "");
  if (h.length === 8) return `#${h.slice(2).toUpperCase()}`;
  return `#${h.slice(0, 6).toUpperCase()}`;
}

/** @param {string} id @param {string} groupId @returns {{ fill: string, border: string }} */
export function solidColorsForFilter(id, groupId) {
  let rgb6;
  if (id === "seadex-release") rgb6 = "6A1B9A";
  else if (id === "edition-directors-cut") rgb6 = "5C6BC0";
  else if (id === "edition-extended") rgb6 = "00897B";
  else if (id === "edition-true-hue") rgb6 = "E65100";
  else if (id === "edition-bw") rgb6 = "616161";
  else if (specialTagRgb6(id)) rgb6 = specialTagRgb6(id);
  else if (groupId === "gs") rgb6 = streamingBrandRgb6(id);
  else if (groupId === "gms") rgb6 = MEDIA_TIER2_RGB;
  else if (QUALITY_BEST.has(id)) rgb6 = "27C04F";
  else if (QUALITY_GOOD.has(id)) rgb6 = "FF9728";
  else if (QUALITY_OK.has(id)) rgb6 = "E55353";
  else if (groupId === "grl" || RELEASE_FILTERS.has(id)) rgb6 = "5C6B76";
  else if (id === "r-4k") rgb6 = "27C04F";
  else if (id === "r-1440" || id === "r-1080") rgb6 = "FF9728";
  else if (id === "r-720" || id === "r-576" || id === "r-480" || id === "r-360" || id === "r-240")
    rgb6 = "E55353";
  else if (groupId === "ga" || groupId === "gc" || groupId === "gl") rgb6 = "FFFFFF";
  else if (groupId === "gv" || VISUAL_IDS.has(id)) rgb6 = "FFD54F";
  else rgb6 = "FFFFFF";

  const fill = fillRgb6(rgb6);
  return { fill, border: borderArgb(rgb6) };
}

function solidTextForFilter(id, groupId) {
  if (groupId === "gv" || groupId === "ga" || groupId === "gc") return SOLID_TEXT_DARK;
  if (VISUAL_IDS.has(id)) return SOLID_TEXT_DARK;
  return SOLID_TEXT_LIGHT;
}

export function solidGroupMeta() {
  const group = (name, rgb6) => ({
    name,
    color: fillRgb6(rgb6),
    borderColor: borderArgb(rgb6),
  });
  return {
    gst: group("Special Tags", "6A1B9A"),
    gs: group("Streaming", "546E7A"),
    gms: group("Tiers", MEDIA_TIER2_RGB),
    gq: group("Quality", "27C04F"),
    grl: group("Release", "5C6B76"),
    gr: group("Resolution", "27C04F"),
    gv: group("Visual", "FFD54F"),
    ga: group("Audio", "FFFFFF"),
    gc: group("Channels", "FFFFFF"),
    gl: group("Language", "FFFFFF"),
  };
}

/** @param {{ id: string, groupId: string }} filter */
export function applySolidTheme(filter) {
  const { fill, border } = solidColorsForFilter(filter.id, filter.groupId);
  filter.tagColor = fill;
  filter.borderColor = border;
  filter.tagStyle = SOLID_TAG_STYLE;
  filter.textColor = solidTextForFilter(filter.id, filter.groupId);
  return filter;
}
