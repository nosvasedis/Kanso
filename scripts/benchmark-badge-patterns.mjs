/**
 * Benchmark badge filter regex cost — models Nuvio per-stream badge matching.
 *
 * Usage: node scripts/benchmark-badge-patterns.mjs [--iterations=500] [--out=benchmark-badge-results.txt]
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SOLID_BADGES_PATH } from "./badge-patch.mjs";
import { MONO_GROUP_META } from "./badge-transparent-theme.mjs";
import {
  V2_INJECT_IMPLEMENTED_IDS,
  v2PatternForBadge,
} from "./formatter-markers.mjs";
import { SEADEX_MARKER } from "./quality-rank-patterns.mjs";
import { STREAMING_MARKERS } from "./streaming-formatter-patterns.mjs";
import {
  DR_DV_MARKER,
} from "./dr-formatter-markers.mjs";
import { EDITION_EXT_MARKER } from "./edition-badge-patterns.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** @deprecated Use V2_INJECT_IMPLEMENTED_IDS from formatter-markers.mjs */
export const V2_SAFE_BADGE_IDS = V2_INJECT_IMPLEMENTED_IDS;

/** @param {string} pattern */
export function nuvioRegex(pattern) {
  let flags = "";
  let body = pattern;
  while (body.startsWith("(?i)") || body.startsWith("(?s)")) {
    if (body.startsWith("(?i)")) {
      flags += "i";
      body = body.slice(4);
    } else if (body.startsWith("(?s)")) {
      flags += "s";
      body = body.slice(4);
    }
  }
  return new RegExp(body, flags);
}

/** Mirrors StreamBadgeMatcher candidate haystacks. */
export function nuvioHaystacks(candidates) {
  const unique = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (unique.length <= 1) return unique;
  return [...unique, unique.join(" ")];
}

/** @param {string} badgeId */
function v2PatternForFilter(badgeId) {
  return v2PatternForBadge(badgeId);
}

/** @type {Array<{ id: string, name: string, desc: string, filename: string }>} */
export const STREAM_FIXTURES = [
  {
    id: "star-combo-web",
    name: "★★★★★",
    desc: "📦 MKV · 🎞️ HEVC · 👥 FLUX\n💾 30.1 GB\n✅ · ☁️ RD",
    filename:
      "Project.Hail.Mary.2026.2160p.WEB-DL.HEVC.DV.DDP5.1.Atmos-FLUX",
  },
  {
    id: "web-tier-1",
    name: "★★★☆☆",
    desc: "📦 MKV · 👥 FLUX\n💾 18.2 GB",
    filename: "Show.S01E01.1080p.WEB-DL.DDP5.1.x264-FLUX.mkv",
  },
  {
    id: "bluray-tier-3",
    name: "★★★★☆",
    desc: "📦 MKV · 👥 CtrlHD\n💾 45 GB",
    filename:
      "Movie.2024.2160p.UHD.BluRay.x265.DTS-HD.MA.5.1-CtrlHD.mkv",
  },
  {
    id: "remux-dv-atmos",
    name: "★★★★★",
    desc: `📦 MKV\n💾 62 GB${DR_DV_MARKER}${STREAMING_MARKERS["s-nflx"]}`,
    filename:
      "Project.Hail.Mary.2026.2160p.UHD.BluRay.REMUX.DV.DDP5.1.Atmos.TrueHD-FLUX",
  },
  {
    id: "dv-combo-heavy",
    name: "★★★★★",
    desc: "📦 MKV · 🎞️ HEVC",
    filename:
      "Spider-Noir S01E01 2160p AMZN WEB-DL DDP5 1 Atmos DV HDR10Plus H265-Kitsune.mkv",
  },
  {
    id: "language-multi",
    name: "★★★☆☆",
    desc: "📦 MKV",
    filename:
      "Movie.2024.2160p.WEB-DL.Multi.English.French.German.Spanish.Japanese.DDP5.1-GROUP",
  },
  {
    id: "streaming-markers",
    name: "★★★★☆",
    desc: `📦 MKV\n💾 12 GB${SEADEX_MARKER}${STREAMING_MARKERS["s-dsnp"]}${EDITION_EXT_MARKER}`,
    filename: "Series.S02E04.1080p.DSNP.WEB-DL.x264-GROUP",
  },
  {
    id: "minimal",
    name: "★★☆☆☆",
    desc: "💾 4.2 GB",
    filename: "Movie.720p.HDTV.x264-GROUP.mkv",
  },
  {
    id: "cam-low",
    name: "★☆☆☆☆",
    desc: "💾 1.1 GB",
    filename: "Movie.2024.HDCAM.x264-UNKNOWN.mkv",
  },
];

