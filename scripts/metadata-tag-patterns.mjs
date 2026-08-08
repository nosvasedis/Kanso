/**
 * Metadata-only badge branches (Nuvio parsed visualTags / audioTags haystacks).
 * Combos only — standalones stay filename-guarded to avoid a-dv + a-dp + combo on fragments.
 */

import {
  ATMOS_EXCLUDE,
  ATMOS_SEG,
  DD_EXCLUDE,
  DD_SEG,
  DDPLUS_EXCLUDE,
  DDPLUS_SEG,
  DV_EXCLUDE,
  ATMOS_SUPPRESS_DV_HDR_MERGES,
  BARE_DV_HDR_FRAGMENT_BLOCK,
  DV_SEG,
  TRUEHD_EXCLUDE,
  TRUEHD_SEG,
} from "./dv-combo-patterns.mjs";
import { ATMOS_DV_BLOCK } from "./audio-coexistence.mjs";
import { DR_MARKER_ALT } from "./dr-badge-patterns.mjs";
import { DV_EXCLUDE_VISUAL, HDR10_PLUS_ALT } from "./hdr-pattern-constants.mjs";
import {
  METADATA_COMBO_RELEASE_CONTEXT,
  METADATA_RELEASE_CONTEXT,
} from "./metadata-release-context.mjs";

/** Short haystack: parsed tag line, not a dotted release name. */
export const TAG_ONLY_GUARD =
  "^(?=.{1,120}$)(?!.*[-_.](?:[A-Za-z0-9][A-Za-z0-9+&-]{1,19})(?:\\.(?:mkv|mp4|m2ts|ts|mov|m4v))?\\s*$)";

/** Tighter cap for combo metadata — Nuvio joined candidates must use filename branches. */
export const TAG_COMBO_GUARD =
  "^(?=.{1,80}$)(?!.*[-_.](?:[A-Za-z0-9][A-Za-z0-9+&-]{1,19})(?:\\.(?:mkv|mp4|m2ts|ts|mov|m4v))?\\s*$)";

const TAG_BASE = `(?i)${TAG_ONLY_GUARD}`;
const TAG_COMBO_BASE = `(?i)${TAG_COMBO_GUARD}`;

const HDR10_PLUS_POS = `(?=.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT})`;
const HDR10_BASE = "(?=.*hdr[\\s._-]?10)";
const HDR10_PLUS_NEG = `(?!.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT})`;

/** Combo metadata branches (require both signals in the same candidate or joined haystack). */
const METADATA_COMBO = {
  "v-at-dv": `${TAG_COMBO_BASE}(?=.*${ATMOS_SEG})(?=.*${DV_SEG})`,
  "a-at-th": `${TAG_COMBO_BASE}${METADATA_RELEASE_CONTEXT}(?=.*${ATMOS_SEG})(?=.*${TRUEHD_SEG})`,
  "a-at-dp": `${TAG_COMBO_BASE}${METADATA_RELEASE_CONTEXT}${ATMOS_DV_BLOCK}(?=.*${ATMOS_SEG})(?!.*${TRUEHD_EXCLUDE})(?=.*${DDPLUS_SEG})`,
  "v-dv-hdr10p": `${TAG_COMBO_BASE}${METADATA_COMBO_RELEASE_CONTEXT}${ATMOS_SUPPRESS_DV_HDR_MERGES}(?=.*${DV_SEG})${HDR10_PLUS_POS}`,
  "v-dv-hdr10": `${TAG_COMBO_BASE}${METADATA_COMBO_RELEASE_CONTEXT}${ATMOS_SUPPRESS_DV_HDR_MERGES}(?=.*${DV_SEG})${HDR10_BASE}${HDR10_PLUS_NEG}`,
  "v-dv-hdr": `${TAG_COMBO_BASE}${METADATA_COMBO_RELEASE_CONTEXT}${METADATA_RELEASE_CONTEXT}${ATMOS_SUPPRESS_DV_HDR_MERGES}${BARE_DV_HDR_FRAGMENT_BLOCK}(?=.*${DV_SEG})(?=.*\\bHDR\\b)(?!.*hdr[\\s._-]?10)`,
};

/** Visual metadata branches (single-tag haystacks). */
const SDR_SUPPRESS_HDR = `(?!.*\\bHDR\\b)(?!.*hdr[\\s._-]?10)`;

const METADATA_VISUAL = {
  "v-hdr10p": `(?i)^${DV_EXCLUDE_VISUAL}(?:(?:.*${DR_MARKER_ALT.hdr10p})|(?:${TAG_BASE.slice(4)}${HDR10_PLUS_POS}))`,
  "v-hdr10": `(?i)^${DV_EXCLUDE_VISUAL}(?:${TAG_BASE.slice(4)}${HDR10_BASE}${HDR10_PLUS_NEG})`,
  "v-hdr": `(?i)^${DV_EXCLUDE_VISUAL}(?:(?:.*${DR_MARKER_ALT.hdr})|(?:${TAG_BASE.slice(4)}(?=.*\\b(?:HDR|PQ)\\b)(?!.*hdr[\\s._-]?10)))`,
  "v-sdr": `(?i)^${DV_EXCLUDE_VISUAL}${SDR_SUPPRESS_HDR}${TAG_BASE.slice(4)}(?=.*\\bSDR\\b)`,
  "v-hlg": `(?i)^${DV_EXCLUDE_VISUAL}${TAG_BASE.slice(4)}(?=.*\\b(?:HLG|hybrid[\\s._-]?log[\\s._-]?gamma)\\b)`,
  "v-10bit": `(?i)^${DV_EXCLUDE_VISUAL}${TAG_BASE.slice(4)}(?=.*\\b(?:10[\\s._-]?bit|hi10p)\\b)`,
  "v-ai": `(?i)^${DV_EXCLUDE_VISUAL}${TAG_BASE.slice(4)}(?=.*\\bAI\\b)`,
};

export const METADATA_TAG_PATTERNS = {
  ...METADATA_COMBO,
  ...METADATA_VISUAL,
};
