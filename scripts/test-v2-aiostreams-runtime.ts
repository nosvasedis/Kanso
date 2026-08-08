import assert from "node:assert/strict";
import fs from "node:fs";
import { CustomFormatter } from "../.vendor/AIOStreams/packages/core/src/formatters/custom.ts";
import { nuvioHaystacks, nuvioRegex } from "./benchmark-badge-patterns.mjs";

const formatterJson = JSON.parse(fs.readFileSync("formatter.json", "utf8"));
const nameExport = fs.readFileSync("formatter-export-name.txt", "utf8").trimEnd();
const descExport = fs.readFileSync("formatter-export-description.txt", "utf8").trimEnd();
assert.equal(nameExport, formatterJson.name);
assert.equal(descExport, formatterJson.description);

const badgeData = JSON.parse(fs.readFileSync("kanso-mono.json", "utf8"));
const filters = badgeData.filters.map((f: any) => ({ ...f, re: nuvioRegex(f.pattern) }));
const formatter = new CustomFormatter(nameExport, descExport, {
  userData: {},
  maxSeScore: 100,
  queryType: "movie",
  title: "Audit Fixture",
} as any);

const animeFormatter = new CustomFormatter(nameExport, descExport, {
  userData: {},
  maxSeScore: 100,
  queryType: "anime.series",
  title: "Anime Fixture",
  isAnime: true,
} as any);

type Fixture = {
  label: string;
  filename: string | null;
  quality?: string | null;
  resolution?: string | null;
  releaseGroup?: string | null;
  rse?: string[];
  score?: number;
  visualTags?: string[];
  audioTags?: string[];
  audioChannels?: string[];
  languages?: string[];
  network?: string | null;
  type?: string;
  seadex?: boolean;
  library?: boolean;
  preloading?: boolean;
  descriptionMustInclude?: string[];
  descriptionMustNotInclude?: string[];
  visibleForbidden?: string[];
  noStars?: boolean;
  isAnime?: boolean;
  country?: string | null;
  subtitles?: string[] | null;
  expect?: string[];
  forbid?: string[];
};

