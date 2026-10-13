/**
 * Rehost kingsizew/badges glyphs into Kanso /files and write four-skin appearance.
 * Instant matching stays in the Kanso engine; this script only copies art + colors.
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
import { LANGUAGE_CATALOG } from "./language-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const APPEARANCE_PATH = path.join(ROOT, "badges", "illustrated-appearance.json");
const RAW = "https://raw.githubusercontent.com/kingsizew/badges/main";
const API = "https://api.github.com/repos/kingsizew/badges/contents";

const SKIN_SOURCES = {
  solid: "solid_badges_v2.json",
  transparent: "badge_v2.json",
  mono: "mono_white_badges_v2.json",
  outline: "colored_outline_badges_v2.json",
};

const ID_ALIASES = {
  "r-1440p": "r-1440",
  "r-144p": "r-144",
  "a-atmos-truehd": "a-at-th",
  "a-atmos-ddp": "a-at-dp",
  "a-atmos-ddplus": "a-at-dp",
  "gs-peacock": "s-pcok",
  "s-h265": "ge-hevc",
  "s-h264": "ge-avc",
  "q-webrip": "q-wr",
  "q-web-dl": "q-w",
  "q-webdl": "q-w",
  "q-bluray": "q-b",
  "q-remux": "q-r",
  "q-hdrip": "q-hdrip",
  "q-dvdrip": "q-dvdrip",
  "q-screener": "q-scr",
  "q-telecine": "q-tc",
  "q-telesync": "q-ts",
};

const APPEARANCE_FALLBACK = {
  "q-wr": "q-w",
  "q-hdrip": "q-hdtv",
  "q-dvdrip": "q-hdtv",
  "q-scr": "q-cam",
  "q-tc": "q-cam",
  "q-ts": "q-cam",
  "r-144": "r-240",
  "a-mp3": "a-aac",
  "a-pcm": "a-flac",
  "v-3d": "v-imax",
  "ge-xvid": "ge-avc",
  "ge-divx": "ge-avc",
};

function canonicalizeId(id) {
  return ID_ALIASES[id] || id;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "user-agent": "kanso-import" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { "user-agent": "kanso-import" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function pickVariant(names, preferred) {
  for (const name of preferred) {
    if (names.includes(name)) return name;
  }
  return names[0];
}

function languageFileForSkin(base, files, skin) {
  const names = files.filter((n) => n === `${base}.png` || n.startsWith(`${base}-`));
  if (skin === "solid" || skin === "mono") {
    return pickVariant(names, [`${base}-black.png`, `${base}.png`]);
  }
  if (skin === "transparent") {
    return pickVariant(names, [`${base}-white.png`, `${base}-light-blue.png`, `${base}.png`]);
  }
  return pickVariant(names, [`${base}.png`, `${base}-light-blue.png`, `${base}-white.png`]);
}

async function listPngs(folder) {
  const rows = await fetchJson(`${API}/badge-images/${folder}`);
  return rows.filter((r) => r.type === "file" && r.name.endsWith(".png")).map((r) => r.name);
}

async function hostPng(url, cache) {
  if (cache.has(url)) return cache.get(url);
  const buf = await fetchBuffer(url);
  const hash = hashIconBuffer(buf);
  const file = iconFileName(hash);
  await fs.writeFile(path.join(BADGE_IMAGE_FILES_DIR, file), buf);
  const hosted = { hash, file, imageURL: cdnUrlForHash(hash) };
  cache.set(url, hosted);
  return hosted;
}

function extractFilterLook(filter) {
  return {
    name: filter.name,
    imageURL: filter.imageURL,
    tagColor: filter.tagColor,
    textColor: filter.textColor,
    borderColor: filter.borderColor,
    tagStyle: filter.tagStyle,
  };
}

function cloneLook(look, imageURL) {
  return { ...look, imageURL };
}

async function main() {
  await fs.mkdir(BADGE_IMAGE_FILES_DIR, { recursive: true });
  const cache = new Map();
  const manifest = await fetchJson(`${RAW}/badge-images/manifest.json`);
  const languageFiles = await listPngs("language");
  const subtitleFiles = await listPngs("subtitle");

  const skins = {};
  for (const [skin, file] of Object.entries(SKIN_SOURCES)) {
    const pack = await fetchJson(`${RAW}/${file}`);
    const byId = {};
    for (const filter of pack.filters ?? []) {
      byId[canonicalizeId(filter.id)] = extractFilterLook(filter);
    }
    skins[skin] = { raw: pack, byId };
  }

  const hostedBySource = new Map();
  for (const item of manifest) {
    const id = canonicalizeId(item.id);
    hostedBySource.set(id, await hostPng(item.rawURL.replace(/\?rev=.*$/, ""), cache));
  }

  const languageHosted = {};
  const subtitleHosted = {};
  for (const lang of LANGUAGE_CATALOG) {
    languageHosted[lang.id] = {};
    subtitleHosted[subtitleId(lang)] = {};
    for (const skin of Object.keys(SKIN_SOURCES)) {
      const langFile = languageFileForSkin(lang.file, languageFiles, skin);
      const subFile = languageFileForSkin(lang.file, subtitleFiles, skin);
      languageHosted[lang.id][skin] = await hostPng(
        `${RAW}/badge-images/language/${langFile}`,
        cache
      );
      subtitleHosted[subtitleId(lang)][skin] = await hostPng(
        `${RAW}/badge-images/subtitle/${subFile}`,
        cache
      );
    }
  }

  const appearance = {
    version: 2,
    source:
      "Kingsizew glyphs rehosted for Kanso Instant packs. Skins: Solid, Default Colored, Mono White, Colored Outline.",
    credit: "https://github.com/kingsizew/badges",
    themes: {},
  };

  for (const skin of Object.keys(SKIN_SOURCES)) {
    const byId = { ...skins[skin].byId };
    const groups = (skins[skin].raw.groups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      color: g.color,
      borderColor: g.borderColor,
    }));

    for (const [id, hosted] of hostedBySource) {
      const look = byId[id] ?? cloneFromFallback(byId, id);
      if (!look) continue;
      byId[id] = cloneLook(look, hosted.imageURL);
    }

    for (const lang of LANGUAGE_CATALOG) {
      const look =
        byId[lang.id] ??
        defaultChipLook(skin, lang.name, groups, "gl");
      byId[lang.id] = cloneLook(look, languageHosted[lang.id][skin].imageURL);
      const subId = subtitleId(lang);
      const subLook =
        byId[subId] ??
        defaultChipLook(skin, `${lang.name} SUB`, groups, "gsub");
      byId[subId] = cloneLook(subLook, subtitleHosted[subId][skin].imageURL);
    }

    appearance.themes[skin] = { filters: byId, groups };
  }

  await fs.writeFile(APPEARANCE_PATH, JSON.stringify(appearance, null, 2) + "\n");
  console.log(
    `Imported ${cache.size} unique PNGs into ${path.relative(ROOT, BADGE_IMAGE_FILES_DIR)}`
  );
  console.log(`Wrote ${path.relative(ROOT, APPEARANCE_PATH)}`);
}

function subtitleId(lang) {
  return `sub-${lang.id.slice(2)}`;
}

function cloneFromFallback(byId, id) {
  const from = APPEARANCE_FALLBACK[id];
  return from && byId[from] ? { ...byId[from] } : byId[id];
}

function defaultChipLook(skin, name, groups, groupId) {
  const group = groups.find((g) => g.id === groupId);
  if (skin === "solid") {
    return {
      name,
      tagColor: "#455A64",
      textColor: "#FFFFFF",
      borderColor: "#FF455A64",
      tagStyle: "filled",
    };
  }
  if (skin === "mono") {
    return {
      name,
      tagColor: "#FFFFFF",
      textColor: "#000000",
      borderColor: "#FFFFFFFF",
      tagStyle: "filled",
    };
  }
  if (skin === "outline") {
    return {
      name,
      tagColor: "#00000000",
      textColor: "#FFFFFF",
      borderColor: group?.borderColor ?? "#FFFFFFFF",
      tagStyle: "filled and bordered",
    };
  }
  return {
    name,
    tagColor: "#000000",
    textColor: "#FFFFFF",
    borderColor: group?.borderColor ?? "#FFFFFFFF",
    tagStyle: "filled and bordered",
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
