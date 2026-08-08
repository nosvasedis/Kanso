import { DR_MARKER_ALT } from "./dr-badge-patterns.mjs";
import { HDR10_PLUS_ALT } from "./hdr-pattern-constants.mjs";
import { ATMOS_DV_BLOCK } from "./audio-coexistence.mjs";
import {
  DDPLUS_SUPPRESS_FLAC_DTS,
  DD_SUPPRESS_FLAC_DTS,
} from "./audio-cross-branch.mjs";
import {
  BASE,
  FILENAME_CTX,
  RELEASE_FILENAME_GUARD,
  STREAMING_TAG_BOUND,
  TOK,
} from "./release-guards.mjs";

/** Vidhin Atmos / TrueHD false-positive release groups (filename path only). */
export const ATMOS_GROUP_EXCLUDE = "(?!.*\\b(?:W4NK3R|HQMUX)\\b)";
export const TRUEHD_GROUP_EXCLUDE = "(?!.*\\b(?:CtrlHD|W4NK3R|DON)\\b)";

/** Positive match — release tokens (dotted or space-separated). */
export const ATMOS_SEG = `(?:^|${TOK})atmos(?:${TOK}|$)`;

export const DV_SEG =
  `(?:(?:^|${TOK})(?:dv|dovi)(?:${TOK}|$)|(?:^|${TOK})dolby(?:[\\s._-])vision(?:${TOK}|$))`;

export const TRUEHD_SEG = `(?:^|${TOK})truehd(?:${TOK}|$)|\\btrue[\\s._-]?hd\\b`;

export const DDPLUS_SEG =
  `(?:(?:^|${TOK})ddp\\d(?:[.\\s]\\d(?:[.\\s]\\d)?)?|(?:^|${TOK})ddp(?=$|${TOK})|(?:^|${TOK})dd\\+|(?:^|${TOK})eac3|(?:^|${TOK})e-ac3|(?:^|${TOK})digital\\+|(?:^|${TOK})dolby(?:[\\s._-])digital(?:[\\s._-])plus(?:[\\s._-]?\\d(?:[\\s._-]?\\d)?)?|\\bdolby[\\s._-]digital[\\s._-]plus(?:[\\s._-]?\\d(?:[\\s._-]?\\d)?)?\\b)`;

export const DD_SEG =
  `(?:(?:^|${TOK})dd[25](?:[.\\s][01]|\\s[01])|(?:^|${TOK})ac3(?:${TOK}|$))`;

/** Re-export for scripts that imported from dv-combo-patterns. */
export {
  BASE,
  FILENAME_CTX,
  RELEASE_FILENAME_GUARD,
  RELEASE_SOURCE_MARKERS,
  STREAMING_TAGS,
  STREAMING_TAG_BOUND,
  TOK,
} from "./release-guards.mjs";

/** Broader exclusion — also catches tokens in Nuvio's joined candidate string. */
export const ATMOS_EXCLUDE = `(?:^|${TOK})atmos(?:${TOK}|$)`;

export const DV_EXCLUDE =
  `(?:(?:^|${TOK})(?:dv|dovi)(?:${TOK}|$)|(?:^|${TOK})dolby(?:[\\s._-])vision(?:${TOK}|$))`;

export const TRUEHD_EXCLUDE = `(?:^|${TOK})truehd(?:${TOK}|$)|\\btrue[\\s._-]?hd\\b`;

export const DDPLUS_EXCLUDE =
  `(?:(?:^|${TOK})ddp(?:\\d|[.\\s]|$)|(?:^|${TOK})ddp(?=$|${TOK})|(?:^|${TOK})dd\\+|(?:^|${TOK})eac3|(?:^|${TOK})e-ac3|(?:^|${TOK})digital\\+|(?:^|${TOK})dolby(?:[\\s._-])digital(?:[\\s._-])plus|\\bdolby[\\s._-]digital[\\s._-]plus\\b)`;

export const DD_EXCLUDE =
  `(?:(?:^|${TOK})dd[25](?:[.\\s][01]|\\s[01])|(?:^|${TOK})ac3(?:${TOK}|$))`;

/**
 * Nuvio often passes separate dotted substrings (video vs audio). Standalone DV
 * must not match a video slice that ends right after HDR10 (no channels/DDP).
 */
