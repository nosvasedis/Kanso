/**
 * CDN URL helpers for Kanso badge PNGs (GitHub raw by default).
 *
 * Override with env:
 *   ICON_CDN_OWNER  (default nosvasedis)
 *   ICON_CDN_REPO   (default kanso)
 *   ICON_CDN_REF    (default main)
 *   ICON_CDN_BASE   (full base URL; if set, owner/repo/ref ignored)
 */
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");

export const ICON_CDN_OWNER = process.env.ICON_CDN_OWNER || "nosvasedis";
export const ICON_CDN_REPO = process.env.ICON_CDN_REPO || "kanso";
export const ICON_CDN_REF = process.env.ICON_CDN_REF || "main";

export const BADGE_IMAGES_DIR = path.join(ROOT, "badges", "badge-images");
export const BADGE_IMAGE_FILES_DIR = path.join(BADGE_IMAGES_DIR, "files");
export const BADGE_IMAGE_MANIFEST_PATH = path.join(
  BADGE_IMAGES_DIR,
  "manifest.json"
);

/** Local tree that gets published into the Kanso GitHub repo `/files`. */
export function iconCdnBase() {
  if (process.env.ICON_CDN_BASE) {
    return process.env.ICON_CDN_BASE.replace(/\/$/, "");
  }
  // Prefer GitHub raw for cold-open predictability on TV/mobile.
  return `https://raw.githubusercontent.com/${ICON_CDN_OWNER}/${ICON_CDN_REPO}/${ICON_CDN_REF}`;
}

export function iconJsdelivrBase() {
  return `https://cdn.jsdelivr.net/gh/${ICON_CDN_OWNER}/${ICON_CDN_REPO}@${ICON_CDN_REF}`;
}

export function iconRawBase() {
  return `https://raw.githubusercontent.com/${ICON_CDN_OWNER}/${ICON_CDN_REPO}/${ICON_CDN_REF}`;
}

/** Content hash (sha256 hex) of a PNG buffer. */
export function hashIconBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/** Short stable filename from full hash. */
export function iconFileName(hash, ext = "png") {
  return `${hash.slice(0, 16)}.${ext}`;
}

/**
 * Public CDN URL for a content-hashed icon file.
 * `?rev=` helps clients bust caches when content changes (same path rare with hashes).
 */
export function cdnUrlForHash(hash, ext = "png") {
  const file = iconFileName(hash, ext);
  return `${iconCdnBase()}/files/${file}?rev=${hash.slice(0, 12)}`;
}

export function relativeIconPath(hash, ext = "png") {
  return `files/${iconFileName(hash, ext)}`;
}

export function isLegacySlowHost(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("files.catbox.moe") ||
    url.includes("raw.githubusercontent.com/kingsizew/")
  );
}
