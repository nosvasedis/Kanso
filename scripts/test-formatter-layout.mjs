import {
  DR_INJECT_ONLY_FIELDS,
  FORBIDDEN_FORMATTER_SUBSTRINGS,
  FORBIDDEN_VISIBLE_DR_SUBSTRINGS,
} from "./badge-formatter-dedup.mjs";
import { FORMATTER_DR_INJECT } from "./dr-formatter-inject.mjs";
import {
  CONTEXT_BLOCK,
  DELIVERY_ROW,
  FILE_ROW,
  FORMATTER_DESCRIPTION,
  FORMATTER_MAX_LENGTH,
  FORMATTER_NAME,
  INVISIBLE_INJECT_TAIL,
  RELEASE_ROW,
  SOURCE_BLOCK,
  TITLE_TRANSPORT,
} from "./formatter-layout.mjs";
import { FORMATTER_EDITION_INJECT } from "./formatter-edition-inject.mjs";
import { FORMATTER_RANK_STARS, PSTAR_NUVIO_SAFE } from "./quality-rank-patterns.mjs";
import { FORMATTER_STREAMING_INJECT } from "./streaming-formatter-patterns.mjs";

let failed = 0;

function assert(label, ok) {
  if (!ok) {
    console.log("FAIL", label);
    failed++;
  }
}

assert(
  "under AIOStreams max length",
  FORMATTER_DESCRIPTION.length <= FORMATTER_MAX_LENGTH
);

// Title — transport + visual stars only (no catalog metadata, cache, or pack)
assert("transport debrid in title", TITLE_TRANSPORT.includes('stream.type::=debrid["🔗 "'));
assert("transport p2p in title", TITLE_TRANSPORT.includes('stream.type::=p2p["🧲 "'));
assert("transport http in title", TITLE_TRANSPORT.includes('stream.type::=http["🌐 "'));
assert("transport usenet in title", TITLE_TRANSPORT.includes("stremio-usenet"));
assert("no cache icons in title", !FORMATTER_NAME.includes("service.cached"));
assert("no season pack in title", !FORMATTER_NAME.includes("seasonPack"));
assert("no metadata title in name", !FORMATTER_NAME.includes("metadata.title"));
assert("no year in name", !FORMATTER_NAME.includes("stream.year"));
assert("no queryType in name", !FORMATTER_NAME.includes("metadata.queryType"));
assert("no formattedSeasons in name", !FORMATTER_NAME.includes("formattedSeasons"));
assert("no episode block in description", !FORMATTER_DESCRIPTION.includes("formattedSeasons"));
assert("no folderName", !FORMATTER_DESCRIPTION.includes("folderName"));
assert("rank stars in title", FORMATTER_NAME.includes("nSeScore::pstar"));
assert("title rank stars fragment present", FORMATTER_NAME.includes(FORMATTER_RANK_STARS));
assert("title uses raw pstar glyphs", FORMATTER_NAME.includes("nSeScore::pstar"));
assert("half-star mapped for nuvio", FORMATTER_NAME.includes(PSTAR_NUVIO_SAFE));
assert("no dot separator before stars", !FORMATTER_NAME.includes('[" · {stream.nSeScore::pstar}"'));
assert("no compact N-star remap in title", !FORMATTER_NAME.includes("replace('★★★★★','5★')"));
assert(
  "rank stars only in title not description",
  !FORMATTER_DESCRIPTION.includes("nSeScore::pstar")
);
assert(
  "no release marker inject in formatter",
  !FORMATTER_DESCRIPTION.includes('stream.filename::exists["') &&
    !FORMATTER_NAME.includes('stream.filename::exists["')
);

