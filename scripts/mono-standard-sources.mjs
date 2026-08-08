/**
 * Resolve standard (normal) badge icon sources for mono adaptation.
 */
import fs from "fs/promises";
import path from "path";
import { CANONICAL_ICON_URLS } from "./canonical-icon-urls.mjs";
import { EXTERNAL_IMAGES, GENERATED_ICON_IDS, LIGHT_ON_DARK_ICONS } from "./external-icons.mjs";
import { EDITION_BADGES } from "./edition-badges.mjs";
import { STREAMING_BADGES } from "./streaming-badges.mjs";
import { MONO_FILTER_ORDER, RELEASE_FILTER_IDS } from "./badge-transparent-theme.mjs";
import {
  BF_MONO_BLURAY,
  BF_MONO_REMUX,
  BF_MONO_WEBDL,
  fetchBfReleaseCanvas,
  renderBfWebRipComposite,
} from "./bf-release-art.mjs";
import { fetchImage } from "./mono-icon-pipeline.mjs";

/** filter id -> filename in badges/generated/ */
export const STANDARD_FILE_BY_ID = {
  "seadex-release": "seadex.png",
  "edition-directors-cut": "edition-directors-cut.png",
  "edition-extended": "edition-extended.png",
  "edition-true-hue": "edition-true-hue.png",
  "edition-bw": "edition-bw.png",
  "a-aac": "aac.png",
  "a-flac": "flac.png",
  "a-opus": "opus.png",
  "a-mp3": "mp3.png",
  "a-pcm": "pcm.png",
  "ch-71": "7-1.png",
  "ch-61": "6-1.png",
  "ch-51": "5-1.png",
  "ch-20": "2-0.png",
  "q-wr": "webrip.png",
  "q-cam": "cam.png",
  "q-hdtv": "hdtv.png",
  "r-576": "576.png",
  "r-480": "480.png",
  "r-360": "360.png",
  "r-240": "240.png",
  "v-3d": "3d.png",
  "v-imax": "imax.png",
  "v-imax-e": "imax-enhanced.png",
  "v-at-dv": "atmos-dv-combo.png",
  "l-en": "lang-en.png",
  "l-es": "lang-es.png",
  "l-fr": "lang-fr.png",
  "l-de": "lang-de.png",
  "l-it": "lang-it.png",
  "l-pt-br": "lang-pt-br.png",
  "l-pt-pt": "lang-pt-pt.png",
  "l-tr": "lang-tr.png",
  "l-pl": "lang-pl.png",
  "l-uk": "lang-uk.png",
  "l-id": "lang-id.png",
  "l-th": "lang-th.png",
  "l-vi": "lang-vi.png",
  "l-ja": "lang-ja.png",
  "l-ko": "lang-ko.png",
  "l-zh": "lang-zh.png",
  "l-hi": "lang-hi.png",
  "l-ar": "lang-ar.png",
  "l-ru": "lang-ru.png",
  "l-el": "lang-el.png",
  "l-mu": "lang-multi.png",
};

const CHANNEL_MONO_FILE = {
  "ch-71": "7-1.png",
  "ch-61": "6-1.png",
  "ch-51": "5-1.png",
  "ch-20": "2-0.png",
};

const TIER_IDS = new Set(MONO_FILTER_ORDER.gms);
const QUALITY_IDS = new Set(MONO_FILTER_ORDER.gq);
const RESOLUTION_IDS = new Set(MONO_FILTER_ORDER.gr);

/** All filter ids in display order (shared across solid / transparent / mono JSON). */
export function allTransparentFilterIds() {
  const ids = [];
  for (const groupId of Object.keys(MONO_FILTER_ORDER)) {
    for (const id of MONO_FILTER_ORDER[groupId]) ids.push(id);
  }
  return ids;
}

/** @deprecated Use allTransparentFilterIds */
export const allMonoFilterIds = allTransparentFilterIds;

/** Output filename in badges/generated-transparent/ */
export function transparentOutputFile(id) {
  if (id === "seadex-release") return "seadex.png";
  if (STANDARD_FILE_BY_ID[id]) return STANDARD_FILE_BY_ID[id];
  const edition = EDITION_BADGES.find((d) => d.id === id);
  if (edition) return edition.file;
  const streaming = STREAMING_BADGES.find((d) => d.id === id);
  if (streaming) return streaming.file;
  if (TIER_IDS.has(id)) return `tier-${id}.png`;
  if (CHANNEL_MONO_FILE[id]) return CHANNEL_MONO_FILE[id];
  if (id.startsWith("l-") && STANDARD_FILE_BY_ID[id]) return STANDARD_FILE_BY_ID[id];
  return `${id}.png`;
}

/** @deprecated Use transparentOutputFile */
export const monoOutputFile = transparentOutputFile;

