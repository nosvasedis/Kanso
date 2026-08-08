import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { EDITION_BADGES } from "./edition-badges.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function inkPixels(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  let ink = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 24) ink++;
  }
  const minInk = Math.max(80, Math.floor(info.width * info.height * 0.02));
  return { ink, minInk, width: info.width, height: info.height };
}

let failed = 0;
async function checkSet(label, dir) {
  for (const { id, file } of EDITION_BADGES) {
    const filePath = path.join(root, dir, file);
    try {
      const stat = await fs.stat(filePath);
      if (stat.size < 400) {
        console.error(`FAIL ${label} ${id}: file too small (${stat.size} bytes)`);
        failed++;
        continue;
      }
      const { ink, minInk } = await inkPixels(filePath);
      if (ink < minInk) {
        console.error(`FAIL ${label} ${id}: mostly transparent (${ink} ink pixels)`);
        failed++;
      }
    } catch (err) {
      console.error(`FAIL ${label} ${id}: ${err.message}`);
      failed++;
    }
  }
}

await checkSet("generated", "badges/generated");
await checkSet("transparent", "badges/generated-transparent");

if (!failed) console.log("All edition icon files have visible ink.");
process.exit(failed ? 1 : 0);
