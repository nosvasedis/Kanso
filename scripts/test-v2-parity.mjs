/**
 * Phase 9 — v2 parity gate (runs full phase test suite).
 */
import { spawnSync } from "node:child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const PHASE_TESTS = [
  "test-v2-markers.mjs",
  "test-v2-marker-boundaries.mjs",
  "test-v2-visual.mjs",
  "test-v2-audio.mjs",
  "test-v2-channels.mjs",
  "test-v2-tiers.mjs",
  "test-v2-quality.mjs",
  "test-v2-resolution.mjs",
  "test-v2-languages.mjs",
  "test-v2-special.mjs",
  "test-formatter-v2-budget.mjs",
  "test-formatter-aiostreams-syntax.mjs",
  "test-v2-patch-safety.mjs",
  "test-v2-end-to-end.mjs",
];

for (const script of PHASE_TESTS) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    process.exit(r.status ?? 1);
  }
}

console.log(`test-v2-parity: OK (${PHASE_TESTS.length} phase suites)`);
