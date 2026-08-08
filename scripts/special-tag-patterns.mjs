/**
 * Special-tag badge patterns (gst) — edition / release metadata beyond DC/EXT/HUE/BW.
 */

export const SPECIAL_TAG_PATTERNS = {
  "hybrid-release": {
    name: "HYBRID",
    pattern:
      "(?i)^(?![\\s\\S]*[-_. ]hybrid(?:\\d+)?\\.(?:mkv|mp4|m2ts|ts|mov|m4v)(?=$|[?\\s#]))(?=[\\s\\S]*(?:^|[^A-Za-z0-9])hybrid(?:\\d+)?(?![\\s._-]*log(?:arithmic)?[\\s._-]*gamma)(?=$|[^A-Za-z0-9]))",
  },
  "criterion-collection": {
    name: "CRIT",
    pattern:
      "(?i)^(?![\\s\\S]*[-_. ]criterion\\.(?:mkv|mp4|m2ts|ts|mov|m4v)(?=$|[?\\s#]))(?=[\\s\\S]*(?:^|[^A-Za-z0-9])criterion(?![\\s._-]+channel)(?:[\\s._-]+collection)?(?=$|[^A-Za-z0-9]))",
  },
  "proper-release": {
    name: "PROPER",
    pattern:
      "(?i)(?:^|[^A-Za-z0-9])(?:real[\\s._-]+(?:real[\\s._-]+)?)?proper(?:[\\s._-]?[23])?(?=$|[^A-Za-z0-9])",
  },
  "repack-release": {
    name: "REPACK",
    pattern:
      "(?i)(?:^|[^A-Za-z0-9])(?:real[\\s._-]+(?:real[\\s._-]+)?)?repack(?:[\\s._-]?[23])?(?=$|[^A-Za-z0-9])",
  },
  "remastered-release": {
    name: "RMSTRD",
    pattern:
      "(?i)^(?![\\s\\S]*(?:^|[^A-Za-z0-9])(?:ai(?:[\\s._-]+(?:4k|uhd|enhanced|upscaled?)){0,2}[\\s._-]+remaster(?:ed)?|remaster(?:ed)?[\\s._-]+(?:by[\\s._-]+)?ai)(?=$|[^A-Za-z0-9]))(?=[\\s\\S]*(?:^|[^A-Za-z0-9])(?:(?:4k|uhd)[\\s._-]+)?(?:digitally[\\s._-]+)?remaster(?:ed)?(?=$|[^A-Za-z0-9]))",
  },
  "open-matte-edition": {
    name: "MATTE",
    pattern: "(?i)(?:^|[^A-Za-z0-9])open[\\s._-]*matte(?=$|[^A-Za-z0-9])",
  },
  "regraded-release": {
    name: "REGRD",
    pattern: "(?i)(?:^|[^A-Za-z0-9])(?:custom[\\s._-]+)?re[\\s._-]?grad(?:e|ed|ing)(?=$|[^A-Za-z0-9])",
  },
  "uncut-edition": {
    name: "UNCUT",
    pattern: "(?i)(?:^|[^A-Za-z0-9])uncut(?![\\s._-]*gems?)(?=$|[^A-Za-z0-9])",
  },
  "uncensored-edition": {
    name: "UNCENS",
    pattern: "(?i)(?:^|[^A-Za-z0-9])uncensored(?=$|[^A-Za-z0-9])",
  },
  "edition-theatrical": {
    name: "THTR",
    pattern:
      "(?i)(?!.*\\btheatrical[\\s._-]+(?:trailer|teaser|preview)\\b)(?:\\btheatrical(?:[\\s._-]*(?:cut|edition|version))?\\b|\\bthtr\\b)",
  },
};
