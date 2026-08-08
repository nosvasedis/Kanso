/**
 * Suppress standalone Atmos when the visual Atmos·DV badge (v-at-dv) wins.
 */
import { TOK } from "./release-guards.mjs";

const ATMOS_SEG = `(?:^|${TOK})atmos(?:${TOK}|$)`;
const TRUEHD_SEG = `(?:^|${TOK})truehd(?:${TOK}|$)|\\btrue[\\s._-]?hd\\b`;
const DDPLUS_SEG =
  `(?:(?:^|${TOK})ddp\\d(?:[.\\s]\\d(?:[.\\s]\\d)?)?|(?:^|${TOK})ddp(?=$|${TOK})|(?:^|${TOK})dd\\+|(?:^|${TOK})eac3|(?:^|${TOK})e-ac3|(?:^|${TOK})digital\\+|(?:^|${TOK})dolby(?:[\\s._-])digital(?:[\\s._-])plus(?:[\\s._-]?\\d(?:[\\s._-]?\\d)?)?|\\bdolby[\\s._-]digital[\\s._-]plus(?:[\\s._-]?\\d(?:[\\s._-]?\\d)?)?\\b)`;
const DV_SEG =
  `(?:(?:^|${TOK})(?:dv|dovi)(?:${TOK}|$)|(?:^|${TOK})dolby(?:[\\s._-])vision(?:${TOK}|$))`;
const ATMOS_EXCLUDE = `(?:^|${TOK})atmos(?:${TOK}|$)`;
const TRUEHD_EXCLUDE = `(?:^|${TOK})truehd(?:${TOK}|$)|\\btrue[\\s._-]?hd\\b`;

export const ATMOS_DV_BLOCK = `(?!^(?=[\\s\\S]*${ATMOS_SEG})(?=[\\s\\S]*${DV_SEG}))`;
export const TRUEHD_DV_BLOCK = `(?!^(?=[\\s\\S]*${TRUEHD_SEG})(?=[\\s\\S]*${DV_SEG}))`;
export const DDPLUS_DV_BLOCK =
  `(?!^(?=[\\s\\S]*${DDPLUS_SEG})(?!.*${TRUEHD_EXCLUDE})(?!.*${ATMOS_EXCLUDE})(?=[\\s\\S]*${DV_SEG}))`;
