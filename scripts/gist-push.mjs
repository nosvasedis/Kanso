/**
 * Push badge JSON files to configured GitHub Gists (GitHub REST API).
 */
import fs from "fs/promises";
import {
  MONO_BADGES_PATH,
  SOLID_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
} from "./badge-patch.mjs";
import {
  githubToken,
  loadGistConfig,
  parseGistId,
  resolveGistTargets,
} from "./gist-config.mjs";

/** @typedef {"solid"|"transparent"|"mono"} BadgeGistTheme */

const BADGE_PATHS = {
  solid: SOLID_BADGES_PATH,
  transparent: TRANSPARENT_BADGES_PATH,
  mono: MONO_BADGES_PATH,
};

const THEMES = /** @type {const} */ (["solid", "transparent", "mono"]);

/**
 * @param {BadgeGistTheme} theme
 * @param {{ dryRun?: boolean }} [options]
 */
export async function pushGist(theme, options = {}) {
  const config = await loadGistConfig();
  const targets = resolveGistTargets(config);
  const target = targets[theme];
  const gistId = parseGistId(target.url);
  if (!gistId) {
    return { skipped: true, reason: "no_gist_url", theme };
  }

  const token = await githubToken();
  if (!token && !options.dryRun) {
    return { skipped: true, reason: "no_token", theme };
  }

  let content;
  try {
    content = await fs.readFile(BADGE_PATHS[theme], "utf8");
  } catch {
    return { skipped: true, reason: "no_badges_file", theme };
  }

  const filename = target.filename;
  if (!filename) {
    return { skipped: true, reason: "no_filename", theme };
  }

  /** Legacy gist filenames to remove when renaming to kanso-*.json */
  const LEGACY_GIST_FILES = {
    solid: ["solid-nosvasedis-badges-nuvio", "nosvasedis-badges-solid.json"],
    transparent: [
      "transparent-nosvasedis-badges-nuvio",
      "nosvasedis-badges-transparent.json",
    ],
    mono: ["mono-nosvasedis-badges-nuvio", "nosvasedis-badges-mono.json"],
  };

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      theme,
      gistId,
      filename,
      bytes: Buffer.byteLength(content, "utf8"),
    };
  }

  /** @type {Record<string, { content?: string } | null>} */
  const files = {
    [filename]: { content },
  };

  // Only delete legacy filenames that actually exist on the gist (nulling missing → 422).
  const metaRes = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "kanso-gist-push",
    },
  });
  if (metaRes.ok) {
    const meta = await metaRes.json();
    const existing = new Set(Object.keys(meta.files || {}));
    for (const legacy of LEGACY_GIST_FILES[theme] ?? []) {
      if (legacy !== filename && existing.has(legacy)) files[legacy] = null;
    }
  }

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "kanso-gist-push",
    },
    body: JSON.stringify({
      description: `Kanso ${theme} badges for Nuvio — No echo. Every detail once.`,
      files,
    }),
  });

  if (!res.ok) {
    let detail = await res.text();
    try {
      const parsed = JSON.parse(detail);
      detail = parsed.message || detail;
    } catch {
      /* raw */
    }
    throw new Error(`${theme} gist push failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return {
    ok: true,
    theme,
    gistId,
    filename,
    htmlUrl: data.html_url,
    updatedAt: data.updated_at,
    bytes: Buffer.byteLength(content, "utf8"),
  };
}

/**
 * @param {{ dryRun?: boolean; themes?: BadgeGistTheme[] }} [options]
 */
export async function pushAllGists(options = {}) {
  const themes = options.themes ?? THEMES;
  const results = [];
  for (const theme of themes) {
    results.push(await pushGist(theme, options));
  }
  return results;
}

/** Called after a badge patch — pushes the matching gist when configured. */
export async function pushGistAfterPatch(theme) {
  const config = await loadGistConfig();
  const targets = resolveGistTargets(config);
  const gistId = parseGistId(targets[theme].url);
  if (!gistId) return { skipped: true, reason: "no_gist_url", theme };

  try {
    const result = await pushGist(theme);
    if (result.skipped && result.reason === "no_token") {
      console.log(
        `${theme} gist not pushed: add GITHUB_TOKEN to .env — npm run push-gist`
      );
      return result;
    }
    if (result.ok) {
      console.log(`${theme} gist updated: ${result.htmlUrl}`);
    }
    return result;
  } catch (err) {
    console.error(
      `${theme} gist push failed: ${err instanceof Error ? err.message : err}`
    );
    return { ok: false, theme, error: err instanceof Error ? err.message : String(err) };
  }
}
