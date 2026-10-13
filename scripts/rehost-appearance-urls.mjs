import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BADGE_IMAGE_FILES_DIR,
  cdnUrlForHash,
  hashIconBuffer,
  iconFileName,
} from "./icon-cdn.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPEARANCE_PATH = path.join(ROOT, "badges", "illustrated-appearance.json");

async function host(url) {
  const res = await fetch(url, { headers: { "user-agent": "kanso-import" } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const hash = hashIconBuffer(buf);
  await fs.writeFile(path.join(BADGE_IMAGE_FILES_DIR, iconFileName(hash)), buf);
  return cdnUrlForHash(hash);
}

const appearance = JSON.parse(await fs.readFile(APPEARANCE_PATH, "utf8"));
const cache = new Map();
let n = 0;
for (const theme of Object.values(appearance.themes)) {
  for (const filter of Object.values(theme.filters)) {
    if (!filter.imageURL) continue;
    if (filter.imageURL.includes("/nosvasedis/Kanso/")) continue;
    if (!cache.has(filter.imageURL)) {
      cache.set(filter.imageURL, await host(filter.imageURL.split("?")[0]));
    }
    filter.imageURL = cache.get(filter.imageURL);
    n++;
  }
}
await fs.writeFile(APPEARANCE_PATH, JSON.stringify(appearance, null, 2) + "\n");
console.log(`Rehosted ${n} leftover Kingsize URLs (${cache.size} unique)`);
