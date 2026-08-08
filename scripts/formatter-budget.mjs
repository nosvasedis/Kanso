/**
 * Phase 8 — pack v2 formatter inject into name/description under AIOStreams
 * per-field MAX_FORMATTER_TEMPLATE_LENGTH (16000 for full v2 ship).
 */
import {
  DELIVERY_ROW,
  FILE_ROW,
  FORMATTER_MAX_LENGTH,
  MESSAGE_BLOCK,
  RELEASE_ROW,
  TITLE_TRANSPORT,
} from "./formatter-layout.mjs";
import {
  FORMATTER_RANK_STARS,
  FORMATTER_SEADEX_INJECT,
} from "./quality-rank-patterns.mjs";
import { FORMATTER_EDITION_INJECT } from "./formatter-edition-inject.mjs";
import { FORMATTER_STREAMING_INJECT } from "./streaming-formatter-patterns.mjs";

const FORMATTER_V2_INJECT_BASELINE =
  FORMATTER_SEADEX_INJECT + FORMATTER_EDITION_INJECT + FORMATTER_STREAMING_INJECT;
import { FORMATTER_V2_INJECT_VISUAL_CORE, FORMATTER_V2_INJECT_VISUAL_FILENAME } from "./visual-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_AUDIO_CORE, FORMATTER_V2_INJECT_AUDIO_FILENAME } from "./audio-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_CHANNELS } from "./channels-formatter-inject.mjs";
import {
  FORMATTER_V2_INJECT_RESOLUTION_CHAIN,
  FORMATTER_V2_INJECT_RESOLUTION_FILENAME,
} from "./resolution-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_LANGUAGES } from "./language-formatter-inject.mjs";
import {
  FORMATTER_V2_INJECT_SPECIAL_FILENAME,
  FORMATTER_V2_INJECT_EDITION_HUE_BW,
} from "./special-formatter-inject.mjs";
import { FORMATTER_V2_INJECT_SOURCE } from "./source-formatter-inject.mjs";
import {
  FORMATTER_V2_INJECT_TIERS_RSE,
  FORMATTER_V2_INJECT_TIERS_RG,
  FORMATTER_V2_INJECT_TIERS_UNRANKED,
} from "./tier-inject-generator.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { SPECIAL_ONLY_IDS } from "./special-formatter-inject.mjs";

export const FORMATTER_VISIBLE_DESCRIPTION =
  RELEASE_ROW + "\n{tools.removeLine}\n" + FILE_ROW + "\n{tools.removeLine}\n" + DELIVERY_ROW;

/**
 * Injectable segments — lowest shardPriority drops first when over budget.
 * @type {Array<{ id: string, field: 'name'|'description', shardPriority: number, text: string, badgeIds?: string[] }>}
 */
export const FORMATTER_V2_SEGMENTS = [
  { id: "transport", field: "name", shardPriority: Infinity, text: TITLE_TRANSPORT },
  { id: "stars", field: "name", shardPriority: Infinity, text: FORMATTER_RANK_STARS },
  { id: "tiersRse", field: "name", shardPriority: 92, text: FORMATTER_V2_INJECT_TIERS_RSE, badgeIds: MONO_FILTER_ORDER.gms.filter((id) => !id.endsWith("-unranked")) },
  { id: "tiersRg", field: "name", shardPriority: 48, text: FORMATTER_V2_INJECT_TIERS_RG, badgeIds: MONO_FILTER_ORDER.gms.filter((id) => !id.endsWith("-unranked")) },
  {
    id: "tiersUnranked",
    field: "name",
    shardPriority: 46,
    text: FORMATTER_V2_INJECT_TIERS_UNRANKED,
    badgeIds: ["web-unranked", "blu-ray-unranked", "remux-unranked"],
  },
  { id: "source", field: "name", shardPriority: 90, text: FORMATTER_V2_INJECT_SOURCE, badgeIds: [...MONO_FILTER_ORDER.grl, ...MONO_FILTER_ORDER.gq] },
  { id: "visible", field: "description", shardPriority: Infinity, text: FORMATTER_VISIBLE_DESCRIPTION },
  { id: "baseline", field: "description", shardPriority: 97, text: FORMATTER_V2_INJECT_BASELINE },
  { id: "visualCore", field: "description", shardPriority: 96, text: FORMATTER_V2_INJECT_VISUAL_CORE, badgeIds: MONO_FILTER_ORDER.gv },
  {
    id: "visualFilename",
    field: "description",
    shardPriority: 52,
    text: FORMATTER_V2_INJECT_VISUAL_FILENAME,
    badgeIds: ["v-imax-e", "v-imax", "v-3d"],
  },
  { id: "audioCore", field: "description", shardPriority: 94, text: FORMATTER_V2_INJECT_AUDIO_CORE, badgeIds: MONO_FILTER_ORDER.ga },
  {
    id: "audioFilename",
    field: "description",
    shardPriority: 51,
    text: FORMATTER_V2_INJECT_AUDIO_FILENAME,
    badgeIds: MONO_FILTER_ORDER.ga,
  },
  { id: "channels", field: "description", shardPriority: 62, text: FORMATTER_V2_INJECT_CHANNELS, badgeIds: MONO_FILTER_ORDER.gc },
  {
    id: "resolutionChain",
    field: "description",
    shardPriority: 60,
    text: FORMATTER_V2_INJECT_RESOLUTION_CHAIN,
    badgeIds: MONO_FILTER_ORDER.gr,
  },
  {
    id: "resolutionFilename",
    field: "description",
    shardPriority: 50,
    text: FORMATTER_V2_INJECT_RESOLUTION_FILENAME,
    badgeIds: MONO_FILTER_ORDER.gr,
  },
  { id: "languages", field: "description", shardPriority: 38, text: FORMATTER_V2_INJECT_LANGUAGES, badgeIds: MONO_FILTER_ORDER.gl },
  {
    id: "specialFilename",
    field: "description",
    shardPriority: 40,
    text: FORMATTER_V2_INJECT_SPECIAL_FILENAME,
    badgeIds: SPECIAL_ONLY_IDS,
  },
  {
    id: "editionHueBw",
    field: "description",
    shardPriority: 68,
    text: FORMATTER_V2_INJECT_EDITION_HUE_BW,
    badgeIds: ["edition-true-hue", "edition-bw"],
  },
  { id: "message", field: "description", shardPriority: Infinity, text: MESSAGE_BLOCK },
];

