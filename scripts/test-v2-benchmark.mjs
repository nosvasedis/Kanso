/**
 * Phase 9 benchmark gate — shipped v2 badges avg <15ms per stream (modeled).
 */
import assert from "node:assert/strict";
import fs from "fs/promises";
import {
  nuvioHaystacks,
  nuvioRegex,
  STREAM_FIXTURES,
} from "./benchmark-badge-patterns.mjs";
import { SOLID_BADGES_PATH } from "./badge-patch.mjs";

const TARGET_MS = 15;
const ITERATIONS = 200;

const raw = await fs.readFile(SOLID_BADGES_PATH, "utf8");
const filters = JSON.parse(raw).filters.filter((f) => f.type === "filter" && f.pattern);
const compiled = [];
for (const f of filters) {
  try {
    compiled.push({ id: f.id, re: nuvioRegex(f.pattern) });
  } catch {
    /* skip */
  }
}

function timeFilter(re, haystacks, iterations) {
  for (const h of haystacks) re.test(h);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const h of haystacks) re.test(h);
  }
  return performance.now() - start;
}

let streamTotals = 0;
for (const fixture of STREAM_FIXTURES) {
  const haystacks = nuvioHaystacks([fixture.name, fixture.desc, fixture.filename]);
  let streamMs = 0;
  for (const f of compiled) {
    streamMs += timeFilter(f.re, haystacks, ITERATIONS);
  }
  streamTotals += streamMs;
}

const v2AvgMs = streamTotals / STREAM_FIXTURES.length / ITERATIONS;

assert.ok(
  v2AvgMs < TARGET_MS,
  `v2 avg per-stream ${v2AvgMs.toFixed(2)}ms >= ${TARGET_MS}ms target`
);

console.log(
  `test-v2-benchmark: OK (v2 avg ${v2AvgMs.toFixed(2)} ms/stream, target <${TARGET_MS} ms, ${compiled.length} filters)`
);
