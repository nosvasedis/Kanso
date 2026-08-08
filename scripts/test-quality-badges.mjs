import fs from "fs/promises";
import { MONO_FILTER_ORDER, RELEASE_FILTER_IDS } from "./badge-transparent-theme.mjs";
import { SOLID_BADGES_PATH, TRANSPARENT_BADGES_PATH } from "./badge-patch.mjs";

const EXPECTED_GQ = [
  "q-br",
  "q-bb",
  "q-bw",
  "q-gr",
  "q-gb",
  "q-gw",
  "q-or",
  "q-ob",
  "q-ow",
];

let failed = 0;
function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

if (JSON.stringify(MONO_FILTER_ORDER.gq) !== JSON.stringify(EXPECTED_GQ)) {
  fail(`gq order mismatch: ${MONO_FILTER_ORDER.gq.join(",")}`);
}
if (JSON.stringify(MONO_FILTER_ORDER.grl) !== JSON.stringify(RELEASE_FILTER_IDS)) {
  fail(`grl order mismatch: ${MONO_FILTER_ORDER.grl?.join(",")}`);
}

const solid = JSON.parse(await fs.readFile(SOLID_BADGES_PATH, "utf8"));
const transparent = JSON.parse(await fs.readFile(TRANSPARENT_BADGES_PATH, "utf8"));

for (const data of [solid, transparent]) {
  const gq = data.filters.filter((f) => f.groupId === "gq");
  if (gq.length !== 9) fail(`expected 9 gq filters, got ${gq.length}`);

  const grl = data.filters.filter((f) => f.groupId === "grl");
  if (grl.length !== RELEASE_FILTER_IDS.length) {
    fail(`expected ${RELEASE_FILTER_IDS.length} grl filters, got ${grl.length}`);
  }

  const byId = Object.fromEntries(grl.map((f) => [f.id, f]));
  const RELEASE_NAMES = {
    "q-r": "Remux",
    "q-b": "BluRay",
    "q-w": "WebDL",
    "q-wr": "WebRip",
    "q-cam": "CAM",
    "q-hdtv": "HDTV",
  };
  for (const id of RELEASE_FILTER_IDS) {
    const f = byId[id];
    if (!f) fail(`missing release badge ${id}`);
    else if (f.name !== RELEASE_NAMES[id]) {
      fail(`${id} name should be ${RELEASE_NAMES[id]}, got ${f.name}`);
    }
  }

  const wr = byId["q-wr"];
  const rem = byId["q-r"];
  if (wr?.imageURL && rem?.imageURL && wr.imageURL === rem.imageURL) {
    fail("q-wr and q-r must not share the same icon URL");
  }
}

const remuxCombos = solid.filters.filter(
  (f) => f.groupId === "gq" && ["q-br", "q-gr", "q-or"].includes(f.id)
);
if (remuxCombos.length !== 3) fail(`expected 3 ranked Remux combos, got ${remuxCombos.length}`);

if (!failed) console.log("Quality badge layout checks passed.");
process.exit(failed ? 1 : 0);
