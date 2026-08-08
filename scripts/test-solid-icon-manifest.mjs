import fs from "fs/promises";
import { CANONICAL_ICON_URLS } from "./canonical-icon-urls.mjs";
import { SOLID_ICONS_MANIFEST_PATH } from "./badge-solid-icons.mjs";
import { STREAMING_BADGES } from "./streaming-badges.mjs";

let failed = 0;
function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

const manifest = JSON.parse(await fs.readFile(SOLID_ICONS_MANIFEST_PATH, "utf8"));

for (const def of STREAMING_BADGES) {
  const url = manifest[def.id];
  if (!url?.startsWith("http")) fail(`streaming ${def.id} missing https URL`);
  else if (url === manifest["s-nflx"] && def.id === "s-nflx" && url.includes("y9qrrj")) {
    fail("streaming s-nflx still uses mono-regenerated catbox slug");
  }
}

if (manifest["web-6"] !== CANONICAL_ICON_URLS["web-6"]) {
  fail(`web-6 should be canonical fnyika, got ${manifest["web-6"]}`);
}
if (manifest["web-6"]?.includes("aoxi0a")) {
  fail("web-6 still uses fuzzy mono re-upload");
}

if (manifest["q-w"] !== CANONICAL_ICON_URLS["q-w"]) {
  fail(`q-w should be canonical nvccpa, got ${manifest["q-w"]}`);
}

const solidJson = JSON.parse(
  await fs.readFile(new URL("../kanso-solid.json", import.meta.url), "utf8")
);
const nflx = solidJson.filters.find((f) => f.id === "s-nflx");
if (!nflx?.imageURL?.startsWith("https://")) fail("solid json s-nflx missing https");
if (nflx?.imageURL?.includes("y9qrrj")) fail("solid json s-nflx still mono slug");

if (!failed) console.log("Solid icon manifest checks passed.");
process.exit(failed ? 1 : 0);
