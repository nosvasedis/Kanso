/**
 * V2 visual formatter inject — DR (existing) + combo markers + compact tag/filename chain.
 */
import { FORMATTER_DR_INJECT } from "./dr-formatter-inject.mjs";
import { MARKER_ATOMS } from "./formatter-markers.mjs";
import {
  DR_DV_MARKER,
  DR_HDR10P_MARKER,
  DR_HDR_MARKER,
} from "./dr-formatter-markers.mjs";

const M = MARKER_ATOMS;

function gate(cond, marker) {
  return `{${cond}["${marker}"||""]}`;
}

/** Combo markers not covered by FORMATTER_DR_INJECT alone. */
const COMBO_INJECT =
  gate("stream.visualTags::~DV::and::stream.visualTags::~HDR10+", M.visHdr10p) +
  gate("stream.visualTags::~DV::and::stream.visualTags::~HDR10+::isfalse::and::stream.visualTags::~HDR10", M.visHdr10) +
  gate("stream.visualTags::~DV::and::stream.visualTags::~HDR10+::isfalse::and::stream.visualTags::~HDR10::isfalse::and::stream.visualTags::~HDR", M.visHdr) +
  gate("stream.visualTags::~DV::isfalse::and::stream.visualTags::~HDR10+::isfalse::and::stream.visualTags::~HDR10", M.visHdr10);

const VISUAL_TAG_CHAIN =
  gate("stream.visualTags::~HLG", M.visHlg) +
  gate("stream.visualTags::~10bit", M.vis10bit) +
  gate("stream.visualTags::~AI", M.visAi) +
  gate("stream.visualTags::~SDR", M.visSdr);

const FILENAME_VISUAL =
  gate("stream.filename::~IMAX::and::stream.filename::~enhanced", M.visImaxE) +
  gate(
    "stream.filename::~IMAX::and::stream.filename::~enhanced::isfalse",
    M.visImax
  ) +
  gate(
    "stream.filename::~3D::or::stream.filename::~SBS::or::stream.filename::~HSBS",
    M.vis3d
  );

export const FORMATTER_V2_INJECT_VISUAL_CORE =
  FORMATTER_DR_INJECT + COMBO_INJECT + VISUAL_TAG_CHAIN;

export const FORMATTER_V2_INJECT_VISUAL_FILENAME = FILENAME_VISUAL;

export const FORMATTER_V2_INJECT_VISUAL =
  FORMATTER_V2_INJECT_VISUAL_CORE + FORMATTER_V2_INJECT_VISUAL_FILENAME;

const TOK = String.raw`[\s._\-+]|(?<=[a-z])(?=[A-Z])`;

function hasAtmos(hay) {
  return new RegExp(String.raw`(?:^|${TOK})atmos(?:${TOK}|$)`, "i").test(hay);
}

function hasDv(hay) {
  return (
    /(?:^|[^A-Za-z0-9])(?:dv|dovi|dolby[-_. ]?vision)(?=$|[^A-Za-z0-9])/i.test(hay) ||
    /\bDV\b/.test(hay)
  );
}

function hasHdr10p(hay) {
  return /hdr[-_.]?10(?:[-_.]?(?:\+|p)|[-_. ]?plus)/i.test(hay);
}

function hasHdr10(hay) {
  return /hdr[-_.]?10(?![-_. ]?(?:\+|plus|p|bit))/i.test(hay);
}

function hasHdrGeneric(hay) {
  return /\b(?:HDR|PQ)\b/i.test(hay) && !hasHdr10(hay);
}

function hasComboAudio(fn) {
  return /\bDDP\b|\.DDP|Atmos/i.test(fn);
}

function badAtmosGroup(fn) {
  return /\b(?:W4NK3R|HQMUX)\b/i.test(fn);
}

/**
 * @param {{ visualTags?: string, filename?: string, audioTags?: string, quality?: string, resolution?: string }} fields
 */
export function buildVisualMarkers(fields) {
  const visualTags = fields.visualTags ?? "";
  const filename = fields.filename ?? "";
  const audioTags = fields.audioTags ?? "";
  const quality = fields.quality ?? "";
  const resolution = fields.resolution ?? "";
  const joined = `${visualTags} ${filename} ${audioTags}`;
  const fn = filename;

  let out = "";
  const add = (m) => {
    if (m && !out.includes(m)) out += m;
  };

  const dvHit = hasDv(joined);
  const atmos = hasAtmos(joined);
  const hdr10pHit = hasHdr10p(joined);
  const hdr10Hit = hasHdr10(joined);
  const hdrHit = hasHdrGeneric(joined);
  const comboAudio = hasComboAudio(fn);

  if (dvHit && hdr10pHit) {
    add(M.visHdr10p);
    add(DR_DV_MARKER);
  } else if (dvHit && hdr10Hit && !hdr10pHit) {
    add(M.visHdr10);
    add(DR_DV_MARKER);
  } else if (dvHit && hdrHit && !hdr10Hit) {
    add(M.visHdr);
    add(DR_DV_MARKER);
  } else if (dvHit) {
    add(DR_DV_MARKER);
  }

  if (!dvHit && hdr10pHit) add(DR_HDR10P_MARKER);
  if (!dvHit && hdr10Hit && !hdr10pHit) add(M.visHdr10);
  if (!dvHit && !hdr10pHit && !hdr10Hit && hdrHit) add(DR_HDR_MARKER);
  if (
    !dvHit &&
    !hdr10pHit &&
    !hdr10Hit &&
    !hdrHit &&
    /remux/i.test(quality) &&
    /^2160p$/i.test(resolution)
  ) {
    add(DR_HDR_MARKER);
  }

  if (/hlg/i.test(visualTags)) add(M.visHlg);
  if (/10bit/i.test(visualTags)) add(M.vis10bit);
  if (/\bAI\b/.test(visualTags)) add(M.visAi);
  if (/\bSDR\b/.test(visualTags)) add(M.visSdr);

  if (/imax[-_. ]?enhanced/i.test(fn) || (/\bDSNP\b/i.test(fn) && /\bWEB/i.test(fn) && /\bIMAX\b/i.test(fn))) {
    add(M.visImaxE);
  } else if (/\bIMAX\b/i.test(fn) && !/enhanced/i.test(fn)) {
    add(M.visImax);
  }
  if (/\b(?:3d|sbs|half[-_. ]?sbs|hsbs|ou|over[-_. ]?under)\b/i.test(fn)) {
    add(M.vis3d);
  }

  return out;
}
