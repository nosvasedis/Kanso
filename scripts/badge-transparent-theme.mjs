/**
 * Transparent badge theme — clear fill + per-category stroke colors.
 * Nuvio: tagStyle "filled and bordered" shows border without opaque fill when tagColor is transparent.
 */
import { LANGUAGE_BADGE_IDS, SUBTITLE_BADGE_IDS } from "./language-catalog.mjs";
import { CHROME, borderArgb, chromeRgb6 } from "./badge-chrome-map.mjs";

export const TRANSPARENT_FILL = "#00000000";
export const TRANSPARENT_TAG_STYLE = "filled and bordered";
export const TRANSPARENT_TEXT = "#FFFFFF";

/** @deprecated Use TRANSPARENT_* — kept for scripts that still import MONO_* */
export const MONO_FILL = TRANSPARENT_FILL;
export const MONO_TAG_STYLE = TRANSPARENT_TAG_STYLE;
export const MONO_TEXT = TRANSPARENT_TEXT;

export const STROKE = {
  seadex: "#FF6A1B9A",
  editionDc: "#FF5C6BC0",
  editionExt: "#FF00897B",
  editionHue: "#FFE65100",
  editionBw: "#FF757575",
  media: "#FF1565C0",
  streaming: "#FF1565C0",
  qualityBest: "#FF27C04F",
  qualityGood: "#FFFF9728",
  qualityOk: "#FFE55353",
  release: "#FF5C6B76",
  visual: "#FFFFD54F",
  white: "#FFFFFFFF",
};

export const RELEASE_FILTER_IDS = ["q-r", "q-b", "q-w", "q-wr", "q-cam", "q-hdtv"];

/** @param {string} id @param {string} groupId */
export function strokeForFilter(id, groupId) {
  // Apple uses a white reverse on clear surfaces; black chrome disappears.
  if (id === 's-atvp') return '#FFCDD3DB';
  try {
    return borderArgb(chromeRgb6(id, groupId));
  } catch {
    return STROKE.streaming;
  }
}

/** @param {{ id: string, groupId: string }} filter */
export function applyTransparentTheme(filter) {
  filter.tagColor = TRANSPARENT_FILL;
  filter.tagStyle = TRANSPARENT_TAG_STYLE;
  filter.textColor = TRANSPARENT_TEXT;
  filter.borderColor = strokeForFilter(filter.id, filter.groupId);
  return filter;
}

/** @deprecated Use applyTransparentTheme */
export const applyMonoTheme = applyTransparentTheme;

const groupChrome = (name, rgb6) => ({
  name,
  color: TRANSPARENT_FILL,
  borderColor: borderArgb(rgb6),
});

export const MONO_GROUP_META = {
  gst: groupChrome("Special Tags", CHROME.seadex),
  gs: groupChrome("Streaming", CHROME.streamingGroup),
  gms: groupChrome("Tiers", CHROME.tiers),
  gq: groupChrome("Quality", CHROME.res4k),
  grl: groupChrome("Release", CHROME.source),
  gr: groupChrome("Resolution", CHROME.res4k),
  gv: groupChrome("Visual", CHROME.picture),
  ga: groupChrome("Audio", CHROME.audio),
  gc: groupChrome("Channels", CHROME.channels),
  ge: groupChrome("Encoder", CHROME.tiers),
  gl: groupChrome("Language", CHROME.language),
  gsub: groupChrome("Subtitles", CHROME.subtitles),
};

export const TRANSPARENT_GROUP_META = MONO_GROUP_META;

export const MONO_GROUP_ORDER = ["gst", "gs", "gms", "grl", "gr", "gv", "ga", "gc", "ge", "gl", "gsub"];

export const MONO_FILTER_ORDER = {
  gst: [
    "seadex-release",
    "hybrid-release",
    "criterion-collection",
    "proper-release",
    "repack-release",
    "remastered-release",
    "open-matte-edition",
    "regraded-release",
    "edition-directors-cut",
    "edition-extended",
    "uncut-edition",
    "uncensored-edition",
    "edition-bw",
    "edition-true-hue",
    "edition-theatrical",
  ],
  gs: [
    "s-nflx",
    "s-amzn",
    "s-atvp",
    "s-dsnp",
    "s-hmax",
    "s-hulu",
    "s-pcok",
    "s-pamp",
    "s-croll",
  ],
  gms: [
    "web-6",
    "web-5",
    "web-4",
    "web-3",
    "web-2",
    "web-1",
    "blu-ray-8",
    "blu-ray-7",
    "blu-ray-6",
    "blu-ray-5",
    "blu-ray-4",
    "blu-ray-3",
    "blu-ray-2",
    "blu-ray-1",
    "remux-3",
    "remux-2",
    "remux-1",
  ],
  grl: ["q-r", "q-b", "q-w", "q-wr", "q-hdtv", "q-hdrip", "q-dvdrip", "q-scr", "q-tc", "q-ts", "q-cam"],
  gr: ["r-4k", "r-1440", "r-1080", "r-720", "r-576", "r-480", "r-360", "r-240", "r-144"],
  gv: [
    "v-dv-hdr10p",
    "v-dv-hdr10",
    "v-dv-hdr",
    "v-hdr10p",
    "v-hdr10",
    "v-hdr",
    "v-hlg",
    "v-10bit",
    "v-imax-e",
    "v-imax",
    "a-dv",
    "v-sdr",
    "v-ai",
    "v-3d",
  ],
  ga: [
    "a-at-th",
    "a-dtsx-ma",
    "a-at-dp",
    "a-dtsx-hd",
    "a-dtsx",
    "a-dtsma",
    "a-dtshd",
    "a-dtses",
    "a-dts",
    "a-at",
    "a-th",
    "a-dp",
    "a-dd",
    "a-aac",
    "a-flac",
    "a-opus",
    "a-mp3",
    "a-pcm",
  ],
  gc: ["ch-81", "ch-71", "ch-61", "ch-51", "ch-21", "ch-20", "ch-10"],
  ge: ["ge-av1", "ge-hevc", "ge-avc", "ge-xvid", "ge-divx"],
  gl: LANGUAGE_BADGE_IDS,
  gsub: SUBTITLE_BADGE_IDS,
};

const LEGACY_FILLS = new Set([
  "#212121",
  "#1a1a1a",
  "#0d47a1",
  "#1565c0",
  "#ffffff",
  "#27c04f",
  "#ffbe01",
  "#e55353",
  "#5c6b76",
  "#bbdefb",
  "#ffd54f",
]);

/** @param {string} tagColor */
export function isTransparentFill(tagColor) {
  if (!tagColor) return false;
  const t = tagColor.toLowerCase();
  if (t === TRANSPARENT_FILL.toLowerCase()) return true;
  if (t.length === 9 && t.endsWith("00")) return true;
  return false;
}

/** @param {string} tagColor */
export function isLegacyFilled(tagColor) {
  return LEGACY_FILLS.has(tagColor?.toLowerCase() ?? "");
}
