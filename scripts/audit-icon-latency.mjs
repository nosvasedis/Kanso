#!/usr/bin/env node
/**
 * Time unique badge imageURL fetches across solid/transparent/mono packs.
 *
 * Usage:
 *   node scripts/audit-icon-latency.mjs
 *   node scripts/audit-icon-latency.mjs --out=icon-latency-results.txt
 *   node scripts/audit-icon-latency.mjs --concurrency=8
 */
import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, isLegacySlowHost } from "./icon-cdn.mjs";

const PACKS = [
  "kanso-solid.json",
  "kanso-transparent.json",
  "kanso-mono.json",
];

function parseArgs(argv) {
  let out = null;
  let concurrency = 6;
  for (const arg of argv) {
    if (arg.startsWith("--out=")) out = arg.slice("--out=".length);
    if (arg.startsWith("--concurrency=")) {
      concurrency = Math.max(1, Number(arg.slice("--concurrency=".length)) || 6);
    }
  }
  return { out, concurrency };
}

async function timeGet(url) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });
    const buf = await res.arrayBuffer();
    return {
      url,
      status: res.status,
      ms: Math.round(performance.now() - t0),
      bytes: buf.byteLength,
      ok: res.ok,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ms: Math.round(performance.now() - t0),
      bytes: 0,
      ok: false,
      error: String(err?.message || err),
    };
  }
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

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "(invalid)";
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[idx];
}

async function main() {
  const { out, concurrency } = parseArgs(process.argv.slice(2));
  const urlMeta = new Map(); // url -> { themes:Set, ids:Set }

  for (const pack of PACKS) {
    const theme = pack.replace("kanso-", "").replace(".json", "");
    const data = JSON.parse(await fs.readFile(path.join(ROOT, pack), "utf8"));
    for (const f of data.filters) {
      const url = f.imageURL;
      if (!url) continue;
      if (!urlMeta.has(url)) urlMeta.set(url, { themes: new Set(), ids: new Set() });
      const m = urlMeta.get(url);
      m.themes.add(theme);
      m.ids.add(f.id);
    }
  }

  const urls = [...urlMeta.keys()].sort();
  console.log(
    `audit-icon-latency: ${urls.length} unique URLs across ${PACKS.length} packs (concurrency=${concurrency})`
  );

  const results = await mapPool(urls, concurrency, (url) => timeGet(url));

  const byHost = new Map();
  for (const r of results) {
    const h = hostOf(r.url);
    if (!byHost.has(h)) byHost.set(h, []);
    byHost.get(h).push(r);
  }

  const lines = [];
  const push = (s = "") => {
    lines.push(s);
    console.log(s);
  };

  push(`# Icon latency audit ${new Date().toISOString()}`);
  push(`unique=${urls.length} concurrency=${concurrency}`);
  push("");

  const okMs = results.filter((r) => r.ok).map((r) => r.ms).sort((a, b) => a - b);
  const fail = results.filter((r) => !r.ok);
  push(
    `overall ok=${okMs.length} fail=${fail.length} p50=${percentile(okMs, 50)}ms p90=${percentile(okMs, 90)}ms p99=${percentile(okMs, 99)}ms max=${okMs.at(-1) ?? 0}ms`
  );
  const legacy = results.filter((r) => isLegacySlowHost(r.url));
  push(
    `legacy_hosts (catbox|kingsizew raw)=${legacy.length} of ${results.length}`
  );
  push("");

  for (const [host, rows] of [...byHost.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const ms = rows.filter((r) => r.ok).map((r) => r.ms).sort((a, b) => a - b);
    push(
      `host ${host}: n=${rows.length} fail=${rows.filter((r) => !r.ok).length} p50=${percentile(ms, 50)}ms p90=${percentile(ms, 90)}ms max=${ms.at(-1) ?? 0}ms`
    );
  }

  push("");
  push("## Slowest (top 25)");
  const slowest = [...results].sort((a, b) => b.ms - a.ms).slice(0, 25);
  for (const r of slowest) {
    const meta = urlMeta.get(r.url);
    const ids = [...(meta?.ids ?? [])].slice(0, 3).join(",");
    push(
      `${String(r.ms).padStart(5)}ms  status=${r.status} bytes=${r.bytes} ids=${ids} ${r.url}`
    );
  }

  if (fail.length) {
    push("");
    push("## Failures");
    for (const r of fail) {
      push(`${r.url}  ${r.error || `status=${r.status}`}`);
    }
  }

  if (out) {
    const outPath = path.isAbsolute(out) ? out : path.join(ROOT, out);
    await fs.writeFile(outPath, lines.join("\n") + "\n", "utf8");
    console.log(`\nwrote ${outPath}`);
  }

  // Non-zero if many failures — soft warn only for latency
  if (fail.length > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
