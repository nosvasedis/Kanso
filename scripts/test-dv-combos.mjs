import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { applyFilterMeta } from "./badge-filter-meta.mjs";
import { DR_DV_MARKER, DR_HDR_MARKER } from "./dr-formatter-markers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const badgesPath = path.join(__dirname, "..", "kanso-solid.json");

function nuvioRegex(pattern) {
  const inline = pattern.startsWith("(?i)");
  return new RegExp(inline ? pattern.slice(4) : pattern, inline ? "i" : "");
}

const comboIds = [
  "v-at-dv",
  "a-at-th",
  "a-at-dp",
  "a-dv",
  "a-dp",
  "a-at",
  "a-th",
  "a-dd",
];

const visualIds = [
  "v-dv-hdr10p",
  "v-dv-hdr10",
  "v-dv-hdr",
  "v-hdr10p",
  "v-hdr10",
  "v-hdr",
  "v-hlg",
];

const ids = [...comboIds, ...visualIds];

function hitsFor(patterns, sample, idList = comboIds) {
  return idList.filter((id) => patterns[id].test(sample));
}

function visualHitsFor(patterns, sample) {
  return hitsFor(patterns, sample, visualIds);
}

/** Mirrors Nuvio StreamBadgeMatcher.badgeMatchCandidates + matchedBadges. */
function nuvioHits(patterns, candidates) {
  const trimmed = candidates.map((c) => c.trim()).filter(Boolean);
  const unique = [...new Set(trimmed)];
  const haystacks =
    unique.length <= 1 ? unique : [...unique, unique.join(" ")];
  const matched = new Set();
  for (const haystack of haystacks) {
    for (const id of ids) {
      if (patterns[id].test(haystack)) matched.add(id);
    }
  }
  return [...matched];
}

/** Assert dedup on the joined candidate string (combo + marker in one haystack). */
function nuvioJoinedHits(patterns, candidates) {
  const unique = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (unique.length === 0) return [];
  const joined = unique.join(" ");
  return ids.filter((id) => patterns[id].test(joined));
}

function assertHits(label, hits, expected, forbidden = "") {
  const expectedHits = expected.split(/,\s*/).filter(Boolean);
  const forbiddenHits = forbidden.split(/,\s*/).filter(Boolean);
  const pass =
    expectedHits.every((e) => hits.includes(e)) &&
    forbiddenHits.every((f) => !hits.includes(f));
  console.log(`${pass ? "OK" : "FAIL"} ${label}`);
  console.log(`      -> ${hits.join(", ") || "(none)"}`);
  return pass;
}

function patternsFromMeta() {
  return Object.fromEntries(
    ids.map((id) => [id, nuvioRegex(applyFilterMeta({ id, pattern: "" }).pattern)])
  );
}