export const DV_VIDEO_SLICE_BLOCK =
  "(?!.*\\.DV\\.HDR10(?:\\+|Plus|PIus)?(?:[._\\-/]|$)\\s*$)";

/**
 * Standalone DD+ must not match an audio-only slice ending on DDP/Atmos (no -GROUP).
 */
export const DDP_AUDIO_SLICE_BLOCK =
  `(?!.*\\.(?:DDP\\d+(?:\\.\\d)?|DDP|DD\\+|EAC3|E-AC3|Digital\\+|Dolby\\.Digital\\.Plus(?:\\.\\d(?:\\.\\d)?)?)(?:[._\\-/]|$)\\s*$)(?!.*\\bDolby Digital Plus(?:\\s\\d(?:\\.\\d)?)?\\s*$)(?!.*(?:^|${TOK})atmos(?:${TOK}|$)\\s*$)`;

/** Standalone Atmos must not match an audio slice ending on Atmos (no -GROUP). */
export const ATMOS_AUDIO_SLICE_BLOCK =
  `(?!.*(?:^|${TOK})atmos(?:${TOK}|$)\\s*$)(?!.*(?:^|${TOK})truehd(?:${TOK}|$)\\s*$)`;

/**
 * Formatter/display title before dotted release tags, e.g. "(2026) 2160p.WEBrip".
 * Nuvio also tests a dotted raw filename that may include ".DV." — suppresses
 * duplicate standalone DD+ on the human-readable title.
 */
export const DISPLAY_TITLE_DDP_BLOCK = "(?!.*\\)\\s+(?:2160|1080|720)[pi]\\.)";

/**
 * Dotted ".HEVC.*.DDP" without a ".DV." segment between (combo uses another candidate).
 */
export const HEVC_DDP_NO_DV_BLOCK =
  "(?!.*\\.HEVC\\.(?:(?!\\.DV\\.|\\.DoVi\\.|\\.dolby\\.vision)[^.])*\\.DDP)";

/** Video codec in release names (not title hyphens like Spider-Noir). */
export const VIDEO_CODEC_TOKEN =
  `\\b(?:H\\.? ?265|HEVC|x265|AV1|X264|x264|AVC|H264|h264)\\b`;

/**
 * Nuvio may pass a short episode title with DDP but without Atmos/DV on that slice.
 * Suppress standalone DD+ unless the slice looks like a full release name.
 */
export const EPISODE_PARTIAL_DDP_BLOCK =
  `(?!^(?=.*\\bS\\d{1,2}E\\d{1,2}\\b)(?!.*${VIDEO_CODEC_TOKEN})(?!.*\\.(?:mkv|mp4|m2ts)\\b).*$)`;

/**
 * Dotted episode torrent slice with DDP*.mkv but no .DV./.Atmos. (combo on full name).
 */
export const DOTTED_EPISODE_DDP_ONLY_BLOCK =
  `(?!^(?=.*\\.S\\d{1,2}E\\d{1,2}\\.)(?=.*\\.DDP)(?=.*\\.mkv\\b)(?!.*\\.(?:DV|DoVi|Atmos)\\.).*$)`;

const HDR10_BASE_INLINE = "(?=.*hdr[\\s._-]?10)";
const HDR10_PLUS_NEG_INLINE = `(?!.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT})`;
const HDR_ONLY_INLINE = `(?=.*\\bHDR\\b)(?!.*hdr[\\s._-]?10)`;

/** Suppress standalone DV when a DV·HDR merge would match the same haystack. */
export const DV_HDR10P_MERGE_BLOCK = `(?!^(?=[\\s\\S]*${DV_SEG})(?=[\\s\\S]*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT}))`;
export const DV_HDR10_MERGE_BLOCK = `(?!^(?=[\\s\\S]*${DV_SEG})${HDR10_BASE_INLINE}${HDR10_PLUS_NEG_INLINE})`;
export const DV_HDR_MERGE_BLOCK = `(?!^(?=[\\s\\S]*${DV_SEG})${HDR_ONLY_INLINE})`;

