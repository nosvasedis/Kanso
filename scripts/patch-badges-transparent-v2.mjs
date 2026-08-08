/**
 * Apply marker-only patterns to nosvasedis-badges-transparent.json.
 */
import { patchBadgeFileV2 } from "./badge-patch-v2.mjs";
import { TRANSPARENT_BADGES_PATH } from "./badge-patch.mjs";

const result = await patchBadgeFileV2({
  badgesPath: TRANSPARENT_BADGES_PATH,
  forceAll: false,
});

console.log(`transparent markers: ${result.badgesPath}`);
console.log(
  `Marker-only patterns applied: ${result.v2PatternCount} (implemented inject subset)`
);
