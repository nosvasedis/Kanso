/**
 * Download Smart Tier badge art from kingsizew/badges (GitHub raw).
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "badges", "generated", "kingsizew");
const base =
  "https://raw.githubusercontent.com/kingsizew/badges/main/badge-images";

/** filter id -> source path under badge-images/ */
const ASSETS = {
  "v-dv-hdr10p": "visual/dolby-vision-hdr10-plus.png",
  "v-dv-hdr10": "visual/dolby-vision-hdr10.png",
  "v-dv-hdr": "visual/dolby-vision-hdr.png",
  "a-at-th": "audio/dolby-atmos-truehd.png",
  "a-at-dp": "audio/dolby-atmos-digital-plus.png",
  "a-dtsx-ma": "audio/dts-x-hd-ma.png",
  "a-dtsx-hd": "audio/dts-x-hd.png",
  "a-dtses": "audio/dts-es.png",
  "v-hlg": "visual/hlg.png",
  "v-10bit": "visual/10bit.png",
  "v-ai": "visual/ai.png",
  "seadex-release": "special-tags/seadex.png",
  "proper-release": "special-tags/proper.png",
  "hybrid-release": "special-tags/hybrid.png",
  "criterion-collection": "special-tags/criterion.png",
  "repack-release": "special-tags/repack.png",
  "remastered-release": "special-tags/remastered.png",
  "open-matte-edition": "special-tags/open-matte.png",
  "regraded-release": "special-tags/regraded.png",
  "edition-directors-cut": "special-tags/directors-cut.png",
  "edition-extended": "special-tags/extended.png",
  "uncut-edition": "special-tags/uncut.png",
  "uncensored-edition": "special-tags/uncensored.png",
  "edition-theatrical": "special-tags/theatrical.png",
  "edition-bw": "special-tags/black-and-white.png",
  "edition-true-hue": "special-tags/true-hue.png",
  "r-1440": "resolution/1440p.png",
};

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const urls = {};

  for (const [id, rel] of Object.entries(ASSETS)) {
    const url = `${base}/${rel}`;
    const file = `${id}.png`;
    const dest = path.join(outDir, file);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed ${url}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    urls[id] = url;
    console.log("saved", file, buf.length, "bytes");
  }

  const manifestPath = path.join(root, "badges", "kingsizew-icons.json");
  await fs.writeFile(manifestPath, JSON.stringify(urls, null, 2) + "\n");
  console.log("wrote", manifestPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
