/**
 * Solid badge theme — opaque Nuvio fills (6-digit tagColor) + border (8-digit).
 */
import {
  CHROME,
  borderArgb,
  chromeRgb6,
  fillRgb6,
  solidInkForRgb6,
} from "./badge-chrome-map.mjs";

export { borderArgb, fillRgb6 } from "./badge-chrome-map.mjs";

export const SOLID_TAG_STYLE = "filled";
export const SOLID_TEXT_LIGHT = "#FFFFFF";
export const SOLID_TEXT_DARK = "#000000";
export const MEDIA_TIER2_RGB = CHROME.tiers;

/** @param {string} color #RRGGBB or #AARRGGBB */
export function fillFromColor(color) {
  const h = color.replace("#", "");
  if (h.length === 8) return `#${h.slice(2).toUpperCase()}`;
  return `#${h.slice(0, 6).toUpperCase()}`;
}

/** @param {string} id @param {string} groupId @returns {{ fill: string, border: string }} */
export function solidColorsForFilter(id, groupId) {
  const rgb6 = chromeRgb6(id, groupId);
  return { fill: fillRgb6(rgb6), border: borderArgb(rgb6) };
}

function solidTextForFilter(id, groupId) {
  return solidInkForRgb6(chromeRgb6(id, groupId));
}

export function solidGroupMeta() {
  const group = (name, rgb6) => ({
    name,
    color: fillRgb6(rgb6),
    borderColor: borderArgb(rgb6),
  });
  return {
    gst: group("Specials", CHROME.seadex),
    gs: group("Streaming", CHROME.streamingGroup),
    gms: group("Tiers", CHROME.tiers),
    gq: group("Quality", CHROME.res4k),
    grl: group("Source", CHROME.source),
    gr: group("Resolution", CHROME.res4k),
    gv: group("Picture", CHROME.picture),
    ga: group("Audio", CHROME.audio),
    gc: group("Channels", CHROME.channels),
    ge: group("Encoder", CHROME.tiers),
    gl: group("Language", CHROME.language),
    gsub: group("Subtitles", CHROME.subtitles),
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
