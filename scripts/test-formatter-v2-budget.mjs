/**
 * Phase 8 — formatter v2 per-field budget guard.
 */
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import {
  FORMATTER_MAX_LENGTH,
  FORMATTER_V2_LAYOUT,
  FORMATTER_V2_NAME,
  FORMATTER_VISIBLE_DESCRIPTION,
  buildFormatterV2Layout,
} from "./formatter-budget.mjs";
import { FORMATTER_V2_INJECT_DESCRIPTION_TAIL } from "./formatter-v2-inject.mjs";
import { MESSAGE_BLOCK } from "./formatter-layout.mjs";
import { FORMATTER_V2_INJECT_SOURCE } from "./source-formatter-inject.mjs";

const description =
  FORMATTER_VISIBLE_DESCRIPTION + FORMATTER_V2_INJECT_DESCRIPTION_TAIL + MESSAGE_BLOCK;

assert.ok(
  FORMATTER_V2_NAME.length <= FORMATTER_MAX_LENGTH,
  `name ${FORMATTER_V2_NAME.length} > ${FORMATTER_MAX_LENGTH}`
);
assert.ok(
  description.length <= FORMATTER_MAX_LENGTH,
  `description ${description.length} > ${FORMATTER_MAX_LENGTH}`
);
assert.ok(FORMATTER_V2_LAYOUT.withinBudget, "layout should report withinBudget");

assert.ok(
  FORMATTER_V2_LAYOUT.shardedSegmentIds.length === 0,
  `expected no sharded segments at ${FORMATTER_MAX_LENGTH} (got ${FORMATTER_V2_LAYOUT.shardedSegmentIds.join(", ")})`
);
assert.equal(FORMATTER_V2_LAYOUT.shardedBadgeIds.size, 0, "expected 0 hybrid badges at full budget");

assert.ok(
  FORMATTER_V2_NAME.includes(FORMATTER_V2_INJECT_SOURCE),
  "source markers belong in name field"
);
assert.ok(
  !FORMATTER_V2_INJECT_DESCRIPTION_TAIL.includes(FORMATTER_V2_INJECT_SOURCE),
  "source markers must not duplicate in description"
);

const formatterJson = JSON.parse(readFileSync("formatter.json", "utf8"));
assert.equal(formatterJson.name, FORMATTER_V2_NAME);
assert.equal(formatterJson.description, description);

const dry = buildFormatterV2Layout();
assert.equal(dry.name, FORMATTER_V2_NAME);

console.log(
  `test-formatter-v2-budget: OK (name ${FORMATTER_V2_NAME.length}, description ${description.length}, sharded ${FORMATTER_V2_LAYOUT.shardedSegmentIds.length} segments, ${FORMATTER_V2_LAYOUT.shardedBadgeIds.size} hybrid badges)`
);
if (FORMATTER_V2_LAYOUT.shardedSegmentIds.length) {
  console.log(`  sharded: ${FORMATTER_V2_LAYOUT.shardedSegmentIds.join(", ")}`);
}
