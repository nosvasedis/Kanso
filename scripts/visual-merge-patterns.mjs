/**
 * Visual DV·HDR merged badges + fallback visuals (HLG, 10bit, AI).
 */
import {
  ATMOS_GROUP_EXCLUDE,
  ATMOS_SEG,
  ATMOS_SUPPRESS_DV_HDR_MERGES,
  BARE_DV_HDR_FRAGMENT_BLOCK,
  DV_SEG,
  DV_VIDEO_SLICE_BLOCK,
} from "./dv-combo-patterns.mjs";
import { BASE } from "./release-guards.mjs";
import { HDR10_PLUS_ALT } from "./hdr-pattern-constants.mjs";
import {
  AI_BOUND,
  BIT10_BOUND,
  HLG_BOUND,
  NO_DV_HDR_HLG,
  NO_DV_HDR_HLG_10,
  NO_DV_HDR_STACK,
  VISUAL_BASE,
} from "./visual-guards.mjs";

const HDR10_PLUS_POS = `(?=.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT})`;
const HDR10_BASE = "(?=.*hdr[\\s._-]?10)";
const HDR10_PLUS_NEG = `(?!.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT})`;
const HDR_ONLY = `(?=.*\\bHDR\\b)(?!.*hdr[\\s._-]?10)`;

export const VISUAL_MERGE_PATTERNS = {
  "v-dv-hdr10p": {
    name: "DV·HDR10+",
    pattern: `${BASE}${ATMOS_SUPPRESS_DV_HDR_MERGES}${DV_VIDEO_SLICE_BLOCK}(?=.*${DV_SEG})${HDR10_PLUS_POS}`,
  },
  "v-dv-hdr10": {
    name: "DV·HDR10",
    pattern: `${BASE}${ATMOS_SUPPRESS_DV_HDR_MERGES}${DV_VIDEO_SLICE_BLOCK}(?=.*${DV_SEG})${HDR10_BASE}${HDR10_PLUS_NEG}`,
  },
  "v-dv-hdr": {
    name: "DV·HDR",
    pattern: `${BASE}${ATMOS_SUPPRESS_DV_HDR_MERGES}${BARE_DV_HDR_FRAGMENT_BLOCK}(?=.*${DV_SEG})${HDR_ONLY}`,
  },
  "v-at-dv": {
    name: "Atmos·DV",
    pattern: `${BASE}${ATMOS_GROUP_EXCLUDE}(?=.*${ATMOS_SEG})(?=.*${DV_SEG})`,
  },
  "v-hlg": {
    name: "HLG",
    pattern: `${VISUAL_BASE}${NO_DV_HDR_STACK}(?=[\\s\\S]*${HLG_BOUND})`,
  },
  "v-10bit": {
    name: "10bit",
    pattern: `${VISUAL_BASE}${NO_DV_HDR_HLG}(?=[\\s\\S]*${BIT10_BOUND})`,
  },
  "v-ai": {
    name: "AI",
    pattern: `${VISUAL_BASE}${NO_DV_HDR_HLG_10}(?=[\\s\\S]*${AI_BOUND})`,
  },
};
