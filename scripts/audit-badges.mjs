/**
 * Quick parity audit: solid + transparent + true mono badge JSON.
 */
import fs from "fs/promises";
import { MONO_FILTER_ORDER, MONO_GROUP_ORDER } from "./badge-transparent-theme.mjs";
import { syncTierGroupsFromVidhin } from "./tier-group-sync.mjs";
import {
  SOLID_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
  MONO_BADGES_PATH,
} from "./badge-patch.mjs";

async function loadFilters(p) {
  return JSON.parse(await fs.readFile(p, "utf8")).filters;
}

const expected = new Set(
  MONO_GROUP_ORDER.flatMap((g) => MONO_FILTER_ORDER[g] ?? [])
);

let issues = 0;
function issue(msg) {
  console.error("ISSUE:", msg);
  issues++;
}

const sets = [
  ["solid", SOLID_BADGES_PATH],
  ["transparent", TRANSPARENT_BADGES_PATH],
  ["mono", MONO_BADGES_PATH],
];

const loaded = await Promise.all(
  sets.map(async ([name, p]) => [name, await loadFilters(p), p])
);

for (const [name, filters, p] of loaded) {
  const ids = new Set(filters.map((f) => f.id));
  for (const id of expected) {
    if (!ids.has(id)) issue(`${name} missing ${id}`);
  }
  if (filters.length !== expected.size) {
    issue(`${name} count ${filters.length} at ${p} (expected ${expected.size})`);
  }
  for (const f of filters) {
    if (!f.pattern) issue(`${name} ${f.id} missing pattern`);
    if (!f.imageURL?.startsWith("http")) issue(`${name} ${f.id} missing http imageURL`);
  }
}

for (let i = 1; i < loaded.length; i++) {
  for (const id of expected) {
    const a = loaded[0][1].find((f) => f.id === id);
    const b = loaded[i][1].find((f) => f.id === id);
    if (a?.pattern !== b?.pattern) {
      issue(`pattern mismatch ${id}: solid vs ${loaded[i][0]}`);
    }
  }
}

console.log("\n--- Vidhin tier sync (dry-run, add-only, against v1 oracle) ---");
const vidhin = await syncTierGroupsFromVidhin({
  dryRun: true,
  strict: false,
});
for (const file of vidhin.fileResults ?? []) {
  const r = file.tierResults ?? [];
  const wouldAdd = r.reduce((n, t) => n + (t.added?.length ?? 0), 0);
  const changed = r.filter((t) => t.changed).length;
  console.log(`${file.badgesPath}: ${changed} tiers would change, ${wouldAdd} groups would be added`);
}

if (!issues) {
  console.log("\nOK: All three badge files have matching filters, patterns, HTTP icons.");
} else {
  console.log(`\n${issues} issue(s). Run: npm run publish`);
}
process.exitCode = issues ? 1 : 0;