// Description rows — release / file / delivery
assert("release row combines context source and group", RELEASE_ROW.includes(CONTEXT_BLOCK + SOURCE_BLOCK));
assert("release group on release row", RELEASE_ROW.includes("releaseGroup::truncate"));
assert("no release group on delivery row", !DELIVERY_ROW.includes("releaseGroup"));
assert("no duration in context block", !CONTEXT_BLOCK.includes("duration"));
assert("bad rg warning", CONTEXT_BLOCK.includes("Bad RG"));
assert("no bit depth in source row", !SOURCE_BLOCK.includes("10bit"));
assert("encode in source row", SOURCE_BLOCK.includes("stream.encode::upper"));
assert("source encode nested with container", SOURCE_BLOCK.includes("{? · 🎞️ {stream.encode::upper}?}"));
assert("encode alone without leading separator", SOURCE_BLOCK.includes("{?🎞️ {stream.encode::upper}?}"));
assert("two removeLine separators", (FORMATTER_DESCRIPTION.match(/\{tools\.removeLine\}/g) || []).length === 2);
assert("cached indicator on delivery row", DELIVERY_ROW.includes('service.cached::istrue["✅ "'));
assert("uncached indicator on delivery row", DELIVERY_ROW.includes('service.cached::isfalse["⏳ "'));
assert("no cache on file row", !FILE_ROW.includes("service.cached"));
assert("season pack label on file row", FILE_ROW.includes('seasonPack::istrue["📚 Pack · "'));
assert("single file icon", FILE_ROW.includes('seasonPack::isfalse["💾 "'));
assert("stream age on file row", FILE_ROW.includes("{? · 🕐 {stream.age}?}"));
assert("seeders only on p2p", DELIVERY_ROW.includes('stream.type::=p2p::and::stream.seeders::>0'));
assert("seeders not gated by cache alone", !DELIVERY_ROW.includes("service.cached::isfalse::or::stream.type::=p2p"));
assert("no seeders on file row", !FILE_ROW.includes("stream.seeders"));
assert("upscaled on file row", FILE_ROW.includes("upscaled::istrue"));
assert("unrated on file row", FILE_ROW.includes("unrated::istrue"));
assert("no dub flags in description", !FORMATTER_DESCRIPTION.includes("🗣️ Dub"));
assert("no subtitle codes in description", !FORMATTER_DESCRIPTION.includes("uSubtitleCodes"));
assert("no uncensored text flag", !FORMATTER_DESCRIPTION.includes("uncensored::istrue"));
assert("no regraded text flag", !FORMATTER_DESCRIPTION.includes("regraded::istrue"));
assert("proxied shield icon standalone", DELIVERY_ROW.includes('stream.proxied::istrue[" · 🛡️"'));
assert("direct puzzle icon standalone", DELIVERY_ROW.includes('stream.proxied::isfalse[" · 🧩"'));
assert(
  "addon name separate from proxied icon",
  DELIVERY_ROW.includes("{? {addon.name::truncate(14)}?}")
);
assert("service cloud icon with dot", DELIVERY_ROW.includes("{? · ☁️ {service.shortName}?}"));
assert("no bracketed service", !DELIVERY_ROW.includes("[{service.shortName}]"));
assert("private stream lock", DELIVERY_ROW.includes("stream.private::istrue"));
assert("library spaced dot", DELIVERY_ROW.includes('library::istrue[" · 📚"'));
assert(
  "preload download icon when not library",
  DELIVERY_ROW.includes('library::isfalse::and::stream.preloading::istrue[" · ⬇️"')
);
assert("no air date in formatter", !FORMATTER_DESCRIPTION.includes("stream.date"));
assert("country on release row", RELEASE_ROW.includes("{? · {stream.country}?}"));
assert(
  "Greek softsub cue on release row",
  RELEASE_ROW.includes("stream.subtitles::~Greek") &&
    RELEASE_ROW.includes(" · ELˢ") &&
    RELEASE_ROW.includes("Ell.Sub")
);
assert("Greek softsub prefers media-info subtitles", RELEASE_ROW.includes("subtitles::exists"));
assert("no bare Greek flag softsub cue", !RELEASE_ROW.includes("🇬🇷"));
assert("no Tam preload arrow", !FORMATTER_DESCRIPTION.includes("➤"));
assert("addon name on delivery row", DELIVERY_ROW.includes("addon.name::truncate(14)"));
assert("indexer on delivery row", DELIVERY_ROW.includes("{? · 🔍 {stream.indexer::truncate(18)}?}"));
assert("folder size on file row", FILE_ROW.includes('folderSize::>0[" · 📁 {stream.folderSize::sbytes}"'));
assert("bitrate on file row", FILE_ROW.includes("{? · 📶 {stream.bitrate::sbitrate}?}"));
assert("no stream type text in description", !FORMATTER_DESCRIPTION.includes('stream.type::=debrid[" · 🔗 Debrid"'));
assert("no thunder cache icon", !FORMATTER_DESCRIPTION.includes('service.cached::istrue["⚡'));
assert("no visible network in source row", !SOURCE_BLOCK.includes('network::exists["📡'));
assert("no network emoji", !FORMATTER_DESCRIPTION.includes("📡"));
assert("streaming inject present", FORMATTER_DESCRIPTION.includes(FORMATTER_STREAMING_INJECT));
assert("no codec badges in layout", !FORMATTER_DESCRIPTION.includes("e-h264"));
assert("no visible rank glyphs in formatter", !FORMATTER_DESCRIPTION.includes(" · ♛"));
assert("no visible rank haystack ascii", !/r[BGO]\b/.test(FORMATTER_DESCRIPTION));
assert("no visible seadex text in formatter", !FORMATTER_DESCRIPTION.includes(" · seadex"));
assert("no visible seadex haystack ascii", !FORMATTER_DESCRIPTION.includes("sdx"));
assert("seadex haystack template present", FORMATTER_DESCRIPTION.includes("seadexBest"));
assert("invisible inject tail present", FORMATTER_DESCRIPTION.includes(INVISIBLE_INJECT_TAIL));
assert("nzb message rewrite", FORMATTER_DESCRIPTION.includes("NZB Health"));
assert(
  "message replace gated by exists",
  !FORMATTER_DESCRIPTION.match(/\}\{stream\.message::replace/) &&
    FORMATTER_DESCRIPTION.includes('stream.message::exists["\\n💬 {stream.message::replace')
);
assert(
  "no parsed editions join line",
  !FORMATTER_DESCRIPTION.includes("join(' • ')::replace('True-Hue")
);
assert("no In Library text", !FORMATTER_DESCRIPTION.includes("In Library"));
assert("no visible True-Hue label", !FORMATTER_DESCRIPTION.includes("🎨 True-Hue"));
assert("edition inject in description", FORMATTER_DESCRIPTION.includes(FORMATTER_EDITION_INJECT));
assert(
  "edition inject uses director filename",
  FORMATTER_EDITION_INJECT.includes("filename::~Director")
);
assert(
  "edition inject uses extended filename",
  FORMATTER_EDITION_INJECT.includes("filename::~Extended Cut")
);
assert("edition avoids invalid length::isfalse", !FORMATTER_DESCRIPTION.includes("length::isfalse"));

