/**
 * Phase 1 — gv parity: v2 marker patterns + simulated inject should match v1 gv hits.
 */
import assert from "node:assert/strict";
import { applyFilterMeta } from "./badge-filter-meta.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import { buildVisualMarkers } from "./visual-formatter-inject.mjs";

const GV_IDS = MONO_FILTER_ORDER.gv;

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

function gvHits(patterns, candidates) {
  const haystacks = nuvioHaystacks(candidates);
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of GV_IDS) {
      const re = patterns[id];
      if (re && re.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

function v1Patterns() {
  return Object.fromEntries(
    GV_IDS.map((id) => {
      const pat = applyFilterMeta({ id, pattern: "" }).pattern;
      const re = nuvioRegex(pat);
      return [id, re];
    })
  );
}

function v2Patterns() {
  return Object.fromEntries(
    GV_IDS.map((id) => {
      const pat = v2PatternForBadge(id);
      assert.ok(pat, `missing v2 pattern ${id}`);
      return [id, nuvioRegex(pat)];
    })
  );
}

/** @param {string} filename @param {string[]} [extraCandidates] */
function candidatesWithInject(filename, extraCandidates = []) {
  const markers = buildVisualMarkers({ filename });
  const desc = `MKV / 12 GB${markers}`;
  return ["★★★★☆", desc, filename, ...extraCandidates];
}

const cases = [
  {
    label: "DV only",
    filename: "Movie.2024.2160p.UHD.BluRay.DV.7.1-GROUP",
    expectGv: ["a-dv"],
  },
  {
    label: "Atmos+DV",
    filename: "Movie.2024.2160p.UHD.BluRay.DV.Atmos.7.1-GROUP",
    expectGv: ["a-dv"],
  },
  {
    label: "DV+HDR10+",
    filename: "Movie.2024.2160p.HEVC.HDR10+.DV.DDP-GROUP",
    expectGv: ["v-dv-hdr10p"],
    forbidGv: ["a-dv"],
  },
  {
    label: "HDR10+ no DV",
    filename: "Movie.2024.2160p.HEVC.HDR10+.x265-GROUP",
    expectGv: ["v-hdr10p"],
  },
  {
    label: "IMAX",
    filename: "Movie.2024.2160p.IMAX.1080p.BluRay-GROUP",
    expectGv: ["v-imax"],
  },
  {
    label: "3D",
    filename: "Movie.2024.1080p.3D.BluRay-GROUP",
    expectGv: ["v-3d"],
  },
];

const v1 = v1Patterns();
const v2 = v2Patterns();

let ok = 0;
let fail = 0;

for (const c of cases) {
  const candidates = candidatesWithInject(c.filename);
  const v1h = gvHits(v1, candidates).sort();
  const v2h = gvHits(v2, candidates).sort();

  for (const id of c.expectGv ?? []) {
    assert.ok(v2h.includes(id), `${c.label}: v2 missing ${id} -> ${v2h.join(",")}`);
  }
  for (const id of c.forbidGv ?? []) {
    assert.ok(!v2h.includes(id), `${c.label}: v2 should not have ${id}`);
  }

  const v1Subset = v1h.filter((id) => (c.expectGv ?? []).includes(id));
  if (v1Subset.length) {
    assert.deepEqual(
      v2h.filter((id) => (c.expectGv ?? []).includes(id)),
      v1Subset,
      `${c.label}: v1/v2 gv mismatch`
    );
  }
  ok++;
}

console.log(`test-v2-visual: OK (${ok} cases, ${GV_IDS.length} gv filters)`);
