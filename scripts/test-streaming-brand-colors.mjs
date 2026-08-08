import { STREAMING_BADGES } from "./streaming-badges.mjs";
import {
  STREAMING_BRAND_RGB,
  streamingBrandStroke,
} from "./streaming-brand-colors.mjs";
import { applySolidTheme } from "./badge-solid-theme.mjs";
import { strokeForFilter } from "./badge-transparent-theme.mjs";

let failed = 0;
function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

const expected = {
  "s-nflx": { fill: "#E50914", stroke: "#FFE50914" },
  "s-amzn": { fill: "#00A8E1", stroke: "#FF00A8E1" },
  "s-atvp": { fill: "#000000", stroke: "#FF000000" },
  "s-dsnp": { fill: "#00C7DC", stroke: "#FF00C7DC" },
  "s-hmax": { fill: "#B100FF", stroke: "#FFB100FF" },
  "s-hulu": { fill: "#1CE783", stroke: "#FF1CE783" },
  "s-pcok": { fill: "#FFB81C", stroke: "#FFFFB81C" },
  "s-pamp": { fill: "#0050D0", stroke: "#FF0050D0" },
  "s-croll": { fill: "#F47521", stroke: "#FFF47521" },
};

for (const def of STREAMING_BADGES) {
  const exp = expected[def.id];
  if (!exp) fail(`missing expected colors for ${def.id}`);
  const stroke = strokeForFilter(def.id, "gs");
  if (stroke !== exp.stroke) fail(`${def.id} mono stroke ${stroke} expected ${exp.stroke}`);
  const solid = applySolidTheme({ id: def.id, groupId: "gs" });
  if (solid.tagColor !== exp.fill) fail(`${def.id} solid fill ${solid.tagColor} expected ${exp.fill}`);
  if (solid.borderColor !== exp.stroke) fail(`${def.id} solid border mismatch`);
}

if (Object.keys(STREAMING_BRAND_RGB).length !== STREAMING_BADGES.length) {
  fail("brand map size mismatch");
}

if (!failed) console.log("All streaming brand color tests passed.");
process.exit(failed ? 1 : 0);
