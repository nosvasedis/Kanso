#!/usr/bin/env node
/**
 * Push badge JSON to all configured GitHub Gists (solid + transparent + mono).
 */
import { pushAllGists, pushGist } from "./gist-push.mjs";
import { githubToken, loadGistConfig, parseGistId, resolveGistTargets } from "./gist-config.mjs";

const dryRun = process.argv.includes("--dry-run");
const requirePush = process.argv.includes("--require");
const themeArg = process.argv.find((a) => ["solid", "transparent", "mono"].includes(a));
const themes = themeArg ? [themeArg] : ["solid", "transparent", "mono"];

try {
  const config = await loadGistConfig();
  const targets = resolveGistTargets(config);
  const missing = themes.filter((t) => !parseGistId(targets[t].url));
  if (missing.length === themes.length) {
    console.error("No gist URLs configured — check sync-ui/user-config.json");
    process.exit(requirePush ? 1 : 0);
  }

  const token = await githubToken();
  if (!token && !dryRun) {
    console.error(
      "GITHUB_TOKEN not set. Create a token with gist scope, copy .env.example to .env, and paste the token."
    );
    process.exit(requirePush ? 1 : 0);
  }

  const results = themeArg
    ? [await pushGist(themeArg, { dryRun })]
    : await pushAllGists({ dryRun, themes });

  let failures = 0;
  for (const result of results) {
    if (result.skipped) {
      if (result.reason === "no_badges_file") {
        console.error(`${result.theme}: missing badge JSON — run patch-badges first.`);
        failures++;
      } else if (result.reason === "no_gist_url") {
        console.warn(`${result.theme}: no gist URL configured — skipped.`);
      } else if (result.reason === "no_token") {
        failures++;
      }
      continue;
    }
    if (result.dryRun) {
      console.log(
        `${result.theme}: dry run — ${result.bytes} bytes → gist ${result.gistId} (${result.filename})`
      );
      continue;
    }
    if (result.ok) {
      console.log(`${result.theme} gist updated: ${result.htmlUrl}`);
      console.log(`  ${result.filename} (${result.bytes} bytes, ${result.updatedAt})`);
    }
  }

  process.exit(failures && requirePush ? 1 : 0);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
