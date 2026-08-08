#!/usr/bin/env node
/**
 * Publish the public Kanso suite to github.com/nosvasedis/Kanso
 * — packs, formatter, scripts, and /files icons at repo root.
 * Internal notes under docs/ are NOT published.
 *
 * Usage:
 *   node scripts/publish-kanso-repo.mjs
 *   node scripts/publish-kanso-repo.mjs --dry-run
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  ROOT,
  BADGE_IMAGE_FILES_DIR,
  ICON_CDN_OWNER,
  ICON_CDN_REPO,
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
          new Error(`${cmd} ${args.join(" ")} exited ${code}\n${stderr || stdout}`)
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

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function copyDirFiltered(src, dest, { ignoreNames = new Set() } = {}) {
  await fs.mkdir(dest, { recursive: true });
  for (const ent of await fs.readdir(src, { withFileTypes: true })) {
    if (ignoreNames.has(ent.name)) continue;
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      await copyDirFiltered(from, to, { ignoreNames });
    } else if (ent.isFile()) {
      await copyFile(from, to);
    }
  }
}

const ROOT_FILES = [
  "README.md",
  "package.json",
  "package-lock.json",
  "formatter.json",
  "formatter-export-name.txt",
  "formatter-export-description.txt",
  "kanso-solid.json",
  "kanso-transparent.json",
  "kanso-mono.json",
  ".gitignore",
  ".env.example",
  "sync-helper.bat",
];

const IGNORE_SCRIPT_DIR = new Set([]);
const IGNORE_BADGES_DIR = new Set([
  "generated",
  "generated-solid",
  "generated-transparent",
  "badge-images", // published as /files instead
]);
/** Internal audits / logo briefs stay local — never ship to the public repo. */
const PUBLISH_DOCS = false;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!(await pathExists(BADGE_IMAGE_FILES_DIR))) {
    throw new Error("Missing badges/badge-images/files — run icons:materialize first");
  }

  console.log(`publish-kanso-repo → ${ICON_CDN_OWNER}/${ICON_CDN_REPO}`);
  if (dryRun) {
    console.log("dry-run: OK");
    return;
  }

  await run("gh", [
    "repo",
    "edit",
    `${ICON_CDN_OWNER}/${ICON_CDN_REPO}`,
    "--description",
    "Kanso — clean stream marks for Nuvio. No echo. Every detail once.",
    "--homepage",
    `https://github.com/${ICON_CDN_OWNER}/${ICON_CDN_REPO}#readme`,
  ]);

  const work = path.join(ROOT, "badges", "badge-images", ".publish-worktree");
  await fs.rm(work, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(work, { recursive: true });

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

  for (const name of await fs.readdir(work)) {
    if (name === ".git") continue;
    await fs.rm(path.join(work, name), { recursive: true, force: true });
  }

  for (const name of ROOT_FILES) {
    const src = path.join(ROOT, name);
    if (await pathExists(src)) await copyFile(src, path.join(work, name));
  }

  await fs.cp(BADGE_IMAGE_FILES_DIR, path.join(work, "files"), {
    recursive: true,
  });

  await copyDirFiltered(path.join(ROOT, "scripts"), path.join(work, "scripts"), {
    ignoreNames: IGNORE_SCRIPT_DIR,
  });
  if (PUBLISH_DOCS) {
    await copyDirFiltered(path.join(ROOT, "docs"), path.join(work, "docs"));
  }
  await copyDirFiltered(path.join(ROOT, "badges"), path.join(work, "badges"), {
    ignoreNames: IGNORE_BADGES_DIR,
  });
  await copyDirFiltered(path.join(ROOT, "sync-ui"), path.join(work, "sync-ui"), {
    ignoreNames: new Set(["user-config.json"]),
  });

  // Slim note for icon workspace (no huge publish-worktree)
  await fs.mkdir(path.join(work, "badges", "badge-images"), { recursive: true });
  await copyFile(
    path.join(ROOT, "badges", "badge-images", "README.md"),
    path.join(work, "badges", "badge-images", "README.md")
  );
  if (await pathExists(path.join(ROOT, "badges", "badge-images", "manifest.json"))) {
    const full = JSON.parse(
      await fs.readFile(
        path.join(ROOT, "badges", "badge-images", "manifest.json"),
        "utf8"
      )
    );
    const slim = {
      generatedAt: full.generatedAt,
      uniqueHashes: full.uniqueHashes,
      themes: full.themes,
      brand: "Kanso",
    };
    await fs.writeFile(
      path.join(work, "badges", "badge-images", "manifest.json"),
      JSON.stringify(slim, null, 2) + "\n"
    );
  }

  // Do not ship .vendor / node_modules / backup blobs / .cache
  await run("git", ["add", "-A"], { cwd: work });
  try {
    await run("git", ["diff", "--cached", "--quiet"], { cwd: work });
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
        "Kanso: public suite — formatter, packs, icons\n\nNo echo. Every detail once.",
      ],
      { cwd: work }
    );
    await run("git", ["branch", "-M", "main"], { cwd: work });
    await run("git", ["push", "-u", "origin", "HEAD:main"], { cwd: work });
    console.log("Published https://github.com/nosvasedis/Kanso");
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
