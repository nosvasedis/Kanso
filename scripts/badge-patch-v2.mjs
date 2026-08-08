/**
 * Apply marker-only patterns to a badge JSON file (writes production path in place).
 */
import fs from "fs/promises";
import { applyV2Patterns } from "./badge-v2-patterns.mjs";
import { FORMATTER_SHARDED_BADGE_IDS } from "./formatter-budget.mjs";
import { BADGE_SYNC_PATHS, SOLID_BADGES_PATH } from "./badge-patch.mjs";

/**
 * @param {object} opts
 * @param {string} [opts.badgesPath]
 * @param {boolean} [opts.forceAll] Apply marker patterns to all badges (dev only)
 */
export async function patchBadgeFileV2(opts = {}) {
  const badgesPath = opts.badgesPath ?? SOLID_BADGES_PATH;

  const raw = await fs.readFile(badgesPath, "utf8");
  const data = JSON.parse(raw);
  const filters = applyV2Patterns(data.filters, { forceAll: opts.forceAll ?? false });
  const v2PatternCount = filters.filter(
    (f) => f.pattern?.startsWith("(?s)^") && !f.pattern.includes("(?:^\\[")
  ).length;
  const hybridCount = filters.filter((f) =>
    FORMATTER_SHARDED_BADGE_IDS.has(f.id)
  ).length;

  await fs.writeFile(
    badgesPath,
    JSON.stringify({ ...data, filters }, null, 2) + "\n"
  );

  return {
    badgesPath,
    filterCount: filters.length,
    v2PatternCount,
    hybridCount,
    forceAll: opts.forceAll ?? false,
  };
}

export { BADGE_SYNC_PATHS, SOLID_BADGES_PATH };
