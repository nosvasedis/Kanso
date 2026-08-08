/** Shared helpers for AIOStreams array tag replace chains (markers only, no visible bleed). */

export function tagReplace(token, marker) {
  return `::replace('${token}','${marker}')`;
}

/** Remove a parsed tag token when markers come from gate inject instead. */
export function tagStrip(token) {
  return `::replace('${token}','')`;
}

/** Join('|') separators must not appear in haystack output. */
export const JOIN_PIPE_CLEAN = `::replace('|','')`;
