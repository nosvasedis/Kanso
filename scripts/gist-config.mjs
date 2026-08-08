/**
 * Gist push settings — URLs + filenames from sync-ui/user-config.json; token from env only.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT } from "./badge-patch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONFIG_PATH = path.join(ROOT, "sync-ui", "user-config.json");

/** @typedef {"solid"|"transparent"|"mono"} BadgeGistTheme */

export const BADGE_GIST_DEFAULTS = {
  solid: {
    url: "https://gist.github.com/nosvasedis/7abd79424bb8981b511838524c52f097",
    filename: "kanso-solid.json",
  },
  transparent: {
    url: "https://gist.github.com/nosvasedis/63b769d205bddbbef79faf8beef53c28",
    filename: "kanso-transparent.json",
  },
  mono: {
    url: "https://gist.github.com/nosvasedis/1858e332fef11d136f76c697ea6c7439",
    filename: "kanso-mono.json",
  },
};

const DEFAULT_CONFIG = {
  /** @deprecated use gists.solid.url */
  gistUrl: "",
  /** @deprecated use gists.solid.filename */
  gistFilename: BADGE_GIST_DEFAULTS.solid.filename,
  gists: BADGE_GIST_DEFAULTS,
  nuvioNotes: "",
  neverRemoveGroups: [],
};

let dotEnvLoaded = false;

/** Load `.env` from project root into process.env (does not override existing env). */
export async function loadDotEnv() {
  if (dotEnvLoaded) return;
  dotEnvLoaded = true;
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env) || process.env[key] === "") {
        process.env[key] = val;
      }
    }
  } catch {
    /* no .env */
  }
}

/** @param {string} gistUrl */
export function parseGistId(gistUrl) {
  if (!gistUrl?.trim()) return null;
  const match = gistUrl.trim().match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]+)/i);
  return match?.[1] ?? null;
}

export async function loadGistConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** @param {Record<string, unknown>} config */
export function resolveGistTargets(config) {
  const gists = config.gists && typeof config.gists === "object" ? config.gists : {};
  /** @param {BadgeGistTheme} theme */
  const pick = (theme) => {
    const entry = gists[theme];
    const defaults = BADGE_GIST_DEFAULTS[theme];
    const legacyUrl = theme === "solid" ? config.gistUrl : "";
    const legacyFilename = theme === "solid" ? config.gistFilename : "";
    return {
      url: (entry?.url || legacyUrl || defaults.url || "").trim(),
      filename: (entry?.filename || legacyFilename || defaults.filename || "").trim(),
    };
  };
  return {
    solid: pick("solid"),
    transparent: pick("transparent"),
    mono: pick("mono"),
  };
}

export async function githubToken() {
  await loadDotEnv();
  return process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || "";
}
