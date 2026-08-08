import fs from "fs/promises";
import {
  applyMonoTheme,
  MONO_BORDER,
  MONO_FILL,
  MONO_TAG_STYLE,
  MONO_TEXT,
} from "./badge-mono-theme.mjs";
import {
  applyTransparentTheme,
  isTransparentFill,
  strokeForFilter,
  MONO_FILTER_ORDER,
  MONO_GROUP_ORDER,
} from "./badge-transparent-theme.mjs";
import { MONO_BADGES_PATH } from "./badge-patch.mjs";

const data = JSON.parse(await fs.readFile(MONO_BADGES_PATH, "utf8"));
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
  if (filter.groupId === "gl") {
    if (!isTransparentFill(filter.tagColor)) {
      fail(`${filter.id} language should keep transparent fill`);
    }
    const langStroke = strokeForFilter(filter.id, "gl");
    if (filter.borderColor?.toUpperCase() !== langStroke.toUpperCase()) {
      fail(`${filter.id} language stroke should match transparent theme`);
    }
    continue;
  }
  if (filter.tagColor?.toUpperCase() !== MONO_FILL) {
    fail(`${filter.id} tagColor expected ${MONO_FILL}, got ${filter.tagColor}`);
  }
  if (filter.borderColor?.toUpperCase() !== MONO_BORDER.toUpperCase()) {
    fail(`${filter.id} borderColor expected ${MONO_BORDER}, got ${filter.borderColor}`);
  }
  if (filter.textColor?.toUpperCase() !== MONO_TEXT.toUpperCase()) {
    fail(`${filter.id} textColor expected ${MONO_TEXT}`);
  }
  if (filter.tagStyle !== MONO_TAG_STYLE) {
    fail(`${filter.id} tagStyle expected ${MONO_TAG_STYLE}`);
  }
}

const themed = applyMonoTheme({ id: "s-nflx", groupId: "gs" });
if (themed.tagColor !== MONO_FILL || themed.borderColor !== MONO_BORDER) {
  fail("applyMonoTheme non-language");
} else {
  pass("applyMonoTheme black/white");
}

const lang = applyMonoTheme({ id: "l-en", groupId: "gl" });
const langRef = applyTransparentTheme({ id: "l-en", groupId: "gl" });
if (lang.tagColor !== langRef.tagColor || lang.borderColor !== langRef.borderColor) {
  fail("language badges should match transparent styling");
} else {
  pass("language badges unchanged vs transparent");
}

if (byId["s-nflx"]?.borderColor?.toUpperCase() === strokeForFilter("s-nflx", "gs").toUpperCase()) {
  fail("streaming should not use brand-colored stroke in true mono");
} else {
  pass("streaming uses white stroke");
}

if (data.filters.length !== EXPECTED_FILTER_COUNT)
  fail(`expected ${EXPECTED_FILTER_COUNT} filters, got ${data.filters.length}`);

if (!ok) process.exit(1);
console.log("\nAll true mono theme tests passed.");
