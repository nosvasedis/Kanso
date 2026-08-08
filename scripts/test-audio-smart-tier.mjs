/**
 * Kingsizew README audio Smart Tier examples + coexistence checks.
 */
import { applyFilterMeta } from "./badge-filter-meta.mjs";

function re(id) {
  const p = applyFilterMeta({ id, pattern: "" }).pattern;
  const inline = p.startsWith("(?i)");
  return new RegExp(inline ? p.slice(4) : p, inline ? "i" : "");
}

function hits(sample, ids) {
  return ids.filter((id) => {
    const p = applyFilterMeta({ id, pattern: "" }).pattern;
    const inline = p.startsWith("(?i)");
    return new RegExp(inline ? p.slice(4) : p, inline ? "i" : "").test(sample);
  });
}

function assertSet(label, sample, expected, forbidden = []) {
  const got = hits(sample, [...expected, ...forbidden]);
  const expOk = expected.every((id) => got.includes(id));
  const forbidOk = forbidden.every((id) => !got.includes(id));
  if (!expOk || !forbidOk) {
    console.log("FAIL", label);
    console.log("  sample:", sample.slice(0, 90));
    console.log("  got:", got.join(", ") || "(none)");
    console.log("  want:", expected.join(", "));
    if (forbidden.length) console.log("  forbid:", forbidden.join(", "));
    return false;
  }
  console.log("OK", label, "->", got.join(", ") || "(none)");
  return true;
}

const audioIds = [
  "a-at-th",
  "a-dtsx-ma",
  "a-at-dp",
  "a-dtsx-hd",
  "a-dtsx",
  "a-dtsma",
  "a-dtshd",
  "a-dtses",
  "a-dts",
  "a-at",
  "a-th",
  "a-dp",
  "a-dd",
  "a-flac",
  "a-opus",
  "a-aac",
];

let failed = 0;
const check = (label, sample, expected, forbidden = []) => {
  if (!assertSet(label, sample, expected, forbidden)) failed++;
};

const base = "Movie.2024.2160p.UHD.BluRay";

check(
  "Atmos TrueHD + DTS:X MA + FLAC",
  `${base}.Atmos.TrueHD.DTS-X.DTS-HD.MA.FLAC-GROUP`,
  ["a-at-th", "a-dtsx-ma"],
  ["a-flac", "a-at", "a-th", "a-dtsx", "a-dtsma"]
);

check(
  "Atmos TrueHD + DTS-HD + FLAC",
  `${base}.Atmos.TrueHD.DTS-HD.FLAC-GROUP`,
  ["a-at-th", "a-flac"],
  ["a-dtshd", "a-at", "a-th"]
);

check(
  "DD+ + DTS-HD + FLAC",
  `${base}.DDP5.1.DTS-HD.FLAC-GROUP`,
  ["a-dtshd", "a-flac"],
  ["a-dp"]
);

check(
  "DD+ + DTS-ES + FLAC",
  `${base}.DDP5.1.DTS-ES.FLAC-GROUP`,
  ["a-dp", "a-flac"],
  ["a-dtses"]
);

check(
  "DTS + Opus",
  `${base}.DTS.Opus-GROUP`,
  ["a-dts"],
  ["a-opus"]
);

check(
  "Opus + AAC",
  `${base}.Opus.AAC-GROUP`,
  ["a-opus"],
  ["a-aac"]
);

check(
  "FLAC + Opus + AAC",
  `${base}.FLAC.Opus.AAC-GROUP`,
  ["a-flac"],
  ["a-opus", "a-aac"]
);

check(
  "Atmos+DV remux — visual Atmos·DV + audio merge",
  `${base}.DV.Atmos.TrueHD.Remux-GROUP`,
  ["v-at-dv", "a-at-th"],
  ["a-at", "a-th"]
);

check(
  "DTS-ES standalone",
  `${base}.DTS-ES-GROUP`,
  ["a-dtses"],
  ["a-dts"]
);

console.log(failed ? `${failed} audio smart-tier failures` : "All audio smart-tier tests passed");
process.exit(failed ? 1 : 0);
