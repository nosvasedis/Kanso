/**
 * Phase 2 — ga parity: v2 marker patterns + oracle inject markers vs v1 filename matching.
 */
import assert from "node:assert/strict";
import { applyFilterMeta } from "./badge-filter-meta.mjs";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import { buildAudioMarkers, GA_IDS } from "./audio-formatter-inject.mjs";

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

function gaHits(patterns, candidates) {
  const haystacks = nuvioHaystacks(candidates);
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of GA_IDS) {
      const re = patterns[id];
      if (re?.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

const v1 = Object.fromEntries(
  GA_IDS.map((id) => [id, nuvioRegex(applyFilterMeta({ id, pattern: "" }).pattern)])
);

const v2 = Object.fromEntries(
  GA_IDS.map((id) => {
    const pat = v2PatternForBadge(id);
    assert.ok(pat, `missing v2 pattern ${id}`);
    return [id, nuvioRegex(pat)];
  })
);

const base = "Movie.2024.2160p.UHD.BluRay";

const cases = [
  {
    label: "Atmos TrueHD + DTS:X MA + FLAC",
    filename: `${base}.Atmos.TrueHD.DTS-X.DTS-HD.MA.FLAC-GROUP`,
    expect: ["a-at-th", "a-dtsx-ma"],
    forbid: ["a-flac", "a-at", "a-th", "a-dtsx", "a-dtsma"],
  },
  {
    label: "DDP only",
    filename: `${base}.DDP5.1-GROUP`,
    expect: ["a-dp"],
  },
  {
    label: "Atmos+DV remux audio",
    filename: `${base}.DV.Atmos.TrueHD.Remux-GROUP`,
    expect: ["a-at-th"],
    forbid: ["a-at", "a-th"],
  },
  {
    label: "DTS-ES standalone",
    filename: `${base}.DTS-ES-GROUP`,
    expect: ["a-dtses"],
    forbid: ["a-dts"],
  },
  {
    label: "FLAC + Opus + AAC",
    filename: `${base}.FLAC.Opus.AAC-GROUP`,
    expect: ["a-flac"],
    forbid: ["a-opus", "a-aac"],
  },
];

for (const c of cases) {
  const markers = buildAudioMarkers({ filename: c.filename });
  const desc = `MKV / 12 GB${markers}`;
  const v1h = gaHits(v1, [c.filename]).sort();
  const v2h = gaHits(v2, ["★★★★☆", desc, c.filename]).sort();

  for (const id of c.expect ?? []) {
    assert.ok(v2h.includes(id), `${c.label}: v2 missing ${id} -> ${v2h.join(",")}`);
  }
  for (const id of c.forbid ?? []) {
    assert.ok(!v2h.includes(id), `${c.label}: v2 should not have ${id}`);
  }

  const expectSubset = (c.expect ?? []).filter((id) => v1h.includes(id));
  if (expectSubset.length) {
    assert.deepEqual(
      v2h.filter((id) => expectSubset.includes(id)).sort(),
      expectSubset.sort(),
      `${c.label}: v1/v2 ga mismatch (v1: ${v1h.join(",")})`
    );
  }
}

console.log(`test-v2-audio: OK (${cases.length} cases, ${GA_IDS.length} ga filters)`);
