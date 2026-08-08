/**
 * V2 formatter inject builders — grows per migration phase.
 * Phase 8: layout + budget packing in formatter-budget.mjs.
 */
import { FORMATTER_EDITION_INJECT } from "./formatter-edition-inject.mjs";
import { V2_INJECT_IMPLEMENTED_IDS } from "./formatter-markers.mjs";
import {
  FORMATTER_SEADEX_INJECT,
  FORMATTER_RANK_STARS,
} from "./quality-rank-patterns.mjs";
import { FORMATTER_STREAMING_INJECT } from "./streaming-formatter-patterns.mjs";
import { TITLE_TRANSPORT } from "./formatter-layout.mjs";
import { FORMATTER_V2_INJECT_VISUAL } from "./visual-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_AUDIO } from "./audio-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_CHANNELS } from "./channels-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_TIERS } from "./tier-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_QUALITY } from "./source-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_RESOLUTION } from "./resolution-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_LANGUAGES } from "./language-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_SPECIAL } from "./special-formatter-inject.mjs";
import {
  FORMATTER_V2_NAME,
  FORMATTER_V2_INJECT_DESCRIPTION_TAIL,
  FORMATTER_V2_LAYOUT,
  FORMATTER_SHARDED_BADGE_IDS,
  FORMATTER_SHARDED_SEGMENT_IDS,
  estimateV2FormatterLength,
} from "./formatter-budget.mjs";

/** Non-visual inject blocks already in v1 formatter. */
export const FORMATTER_V2_INJECT_BASELINE =
  FORMATTER_SEADEX_INJECT +
  FORMATTER_EDITION_INJECT +
  FORMATTER_STREAMING_INJECT;

/** Phase 1 — unified visual + DR markers. */
export { FORMATTER_V2_INJECT_VISUAL };

/** Phase 2 — audio markers (ga). */
export { FORMATTER_V2_INJECT_AUDIO };

/** Phase 3 — channel markers (gc). */
export { FORMATTER_V2_INJECT_CHANNELS };

/** Phase 4 — tier markers (gms, name field after stars). */
export { FORMATTER_V2_INJECT_TIERS };

/** Phase 5 — source markers (gq + grl), name field after tiers. */
export { FORMATTER_V2_INJECT_QUALITY };

/** Phase 5 — resolution markers (gr), description tail. */
export { FORMATTER_V2_INJECT_RESOLUTION };

/** Phase 6 — language markers (gl), description tail. */
export { FORMATTER_V2_INJECT_LANGUAGES };

/** Phase 7 — special tags + edition hue/bw (gst), description tail. */
export { FORMATTER_V2_INJECT_SPECIAL };

/** v1-compatible implemented tail (still uses separate DR in production formatter.json). */
export const FORMATTER_V2_INJECT_IMPLEMENTED =
  FORMATTER_V2_INJECT_BASELINE + FORMATTER_V2_INJECT_VISUAL;

/** Full v2 inject tail if all segments fit (no sharding). */
export const FORMATTER_V2_INJECT_DESCRIPTION_TAIL_FULL =
  FORMATTER_V2_INJECT_BASELINE +
  FORMATTER_V2_INJECT_VISUAL +
  FORMATTER_V2_INJECT_AUDIO +
  FORMATTER_V2_INJECT_CHANNELS +
  FORMATTER_V2_INJECT_RESOLUTION +
  FORMATTER_V2_INJECT_LANGUAGES +
  FORMATTER_V2_INJECT_SPECIAL;

export {
  FORMATTER_V2_NAME,
  FORMATTER_V2_INJECT_DESCRIPTION_TAIL,
  FORMATTER_V2_LAYOUT,
  FORMATTER_SHARDED_BADGE_IDS,
  FORMATTER_SHARDED_SEGMENT_IDS,
  estimateV2FormatterLength,
};

export { V2_INJECT_IMPLEMENTED_IDS };
