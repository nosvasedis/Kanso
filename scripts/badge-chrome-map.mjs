/**
 * Category chrome RGB — one map for Solid fill and Transparent/Outline borders.
 * Glyphs stay kingsizew; Mono does not use this map.
 */
import { streamingBrandRgb6 } from "./streaming-brand-colors.mjs";
import { specialTagRgb6 } from "./special-tag-colors.mjs";
import {contrast} from './badge-color-utils.mjs';

export const CHROME = {
  seadex: "6A1B9A",
  dc: "5C6BC0",
  extended: "00897B",
  trueHue: "E65100",
  bw: "616161",
  tiers: "1565C0",
  source: "5C6B76",
  res4k: "27C04F",
  resHd: "FF9728",
  resSd: "E55353",
  picture: "FFD54F",
  audio: "00BCD4",
  channels: "0097A7",
  language: "AB47BC",
  subtitles: "8E24AA",
  streamingGroup: "546E7A",
};

/** Solid ink is dark only on these fills (spec table). Everything else is white. */
export const SOLID_DARK_INK = new Set(["FFD54F", "00BCD4", "27C04F", "FF9728"]);

const LEGACY_SPECIAL = {
  "seadex-release": CHROME.seadex,
  "edition-directors-cut": CHROME.dc,
  "edition-extended": CHROME.extended,
  "edition-true-hue": CHROME.trueHue,
  "edition-bw": CHROME.bw,
};

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

const RES_HD = new Set(["r-1440", "r-1080"]);
const RES_SD = new Set(["r-720", "r-576", "r-480", "r-360", "r-240", "r-144"]);

/** @param {string} id @param {string} groupId @returns {string} six hex digits */
export function chromeRgb6(id, groupId) {
  if (LEGACY_SPECIAL[id]) return LEGACY_SPECIAL[id];
  const special = specialTagRgb6(id);
  if (special) return special.toUpperCase();
  if (groupId === "gs") return streamingBrandRgb6(id);
  if (groupId === "gms") return CHROME.tiers;
  if (groupId === "grl") return CHROME.source;
  if (id === "r-4k") return CHROME.res4k;
  if (RES_HD.has(id)) return CHROME.resHd;
  if (RES_SD.has(id) || groupId === "gr") return CHROME.resSd;
  if (groupId === "gv" || VISUAL_IDS.has(id)) return CHROME.picture;
  if (groupId === "ga") return CHROME.audio;
  if (groupId === "gc") return CHROME.channels;
  if (groupId === "gl") return CHROME.language;
  if (groupId === "gsub") return CHROME.subtitles;
  return CHROME.source;
}

/** @param {string} rgb6 six hex digits */
export function fillRgb6(rgb6) {
  return `#${rgb6.replace("#", "").slice(0, 6).toUpperCase()}`;
}

/** @param {string} rgb6 @returns {string} #AARRGGBB */
export function borderArgb(rgb6) {
  return `#FF${rgb6.replace("#", "").slice(0, 6).toUpperCase()}`;
}

/** @param {string} rgb6 */
export function solidInkForRgb6(rgb6) {
  const rgb=rgb6.replace('#','').slice(0,6);
  return contrast('000000',rgb)>=contrast('FFFFFF',rgb)?'#000000':'#FFFFFF';
}
