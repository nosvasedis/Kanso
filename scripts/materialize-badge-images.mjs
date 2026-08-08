#!/usr/bin/env node
/**
 * Download every unique badge imageURL from production packs into a
 * content-addressed local tree and rewrite theme manifests to CDN URLs.
 *
 *   badges/badge-images/files/{hash16}.png
 *   badges/badge-images/manifest.json
 *   badges/icons-urls.json / icons-urls-solid.json / icons-urls-transparent.json
 *   badges/kingsizew-icons.json  (CDN mirrors of former kingsizew raw URLs)
 *   scripts/canonical-icon-urls.mjs regenerated
 *
 * Usage:
 *   node scripts/materialize-badge-images.mjs
 *   node scripts/materialize-badge-images.mjs --concurrency=8
 */
import fs from "node:fs/promises";
import path from "node:path";
import {
  ROOT,
  BADGE_IMAGES_DIR,
  BADGE_IMAGE_FILES_DIR,
  BADGE_IMAGE_MANIFEST_PATH,
  hashIconBuffer,
  iconFileName,
  cdnUrlForHash,
  relativeIconPath,
} from "./icon-cdn.mjs";
import { CANONICAL_ICON_URLS } from "./canonical-icon-urls.mjs";

const PACKS = {
  solid: "kanso-solid.json",
  transparent: "kanso-transparent.json",
  mono: "kanso-mono.json",
};

