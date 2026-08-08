import { applyFilterMeta } from "./badge-filter-meta.mjs";
import { DR_DV_MARKER, DR_HDR_MARKER, DR_HDR10P_MARKER } from "./dr-formatter-markers.mjs";

function re(id) {
  const p = applyFilterMeta({ id, pattern: "" }).pattern;
  const inline = p.startsWith("(?i)");
  return new RegExp(inline ? p.slice(4) : p, inline ? "i" : "");
}

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    console.log("FAIL", label);
    failed++;
  }
}

assert("a-dv matches DV marker", re("a-dv").test(`Title ${DR_DV_MARKER}`));
assert("v-hdr10p matches HDR10+ marker", re("v-hdr10p").test(DR_HDR10P_MARKER));
assert("v-hdr matches HDR marker", re("v-hdr").test(DR_HDR_MARKER));
assert("v-hdr matches filename HDR", re("v-hdr").test("Movie.2024.2160p.HDR.HEVC-GROUP"));

console.log(failed ? `${failed} dr-badge test failures` : "All dr-badge tests passed");
process.exit(failed ? 1 : 0);
