/**
 * Patch Nuvio badge JSON — shared filter order, streaming, patterns, icons, theme.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  applyFilterMeta,
  LANGUAGE_FILTER_META,
} from "./badge-filter-meta.mjs";
import { LANGUAGE_BADGE_PATTERNS } from "./language-patterns.mjs";
import {
  MONO_FILTER_ORDER,
  MONO_GROUP_ORDER,
  MONO_GROUP_META as TRANSPARENT_GROUP_META,
} from "./badge-transparent-theme.mjs";
import { applyUnrankedPatternFixes } from "./tier-patterns.mjs";
import { GENERATED_ICON_IDS } from "./external-icons.mjs";
import {
  createEditionFilter,
  EDITION_BADGE_IDS,
  EDITION_BADGES,
} from "./edition-badges.mjs";
import {
  createStreamingFilter,
  STREAMING_BADGES,
} from "./streaming-badges.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const KINGSIZE_ICONS_MANIFEST_PATH = path.join(ROOT, "badges", "kingsizew-icons.json");
export const SOLID_BADGES_PATH = path.join(ROOT, "kanso-solid.json");
export const TRANSPARENT_BADGES_PATH = path.join(
  ROOT,
  "kanso-transparent.json"
);
export const MONO_BADGES_PATH = path.join(ROOT, "kanso-mono.json");
export const BADGE_SYNC_PATHS = [
  SOLID_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
  MONO_BADGES_PATH,
];
export const TRANSPARENT_ICONS_MANIFEST_PATH = path.join(
  ROOT,
  "badges",
  "icons-urls-transparent.json"
);
export const SOLID_ICONS_MANIFEST_PATH = path.join(
  ROOT,
  "badges",
  "icons-urls-solid.json"
);
export const BASE_ICONS_MANIFEST_PATH = path.join(ROOT, "badges", "icons-urls.json");
/** @deprecated Use SOLID_BADGES_PATH */
export const BADGES_PATH = SOLID_BADGES_PATH;
/** @deprecated Use TRANSPARENT_ICONS_MANIFEST_PATH */
export const ICONS_MANIFEST_PATH = TRANSPARENT_ICONS_MANIFEST_PATH;

const REMOVED_FILTER_IDS = new Set([
  "co-mkv",
  "co-mp4",
  "bd-10bit",
  "bd-8bit",
  "e-h265",
  "e-h264",
  "e-av1",
  "e-vp9",
  "e-xvid",
  "l-pt",
  "a-at-dv",
  "a-th-dv",
  "a-dp-dv",
  "a-dd-dv",
  "v-at-dv",
]);
const REMOVED_GROUP_IDS = new Set(["gco", "gbd", "ge"]);

function sortFilters(filters) {
  const byId = Object.fromEntries(filters.map((f) => [f.id, f]));
  const sorted = [];

  for (const groupId of MONO_GROUP_ORDER) {
    const order = MONO_FILTER_ORDER[groupId];
    if (!order) continue;
    for (const id of order) {
      if (byId[id]) {
        sorted.push(byId[id]);
        delete byId[id];
      }
    }
  }

  for (const remaining of Object.values(byId)) {
    sorted.push(remaining);
  }
  return sorted;
}

function buildGroups(existing, groupMeta) {
  const byId = Object.fromEntries((existing ?? []).map((g) => [g.id, g]));
  return MONO_GROUP_ORDER.map((id) => {
    const meta = groupMeta[id];
    const prev = byId[id];
    return {
      id,
      name: meta.name,
      color: meta.color,
      borderColor: meta.borderColor,
      isExpanded: prev?.isExpanded ?? true,
    };
  });
}

function migrateFilters(filters) {
  const kept = filters.filter(
    (f) => !REMOVED_FILTER_IDS.has(f.id) && !REMOVED_GROUP_IDS.has(f.groupId)
  );
  const byId = Object.fromEntries(kept.map((f) => [f.id, f]));

  for (const id of MONO_FILTER_ORDER.gl) {
    if (!byId[id] && LANGUAGE_BADGE_PATTERNS[id]) {
      byId[id] = {
        id,
        groupId: "gl",
        type: "filter",
        isEnabled: true,
        name: LANGUAGE_FILTER_META[id] ?? id,
        pattern: LANGUAGE_BADGE_PATTERNS[id],
        imageURL: "",
      };
    }
  }

  for (const groupId of Object.keys(MONO_FILTER_ORDER)) {
    for (const id of MONO_FILTER_ORDER[groupId]) {
      if (!byId[id]) {
        byId[id] = {
          id,
          groupId,
          type: "filter",
          isEnabled: true,
          name: id,
          pattern: "",
          imageURL: "",
        };
      }
    }
  }

  for (const groupId of Object.keys(MONO_FILTER_ORDER)) {
    for (const id of MONO_FILTER_ORDER[groupId]) {
      if (byId[id]) byId[id].groupId = groupId;
    }
  }

  /** Filters listed only once — canonical group when ids must not inherit gv from sort. */
  const GROUP_OVERRIDES = {
    "a-dv": "gv",
  };
  for (const [id, groupId] of Object.entries(GROUP_OVERRIDES)) {
    if (byId[id]) byId[id].groupId = groupId;
  }

  return Object.values(byId);
}

