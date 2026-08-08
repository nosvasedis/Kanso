/**
 * Phase 5 — gr resolution parity: v2 marker patterns + oracle markers vs v1.
 */
import assert from "node:assert/strict";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import { buildResolutionMarkersSync, GR_IDS } from "./resolution-formatter-inject.mjs";
import { RESOLUTION_PATTERNS } from "./resolution-patterns.mjs";

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

function grHits(patterns, candidates) {
  const haystacks = nuvioHaystacks(candidates);
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of GR_IDS) {
      if (patterns[id]?.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

const v1 = Object.fromEntries(
  GR_IDS.map((id) => [id, nuvioRegex(RESOLUTION_PATTERNS[id])])
);
const v2 = Object.fromEntries(
  GR_IDS.map((id) => {
    const pat = v2PatternForBadge(id);
    assert.ok(pat, `missing v2 pattern ${id}`);
    return [id, nuvioRegex(pat)];
  })
);

const cases = [
  { label: "4K", filename: "Movie.2024.2160p.WEB-DL-GROUP", expect: ["r-4k"] },
  {
    label: "1440 not 4K",
    filename: "Movie.2024.1440p.WEB-DL-GROUP",
    expect: ["r-1440"],
    forbid: ["r-4k"],
  },
  { label: "1080", filename: "Movie.2024.1080p.WEB-DL-GROUP", expect: ["r-1080"] },
  { label: "720", filename: "Movie.2024.720p.WEB-DL-GROUP", expect: ["r-720"] },
  {
    label: "2160p excludes 1080 substring in v1",
    filename: "Movie.2024.2160p.WEB-DL-GROUP",
    expect: ["r-4k"],
    forbid: ["r-1080"],
  },
  {
    label: "dual 2160+1080 tokens",
    filename: "Movie.2024.2160p.1080p.WEB-DL-GROUP",
    expect: ["r-1080"],
    forbid: ["r-4k"],
  },
];

for (const c of cases) {
  const markers = buildResolutionMarkersSync({ filename: c.filename });
  const desc = `MKV / 12 GB${markers}`;
  const v1h = grHits(v1, [c.filename]).sort();
  const v2h = grHits(v2, [desc, c.filename]).sort();

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
      `${c.label}: v1/v2 gr mismatch`
    );
  }
}

console.log(`test-v2-resolution: OK (${cases.length} cases, ${GR_IDS.length} gr filters)`);
