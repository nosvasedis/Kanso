import { applyFilterMeta } from "./badge-filter-meta.mjs";
import { QUALITY_RANK_PATTERNS } from "./quality-rank-patterns.mjs";

function nuvioRegex(pattern) {
  const inline = pattern.startsWith("(?i)");
  return new RegExp(inline ? pattern.slice(4) : pattern, inline ? "i" : "");
}

function nuvioHits(patterns, candidates) {
  const trimmed = candidates.map((c) => c.trim()).filter(Boolean);
  const unique = [...new Set(trimmed)];
  const haystacks =
    unique.length <= 1 ? unique : [...unique, unique.join(" ")];
  const matched = new Set();
  for (const haystack of haystacks) {
    for (const [id, re] of Object.entries(patterns)) {
      if (re.test(haystack)) matched.add(id);
    }
  }
  return [...matched];
}

const patterns = Object.fromEntries(
  Object.entries(QUALITY_RANK_PATTERNS).map(([id, p]) => [id, nuvioRegex(p)])
);

const releasePatterns = Object.fromEntries(
  ["q-r", "q-b", "q-w", "q-wr", "q-cam", "q-hdtv"].map((id) => [
    id,
    nuvioRegex(applyFilterMeta({ id, pattern: "" }).pattern),
  ])
);

function releaseHits(candidates) {
  const trimmed = candidates.map((c) => c.trim()).filter(Boolean);
  const unique = [...new Set(trimmed)];
  const haystacks =
    unique.length <= 1 ? unique : [...unique, unique.join(" ")];
  const matched = new Set();
  for (const haystack of haystacks) {
    for (const [id, re] of Object.entries(releasePatterns)) {
      if (re.test(haystack)) matched.add(id);
    }
  }
  return [...matched];
}

const filename =
  "Project.Hail.Mary.2026.2160p.WEB-DL.HEVC.DV.DDP5.1.Atmos-GROUP";
const nameGood = "★★★☆☆";
const nameBest = "★★★★★";
const nameOk = "★★☆☆☆";
const descPlain = "📦 MKV\n💾 30.1 GB · 👥 vantablack";
const filenameRemux =
  "Project.Hail.Mary.2026.2160p.UHD.BluRay.REMUX.DV.DDP5.1-GROUP";

let ok = true;
const filenameRip = "Show.S01E01.1080p.WEBRip.x264-GROUP";
const filenameWebRipHyphen = "Show.S01E01.1080p.Web-Rip.x264-GROUP";

const cases = [
  ["Good WebDL half-star rounded", ["★★★★☆", descPlain, filename], ["q-gw"]],
  ["Best WebDL", [nameBest, descPlain, filename], ["q-bw"]],
  ["OK WebDL", [nameOk, descPlain, filename], ["q-ow"]],
  ["One star still OK", ["★☆☆☆☆", descPlain, filename], ["q-ow"]],
  ["Empty stars never OK", ["☆☆☆☆☆", descPlain, filename], []],
  ["Best WebRip (no hyphen)", [nameBest, descPlain, filenameRip], ["q-bw"]],
  ["Good Web-Rip (hyphen)", [nameGood, descPlain, filenameWebRipHyphen], ["q-gw"]],
  ["No rank in title", ["", descPlain, filename], []],
];

const filenameCam = "Movie.2024.HDCAM.x264-GROUP";
const filenameHdtv = "Show.S01E01.HDTV.x264-GROUP";

const releaseCases = [
  ["WebDL from filename", [filename], ["q-w"]],
  ["WebRip from filename", [filenameRip], ["q-wr"]],
  ["Web-Rip from filename", [filenameWebRipHyphen], ["q-wr"]],
  ["Remux from filename", [filenameRemux], ["q-r"]],
  ["CAM from filename", [filenameCam], ["q-cam"]],
  ["HDTV from filename", [filenameHdtv], ["q-hdtv"]],
  ["Ranked title alone no release", [nameBest], []],
];

function releaseHitsJoinedOnly(patterns, candidates) {
  const trimmed = candidates.map((c) => c.trim()).filter(Boolean);
  const unique = [...new Set(trimmed)];
  if (unique.length <= 1) return releaseHits(patterns, unique);
  const joined = unique.join(" ");
  const matched = new Set();
  for (const [id, re] of Object.entries(patterns)) {
    if (re.test(joined)) matched.add(id);
  }
  return [...matched];
}

const joinedOnlyCases = [
  ["Ranked joined haystack hides release", [nameBest, descPlain, filename], []],
  ["Unranked joined haystack shows release", ["", descPlain, filename], ["q-w"]],
];

for (const [label, candidates, expected] of cases) {
  const hits = nuvioHits(patterns, candidates);
  const pass =
    expected.every((e) => hits.includes(e)) && hits.length === expected.length;
  console.log(`${pass ? "OK" : "FAIL"} ${label} -> ${hits.join(", ") || "(none)"}`);
  if (!pass) ok = false;
}

for (const [label, candidates, expected] of releaseCases) {
  const hits = releaseHits(candidates);
  const pass =
    expected.every((e) => hits.includes(e)) && hits.length === expected.length;
  console.log(`${pass ? "OK" : "FAIL"} release ${label} -> ${hits.join(", ") || "(none)"}`);
  if (!pass) ok = false;
}

for (const [label, candidates, expected] of joinedOnlyCases) {
  const hits = releaseHitsJoinedOnly(releasePatterns, candidates);
  const pass =
    expected.every((e) => hits.includes(e)) && hits.length === expected.length;
  console.log(`${pass ? "OK" : "FAIL"} release joined ${label} -> ${hits.join(", ") || "(none)"}`);
  if (!pass) ok = false;
}

// Nuvio unions per-field hits: filename slice still matches gray release pills on ranked streams
const comboPlusRelease = [
  [
    "Best WebDL + combo",
    [nameBest, descPlain, filename],
    { combo: ["q-bw"], release: ["q-w"] },
  ],
  [
    "Best WebRip + combo",
    [nameBest, descPlain, filenameRip],
    { combo: ["q-bw"], release: ["q-wr"] },
  ],
  [
    "Good Web-Rip + combo",
    [nameGood, descPlain, filenameWebRipHyphen],
    { combo: ["q-gw"], release: ["q-wr"] },
  ],
  [
    "Best Remux + combo",
    [nameBest, descPlain, filenameRemux],
    { combo: ["q-br"], release: ["q-r"] },
  ],
  [
    "CAM suppresses combo",
    [nameBest, descPlain, filenameCam],
    { combo: [], release: ["q-cam"] },
  ],
  [
    "HDTV suppresses combo",
    [nameGood, descPlain, filenameHdtv],
    { combo: [], release: ["q-hdtv"] },
  ],
  [
    "CAM shows with rank in joined haystack",
    [nameBest, descPlain, filenameCam],
    { combo: [], release: ["q-cam"] },
  ],
];
for (const [label, candidates, expected] of comboPlusRelease) {
  const combo = nuvioHits(patterns, candidates);
  const release = releaseHits(candidates);
  const pass =
    expected.combo.every((e) => combo.includes(e)) &&
    combo.length === expected.combo.length &&
    expected.release.every((e) => release.includes(e)) &&
    release.length === expected.release.length;
  console.log(
    `${pass ? "OK" : "FAIL"} ${label} -> combo [${combo}] release [${release}]`
  );
  if (!pass) ok = false;
}

process.exit(ok ? 0 : 1);
