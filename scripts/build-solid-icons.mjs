/**
 * Build solid badge icon manifest — separate from transparent/mono pipeline.
 * Solid streaming = full-color Je1992; tiers/quality = canonical CDN icons;
 * gv/ga/gc = black ink; gst/gl/editions = white art from transparent manifest.
 */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { CANONICAL_ICON_URLS } from "./canonical-icon-urls.mjs";
import { EDITION_BADGE_IDS } from "./edition-badges.mjs";
import { STREAMING_BADGES } from "./streaming-badges.mjs";
import {
  SOLID_DARK_ICON_IDS,
  SOLID_ICONS_DIR,
  SOLID_ICONS_MANIFEST_PATH,
  TRANSPARENT_ICONS_MANIFEST_PATH,
} from "./badge-solid-icons.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import {
  BF_MONO_BLURAY,
  BF_MONO_REMUX,
  BF_MONO_WEBDL,
  fetchBfReleaseCanvas,
  renderBfCamComposite,
  renderBfHdtvComposite,
  renderBfWebRipComposite,
} from "./bf-release-art.mjs";
import { RELEASE_FILTER_IDS } from "./badge-transparent-theme.mjs";
import {
  darkInkToBlack,
  fetchImage,
  fitOmniCanvas,
  fitStreamingCanvas,
  releaseWhiteOnCanvas,
  stripStreamingBackground,
} from "./mono-icon-pipeline.mjs";
import {
  STANDARD_FILE_BY_ID,
  transparentOutputFile,
} from "./mono-standard-sources.mjs";
import { EXTERNAL_IMAGES, LIGHT_ON_DARK_ICONS } from "./external-icons.mjs";
import { publishLocalIcon } from "./publish-local-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transparentDir = path.join(__dirname, "..", "badges", "generated-transparent");
const generatedDir = path.join(__dirname, "..", "badges", "generated");

const GMS_IDS = new Set(MONO_FILTER_ORDER.gms);
const GQ_IDS = new Set(MONO_FILTER_ORDER.gq);
const GR_IDS = new Set(MONO_FILTER_ORDER.gr);
const GL_IDS = new Set(MONO_FILTER_ORDER.gl);

/** Per-service solid streaming sizing (Peacock source has heavy padding). */
const STREAMING_SOLID = {
  "s-pcok": { contentHeight: 62, padLeft: 18, padRight: 10, padY: 6 },
};

/** Full-color streaming logos for solid pills (not mono-shrunk). */
async function solidStreamingBuffer(imageURL, filterId) {
  const input = await fetchImage(imageURL);
  const cfg = STREAMING_SOLID[filterId];
  if (cfg) {
    return fitStreamingCanvas(await stripStreamingBackground(input), cfg.contentHeight, {
      padLeft: cfg.padLeft,
      padRight: cfg.padRight,
      padY: cfg.padY,
    });
  }
  return fitOmniCanvas(input, 58, { trim: false });
}

