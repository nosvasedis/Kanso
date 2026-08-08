/**
 * Transparent badge theme — clear fill + per-category stroke colors.
 * Nuvio: tagStyle "filled and bordered" shows border without opaque fill when tagColor is transparent.
 */
import { streamingBrandStroke } from "./streaming-brand-colors.mjs";
import { specialTagStroke } from "./special-tag-colors.mjs";

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

const QUALITY_BEST = new Set(["q-br", "q-bb", "q-bw"]);
const QUALITY_GOOD = new Set(["q-gr", "q-gb", "q-gw"]);
const QUALITY_OK = new Set(["q-or", "q-ob", "q-ow"]);
export const RELEASE_FILTER_IDS = ["q-r", "q-b", "q-w", "q-wr", "q-cam", "q-hdtv"];
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

/** @param {string} id @param {string} groupId */
export function strokeForFilter(id, groupId) {
  if (id === "seadex-release") return STROKE.seadex;
  if (id === "edition-directors-cut") return STROKE.editionDc;
  if (id === "edition-extended") return STROKE.editionExt;
  if (id === "edition-true-hue") return STROKE.editionHue;
  if (id === "edition-bw") return STROKE.editionBw;
  const tagStroke = specialTagStroke(id);
  if (tagStroke) return tagStroke;
  if (groupId === "gms") return STROKE.media;
  if (groupId === "gs") {
    try {
      return streamingBrandStroke(id);
    } catch {
      return STROKE.streaming;
    }
  }
  if (groupId === "grl" || RELEASE_FILTERS.has(id)) return STROKE.release;
  if (QUALITY_BEST.has(id)) return STROKE.qualityBest;
  if (QUALITY_GOOD.has(id)) return STROKE.qualityGood;
  if (QUALITY_OK.has(id)) return STROKE.qualityOk;
  if (id === "r-4k") return STROKE.qualityBest;
  if (id === "r-1440" || id === "r-1080") return STROKE.qualityGood;
  if (id === "r-720" || id === "r-576" || id === "r-480" || id === "r-360" || id === "r-240")
    return STROKE.qualityOk;
  if (groupId === "ga" || groupId === "gc" || groupId === "gl") return STROKE.white;
  if (groupId === "gv" || VISUAL_IDS.has(id)) return STROKE.visual;
  return STROKE.white;
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

export const MONO_GROUP_META = {
  gst: { name: "Special Tags", color: TRANSPARENT_FILL, borderColor: STROKE.seadex },
  gs: { name: "Streaming", color: TRANSPARENT_FILL, borderColor: "#FF546E7A" },
  gms: { name: "Tiers", color: TRANSPARENT_FILL, borderColor: STROKE.media },
  gq: { name: "Quality", color: TRANSPARENT_FILL, borderColor: STROKE.qualityBest },
  grl: { name: "Release", color: TRANSPARENT_FILL, borderColor: STROKE.release },
  gr: { name: "Resolution", color: TRANSPARENT_FILL, borderColor: STROKE.qualityBest },
  gv: { name: "Visual", color: TRANSPARENT_FILL, borderColor: STROKE.visual },
  ga: { name: "Audio", color: TRANSPARENT_FILL, borderColor: STROKE.white },
  gc: { name: "Channels", color: TRANSPARENT_FILL, borderColor: STROKE.white },
  gl: { name: "Language", color: TRANSPARENT_FILL, borderColor: STROKE.white },
};

export const TRANSPARENT_GROUP_META = MONO_GROUP_META;

export const MONO_GROUP_ORDER = ["gst", "gs", "gms", "gq", "grl", "gr", "gv", "ga", "gc", "gl"];

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
    "web-unranked",
    "web-6",
    "web-5",
    "web-4",
    "web-3",
    "web-2",
    "web-1",
    "blu-ray-unranked",
    "blu-ray-8",
    "blu-ray-7",
    "blu-ray-6",
    "blu-ray-5",
    "blu-ray-4",
    "blu-ray-3",
    "blu-ray-2",
    "blu-ray-1",
    "remux-unranked",
    "remux-3",
    "remux-2",
    "remux-1",
  ],
  gq: [
    "q-br",
    "q-bb",
    "q-bw",
    "q-gr",
    "q-gb",
    "q-gw",
    "q-or",
    "q-ob",
    "q-ow",
  ],
  grl: ["q-r", "q-b", "q-w", "q-wr", "q-cam", "q-hdtv"],
  gr: ["r-4k", "r-1440", "r-1080", "r-720", "r-576", "r-480", "r-360", "r-240"],
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
  gc: ["ch-71", "ch-61", "ch-51", "ch-20"],
  gl: [
    "l-en",
    "l-es",
    "l-fr",
    "l-de",
    "l-it",
    "l-pt-br",
    "l-pt-pt",
    "l-tr",
    "l-pl",
    "l-uk",
    "l-id",
    "l-th",
    "l-vi",
    "l-ja",
    "l-ko",
    "l-zh",
    "l-hi",
    "l-ar",
    "l-ru",
    "l-el",
    "l-mu",
  ],
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
