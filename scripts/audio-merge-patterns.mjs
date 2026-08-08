/**
 * Audio merge badges — Atmos·TrueHD, Atmos·DD+, DTS:X·HD MA, DTS:X·HD.
 */
import {
  ATMOS_GROUP_EXCLUDE,
  ATMOS_SEG,
  DDPLUS_EXCLUDE,
  DDPLUS_SEG,
  TRUEHD_EXCLUDE,
  TRUEHD_SEG,
} from "./dv-combo-patterns.mjs";
import { ATMOS_DV_BLOCK } from "./audio-coexistence.mjs";
import { DTSHD_SUPPRESS_FLAC_DOLBY } from "./audio-cross-branch.mjs";
import { BASE, TOK } from "./release-guards.mjs";

export const DTSX_SEG =
  `(?:^|${TOK})dts[-_: ]?x(?:${TOK}|$)|(?:^|${TOK})dts\\.x(?!26)(?:${TOK}|$)|\\bdts[\\s._-]?x\\b`;

export const DTSMA_SEG =
  `(?:^|${TOK})dts[-_. ]?hd[-_. ]?ma(?:${TOK}|$)|(?:^|${TOK})dtshdma(?:${TOK}|$)|\\bdts[-_. ]?hd[-_. ]?ma\\b`;

export const DTSHD_SEG =
  `(?:^|${TOK})dts[-_. ]?hd(?!\\s*ma)(?:${TOK}|$)|(?:^|${TOK})dtshd(?!ma)(?:${TOK}|$)|\\bdts[-_. ]?hd(?!\\s*ma)\\b`;

export const DTSX_EXCLUDE = DTSX_SEG;
export const DTSMA_EXCLUDE = DTSMA_SEG;
export const DTSHD_EXCLUDE = DTSHD_SEG;

export const DTSX_MA_MERGE_BLOCK = `(?!^(?=[\\s\\S]*${DTSX_SEG})(?=[\\s\\S]*${DTSMA_SEG}))`;
export const DTSX_HD_MERGE_BLOCK = `(?!^(?=[\\s\\S]*${DTSX_SEG})(?=[\\s\\S]*${DTSHD_SEG})(?!.*${DTSMA_EXCLUDE}))`;

export const AUDIO_MERGE_PATTERNS = {
  "a-at-th": {
    name: "Atmos·TH",
    pattern: `${BASE}${ATMOS_GROUP_EXCLUDE}(?=.*${ATMOS_SEG})(?=.*${TRUEHD_SEG})`,
  },
  "a-at-dp": {
    name: "Atmos·DD+",
    pattern: `${BASE}${ATMOS_GROUP_EXCLUDE}${ATMOS_DV_BLOCK}(?=.*${ATMOS_SEG})(?!.*${TRUEHD_EXCLUDE})(?=.*${DDPLUS_SEG})`,
  },
  "a-dtsx-ma": {
    name: "DTS:X·MA",
    pattern: `${BASE}(?=.*${DTSX_SEG})(?=.*${DTSMA_SEG})`,
  },
  "a-dtsx-hd": {
    name: "DTS:X·HD",
    pattern: `${BASE}(?=.*${DTSX_SEG})(?!.*${DTSMA_EXCLUDE})(?=.*${DTSHD_SEG})`,
  },
};

/** Standalone DTS badges — suppress when a merge wins on the same haystack. */
export const DTS_STANDALONE_PATTERNS = {
  "a-dtsx": {
    name: "DTS:X",
    pattern: `${BASE}${DTSX_MA_MERGE_BLOCK}${DTSX_HD_MERGE_BLOCK}(?=.*${DTSX_SEG})`,
  },
  "a-dtsma": {
    name: "DTS-HD MA",
    pattern: `${BASE}${DTSX_MA_MERGE_BLOCK}(?=.*${DTSMA_SEG})`,
  },
  "a-dtshd": {
    name: "DTS-HD",
    pattern: `${BASE}${DTSX_HD_MERGE_BLOCK}${DTSHD_SUPPRESS_FLAC_DOLBY}(?=.*${DTSHD_SEG})(?!.*${DTSMA_EXCLUDE})`,
  },
};
