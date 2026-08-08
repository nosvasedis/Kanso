/**
 * Phase 3 — gc channel parity: v2 marker patterns + oracle markers vs v1.
 */
import assert from "node:assert/strict";
import fs from "fs/promises";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import { buildChannelMarkersSync, GC_IDS } from "./channels-formatter-inject.mjs";
import { V1_SOLID_BADGES_PATH } from "./v1-badge-oracle.mjs";

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

function gcHits(patterns, candidates) {
  const haystacks = nuvioHaystacks(candidates);
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of GC_IDS) {
      if (patterns[id]?.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

const raw = await fs.readFile(V1_SOLID_BADGES_PATH, "utf8");
const data = JSON.parse(raw);
const v1 = Object.fromEntries(
  GC_IDS.map((id) => {
    const f = data.filters.find((x) => x.id === id);
    return [id, nuvioRegex(f.pattern)];
  })
);

const v2 = Object.fromEntries(
  GC_IDS.map((id) => {
    const pat = v2PatternForBadge(id);
    assert.ok(pat, `missing v2 pattern ${id}`);
    return [id, nuvioRegex(pat)];
  })
);

const cases = [
  { label: "7.1", filename: "Movie.2024.2160p.DDP7.1.Atmos-GROUP", expect: ["ch-71"] },
  { label: "5.1", filename: "Movie.2024.2160p.DDP5.1-GROUP", expect: ["ch-51"] },
  { label: "2.0", filename: "Movie.2024.2160p.AC3.2.0-GROUP", expect: ["ch-20"] },
  {
    label: "6.1 not 7.1",
    filename: "Movie.2024.2160p.DTS6.1-GROUP",
    expect: ["ch-61"],
    forbid: ["ch-71"],
  },
];

for (const c of cases) {
  const markers = buildChannelMarkersSync({ filename: c.filename }, v1);
  const desc = `MKV / 12 GB${markers}`;
  const v1h = gcHits(v1, [c.filename]).sort();
  const v2h = gcHits(v2, ["★★★★☆", desc, c.filename]).sort();

  for (const id of c.expect ?? []) {
    assert.ok(v2h.includes(id), `${c.label}: v2 missing ${id}`);
  }
  for (const id of c.forbid ?? []) {
    assert.ok(!v2h.includes(id), `${c.label}: v2 should not have ${id}`);
  }

  const expectSubset = (c.expect ?? []).filter((id) => v1h.includes(id));
  if (expectSubset.length) {
    assert.deepEqual(
      v2h.filter((id) => expectSubset.includes(id)).sort(),
      expectSubset.sort(),
      `${c.label}: v1/v2 gc mismatch`
    );
  }
}

console.log(`test-v2-channels: OK (${cases.length} cases, ${GC_IDS.length} gc filters)`);
