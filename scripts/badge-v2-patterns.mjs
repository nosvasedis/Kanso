/**
 * V2 badge patterns — marker-only when inject fits; v1 regex when segment sharded.
 */
import {
  ALL_V2_BADGE_IDS,
  V2_INJECT_IMPLEMENTED_IDS,
  v2PatternForBadge,
} from "./formatter-markers.mjs";
import { FORMATTER_SHARDED_BADGE_IDS } from "./formatter-budget.mjs";

/** @param {string} badgeId @param {string} [v1Pattern] */
export function getV2Pattern(badgeId, v1Pattern) {
  if (FORMATTER_SHARDED_BADGE_IDS.has(badgeId) && v1Pattern) {
    return v1Pattern;
  }
  return v2PatternForBadge(badgeId);
}

/**
 * Apply v2 pattern when badge has inject coverage (or forceAll).
 * @param {object} filter
 * @param {{ forceAll?: boolean, v1Pattern?: string }} [opts]
 */
export function applyV2Pattern(filter, opts = {}) {
  const v1Pattern = opts.v1Pattern ?? filter.pattern;
  const pattern = getV2Pattern(filter.id, v1Pattern);
  if (!pattern) return filter;
  if (
    !opts.forceAll &&
    !V2_INJECT_IMPLEMENTED_IDS.has(filter.id) &&
    !FORMATTER_SHARDED_BADGE_IDS.has(filter.id)
  ) {
    return filter;
  }
  filter.pattern = pattern;
  return filter;
}

/** @param {object[]} filters @param {{ forceAll?: boolean }} [opts] */
export function applyV2Patterns(filters, opts = {}) {
  return filters.map((f) => applyV2Pattern({ ...f }, opts));
}

export { ALL_V2_BADGE_IDS, V2_INJECT_IMPLEMENTED_IDS, FORMATTER_SHARDED_BADGE_IDS };