async function loadTransparentManifest() {
  try {
    return JSON.parse(await fs.readFile(TRANSPARENT_ICONS_MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const upload = process.argv.includes("--upload");
  await fs.mkdir(SOLID_ICONS_DIR, { recursive: true });

  const transparentUrls = await loadTransparentManifest();
  /** @type {Record<string, string>} */
  const urls = {};

  for (const def of STREAMING_BADGES) {
    const file = def.file;
    const outPath = path.join(SOLID_ICONS_DIR, file);
    const png = await solidStreamingBuffer(def.imageURL, def.id);
    await sharp(png).toFile(outPath);
    if (upload) {
      urls[def.id] = await publishLocalIcon(outPath);
      console.log(`Streaming ${def.id} → ${urls[def.id]}`);
    } else {
      urls[def.id] = def.imageURL;
      console.log(`Streaming ${def.id} → Je1992 source`);
    }
  }

  for (const id of [...GMS_IDS, ...GQ_IDS, ...GR_IDS]) {
    if (id === "q-wr") continue;
    const canonical = CANONICAL_ICON_URLS[id];
    if (canonical) {
      urls[id] = canonical;
      continue;
    }
    const genFile = STANDARD_FILE_BY_ID[id];
    if (genFile && transparentUrls[id]) {
      urls[id] = transparentUrls[id];
      continue;
    }
    if (genFile) {
      const local = path.join(generatedDir, genFile);
      try {
        const png = await releaseWhiteOnCanvas(await fs.readFile(local), id);
        const outPath = path.join(SOLID_ICONS_DIR, genFile);
        await sharp(png).toFile(outPath);
        if (upload) {
          urls[id] = await publishLocalIcon(outPath);
          console.log(`Resolution ${id} → ${urls[id]}`);
        } else {
          urls[id] = `badges/generated-solid/${genFile}`;
        }
      } catch (e) {
        console.warn(`No icon source for ${id}: ${e.message}`);
      }
    } else {
      console.warn(`No canonical URL for ${id}`);
    }
  }

  for (const id of RELEASE_FILTER_IDS) {
    const outName =
      id === "q-wr"
        ? "webrip.png"
        : id === "q-r"
          ? "release-remux.png"
          : id === "q-b"
            ? "release-bluray.png"
            : id === "q-w"
              ? "release-webdl.png"
              : id === "q-cam"
                ? "cam.png"
                : "hdtv.png";
    const outPath = path.join(SOLID_ICONS_DIR, outName);

    let sourceBuffer;
    if (id === "q-wr") {
      sourceBuffer = await renderBfWebRipComposite();
    } else if (id === "q-r") {
      sourceBuffer = await fetchBfReleaseCanvas(BF_MONO_REMUX);
    } else if (id === "q-b") {
      sourceBuffer = await fetchBfReleaseCanvas(BF_MONO_BLURAY);
    } else if (id === "q-w") {
      sourceBuffer = await fetchBfReleaseCanvas(BF_MONO_WEBDL);
    } else if (id === "q-cam") {
      sourceBuffer = await renderBfCamComposite();
    } else {
      sourceBuffer = await renderBfHdtvComposite();
    }

    const png = await releaseWhiteOnCanvas(sourceBuffer, id);
    await sharp(png).toFile(outPath);

    if (upload) {
      urls[id] = await publishLocalIcon(outPath);
      console.log(`Release ${id} → ${urls[id]}`);
    } else {
      urls[id] = `badges/generated-solid/${outName}`;
    }
  }

  urls["seadex-release"] =
    transparentUrls["seadex-release"] ??
    LIGHT_ON_DARK_ICONS["seadex-release"] ??
    CANONICAL_ICON_URLS["seadex-release"];

  for (const id of EDITION_BADGE_IDS) {
    if (transparentUrls[id]) urls[id] = transparentUrls[id];
  }

  for (const id of GL_IDS) {
    if (transparentUrls[id]) urls[id] = transparentUrls[id];
  }

  function solidDarkFile(id) {
    return STANDARD_FILE_BY_ID[id] ?? transparentOutputFile(id);
  }

  for (const id of SOLID_DARK_ICON_IDS) {
    const file = solidDarkFile(id);
    const outPath = path.join(SOLID_ICONS_DIR, file);
    const localGenerated = path.join(generatedDir, file);
    let png;
    try {
      /** Black label PNGs from generate-icons.mjs — use as-is. */
      png = await fitOmniCanvas(await fs.readFile(localGenerated), 56);
    } catch {
      try {
        const remote = EXTERNAL_IMAGES[id];
        if (!remote) throw new Error("no EXTERNAL_IMAGES entry");
        const input = await fetchImage(remote);
        /** Omni/BF art is dark-on-clear; whiteInkToBlack was erasing it. */
        png = await fitOmniCanvas(await darkInkToBlack(input), 56);
      } catch (err) {
        console.error(`Skip ${id}: ${err.message}`);
        continue;
      }
    }
    await sharp(png).toFile(outPath);

    if (upload) {
      urls[id] = await publishLocalIcon(outPath);
      console.log(`Solid dark ${id} → ${urls[id]}`);
    } else {
      urls[id] = `badges/generated-solid/${file}`;
    }
  }

  await fs.writeFile(SOLID_ICONS_MANIFEST_PATH, JSON.stringify(urls, null, 2) + "\n");
  console.log(
    `Solid manifest ${SOLID_ICONS_MANIFEST_PATH} (${Object.keys(urls).length} entries, upload=${upload})`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
