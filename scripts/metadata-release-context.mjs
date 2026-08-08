/**
 * Metadata audio-merge branches must not match bare codec pairs (e.g. "DDP Atmos")
 * when Nuvio tests each candidate haystack independently.
 *
 * Intentionally excludes bare `dp` from streaming tags — it false-matches inside "DDP".
 */
const RES_TOKENS = String.raw`2160|1080|720|576|480|\b4k\b|\buhd\b|\bfhd\b`;
const SOURCE_TOKENS = String.raw`web[-_. ]?dl|webdl|webrip|bluray|blu-ray|remux|amzn|amazon|nf|netflix|dsnp|disney\+|atv|atvp|appl|apple[\s._-]?tv|pcok|peacock|pmtp|paramount\+|hmax|hbomax|hulu|stan|stzn|crave|itunes|itv`;
const CODEC_TOKENS = String.raw`hevc|h\.? ?265|x265|av1|h264|x264|avc`;
const CONTAINER_TOKENS = String.raw`\.mkv|\.mp4|\.m2ts|\.ts|\.mov|\.m4v`;
const DV_TOKENS = String.raw`(?:^|[^A-Za-z0-9])(?:dv|dovi|dolby[\s._-]?vision)(?=$|[^A-Za-z0-9])`;
const HDR_TOKENS = String.raw`\bhdr\b|hdr[\s._-]?10`;

/** Require release / picture context beyond codec tokens alone. */
export const METADATA_RELEASE_CONTEXT = String.raw`(?=.*(?:${RES_TOKENS}|${SOURCE_TOKENS}|${CODEC_TOKENS}|${CONTAINER_TOKENS}|\bS\d{1,2}E\d{1,2}\b|\b(?:19|20)\d{2}\b|${DV_TOKENS}|${HDR_TOKENS}))`;

/** Require release / picture context beyond DV·HDR combo tokens alone. */
export const METADATA_COMBO_RELEASE_CONTEXT = String.raw`(?=.*(?:${RES_TOKENS}|${SOURCE_TOKENS}|${CODEC_TOKENS}|${CONTAINER_TOKENS}|\bS\d{1,2}E\d{1,2}\b|\b(?:19|20)\d{2}\b))`;
