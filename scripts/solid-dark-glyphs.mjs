/**
 * Solid specials and picture chips sit on colored fills. Invert any
 * remaining light kingsizew glyphs so the ink is black.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { SPECIAL_DISPLAY_IDS, DISPLAY_FILTER_ORDER } from "./preset-badges.mjs";
import { BADGE_IMAGE_FILES_DIR } from "./icon-cdn.mjs";
import { publishIconBuffer } from "./publish-local-icon.mjs";
import { applyLocalExtraGlyphs, invertGlyphInk } from "./local-extra-glyphs.mjs";

export function solidDarkGlyphIds() {
  return new Set([...SPECIAL_DISPLAY_IDS, ...DISPLAY_FILTER_ORDER.gv]);
}

async function opaqueAvgLum(buffer) {
  const { data } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let n = 0;
  let s = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    n++;
    s += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return n ? s / n : 0;
}

export async function applySolidDarkGlyphs(appearance) {
  const solid = appearance.themes.solid;
  const cache = new Map();
  for (const id of solidDarkGlyphIds()) {
    const look = solid?.filters?.[id];
    if (!look?.imageURL) continue;
    const file = path.basename(new URL(look.imageURL).pathname);
    if (!cache.has(file)) {
      const buf = await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR, file));
      cache.set(
        file,
        (await opaqueAvgLum(buf)) < 80
          ? look.imageURL
          : await publishIconBuffer(await invertGlyphInk(buf))
      );
    }
    look.imageURL = cache.get(file);
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
  await applyLocalExtraGlyphs(appearance);
  await applySolidDarkGlyphs(appearance);
  await fs.writeFile(APPEARANCE_PATH, JSON.stringify(appearance, null, 2) + "\n");
  console.log("Applied extra glyph polarity and Solid black specials/picture glyphs");
}
