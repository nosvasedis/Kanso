/**
 * Solid badge set — opaque colored fills (main pill style).
 */
import { SOLID_ICONS_MANIFEST_PATH } from "./badge-solid-icons.mjs";
import { applySolidTheme, solidGroupMeta } from "./badge-solid-theme.mjs";
import {
  patchBadgeFile,
  SOLID_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
} from "./badge-patch.mjs";
import { pushGistAfterPatch } from "./gist-push.mjs";

const result = await patchBadgeFile({
  badgesPath: SOLID_BADGES_PATH,
  templatePath: TRANSPARENT_BADGES_PATH,
  applyTheme: applySolidTheme,
  groupMeta: solidGroupMeta(),
  iconsManifestPath: SOLID_ICONS_MANIFEST_PATH,
});

console.log(`Patched ${result.badgesPath}`);
console.log(`Filters: ${result.filterCount}, Groups: ${result.groupCount}`);
console.log(`Icons in manifest: ${result.iconCount}`);
if (result.missingIcons.length) {
  console.warn(`Missing imageURL: ${result.missingIcons.join(", ")}`);
} else {
  console.log("All filters have imageURL.");
}

await pushGistAfterPatch("solid");
