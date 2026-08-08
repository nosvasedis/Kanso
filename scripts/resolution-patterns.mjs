/**
 * Resolution badge patterns — single source of truth for gr group.
 */
export const RESOLUTION_FILTER_META = {
  "r-4k": "4K",
  "r-1440": "1440p",
  "r-1080": "1080p",
  "r-720": "720p",
  "r-576": "576p",
  "r-480": "480p",
  "r-360": "360p",
  "r-240": "240p",
};

export const RESOLUTION_PATTERNS = {
  "r-4k": "(?i)^(?=.*(?:2160[pi]?|4k|uhd))(?!.*(?:1440[pi]?|2560x1440|1080[pi]?|720[pi]?|576[pi]?|480[pi]?|360[pi]?|240[pi]?))",
  "r-1440":
    "(?i)^(?=.*(?:1440[pi]?|2560x1440|2k|qhd|wqhd))(?!.*(?:2160[pi]?|4k|uhd|1080[pi]?|720[pi]?|576[pi]?|480[pi]?|360[pi]?|240[pi]?))",
  "r-1080": "(?i)\\b1080[pi]?\\b",
  "r-720": "(?i)\\b720[pi]?\\b",
  "r-576": "(?i)\\b576[pi]?\\b",
  "r-480": "(?i)\\b480[pi]?\\b",
  "r-360": "(?i)\\b360[pi]?\\b",
  "r-240": "(?i)\\b240[pi]?\\b",
};

export const RESOLUTION_FILTER_IDS = Object.keys(RESOLUTION_PATTERNS);
