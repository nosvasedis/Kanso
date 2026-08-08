/**
 * Transparent badge set — clear fill + colored category strokes.
 */
import { applyTransparentTheme, MONO_GROUP_META } from "./badge-transparent-theme.mjs";
import {
  patchBadgeFile,
  TRANSPARENT_BADGES_PATH,
  TRANSPARENT_ICONS_MANIFEST_PATH,
} from "./badge-patch.mjs";
import { pushGistAfterPatch } from "./gist-push.mjs";

const result = await patchBadgeFile({
  badgesPath: TRANSPARENT_BADGES_PATH,
  applyTheme: applyTransparentTheme,
  groupMeta: MONO_GROUP_META,
  iconsManifestPath: TRANSPARENT_ICONS_MANIFEST_PATH,
});

console.log(`Patched ${result.badgesPath}`);
console.log(`Filters: ${result.filterCount}, Groups: ${result.groupCount}`);
console.log(`Icons in manifest: ${result.iconCount}`);
if (result.missingIcons.length) {
  console.warn(`Missing imageURL: ${result.missingIcons.join(", ")}`);
} else {
  console.log("All filters have imageURL.");
}

await pushGistAfterPatch("transparent");
