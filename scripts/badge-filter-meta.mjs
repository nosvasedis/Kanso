/**
 * Shared filter patterns / names (solid + transparent + mono badge sets).
 */
import { LANGUAGE_BADGE_PATTERNS } from "./language-patterns.mjs";
import { mergeFilenameAndTag } from "./pattern-merge.mjs";
import { METADATA_TAG_PATTERNS } from "./metadata-tag-patterns.mjs";
import {
  EDITION_BW_BADGE_PATTERN,
  EDITION_DC_BADGE_PATTERN,
  EDITION_EXT_BADGE_PATTERN,
  EDITION_HUE_BADGE_PATTERN,
} from "./edition-badge-patterns.mjs";
import { RESOLUTION_FILTER_META, RESOLUTION_PATTERNS } from "./resolution-patterns.mjs";
import {
  QUALITY_RANK_PATTERNS,
  RELEASE_FILTER_PATTERNS,
  SEADEX_MARKER,
} from "./quality-rank-patterns.mjs";
import { DV_COMBO_PATTERNS } from "./dv-combo-patterns.mjs";
import { VISUAL_TAG_PATTERNS } from "./visual-tag-patterns.mjs";
import { VISUAL_MERGE_PATTERNS } from "./visual-merge-patterns.mjs";
import { AUDIO_CODEC_PATTERNS } from "./audio-smart-tier.mjs";
import { AUDIO_MERGE_PATTERNS, DTS_STANDALONE_PATTERNS } from "./audio-merge-patterns.mjs";
import { SPECIAL_TAG_PATTERNS } from "./special-tag-patterns.mjs";

export const LANGUAGE_FILTER_META = {
  "l-en": "🇬🇧",
  "l-es": "🇪🇸",
  "l-fr": "🇫🇷",
  "l-de": "🇩🇪",
  "l-it": "🇮🇹",
  "l-pt-br": "🇧🇷",
  "l-pt-pt": "🇵🇹",
  "l-tr": "🇹🇷",
  "l-pl": "🇵🇱",
  "l-uk": "🇺🇦",
  "l-id": "🇮🇩",
  "l-th": "🇹🇭",
  "l-vi": "🇻🇳",
  "l-ja": "🇯🇵",
  "l-ko": "🇰🇷",
  "l-zh": "🇨🇳",
  "l-hi": "🇮🇳",
  "l-ar": "🇸🇦",
  "l-ru": "🇷🇺",
  "l-el": "🇬🇷",
  "l-mu": "🌐",
};

const FILTER_META = {
  "seadex-release": {
    name: "SEADEX",
    pattern: `(?i)(?:${[...SEADEX_MARKER].map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`).join("")}|\\b(?:seadex|best[\\s._-]?release|alt[\\s._-]?(?:best[\\s._-]?)?release)\\b|ᴀʟᴛ[\\s._-]?ʙᴇsᴛ[\\s._-]?ʀᴇʟᴇᴀsᴇ|ᴀʟᴛ[\\s._-]?ʀᴇʟᴇᴀsᴇ|ʙᴇsᴛ[\\s._-]?ʀᴇʟᴇᴀsᴇ)`,
  },
  "edition-directors-cut": {
    name: "DIR CUT",
    pattern: EDITION_DC_BADGE_PATTERN,
  },
  "edition-extended": {
    name: "EXTENDED",
    pattern: EDITION_EXT_BADGE_PATTERN,
  },
  "edition-true-hue": {
    name: "TRUE-HUE",
    pattern: EDITION_HUE_BADGE_PATTERN,
  },
  "edition-bw": {
    name: "B&W",
    pattern: EDITION_BW_BADGE_PATTERN,
  },
  "q-r": {
    name: "Remux",
    pattern: RELEASE_FILTER_PATTERNS["q-r"],
  },
  "q-b": {
    name: "BluRay",
    pattern: RELEASE_FILTER_PATTERNS["q-b"],
  },
  "q-w": {
    name: "WebDL",
    pattern: RELEASE_FILTER_PATTERNS["q-w"],
  },
  "q-wr": {
    name: "WebRip",
    pattern: RELEASE_FILTER_PATTERNS["q-wr"],
  },
  "q-cam": {
    name: "CAM",
    pattern: RELEASE_FILTER_PATTERNS["q-cam"],
  },
  "q-hdtv": {
    name: "HDTV",
    pattern: RELEASE_FILTER_PATTERNS["q-hdtv"],
  },
  ...SPECIAL_TAG_PATTERNS,
};

function mergePatternSources(patternMap) {
  const meta = {};
  for (const [id, entry] of Object.entries(patternMap)) {
    const tag = METADATA_TAG_PATTERNS[id];
    meta[id] = {
      ...(entry.name ? { name: entry.name } : {}),
      pattern: tag ? mergeFilenameAndTag(entry.pattern, tag) : entry.pattern,
    };
  }
  return meta;
}

function buildAvFilterMeta() {
  return {
    ...mergePatternSources(DV_COMBO_PATTERNS),
    ...mergePatternSources(VISUAL_TAG_PATTERNS),
    ...mergePatternSources(VISUAL_MERGE_PATTERNS),
    ...mergePatternSources(AUDIO_MERGE_PATTERNS),
    ...mergePatternSources(DTS_STANDALONE_PATTERNS),
    ...mergePatternSources(AUDIO_CODEC_PATTERNS),
  };
}

const AV_FILTER_META = buildAvFilterMeta();

/** @param {object} filter */
export function applyFilterMeta(filter) {
  const langPattern = LANGUAGE_BADGE_PATTERNS[filter.id];
  if (langPattern) {
    filter.pattern = langPattern;
    if (LANGUAGE_FILTER_META[filter.id]) {
      filter.name = LANGUAGE_FILTER_META[filter.id];
    }
  }

  const rankPattern = QUALITY_RANK_PATTERNS[filter.id];
  if (rankPattern) filter.pattern = rankPattern;

  const resPattern = RESOLUTION_PATTERNS[filter.id];
  if (resPattern) {
    filter.pattern = resPattern;
    if (RESOLUTION_FILTER_META[filter.id]) {
      filter.name = RESOLUTION_FILTER_META[filter.id];
    }
  }

  const meta = FILTER_META[filter.id] ?? AV_FILTER_META[filter.id];
  if (!meta) return filter;
  if (meta.name) filter.name = meta.name;
  if (meta.pattern) filter.pattern = meta.pattern;
  return filter;
}