function parseArgs(argv) {
  let concurrency = 8;
  for (const arg of argv) {
    if (arg.startsWith("--concurrency=")) {
      concurrency = Math.max(1, Number(arg.slice("--concurrency=".length)) || 8);
    }
  }
  return { concurrency };
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

async function fetchBuffer(url) {
  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const { concurrency } = parseArgs(process.argv.slice(2));
  await fs.mkdir(BADGE_IMAGE_FILES_DIR, { recursive: true });

  /** @type {Map<string, { themes: Set<string>, ids: Set<string> }>} */
  const urlMeta = new Map();
  /** theme -> id -> url */
  const themeMaps = { solid: {}, transparent: {}, mono: {} };

  for (const [theme, file] of Object.entries(PACKS)) {
    const data = JSON.parse(await fs.readFile(path.join(ROOT, file), "utf8"));
    for (const f of data.filters) {
      if (!f.imageURL) continue;
      themeMaps[theme][f.id] = f.imageURL;
      if (!urlMeta.has(f.imageURL)) {
        urlMeta.set(f.imageURL, { themes: new Set(), ids: new Set() });
      }
      urlMeta.get(f.imageURL).themes.add(theme);
      urlMeta.get(f.imageURL).ids.add(f.id);
    }
  }

  const urls = [...urlMeta.keys()];
  console.log(
    `materialize: fetching ${urls.length} unique icons (concurrency=${concurrency})`
  );

  /** @type {Map<string, { hash: string, file: string, bytes: number, cdnUrl: string }>} */
  const urlToStored = new Map();
  const hashSeen = new Set();
  let written = 0;
  let reused = 0;

  const fetchResults = await mapPool(urls, concurrency, async (url) => {
    try {
      const buffer = await fetchBuffer(url);
      return { url, buffer, error: null };
    } catch (err) {
      return { url, buffer: null, error: String(err?.message || err) };
    }
  });

  const failures = [];
  for (const row of fetchResults) {
    if (row.error || !row.buffer) {
      failures.push(row);
      continue;
    }
    const hash = hashIconBuffer(row.buffer);
    const file = iconFileName(hash);
    const outPath = path.join(BADGE_IMAGE_FILES_DIR, file);
    if (!hashSeen.has(hash)) {
      hashSeen.add(hash);
      try {
        await fs.access(outPath);
        reused++;
      } catch {
        await fs.writeFile(outPath, row.buffer);
        written++;
      }
    } else {
      reused++;
    }
    urlToStored.set(row.url, {
      hash,
      file,
      bytes: row.buffer.length,
      cdnUrl: cdnUrlForHash(hash),
      relative: relativeIconPath(hash),
    });
  }

  if (failures.length) {
    console.error(`materialize: ${failures.length} download failures:`);
    for (const f of failures) console.error(`  ${f.url}: ${f.error}`);
    process.exitCode = 1;
  }

  /** theme -> id -> cdnUrl */
  const themeCdn = { solid: {}, transparent: {}, mono: {} };
  for (const [theme, idMap] of Object.entries(themeMaps)) {
    for (const [id, url] of Object.entries(idMap)) {
      const stored = urlToStored.get(url);
      if (!stored) continue;
      themeCdn[theme][id] = stored.cdnUrl;
    }
  }

  // Shared / base manifest: prefer solid, then transparent, then mono for each id
  const baseUrls = {};
  for (const id of new Set([
    ...Object.keys(themeCdn.solid),
    ...Object.keys(themeCdn.transparent),
    ...Object.keys(themeCdn.mono),
  ])) {
    baseUrls[id] =
      themeCdn.solid[id] || themeCdn.transparent[id] || themeCdn.mono[id];
  }

  // kingsizew-icons: any id that previously pointed at kingsizew, now CDN
  let kingsizePrev = {};
  try {
    kingsizePrev = JSON.parse(
      await fs.readFile(path.join(ROOT, "badges", "kingsizew-icons.json"), "utf8")
    );
  } catch {
    /* optional */
  }
  const kingsizeNext = {};
  for (const id of Object.keys(kingsizePrev)) {
    const url =
      themeCdn.solid[id] ||
      themeCdn.transparent[id] ||
      themeCdn.mono[id] ||
      baseUrls[id];
    if (url) kingsizeNext[id] = url;
  }

  // Canonical IDs keep solid CDN URLs
  const canonicalNext = {};
  for (const id of Object.keys(CANONICAL_ICON_URLS)) {
    if (themeCdn.solid[id]) canonicalNext[id] = themeCdn.solid[id];
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    uniqueSourceUrls: urls.length,
    uniqueHashes: hashSeen.size,
    written,
    filesDir: "files",
    themes: themeCdn,
    sourceUrlToHash: Object.fromEntries(
      [...urlToStored.entries()].map(([url, s]) => [url, s.hash])
    ),
  };

  await fs.writeFile(
    BADGE_IMAGE_MANIFEST_PATH,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(ROOT, "badges", "icons-urls.json"),
    JSON.stringify(baseUrls, null, 2) + "\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(ROOT, "badges", "icons-urls-solid.json"),
    JSON.stringify(themeCdn.solid, null, 2) + "\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(ROOT, "badges", "icons-urls-transparent.json"),
    JSON.stringify(themeCdn.transparent, null, 2) + "\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(ROOT, "badges", "kingsizew-icons.json"),
    JSON.stringify(kingsizeNext, null, 2) + "\n",
    "utf8"
  );

  const canonicalSrc = `/**
 * Stable CDN sources for Tiers / Quality / Release / Resolution badges.
 * Content-hashed files on nosvasedis/badge-images (jsDelivr).
 * Regenerated by scripts/materialize-badge-images.mjs
 */
export const CANONICAL_ICON_URLS = ${JSON.stringify(canonicalNext, null, 2)};
`;
  await fs.writeFile(
    path.join(ROOT, "scripts", "canonical-icon-urls.mjs"),
    canonicalSrc,
    "utf8"
  );

  // README for the published repo (copied by publish script)
  const readme = `# nosvasedis badge-images

Content-addressed PNG icons for [nosvasedis](https://gist.github.com/nosvasedis) Nuvio badge packs.

Served via jsDelivr:

\`\`\`text
https://cdn.jsdelivr.net/gh/nosvasedis/badge-images@main/files/<hash16>.png
\`\`\`

Do not edit files by hand — regenerate from the formatter workspace with:

\`\`\`bash
node scripts/materialize-badge-images.mjs
node scripts/publish-badge-images.mjs
\`\`\`
`;
  await fs.writeFile(path.join(BADGE_IMAGES_DIR, "README.md"), readme, "utf8");

  console.log(
    `materialize: wrote ${written} new files, ${hashSeen.size} unique hashes, ${failures.length} failures`
  );
  console.log(`  ${BADGE_IMAGE_MANIFEST_PATH}`);
  console.log(
    `  icons-urls solid=${Object.keys(themeCdn.solid).length} transparent=${Object.keys(themeCdn.transparent).length} base=${Object.keys(baseUrls).length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
