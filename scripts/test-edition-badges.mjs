import {
  EDITION_BW_BADGE_PATTERN,
  EDITION_DC_BADGE_PATTERN,
  EDITION_EXT_BADGE_PATTERN,
  EDITION_HUE_BADGE_PATTERN,
} from "./edition-badge-patterns.mjs";
import { EDITION_BADGES } from "./edition-badges.mjs";
import { applySolidTheme } from "./badge-solid-theme.mjs";
import { applyTransparentTheme, strokeForFilter } from "./badge-transparent-theme.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { SPECIAL_TAG_PATTERNS } from "./special-tag-patterns.mjs";
import { DR_DV_MARKER, DR_HDR10P_MARKER, DR_HDR_MARKER } from "./dr-formatter-markers.mjs";
import {
  NEW_SPECIAL_TAG_IDS,
  NEW_SPECIAL_TAG_RGB6,
  specialTagStroke,
} from "./special-tag-colors.mjs";

function nuvioRegex(pattern) {
  const inline = pattern.startsWith("(?i)");
  return new RegExp(inline ? pattern.slice(4) : pattern, inline ? "i" : "");
}

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    console.error("FAIL:", label);
    failed++;
  }
}

assert("four edition badges defined", EDITION_BADGES.length === 4);
assert("quality group has 9 combo filters", MONO_FILTER_ORDER.gq.length === 9);
assert("release group has 6 filters", MONO_FILTER_ORDER.grl.length === 6);
assert(
  "gst order lists special tags",
  MONO_FILTER_ORDER.gst.join(",") ===
    "seadex-release,hybrid-release,criterion-collection,proper-release,repack-release,remastered-release,open-matte-edition,regraded-release,edition-directors-cut,edition-extended,uncut-edition,uncensored-edition,edition-bw,edition-true-hue,edition-theatrical"
);

const dc = applySolidTheme({ id: "edition-directors-cut", groupId: "gst" });
assert("solid dc fill indigo", dc.tagColor?.toUpperCase() === "#5C6BC0");

const ext = applySolidTheme({ id: "edition-extended", groupId: "gst" });
assert("solid ext fill teal", ext.tagColor?.toUpperCase() === "#00897B");

const hue = applySolidTheme({ id: "edition-true-hue", groupId: "gst" });
assert("solid hue fill orange", hue.tagColor?.toUpperCase() === "#E65100");

const bw = applySolidTheme({ id: "edition-bw", groupId: "gst" });
assert("solid bw fill gray", bw.tagColor?.toUpperCase() === "#616161");

assert(
  "transparent dc stroke",
  strokeForFilter("edition-directors-cut", "gst") === "#FF5C6BC0"
);
assert(
  "transparent ext stroke",
  strokeForFilter("edition-extended", "gst") === "#FF00897B"
);

const legacyFills = new Set([
  "#6A1B9A",
  "#5C6BC0",
  "#00897B",
  "#E65100",
  "#616161",
]);
const newFills = new Set();
for (const id of NEW_SPECIAL_TAG_IDS) {
  const solid = applySolidTheme({ id, groupId: "gst" });
  const rgb6 = NEW_SPECIAL_TAG_RGB6[id];
  assert(`solid ${id} fill`, solid.tagColor?.toUpperCase() === `#${rgb6}`);
  assert(`transparent ${id} stroke`, strokeForFilter(id, "gst") === specialTagStroke(id));
  newFills.add(solid.tagColor?.toUpperCase());
}
assert(
  "new special-tag fills are unique",
  newFills.size === NEW_SPECIAL_TAG_IDS.length
);
for (const fill of newFills) {
  assert(`new fill ${fill} not legacy`, !legacyFills.has(fill));
}

const hybrid = applySolidTheme({ id: "hybrid-release", groupId: "gst" });
assert("hybrid not extended teal", hybrid.tagColor?.toUpperCase() !== "#00897B");

const reDc = nuvioRegex(EDITION_DC_BADGE_PATTERN);
const reExt = nuvioRegex(EDITION_EXT_BADGE_PATTERN);
assert(
  "dc pattern matches Director's Cut",
  reDc.test("Movie.2012.Director's.Cut.1080p.BluRay.x264-GROUP")
);
assert(
  "ext pattern matches Extended Cut",
  reExt.test("Movie.2003.Extended.Cut.2160p.UHD.BluRay.REMUX")
);
assert(
  "ext pattern rejects Extended Mix",
  !reExt.test("Release.DTS-HD.MA.5.1.Extended.Mix.2160p")
);

const reHue = nuvioRegex(EDITION_HUE_BADGE_PATTERN);
const reBw = nuvioRegex(EDITION_BW_BADGE_PATTERN);
assert(
  "hue matches COLORIZED scene tag",
  reHue.test("Spider.Noir.S01E01.COLORIZED.2160p.WEB-DL")
);
assert(
  "hue matches Full Color scene tag",
  reHue.test("Spider.Noir.S01E01.Full.Color.2160p.WEB-DL")
);
assert(
  "hue matches spaced Full Color",
  reHue.test("Spider-Noir S01E01 Step Into My Office Full Color 2160p WEB-DL")
);
assert(
  "bw matches dot BW scene tag",
  reBw.test("Spider.Noir.S01E02.BW.2160p.WEB-DL")
);
assert(
  "bw matches B&W scene tag",
  reBw.test("Spider.Noir.S01E02.B&W.2160p.WEB-DL")
);
assert(
  "bw matches Black & White",
  reBw.test("Spider-Noir S01E02 Black & White 2160p WEB-DL")
);
assert(
  "bw rejects COLORIZED when hue would apply",
  !reBw.test("Spider.Noir.S01E01.COLORIZED.2160p.WEB-DL")
);
assert(
  "bw rejects Full Color when hue would apply",
  !reBw.test("Spider.Noir.S01E01.Full.Color.2160p.WEB-DL")
);

const reThtr = nuvioRegex(SPECIAL_TAG_PATTERNS["edition-theatrical"].pattern);
assert("thtr rejects DR dv marker haystack", !reThtr.test(`Movie.2160p${DR_DV_MARKER}.mkv`));
assert("thtr rejects DR hdr10+ marker haystack", !reThtr.test(`Movie.2160p${DR_HDR10P_MARKER}.mkv`));
assert("thtr rejects DR hdr marker haystack", !reThtr.test(`Movie.2160p${DR_HDR_MARKER}.mkv`));
assert("thtr matches theatrical cut token", reThtr.test("Movie.2020.Theatrical.Cut.1080p-GROUP"));

if (!failed) console.log("All edition badge tests passed.");
process.exit(failed ? 1 : 0);
