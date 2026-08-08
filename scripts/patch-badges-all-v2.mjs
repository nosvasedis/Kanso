/**
 * Regenerate marker-only patterns on all three production badge packs.
 */
import { patchBadgeFileV2 } from "./badge-patch-v2.mjs";
import {
  MONO_BADGES_PATH,
  SOLID_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
} from "./badge-patch.mjs";

const sets = [
  ["solid", SOLID_BADGES_PATH],
  ["transparent", TRANSPARENT_BADGES_PATH],
  ["mono", MONO_BADGES_PATH],
];

for (const [label, badgesPath] of sets) {
  const result = await patchBadgeFileV2({ badgesPath, forceAll: false });
  console.log(
    `${label}: ${result.badgesPath} (${result.v2PatternCount} marker-only / ${result.filterCount} filters${result.hybridCount ? `, ${result.hybridCount} hybrid` : ""})`
  );
}
