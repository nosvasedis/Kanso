import fs from "fs";
import os from "os";
import path from "path";
import {
  extractBadgeTierGroups,
  extractVidhinGroups,
  mergeGroupLists,
  replaceBadgeTierGroups,
  vidhinNameToBadgeId,
  syncTierGroupsFromVidhin,
  TIER_SYNC_TARGET,
} from "./tier-group-sync.mjs";

let ok = true;
function assert(label, cond) {
  if (!cond) {
    console.error("FAIL:", label);
    ok = false;
  } else {
    console.log("ok:", label);
  }
}

assert("web-1 mapping", vidhinNameToBadgeId("Radarr Web T1") === "web-1");
assert("sonarr bluray", vidhinNameToBadgeId("Sonarr HD Bluray T3") === "blu-ray-3");
assert("generic web", vidhinNameToBadgeId("Web T1") === "web-1");

const vidhinPat =
  '/^(?=.*\\b(?:ABBIE|AJP69|NEWGROUP)\\b).*/i';
const vGroups = extractVidhinGroups(vidhinPat);
assert("vidhin groups", vGroups.includes("ABBIE") && vGroups.includes("NEWGROUP"));

const samplePattern =
  "(?i)^anchor(?:^\\[(?:FOO|BAR)\\](?=\\s|$)|^\\((?:FOO|BAR)\\)(?=\\s|$)).*$";
const local = extractBadgeTierGroups(samplePattern);
assert("badge extract", local?.join("|") === "FOO|BAR");

const addOnly = mergeGroupLists(["FOO", "BAR"], ["BAR", "NEWGROUP"]);
assert(
  "add-only keeps FOO",
  addOnly.added.includes("NEWGROUP") &&
    addOnly.merged.includes("FOO") &&
    addOnly.removed.length === 0
);

const strict = mergeGroupLists(["FOO", "BAR"], ["BAR", "NEWGROUP"], { strict: true });
assert(
  "strict drops FOO",
  strict.added.includes("NEWGROUP") &&
    strict.removed.includes("FOO") &&
    !strict.merged.includes("FOO")
);

const pinned = mergeGroupLists(["FOO", "BAR"], ["BAR"], {
  strict: true,
  neverRemove: ["FOO"],
});
assert("neverRemove keeps FOO in strict", pinned.merged.includes("FOO") && !pinned.removed.includes("FOO"));

const replaced = replaceBadgeTierGroups(
  samplePattern,
  local,
  addOnly.merged
);
assert(
  "replace all",
  !replaced.includes("FOO|BAR") && replaced.includes("BAR|FOO|NEWGROUP")
);

// --- v2 pipeline: sync targets the v1 oracle, writes work, no shape errors ---

assert(
  "default sync target is the v1 oracle",
  TIER_SYNC_TARGET.endsWith(path.join("backup", "v1", "oracle", "nosvasedis-badges-solid.json"))
);

const tmpOracle = path.join(os.tmpdir(), `oracle-test-${Date.now()}.json`);
fs.copyFileSync(TIER_SYNC_TARGET, tmpOracle);
try {
  const vidhinRules = [
    {
      name: "Radarr Web T1",
      pattern: "/^(?=.*(?:WEB[-_. ]DL|WEBDL))(?=.*\\b(?:ABBIE|GROUPX|FLUX)\\b).*/i",
      score: 0,
    },
    {
      name: "Radarr Remux T1",
      pattern: "/^(?=.*Remux\\b)(?=.*\\b(?:3L|GROUPY|ZQ)\\b).*/i",
      score: 0,
    },
  ];

  const res = await syncTierGroupsFromVidhin({
    dryRun: false,
    strict: false,
    badgesPaths: [tmpOracle],
    vidhinRules,
    regenerate: false,
  });

  assert("write path reports change", res.anyChanged === true && res.totalAdded === 2);
  assert(
    "regenerate skipped when disabled",
    res.formatterRegenerated === false && res.formatterOutput === ""
  );

  const written = JSON.parse(fs.readFileSync(tmpOracle, "utf8"));
  const w1 = written.filters.find((f) => f.id === "web-1");
  const r1 = written.filters.find((f) => f.id === "remux-1");
  const wu = written.filters.find((f) => f.id === "web-unranked");
  const w1g = extractBadgeTierGroups(w1.pattern);
  const r1g = extractBadgeTierGroups(r1.pattern);
  assert("web-1 gains GROUPX", w1g.includes("GROUPX"));
  assert("remux-1 gains GROUPY", r1g.includes("GROUPY"));
  assert(
    "merged lists stay sorted",
    w1g.join("|") ===
      [...w1g].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })).join("|")
  );
  assert("unranked rebuilt from ranked", wu.pattern.includes("GROUPX"));

  // Strict mode with a tier that has no Vidhin groups must skip, not wipe.
  const strictRes = await syncTierGroupsFromVidhin({
    dryRun: true,
    strict: true,
    badgesPaths: [tmpOracle],
    vidhinRules,
    regenerate: false,
  });
  const skipped = strictRes.tierResults.filter((t) => t.skipped).map((t) => t.badgeId);
  assert(
    "strict skips tiers without Vidhin data",
    skipped.includes("web-4") && skipped.includes("blu-ray-4") && skipped.includes("web-6")
  );
  assert("no shape errors in strict run", strictRes.tierResults.every((t) => !t.error));
} finally {
  fs.rmSync(tmpOracle, { force: true });
}

if (!ok) process.exit(1);
console.log("\nAll tier-group-sync tests passed.");