/**
 * @param {object} opts
 * @param {string} opts.badgesPath output JSON path
 * @param {(filter: object) => object} opts.applyTheme
 * @param {Record<string, string>} [opts.groupMeta] defaults to MONO_GROUP_META
 * @param {string} [opts.iconsManifestPath]
 * @param {string} [opts.templatePath] optional JSON to copy filter skeleton from
 */
export async function patchBadgeFile(opts) {
  const {
    badgesPath,
    applyTheme,
    groupMeta = TRANSPARENT_GROUP_META,
    iconsManifestPath = ICONS_MANIFEST_PATH,
    templatePath,
  } = opts;

  let iconUrls = {};
  try {
    iconUrls = JSON.parse(await fs.readFile(iconsManifestPath, "utf8"));
  } catch {
    /* empty */
  }

  try {
    const kingsize = JSON.parse(await fs.readFile(KINGSIZE_ICONS_MANIFEST_PATH, "utf8"));
    Object.assign(iconUrls, kingsize);
  } catch {
    /* optional */
  }

  try {
    const base = JSON.parse(await fs.readFile(BASE_ICONS_MANIFEST_PATH, "utf8"));
    for (const id of GENERATED_ICON_IDS) {
      if (!iconUrls[id] && base[id]) iconUrls[id] = base[id];
    }
  } catch {
    /* optional */
  }

  /** Solid: full-color streaming + white edition art — never mono-transparent streaming. */
  if (iconsManifestPath === SOLID_ICONS_MANIFEST_PATH) {
    for (const def of STREAMING_BADGES) {
      if (iconUrls[def.id]?.includes("je19921")) continue;
      if (!iconUrls[def.id]?.startsWith("http")) {
        iconUrls[def.id] = def.imageURL;
      }
    }
    try {
      const transparent = JSON.parse(
        await fs.readFile(TRANSPARENT_ICONS_MANIFEST_PATH, "utf8")
      );
      for (const id of EDITION_BADGE_IDS) {
        if (transparent[id]) iconUrls[id] = transparent[id];
      }
      for (const id of MONO_FILTER_ORDER.gl) {
        if (transparent[id]) iconUrls[id] = transparent[id];
      }
    } catch {
      /* optional */
    }
  }

  try {
    const kingsizeFinal = JSON.parse(
      await fs.readFile(KINGSIZE_ICONS_MANIFEST_PATH, "utf8")
    );
    Object.assign(iconUrls, kingsizeFinal);
  } catch {
    /* optional */
  }

  const loadPath = templatePath ?? badgesPath;
  let data;
  try {
    data = JSON.parse(await fs.readFile(loadPath, "utf8"));
  } catch {
    data = { filters: [], groups: [] };
  }

  // A production v2 pack may be passed back through a theme/icon patch command.
  // Keep its marker-only patterns: applyFilterMeta contains the legacy v1 regex
  // oracle and must not silently turn a shipped pack into a split-brain hybrid.
  const markerOnlyPatterns = new Map(
    (data.filters ?? [])
      .filter((f) => f.pattern?.startsWith("(?s)^"))
      .map((f) => [f.id, f.pattern])
  );

  const byId = Object.fromEntries(migrateFilters(data.filters).map((f) => [f.id, f]));

  for (const def of STREAMING_BADGES) {
    const existing = byId[def.id];
    if (existing) {
      existing.name = def.name;
      existing.pattern = def.pattern;
      existing.groupId = "gs";
    } else {
      byId[def.id] = createStreamingFilter(def);
    }
  }

  for (const def of EDITION_BADGES) {
    const existing = byId[def.id];
    const icon = iconUrls[def.id];
    if (existing) {
      existing.name = def.name;
      existing.pattern = def.pattern;
      existing.groupId = "gst";
      if (icon) existing.imageURL = icon;
    } else {
      byId[def.id] = createEditionFilter({ ...def, imageURL: icon ?? "" });
    }
  }

  const iconBase = process.env.ICON_BASE_URL?.replace(/\/$/, "") ?? "";

  const filters = sortFilters(
    applyUnrankedPatternFixes(
      Object.values(byId).map((filter) => {
        const withMeta = applyFilterMeta({ ...filter });
        if (markerOnlyPatterns.has(filter.id)) {
          withMeta.pattern = markerOnlyPatterns.get(filter.id);
        }
        const themed = applyTheme(withMeta);
        const icon = iconUrls[filter.id];
        if (icon) {
          let url = icon;
          if (iconBase && url.startsWith("badges/")) {
            url = `${iconBase}/${url.replace(/^badges\//, "")}`;
          }
          themed.imageURL = url;
        }
        return themed;
      })
    )
  );

  data.filters = filters;
  data.groups = buildGroups(data.groups, groupMeta);

  await fs.writeFile(badgesPath, JSON.stringify(data, null, 2) + "\n");

  const missingIcons = filters.filter((f) => !f.imageURL).map((f) => f.id);
  return {
    badgesPath,
    filterCount: filters.length,
    groupCount: data.groups.length,
    missingIcons,
    iconCount: Object.keys(iconUrls).length,
  };
}
