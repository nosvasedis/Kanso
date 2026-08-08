import { applyFilterMeta } from "./badge-filter-meta.mjs";

function re(id) {
  const p = applyFilterMeta({ id, pattern: "" }).pattern;
  const inline = p.startsWith("(?i)");
  return new RegExp(inline ? p.slice(4) : p, inline ? "i" : "");
}

const mergeIds = [
  "v-dv-hdr10p",
  "v-dv-hdr10",
  "v-dv-hdr",
  "a-at-th",
  "a-at-dp",
  "a-dtsx-ma",
  "a-dtsx-hd",
];
const suppressPairs = [
  ["v-dv-hdr10p", "a-dv", "Movie.2024.2160p.UHD.DV.HDR10+.Remux-GROUP"],
  ["v-dv-hdr10p", "v-hdr10p", "Movie.2024.2160p.UHD.DV.HDR10+.Remux-GROUP"],
  ["v-dv-hdr10", "v-hdr10", "Movie.2024.2160p.UHD.DV.HDR10.BluRay-GROUP"],
  ["a-at-th", "a-at", "Movie.2024.1080p.FHD.Atmos.TrueHD-GROUP"],
  ["a-at-th", "a-th", "Movie.2024.1080p.FHD.Atmos.TrueHD-GROUP"],
  ["a-at-dp", "a-dp", "Movie.2024.1080p.FHD.Atmos.DDP5.1-GROUP"],
  ["a-dtsx-ma", "a-dtsx", "Movie.2024.1080p.FHD.DTS-X.DTS-HD.MA-GROUP"],
];

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    console.log("FAIL", label);
    failed++;
  }
}

for (const id of mergeIds) {
  assert(`${id} pattern exists`, applyFilterMeta({ id, pattern: "" }).pattern.length > 20);
}

for (const [mergeId, standaloneId, sample] of suppressPairs) {
  assert(`${mergeId} matches ${sample}`, re(mergeId).test(sample));
  assert(`${standaloneId} suppressed for ${mergeId}`, !re(standaloneId).test(sample));
}

assert("v-hlg matches HLG tag", re("v-hlg").test("Movie.2024.1080p.FHD.HLG.WEB-GROUP"));
assert("v-hlg not on plain HDR", !re("v-hlg").test("Movie.2024.1080p.FHD.HDR.WEB-GROUP"));
assert("v-10bit matches 10bit", re("v-10bit").test("Movie.2024.1080p.FHD.10bit.WEB-GROUP"));
assert("v-ai matches AI upscale", re("v-ai").test("Movie.2024.AI.Upscale.1080p.FHD-GROUP"));
assert("hybrid-release matches", re("hybrid-release").test("Movie.2024.HYBRID.1080p-GROUP"));
assert("criterion-collection matches", re("criterion-collection").test("Movie.Criterion.Collection.1080p-GROUP"));
assert("uncensored-edition matches", re("uncensored-edition").test("Movie.2024.UNCENSORED.1080p-GROUP"));
assert("proper-release matches", re("proper-release").test("Movie.2024.PROPER.1080p-GROUP"));
assert("repack-release matches", re("repack-release").test("Movie.2024.REPACK.1080p-GROUP"));
assert("r-1440 matches 1440p", re("r-1440").test("Movie.2024.1440p.WEB-GROUP"));
assert("r-1440 not when 4k present", !re("r-1440").test("Movie.2024.2160p.1440p.WEB-GROUP"));

console.log(failed ? `${failed} smart-tier test failures` : "All smart-tier tests passed");
process.exit(failed ? 1 : 0);