/** @type {Record<string, string>} */
export const TRANSPARENT_FILE_BY_ID = Object.fromEntries(
  allTransparentFilterIds().map((id) => [id, transparentOutputFile(id)])
);

/** @deprecated Use TRANSPARENT_FILE_BY_ID */
export const MONO_FILE_BY_ID = TRANSPARENT_FILE_BY_ID;

/**
 * @param {string} id
 * @returns {'streaming'|'languageMono'|'whiteBadge'|'whiteLabel'|'darkTransparent'|'coloredTier'|'lightOnBlack'|'lightArtwork'|'whiteOnClear'|'releaseWhite'|'imported'}
 */
export function adaptModeForId(id) {
  if (id.startsWith("s-")) return "streaming";
  if (id.startsWith("l-")) return "languageMono";
  if (id.startsWith("ch-") || /^a-(aac|flac|opus|mp3|pcm)$/.test(id) || id === "v-3d") {
    return "whiteBadge";
  }
  if (id === "seadex-release") return "lightArtwork";
  if (
    id === "edition-directors-cut" ||
    id === "edition-extended" ||
    id === "edition-true-hue" ||
    id === "edition-bw"
  ) {
    return "whiteLabel";
  }
  if (id === "v-imax-e") return "imported";
  if (TIER_IDS.has(id)) return "whiteOnClear";
  if (RELEASE_FILTER_IDS.includes(id)) return "releaseWhite";
  if (QUALITY_IDS.has(id) || RESOLUTION_IDS.has(id)) return "whiteOnClear";
  if (/^v-at-dv$/.test(id) || id === "v-imax") return "darkTransparent";
  return "darkTransparent";
}

/**
 * @param {string} id
 * @param {{ iconsUrls: Record<string,string>, normalById: Map<string,{imageURL:string}>, generatedDir: string, root: string }}
 */
export async function resolveStandardBuffer(id, { iconsUrls, normalById, generatedDir, root }) {
  const streaming = STREAMING_BADGES.find((d) => d.id === id);
  if (streaming) {
    return { buffer: await fetchImage(streaming.imageURL), source: streaming.imageURL };
  }

  if (id === "q-wr") {
    return { buffer: await renderBfWebRipComposite(), source: "bf-webrip-composite" };
  }
  if (id === "q-r") {
    return { buffer: await fetchBfReleaseCanvas(BF_MONO_REMUX), source: BF_MONO_REMUX };
  }
  if (id === "q-b") {
    return { buffer: await fetchBfReleaseCanvas(BF_MONO_BLURAY), source: BF_MONO_BLURAY };
  }
  if (id === "q-w") {
    return { buffer: await fetchBfReleaseCanvas(BF_MONO_WEBDL), source: BF_MONO_WEBDL };
  }
  if (id === "q-cam") {
    const { renderBfCamComposite } = await import("./bf-release-art.mjs");
    return { buffer: await renderBfCamComposite(), source: "bf-cam-composite" };
  }
  if (id === "q-hdtv") {
    const { renderBfHdtvComposite } = await import("./bf-release-art.mjs");
    return { buffer: await renderBfHdtvComposite(), source: "bf-hdtv-composite" };
  }

  const localName = STANDARD_FILE_BY_ID[id];
  if (localName) {
    const localPath = path.join(generatedDir, localName);
    try {
      return { buffer: await fs.readFile(localPath), source: localPath };
    } catch {
      /* fall through */
    }
  }

  const canonical = CANONICAL_ICON_URLS[id];
  const useCanonicalFirst =
    TIER_IDS.has(id) || QUALITY_IDS.has(id) || RESOLUTION_IDS.has(id);
  if (useCanonicalFirst && canonical?.startsWith("http")) {
    return { buffer: await fetchImage(canonical), source: canonical };
  }

  const hosted = iconsUrls[id];
  if (hosted?.startsWith("http")) {
    return { buffer: await fetchImage(hosted), source: hosted };
  }

  if (canonical?.startsWith("http")) {
    return { buffer: await fetchImage(canonical), source: canonical };
  }

  const normal = normalById.get(id)?.imageURL;
  if (normal?.startsWith("http")) {
    return { buffer: await fetchImage(normal), source: normal };
  }

  if (id === "seadex-release" && LIGHT_ON_DARK_ICONS[id]) {
    const url = LIGHT_ON_DARK_ICONS[id];
    return { buffer: await fetchImage(url), source: url };
  }

  if (EXTERNAL_IMAGES[id]) {
    const url = EXTERNAL_IMAGES[id];
    return { buffer: await fetchImage(url), source: url };
  }

  throw new Error(`No standard source for ${id}`);
}

export { GENERATED_ICON_IDS };
