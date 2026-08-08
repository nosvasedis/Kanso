import { applyFilterMeta } from "./badge-filter-meta.mjs";

function re(id) {
  const p = applyFilterMeta({ id, pattern: "" }).pattern;
  const inline = p.startsWith("(?i)");
  return new RegExp(inline ? p.slice(4) : p, inline ? "i" : "");
}

const sdr = re("v-sdr");

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    console.log("FAIL", label);
    failed++;
  }
}

assert("explicit SDR in filename", sdr.test("Movie.2024.2160p.SDR.BluRay-GROUP"));
assert("parsed SDR tag", sdr.test("SDR"));
assert("WEBRip without SDR token", !sdr.test("Show.2024.1080p.WEBRip-GROUP"));
assert("remux without SDR token", !sdr.test("Movie.2024.2160p.REMUX-GROUP"));
assert("HDR10 without SDR token", !sdr.test("Movie.2024.2160p.HDR10.GROUP"));
assert("DV without SDR token", !sdr.test("Movie.2024.2160p.DV.GROUP"));
assert("HDR + explicit SDR suppressed", !sdr.test("Movie.2024.2160p.HDR.SDR.GROUP"));

console.log(failed ? `${failed} sdr-badge test failures` : "All sdr-badge tests passed");
process.exit(failed ? 1 : 0);