// Double-info / Nuvio-UI regression — visible rows must not own badge or Nuvio domains
const visibleLayout =
  RELEASE_ROW + "\n" + FILE_ROW + "\n" + DELIVERY_ROW + "\n" + FORMATTER_NAME;
assert("no visible uLanguages", !visibleLayout.includes("uLanguages"));
assert("no visible uSmallLanguageCodes", !visibleLayout.includes("uSmallLanguageCodes"));
assert("no visible languageEmojis", !visibleLayout.includes("languageEmojis"));
assert("no stream.duration", !visibleLayout.includes("stream.duration"));
assert("no metadata.runtime", !visibleLayout.includes("metadata.runtime"));
assert("no metadata.title", !visibleLayout.includes("metadata.title"));
assert("no stream.title", !visibleLayout.includes("stream.title"));
assert("no seasonEpisode", !visibleLayout.includes("seasonEpisode"));
assert("no formattedEpisodes", !visibleLayout.includes("formattedEpisodes"));
assert("no stream.date", !visibleLayout.includes("stream.date"));
assert("no Tam visualTags display", !visibleLayout.includes("visualTags::"));
assert("no Tam audioTags display", !visibleLayout.includes("audioTags::"));
assert("no Tam network smallcaps", !visibleLayout.includes("network::smallcaps"));
assert("no quality title text", !visibleLayout.includes("stream.quality::title"));
assert("no resolution on visible rows", !visibleLayout.includes("stream.resolution"));
assert("country present on release row", visibleLayout.includes("stream.country"));
assert("Greek softsub on release row only", RELEASE_ROW.includes("ELˢ") && !FILE_ROW.includes("ELˢ") && !DELIVERY_ROW.includes("ELˢ"));
assert("optional groups used", RELEASE_ROW.includes("{?") && FILE_ROW.includes("{?"));

for (const forbidden of FORBIDDEN_FORMATTER_SUBSTRINGS) {
  assert(`formatter must not include ${forbidden}`, !FORMATTER_DESCRIPTION.includes(forbidden));
}
for (const field of DR_INJECT_ONLY_FIELDS) {
  const inInject = FORMATTER_DR_INJECT.includes(field);
  const outsideInject =
    FORMATTER_DESCRIPTION.replace(FORMATTER_DR_INJECT, "").includes(field);
  assert(`DR field ${field} only in inject`, inInject && !outsideInject);
}
const descriptionWithoutDrInject = FORMATTER_DESCRIPTION.replace(FORMATTER_DR_INJECT, "");
for (const forbidden of FORBIDDEN_VISIBLE_DR_SUBSTRINGS) {
  assert(`no visible DR text ${forbidden}`, !descriptionWithoutDrInject.includes(forbidden));
}
assert("dr inject in description", FORMATTER_DESCRIPTION.includes(FORMATTER_DR_INJECT));
assert("edition inject uses null-safe editions array", FORMATTER_EDITION_INJECT.includes("stream.editions::~"));
assert("edition inject avoids nullable remove chain", !FORMATTER_EDITION_INJECT.includes("stream.editions::remove"));

console.log(failed ? `${failed} layout test failures` : "All formatter layout tests passed");
