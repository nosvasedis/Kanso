/**
 * Invisible DR markers for Nuvio gv badge haystack (no visible HDR/DV text).
 * Legacy DR-only helper; the current presets use preset-formatter.mjs.
 * Unknown range is unknown. Never infer HDR from resolution/source alone.
 */
import {
  DR_DV_MARKER,
  DR_HDR10P_MARKER,
  DR_HDR_MARKER,
} from "./dr-formatter-markers.mjs";

export const FORMATTER_DR_INJECT =
  `{stream.visualTags::~DV["${DR_DV_MARKER}"||""]}` +
  `{stream.visualTags::~DV::isfalse::and::stream.visualTags::~HDR10+["${DR_HDR10P_MARKER}"||""]}` +
  `{stream.visualTags::~DV::isfalse::and::stream.visualTags::~HDR10+::isfalse::and::stream.visualTags::~HDR10::isfalse::and::stream.visualTags::~HDR["${DR_HDR_MARKER}"||""]}`;
