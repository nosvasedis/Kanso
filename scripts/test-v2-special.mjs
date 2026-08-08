/**
 * Phase 7 — gst + edition hue/bw parity: v2 patterns + inject markers vs v1.
 */
import assert from "node:assert/strict";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import {
  buildSpecialMarkersSync,
  GST_IDS,
  SPECIAL_ONLY_IDS,
} from "./special-formatter-inject.mjs";
import { SPECIAL_TAG_PATTERNS } from "./special-tag-patterns.mjs";
import {
  EDITION_BW_BADGE_PATTERN,
  EDITION_HUE_BADGE_PATTERN,
} from "./edition-badge-patterns.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";

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

function gstHits(patterns, ids, candidates) {
  const trimmed = candidates.map((c) => c.trim()).filter(Boolean);
  const unique = [...new Set(trimmed)];
  const haystacks =
    unique.length <= 1 ? unique : [...unique, unique.join(" ")];
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of ids) {
      if (patterns[id]?.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

const v1 = {
  ...Object.fromEntries(
    SPECIAL_ONLY_IDS.map((id) => [id, nuvioRegex(SPECIAL_TAG_PATTERNS[id].pattern)])
  ),
  "edition-true-hue": nuvioRegex(EDITION_HUE_BADGE_PATTERN),
  "edition-bw": nuvioRegex(EDITION_BW_BADGE_PATTERN),
};

const v2 = Object.fromEntries(
  GST_IDS.map((id) => {
    const pat = v2PatternForBadge(id);
    assert.ok(pat, `missing v2 pattern ${id}`);
    return [id, nuvioRegex(pat)];
  })
);

const cases = [
  {
    label: "hybrid",
    filename: "Movie.2024.HYBRID.1080p-GROUP",
    expect: ["hybrid-release"],
  },
  {
    label: "criterion",
    filename: "Movie.Criterion.Collection.1080p-GROUP",
    expect: ["criterion-collection"],
  },
  {
    label: "proper",
    filename: "Movie.2024.PROPER.1080p-GROUP",
    expect: ["proper-release"],
  },
  {
    label: "repack",
    filename: "Movie.2024.REPACK.1080p-GROUP",
    expect: ["repack-release"],
  },
  {
    label: "remastered",
    filename: "Movie.2024.Remastered.1080p-GROUP",
    expect: ["remastered-release"],
  },
  {
    label: "open matte",
    filename: "Movie.2024.Open.Matte.1080p-GROUP",
    expect: ["open-matte-edition"],
  },
  {
    label: "regraded",
    filename: "Movie.2024.Regraded.1080p-GROUP",
    expect: ["regraded-release"],
  },
  {
    label: "uncut",
    filename: "Movie.2024.UNCUT.1080p-GROUP",
    expect: ["uncut-edition"],
  },
  {
    label: "uncensored",
    filename: "Movie.2024.UNCENSORED.1080p-GROUP",
    expect: ["uncensored-edition"],
  },
  {
    label: "theatrical",
    filename: "Movie.2020.Theatrical.Cut.1080p-GROUP",
    expect: ["edition-theatrical"],
  },
  {
    label: "hue COLORIZED",
    filename: "Spider.Noir.S01E01.COLORIZED.2160p.WEB-DL",
    expect: ["edition-true-hue"],
    forbid: ["edition-bw"],
  },
  {
    label: "bw dot token",
    filename: "Spider.Noir.S01E02.BW.2160p.WEB-DL",
    expect: ["edition-bw"],
    forbid: ["edition-true-hue"],
  },
  {
    label: "hue wins over bw",
    filename: "Spider.Noir.S01E01.Full.Color.2160p.WEB-DL",
    expect: ["edition-true-hue"],
    forbid: ["edition-bw"],
  },
];

for (const c of cases) {
  const markers = buildSpecialMarkersSync({ filename: c.filename });
  const desc = `MKV / 12 GB${markers}`;
  const v1h = gstHits(v1, GST_IDS, [c.filename]).sort();
  const v2h = gstHits(v2, GST_IDS, [desc, c.filename]).sort();

  for (const id of c.expect ?? []) {
    assert.ok(v2h.includes(id), `${c.label}: v2 missing ${id} (got ${v2h})`);
  }
  for (const id of c.forbid ?? []) {
    assert.ok(!v2h.includes(id), `${c.label}: v2 should not have ${id}`);
  }

  const expectSubset = (c.expect ?? []).filter((id) => v1h.includes(id));
  if (expectSubset.length) {
    assert.deepEqual(
      v2h.filter((id) => expectSubset.includes(id)).sort(),
      expectSubset.sort(),
      `${c.label}: v1/v2 gst mismatch (v1=${v1h}, v2=${v2h})`
    );
  }
}

assert.equal(
  MONO_FILTER_ORDER.gst.length,
  GST_IDS.length + 3,
  "gst inject ids should cover all except baseline seadex/dc/ext"
);

console.log(`test-v2-special: OK (${cases.length} cases, ${GST_IDS.length} new gst inject filters)`);
