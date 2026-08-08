/**
 * Special-tag edition badges (gst group — with SeaDex).
 */
import {
  EDITION_BW_BADGE_PATTERN,
  EDITION_DC_BADGE_PATTERN,
  EDITION_EXT_BADGE_PATTERN,
  EDITION_HUE_BADGE_PATTERN,
} from "./edition-badge-patterns.mjs";

export const EDITION_GROUP = {
  id: "gst",
  name: "Special Tags",
};

/** @type {Array<{ id: string, name: string, pattern: string, file: string }>} */
export const EDITION_BADGES = [
  {
    id: "edition-directors-cut",
    name: "DIR CUT",
    pattern: EDITION_DC_BADGE_PATTERN,
    file: "edition-directors-cut.png",
  },
  {
    id: "edition-extended",
    name: "EXTENDED",
    pattern: EDITION_EXT_BADGE_PATTERN,
    file: "edition-extended.png",
  },
  {
    id: "edition-true-hue",
    name: "TRUE-HUE",
    pattern: EDITION_HUE_BADGE_PATTERN,
    file: "edition-true-hue.png",
  },
  {
    id: "edition-bw",
    name: "B&W",
    pattern: EDITION_BW_BADGE_PATTERN,
    file: "edition-bw.png",
  },
];

export const EDITION_BADGE_IDS = EDITION_BADGES.map((b) => b.id);

/** @param {{ id: string, name: string, pattern: string, imageURL?: string }} def */
export function createEditionFilter(def) {
  return {
    borderColor: "#FF000000",
    groupId: "gst",
    id: def.id,
    imageURL: def.imageURL ?? "",
    isEnabled: true,
    name: def.name,
    pattern: def.pattern,
    tagColor: "#00000000",
    tagStyle: "filled and bordered",
    textColor: "#FFFFFF",
    type: "filter",
  };
}
