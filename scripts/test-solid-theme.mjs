import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { applySolidTheme, solidColorsForFilter } from "./badge-solid-theme.mjs";
import { isTransparentFill } from "./badge-transparent-theme.mjs";
import { SOLID_BADGES_PATH } from "./badge-patch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const badgesPath = SOLID_BADGES_PATH;

let failed = 0;
function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

const { fill, border } = solidColorsForFilter("s-nflx", "gs");
if (fill !== "#E50914") fail(`Netflix fill expected #E50914 got ${fill}`);
if (border !== "#FFE50914") fail(`Netflix border expected #FFE50914 got ${border}`);

for (const [id, groupId] of [
  ["web-unranked", "gms"],
  ["web-1", "gms"],
  ["blu-ray-8", "gms"],
  ["remux-3", "gms"],
]) {
  const c = solidColorsForFilter(id, groupId);
  if (c.fill !== "#1565C0") fail(`${id} fill expected tier-2 #1565C0 got ${c.fill}`);
}

const v = applySolidTheme({ id: "v-hdr10", groupId: "gv" });
if (v.tagColor !== "#FFD54F") fail(`visual fill ${v.tagColor}`);
if (v.textColor !== "#000000") fail(`visual text ${v.textColor}`);
if (isTransparentFill(v.tagColor)) fail("visual tagColor must not be transparent");

const data = JSON.parse(await fs.readFile(badgesPath, "utf8"));
const transparent = data.filters.filter((f) => isTransparentFill(f.tagColor));
if (transparent.length) {
  fail(`${transparent.length} filters still transparent`);
}
const eightDigitFill = data.filters.filter((f) => /^#[0-9A-F]{8}$/i.test(f.tagColor));
if (eightDigitFill.length) {
  fail(`${eightDigitFill.length} filters use 8-digit tagColor`);
}

const tr = JSON.parse(
  await fs.readFile(path.join(__dirname, "..", "kanso-transparent.json"), "utf8")
);
const sameAsTransparent = data.filters.filter((f) => {
  const t = tr.filters.find((x) => x.id === f.id);
  return t && f.tagColor === t.tagColor;
});
if (sameAsTransparent.length > 0) {
  fail(`${sameAsTransparent.length} filters have same tagColor as transparent`);
}

if (!failed) console.log("All solid theme tests passed.");
process.exit(failed ? 1 : 0);
