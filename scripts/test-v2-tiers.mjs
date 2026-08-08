/**
 * Phase 4 — gms tier parity: v2 marker patterns + inject simulator vs v1 filename rules.
 */
import assert from "node:assert/strict";
import fs from "fs/promises";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import {
  buildTierMarkersSync,
  GMS_IDS,
  simulateTierInjectMarkers,
} from "./tier-formatter-inject.mjs";
import { loadTierGroupsFromBadgesSync } from "./tier-inject-generator.mjs";
import { V1_SOLID_BADGES_PATH } from "./v1-badge-oracle.mjs";
import { FORMATTER_RANK_STARS } from "./quality-rank-patterns.mjs";

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

function gmsHits(patterns, candidates) {
  const haystacks = nuvioHaystacks(candidates);
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of GMS_IDS) {
      if (patterns[id]?.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

const tierGroups = loadTierGroupsFromBadgesSync();

const raw = await fs.readFile(V1_SOLID_BADGES_PATH, "utf8");
const data = JSON.parse(raw);
const v1 = Object.fromEntries(
  GMS_IDS.map((id) => {
    const f = data.filters.find((x) => x.id === id);
    return [id, nuvioRegex(f.pattern)];
  })
);

const v2 = Object.fromEntries(
  GMS_IDS.map((id) => {
    const pat = v2PatternForBadge(id);
    assert.ok(pat, `missing v2 pattern ${id}`);
    return [id, nuvioRegex(pat)];
  })
);

const cases = [
  {
    label: "RSE web T1",
    fields: {
      filename: "Movie.2024.2160p.WEB-DL.DDP5.1-GROUP",
      quality: "WEB",
      rseMatched: ["Radarr Web T1"],
    },
    expect: ["web-1"],
    forbid: ["web-unranked"],
    injectOnly: true,
  },
  {
    label: "RG fallback web T1 FLUX",
    fields: {
      filename: "Movie.2024.2160p.WEB-DL.DDP5.1-FLUX",
      quality: "WEB",
      releaseGroup: "FLUX",
    },
    expect: ["web-1"],
    forbid: ["web-unranked"],
  },
  {
    label: "web unranked unknown group",
    fields: {
      filename: "Movie.2024.2160p.WEB-DL.DDP5.1-ObscureGrp",
      quality: "WEB",
      releaseGroup: "ObscureGrp",
    },
    expect: ["web-unranked"],
    forbid: ["web-1", "web-2"],
  },
  {
    label: "RSE blu-ray T3",
    fields: {
      filename: "Movie.2024.2160p.UHD.BluRay-GROUP",
      quality: "BluRay",
      rseMatched: ["Sonarr HD Bluray T3"],
    },
    expect: ["blu-ray-3"],
    injectOnly: true,
  },
  {
    label: "RG remux T2",
    fields: {
      filename: "Movie.2024.2160p.UHD.Remux-GROUP",
      quality: "REMUX",
      releaseGroup: "EPSiLON",
    },
    expect: ["remux-2"],
    forbid: ["remux-unranked"],
  },
  {
    label: "tier priority FLUX is web-1 not web-4",
    fields: {
      filename: "Movie.2024.1080p.WEB-DL-FLUX",
      quality: "WEB",
      releaseGroup: "FLUX",
    },
    expect: ["web-1"],
    forbid: ["web-4", "web-unranked"],
  },
  {
    label: "RSE multi-match best-wins (BLUTONiUM in Radarr Web T1 + Sonarr Web T2)",
    fields: {
      filename: "Movie.2024.2160p.WEB-DL-BLUTONiUM",
      quality: "WEB",
      rseMatched: ["Radarr Web T1", "Sonarr Web T2"],
    },
    expect: ["web-1"],
    forbid: ["web-2", "web-3", "web-unranked"],
    injectOnly: true,
  },
  {
    label: "RSE anime rules must not fire movie/TV web tiers",
    fields: {
      filename: "Anime.2024.1080p.WEB-DL-Erai-raws",
      quality: "WEB",
      rseMatched: ["Anime Web T1"],
    },
    expect: [],
    forbid: ["web-1", "web-2", "web-3", "web-unranked"],
    injectOnly: true,
  },
  {
    label: "RG remux group on WEB quality is not a remux tier",
    fields: {
      filename: "Movie.2024.1080p.WEB-DL-12GaugeShotgun",
      quality: "WEB",
      releaseGroup: "12GaugeShotgun",
    },
    expect: ["web-unranked"],
    forbid: ["remux-2", "remux-3"],
  },
  {
    label: "anime request never gets legacy allowlist tiers (isAnime guard)",
    fields: {
      filename: "Anime.2024.1080p.BluRay-Moxie",
      quality: "BluRay",
      releaseGroup: "Moxie",
      isAnime: true,
    },
    expect: ["blu-ray-unranked"],
    forbid: ["blu-ray-1", "blu-ray-2"],
    injectOnly: true,
  },
  {
    label: "blu-ray quality REMUX does not fire blu-ray tiers nor blu-ray-unranked",
    fields: {
      filename: "Movie.2024.2160p.UHD.BluRay.Remux-ObscureGrp",
      quality: "Bluray REMUX",
      releaseGroup: "ObscureGrp",
    },
    expect: ["remux-unranked"],
    forbid: ["blu-ray-unranked", "remux-1"],
    injectOnly: true,
  },
];

for (const c of cases) {
  const markers = simulateTierInjectMarkers(c.fields, tierGroups);
  const name = `${FORMATTER_RANK_STARS}${markers}`;
  const candidates = [
    name,
    c.fields.filename,
    c.fields.releaseGroup,
    Array.isArray(c.fields.rseMatched) ? c.fields.rseMatched.join(" ") : c.fields.rseMatched,
    c.fields.quality,
  ].filter(Boolean);

  const v1h = gmsHits(v1, candidates).sort();
  const v2h = gmsHits(v2, candidates).sort();

  for (const id of c.expect ?? []) {
    assert.ok(v2h.includes(id), `${c.label}: v2 missing ${id} (got ${v2h})`);
  }
  for (const id of c.forbid ?? []) {
    assert.ok(!v2h.includes(id), `${c.label}: v2 should not have ${id}`);
  }

  if (!c.injectOnly) {
    const expectSubset = (c.expect ?? []).filter((id) => v1h.includes(id));
    if (expectSubset.length) {
      assert.deepEqual(
        v2h.filter((id) => expectSubset.includes(id)).sort(),
        expectSubset.sort(),
        `${c.label}: v1/v2 gms mismatch (v1=${v1h}, v2=${v2h})`
      );
    }
  }
}

console.log(`test-v2-tiers: OK (${cases.length} cases, ${GMS_IDS.length} gms filters)`);
