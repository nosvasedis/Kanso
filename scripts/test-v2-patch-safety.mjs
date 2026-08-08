import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { patchBadgeFile, MONO_BADGES_PATH } from "./badge-patch.mjs";

const original = JSON.parse(await fs.readFile(MONO_BADGES_PATH, "utf8"));
const expected = new Map(original.filters.map((f) => [f.id, f.pattern]));
const tempPath = path.join(path.dirname(MONO_BADGES_PATH), ".test-v2-patch-safety.json");

try {
  await patchBadgeFile({
    badgesPath: tempPath,
    templatePath: MONO_BADGES_PATH,
    applyTheme: (filter) => filter,
  });
  const roundTripped = JSON.parse(await fs.readFile(tempPath, "utf8"));
  assert.equal(roundTripped.filters.length, 124);
  for (const filter of roundTripped.filters) {
    assert.ok(filter.pattern.startsWith("(?s)^"), `${filter.id}: legacy pattern leaked into v2 pack`);
    assert.equal(filter.pattern, expected.get(filter.id), `${filter.id}: marker pattern changed during theme patch`);
  }
} finally {
  await fs.rm(tempPath, { force: true });
}

console.log("test-v2-patch-safety: OK (124 marker-only patterns preserved)");
