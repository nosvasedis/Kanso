/** Shared release-name guards for filename-scoped badge patterns. */

export const TOK = "(?:[._\\-/]|\\s)";

export const STREAMING_TAGS =
  "amzn|amazon|nf|netflix|dsnp|ds\\+|disney\\+|dp|atv|atvp|appl|apple[\\s._-]?tv|pcok|peacock|pmtp|paramount\\+|hmax|hbomax|hbo[\\s._-]?max|hulu|stan|stzn|crave|crav|itunes|itv|play|pmp";

export const STREAMING_TAG_BOUND = `(?:^|${TOK})(?:${STREAMING_TAGS})(?:${TOK}|$)`;

export const RELEASE_SOURCE_MARKERS =
  `(?:web[-_. ]?dl|webdl|webrip|bluray|blu-ray|remux|${STREAMING_TAGS}|\\.mkv|\\.mp4)`;

export const RELEASE_FILENAME_GUARD =
  `^(?=(?:(?=(?:[^.]*\\.){2,})(?=.*(?:(?:19|20)\\d{2}|(?:[^.]*\\.){4,}))|(?=.*\\.(?:mkv|mp4|m2ts|ts|mov|m4v)\\b)(?=.*\\b(?:2160|1080|720)[pi]\\b)(?=.{35,})|(?=.*\\bS\\d{1,2}E\\d{1,2}\\b)(?=.*\\b(?:2160|1080|720)[pi]\\b)(?=.*${RELEASE_SOURCE_MARKERS})))`;

export const FILENAME_CTX =
  `(?=.*(?:2160[pi]|1080[pi]|720[pi]|\\b4k\\b|\\buhd\\b|bluray|blu-ray|web[-_. ]?dl|webdl|webrip|remux|(?:^|[._-])web(?:[._-]|$)|\\.mkv|\\.mp4|${STREAMING_TAG_BOUND}))`;

export const BASE = `(?i)${RELEASE_FILENAME_GUARD}${FILENAME_CTX}`;
