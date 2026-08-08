/**
 * Local “Badge Sync Helper” — friendly UI + Vidhin tier-group sync API.
 * Run: npm run sync
 */
import fs from "fs/promises";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import {
  SOLID_BADGES_PATH,
  BADGE_SYNC_PATHS,
  MONO_BADGES_PATH,
  TRANSPARENT_BADGES_PATH,
  ROOT,
  syncTierGroupsFromVidhin,
  VIDHIN_REGEXES_URL,
  TIER_SYNC_TARGET,
  FORMATTER_JSON_PATH,
} from "./tier-group-sync.mjs";
import { pushAllGists } from "./gist-push.mjs";
import { githubToken, loadGistConfig, parseGistId, resolveGistTargets } from "./gist-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(ROOT, "sync-ui");
const CONFIG_PATH = path.join(UI_DIR, "user-config.json");
const PORT = Number(process.env.SYNC_PORT) || 3847;

const DEFAULT_CONFIG = {
  gistUrl: "",
  gistFilename: "kanso-solid.json",
  nuvioNotes: "",
  /** Groups to never auto-remove (strict sync). Case-insensitive. */
  neverRemoveGroups: [],
};

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function saveConfig(partial) {
  const next = { ...(await loadConfig()), ...partial };
  await fs.mkdir(UI_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n");
  return next;
}

function openBrowser(url) {
  const platform = process.platform;
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function mime(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

  try {
    if (url.pathname === "/api/status" && req.method === "GET") {
      const statSolid = await fs.stat(SOLID_BADGES_PATH).catch(() => null);
      const statTransparent = await fs.stat(TRANSPARENT_BADGES_PATH).catch(() => null);
      const statMono = await fs.stat(MONO_BADGES_PATH).catch(() => null);
      const statOracle = await fs.stat(TIER_SYNC_TARGET).catch(() => null);
      const statFormatter = await fs.stat(FORMATTER_JSON_PATH).catch(() => null);
      return json(res, 200, {
        ok: true,
        solidBadgesPath: SOLID_BADGES_PATH,
        badgesPath: SOLID_BADGES_PATH,
        badgesPaths: BADGE_SYNC_PATHS,
        transparentBadgesPath: TRANSPARENT_BADGES_PATH,
        monoBadgesPath: MONO_BADGES_PATH,
        badgesExists: Boolean(statSolid),
        badgesModified: statSolid?.mtime?.toISOString() ?? null,
        transparentBadgesExists: Boolean(statTransparent),
        transparentBadgesModified: statTransparent?.mtime?.toISOString() ?? null,
        monoBadgesExists: Boolean(statMono),
        monoBadgesModified: statMono?.mtime?.toISOString() ?? null,
        tierSyncTarget: TIER_SYNC_TARGET,
        tierSyncTargetExists: Boolean(statOracle),
        tierSyncTargetModified: statOracle?.mtime?.toISOString() ?? null,
        formatterJsonPath: FORMATTER_JSON_PATH,
        formatterJsonExists: Boolean(statFormatter),
        formatterJsonModified: statFormatter?.mtime?.toISOString() ?? null,
        vidhinUrl: VIDHIN_REGEXES_URL,
        config: await loadConfig(),
      });
    }

    if (url.pathname === "/api/config" && req.method === "GET") {
      return json(res, 200, await loadConfig());
    }

    if (url.pathname === "/api/config" && req.method === "POST") {
      const body = await readBody(req);
      const config = await saveConfig({
        gistUrl: typeof body.gistUrl === "string" ? body.gistUrl.trim() : undefined,
        gistFilename:
          typeof body.gistFilename === "string" ? body.gistFilename.trim() : undefined,
        nuvioNotes:
          typeof body.nuvioNotes === "string" ? body.nuvioNotes.trim() : undefined,
        neverRemoveGroups: Array.isArray(body.neverRemoveGroups)
          ? body.neverRemoveGroups.filter((g) => typeof g === "string" && g.trim())
          : undefined,
      });
      return json(res, 200, { ok: true, config });
    }

    if (url.pathname === "/api/preview" && req.method === "POST") {
      const body = await readBody(req);
      const config = await loadConfig();
      const result = await syncTierGroupsFromVidhin({
        dryRun: true,
        strict: body.strict === true,
        neverRemove: config.neverRemoveGroups ?? [],
      });
      return json(res, 200, { ok: true, result });
    }

    if (url.pathname === "/api/sync" && req.method === "POST") {
      const body = await readBody(req);
      const config = await loadConfig();
      const result = await syncTierGroupsFromVidhin({
        dryRun: body.dryRun === true,
        strict: body.strict === true,
        neverRemove: config.neverRemoveGroups ?? [],
        regenerate: body.dryRun !== true,
      });
      return json(res, 200, { ok: true, result });
    }

    if (url.pathname === "/api/formatter-json" && req.method === "GET") {
      const data = JSON.parse(await fs.readFile(FORMATTER_JSON_PATH, "utf8"));
      return json(res, 200, { ok: true, name: data.name, description: data.description });
    }

    if (url.pathname === "/api/badges-json" && req.method === "GET") {
      const which = url.searchParams.get("which") ?? "solid";
      const filePath =
        which === "mono"
          ? MONO_BADGES_PATH
          : which === "transparent"
            ? TRANSPARENT_BADGES_PATH
            : SOLID_BADGES_PATH;
      const raw = await fs.readFile(filePath, "utf8");
      return json(res, 200, { ok: true, which, content: raw });
    }

    if (url.pathname === "/api/push-gist" && req.method === "POST") {
      const body = await readBody(req);
      const dryRun = body.dryRun === true;
      try {
        const results = await pushAllGists({ dryRun });
        return json(res, 200, { ok: true, results });
      } catch (err) {
        return json(res, 500, {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (url.pathname === "/api/gist-status" && req.method === "GET") {
      const config = await loadGistConfig();
      const token = await githubToken();
      const targets = resolveGistTargets(config);
      const themes = ["solid", "transparent", "mono"].map((theme) => ({
        theme,
        url: targets[theme].url,
        gistId: parseGistId(targets[theme].url),
        filename: targets[theme].filename,
        canPush: Boolean(parseGistId(targets[theme].url) && token),
      }));
      return json(res, 200, {
        ok: true,
        hasToken: Boolean(token),
        canPush: themes.some((t) => t.canPush),
        themes,
      });
    }

    if (url.pathname === "/api/reveal" && req.method === "POST") {
      if (process.platform === "win32") {
        exec(`explorer /select,"${FORMATTER_JSON_PATH}"`, () => {});
      } else if (process.platform === "darwin") {
        exec(`open -R "${FORMATTER_JSON_PATH}"`, () => {});
      }
      return json(res, 200, { ok: true });
    }

    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
    const abs = path.join(UI_DIR, filePath);
    if (!abs.startsWith(UI_DIR)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    const data = await fs.readFile(abs);
    res.writeHead(200, { "Content-Type": mime(abs) });
    res.end(data);
  } catch (err) {
    console.error(err);
    json(res, 500, {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const home = `http://127.0.0.1:${PORT}/`;
  console.log("");
  console.log("  Badge Sync Helper is running");
  console.log(`  Open in your browser: ${home}`);
  console.log("");
  console.log("  Press Ctrl+C to stop.");
  console.log("");
  openBrowser(home);
});
