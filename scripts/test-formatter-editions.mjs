import {
  EDITION_BW_BADGE_PATTERN,
  EDITION_BW_MARKER,
  EDITION_DC_BADGE_PATTERN,
  EDITION_DC_MARKER,
  EDITION_EXT_BADGE_PATTERN,
  EDITION_EXT_MARKER,
  EDITION_HUE_BADGE_PATTERN,
  EDITION_HUE_MARKER,
} from "./edition-badge-patterns.mjs";
import { BW_HIT, DC_HIT, DC_FF, EXT_FF, EXT_HIT, HUE_HIT } from "./formatter-editions.mjs";
import { FORMATTER_EDITION_INJECT } from "./formatter-edition-inject.mjs";

function nuvioRegex(pattern) {
  const inline = pattern.startsWith("(?i)");
  return new RegExp(inline ? pattern.slice(4) : pattern, inline ? "i" : "");
}

const SPIDER_BW =
  "Spider-Noir S01E02 Tread Lightly Authentic BW 2160p AMZN WEB-DL DDP5 1 Atmos DV H 265-FLUX";
const SPIDER_BW_DOT =
  "Spider.Noir.S01E02.Tread.Lightly.BW.2160p.AMZN.WEB-DL.DDP5.1.DV.H265-FLUX";
const SPIDER_HUE =
  "Spider-Noir S01E01 Step Into My Office True-Hue Full Color 2160p AMZN WEB-DL";
const SPIDER_HUE_COLORIZED =
  "Spider.Noir.S01E01.Step.Into.My.Office.COLORIZED.2160p.AMZN.WEB-DL.DDP5.1.DV.H265-Kitsune.mkv";
const SPIDER_HUE_FULL_COLOR =
  "Spider.Noir.S01E01.Step.Into.My.Office.Full.Color.2160p.AMZN.WEB-DL.DDP5.1.DV.H265-Kitsune.mkv";
const BLADE_DC =
  "Blade.Runner.2049.2017.Directors.Cut.2160p.UHD.BluRay.REMUX.HEVC.DTS-HD.MA.TrueHD.7.1";
const LOTR_EXT =
  "The.Lord.of.the.Rings.The.Fellowship.of.the.Ring.2001.Extended.Edition.2160p.UHD.BluRay";

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    console.error("FAIL:", label);
    failed++;
  }
}

assert("inject includes dc marker", FORMATTER_EDITION_INJECT.includes(EDITION_DC_MARKER));
assert("inject includes ext marker", FORMATTER_EDITION_INJECT.includes(EDITION_EXT_MARKER));
assert(
  "hue/bw inject omitted (filename badges only)",
  !FORMATTER_EDITION_INJECT.includes(EDITION_HUE_MARKER) &&
    !FORMATTER_EDITION_INJECT.includes(EDITION_BW_MARKER)
);
assert(
  "dc badge matches Directors Cut filename",
  nuvioRegex(EDITION_DC_BADGE_PATTERN).test(BLADE_DC)
);
assert(
  "ext badge matches Extended Edition filename",
  nuvioRegex(EDITION_EXT_BADGE_PATTERN).test(LOTR_EXT)
);
assert(
  "ext badge rejects Extended Clip",
  !nuvioRegex(EDITION_EXT_BADGE_PATTERN).test("Show S01E05 Extended Clip 1080p WEB-DL")
);
assert(
  "hue badge matches True-Hue filename",
  nuvioRegex(EDITION_HUE_BADGE_PATTERN).test(SPIDER_HUE)
);
assert(
  "hue badge matches COLORIZED dot filename",
  nuvioRegex(EDITION_HUE_BADGE_PATTERN).test(SPIDER_HUE_COLORIZED)
);
assert(
  "hue badge matches Full Color dot filename",
  nuvioRegex(EDITION_HUE_BADGE_PATTERN).test(SPIDER_HUE_FULL_COLOR)
);
assert(
  "bw badge pattern matches Authentic BW",
  nuvioRegex(EDITION_BW_BADGE_PATTERN).test(SPIDER_BW)
);
assert(
  "bw badge matches dot BW token",
  nuvioRegex(EDITION_BW_BADGE_PATTERN).test(SPIDER_BW_DOT)
);
assert(
  "bw badge matches B&W token",
  nuvioRegex(EDITION_BW_BADGE_PATTERN).test(
    "Spider-Noir S01E02 Tread Lightly B&W 2160p AMZN WEB-DL"
  )
);
assert(
  "bw badge matches Black & White",
  nuvioRegex(EDITION_BW_BADGE_PATTERN).test(
    "Spider-Noir S01E02 Tread Lightly Black & White 2160p WEB-DL"
  )
);
assert(
  "bw pattern rejects COLORIZED filename",
  !nuvioRegex(EDITION_BW_BADGE_PATTERN).test(SPIDER_HUE_COLORIZED)
);
assert(
  "bw pattern rejects Full Color filename",
  !nuvioRegex(EDITION_BW_BADGE_PATTERN).test(SPIDER_HUE_FULL_COLOR)
);
assert(
  "bw pattern rejects release-group -BW suffix",
  !nuvioRegex(EDITION_BW_BADGE_PATTERN).test(
    "Movie.2020.1080p.BluRay.x264-FOO-BW"
  )
);
assert(
  "bw pattern rejects True-Hue filename",
  !nuvioRegex(EDITION_BW_BADGE_PATTERN).test(SPIDER_HUE)
);
assert("DC_HIT uses filename Director", DC_HIT.includes("filename::~Director"));
assert("EXT_HIT uses Extended Edition", EXT_HIT.includes("Extended Edition"));
assert("HUE_HIT matches COLORIZED", HUE_HIT.includes("COLORIZED"));
assert("HUE_HIT matches True-Hue", HUE_HIT.includes("True-Hue"));
assert("BW_HIT matches Authentic", BW_HIT.includes("Authentic"));
assert("BW_HIT matches dot BW", BW_HIT.includes(".BW."));
assert("DC_FF kept for tests", DC_FF.includes("folderName"));
assert("EXT_FF kept for tests", EXT_FF.includes("Extended Edition"));

if (!failed) console.log("All formatter edition tests passed.");
process.exit(failed ? 1 : 0);
