/**
 * Snapshot v1 formatter + badge JSON into backup/v1/ (safe restore point during v2 migration).
 *
 * Usage:
 *   node scripts/backup-v1.mjs           # create timestamped snapshot
 *   node scripts/restore-v1.mjs          # restore latest snapshot to project root
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BACKUP_ROOT = path.join(ROOT, "backup", "v1");

/** Production files we never want to lose during migration. */
export const V1_BACKUP_FILES = [
  "formatter.json",
  "kanso-solid.json",
  "kanso-transparent.json",
  "kanso-mono.json",
];

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * @param {object} [opts]
 * @param {string} [opts.label] subdirectory name under backup/v1/
 */
export async function backupV1(opts = {}) {
  const dir = path.join(BACKUP_ROOT, opts.label ?? stamp());
  await fs.mkdir(dir, { recursive: true });

  const copied = [];
  for (const name of V1_BACKUP_FILES) {
    const src = path.join(ROOT, name);
    try {
      await fs.copyFile(src, path.join(dir, name));
      copied.push(name);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        continue;
      }
      throw err;
    }
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    files: copied,
    note: "v1 production snapshot before v2 migration",
  };
  await fs.writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await fs.writeFile(path.join(BACKUP_ROOT, "LATEST"), dir + "\n");

  return { dir, copied };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = await backupV1();
  console.log(`V1 backup: ${result.dir}`);
  console.log(`Files: ${result.copied.join(", ")}`);
}
