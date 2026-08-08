import { applyFilterMeta } from "./badge-filter-meta.mjs";
import { solidColorsForFilter } from "./badge-solid-theme.mjs";
import { strokeForFilter, STROKE } from "./badge-transparent-theme.mjs";

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

assert("576 matches", re("r-576").test("Show.S01E01.576p.x264"));
assert("480 matches", re("r-480").test("Show.S01E01.480p.x264"));
assert("360 matches", re("r-360").test("Clip.360p.mp4"));
assert("240 matches", re("r-240").test("Clip.240p.mp4"));
assert("1080 no match in 10800", !re("r-1080").test("id10800"));
assert("4k still works", re("r-4k").test("Movie.2160p.UHD.BluRay"));
assert("1440 matches", re("r-1440").test("Movie.2024.1440p.WEB-GROUP"));
assert("1440 excluded when 4k present", !re("r-1440").test("Movie.2160p.1440p.WEB"));
assert("1440 solid good tier", solidColorsForFilter("r-1440", "gr").fill === "#FF9728");

assert("576 solid ok tier", solidColorsForFilter("r-576", "gr").fill === "#E55353");
assert("360 solid ok tier", solidColorsForFilter("r-360", "gr").fill === "#E55353");
assert("240 solid ok tier", solidColorsForFilter("r-240", "gr").fill === "#E55353");
assert("576 transparent ok stroke", strokeForFilter("r-576", "gr") === STROKE.qualityOk);
assert("360 transparent ok stroke", strokeForFilter("r-360", "gr") === STROKE.qualityOk);
assert("240 transparent ok stroke", strokeForFilter("r-240", "gr") === STROKE.qualityOk);

console.log(failed ? `${failed} resolution test failures` : "All resolution tests passed");
process.exit(failed ? 1 : 0);
