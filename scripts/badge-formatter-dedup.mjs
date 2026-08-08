/**
 * Badge ↔ formatter ownership contract (AIOStreams / Nuvio).
 * Formatter must not display text for facts shown as badge icons.
 */

/**
 * Fields allowed only inside FORMATTER_DR_INJECT (invisible markers, not visible text).
 */
export const DR_INJECT_ONLY_FIELDS = [
  "visualTags",
  "stream.resolution",
  "stream.quality",
];

/** Substrings that must not appear in formatter description (visible AV/source duplication). */
export const FORBIDDEN_FORMATTER_SUBSTRINGS = [
  "audioTags",
  "audioChannels",
  'network::exists["📡',
  "🏆",
  "🎨 True-Hue",
  "⬛ B&W",
  "stream.editions::join",
  "DIR CUT",
  "EXTENDED",
  "TRUE-HUE",
  "metadata.title",
  "uSubtitleCodes",
  "🗣️ Dub",
  "🔓",
  "🎭",
  "formattedSeasons",
  "formattedEpisodes",
  "uncensored::istrue",
  "regraded::istrue",
  "dubbed::istrue",
];

/** Visible DR / release labels — badges own these facts. */
export const FORBIDDEN_VISIBLE_DR_SUBSTRINGS = [
  " · HDR",
  " · SDR",
  " · DV",
  " · 🔄",
  "Repack",
  "PROPER",
  "RMSTRD",
  "HDR10",
  "Dolby Vision",
  "Remux",
  "WebRip",
  "WebDL",
  "BluRay",
  " CAM",
  " HDTV",
];

/** @deprecated Same rules as main formatter since formatter.json uses mono layout. */
export const FORBIDDEN_MONO_FORMATTER_SUBSTRINGS = FORBIDDEN_FORMATTER_SUBSTRINGS;

/** Formatter editions expression must strip IMAX when v-imax / v-imax-e badges own it. */
export const IMAX_STRIPPED_FROM_EDITIONS =
  "stream.editions::remove('IMAX Enhanced')::remove('IMAX')";
