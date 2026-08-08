/**
 * Invisible DR markers for Nuvio gv badge haystack (no visible HDR/DV text).
 * SDR is implicit when no HDR/DV badges match — no SDR badge or inject.
 *
 * DV marker only when standalone DV (no combo audio in filename) — combos own the DV pill.
 * HDR markers only when no DV anywhere (filename or visualTags).
 */
import {
  DR_DV_MARKER,
  DR_HDR10P_MARKER,
  DR_HDR_MARKER,
} from "./dr-formatter-markers.mjs";

export const FORMATTER_DR_INJECT =
  `{stream.visualTags::~DV["${DR_DV_MARKER}"||""]}` +
  `{stream.visualTags::~DV::isfalse::and::stream.visualTags::~HDR10+["${DR_HDR10P_MARKER}"||""]}` +
  `{stream.visualTags::~DV::isfalse::and::stream.visualTags::~HDR10+::isfalse::and::stream.visualTags::~HDR10::isfalse::and::stream.visualTags::~HDR["${DR_HDR_MARKER}"||""]}` +
  `{stream.visualTags::~DV::isfalse::and::stream.visualTags::~HDR10+::isfalse::and::stream.visualTags::~HDR10::isfalse::and::stream.visualTags::~HDR::isfalse::and::stream.quality::~REMUX::and::stream.resolution::=2160p["${DR_HDR_MARKER}"||""]}`;
