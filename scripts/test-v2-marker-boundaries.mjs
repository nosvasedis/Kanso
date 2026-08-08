import assert from "node:assert/strict";
import { BADGE_MARKERS, RESERVED_MARKERS, resolveMarkerRef, MARKER_SEPARATOR } from "./formatter-markers.mjs";

const allocated = [...new Set(
  Object.values(BADGE_MARKERS)
    .flatMap((entry) => resolveMarkerRef(entry))
    .filter((marker) => marker.endsWith(MARKER_SEPARATOR))
)];

for (const marker of allocated) {
  assert.ok(marker.endsWith(MARKER_SEPARATOR));
  assert.equal(marker.slice(0, -1).includes(MARKER_SEPARATOR), false);
}

for (const a of allocated) {
  for (const b of allocated) {
    const joined = a + b;
    for (const c of allocated) {
      const positions = [];
      let from = 0;
      while ((from = joined.indexOf(c, from)) !== -1) {
        positions.push(from++);
      }
      assert.ok(
        positions.every((at) => (at === 0 && c === a) || (at === a.length && c === b)),
        `boundary synthesized marker ${JSON.stringify(c)} from ${JSON.stringify(a)} + ${JSON.stringify(b)}`
      );
    }
  }
}

for (const reserved of RESERVED_MARKERS) {
  assert.ok(!reserved.includes(MARKER_SEPARATOR), "separator collides with reserved namespace");
}

console.log(`test-v2-marker-boundaries: OK (${allocated.length} allocated markers²)`);
