/**
 * Canonicalize Kingsize V2 ids onto Kanso ids and attach leftover extras.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BADGE_IMAGE_FILES_DIR,
  cdnUrlForHash,
  hashIconBuffer,
  iconFileName,
} from "./icon-cdn.mjs";
import { applyLocalExtraGlyphs } from "./local-extra-glyphs.mjs";
import { applySolidDarkGlyphs } from "./solid-dark-glyphs.mjs";
import { applyLanguageFlags } from "./language-flag-glyphs.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPEARANCE_PATH = path.join(ROOT, "badges", "illustrated-appearance.json");
const RAW = "https://raw.githubusercontent.com/kingsizew/badges/main/badge-images";

const ALIASES = {
  "r-576p": "r-576",
  "r-480p": "r-480",
  "r-360p": "r-360",
  "r-240p": "r-240",
  "src-webrip": "q-wr",
  "src-hdrip": "q-hdrip",
  "src-dvdrip": "q-dvdrip",
  "src-hdtv": "q-hdtv",
  "gq-scr": "q-scr",
  "gq-tc": "q-tc",
  "gq-ts": "q-ts",
  "gq-cam": "q-cam",
  "a-dtsx-hdma": "a-dtsx-ma",
  "gv-dts-es": "a-dtses",
  "black-and-white": "edition-bw",
  "true-hue-edition": "edition-true-hue",
  "v-imax-e-2": "v-imax-e",
  "v-imax-2": "v-imax",
};

const QUALITY_FILES = {
  "q-wr": "webrip",
  "q-hdrip": "hdrip",
  "q-dvdrip": "dvdrip",
  "q-hdtv": "hdtv",
  "q-scr": "scr",
  "q-tc": "tc",
  "q-ts": "ts",
  "q-cam": "cam",
  "q-r": "remux",
  "q-b": "bluray",
  "q-w": "web-dl",
};

const LOOK_FALLBACK = {
  "a-mp3": "a-aac",
  "a-pcm": "a-flac",
  "v-3d": "v-imax",
};

function qualityFile(base, skin) {
  if (skin === "solid" || skin === "mono") return `${base}-black.png`;
  return `${base}.png`;
}

async function host(url) {
  const res = await fetch(url, { headers: { "user-agent": "kanso-import" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const hash = hashIconBuffer(buf);
  await fs.writeFile(path.join(BADGE_IMAGE_FILES_DIR, iconFileName(hash)), buf);
  return cdnUrlForHash(hash);
}

async function main() {
  const appearance = JSON.parse(await fs.readFile(APPEARANCE_PATH, "utf8"));
  for (const [skin, theme] of Object.entries(appearance.themes)) {
    const filters = theme.filters;
    for (const [from, to] of Object.entries(ALIASES)) {
      if (filters[from] && !filters[to]) filters[to] = { ...filters[from] };
      else if (filters[from] && filters[to] && !filters[to].imageURL) {
        filters[to] = { ...filters[from], ...filters[to] };
      }
    }
    for (const [id, base] of Object.entries(QUALITY_FILES)) {
      const file = qualityFile(base, skin);
      const imageURL = await host(`${RAW}/quality/${file}`);
      const look = filters[id] ?? { ...filters["q-w"] };
      filters[id] = { ...look, imageURL, name: look?.name ?? id };
    }
    for (const [id, from] of Object.entries(LOOK_FALLBACK)) {
      if (!filters[id] && filters[from]) filters[id] = { ...filters[from] };
    }
  }
  await applyLocalExtraGlyphs(appearance);
  await applySolidDarkGlyphs(appearance);
  applyLanguageFlags(appearance);
  await fs.writeFile(APPEARANCE_PATH, JSON.stringify(appearance, null, 2) + "\n");
  console.log("Canonicalized Kingsize appearance ids");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
