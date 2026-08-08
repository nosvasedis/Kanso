/**
 * Star-matrix diagnostic — how {stream.nSeScore::pstar::replace('⯪','☆')} renders
 * for every score/normalization case, plus realistic Vinland Saga-like fixtures
 * showing which Nuvio badges fire alongside empty stars.
 *
 * Read-only investigation script (no badge/formatter files are modified).
 * Run: npx tsx scripts/investigate-star-matrix.ts
 */
import assert from "node:assert/strict";
import { CustomFormatter } from "../.vendor/AIOStreams/packages/core/src/formatters/custom.ts";
import { nuvioHaystacks, nuvioRegex } from "./benchmark-badge-patterns.mjs";

const nameExport = await import("node:fs").then((fs) =>
  fs.default.readFileSync("formatter-export-name.txt", "utf8").trimEnd()
);
const descExport = await import("node:fs").then((fs) =>
  fs.default.readFileSync("formatter-export-description.txt", "utf8").trimEnd()
);
const badgeData = JSON.parse(
  (await import("node:fs")).default.readFileSync("kanso-mono.json", "utf8")
);
const filters = badgeData.filters.map((f: any) => ({ ...f, re: nuvioRegex(f.pattern) }));

async function render(stream: any, maxSeScore?: number) {
  const formatter = new CustomFormatter(nameExport, descExport, {
    userData: {},
    maxSeScore,
    queryType: "series",
    title: "Vinland Saga",
  } as any);
  return await formatter.format(stream);
}

function badgeIds(name: string, desc: string, filename: string | null): string[] {
  const haystacks = nuvioHaystacks([name, desc, filename].filter(Boolean) as string[]);
  return filters
    .filter((f: any) => haystacks.some((h) => f.re.test(h)))
    .map((f: any) => f.id);
}

function starsOf(name: string): string {
  const m = name.match(/[★☆]{5}/);
  return m ? m[0] : "(no stars)";
}

const baseStream = (over: any) => ({
  filename: "Vinland.Saga.S01E01.1080p.NF.WEB-DL.DDP5.1-GROUP.mkv",
  type: "debrid",
  streamExpressionScore: undefined as number | undefined,
  rankedStreamExpressionsMatched: [] as string[],
  proxied: false,
  library: false,
  preloading: false,
  parsedFile: {
    quality: "WEB",
    resolution: "1080p",
    releaseGroup: "GROUP",
    visualTags: [],
    audioTags: ["DD+"],
    audioChannels: ["5.1"],
    languages: ["English"],
    network: "Netflix",
  },
  addon: { name: "Comet" },
  service: { id: "realdebrid", cached: true },
  ...over,
});

const rows: string[] = [];
function row(label: string, out: { name: string; description: string }, maxSeScore?: number, filename: string | null = null) {
  const stars = starsOf(out.name);
  const ids = badgeIds(out.name, out.description, filename);
  rows.push(`${label.padEnd(34)} | max=${String(maxSeScore ?? "—").padEnd(5)} | ${stars.padEnd(10)} | ${ids.join(", ")}`);
  return stars;
}

console.log("== A. Star glyphs vs streamExpressionScore (maxSeScore fixed = 100) ==");
const expected: Array<[number | undefined, string]> = [
  [undefined, "(no stars)"],
  [0, "☆☆☆☆☆"],
  [5, "☆☆☆☆☆"],
  [10, "☆☆☆☆☆"],
  [19, "☆☆☆☆☆"],
  [20, "★☆☆☆☆"],
  [39, "★☆☆☆☆"],
  [40, "★★☆☆☆"],
  [59, "★★☆☆☆"],
  [60, "★★★☆☆"],
  [79, "★★★☆☆"],
  [80, "★★★★☆"],
  [99, "★★★★☆"],
  [100, "★★★★★"],
];
for (const [score, expect] of expected) {
  const out = await render(baseStream({ streamExpressionScore: score }), 100);
  const stars = row(`score=${String(score)}`, out, 100);
  assert.equal(stars, expect, `score=${score}`);
}

