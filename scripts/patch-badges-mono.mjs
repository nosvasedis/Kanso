/**
 * True monochrome badges — black fill, white text & stroke (languages unchanged).
 */
import { applyMonoTheme, MONO_GROUP_META } from "./badge-mono-theme.mjs";
import {
  patchBadgeFile,
  MONO_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
  TRANSPARENT_ICONS_MANIFEST_PATH,
} from "./badge-patch.mjs";
import { pushGistAfterPatch } from "./gist-push.mjs";

const result = await patchBadgeFile({
  badgesPath: MONO_BADGES_PATH,
  templatePath: TRANSPARENT_BADGES_PATH,
  applyTheme: applyMonoTheme,
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

await pushGistAfterPatch("mono");