const fixtures: Fixture[] = [
  { label: "Prime 4K WEB FLUX", filename: "Show.S01.2160p.AMZN.WEB-DL.DDP5.1.Atmos.DV.HDR10Plus-FLUX.mkv", quality: "WEB", resolution: "2160p", releaseGroup: "FLUX", visualTags: ["DV", "HDR10+"], audioTags: ["Atmos", "DD+"], audioChannels: ["5.1"], languages: ["English"], network: "Amazon", score: 80, expect: ["web-1", "q-gw", "r-4k", "v-dv-hdr10p", "a-at-dp", "ch-51"], forbid: ["web-2", "r-576", "q-ow", "a-dv", "a-at", "a-dp"] },
  { label: "sparse Comet debrid", filename: null, quality: "WEB", resolution: "1080p", releaseGroup: "ObscureGrp", score: 60, expect: ["web-unranked", "r-1080"], forbid: ["web-1", "r-4k"] },
  { label: "WEB RSE multiword", filename: "Movie.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", rse: ["Web T3"], score: 60, expect: ["web-3"], forbid: ["web-unranked", "web-2"] },
  { label: "Bluray RSE multiword", filename: "Movie.1080p.BluRay-GROUP.mkv", quality: "BluRay", resolution: "1080p", releaseGroup: "GROUP", rse: ["HD Bluray T3"], score: 80, expect: ["blu-ray-3", "q-gb"], forbid: ["blu-ray-unranked", "q-ob"] },
  { label: "UHD Bluray RSE", filename: "Movie.2160p.UHD.BluRay-GROUP.mkv", quality: "BluRay", resolution: "2160p", releaseGroup: "GROUP", rse: ["UHD BluRay T2"], score: 100, expect: ["blu-ray-2", "q-bb", "r-4k"] },
  { label: "Remux ranked EPSiLON", filename: "Movie.2160p.UHD.BluRay.REMUX-EPSiLON.mkv", quality: "REMUX", resolution: "2160p", releaseGroup: "EPSiLON", score: 100, expect: ["remux-2", "q-br", "r-4k"], forbid: ["q-bb", "q-r"] },
  { label: "Remux RSE", filename: "Movie.1080p.Remux-GROUP.mkv", quality: "REMUX", resolution: "1080p", releaseGroup: "GROUP", rse: ["Remux T1"], score: 80, expect: ["remux-1", "q-gr"] },
  { label: "custom RSE names", filename: "Movie.2160p.WEB-DL-ObscureGrp.mkv", quality: "WEB", resolution: "2160p", releaseGroup: "ObscureGrp", rse: ["4K", "Netflix", "Streaming Boost"], score: 80, forbid: ["web-1", "web-2", "web-3", "web-4", "web-unranked"] },
  { label: "CAM low", filename: "Movie.2026.1080p.HDCAM.x264.mkv", quality: "CAM", resolution: "1080p", score: 20, expect: ["q-cam"], forbid: ["q-bw", "q-gw", "q-ow"] },
  { label: "HDTV low", filename: "Show.S01E01.720p.HDTV.x264.mkv", quality: "HDTV", resolution: "720p", score: 20, expect: ["q-hdtv", "r-720"], forbid: ["q-bw", "q-gw", "q-ow"] },
  { label: "SeaDex Netflix", filename: "Anime.S01E01.1080p.NF.WEB-DL.mkv", quality: "WEB", resolution: "1080p", network: "Netflix", seadex: true, score: 80, expect: ["seadex-release", "s-nflx"] },
  { label: "multilanguage", filename: "Movie.1080p.WEB-DL.MULTi.English.French.German.mkv", quality: "WEB", resolution: "1080p", languages: ["English", "French", "German"], score: 60, expect: ["l-en", "l-fr", "l-de"] },
  { label: "hybrid repack proper", filename: "Movie.2160p.HYBRID.REPACK.PROPER.WEB-DL.mkv", quality: "WEB", resolution: "2160p", score: 80, expect: ["hybrid-release", "repack-release", "proper-release"] },
  { label: "best WebDL band", filename: "Movie.1080p.WEB-DL-NTb.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "NTb", score: 100, expect: ["q-bw"], forbid: ["q-gw", "q-ow"] },
  { label: "scoreless debrid no stars", filename: "Movie.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", score: 0, noStars: true, expect: ["q-w", "web-unranked"], forbid: ["q-ow", "q-gw", "q-bw"] },
  { label: "half-star score hidden", filename: "Movie.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", score: 10, noStars: true, expect: ["q-w"], forbid: ["q-ow"] },
  { label: "ok Bluray band", filename: "Movie.1080p.BluRay-CtrlHD.mkv", quality: "BluRay", resolution: "1080p", releaseGroup: "CtrlHD", score: 20, expect: ["q-ob"], forbid: ["q-bb", "q-gb"] },
  { label: "library metadata never bleeds", filename: "Movie.2160p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "2160p", releaseGroup: "GROUP", visualTags: ["IMAX"], audioTags: ["DD"], audioChannels: ["5.1"], library: true, score: 80, visibleForbidden: ["IMAX", "DD", "5.1"] },
  { label: "Vision and Atmos remain separate domains", filename: "Movie.2160p.WEB-DL.DV.Atmos.DDP5.1-GROUP.mkv", quality: "WEB", resolution: "2160p", releaseGroup: "GROUP", visualTags: ["DV"], audioTags: ["Atmos", "DD+"], audioChannels: ["5.1"], score: 80, expect: ["a-dv", "a-at-dp"], forbid: ["a-at", "a-dp"] },
  { label: "dense AV hierarchy", filename: "Movie.2160p.WEB-DL.DV.HDR10.Atmos.TrueHD.DDP.DTS-X.DTS-HD.MA-GROUP.mkv", quality: "WEB", resolution: "2160p", releaseGroup: "GROUP", visualTags: ["DV", "HDR10"], audioTags: ["Atmos", "TrueHD", "DD+", "DTS:X", "DTS-HD MA"], audioChannels: ["7.1"], score: 100, expect: ["v-dv-hdr10", "a-at-th", "a-dtsx-ma", "ch-71"], forbid: ["v-hdr10", "a-dv", "a-at-dp", "a-at", "a-th", "a-dp", "a-dtsx", "a-dtsma", "a-dtsx-hd", "a-dtshd"] },
  { label: "preload icon when not library", filename: "Movie.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", preloading: true, library: false, score: 60, descriptionMustInclude: ["⬇️"], descriptionMustNotInclude: ["📚"] },
  { label: "library wins over preload", filename: "Movie.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", preloading: true, library: true, score: 60, descriptionMustInclude: ["📚"], descriptionMustNotInclude: ["⬇️"] },
  { label: "media-info French ignores English filename", filename: "Movie.2024.English.Eng.1080p.WEB-DL.mkv", quality: "WEB", resolution: "1080p", languages: ["French"], score: 60, expect: ["l-fr"], forbid: ["l-en"] },
  { label: "filename English when languages empty", filename: "Movie.2024.Eng.1080p.WEB-DL.mkv", quality: "WEB", resolution: "1080p", languages: [], score: 60, expect: ["l-en"] },
  { label: "country UK on release row", filename: "The.Office.UK.S01E01.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", country: "UK", score: 60, descriptionMustInclude: ["UK"], expect: ["web-unranked"] },
  { label: "anime request skips ranked RG allowlist", filename: "Anime.2024.1080p.BluRay-Moxie.mkv", quality: "BluRay", resolution: "1080p", releaseGroup: "Moxie", isAnime: true, score: 60, expect: ["blu-ray-unranked"], forbid: ["blu-ray-1", "blu-ray-2"] },
  { label: "Greek softsubs from media-info", filename: "Movie.2024.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", subtitles: ["Greek"], score: 60, descriptionMustInclude: ["ELˢ"], expect: ["web-unranked"] },
  { label: "Greek audio alone does not show softsub cue", filename: "Movie.2024.Greek.1080p.WEB-DL-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", languages: ["Greek"], score: 60, descriptionMustNotInclude: ["ELˢ"], expect: ["l-el"] },
  { label: "Greek softsubs from filename token", filename: "Movie.2024.1080p.WEB-DL.Ell.Sub-GROUP.mkv", quality: "WEB", resolution: "1080p", releaseGroup: "GROUP", subtitles: [], score: 60, descriptionMustInclude: ["ELˢ"] },
];

for (const fx of fixtures) {
  const stream: any = {
    filename: fx.filename,
    type: fx.type ?? "debrid",
    streamExpressionScore: fx.score ?? 60,
    rankedStreamExpressionsMatched: fx.rse ?? [],
    proxied: false,
    library: fx.library ?? false,
    preloading: fx.preloading ?? false,
    parsedFile: {
      quality: fx.quality ?? null,
      resolution: fx.resolution ?? null,
      releaseGroup: fx.releaseGroup ?? null,
      visualTags: fx.visualTags,
      audioTags: fx.audioTags,
      audioChannels: fx.audioChannels,
      languages: fx.languages,
      network: fx.network ?? null,
      country: fx.country ?? null,
      subtitles: fx.subtitles,
    },
    seadex: fx.seadex ? { isSeadex: true, isBest: true } : undefined,
    addon: { name: "Comet" },
    service: { id: "realdebrid", cached: true },
  };
  const active = fx.isAnime ? animeFormatter : formatter;
  const output = await active.format(stream);
  if (fx.noStars) {
    assert.ok(
      !output.name.includes("★") && !output.name.includes("☆"),
      `${fx.label}: name must have no star glyphs: ${output.name}`
    );
  }
  assert.doesNotMatch(output.name + output.description, /\{(?:cannot_|unknown_|unable_|stream\.)/, `${fx.label}: formatter error/template leak`);
  for (const text of fx.visibleForbidden ?? []) {
    assert.ok(!output.description.includes(text), `${fx.label}: visible metadata bleed ${text}: ${output.description}`);
  }
  for (const text of fx.descriptionMustInclude ?? []) {
    assert.ok(output.description.includes(text), `${fx.label}: description missing ${text}: ${output.description}`);
  }
  for (const text of fx.descriptionMustNotInclude ?? []) {
    assert.ok(!output.description.includes(text), `${fx.label}: description should not include ${text}: ${output.description}`);
  }
  for (const custom of fx.rse ?? []) assert.ok(!output.name.includes(custom), `${fx.label}: custom RSE leaked visibly`);
  const haystacks = nuvioHaystacks([output.name, output.description, fx.filename].filter(Boolean) as string[]);
  const hits = filters.filter((f: any) => haystacks.some((h) => f.re.test(h)));
  const ids = hits.map((f: any) => f.id);
  assert.ok(ids.length <= 15, `${fx.label}: ${ids.length} badges: ${ids.join(", ")}`);
  for (const id of fx.expect ?? []) assert.ok(ids.includes(id), `${fx.label}: missing ${id}; got ${ids.join(", ")}`);
  for (const id of fx.forbid ?? []) assert.ok(!ids.includes(id), `${fx.label}: forbidden ${id}; got ${ids.join(", ")}`);
  for (const groupId of ["gms", "gq", "grl", "gr"]) {
    const groupHits = hits.filter((f: any) => f.groupId === groupId);
    assert.ok(groupHits.length <= 1, `${fx.label}: ${groupId} collision ${groupHits.map((f: any) => f.id).join(", ")}`);
  }
  console.log(`${fx.label}: ${ids.length} (${ids.join(", ")})`);
}

console.log(`test-v2-aiostreams-runtime: OK (${fixtures.length} real-engine fixtures)`);
