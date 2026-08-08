/**
 * Apply marker-only patterns to nosvasedis-badges-solid.json.
 */
import { patchBadgeFileV2 } from "./badge-patch-v2.mjs";
import { SOLID_BADGES_PATH } from "./badge-patch.mjs";

const result = await patchBadgeFileV2({
  badgesPath: SOLID_BADGES_PATH,
  forceAll: false,
});

console.log(`solid markers: ${result.badgesPath}`);
console.log(
  `Marker-only patterns applied: ${result.v2PatternCount} (implemented inject subset)`
);
