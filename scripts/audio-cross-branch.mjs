/**
 * Cross-branch audio tier segments + suppression blocks (no dv-combo dependency).
 */
import { TOK } from "./release-guards.mjs";

const B = "(?:^|[^A-Za-z0-9])";
const E = "(?=$|[^A-Za-z0-9])";

export const DOLBY_HIGH = `${B}(?:atmos|ddpa\\d?|true[-_. ]?hd)${E}`;
export const DDPLUS_ALL =
  `${B}(?:ddp(?:lus)?\\d*|dd\\+|eac[-_. ]?3|e[-_. ]?ac[-_. ]?3|dolby[-_. ]?digital[-_. ]?plus)${E}`;
export const DOLBY_ANY =
  `${B}(?:atmos|ddpa\\d?|true[-_. ]?hd|ddp(?:lus)?\\d*|dd\\+|eac[-_. ]?3|e[-_. ]?ac[-_. ]?3|dolby[-_. ]?digital[-_. ]?plus|dd[25][-_. ]?[01]|dd[-_. ]?(?:5|2)(?:[-_. ]?[01])?|dd(?!p|\\+|pa|[-_. ]*plus)|dolby[-_. ]?digital(?![-_. ]?plus)|ac[-_. ]?3)${E}`;

export const DTSX_STACK =
  `${B}(?:dts(?:[-_: ]x|[.]x(?!26[45])|x(?!26[45]))|dts[-_. ]?(?:hd[-_. ]?)?(?:ma|master[-_. ]?audio)|dtshdma)${E}`;
export const DTSHD_NOT_MA =
  `${B}(?:(?:dts[-_. ]?hd|dtshd)(?![-_. ]?(?:ma|master[-_. ]?audio)))${E}`;
export const DTS_FULL_STACK =
  `${B}(?:dts(?:[-_: ]x|[.]x(?!26[45])|x(?!26[45]))|dts[-_. ]?(?:hd[-_. ]?)?(?:ma|master[-_. ]?audio)|dtshdma|(?:dts[-_. ]?hd|dtshd)(?![-_. ]?(?:ma|master[-_. ]?audio)))${E}`;
export const DTS_ES_SEG = `${B}(?:dts[-_. ]?es|dtses)${E}`;
export const DTS_PLAIN_SEG =
  `${B}dts(?!(?:[-_.: ]?(?:hd|es|ma|master|xll)|[-_: ]?x(?!26[45])|[.]x(?!26[45])))${E}`;
export const DTS_ANY =
  `${B}(?:dts(?:[-_: ]x|[.]x(?!26[45])|x(?!26[45]))|dts[-_. ]?(?:hd[-_. ]?)?(?:ma|master[-_. ]?audio)|dtshdma|(?:dts[-_. ]?hd|dtshd)(?![-_. ]?(?:ma|master[-_. ]?audio))|dts[-_. ]?es|dtses|dts(?!(?:[-_.: ]?(?:hd|es|ma|master|xll)|[-_: ]?x(?!26[45])|[.]x(?!26[45]))))${E}`;

export const FLAC_SEG = `${B}flac${E}`;
export const OPUS_SEG = `${B}opus${E}`;
export const AAC_SEG = `${B}aac${E}`;

export const FLAC_SUPPRESS_DOLBY_DTSX_MA =
  `(?!(?=.*${FLAC_SEG})(?=.*${DOLBY_HIGH})(?=.*${DTSX_STACK}))`;
export const DTSHD_SUPPRESS_FLAC_DOLBY = `(?!(?=.*${FLAC_SEG})(?=.*${DOLBY_HIGH}))`;
export const DDPLUS_SUPPRESS_FLAC_DTS = `(?!(?=.*${FLAC_SEG})(?=.*${DTS_FULL_STACK}))`;
export const DD_SUPPRESS_FLAC_DTS = DDPLUS_SUPPRESS_FLAC_DTS;
export const DTS_ES_SUPPRESS_DOLBY_FLAC = `(?!(?=.*${FLAC_SEG})(?=.*${DOLBY_ANY}))`;
export const DTS_SUPPRESS_DOLBY_FLAC = DTS_ES_SUPPRESS_DOLBY_FLAC;
export const OPUS_SUPPRESS =
  `(?![\\s\\S]*${DOLBY_ANY})(?![\\s\\S]*${DTS_ANY})(?![\\s\\S]*${FLAC_SEG})`;
export const AAC_SUPPRESS = `${OPUS_SUPPRESS}(?![\\s\\S]*${OPUS_SEG})`;

/** DTS-HD MA segment for a-dtses / a-dts guards. */
export const DTSMA_SEG =
  `(?:^|${TOK})dts[-_. ]?hd[-_. ]?ma(?:${TOK}|$)|(?:^|${TOK})dtshdma(?:${TOK}|$)|\\bdts[-_. ]?hd[-_. ]?ma\\b`;
