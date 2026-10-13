/**
 * 3D / MP3 / PCM are Kanso extras, not kingsizew. Black-on-clear sources
 * match Mono White; invert ink to white for Solid, Transparent and Outline.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { BADGE_IMAGE_FILES_DIR, hashIconBuffer, cdnUrlForHash } from "./icon-cdn.mjs";
import { publishIconBuffer } from "./publish-local-icon.mjs";

export const LOCAL_EXTRA_IDS = ["v-3d", "a-mp3", "a-pcm"];

const BLACK_FILES = {
  "v-3d": "36fb177f01db3c14.png",
  "a-mp3": "9bae7abaa8001114.png",
  "a-pcm": "d800966aec9e9818.png",
};

function extraInk(id, skin) {
  if (skin === "mono") return "black";
  if (id === "v-3d" && skin === "solid") return "black";
  return "white";
}

export async function invertGlyphInk(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

export async function localExtraUrls() {
  const urls = {};
  for (const [id, file] of Object.entries(BLACK_FILES)) {
    const black = await fs.readFile(path.join(BADGE_IMAGE_FILES_DIR, file));
    urls[id] = {
      black: cdnUrlForHash(hashIconBuffer(black)),
      white: await publishIconBuffer(await invertGlyphInk(black)),
    };
  }
  return urls;
}

export async function applyLocalExtraGlyphs(appearance) {
  const urls = await localExtraUrls();
  for (const [skin, theme] of Object.entries(appearance.themes)) {
    for (const id of LOCAL_EXTRA_IDS) {
      const look = theme.filters[id];
      if (!look) continue;
      look.imageURL = extraInk(id, skin) === "white" ? urls[id].white : urls[id].black;
    }
  }
  return urls;
}

const APPEARANCE_PATH = path.join(BADGE_IMAGE_FILES_DIR, "..", "..", "illustrated-appearance.json");

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const appearance = JSON.parse(await fs.readFile(APPEARANCE_PATH, "utf8"));
  const urls = await applyLocalExtraGlyphs(appearance);
  await fs.writeFile(APPEARANCE_PATH, JSON.stringify(appearance, null, 2) + "\n");
  console.log(urls);
}
