/**
 * Dev helper — breakdown formatter v2 char budget.
 */
import { loadTierGroupsFromBadgesSync, buildTierInjectPartsSync } from "./tier-inject-generator.mjs";
import { SYNC_TIER_IDS } from "./tier-group-sync.mjs";

const groups = loadTierGroupsFromBadgesSync();
const { rse, rgChain, unranked, tiers: full } = buildTierInjectPartsSync(groups);

console.log("tier breakdown:");
console.log("  rse:", rse.length);
console.log("  rgChain:", rgChain.length);
console.log("  unranked:", unranked.length);
console.log("  total:", full.length);

for (const prefix of ["web", "blu-ray", "remux"]) {
  let ranked = [];
  for (const id of SYNC_TIER_IDS) {
    const g = groups[id] ?? [];
    if (id.startsWith(`${prefix}-`) || (prefix === "remux" && id.startsWith("remux-"))) {
      ranked.push(...g);
    }
  }
  const unique = [...new Set(ranked)];
  console.log(
    `${prefix}: ${ranked.length} entries, ${unique.length} unique`
  );
}

let rgGroups = 0;
for (const id of SYNC_TIER_IDS) rgGroups += (groups[id] ?? []).length;
console.log("rg replace entries:", rgGroups);
