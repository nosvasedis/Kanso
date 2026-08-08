/**
 * Streaming service badges (from Je1992 Badges.txt — 9 services, no Crave).
 */
import { streamingBrandStroke } from "./streaming-brand-colors.mjs";
import { streamingBadgePattern } from "./streaming-formatter-patterns.mjs";

const JE19921 =
  "https://raw.githubusercontent.com/je19921/cardgenerator.github.io/refs/heads/main";

export const STREAMING_GROUP = {
  id: "gs",
  name: "Streaming",
};

/** @type {Array<{ id: string, name: string, pattern: string, imageURL: string, file: string }>} */
export const STREAMING_BADGES = [
  {
    id: "s-nflx",
    name: "NETFLIX",
    pattern: streamingBadgePattern("s-nflx"),
    imageURL: `${JE19921}/Netflix.png`,
    file: "streaming-netflix.png",
  },
  {
    id: "s-amzn",
    name: "PRIME",
    pattern: streamingBadgePattern("s-amzn"),
    imageURL: `${JE19921}/amazon%20prime.png`,
    file: "streaming-prime.png",
  },
  {
    id: "s-atvp",
    name: "APPLE TV+",
    pattern: streamingBadgePattern("s-atvp"),
    imageURL: `${JE19921}/atv%2B.png`,
    file: "streaming-atv.png",
  },
  {
    id: "s-dsnp",
    name: "DISNEY+",
    pattern: streamingBadgePattern("s-dsnp"),
    imageURL: `${JE19921}/d%2B.png`,
    file: "streaming-disney.png",
  },
  {
    id: "s-hmax",
    name: "MAX",
    pattern: streamingBadgePattern("s-hmax"),
    imageURL: `${JE19921}/hmax.png`,
    file: "streaming-max.png",
  },
  {
    id: "s-hulu",
    name: "HULU",
    pattern: streamingBadgePattern("s-hulu"),
    imageURL: `${JE19921}/hulu.png`,
    file: "streaming-hulu.png",
  },
  {
    id: "s-pcok",
    name: "PEACOCK",
    pattern: streamingBadgePattern("s-pcok"),
    imageURL: `${JE19921}/peacock.png`,
    file: "streaming-peacock.png",
  },
  {
    id: "s-pamp",
    name: "PARAMOUNT+",
    pattern: streamingBadgePattern("s-pamp"),
    imageURL: `${JE19921}/p%2B.png`,
    file: "streaming-paramount.png",
  },
  {
    id: "s-croll",
    name: "CRUNCHYROLL",
    pattern: streamingBadgePattern("s-croll"),
    imageURL: `${JE19921}/crunchyroll.png`,
    file: "streaming-crunchyroll.png",
  },
];

/** @param {string} id */
export function streamingBadgeById(id) {
  return STREAMING_BADGES.find((b) => b.id === id);
}

export function createStreamingFilter(def) {
  const stroke = streamingBrandStroke(def.id);
  return {
    borderColor: stroke,
    groupId: "gs",
    id: def.id,
    imageURL: def.imageURL,
    isEnabled: true,
    name: def.name,
    pattern: def.pattern,
    tagColor: "#00000000",
    tagStyle: "filled and bordered",
    textColor: "#FFFFFF",
    type: "filter",
  };
}
