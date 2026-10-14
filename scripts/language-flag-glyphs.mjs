/**
 * Language chips use kingsizew flag PNGs on every skin. Solid/Mono/Transparent
 * previously picked the -black/-white letter variants.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { LANGUAGE_CATALOG } from "./language-catalog.mjs";
import { BADGE_IMAGE_FILES_DIR } from "./icon-cdn.mjs";

export function applyLanguageFlags(appearance) {
  const flags = appearance.themes.outline.filters;
  for (const [skin, theme] of Object.entries(appearance.themes)) {
    if (skin === "outline") continue;
    for (const lang of LANGUAGE_CATALOG) {
      const dest = theme.filters[lang.id];
      const src = flags[lang.id];
      if (dest && src?.imageURL) dest.imageURL = src.imageURL;
    }
  }
}

const APPEARANCE_PATH = path.join(
  BADGE_IMAGE_FILES_DIR,
  "..",
  "..",
  "illustrated-appearance.json"
);

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const appearance = JSON.parse(await fs.readFile(APPEARANCE_PATH, "utf8"));
  applyLanguageFlags(appearance);
  await fs.writeFile(APPEARANCE_PATH, JSON.stringify(appearance, null, 2) + "\n");
  console.log("Language chips now use flag glyphs on every skin");
}
