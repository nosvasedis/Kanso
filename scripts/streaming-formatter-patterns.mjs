/**
 * Streaming ↔ mono formatter contract.
 * stream.network drives invisible haystack markers; badges match markers or filename tags.
 */

function regexEscapeLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Unique invisible markers (must not be substrings of each other). */
export const STREAMING_MARKERS = {
  "s-nflx": "\u2060\u2061",
  "s-amzn": "\u2060\u2062",
  "s-atvp": "\u2060\u2063",
  "s-dsnp": "\u2060\u2064",
  "s-hmax": "\u2060\u2065",
  "s-hulu": "\u2060\u2066",
  "s-pcok": "\u2060\u2067",
  "s-pamp": "\u2060\u2068",
  "s-croll": "\u2060\u2069",
};

/**
 * @type {Array<{ id: keyof typeof STREAMING_MARKERS, networkRe: string, filenameAlt: string }>}
 */
export const STREAMING_FORMATTER_SERVICES = [
  {
    id: "s-nflx",
    networkRe: "(?i)netflix|\\bnflx\\b|\\bnf\\b",
    filenameAlt: "\\b(?:nflx|nf|netflix)\\b",
  },
  {
    id: "s-amzn",
    networkRe: "(?i)amazon|prime\\s*video|\\bamzn\\b|\\bprime\\b",
    filenameAlt: "\\b(?:amzn|amazon(?:\\s*prime)?|prime\\s*video)\\b",
  },
  {
    id: "s-atvp",
    networkRe: "(?i)apple\\s*tv|\\batvp\\b|\\batv\\b",
    filenameAlt: "\\b(?:atvp|appletv|apple\\s*tv)\\b",
  },
  {
    id: "s-dsnp",
    networkRe: "(?i)disney\\+|\\bdisney\\b|\\bdsnp\\b|\\bdsny\\b",
    filenameAlt: "\\b(?:dsnp|dsny|disney|disney\\+)\\b",
  },
  {
    id: "s-hmax",
    networkRe: "(?i)hbo\\s*max|\\bhmax\\b",
    filenameAlt: "\\b(?:hmax|hbomax)\\b",
  },
  {
    id: "s-hulu",
    networkRe: "(?i)\\bhulu\\b",
    filenameAlt: "\\bhulu\\b",
  },
  {
    id: "s-pcok",
    networkRe: "(?i)peacock|\\bpcok\\b",
    filenameAlt: "\\b(?:pcok|peacock)\\b",
  },
  {
    id: "s-pamp",
    networkRe: "(?i)paramount\\+|\\bparamount\\b|\\bpmtp\\b|\\bpamp\\b",
    filenameAlt: "\\b(?:pmtp|pamp|paramount\\+)\\b|\\bparamount\\b",
  },
  {
    id: "s-croll",
    networkRe: "(?i)crunchyroll|crunchy|\\bcroll\\b",
    filenameAlt: "\\b(?:crunchyroll|crunchy|croll)\\b",
  },
];

/** Hidden haystack when AIOStreams parsed stream.network (not shown in mono formatter). */
export const FORMATTER_STREAMING_INJECT = STREAMING_FORMATTER_SERVICES.map(
  ({ id }) => {
    const terms = {
      "s-nflx": ["Netflix", "NFLX", "NF"],
      "s-amzn": ["Amazon", "Prime Video", "AMZN"],
      "s-atvp": ["Apple TV", "ATVP"],
      "s-dsnp": ["Disney", "DSNP"],
      "s-hmax": ["HBO Max", "HMAX"],
      "s-hulu": ["Hulu"],
      "s-pcok": ["Peacock", "PCOK"],
      "s-pamp": ["Paramount", "PAMP"],
      "s-croll": ["Crunchyroll", "CROLL"],
    }[id];
    const condition = terms.map((term) => `stream.network::~${term}`).join("::or::");
    return `{${condition}["${STREAMING_MARKERS[id]}"||""]}`;
  }
).join("");

/** @param {string} id @param {string} [filenameAlt] */
export function streamingBadgePattern(id, filenameAlt) {
  const service = STREAMING_FORMATTER_SERVICES.find((s) => s.id === id);
  const alt = filenameAlt ?? service?.filenameAlt;
  const marker = STREAMING_MARKERS[id];
  if (!alt || !marker) {
    throw new Error(`Unknown streaming badge id: ${id}`);
  }
  const markRe = regexEscapeLiteral(marker);
  return `(?i)(?:${markRe}|${alt})`;
}
