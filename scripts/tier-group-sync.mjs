/**
 * Merge Vidhin Releases-Regex tier group lists into Nuvio badge tier patterns.
 * Default: add missing groups only. Strict mode: mirror Vidhin’s list per tier (with removals).
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import { applyUnrankedPatternFixes } from "./tier-patterns.mjs";
import {
  SOLID_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
  MONO_BADGES_PATH,
  BADGE_SYNC_PATHS,
} from "./badge-patch.mjs";
import { V1_SOLID_BADGES_PATH } from "./v1-badge-oracle.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
const execFileAsync = promisify(execFile);

/**
 * Tier group lists are synced into the v1 oracle snapshot (the source of truth
 * for tier inject). V2 badge JSONs use marker-only patterns (no group lists),
 * so syncing them is what caused “Could not read release-group list from
 * pattern (unexpected shape).”
 */
export const TIER_SYNC_TARGET = V1_SOLID_BADGES_PATH;
export const FORMATTER_JSON_PATH = path.join(ROOT, "formatter.json");
export {
  SOLID_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
  MONO_BADGES_PATH,
  BADGE_SYNC_PATHS,
};
/** @deprecated Use SOLID_BADGES_PATH */
export const BADGES_PATH = SOLID_BADGES_PATH;
export const VIDHIN_REGEXES_URL =
  "https://raw.githubusercontent.com/Vidhin05/Releases-Regex/main/English/regexes.json";

/** Tier filters we sync (unranked patterns are rebuilt automatically). */
export const SYNC_TIER_IDS = [
  "web-1",
  "web-2",
  "web-3",
  "web-4",
  "web-5",
  "web-6",
  "blu-ray-1",
  "blu-ray-2",
  "blu-ray-3",
  "blu-ray-4",
  "blu-ray-5",
  "blu-ray-6",
  "blu-ray-7",
  "blu-ray-8",
  "remux-1",
  "remux-2",
  "remux-3",
];

const BRACKET_GROUP_MARKER = "(?:^\\[(?:";

/** @param {string} pattern */
export function extractBadgeTierGroups(pattern) {
  const idx = pattern.indexOf(BRACKET_GROUP_MARKER);
  if (idx === -1) return null;
  const start = idx + BRACKET_GROUP_MARKER.length;
  const close = pattern.indexOf(")\\]", start);
  if (close === -1) return null;
  return pattern.slice(start, close).split("|").filter(Boolean);
}

/** @param {string} pattern @param {string[]} oldGroups @param {string[]} newGroups */
export function replaceBadgeTierGroups(pattern, oldGroups, newGroups) {
  const oldAlt = oldGroups.join("|");
  const newAlt = newGroups.join("|");
  if (oldAlt === newAlt) return pattern;
  if (!oldAlt) return pattern;
  return pattern.split(oldAlt).join(newAlt);
}

/** @param {string} vidhinPattern Vidhin rule pattern string */
export function extractVidhinGroups(vidhinPattern) {
  let inner = vidhinPattern;
  if (inner.startsWith("/")) {
    inner = inner.slice(1);
    const end = inner.lastIndexOf("/");
    if (end > 0) inner = inner.slice(0, end);
  }

  const groups = new Set();
  const re = /\\b\((?:\?:)?([^)]+)\)\\b/g;
  let m;
  while ((m = re.exec(inner)) !== null) {
    for (const part of m[1].split("|")) {
      const g = part.trim();
      if (g && /^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(g)) groups.add(g);
    }
  }
  return [...groups];
}

/**
 * Map a Vidhin rule name to our badge id, or null if not a tier rule.
 * @param {string} name
 */
export function vidhinNameToBadgeId(name) {
  let m = name.match(/^Radarr Web T(\d+)$/i);
  if (m) return `web-${m[1]}`;
  m = name.match(/^Sonarr Web T(\d+)$/i);
  if (m) return `web-${m[1]}`;
  m = name.match(/^Web T(\d+)$/i);
  if (m) return `web-${m[1]}`;

  m = name.match(/^Radarr (?:UHD |HD )?Bluray T(\d+)$/i);
  if (m) return `blu-ray-${m[1]}`;
  m = name.match(/^Sonarr (?:UHD |HD )?Bluray T(\d+)$/i);
  if (m) return `blu-ray-${m[1]}`;

  m = name.match(/^Radarr Remux T(\d+)$/i);
  if (m) return `remux-${m[1]}`;
  m = name.match(/^Sonarr Remux T(\d+)$/i);
  if (m) return `remux-${m[1]}`;

  return null;
}