/** Badge IDs whose formatter inject was dropped — use v1 regex at patch time. */
export const FORMATTER_SHARDED_BADGE_IDS = new Set();

/** @type {string[]} */
export let FORMATTER_SHARDED_SEGMENT_IDS = [];

/**
 * @param {object} [opts]
 * @param {number} [opts.maxLength]
 * @param {typeof FORMATTER_V2_SEGMENTS} [opts.segments]
 */
export function buildFormatterV2Layout(opts = {}) {
  const maxLength = opts.maxLength ?? FORMATTER_MAX_LENGTH;
  const segments = opts.segments ?? FORMATTER_V2_SEGMENTS;

  /** @type {Map<string, string>} */
  const placed = new Map();
  let nameLen = 0;
  let descLen = 0;

  const required = segments.filter((s) => s.shardPriority === Infinity);
  const optional = segments
    .filter((s) => s.shardPriority !== Infinity)
    .sort((a, b) => b.shardPriority - a.shardPriority);

  function tryPlace(seg, field) {
    const len = field === "name" ? nameLen : descLen;
    if (len + seg.text.length > maxLength) return false;
    if (field === "name") nameLen += seg.text.length;
    else descLen += seg.text.length;
    placed.set(seg.id, field);
    return true;
  }

  function place(seg) {
    if (placed.has(seg.id)) return true;
    if (tryPlace(seg, seg.field)) return true;
    const alt = seg.field === "name" ? "description" : "name";
    if (tryPlace(seg, alt)) return true;
    return false;
  }

  for (const seg of required) {
    if (!place(seg)) {
      throw new Error(`required segment ${seg.id} does not fit (${seg.text.length} chars)`);
    }
  }

  /** @type {string[]} */
  const sharded = [];
  for (const seg of optional) {
    if (!place(seg)) sharded.push(seg.id);
  }

  let name = "";
  let description = "";
  /** @type {Record<string, number>} */
  const breakdown = {};

  for (const seg of segments) {
    const field = placed.get(seg.id);
    if (!field) continue;
    breakdown[seg.id] = seg.text.length;
    if (field === "name") name += seg.text;
    else description += seg.text;
  }

  const len = { name: name.length, description: description.length, total: name.length + description.length };

  /** @type {Set<string>} */
  const shardedBadgeIds = new Set();
  /** @type {Map<string, string[]>} */
  const providersByBadge = new Map();
  for (const seg of segments) {
    for (const id of seg.badgeIds ?? []) {
      if (!providersByBadge.has(id)) providersByBadge.set(id, []);
      providersByBadge.get(id).push(seg.id);
    }
  }
  for (const [badgeId, providerIds] of providersByBadge) {
    const anyPlaced = providerIds.some((sid) => placed.has(sid));
    if (!anyPlaced) shardedBadgeIds.add(badgeId);
  }

  return {
    name,
    description,
    lengths: len,
    breakdown,
    shardedSegmentIds: sharded,
    shardedBadgeIds,
    withinBudget: len.name <= maxLength && len.description <= maxLength,
  };
}

const _layout = buildFormatterV2Layout();
FORMATTER_SHARDED_SEGMENT_IDS = _layout.shardedSegmentIds;
for (const id of _layout.shardedBadgeIds) FORMATTER_SHARDED_BADGE_IDS.add(id);

export const FORMATTER_V2_NAME = _layout.name;
export const FORMATTER_V2_INJECT_DESCRIPTION_TAIL =
  _layout.description.slice(
    FORMATTER_VISIBLE_DESCRIPTION.length,
    _layout.description.length - MESSAGE_BLOCK.length
  );
export const FORMATTER_V2_LAYOUT = _layout;

/**
 * @param {object} [parts]
 */
export function estimateV2FormatterLength(parts = {}) {
  if (!parts.name && !parts.descriptionTail && !parts.descriptionVisible && !parts.message) {
    return {
      name: _layout.lengths.name,
      descriptionVisible: FORMATTER_VISIBLE_DESCRIPTION.length,
      descriptionTail: FORMATTER_V2_INJECT_DESCRIPTION_TAIL.length,
      message: MESSAGE_BLOCK.length,
      total: _layout.lengths.total,
      shardedSegmentIds: _layout.shardedSegmentIds,
      withinBudget: _layout.withinBudget,
    };
  }
  const name = parts.name ?? FORMATTER_V2_NAME;
  const descriptionVisible = parts.descriptionVisible ?? FORMATTER_VISIBLE_DESCRIPTION;
  const descriptionTail = parts.descriptionTail ?? FORMATTER_V2_INJECT_DESCRIPTION_TAIL;
  const message = parts.message ?? MESSAGE_BLOCK;
  const description = descriptionVisible + descriptionTail + message;
  return {
    name: name.length,
    descriptionVisible: descriptionVisible.length,
    descriptionTail: descriptionTail.length,
    message: message.length,
    total: name.length + description.length,
    withinBudget:
      name.length <= FORMATTER_MAX_LENGTH && description.length <= FORMATTER_MAX_LENGTH,
  };
}

export { FORMATTER_MAX_LENGTH };
