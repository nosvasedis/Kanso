/**
 * Transparent-variant icons (white on clear) from standard badge assets.
 * Run: npm run transparent:icons [-- --upload]
 */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { langSpecById, renderLangBadgeFullRect } from "./lang-badge-render.mjs";
import {
  adaptModeForId,
  allTransparentFilterIds,
  transparentOutputFile,
  resolveStandardBuffer,
} from "./mono-standard-sources.mjs";
import { adaptStandardToMono } from "./mono-icon-pipeline.mjs";
import { publishLocalIcon } from "./publish-local-icon.mjs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "badges", "generated-transparent");
const manifestPath = path.join(root, "badges", "icons-urls-transparent.json");
const iconsUrlsPath = path.join(root, "badges", "icons-urls.json");
const solidBadgesPath = path.join(root, "kanso-solid.json");
const generatedDir = path.join(root, "badges", "generated");

async function main() {
  const upload = process.argv.includes("--upload");
  await fs.mkdir(outDir, { recursive: true });

  let iconsUrls = {};
  try {
    iconsUrls = JSON.parse(await fs.readFile(iconsUrlsPath, "utf8"));
  } catch {
    console.warn("No badges/icons-urls.json — using normal badge URLs only.");
  }

  const normalData = JSON.parse(await fs.readFile(solidBadgesPath, "utf8"));
  const normalById = new Map(normalData.filters.map((f) => [f.id, f]));

  const ctx = { iconsUrls, normalById, generatedDir, root };
  /** @type {Record<string, string>} */
  const urls = {};
  let ok = 0;
  let failed = 0;

  for (const id of allTransparentFilterIds()) {
    const file = transparentOutputFile(id);

    const filePath = path.join(outDir, file);
    const mode = adaptModeForId(id);

    try {
      let pngBuffer;
      let source;
      if (mode === "languageMono") {
        const spec = langSpecById(id);
        pngBuffer = await renderLangBadgeFullRect(spec);
        source = "lang-badge-render (full rect)";
      } else {
        const resolved = await resolveStandardBuffer(id, ctx);
        source = resolved.source;
        pngBuffer = await adaptStandardToMono(resolved.buffer, mode, { filterId: id });
      }
      await sharp(pngBuffer).toFile(filePath);
      const meta = await sharp(pngBuffer).metadata();
      console.log(`Generated ${file} (${meta.width}x${meta.height}) [${id}] ← ${source}`);

      if (upload) {
        urls[id] = await publishLocalIcon(filePath);
        console.log(`  Published -> ${urls[id]}`);
      } else {
        urls[id] = `badges/generated-transparent/${file}`;
      }
      ok++;
    } catch (err) {
      console.error(`FAILED ${id}:`, err.message);
      failed++;
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(urls, null, 2) + "\n");
  console.log(`Wrote ${manifestPath} (${Object.keys(urls).length} icons, ${ok} ok, ${failed} failed)`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
