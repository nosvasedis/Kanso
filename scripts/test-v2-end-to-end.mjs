import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { nuvioHaystacks, nuvioRegex } from "./benchmark-badge-patterns.mjs";
import { MONO_BADGES_PATH } from "./badge-patch.mjs";
import { simulateTierInjectMarkers, loadTierGroupsFromBadgesSync } from "./tier-inject-generator.mjs";
import { buildSourceMarkersSync } from "./source-formatter-inject.mjs";
import { buildResolutionMarkersSync } from "./resolution-formatter-inject.mjs";
import { buildVisualMarkers } from "./visual-formatter-inject.mjs";
import { buildLanguageMarkersSync } from "./language-formatter-inject.mjs";
import { buildSpecialMarkersSync } from "./special-formatter-inject.mjs";
import { markersForBadge } from "./formatter-markers.mjs";

const data = JSON.parse(await fs.readFile(MONO_BADGES_PATH, "utf8"));
const filters = data.filters.map((f) => ({ ...f, re: nuvioRegex(f.pattern) }));
assert.equal(filters.length, 124);
assert.ok(filters.every((f) => f.pattern.startsWith("(?s)^")), "production pack must be fully marker-only");
const tierGroups = loadTierGroupsFromBadgesSync();

function channelMarker(channels = []) {
  const text = Array.isArray(channels) ? channels.join(" ") : String(channels);
  const id = /7\.1/.test(text) ? "ch-71" : /6\.1/.test(text) ? "ch-61" : /5\.1/.test(text) ? "ch-51" : /2\.0/.test(text) ? "ch-20" : null;
  return id ? (markersForBadge(id) ?? []).join("") : "";
}

function parsedAudioMarkers(audioTags = []) {
  const text = Array.isArray(audioTags) ? audioTags.join(" ") : String(audioTags);
  const ids = [];
  if (/Atmos/i.test(text)) ids.push("a-at");
  if (/TrueHD/i.test(text)) ids.push("a-th");
  if (/DD\+|DDP|E-AC-3/i.test(text)) ids.push("a-dp");
  if (/FLAC/i.test(text)) ids.push("a-flac");
  if (/Opus/i.test(text)) ids.push("a-opus");
  if (/AAC/i.test(text)) ids.push("a-aac");
  return ids.flatMap((id) => markersForBadge(id) ?? []).join("");
}

function formatFixture(fields) {
  const normalized = {
    ...fields,
    visualTags: Array.isArray(fields.visualTags) ? fields.visualTags.join(" ") : fields.visualTags,
    audioTags: Array.isArray(fields.audioTags) ? fields.audioTags.join(" ") : fields.audioTags,
  };
  const stars = fields.stars ?? "★★★★☆";
  const name = `🔗 ${stars}` +
    simulateTierInjectMarkers(normalized, tierGroups) +
    buildSourceMarkersSync(normalized);
  const description = "📦 MKV\n💾 20 GB\n✅ · ☁️ RD" +
    buildVisualMarkers(normalized) +
    parsedAudioMarkers(fields.audioTags) +
    channelMarker(fields.audioChannels) +
    buildResolutionMarkersSync(normalized) +
    buildLanguageMarkersSync(normalized) +
    buildSpecialMarkersSync(normalized);
  return { name, description };
}

function matchedBadges(fields) {
  const output = formatFixture(fields);
  const haystacks = nuvioHaystacks([output.name, output.description, fields.filename].filter(Boolean));
  return filters.filter((f) => haystacks.some((h) => f.re.test(h)));
}

const fixtures = [
  {
    label: "Prime WEB-DL 4K pack",
    filename: "Show.S01.2160p.AMZN.WEB-DL.DDP5.1.Atmos.DV.HDR10Plus-FLUX.mkv",
    quality: "WEB",
    resolution: "2160p",
    releaseGroup: "FLUX",
    rseMatched: [],
    visualTags: ["DV", "HDR10+"],
    audioTags: ["Atmos", "DD+"],
    audioChannels: ["5.1"],
    languages: ["English"],
    stars: "★★★★☆",
  },
  {
    label: "sparse debrid WEB",
    filename: null,
    quality: "WEB",
    resolution: "1080p",
    releaseGroup: "ObscureGrp",
    rseMatched: [],
    stars: "★★★☆☆",
  },
];

for (const fixture of fixtures) {
  const hits = matchedBadges(fixture);
  const ids = hits.map((f) => f.id);
  assert.ok(hits.length <= 15, `${fixture.label}: badge soup (${hits.length}): ${ids.join(", ")}`);
  for (const groupId of ["gms", "gq", "grl", "gr"]) {
    const groupHits = hits.filter((f) => f.groupId === groupId);
    assert.ok(groupHits.length <= 1, `${fixture.label}: mutually exclusive ${groupId}: ${groupHits.map((f) => f.id).join(", ")}`);
  }
  console.log(`${fixture.label}: ${hits.length} badges (${ids.join(", ")})`);
}

console.log("test-v2-end-to-end: OK");
