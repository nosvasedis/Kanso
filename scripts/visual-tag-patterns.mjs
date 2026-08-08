/**
 * Standalone visual badge patterns (HDR, IMAX, 3D).
 */
import { DR_MARKER_ALT } from "./dr-badge-patterns.mjs";
import { HDR10_PLUS_ALT } from "./hdr-pattern-constants.mjs";
import { ATMOS_SEG, DV_SEG } from "./dv-combo-patterns.mjs";
import {
  DV_BOUND_EXCLUDE,
  HDR10P_BOUND,
  HDR10_BOUND,
  HDR_GENERIC_BOUND,
  NO_DV_HDR10,
  NO_DV_HDR10P,
  NO_DV_HDR_STACK,
  SDR_BOUND,
  VISUAL_ANCHOR,
  VISUAL_BASE,
} from "./visual-guards.mjs";

const HDR10_PLUS_POS = `(?=.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT})`;
const HDR10_BASE = "(?=.*hdr[\\s._-]?10)";
const HDR10_PLUS_NEG = `(?!.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT})`;
const HDR_GENERIC = `(?=.*\\b(?:HDR|PQ)\\b)(?!.*hdr[\\s._-]?10)`;

const DV_HDR10P_BLOCK = `(?!^(?=[\\s\\S]*${DV_SEG})(?=[\\s\\S]*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT}))`;
const DV_HDR10_BLOCK =
  `(?!^(?=[\\s\\S]*${DV_SEG})(?=.*hdr[\\s._-]?10)(?!.*hdr[\\s._-]?10[\\s._-]?${HDR10_PLUS_ALT}))`;
const DV_HDR_BLOCK = `(?!^(?=[\\s\\S]*${DV_SEG})(?=.*\\bHDR\\b)(?!.*hdr[\\s._-]?10))`;
/** Generic HDR (incl. DR inject) suppressed when Atmos+DV combo is the headline signal. */
const ATDV_SUPPRESS_GENERIC_HDR = `(?!^(?=[\\s\\S]*${ATMOS_SEG})(?=[\\s\\S]*${DV_SEG}))`;

export const VISUAL_TAG_PATTERNS = {
  "v-hdr10p": {
    name: "HDR10+",
    pattern: `(?i)^${DV_HDR10P_BLOCK}(?:(?:.*${DR_MARKER_ALT.hdr10p})|(?:${VISUAL_ANCHOR}${DV_BOUND_EXCLUDE}(?=[\\s\\S]*${HDR10P_BOUND})))`,
  },
  "v-hdr10": {
    name: "HDR10",
    pattern: `(?i)^${DV_HDR10P_BLOCK}${DV_HDR10_BLOCK}(?:(?:.*${DR_MARKER_ALT.hdr10})|(?:${VISUAL_ANCHOR}${DV_BOUND_EXCLUDE}${NO_DV_HDR10P}(?=[\\s\\S]*${HDR10_BOUND})))`,
  },
  "v-hdr": {
    name: "HDR",
    pattern: `(?i)^${DV_HDR10P_BLOCK}${DV_HDR10_BLOCK}${DV_HDR_BLOCK}${ATDV_SUPPRESS_GENERIC_HDR}(?:(?:.*${DR_MARKER_ALT.hdr})|(?:${VISUAL_ANCHOR}${DV_BOUND_EXCLUDE}${NO_DV_HDR10P}${NO_DV_HDR10}(?=[\\s\\S]*${HDR_GENERIC_BOUND}))|(?:${VISUAL_ANCHOR}${DV_BOUND_EXCLUDE}${HDR_GENERIC}))`,
  },
  "v-sdr": {
    name: "SDR",
    pattern: `(?i)${VISUAL_BASE}${NO_DV_HDR_STACK}(?=[\\s\\S]*${SDR_BOUND})`,
  },
  "v-imax-e": {
    name: "IMAX Enhanced",
    pattern: `(?i)(?:\\bimax[\\s._-]?enhanced\\b|^(?=.*\\b(?:dsnp|ds\\+|disney\\+|bcore|bc)\\b)(?=.*\\bweb[\\s._-]?(?:dl|rip)\\b)(?=.*\\b(?<!non[\\s._-])imax\\b))`,
  },
  "v-imax": {
    name: "IMAX",
    pattern: `(?i)^(?=.*\\bIMAX\\b)(?!.*enhanced)`,
  },
  "v-3d": {
    name: "3D",
    pattern: "(?i)\\b(?:3d|sbs|half[-_. ]?sbs|hsbs|ou|over[-_. ]?under)\\b",
  },
};
