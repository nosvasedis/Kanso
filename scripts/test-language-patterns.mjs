import { LANGUAGE_BADGE_PATTERNS } from "./language-patterns.mjs";

const cases = [
  { id: "l-en", yes: ["Movie.2024.1080p.Eng.x264-GROUP", "Title.English.DDP5.1"], no: ["FraMeSToR", "danger"] },
  { id: "l-fr", yes: ["Movie.VFF.1080p.WEB", "Movie.TrueFrench.1080p", "Movie.2024.VFQ.720p"], no: ["FraMeSToR"] },
  { id: "l-de", yes: ["Movie.German.DL.1080p", "Movie.2024.DEU.720p"], no: ["danger"] },
  { id: "l-es", yes: ["Movie.Latino.1080p", "Movie.SPA.720p", "Movie.2024.Spanish.WEB"], no: [] },
  {
    id: "l-pt-br",
    yes: [
      "Movie.PT-BR.1080p",
      "Movie.Portuguese.Brazil.720p",
      "Movie.2024.Brazilian.WEB",
      "Movie.Portuguese-Brazil.1080p",
    ],
    no: ["Movie.Portuguese.1080p", "Movie.PT-PT.720p", "Movie.Portuguese.Portugal.WEB"],
  },
  {
    id: "l-pt-pt",
    yes: [
      "Movie.Portuguese.1080p",
      "Movie.PT-PT.720p",
      "Movie.Portuguese.Portugal.WEB",
      "Movie.Portuguese-European.1080p",
    ],
    no: ["Movie.PT-BR.1080p", "Movie.Portuguese.Brazil.720p", "Movie.Brazilian.WEB"],
  },
  {
    id: "l-tr",
    yes: ["Movie.Turkish.1080p", "Movie.TUR.720p", "Movie.2024.Turkish.WEB-DL"],
    no: ["turbo", "Movie.Turbo.1080p"],
  },
  {
    id: "l-pl",
    yes: ["Movie.Polish.1080p", "Movie.POL.720p", "Movie.2024.Polish.WEB"],
    no: ["polar", "Movie.Polar.1080p"],
  },
  {
    id: "l-uk",
    yes: ["Movie.Ukrainian.1080p", "Movie.UKR.720p", "Movie.2024.Ukrainian.WEB"],
    no: [],
  },
  {
    id: "l-id",
    yes: ["Movie.Indonesian.1080p", "Movie.IND.720p", "Movie.2024.Indonesian.WEB"],
    no: [],
  },
  {
    id: "l-th",
    yes: ["Movie.Thai.1080p", "Movie.THA.720p", "Movie.2024.Thai.WEB"],
    no: [],
  },
  {
    id: "l-vi",
    yes: ["Movie.Vietnamese.1080p", "Movie.VIE.720p", "Movie.2024.Vietnamese.WEB"],
    no: [],
  },
  { id: "l-ja", yes: ["Anime.2024.JPN.1080p", "アニメタイトル.1080p"], no: [] },
  { id: "l-ko", yes: ["Movie.KOR.1080p", "한국어제목.1080p"], no: [] },
  {
    id: "l-el",
    yes: [
      "Movie.Greek.1080p.WEB-DL",
      "Movie.2024.ELL.720p",
      "Ταινία.2024.1080p.BluRay",
      "Ηλίθιος.2024.1080p",
    ],
    no: [
      "FraMeSToR",
      "Movie.Gregory.1080p",
      "Movie.Greek.Sub.1080p",
      "Release.2024.1080p.EL.mkv",
      "Movie.2024.EL.DDP5.1",
      "Movie.GR.1080p.x264-GROUP",
    ],
  },
  { id: "l-mu", yes: ["Movie.MULTi.1080p", "Movie.Dual.Audio.1080p", "Movie.2024.Dual-Language.WEB"], no: [] },
  { id: "l-en", yes: [], no: ["Movie.Eng.Sub.1080p"] },
];

function nuvioRegex(pattern) {
  const inline = pattern.startsWith("(?i)");
  return new RegExp(inline ? pattern.slice(4) : pattern, inline ? "i" : "");
}

let failed = 0;
for (const { id, yes, no } of cases) {
  const re = nuvioRegex(LANGUAGE_BADGE_PATTERNS[id]);
  for (const s of yes) {
    if (!re.test(s)) {
      console.log("FAIL should match", id, s);
      failed++;
    }
  }
  for (const s of no) {
    if (re.test(s)) {
      console.log("FAIL should NOT match", id, s);
      failed++;
    }
  }
}
console.log(failed ? `${failed} failures` : "All language pattern tests passed");
