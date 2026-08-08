import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { SOLID_DARK_ICON_IDS } from "./badge-solid-icons.mjs";
import { STANDARD_FILE_BY_ID } from "./mono-standard-sources.mjs";

const solidDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "badges", "generated-solid");

let failed = 0;
for (const id of SOLID_DARK_ICON_IDS) {
  const file = STANDARD_FILE_BY_ID[id] ?? `${id}.png`;
  const filePath = path.join(solidDir, file);
  try {
    const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });
    let dark = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 32) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 128) dark++;
    }
    const min = Math.max(200, Math.floor(info.width * info.height * 0.01));
    if (dark < min) {
      console.error(`FAIL ${id} (${file}): too little black ink (${dark} px)`);
      failed++;
    }
  } catch (err) {
    console.error(`FAIL ${id}: ${err.message}`);
    failed++;
  }
}

if (!failed) console.log(`All ${SOLID_DARK_ICON_IDS.length} solid dark icons have visible black ink.`);
process.exit(failed ? 1 : 0);
