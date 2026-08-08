#!/usr/bin/env node
/**
 * Store a local PNG into badges/badge-images/files (content-hashed) and
 * return its public CDN URL. Replaces Catbox uploads.
 */
import fs from "node:fs/promises";
import path from "node:path";
import {
  BADGE_IMAGE_FILES_DIR,
  hashIconBuffer,
  iconFileName,
  cdnUrlForHash,
} from "./icon-cdn.mjs";

/**
 * @param {string} filePath path to a local PNG
 * @returns {Promise<string>} CDN URL
 */
export async function publishLocalIcon(filePath) {
  const buffer = await fs.readFile(filePath);
  return publishIconBuffer(buffer);
}

/**
 * @param {Buffer} buffer
 * @returns {Promise<string>} CDN URL
 */
export async function publishIconBuffer(buffer) {
  await fs.mkdir(BADGE_IMAGE_FILES_DIR, { recursive: true });
  const hash = hashIconBuffer(buffer);
  const file = iconFileName(hash);
  const outPath = path.join(BADGE_IMAGE_FILES_DIR, file);
  try {
    await fs.access(outPath);
  } catch {
    await fs.writeFile(outPath, buffer);
  }
  return cdnUrlForHash(hash);
}
