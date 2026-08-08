/**
 * V1 badge JSON snapshot for parity oracles (post-ship production is v2 marker-only).
 * Pinned at backup/v1/oracle/ — not overwritten by rolling v1 backups.
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

export const V1_ORACLE_DIR = path.join(ROOT, "backup", "v1", "oracle");
export const V1_SOLID_BADGES_PATH = path.join(V1_ORACLE_DIR, "nosvasedis-badges-solid.json");

/** @returns {object[]} */
export function loadV1SolidFilters() {
  if (!existsSync(V1_SOLID_BADGES_PATH)) {
    throw new Error(
      `Missing ${V1_SOLID_BADGES_PATH} — copy pre-ship v1 solid badges to backup/v1/oracle/`
    );
  }
  const data = JSON.parse(readFileSync(V1_SOLID_BADGES_PATH, "utf8"));
  return data.filters.filter((f) => f.type === "filter" && f.pattern);
}
