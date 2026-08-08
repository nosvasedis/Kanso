/**
 * Merge filename and metadata-only regex branches for Nuvio badge filters.
 */

export function stripCasePrefix(pattern) {
  return pattern.replace(/^\(\?i\)/, "");
}

/** `(?i)(?:filename|tagOnly)` — tagOnly omitted when empty. */
export function mergeFilenameAndTag(filenamePattern, tagOnlyPattern) {
  const fn = stripCasePrefix(filenamePattern);
  if (!tagOnlyPattern) return `(?i)${fn}`;
  const tg = stripCasePrefix(tagOnlyPattern);
  return `(?i)(?:${fn}|${tg})`;
}
