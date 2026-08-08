/**
 * Phase 5 — gq + grl parity: v2 patterns + source inject markers vs v1.
 */
import assert from "node:assert/strict";
import { applyFilterMeta } from "./badge-filter-meta.mjs";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import {
  buildSourceMarkersSync,
  GRL_IDS,
  GQ_IDS,
} from "./source-formatter-inject.mjs";
import { QUALITY_RANK_PATTERNS } from "./quality-rank-patterns.mjs";

function nuvioRegex(pattern) {
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
  try {
    return new RegExp(body, flags);
  } catch {
    return null;
  }
}

function nuvioHaystacks(candidates) {
  const unique = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (unique.length <= 1) return unique;
  return [...unique, unique.join(" ")];
}

function hits(patterns, ids, candidates) {
  const haystacks = nuvioHaystacks(candidates);
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of ids) {
      if (patterns[id]?.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

const v1Combo = Object.fromEntries(
  Object.entries(QUALITY_RANK_PATTERNS).map(([id, p]) => [id, nuvioRegex(p)])
);
const v1Release = Object.fromEntries(
  GRL_IDS.map((id) => [id, nuvioRegex(applyFilterMeta({ id, pattern: "" }).pattern)])
);
const v2Combo = Object.fromEntries(
  GQ_IDS.map((id) => [id, nuvioRegex(v2PatternForBadge(id))])
);
const v2Release = Object.fromEntries(
  GRL_IDS.map((id) => [id, nuvioRegex(v2PatternForBadge(id))])
);

const filename =
  "Project.Hail.Mary.2026.2160p.WEB-DL.HEVC.DV.DDP5.1.Atmos-GROUP";
const nameGood = "★★★☆☆";
const nameBest = "★★★★★";
const nameOk = "★★☆☆☆";
const descPlain = "📦 MKV\n💾 30.1 GB · 👥 vantablack";
const filenameRemux =
  "Project.Hail.Mary.2026.2160p.UHD.BluRay.REMUX.DV.DDP5.1-GROUP";
const filenameRip = "Show.S01E01.1080p.WEBRip.x264-GROUP";
const filenameWebRipHyphen = "Show.S01E01.1080p.Web-Rip.x264-GROUP";
const filenameCam = "Movie.2024.HDCAM.x264-GROUP";
const filenameHdtv = "Show.S01E01.HDTV.x264-GROUP";

function withSourceMarkers(name, filename) {
  const markers = buildSourceMarkersSync({ filename });
  return `${name}${markers}`;
}

const comboCases = [
  ["Good WebDL half-star rounded", ["★★★★☆", descPlain, filename], ["q-gw"]],
  ["Best WebDL", [nameBest, descPlain, filename], ["q-bw"]],
  ["OK WebDL", [nameOk, descPlain, filename], ["q-ow"]],
  ["Best WebRip", [nameBest, descPlain, filenameRip], ["q-bw"]],
  ["Good Web-Rip", [nameGood, descPlain, filenameWebRipHyphen], ["q-gw"]],
  ["Best Remux", [nameBest, descPlain, filenameRemux], ["q-br"]],
];

const releaseCases = [
  ["WebDL from filename", [filename], ["q-w"]],
  ["WebRip from filename", [filenameRip], ["q-wr"]],
  ["Web-Rip from filename", [filenameWebRipHyphen], ["q-wr"]],
  ["Remux from filename", [filenameRemux], ["q-r"]],
  ["CAM from filename", [filenameCam], ["q-cam"]],
  ["HDTV from filename", [filenameHdtv], ["q-hdtv"]],
];

for (const [label, parts, expect] of comboCases) {
  const fn =
    parts.find((p) => /WEB|Remux|REMUX/i.test(p)) ?? filename;
  const name = parts.find((p) => p.includes("★")) ?? "";
  const nameWithMarkers = withSourceMarkers(name, fn);
  const desc = `${descPlain}${buildSourceMarkersSync({ filename: fn })}`;
  const candidates = [nameWithMarkers, desc, fn];
  const v1h = hits(v1Combo, GQ_IDS, parts).sort();
  const v2h = hits(v2Combo, GQ_IDS, candidates).sort();
  for (const id of expect) {
    assert.ok(v2h.includes(id), `${label}: v2 missing ${id} (got ${v2h})`);
  }
  const subset = expect.filter((id) => v1h.includes(id));
  if (subset.length) {
    assert.deepEqual(
      v2h.filter((id) => subset.includes(id)).sort(),
      subset.sort(),
      `${label}: v1/v2 combo mismatch v1=${v1h} v2=${v2h}`
    );
  }
}

for (const [label, parts, expect] of releaseCases) {
  const fn = parts[0];
  const desc = `${descPlain}${buildSourceMarkersSync({ filename: fn })}`;
  const candidates = [desc, fn];
  const v1h = hits(v1Release, GRL_IDS, parts).sort();
  const v2h = hits(v2Release, GRL_IDS, candidates).sort();
  for (const id of expect) {
    assert.ok(v2h.includes(id), `${label}: v2 missing ${id}`);
  }
  const subset = expect.filter((id) => v1h.includes(id));
  if (subset.length) {
    assert.deepEqual(
      v2h.filter((id) => subset.includes(id)).sort(),
      subset.sort(),
      `${label}: v1/v2 release mismatch`
    );
  }
}

console.log(
  `test-v2-quality: OK (${comboCases.length + releaseCases.length} cases, ${GQ_IDS.length + GRL_IDS.length} filters)`
);
