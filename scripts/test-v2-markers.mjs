/**
 * Phase 0 — marker registry validation + pattern smoke tests.
 */
import assert from "node:assert/strict";
import {
  ALL_V2_BADGE_IDS,
  BADGE_MARKERS,
  MARKER_REGISTRY_VALIDATION,
  V2_INJECT_IMPLEMENTED_IDS,
  markerOnlyPattern,
  markersForBadge,
  validateMarkerRegistry,
  v2PatternForBadge,
} from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { nuvioRegex } from "./benchmark-badge-patterns.mjs";
import { getV2Pattern } from "./badge-v2-patterns.mjs";

const expectedIds = Object.values(MONO_FILTER_ORDER).flat();

assert.equal(
  ALL_V2_BADGE_IDS.length,
  expectedIds.length,
  `registry should cover ${expectedIds.length} badges`
);
for (const id of expectedIds) {
  assert.ok(BADGE_MARKERS[id], `missing registry entry: ${id}`);
  assert.ok(v2PatternForBadge(id), `missing v2 pattern: ${id}`);
  assert.equal(getV2Pattern(id), v2PatternForBadge(id));
}

const validation = validateMarkerRegistry();
assert.ok(validation.ok, validation.errors.join("\n"));
assert.ok(MARKER_REGISTRY_VALIDATION.ok, "module-load validation failed");

for (const id of V2_INJECT_IMPLEMENTED_IDS) {
  const markers = markersForBadge(id);
  assert.ok(markers?.length, `implemented badge missing markers: ${id}`);
  const pattern = v2PatternForBadge(id);
  assert.doesNotThrow(() => nuvioRegex(pattern), `pattern compile failed: ${id}`);
}

const comboIds = ["v-dv-hdr10p", "a-at-th", "a-at-dp"];
for (const id of comboIds) {
  const markers = markersForBadge(id);
  assert.ok(markers && markers.length > 1, `${id} should resolve multiple markers`);
  const pattern = markerOnlyPattern(BADGE_MARKERS[id]);
  assert.match(pattern, /^\(\?s\)\^/);
  assert.doesNotThrow(() => nuvioRegex(pattern));
}

const tierSample = ["web-1", "blu-ray-3", "remux-unranked"];
for (const id of tierSample) {
  assert.doesNotThrow(() => nuvioRegex(v2PatternForBadge(id)), `tier pattern: ${id}`);
}

const langSample = ["l-en", "l-ja", "l-pt-br"];
for (const id of langSample) {
  assert.doesNotThrow(() => nuvioRegex(v2PatternForBadge(id)), `lang pattern: ${id}`);
}

console.log(`test-v2-markers: OK (${ALL_V2_BADGE_IDS.length} badges, ${V2_INJECT_IMPLEMENTED_IDS.size} implemented inject)`);