console.log("\n== B. Relative normalization (maxSeScore varies) ==");
const rel: Array<[number, number, string]> = [
  [1000, 50, "☆☆☆☆☆"], // 50/1000 = 5% → nSeScore 5
  [1000, 250, "★☆☆☆☆"], // 25%
  [1000, 950, "★★★★☆"], // 95%
  [200, 0, "☆☆☆☆☆"], // score 0 even with non-zero max
];
for (const [max, score, expect] of rel) {
  const out = await render(baseStream({ streamExpressionScore: score }), max);
  const stars = row(`max=${max}, score=${score}`, out, max);
  assert.equal(stars, expect, `max=${max} score=${score}`);
}
// maxSeScore undefined → engine treats as no scoring → no stars
const noMax = await render(baseStream({ streamExpressionScore: 100 }), undefined);
assert.equal(starsOf(noMax.name), "(no stars)");
rows.push(`max=undefined, score=100`.padEnd(34) + ` | max=—     | ${"(no stars)".padEnd(10)} | (nSeScore null → block omitted)`);

console.log("\n== C. Realistic Vinland Saga S01E01 fixtures ==");
// C1: Netflix WEB-DL, no RSE matched, score 0 (the user's most common case)
const c1 = await render(baseStream({ streamExpressionScore: 0 }), 100);
const c1Stars = row("NF WEB-DL, no RSE, score 0", c1, 100, baseStream({}).filename);
assert.equal(c1Stars, "☆☆☆☆☆");

// C2: same but score 100 (top of set)
const c2 = await render(baseStream({ streamExpressionScore: 100 }), 100);
const c2Stars = row("NF WEB-DL, no RSE, score 100", c2, 100, baseStream({}).filename);
assert.equal(c2Stars, "★★★★★");

// C3: anime rule matched (not covered by this badge set) but score 0
const c3 = await render(
  baseStream({
    streamExpressionScore: 0,
    rankedStreamExpressionsMatched: ["Anime Web T1"],
  }),
  100
);
const c3Stars = row("Anime Web T1 matched, score 0", c3, 100, baseStream({}).filename);
assert.equal(c3Stars, "☆☆☆☆☆");

// C4: REMUX with score 0 → does the OK-rank badge fire on a top-quality source?
const remuxStream = {
  filename: "Vinland.Saga.S01E01.2160p.UHD.BluRay.REMUX-FLUX.mkv",
  type: "debrid",
  streamExpressionScore: 0,
  rankedStreamExpressionsMatched: [],
  proxied: false,
  library: false,
  preloading: false,
  parsedFile: {
    quality: "REMUX",
    resolution: "2160p",
    releaseGroup: "FLUX",
    visualTags: [],
    audioTags: ["Atmos", "TrueHD"],
    audioChannels: ["7.1"],
    languages: ["English"],
    network: null,
  },
  addon: { name: "Comet" },
  service: { id: "realdebrid", cached: true },
};
const c4 = await render(remuxStream, 100);
const c4Stars = row("REMUX 2160p FLUX, score 0", c4, 100, remuxStream.filename);
assert.equal(c4Stars, "☆☆☆☆☆");
assert.ok(badgeIds(c4.name, c4.description, remuxStream.filename).includes("q-or"), "score-0 REMUX must badge q-or (OK)");

// C5: top-scored REMUX for contrast
const c5 = await render({ ...remuxStream, streamExpressionScore: 100 }, 100);
const c5Stars = row("REMUX 2160p FLUX, score 100", c5, 100, remuxStream.filename);
assert.equal(c5Stars, "★★★★★");

console.log("\n== D. Full rendered name for C1 (NF WEB-DL, no RSE, score 0) ==");
console.log(JSON.stringify(c1.name));

console.log("\ninvestigate-star-matrix: OK");
console.log("\n" + rows.join("\n"));
