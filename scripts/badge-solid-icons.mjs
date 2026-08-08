/**
 * Solid badge icons — black ink on gv/ga/gc (readable on light fills).
 */
import path from "path";
import { fileURLToPath } from "url";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");
export const SOLID_ICONS_DIR = path.join(ROOT, "badges", "generated-solid");
export const SOLID_ICONS_MANIFEST_PATH = path.join(
  ROOT,
  "badges",
  "icons-urls-solid.json"
);
export const TRANSPARENT_ICONS_MANIFEST_PATH = path.join(
  ROOT,
  "badges",
  "icons-urls-transparent.json"
);

/** Filter ids that need black icons (not white transparent art). */
export const SOLID_DARK_ICON_IDS = ["gv", "ga", "gc"].flatMap(
  (g) => MONO_FILTER_ORDER[g]
);