function parseArgs(argv) {
  let iterations = 500;
  let outPath = path.join(ROOT, "benchmark-badge-results.txt");
  let compareV2Dev = false;
  let v2BadgesPath = null;
  for (const arg of argv) {
    if (arg.startsWith("--iterations=")) {
      iterations = Number(arg.slice("--iterations=".length));
    } else if (arg.startsWith("--out=")) {
      outPath = path.isAbsolute(arg.slice(6))
        ? arg.slice(6)
        : path.join(ROOT, arg.slice(6));
    } else if (arg === "--compare-v2") {
      compareV2Dev = true;
    } else if (arg.startsWith("--v2-badges=")) {
      v2BadgesPath = path.isAbsolute(arg.slice(12))
        ? arg.slice(12)
        : path.join(ROOT, arg.slice(12));
      compareV2Dev = true;
    }
  }
  return { iterations, outPath, compareV2Dev, v2BadgesPath };
}

/**
 * @param {RegExp} re
 * @param {string[]} haystacks
 * @param {number} iterations
 */
function timeFilter(re, haystacks, iterations) {
  for (const h of haystacks) {
    re.test(h);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const h of haystacks) {
      re.test(h);
    }
  }
  const end = performance.now();
  return end - start;
}

function pct(part, total) {
  if (total <= 0) return "0.0";
  return ((part / total) * 100).toFixed(1);
}

function fmtMs(ms) {
  return ms < 1 ? ms.toFixed(3) : ms.toFixed(2);
}