async function main() {
  const patterns = patternsFromMeta();

  let ok = true;
  const filename =
    "Project.Hail.Mary.2026.2160p.UHD.BluRay.REMUX.DV.DDP5.1.Atmos.TrueHD-GROUP";
  const userFilename =
    "Project.Hail.Mary.2026.IMAX.2160p.i T.WEB-DL.HEVC.DV.HDR10PIus.DDP";
  const userAtmos =
    "Project.Hail.Mary.2026.IMAX.2160p.WEB-DL.HEVC.DV.HDR10Plus.DDP5.1.Atmos";
  const hailMaryWebrip =
    "Project Hail Mary (2026) 2160p.WEBrip.HEVC.DDP5.1.mkv";
  const hailMaryWebripDotted =
    "Project.Hail.Mary.2026.2160p.WEBrip.HEVC.DV.DDP5.1.mkv";

  const hailMaryBracket =
    "Project Hail Mary 2026 [2160p.WEBrip.HEVC.DV.HDR10.Dolby.Digital.Plus.6.1] [Napisy PL]";

  const spiderNoir =
    "Spider-Noir S01E01 Step Into My Office True-Hue Full Color 2160p AMZN WEB-DL DDP5 1 Atmos DV HDR10Plus H265-Kitsune.mkv";

  const spiderNoirE04 =
    "Spider-Noir S01E04 A Mistake Ill Never Make Again 2160p AMZN WEB-DL DDP5 1 Atmos DV HDR H265-FLUX.mkv";

  const forAllMankind =
    "For.All.Mankind.S03E07.Bring.It.Down.2160p.ATVP.WEB-DL.DDP.5.1.Atmos.DoVi.HDR.HEVC.RGzs";
  const forAllMankindDts =
    "For All Mankind S03E07 Bring It Down 2160p ATVP WEB-DL DTS-HD MA 6 1 DV HDR10Plus H 265";

  const streamingCases = [
    [
      "NF Netflix space-separated Atmos+DV",
      "Some Show S02E04 2160p NF WEB-DL DDP5 1 Atmos DV HEVC-TNT",
      "v-at-dv",
    ],
    [
      "DSNP Disney+ space-separated Atmos+DV",
      "Some Show S01E01 2160p DSNP WEB-DL DDP5 1 Atmos DV H265-GRP",
      "v-at-dv",
    ],
    [
      "ATV Apple TV space-separated Atmos+DV",
      "Some Show S01E03 2160p ATV WEB-DL DDP5 1 Atmos DV H265-GRP",
      "v-at-dv",
    ],
    [
      "Peacock space-separated Atmos+DV",
      "Some Show S01E02 2160p Peacock WEB-DL DDP5 1 Atmos DV H265-GRP",
      "v-at-dv",
    ],
    [
      "PCOK tag space-separated Atmos+DV",
      "Some Show S01E02 2160p PCOK WEB-DL DDP5 1 Atmos DV H265-GRP",
      "v-at-dv",
    ],
    [
      "ATV For All Mankind DoVi+Atmos+HDR",
      forAllMankind,
      "v-at-dv",
      "v-dv-hdr",
    ],
    [
      "ATV For All Mankind DV+HDR10+ DTS-HD MA (space-separated)",
      forAllMankindDts,
      "v-dv-hdr10p",
      "a-dv,v-hdr10p",
    ],
  ];

  const cases = [
    ["Hail Mary remux combo", filename, "v-at-dv,a-at-th", "a-at,a-th"],
    [
      "User Project Hail Mary DV+DDP (HDR10PIus typo)",
      userFilename,
      "",
    ],
    [
      "HDR10+ in filename",
      "Movie.2024.2160p.HEVC.HDR10+.DV.DDP-GROUP",
      "a-dp",
    ],
    [
      "User Project Hail Mary DV+DDP+Atmos",
      userAtmos,
      "v-at-dv",
      "v-dv-hdr10p",
    ],
    ["DV+DDP filename", "Movie.2024.2160p.UHD.BluRay.DV.DDP5.1-GROUP", "a-dv,a-dp"],
    [
      "DV+Atmos filename",
      "Movie.2024.2160p.UHD.BluRay.DV.Atmos.7.1-GROUP",
      "v-at-dv",
    ],
    ["DV only filename", "Movie.2024.2160p.UHD.BluRay.DV.7.1-GROUP", "a-dv"],
    [
      "Atmos only filename",
      "Movie.2024.2160p.UHD.BluRay.Atmos.TrueHD.7.1-GROUP",
      "a-at-th",
    ],
    ["DDP only filename", "Movie.2024.2160p.UHD.BluRay.DDP5.1-GROUP", "a-dp"],
    ["DoVi + DDP", "Movie.2024.2160p.UHD.BluRay.DoVi.DDP5.1-GROUP", "a-dv,a-dp"],
    [
      "Dolby Digital Plus spelled out (DV combo)",
      "Movie.2026.2160p.WEBrip.HEVC.DV.HDR10.Dolby.Digital.Plus.6.1.mkv",
      "a-dp",
    ],
    [
      "Dolby Digital Plus spelled out (DDP only)",
      "Movie.2026.2160p.WEBrip.HEVC.Dolby.Digital.Plus.6.1.mkv",
      "a-dp",
    ],
    [
      "Spider-Noir AMZN space-separated Atmos+DV",
      spiderNoir,
      "v-at-dv",
      "v-dv-hdr10p",
    ],
    ...streamingCases,
  ];

  for (const row of cases) {
    const [label, sample, expected, forbidden = ""] = row;
    const allIds = [...comboIds, ...visualIds];
    const hits = allIds.filter((id) => patterns[id].test(sample));
    if (!assertHits(label, hits, expected, forbidden)) ok = false;
  }

  const nuvioCases = [
    [
      "Nuvio candidates: user DV+DDP",
      [
        userFilename,
        "DV HDR10+",
        "DDP",
        "2160p",
        "WEB-DL",
        "HEVC",
        "Project Hail Mary (2026)",
      ],
      "v-dv-hdr10p,a-dp",
    ],
    [
      "Nuvio candidates: user DV+DDP+Atmos",
      [
        userAtmos,
        "DV HDR10+ HDR10Plus",
        "DDP Atmos TrueHD",
        "Atmos",
        "Dolby Vision",
        "TrueHD Atmos 7.1",
        "Dolby Digital Plus",
      ],
      "v-at-dv,a-at-th",
      "v-dv-hdr10p",
    ],
    [
      "Nuvio candidates: remux combo",
      [
        filename,
        "DV HDR10+",
        "TrueHD Atmos 7.1",
        "DDP 5.1",
        "2160p",
        "REMUX",
      ],
      "v-at-dv,a-at-th",
    ],
    [
      "Nuvio split video/audio dotted slices (DV+DDP)",
      [
        "Movie.2024.2160p.UHD.BluRay.REMUX.HEVC.DV.HDR10Plus.DDP5.1-GROUP",
        "Movie.2024.2160p.UHD.BluRay.REMUX.HEVC.DV.HDR10Plus",
        "Movie.2024.2160p.UHD.BluRay.REMUX.DDP5.1",
        "DV HDR10+",
        "DDP5.1",
      ],
      "v-dv-hdr10p,a-dp",
    ],
    [
      "Nuvio split slices DV+DDP+Atmos",
      [
        "Movie.2024.2160p.UHD.BluRay.REMUX.HEVC.DV.HDR10Plus.DDP5.1.Atmos.TrueHD-GROUP",
        "Movie.2024.2160p.UHD.BluRay.REMUX.HEVC.DV.HDR10Plus",
        "Movie.2024.2160p.UHD.BluRay.REMUX.DDP5.1.Atmos.TrueHD",
      ],
      "v-at-dv,a-at-th",
      "v-dv-hdr10p",
    ],
    [
      "DV only still shows standalone",
      ["Movie.2024.2160p.UHD.BluRay.DV.7.1-GROUP"],
      "a-dv",
    ],
    [
      "DDP only still shows standalone",
      ["Movie.2024.2160p.UHD.BluRay.DDP5.1-GROUP"],
      "a-dp",
    ],
    [
      "Hail Mary WEBrip display + dotted DV raw (user report)",
      [
        hailMaryWebrip,
        hailMaryWebripDotted,
        "2160p WEBrip",
        "DDP5.1",
        "DV HDR10+",
        "Dolby Vision",
      ],
      "v-dv-hdr10p",
    ],
    [
      "DDP-only WEBrip (dotted torrent name, no DV)",
      ["Movie.2024.2160p.WEBrip.HEVC.DDP5.1.mkv"],
      "a-dp",
    ],
    [
      "Hail Mary bracket filename + split slices (user report)",
      [
        hailMaryBracket,
        "2160p.WEBrip.HEVC.DV.HDR10.Dolby.Digital.Plus.6.1",
        "2160p.WEBrip.HEVC.DV.HDR10",
        "Dolby.Digital.Plus.6.1",
        "Dolby Vision",
        "Dolby Digital Plus",
        "DV HDR10",
        "Project Hail Mary 2026",
      ],
      "v-dv-hdr10,a-dp",
    ],
    [
      "Nuvio candidates: Spider-Noir AMZN space-separated Atmos+DV",
      [
        spiderNoir,
        "DV HDR10+ HDR10Plus",
        "DDP Atmos",
        "Atmos",
        "Dolby Vision",
        "2160p",
        "WEB-DL",
        "HEVC",
      ],
      "v-at-dv",
      "v-dv-hdr10p,a-at-dp",
    ],
    [
      "Nuvio S01E04 FLUX: combo only (no duplicate DD+ on partial title)",
      [
        spiderNoirE04,
        "Spider-Noir S01E04 2160p AMZN WEB-DL DDP5.1",
        "Spider-Noir S01E04 2160p AMZN WEB-DL DDP5 1",
        "Spider.Noir.S01E04.2160p.AMZN.WEB-DL.DDP5.1.Atmos.DV.HDR.H265-FLUX.mkv",
        "Spider.Noir.S01E04.2160p.AMZN.WEB-DL.DDP5.1.mkv",
        "DV HDR",
        "DDP Atmos",
        "Dolby Digital Plus",
      ],
      "v-at-dv",
      "v-dv-hdr,a-at-dp",
    ],
    [
      "Metadata-only: DV HDR10+ + DDP fragments",
      ["2160p WEB-DL", "DV HDR10+", "DDP"],
      "v-dv-hdr10p",
    ],
    [
      "Metadata-only: Dolby Vision + Atmos + DDP",
      ["Dolby Vision", "Atmos", "DDP 5.1"],
      "v-at-dv",
      "a-at-dp",
    ],
    [
      "Atmos exclude group W4NK3R (no standalone Atmos badge)",
      ["Movie.2024.2160p.W4NK3R.Atmos.TrueHD-GROUP"],
      "",
    ],
  ];

  const visualCases = [
    ["HDR10+ metadata fragment", "HDR10+", "v-hdr10p"],
    ["HDR10PIus typo metadata", "HDR10PIus", "v-hdr10p"],
    ["HDR10 without plus (no DV in haystack)", "HDR10", "v-hdr10"],
    ["HLG metadata", "HLG", "v-hlg"],
  ];

  for (const [label, candidates, expected, forbidden = ""] of nuvioCases) {
    if (!assertHits(label, nuvioHits(patterns, candidates), expected, forbidden)) ok = false;
  }

  for (const [label, sample, expected] of visualCases) {
    const hits = visualHitsFor(patterns, sample);
    const expectedHits = expected.split(/,\s*/).filter(Boolean);
    const pass =
      expectedHits.every((e) => hits.includes(e)) &&
      hits.length === expectedHits.length;
    console.log(`${pass ? "OK" : "FAIL"} ${label}`);
    console.log(`      -> ${hits.join(", ") || "(none)"}`);
    if (!pass) ok = false;
  }

  const drJoinedCases = [
    [
      "Joined combo filename + DV marker (no standalone DV)",
      [filename, `stats ${DR_DV_MARKER}`],
      "v-at-dv,a-at-th",
      "a-dv",
    ],
    [
      "Joined combo filename + HDR marker (no HDR badge)",
      [filename, `stats ${DR_HDR_MARKER}`],
      "v-at-dv,a-at-th",
      "v-hdr,v-hdr10,v-hdr10p",
    ],
    [
      "Joined DV+HDR10 filename + HDR marker (DV·HDR10 merge)",
      ["Movie.2024.2160p.UHD.BluRay.DV.HDR10.7.1-GROUP", `stats ${DR_HDR_MARKER}`],
      "v-dv-hdr10",
      "a-dv,v-hdr,v-hdr10",
    ],
    [
      "Joined Spider-Noir combo + markers (no duplicate DV/HDR)",
      [spiderNoirE04, `stats ${DR_DV_MARKER}`, `stats ${DR_HDR_MARKER}`],
      "v-at-dv",
      "a-dv,v-hdr,v-dv-hdr,a-at-dp",
    ],
    [
      "Joined DV marker + DDP (no standalone DV)",
      [`Title ${DR_DV_MARKER}`, "DDP 5.1"],
      "",
      "a-dv",
    ],
    [
      "HDR10+ metadata with DV in same haystack",
      ["2160p WEB-DL DV HDR10+"],
      "v-dv-hdr10p",
      "v-hdr10p,v-hdr,a-dv",
    ],
    [
      "Filename DV+HDR10+ combo (no generic HDR)",
      ["Movie.2024.2160p.HEVC.HDR10+.DV.DDP-GROUP"],
      "a-dp",
      "v-hdr,a-dv",
    ],
  ];

  for (const [label, candidates, expected, forbidden = ""] of drJoinedCases) {
    const hits = nuvioJoinedHits(patterns, candidates);
    if (!assertHits(label, hits, expected, forbidden)) ok = false;
  }

  process.exit(ok ? 0 : 1);
}

main();
