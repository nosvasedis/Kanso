/** @typedef {{ id: string, pattern: string }} Filter */

export const UNRANKED_TIER_MAP = {
  "web-unranked": ["web-1", "web-2", "web-3", "web-4", "web-5", "web-6"],
  "blu-ray-unranked": [
    "blu-ray-1",
    "blu-ray-2",
    "blu-ray-3",
    "blu-ray-4",
    "blu-ray-5",
    "blu-ray-6",
    "blu-ray-7",
    "blu-ray-8",
  ],
  "remux-unranked": ["remux-1", "remux-2", "remux-3"],
};

const TIER_GROUP_START = "(?:(?=.*(?:(?:^\\[(?:";

export function tierPatternBody(pattern) {
  return pattern.replace(/^\(\?i\)\^/, "").replace(/\)\.\*\$$/, "");
}

/** Source anchor through cross-type guards, before any tier group match. */
export function extractSourceAnchor(tierPattern) {
  const body = tierPatternBody(tierPattern);
  const tierStart = body.indexOf(TIER_GROUP_START);
  if (tierStart === -1) {
    throw new Error(`Could not extract source anchor from: ${body.slice(0, 120)}…`);
  }
  return body.slice(0, tierStart);
}

export function buildUnrankedPattern(unrankedId, filtersById) {
  const tierIds = UNRANKED_TIER_MAP[unrankedId];
  if (!tierIds?.length) {
    throw new Error(`Unknown unranked id: ${unrankedId}`);
  }

  const anchor = extractSourceAnchor(filtersById[tierIds[0]].pattern);
  const exclusions = tierIds
    .map((id) => `(?!${tierPatternBody(filtersById[id].pattern)})`)
    .join("");

  return `(?i)^${anchor}${exclusions}.*$`;
}

/** @param {Filter[]} filters */
export function applyUnrankedPatternFixes(filters) {
  const filtersById = Object.fromEntries(filters.map((f) => [f.id, f]));

  for (const unrankedId of Object.keys(UNRANKED_TIER_MAP)) {
    const filter = filtersById[unrankedId];
    if (!filter) continue;
    // Marker-only v2 patterns already encode ranked-tier exclusions in the
    // registry. This helper rebuilds legacy filename regexes only.
    if (filter.pattern?.startsWith("(?s)^")) continue;
    filter.pattern = buildUnrankedPattern(unrankedId, filtersById);
  }

  return filters;
}