export async function runBenchmark(opts = {}) {
  const iterations = opts.iterations ?? 500;
  const raw = await fs.readFile(opts.badgesPath ?? SOLID_BADGES_PATH, "utf8");
  const data = JSON.parse(raw);
  const filters = data.filters.filter((f) => f.type === "filter" && f.pattern);

  const compileFailures = [];
  const compiled = [];
  for (const f of filters) {
    let re = null;
    let markerRe = null;
    try {
      re = nuvioRegex(f.pattern);
    } catch (err) {
      compileFailures.push({
        id: f.id,
        groupId: f.groupId,
        patternLen: f.pattern.length,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
    if (V2_INJECT_IMPLEMENTED_IDS.has(f.id)) {
      try {
        const v2Pat = v2PatternForFilter(f.id);
        if (v2Pat) markerRe = nuvioRegex(v2Pat);
      } catch {
        markerRe = null;
      }
    }
    compiled.push({
      id: f.id,
      name: f.name ?? f.id,
      groupId: f.groupId ?? "unknown",
      patternLen: f.pattern.length,
      re,
      markerRe,
    });
  }

  const lines = [];
  const log = (s = "") => {
    lines.push(s);
    console.log(s);
  };

  log("=== Nosvasedis badge pattern benchmark ===");
  log(`Filters: ${compiled.length} compiled, ${compileFailures.length} failed to compile in Node`);
  log(`Iterations per filter×haystack: ${iterations}`);
  log(`Model: Nuvio haystacks (parts + joined) × all filters per stream`);
  if (compileFailures.length) {
    log("");
    log("--- Node compile failures (likely still run in Nuvio — counted by pattern length) ---");
    const failByGroup = new Map();
    for (const f of compileFailures) {
      const g = failByGroup.get(f.groupId) ?? { count: 0, totalLen: 0, ids: [] };
      g.count += 1;
      g.totalLen += f.patternLen;
      g.ids.push(f.id);
      failByGroup.set(f.groupId, g);
    }
    for (const [gid, g] of [...failByGroup.entries()].sort(
      (a, b) => b[1].totalLen - a[1].totalLen
    )) {
      log(
        `  ${gid}: ${g.count} filters, ${g.totalLen.toLocaleString()} pattern chars (${g.ids.slice(0, 5).join(", ")}${g.ids.length > 5 ? ", …" : ""})`
      );
    }
  }
  log("");

  /** @type {Record<string, { totalMs: number, filterMs: Record<string, number> }>} */
  const byStream = {};

  for (const fixture of STREAM_FIXTURES) {
    const haystacks = nuvioHaystacks([
      fixture.name,
      fixture.desc,
      fixture.filename,
    ]);
    const filterMs = {};
    let streamTotal = 0;

    for (const f of compiled) {
      const ms = timeFilter(f.re, haystacks, iterations);
      filterMs[f.id] = ms;
      streamTotal += ms;
    }

    byStream[fixture.id] = { totalMs: streamTotal, filterMs };
  }

  const avgStreamMs =
    Object.values(byStream).reduce((n, s) => n + s.totalMs, 0) /
    STREAM_FIXTURES.length;

  log("--- Per-stream total (all filters × haystack variants) ---");
  for (const fixture of STREAM_FIXTURES) {
    const { totalMs } = byStream[fixture.id];
    log(
      `  ${fixture.id.padEnd(22)} ${fmtMs(totalMs).padStart(10)} ms  (${pct(totalMs, avgStreamMs)}% of avg)`
    );
  }
  log(`  ${"AVERAGE".padEnd(22)} ${fmtMs(avgStreamMs).padStart(10)} ms`);
  log("");

  /** Aggregate per filter across fixtures (mean). */
  const filterAgg = compiled.map((f) => {
    const totalMs =
      Object.values(byStream).reduce((n, s) => n + (s.filterMs[f.id] ?? 0), 0) /
      STREAM_FIXTURES.length;
    return { ...f, totalMs };
  });

  const totalAllFilters = filterAgg.reduce((n, f) => n + f.totalMs, 0);

  log("--- Top 25 filters by mean time per stream ---");
  const topFilters = [...filterAgg].sort((a, b) => b.totalMs - a.totalMs).slice(0, 25);
  for (const f of topFilters) {
    log(
      `  ${f.id.padEnd(28)} ${fmtMs(f.totalMs).padStart(10)} ms  ${pct(f.totalMs, totalAllFilters).padStart(5)}%  len=${f.patternLen}  [${f.groupId}]`
    );
  }
  log("");

  /** Per groupId aggregate. */
  const groupAgg = new Map();
  for (const f of filterAgg) {
    const g = groupAgg.get(f.groupId) ?? { totalMs: 0, count: 0 };
    g.totalMs += f.totalMs;
    g.count += 1;
    groupAgg.set(f.groupId, g);
  }

  log("--- Cost by badge group (mean per stream) ---");
  const topGroups = [...groupAgg.entries()].sort((a, b) => b[1].totalMs - a[1].totalMs);
  for (const [groupId, g] of topGroups) {
    const label = MONO_GROUP_META[groupId]?.name ?? groupId;
    log(
      `  ${groupId.padEnd(6)} ${label.padEnd(14)} ${fmtMs(g.totalMs).padStart(10)} ms  ${pct(g.totalMs, totalAllFilters).padStart(5)}%  (${g.count} filters)`
    );
  }
  log("");

  /** RG tier subset. */
  const tierPrefix = /^(web-|blu-ray-|remux-|web-unranked|blu-ray-unranked|remux-unranked)/;
  const tierMs = filterAgg
    .filter((f) => tierPrefix.test(f.id))
    .reduce((n, f) => n + f.totalMs, 0);
  const safeCurrentMs = filterAgg
    .filter((f) => V2_INJECT_IMPLEMENTED_IDS.has(f.id))
    .reduce((n, f) => n + f.totalMs, 0);

  let safeMarkerMs = 0;
  for (const f of filterAgg) {
    if (!V2_INJECT_IMPLEMENTED_IDS.has(f.id) || !f.markerRe) continue;
    const haystackSets = STREAM_FIXTURES.map((fx) =>
      nuvioHaystacks([fx.name, fx.desc, fx.filename])
    );
    let ms = 0;
    for (const haystacks of haystackSets) {
      ms += timeFilter(f.markerRe, haystacks, iterations) / STREAM_FIXTURES.length;
    }
    safeMarkerMs += ms;
  }

  const safeSavings = safeCurrentMs - safeMarkerMs;

  log("--- Safe-only V2 ceiling estimate ---");
  log(`  Current cost (15 inject-backed filters): ${fmtMs(safeCurrentMs)} ms  (${pct(safeCurrentMs, totalAllFilters)}% of all filters)`);
  log(`  If marker-only patterns:               ${fmtMs(safeMarkerMs)} ms`);
  log(`  Savings:                               ${fmtMs(safeSavings)} ms  (${pct(safeSavings, totalAllFilters)}% of all filters)`);
  log("");

  const tierFailedLen = compileFailures
    .filter((f) =>
      /^(web-|blu-ray-|remux-|web-unranked|blu-ray-unranked|remux-unranked)/.test(f.id)
    )
    .reduce((n, f) => n + f.patternLen, 0);
  const allPatternLen =
    filterAgg.reduce((n, f) => n + f.patternLen, 0) +
    compileFailures.reduce((n, f) => n + f.patternLen, 0);
  const tierCompiledLen = filterAgg
    .filter((f) =>
      /^(web-|blu-ray-|remux-|web-unranked|blu-ray-unranked|remux-unranked)/.test(f.id)
    )
    .reduce((n, f) => n + f.patternLen, 0);

  log("--- RG tier filters (hypothesis: dominant cost) ---");
  log(`  Tier compiled timing: ${fmtMs(tierMs)} ms  (${pct(tierMs, totalAllFilters)}% of timed filters)`);
  log(
    `  Tier pattern size: ${(tierCompiledLen + tierFailedLen).toLocaleString()} chars (${pct(tierCompiledLen + tierFailedLen, allPatternLen)}% of all pattern bytes)`
  );
  log(`  Tier filters failed Node compile: ${compileFailures.filter((f) => /^(web-|blu-ray-|remux-)/.test(f.id)).length}`);
  log("");

  log("--- Recommendation ---");
  const tierPct = Number(pct(tierMs, totalAllFilters));
  const safePct = Number(pct(safeSavings, totalAllFilters));
  const tierCharPct = Number(pct(tierCompiledLen + tierFailedLen, allPatternLen));

  log(`  Measured per-stream pass (avg): ~${fmtMs(avgStreamMs)} ms for ${compiled.length} compilable filters`);
  log(`  Visual (gv): ${pct(groupAgg.get("gv")?.totalMs ?? 0, totalAllFilters)}% of measured time — top single cost`);
  log(`  Audio (ga): ${pct(groupAgg.get("ga")?.totalMs ?? 0, totalAllFilters)}% of measured time`);
  log(`  RG tiers (gms): ${pct(tierMs, totalAllFilters)}% measured, but ${tierCharPct}% of pattern bytes`);
  if (tierFailedLen > 0) {
    log(
      `  WARNING: ${compileFailures.length} filters failed Node compile (${tierFailedLen.toLocaleString()} tier chars in *-unranked) — Nuvio still runs these; tier cost is UNDER-estimated here`
    );
  }
  if (safePct < 5) {
    log(`  Safe-only V2 saves ~${safePct}% — will NOT fix slow badge appearance`);
  }
  log(`  Next optimization target: Visual + Audio marker inject, then tier *-unranked marker migration`);

  /** Marker-only production pack comparison (same files as release). */
  let v2DevPath = opts.v2BadgesPath;
  if (!v2DevPath && opts.compareV2Dev) {
    v2DevPath = opts.badgesPath ?? SOLID_BADGES_PATH;
  }
  if (v2DevPath) {
    try {
      const v2Raw = await fs.readFile(v2DevPath, "utf8");
      const v2Data = JSON.parse(v2Raw);
      const v2Filters = v2Data.filters.filter((f) => f.type === "filter" && f.pattern);
      const v2Compiled = [];
      for (const f of v2Filters) {
        try {
          v2Compiled.push({ id: f.id, groupId: f.groupId, re: nuvioRegex(f.pattern) });
        } catch {
          /* skip */
        }
      }
      let v2StreamTotal = 0;
      for (const fixture of STREAM_FIXTURES) {
        const haystacks = nuvioHaystacks([
          fixture.name,
          fixture.desc,
          fixture.filename,
        ]);
        for (const f of v2Compiled) {
          v2StreamTotal += timeFilter(f.re, haystacks, iterations);
        }
      }
      const v2AvgStreamMs = v2StreamTotal / STREAM_FIXTURES.length;
      log("");
      log("--- V1 vs V2 dev pack (marker-only patterns) ---");
      log(`  V1 avg per-stream: ${fmtMs(avgStreamMs)} ms`);
      log(`  V2 dev avg:        ${fmtMs(v2AvgStreamMs)} ms  (${v2Compiled.length} filters)`);
      log(
        `  Delta:             ${fmtMs(avgStreamMs - v2AvgStreamMs)} ms  (${pct(avgStreamMs - v2AvgStreamMs, avgStreamMs)}% faster)`
      );
      log(`  Source: ${v2DevPath}`);
    } catch (err) {
      log("");
      log(`--- V2 dev pack compare skipped: ${err instanceof Error ? err.message : String(err)} ---`);
      log(`  Run: node scripts/patch-badges-solid-v2.mjs`);
    }
  }

  if (opts.outPath) {
    await fs.writeFile(opts.outPath, lines.join("\n") + "\n");
    log("");
    log(`Wrote ${opts.outPath}`);
  }

  return {
    avgStreamMs,
    totalAllFilters,
    tierMs,
    tierPct,
    safeSavings,
    safePct,
    topFilters,
    topGroups,
    compileFailures,
    allPatternLen,
    tierFailedLen,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const { iterations, outPath, compareV2Dev, v2BadgesPath } = parseArgs(process.argv.slice(2));
  runBenchmark({ iterations, outPath, compareV2Dev, v2BadgesPath }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
