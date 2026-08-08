import { STREAMING_BADGES } from "./streaming-badges.mjs";
import {
  FORMATTER_STREAMING_INJECT,
  STREAMING_FORMATTER_SERVICES,
  STREAMING_MARKERS,
} from "./streaming-formatter-patterns.mjs";

function nuvioRegex(pattern) {
  const inline = pattern.startsWith("(?i)");
  return new RegExp(inline ? pattern.slice(4) : pattern, inline ? "i" : "");
}

let failed = 0;

const patterns = Object.fromEntries(
  STREAMING_BADGES.map((b) => [b.id, nuvioRegex(b.pattern)])
);

function simulatedDescription(network) {
  let tail = "";
  for (const { id, networkRe } of STREAMING_FORMATTER_SERVICES) {
    if (nuvioRegex(networkRe).test(network)) {
      tail += STREAMING_MARKERS[id];
    }
  }
  return `Show 2024\n${tail}`;
}

const cases = [
  ["NF in filename", "Show.S01E01.2160p.NF.WEB-DL-GROUP.mkv", "s-nflx"],
  ["AMZN in filename", "Show.S01E01.2160p.AMZN.WEB-DL-GROUP.mkv", "s-amzn"],
  ["Netflix via network field", simulatedDescription("Netflix"), "s-nflx"],
  ["Amazon Prime via network", simulatedDescription("Amazon Prime"), "s-amzn"],
  ["Disney+ via network", simulatedDescription("Disney+"), "s-dsnp"],
  ["Hulu via network", simulatedDescription("Hulu"), "s-hulu"],
  ["Peacock via network", simulatedDescription("Peacock"), "s-pcok"],
  ["Crunchyroll via network", simulatedDescription("Crunchyroll"), "s-croll"],
];

for (const [label, haystack, expectedId] of cases) {
  const matched = STREAMING_BADGES.filter((b) => patterns[b.id].test(haystack)).map(
    (b) => b.id
  );
  if (!matched.includes(expectedId)) {
    console.log("FAIL", label, "expected", expectedId, "got", matched.join(", ") || "(none)");
    failed++;
  }
}

if (!FORMATTER_STREAMING_INJECT.includes("stream.network")) {
  console.log("FAIL inject must reference stream.network");
  failed++;
}

console.log(
  failed ? `${failed} streaming formatter test failures` : "All streaming formatter tests passed"
);
process.exit(failed ? 1 : 0);
