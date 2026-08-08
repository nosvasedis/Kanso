/**
 * Apply marker-only patterns to nosvasedis-badges-mono.json.
 */
import { patchBadgeFileV2 } from "./badge-patch-v2.mjs";
import { MONO_BADGES_PATH } from "./badge-patch.mjs";

const result = await patchBadgeFileV2({
  badgesPath: MONO_BADGES_PATH,
  forceAll: false,
});

console.log(`mono markers: ${result.badgesPath}`);
console.log(
  `Marker-only patterns applied: ${result.v2PatternCount} (implemented inject subset)`
);
