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

const cam = re("q-cam");
const hdtv = re("q-hdtv");

assert("CAM matches hdcam", cam.test("Movie.2024.HDCAM.x264-GROUP"));
assert("CAM matches telesync", cam.test("Movie.2024.TS.x264-GROUP"));
assert("CAM matches with rank star", cam.test("🎬 Movie (2024) 3★ Movie.2024.CAM.x264"));
assert("CAM rejects web-dl", !cam.test("Movie.2024.1080p.WEB-DL.x264-GROUP"));
assert("HDTV matches hdtv", hdtv.test("Show.S01E01.HDTV.x264-GROUP"));
assert("HDTV matches pdtv", hdtv.test("Show.S01E01.PDTV.x264-GROUP"));

const camSolid = solidColorsForFilter("q-cam", "grl");
const wrSolid = solidColorsForFilter("q-wr", "grl");
assert("CAM solid same gray as WebRip", camSolid.fill === wrSolid.fill);
assert("CAM transparent release stroke", strokeForFilter("q-cam", "grl") === STROKE.release);

console.log(failed ? `${failed} bad-source test failures` : "All bad-source tests passed");
process.exit(failed ? 1 : 0);
