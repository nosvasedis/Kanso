/**
 * Compact AIOStreams formatter layout (Nice Debrid / Torbox).
 * Each template field (name, description) must stay under MAX_FORMATTER_TEMPLATE_LENGTH.
 * Production ship target: 16000 (user AIOStreams env).
 *
 * Philosophy: no double info with badges; no Nuvio UI fields (title/date/runtime/S-E).
 * Row logic:
 *  1. Release — what the file is (warnings, container, encode, group, country, Greek softsubs)
 *  2. File    — size, age, pack context, file-level flags
 *  3. Source  — cache state, service, addon, indexer, swarm, tracker flags
 */

import { FORMATTER_DR_INJECT } from "./dr-formatter-inject.mjs";
import { FORMATTER_EDITION_INJECT } from "./formatter-edition-inject.mjs";
import { FORMATTER_RANK_STARS, FORMATTER_SEADEX_INJECT } from "./quality-rank-patterns.mjs";
import { FORMATTER_STREAMING_INJECT } from "./streaming-formatter-patterns.mjs";

/** Title — transport + rank only (Nuvio owns title/episodes; badges own AV tiers). */
export const TITLE_TRANSPORT =
  '{stream.type::=debrid["🔗 "||""]}' +
  '{stream.type::=p2p["🧲 "||""]}' +
  '{stream.type::=http["🌐 "||""]}' +
  '{stream.type::=live["📺 "||""]}' +
  '{stream.type::=youtube["▶️ "||""]}' +
  '{stream.type::=archive["🗄️ "||""]}' +
  '{stream.type::=external["↗️ "||""]}' +
  '{stream.type::=usenet::or::stream.type::=stremio-usenet["📰 "||""]}';

/** Bad release-group warning — not owned by badges. */
export const CONTEXT_BLOCK = '{stream.regexMatched::~Bad["💣 Bad RG "||""]}';

/**
 * Container / encode — v-10bit badge owns bit depth.
 * Nested optional: separator only when both exist; encode alone has no leading ·.
 */
export const SOURCE_BLOCK =
  "{?📦 {stream.container::upper}{? · 🎞️ {stream.encode::upper}?}?}" +
  '{stream.container::exists::isfalse["{?🎞️ {stream.encode::upper}?}"||""]}';

export const RELEASE_GROUP_TAIL =
  "{? · 👥 {stream.releaseGroup::truncate(11)}?}";

/** Country tag (UK/US) — formatter-owned; no badge. */
export const COUNTRY_TAIL = "{? · {stream.country}?}";

/**
 * Greek softsubs only — formatter-owned (no sub badge).
 * Same visual family as country: short code on the release row, not a flag icon
 * (🇬🇷 is reserved for the l-el language badge). Prefer stream.subtitles;
 * filename fallback uses sub-specific tokens so Greek *audio* alone does not fire.
 */
export const GREEK_SOFTSUB_CUE = " · ELˢ";
export const GREEK_SOFTSUB_TAIL =
  `{stream.subtitles::exists["{stream.subtitles::~Greek["${GREEK_SOFTSUB_CUE}"||""]}"||"{stream.filename::~Ell.Sub::or::stream.filename::~Greek.Sub::or::stream.filename::~.ELL.Sub["${GREEK_SOFTSUB_CUE}"||""]}"]}`;

/** Row 1 — release identity (format + group + country + Greek softsubs). */
export const RELEASE_ROW =
  CONTEXT_BLOCK +
  SOURCE_BLOCK +
  RELEASE_GROUP_TAIL +
  COUNTRY_TAIL +
  GREEK_SOFTSUB_TAIL;

/** @deprecated alias */
export const TECH_ROW = RELEASE_ROW;

/** Row 2 — file stats (no delivery/cache — that belongs on row 3). */
export const FILE_ROW =
  '{stream.seasonPack::istrue["📚 Pack · "||""]}' +
  '{stream.size::>0::and::stream.seasonPack::isfalse["💾 "||""]}' +
  '{stream.size::>0["{stream.size::sbytes}"||""]}' +
  '{stream.folderSize::>0[" · 📁 {stream.folderSize::sbytes}"||""]}' +
  "{? · 📶 {stream.bitrate::sbitrate}?}" +
  "{? · 🕐 {stream.age}?}" +
  '{stream.upscaled::istrue[" · 🔼"||""]}' +
  '{stream.unrated::istrue[" · 🔞"||""]}';

/** @deprecated alias */
export const FILE_BLOCK = FILE_ROW;

/** Row 3 — source / delivery (cache beside service path). */
export const DELIVERY_ROW =
  '{service.cached::istrue["✅ "||""]}{service.cached::isfalse["⏳ "||""]}' +
  "{? · ☁️ {service.shortName}?}" +
  '{stream.proxied::istrue[" · 🛡️"||""]}' +
  '{stream.proxied::isfalse[" · 🧩"||""]}' +
  "{? {addon.name::truncate(14)}?}" +
  "{? · 🔍 {stream.indexer::truncate(18)}?}" +
  '{stream.type::=p2p::and::stream.seeders::>0[" · ⇋ {stream.seeders}🌱"||""]}' +
  '{stream.private::istrue[" · 🔐"||""]}' +
  '{stream.freeleech::istrue[" · 🆓"||""]}' +
  '{stream.library::istrue[" · 📚"||""]}' +
  '{stream.library::isfalse::and::stream.preloading::istrue[" · ⬇️"||""]}';

/** @deprecated alias */
export const PROVIDER_BLOCK = DELIVERY_ROW;

/** Invisible haystack tail for badge matching. */
export const INVISIBLE_INJECT_TAIL =
  FORMATTER_SEADEX_INJECT +
  FORMATTER_EDITION_INJECT +
  FORMATTER_STREAMING_INJECT +
  FORMATTER_DR_INJECT;

/**
 * NZB cleanup — modifiers on missing message render empty on 2.32, but keep
 * exists gate so the leading newline/icon never appear alone.
 */
export const MESSAGE_BLOCK =
  "{stream.message::exists[\"\\n💬 {stream.message::replace('NZB Health: ✅','✅ ')::replace('NZB Health: 🧝','🧝 ')::replace('AvailNZB 💚','💚 ')::replace('NZB Health: ⚠️','⚠️ ')::replace('NZB Health: 🚫','❌ ')}\"||\"\"]}";

export const FORMATTER_NAME = TITLE_TRANSPORT + FORMATTER_RANK_STARS;

export const FORMATTER_DESCRIPTION =
  RELEASE_ROW +
  "\n{tools.removeLine}\n" +
  FILE_ROW +
  "\n{tools.removeLine}\n" +
  DELIVERY_ROW +
  INVISIBLE_INJECT_TAIL +
  MESSAGE_BLOCK;

export const FORMATTER_MAX_LENGTH = 16000;
