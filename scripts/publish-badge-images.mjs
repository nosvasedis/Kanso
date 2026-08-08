#!/usr/bin/env node
/**
 * Publish badges/badge-images/files to the public GitHub repo nosvasedis/Kanso
 * (keeps /files at repo root for stable raw CDN URLs).
 *
 * Requires `gh` auth with repo scope.
 *
 * Usage:
 *   node scripts/publish-badge-images.mjs
 *   node scripts/publish-badge-images.mjs --dry-run
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  BADGE_IMAGES_DIR,
  ICON_CDN_OWNER,
  ICON_CDN_REPO,
  iconCdnBase,
} from "./icon-cdn.mjs";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      ...opts,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
      process.stdout.write(d);
    });
    child.stderr.on("data", (d) => {
      stderr += d;
      process.stderr.write(d);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else
        reject(
          new Error(
            `${cmd} ${args.join(" ")} exited ${code}\n${stderr || stdout}`
          )
        );
    });
  });
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!(await pathExists(path.join(BADGE_IMAGES_DIR, "files")))) {
    throw new Error(
      "Missing badges/badge-images/files — run materialize-badge-images.mjs first"
    );
  }

  const files = await fs.readdir(path.join(BADGE_IMAGES_DIR, "files"));
  console.log(
    `publish-badge-images: ${files.length} PNGs → ${ICON_CDN_OWNER}/${ICON_CDN_REPO}`
  );
  console.log(`CDN base: ${iconCdnBase()}`);
  if (dryRun) {
    console.log("dry-run: skipping gh/git");
    return;
  }

  // Ensure repo exists (public)
  let repoExists = true;
  try {
    await run("gh", [
      "repo",
      "view",
      `${ICON_CDN_OWNER}/${ICON_CDN_REPO}`,
      "--json",
      "name",
    ]);
  } catch {
    repoExists = false;
  }
  if (!repoExists) {
    console.log("Creating public repo…");
    await run("gh", [
      "repo",
      "create",
      `${ICON_CDN_OWNER}/${ICON_CDN_REPO}`,
      "--public",
      "--description",
      "Kanso — clean Nuvio stream marks + Instant formatter (icons under /files)",
      "--clone=false",
    ]);
  }

  const work = path.join(BADGE_IMAGES_DIR, ".publish-worktree");
  await fs.rm(work, { recursive: true, force: true });
  await fs.mkdir(work, { recursive: true });

  // Clone shallow (or init + remote if empty clone fails)
  try {
    await run("gh", [
      "repo",
      "clone",
      `${ICON_CDN_OWNER}/${ICON_CDN_REPO}`,
      work,
      "--",
      "--depth=1",
    ]);
  } catch {
    await run("git", ["init"], { cwd: work });
    await run(
      "git",
      [
        "remote",
        "add",
        "origin",
        `https://github.com/${ICON_CDN_OWNER}/${ICON_CDN_REPO}.git`,
      ],
      { cwd: work }
    );
  }

  // Clear tracked content except .git
  for (const name of await fs.readdir(work)) {
    if (name === ".git") continue;
    await fs.rm(path.join(work, name), { recursive: true, force: true });
  }

  // Copy files + README + slim manifest (no giant sourceUrl map needed remotely,
  // but include themes for debugging)
  await fs.cp(path.join(BADGE_IMAGES_DIR, "files"), path.join(work, "files"), {
    recursive: true,
  });
  await fs.copyFile(
    path.join(BADGE_IMAGES_DIR, "README.md"),
    path.join(work, "README.md")
  );
  if (await pathExists(path.join(BADGE_IMAGES_DIR, "manifest.json"))) {
    const full = JSON.parse(
      await fs.readFile(path.join(BADGE_IMAGES_DIR, "manifest.json"), "utf8")
    );
    const slim = {
      generatedAt: full.generatedAt,
      uniqueHashes: full.uniqueHashes,
      themes: full.themes,
    };
    await fs.writeFile(
      path.join(work, "manifest.json"),
      JSON.stringify(slim, null, 2) + "\n",
      "utf8"
    );
  }

  await run("git", ["add", "-A"], { cwd: work });
  // Commit only if changes
  try {
    await run(
      "git",
      [
        "diff",
        "--cached",
        "--quiet",
      ],
      { cwd: work }
    );
    console.log("No changes to publish.");
  } catch {
    await run(
      "git",
      [
        "-c",
        "user.email=nosvasedis@users.noreply.github.com",
        "-c",
        "user.name=nosvasedis",
        "commit",
        "-m",
        "Update content-addressed badge icons",
      ],
      { cwd: work }
    );
    await run("git", ["branch", "-M", "main"], { cwd: work });
    await run("git", ["push", "-u", "origin", "HEAD:main"], { cwd: work });
    console.log("Published. CDN may take ~1–2 minutes to refresh.");
  }

  try {
    await fs.rm(work, { recursive: true, force: true });
  } catch (err) {
    console.warn(`cleanup warning: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
