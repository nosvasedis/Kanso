import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  applyTransparentTheme,
  isLegacyFilled,
  isTransparentFill,
  TRANSPARENT_FILL,
  TRANSPARENT_TAG_STYLE,
  TRANSPARENT_TEXT,
  MONO_FILTER_ORDER,
  MONO_GROUP_ORDER,
  STROKE,
  strokeForFilter,
} from "./badge-transparent-theme.mjs";
import { STREAMING_BADGES } from "./streaming-badges.mjs";
import { TRANSPARENT_BADGES_PATH } from "./badge-patch.mjs";

const data = JSON.parse(await fs.readFile(TRANSPARENT_BADGES_PATH, "utf8"));
const byId = Object.fromEntries(data.filters.map((f) => [f.id, f]));
const EXPECTED_FILTER_COUNT = MONO_GROUP_ORDER.flatMap((g) => MONO_FILTER_ORDER[g] ?? []).length;

let ok = true;
function fail(msg) {
  console.error("FAIL:", msg);
  ok = false;
}
function pass(msg) {
  console.log("ok:", msg);
}

for (const filter of data.filters) {
  if (!isTransparentFill(filter.tagColor)) {
    fail(`${filter.id} tagColor not transparent: ${filter.tagColor}`);
  }
  if (filter.tagStyle !== TRANSPARENT_TAG_STYLE) {
    fail(`${filter.id} tagStyle expected "${TRANSPARENT_TAG_STYLE}"`);
  }
  if (filter.textColor?.toUpperCase() !== TRANSPARENT_TEXT.toUpperCase()) {
    fail(`${filter.id} textColor expected ${TRANSPARENT_TEXT}`);
  }
  const expectedStroke = strokeForFilter(filter.id, filter.groupId);
  if (filter.borderColor?.toUpperCase() !== expectedStroke.toUpperCase()) {
    fail(`${filter.id} borderColor ${filter.borderColor} expected ${expectedStroke}`);
  }
  if (isLegacyFilled(filter.tagColor)) {
    fail(`${filter.id} uses legacy fill ${filter.tagColor}`);
  }
}

const seadex = byId["seadex-release"];
if (seadex.borderColor?.toUpperCase() !== STROKE.seadex.toUpperCase()) {
  fail(`seadex border should be ${STROKE.seadex}`);
} else {
  pass("seadex deep purple stroke");
}

if (!isTransparentFill(seadex.tagColor)) {
  fail("seadex should have transparent fill");
} else {
  pass("seadex transparent fill");
}

for (const def of STREAMING_BADGES) {
  const f = byId[def.id];
  if (!f) fail(`missing streaming filter ${def.id}`);
  else if (!f.imageURL) fail(`${def.id} missing imageURL`);
  else {
    const stroke = strokeForFilter(def.id, "gs");
    if (f.borderColor?.toUpperCase() !== stroke.toUpperCase()) {
      fail(`${def.id} border ${f.borderColor} expected brand stroke ${stroke}`);
    } else {
      pass(`streaming ${def.id} brand stroke`);
    }
  }
}

const sample = applyTransparentTheme({ id: "web-1", groupId: "gms" });
if (sample.borderColor !== STROKE.media) fail("applyTransparentTheme media stroke");
else pass("applyTransparentTheme");

if (data.filters.length !== EXPECTED_FILTER_COUNT)
  fail(`expected ${EXPECTED_FILTER_COUNT} filters, got ${data.filters.length}`);

if (!ok) process.exit(1);
console.log("\nAll transparent theme tests passed.");
