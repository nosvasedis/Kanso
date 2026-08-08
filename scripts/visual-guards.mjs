/**
 * Kingsizew-style visual anchor: joined-filename context + duplicate resolution token.
 * Combined with our release-name guard for filename-scoped visual badges.
 */
import { RELEASE_FILENAME_GUARD } from "./release-guards.mjs";

export const RES_BOUND =
  `(?:^|[^A-Za-z0-9])(?:(?:4320|2160|1440|1080|720|576|480)[pi]?|[48]k|uhd|fhd)(?=$|[^A-Za-z0-9])`;

export const VISUAL_FILE_JOIN =
  `(?:(?=[\\s\\S]*\\.(?:mkv|mp4|m2ts|ts|mov|m4v)\\s+\\S)|(?!(?:[\\s\\S]*\\.(?:mkv|mp4|m2ts|ts|mov|m4v))))`;

export const VISUAL_RES_DUP = `(?=[\\s\\S]*${RES_BOUND}[\\s\\S]*${RES_BOUND})`;

/** Kingsizew visual anchor + our release filename guard. */
export const VISUAL_ANCHOR = `${VISUAL_FILE_JOIN}${VISUAL_RES_DUP}${RELEASE_FILENAME_GUARD.slice(1)}`;

export const VISUAL_BASE = `(?i)${VISUAL_ANCHOR}`;

export const DV_BOUND_EXCLUDE =
  `(?![\\s\\S]*(?:^|[^A-Za-z0-9])(?:dv|dovi|dolby[-_. ]?vision)(?=$|[^A-Za-z0-9]))`;

export const HDR10P_BOUND =
  `(?:^|[^A-Za-z0-9])(?:hdr[-_.]?10(?:[-_.]?(?:\\+|p)|[-_. ]?plus))(?=$|[^A-Za-z0-9])`;

export const HDR10_BOUND =
  `(?:^|[^A-Za-z0-9])(?:hdr[-_.]?10(?![-_. ]?(?:\\+|plus|p|bit)))(?=$|[^A-Za-z0-9])`;

export const HDR_GENERIC_BOUND =
  `(?:^|[^A-Za-z0-9])(?:hdr(?![-_.]?10(?![-_. ]?bit)))(?=$|[^A-Za-z0-9])`;

export const HLG_BOUND =
  `(?:^|[^A-Za-z0-9])(?:hlg|hybrid[-_. ]?log[-_. ]?gamma)(?=$|[^A-Za-z0-9])`;

export const BIT10_BOUND =
  `(?:^|[^A-Za-z0-9])(?:10[-_. ]?bit|hi10p)(?=$|[^A-Za-z0-9])`;

export const SDR_BOUND = `(?:^|[^A-Za-z0-9])(?:sdr)(?=$|[^A-Za-z0-9])`;

export const AI_BOUND =
  `(?:^|[^A-Za-z0-9])(?:ai|ai[-_. ]?(?:upscale(?:d)?|enhance(?:d)?|remaster(?:ed)?|generated)|(?:upscale(?:d)?|enhance(?:d)?|remaster(?:ed)?)[-_. ]?ai)(?=$|[^A-Za-z0-9])`;

/** Suppress lower visual tiers when higher signals exist (kingsizew stack). */
export const NO_DV_HDR10P = `(?![\\s\\S]*${HDR10P_BOUND})`;
export const NO_DV_HDR10 = `(?![\\s\\S]*${HDR10_BOUND})`;
export const NO_DV_HDR = `(?![\\s\\S]*${HDR_GENERIC_BOUND})`;
export const NO_DV_HDR_STACK = `${DV_BOUND_EXCLUDE}${NO_DV_HDR10P}${NO_DV_HDR10}${NO_DV_HDR}`;
export const NO_DV_HDR_HLG = `${NO_DV_HDR_STACK}(?![\\s\\S]*${HLG_BOUND})`;
export const NO_DV_HDR_HLG_10 = `${NO_DV_HDR_HLG}(?![\\s\\S]*${BIT10_BOUND})`;
export const NO_DV_HDR_HLG_10_SDR = `${NO_DV_HDR_HLG_10}(?![\\s\\S]*${SDR_BOUND})`;
