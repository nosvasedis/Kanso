import { DR_ALL_MARKERS } from "./dr-formatter-markers.mjs";
import { FORMATTER_DR_INJECT } from "./dr-formatter-inject.mjs";
import { SEADEX_MARKER } from "./quality-rank-patterns.mjs";
import { STREAMING_MARKERS } from "./streaming-formatter-patterns.mjs";
import {
  EDITION_BW_MARKER,
  EDITION_DC_MARKER,
} from "./edition-badge-patterns.mjs";

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    console.log("FAIL", label);
    failed++;
  }
}

assert("inject uses visualTags for DV", FORMATTER_DR_INJECT.includes("visualTags::~DV"));
assert(
  "DV marker gated on standalone (no combo audio)",
  FORMATTER_DR_INJECT.includes("filename::~DDP::or::") &&
    FORMATTER_DR_INJECT.includes("filename::~Atmos") &&
    FORMATTER_DR_INJECT.includes("::isfalse")
);
assert("HDR inject blocks filename DV token", FORMATTER_DR_INJECT.includes("filename::~DV::isfalse"));
assert("DV marker blocked when filename has DDP or Atmos", FORMATTER_DR_INJECT.includes("filename::~DDP::or::"));
assert("inject uses resolution for inference", FORMATTER_DR_INJECT.includes("stream.resolution::=2160p"));
assert("inject uses quality for remux", FORMATTER_DR_INJECT.includes("stream.quality::~REMUX"));
assert("all DR markers in inject", DR_ALL_MARKERS.every((m) => FORMATTER_DR_INJECT.includes(m)));

for (const marker of DR_ALL_MARKERS) {
  assert(`no collision with SeaDex ${marker}`, !SEADEX_MARKER.includes(marker));
  assert(`no collision with edition DC ${marker}`, !EDITION_DC_MARKER.includes(marker));
  assert(`no collision with edition BW ${marker}`, !EDITION_BW_MARKER.includes(marker));
}
for (const [id, sm] of Object.entries(STREAMING_MARKERS)) {
  for (const dm of DR_ALL_MARKERS) {
    assert(`DR marker distinct from streaming ${id}`, sm !== dm);
  }
}
assert("DR markers not superscript digits", !/\u2074|\u2075|\u2076|\u2077/.test(FORMATTER_DR_INJECT));

console.log(failed ? `${failed} dr-inject test failures` : "All dr-inject tests passed");
process.exit(failed ? 1 : 0);