/** @param {Array<{ name: string, pattern: string }>} vidhinRules */
export function buildVidhinGroupsByBadge(vidhinRules) {
  /** @type {Record<string, Set<string>>} */
  const byBadge = {};

  for (const rule of vidhinRules) {
    const badgeId = vidhinNameToBadgeId(rule.name);
    if (!badgeId || !SYNC_TIER_IDS.includes(badgeId)) continue;
    if (!byBadge[badgeId]) byBadge[badgeId] = new Set();
    for (const g of extractVidhinGroups(rule.pattern)) {
      byBadge[badgeId].add(g);
    }
  }

  const out = {};
  for (const id of SYNC_TIER_IDS) {
    out[id] = [...(byBadge[id] ?? [])];
  }
  return out;
}

function sortGroups(groups) {
  return [...groups].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

/**
 * @param {string[]} local
 * @param {string[]} vidhin
 * @param {{ strict?: boolean, neverRemove?: string[] }} [opts]
 */
export function mergeGroupLists(local, vidhin, opts = {}) {
  const strict = opts.strict ?? false;
  const neverRemove = new Set((opts.neverRemove ?? []).map((g) => g.toLowerCase()));

  const localByKey = new Map();
  for (const g of local) localByKey.set(g.toLowerCase(), g);

  const vidhinByKey = new Map();
  for (const g of vidhin) vidhinByKey.set(g.toLowerCase(), g);

  const added = [];
  for (const g of vidhin) {
    if (!localByKey.has(g.toLowerCase())) added.push(g);
  }

  const removed = [];
  for (const g of local) {
    const key = g.toLowerCase();
    if (!vidhinByKey.has(key) && !neverRemove.has(key)) removed.push(g);
  }

  const onlyLocal = local.filter((g) => !vidhinByKey.has(g.toLowerCase()));

  let merged;
  if (strict) {
    merged = sortGroups([...vidhinByKey.values()]);
    for (const g of local) {
      const key = g.toLowerCase();
      if (neverRemove.has(key) && !vidhinByKey.has(key)) {
        merged.push(g);
      }
    }
    merged = sortGroups(merged);
  } else {
    const byKey = new Map(localByKey);
    for (const g of vidhin) {
      const key = g.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, g);
    }
    merged = sortGroups([...byKey.values()]);
  }

  return {
    merged,
    added,
    removed: strict ? removed : [],
    onlyLocal,
    strict,
  };
}

