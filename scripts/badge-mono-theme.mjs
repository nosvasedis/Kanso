/**
 * True monochrome badges — black fill, white text, white stroke (all groups except languages).
 * Language badges keep the transparent + flag styling unchanged.
 */
import {
  applyTransparentTheme,
  MONO_GROUP_ORDER,
  MONO_FILTER_ORDER,
} from "./badge-transparent-theme.mjs";

export { MONO_GROUP_ORDER, MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";

export const MONO_FILL = "#000000";
export const MONO_BORDER = "#FFFFFFFF";
export const MONO_TEXT = "#FFFFFF";
export const MONO_TAG_STYLE = "filled";

const WHITE_GROUP = (name) => ({
  name,
  color: MONO_FILL,
  borderColor: MONO_BORDER,
});

export const MONO_GROUP_META = {
  gst: WHITE_GROUP("Special Tags"),
  gs: WHITE_GROUP("Streaming"),
  gms: WHITE_GROUP("Tiers"),
  gq: WHITE_GROUP("Quality"),
  grl: WHITE_GROUP("Release"),
  gr: WHITE_GROUP("Resolution"),
  gv: WHITE_GROUP("Visual"),
  ga: WHITE_GROUP("Audio"),
  gc: WHITE_GROUP("Channels"),
  gl: WHITE_GROUP("Language"),
};

/** @param {{ id: string, groupId: string }} filter */
export function applyMonoTheme(filter) {
  if (filter.groupId === "gl") {
    return applyTransparentTheme(filter);
  }
  filter.tagColor = MONO_FILL;
  filter.borderColor = MONO_BORDER;
  filter.textColor = MONO_TEXT;
  filter.tagStyle = MONO_TAG_STYLE;
  return filter;
}
