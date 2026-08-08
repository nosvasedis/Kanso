/**
 * Phase 6 — gl language parity: v2 marker patterns + oracle markers vs v1.
 */
import assert from "node:assert/strict";
import { v2PatternForBadge } from "./formatter-markers.mjs";
import { buildLanguageMarkersSync, GL_IDS } from "./language-formatter-inject.mjs";
import { LANGUAGE_BADGE_PATTERNS } from "./language-patterns.mjs";

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

function glHits(patterns, candidates) {
  const haystacks = nuvioHaystacks(candidates);
  const matched = new Set();
  for (const h of haystacks) {
    for (const id of GL_IDS) {
      if (patterns[id]?.test(h)) matched.add(id);
    }
  }
  return [...matched];
}

const v1 = Object.fromEntries(
  GL_IDS.map((id) => [id, nuvioRegex(LANGUAGE_BADGE_PATTERNS[id])])
);
const v2 = Object.fromEntries(
  GL_IDS.map((id) => {
    const pat = v2PatternForBadge(id);
    assert.ok(pat, `missing v2 pattern ${id}`);
    return [id, nuvioRegex(pat)];
  })
);

const cases = [
  { label: "English", filename: "Movie.2024.1080p.Eng.x264-GROUP", expect: ["l-en"] },
  { label: "French VFF", filename: "Movie.VFF.1080p.WEB", expect: ["l-fr"] },
  { label: "German", filename: "Movie.German.DL.1080p", expect: ["l-de"] },
  { label: "Latino", filename: "Movie.Latino.1080p", expect: ["l-es"] },
  {
    label: "PT-BR",
    filename: "Movie.Portuguese-Brazil.1080p",
    expect: ["l-pt-br"],
    forbid: ["l-pt-pt"],
  },
  {
    label: "PT-PT",
    filename: "Movie.Portuguese.Portugal.WEB",
    expect: ["l-pt-pt"],
    forbid: ["l-pt-br"],
  },
  { label: "Japanese ASCII", filename: "Anime.2024.JPN.1080p", expect: ["l-ja"] },
  { label: "Korean ASCII", filename: "Movie.KOR.1080p", expect: ["l-ko"] },
  { label: "Greek", filename: "Movie.Greek.1080p.WEB-DL", expect: ["l-el"] },
  { label: "Multi", filename: "Movie.MULTi.1080p", expect: ["l-mu"] },
  {
    label: "multi-language release",
    filename: "Movie.2024.Multi.English.French.German.Spanish.Japanese.DDP5.1-GROUP",
    expect: ["l-mu", "l-en", "l-fr", "l-de", "l-es", "l-ja"],
  },
  {
    label: "eng sub excluded",
    filename: "Movie.Eng.Sub.1080p",
    expect: [],
    forbid: ["l-en"],
  },
];

for (const c of cases) {
  const markers = buildLanguageMarkersSync({ filename: c.filename });
  const desc = `MKV / 12 GB${markers}`;
  const v1h = glHits(v1, [c.filename]).sort();
  const v2h = glHits(v2, [desc, c.filename]).sort();

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
      `${c.label}: v1/v2 gl mismatch (v1=${v1h}, v2=${v2h})`
    );
  }
}

const mediaInfoCases = [
  {
    label: "media-info French wins over English filename",
    filename: "Movie.2024.English.Eng.1080p.WEB-DL.mkv",
    languages: ["French"],
    expect: ["l-fr"],
    forbid: ["l-en"],
  },
  {
    label: "media-info empty falls back to filename English",
    filename: "Movie.2024.Eng.1080p.WEB-DL.mkv",
    languages: [],
    expect: ["l-en"],
  },
  {
    label: "media-info Portuguese Brazil not PT-PT",
    filename: "Movie.Portuguese.1080p.mkv",
    languages: ["Portuguese (Brazil)"],
    expect: ["l-pt-br"],
    forbid: ["l-pt-pt"],
  },
  {
    label: "media-info Multi Dual Audio",
    filename: "Movie.1080p.mkv",
    languages: ["Multi", "English"],
    expect: ["l-mu", "l-en"],
  },
];

for (const c of mediaInfoCases) {
  const markers = buildLanguageMarkersSync({
    filename: c.filename,
    languages: c.languages,
  });
  const desc = `MKV / 12 GB${markers}`;
  const v2h = glHits(v2, [desc]).sort();
  for (const id of c.expect ?? []) {
    assert.ok(v2h.includes(id), `${c.label}: missing ${id} (got ${v2h})`);
  }
  for (const id of c.forbid ?? []) {
    assert.ok(!v2h.includes(id), `${c.label}: should not have ${id}`);
  }
}

console.log(
  `test-v2-languages: OK (${cases.length} filename + ${mediaInfoCases.length} media-info cases, ${GL_IDS.length} gl filters)`
);