export async function fetchVidhinRegexes(url = VIDHIN_REGEXES_URL) {
  const res = await fetch(url, {
    headers: { "User-Agent": "nosvasedis-formatter-sync/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Could not download Vidhin regexes (${res.status} ${res.statusText})`);
  }
  return /** @type {Array<{ name: string, pattern: string }>} */ (await res.json());
}

/**
 * Rebuild formatter.json from the freshly synced tier groups.
 * Runs scripts/patch-formatter.mjs in a fresh process so the module-level tier
 * inject constants pick up the updated oracle.
 */
export async function regenerateFormatterAfterTierSync() {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [path.join(__dirname, "patch-formatter.mjs")],
    { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }
  );
  return { ok: true, stdout, stderr };
}

/**
 * @param {object} opts
 * @param {boolean} [opts.dryRun]
 * @param {boolean} [opts.strict] When true, drop groups Vidhin no longer lists for each tier.
 * @param {string[]} [opts.neverRemove] Group names to keep even in strict mode (case-insensitive).
 * @param {string} [opts.badgesPath] single file (legacy)
 * @param {string[]} [opts.badgesPaths] defaults to the v1 oracle snapshot (TIER_SYNC_TARGET)
 * @param {Array<{ name: string, pattern: string }>} [opts.vidhinRules]
 * @param {boolean} [opts.regenerate] Rebuild formatter.json after a successful sync (default true).
 */
export async function syncTierGroupsFromVidhin(opts = {}) {
  const dryRun = opts.dryRun ?? false;
  const strict = opts.strict ?? false;
  const neverRemove = opts.neverRemove ?? [];
  const regenerate = opts.regenerate ?? true;
  const badgesPaths = opts.badgesPaths ??
    (opts.badgesPath ? [opts.badgesPath] : [TIER_SYNC_TARGET]);
  const vidhinRules =
    opts.vidhinRules ?? (await fetchVidhinRegexes());

  const fileResults = [];
  let anyChanged = false;
  let totalAdded = 0;
  let totalRemoved = 0;
  let tiersTouched = 0;

  for (const badgesPath of badgesPaths) {
    const one = await syncTierGroupsInFile(badgesPath, {
      dryRun,
      strict,
      neverRemove,
      vidhinRules,
    });
    fileResults.push(one);
    if (one.anyChanged) anyChanged = true;
    totalAdded += one.totalAdded;
    totalRemoved += one.totalRemoved;
    tiersTouched += one.tiersTouched;
  }

  let formatterRegenerated = false;
  let formatterOutput = "";
  if (anyChanged && !dryRun && regenerate) {
    try {
      const res = await regenerateFormatterAfterTierSync();
      formatterRegenerated = true;
      formatterOutput = (res.stdout + "\n" + res.stderr).trim();
    } catch (err) {
      formatterOutput =
        "formatter.json regeneration failed: " +
        (err instanceof Error ? err.message : String(err));
    }
  }

  return {
    dryRun,
    strict,
    anyChanged,
    totalAdded,
    totalRemoved,
    tiersTouched,
    tierResults: fileResults[0]?.tierResults ?? [],
    fileResults,
    badgesPath: badgesPaths[0],
    badgesPaths,
    vidhinRuleCount: vidhinRules.length,
    updatedAt: new Date().toISOString(),
    formatterRegenerated,
    formatterOutput,
  };
}

/**
 * @param {string} badgesPath
 * @param {object} opts
 */
async function syncTierGroupsInFile(badgesPath, opts) {
  const { dryRun, strict, neverRemove, vidhinRules } = opts;

  const raw = await fs.readFile(badgesPath, "utf8");
  const data = JSON.parse(raw);
  const vidhinByBadge = buildVidhinGroupsByBadge(vidhinRules);

  /** @type {Array<{
   *   badgeId: string,
   *   name: string,
   *   changed: boolean,
   *   added: string[],
   *   removed: string[],
   *   onlyLocal: string[],
   *   skipped?: boolean,
   *   localCount: number,
   *   mergedCount: number,
   *   vidhinCount: number,
   * }>} */
  const tierResults = [];
  let anyChanged = false;

  for (const filter of data.filters) {
    if (!SYNC_TIER_IDS.includes(filter.id)) continue;

    const local = extractBadgeTierGroups(filter.pattern);
    if (!local) {
      tierResults.push({
        badgeId: filter.id,
        name: filter.name ?? filter.id,
        changed: false,
        added: [],
        removed: [],
        onlyLocal: [],
        localCount: 0,
        mergedCount: 0,
        vidhinCount: (vidhinByBadge[filter.id] ?? []).length,
        error: "Could not read release-group list from pattern (unexpected shape).",
      });
      continue;
    }

    const vidhin = vidhinByBadge[filter.id] ?? [];

    if (strict && vidhin.length === 0) {
      tierResults.push({
        badgeId: filter.id,
        name: filter.name ?? filter.id,
        changed: false,
        added: [],
        removed: [],
        onlyLocal: local.filter(
          (g) => !neverRemove.some((k) => k.toLowerCase() === g.toLowerCase())
        ),
        skipped: true,
        skipReason:
          "Vidhin has no release groups for this tier — skipped so your list is not wiped.",
        localCount: local.length,
        mergedCount: local.length,
        vidhinCount: 0,
      });
      continue;
    }

    const { merged, added, removed, onlyLocal } = mergeGroupLists(local, vidhin, {
      strict,
      neverRemove,
    });
    const changed =
      added.length > 0 ||
      removed.length > 0 ||
      merged.join("|") !== sortGroups(local).join("|");

    if (changed) {
      filter.pattern = replaceBadgeTierGroups(filter.pattern, local, merged);
      anyChanged = true;
    }

    tierResults.push({
      badgeId: filter.id,
      name: filter.name ?? filter.id,
      changed,
      added,
      removed,
      onlyLocal,
      localCount: local.length,
      mergedCount: merged.length,
      vidhinCount: vidhin.length,
    });
  }

  if (anyChanged && !dryRun) {
    data.filters = applyUnrankedPatternFixes(data.filters);
    await fs.writeFile(badgesPath, JSON.stringify(data, null, 2) + "\n");
  } else if (anyChanged && dryRun) {
    data.filters = applyUnrankedPatternFixes(data.filters);
  }

  const totalAdded = tierResults.reduce((n, r) => n + (r.added?.length ?? 0), 0);
  const totalRemoved = tierResults.reduce((n, r) => n + (r.removed?.length ?? 0), 0);
  const tiersTouched = tierResults.filter((r) => r.changed).length;

  return {
    badgesPath,
    anyChanged,
    totalAdded,
    totalRemoved,
    tiersTouched,
    tierResults,
  };
}