/** DV·HDR* merges yield to v-at-dv whenever Atmos appears in the haystack. */
export const ATMOS_SUPPRESS_DV_HDR_MERGES =
  `(?!^(?=[\\s\\S]*${ATMOS_SEG}))`;

/** @deprecated Alias — use ATMOS_SUPPRESS_DV_HDR_MERGES */
export const ATDV_SUPPRESS_DV_HDR_MERGE = ATMOS_SUPPRESS_DV_HDR_MERGES;

/** Bare Nuvio visualTags shorthand (not a parsed release title). */
export const BARE_DV_HDR_FRAGMENT_BLOCK =
  `(?!^(?:DV HDR|HDR DV)$)`;

export const ATMOS_TRUEHD_MERGE_BLOCK = `(?!^(?=[\\s\\S]*${ATMOS_SEG})(?=[\\s\\S]*${TRUEHD_SEG}))`;
export const ATMOS_DDPLUS_MERGE_BLOCK = `(?!^(?=[\\s\\S]*${ATMOS_SEG})(?=[\\s\\S]*${DDPLUS_SEG})(?!.*${TRUEHD_EXCLUDE}))`;

/** Suppress standalone DV when Atmos / TrueHD own the visual headline (v-at-dv / merges). */
export const DV_ATMOS_TRUEHD_BLOCK = `(?!.*${ATMOS_EXCLUDE})(?!.*${TRUEHD_EXCLUDE})`;

/** @deprecated Use DV_ATMOS_TRUEHD_BLOCK */
export const DV_STANDALONE_EXCLUDE = DV_ATMOS_TRUEHD_BLOCK;

/** Formatter DV marker path — suppress when audio tags already carry DDP/DD (a-dp / a-dd). */
export const DV_MARKER_DDP_BLOCK = `(?!.*${DDPLUS_EXCLUDE})(?!.*${DD_EXCLUDE})`;

export const DV_COMBO_PATTERNS = {
  "a-at": {
    pattern: `${BASE}${ATMOS_AUDIO_SLICE_BLOCK}${ATMOS_TRUEHD_MERGE_BLOCK}${ATMOS_DDPLUS_MERGE_BLOCK}${ATMOS_DV_BLOCK}${ATMOS_GROUP_EXCLUDE}(?=.*${ATMOS_SEG})(?!.*${DV_EXCLUDE})(?!.*${DDPLUS_EXCLUDE})`,
  },
  "a-th": {
    pattern: `${BASE}${TRUEHD_GROUP_EXCLUDE}${ATMOS_TRUEHD_MERGE_BLOCK}(?=.*${TRUEHD_SEG})(?!.*${ATMOS_EXCLUDE})(?!.*${DV_EXCLUDE})(?!.*${DDPLUS_EXCLUDE})`,
  },
  "a-dp": {
    pattern: `${BASE}${DISPLAY_TITLE_DDP_BLOCK}${HEVC_DDP_NO_DV_BLOCK}${EPISODE_PARTIAL_DDP_BLOCK}${DOTTED_EPISODE_DDP_ONLY_BLOCK}${DDP_AUDIO_SLICE_BLOCK}${ATMOS_DDPLUS_MERGE_BLOCK}${DDPLUS_SUPPRESS_FLAC_DTS}(?=.*${DDPLUS_SEG})(?!.*${ATMOS_EXCLUDE})(?!.*${TRUEHD_EXCLUDE})`,
  },
  "a-dd": {
    pattern: `${BASE}${DD_SUPPRESS_FLAC_DTS}(?=.*${DD_SEG})(?!.*${DDPLUS_EXCLUDE})(?!.*${TRUEHD_EXCLUDE})(?!.*${ATMOS_EXCLUDE})(?!.*${DV_EXCLUDE})`,
  },
  "a-dv": {
    pattern: `(?i)^${DV_ATMOS_TRUEHD_BLOCK}${DV_HDR10P_MERGE_BLOCK}${DV_HDR10_MERGE_BLOCK}${DV_HDR_MERGE_BLOCK}(?:(?:.*${DR_MARKER_ALT.dv})${DV_MARKER_DDP_BLOCK}|${BASE.slice(4)}${DV_VIDEO_SLICE_BLOCK}(?=.*${DV_SEG}))`,
  },
};
