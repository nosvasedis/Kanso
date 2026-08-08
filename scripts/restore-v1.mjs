/**
 * Restore v1 formatter + badge JSON from backup/v1/LATEST (or a specific snapshot path).
 *
 * Usage:
 *   node scripts/restore-v1.mjs
 *   node scripts/restore-v1.mjs backup/v1/20260710-120000
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { V1_BACKUP_FILES } from "./backup-v1.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BACKUP_ROOT = path.join(ROOT, "backup", "v1");

async function resolveSnapshotDir(arg) {
  if (arg) {
    return path.isAbsolute(arg) ? arg : path.join(ROOT, arg);
  }
  const latest = await fs.readFile(path.join(BACKUP_ROOT, "LATEST"), "utf8").catch(() => "");
  const dir = latest.trim();
  if (!dir) throw new Error("No backup found — run: node scripts/backup-v1.mjs");
  return dir;
}

const snapshotDir = await resolveSnapshotDir(process.argv[2]);
const manifest = JSON.parse(await fs.readFile(path.join(snapshotDir, "manifest.json"), "utf8"));

for (const name of V1_BACKUP_FILES) {
  const src = path.join(snapshotDir, name);
  try {
    await fs.copyFile(src, path.join(ROOT, name));
    console.log(`Restored ${name}`);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      console.warn(`Skipped missing backup file: ${name}`);
      continue;
    }
    throw err;
  }
}

console.log(`Restored from ${snapshotDir} (${manifest.createdAt})`);
