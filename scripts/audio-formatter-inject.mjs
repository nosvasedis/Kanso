/**
 * V2 audio formatter inject — combo gates + audioTags replace chain + filename fallbacks.
 */
import { MARKER_ATOMS, BADGE_MARKERS, resolveMarkerRef } from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { applyFilterMeta } from "./badge-filter-meta.mjs";

const M = MARKER_ATOMS;
const GA_IDS = MONO_FILTER_ORDER.ga;

function gate(cond, marker) {
  return `{${cond}["${marker}"||""]}`;
}

const atmos =
  "stream.filename::~Atmos::or::stream.audioTags::~Atmos";
const truehd =
  "stream.filename::~TrueHD::or::stream.audioTags::~TrueHD";
const ddplus =
  "stream.filename::~DDP::or::stream.audioTags::~DD+::or::stream.audioTags::~DDP";
const dd =
  "stream.filename::~AC3::or::stream.filename::~DD5::or::stream.filename::~DD2";
const dv =
  "stream.visualTags::~DV::or::stream.filename::~DV::or::stream.filename::~DoVi";
const noTruehd = `${truehd}::isfalse`;
const noAtmos = `${atmos}::isfalse`;
const noDdplus = `${ddplus}::isfalse`;
const noDv = `${dv}::isfalse`;
const atmosGrpOk =
  "stream.filename::~W4NK3::isfalse::and::stream.filename::~HQMUX::isfalse";
const truehdGrpOk =
  "stream.filename::~CtrlHD::isfalse::and::stream.filename::~W4NK3::isfalse::and::stream.filename::~DON::isfalse";

const dtsx =
  "stream.filename::~DTS-X::or::stream.audioTags::~DTS:X::or::stream.audioTags::~DTS-X";
const dtsma =
  "stream.filename::~DTS-HD.MA::or::stream.audioTags::~DTS-HD MA::or::stream.filename::~DTS-HD MA";
const dtshd =
  "stream.filename::~DTS-HD::or::stream.audioTags::~DTS-HD";
const noDtsma =
  "stream.filename::~DTS-HD.MA::isfalse::and::stream.audioTags::~DTS-HD MA::isfalse";

/** Dolby / DTS combo markers (multi-marker badges). */
const COMBO_AUDIO_INJECT =
  gate(`${atmos}::and::${truehd}::and::${atmosGrpOk}`, M.audAtmos) +
  gate(`${atmos}::and::${truehd}::and::${atmosGrpOk}`, M.audTruehd) +
  gate(
    `${atmos}::and::${ddplus}::and::${noTruehd}::and::${atmosGrpOk}::and::${noDv}`,
    M.audAtmos
  ) +
  gate(
    `${atmos}::and::${ddplus}::and::${noTruehd}::and::${atmosGrpOk}::and::${noDv}`,
    M.audDdplus
  ) +
  gate(`${dtsx}::and::${dtsma}`, M.audDtsx) +
  gate(`${dtsx}::and::${dtsma}`, M.audDtsma) +
  gate(`${dtsx}::and::${dtshd}::and::${noDtsma}`, M.audDtsx) +
  gate(`${dtsx}::and::${dtshd}::and::${noDtsma}`, M.audDtshd);

const AUDIO_TAG_CHAIN =
  gate("stream.audioTags::~DTS:X::or::stream.audioTags::~DTS-X", M.audDtsx) +
  gate("stream.audioTags::~DTS-HD MA", M.audDtsma) +
  gate("stream.audioTags::~DTS-HD::and::stream.audioTags::~DTS-HD MA::isfalse", M.audDtshd) +
  gate("stream.audioTags::~DTS-ES", M.audDtses) +
  gate("stream.audioTags::~DTS::and::stream.audioTags::~DTS-HD::isfalse::and::stream.audioTags::~DTS:X::isfalse::and::stream.audioTags::~DTS-X::isfalse::and::stream.audioTags::~DTS-ES::isfalse", M.audDts) +
  gate("stream.audioTags::~TrueHD", M.audTruehd) +
  gate("stream.audioTags::~Atmos", M.audAtmos) +
  gate("stream.audioTags::~E-AC-3::or::stream.audioTags::~DD+::or::stream.audioTags::~DDP", M.audDdplus) +
  gate("stream.audioTags::~DD::and::stream.audioTags::~DD+::isfalse::and::stream.audioTags::~DDP::isfalse", M.audDd) +
  gate("stream.audioTags::~FLAC", M.audFlac) +
  gate("stream.audioTags::~Opus", M.audOpus) +
  gate("stream.audioTags::~AAC", M.audAac) +
  gate("stream.audioTags::~MP3", M.audMp3) +
  gate("stream.audioTags::~PCM", M.audPcm);

/** Filename fallbacks when audioTags absent (standalone Dolby/DTS). */
const FILENAME_AUDIO =
  gate(
    `${atmos}::and::${noTruehd}::and::${noDdplus}::and::${noDv}::and::${atmosGrpOk}`,
    M.audAtmos
  ) +
  gate(
    `${truehd}::and::${noAtmos}::and::${noDdplus}::and::${noDv}::and::${truehdGrpOk}`,
    M.audTruehd
  ) +
  gate(
    `${ddplus}::and::${noAtmos}::and::${noTruehd}`,
    M.audDdplus
  ) +
  gate(`${dd}::and::${noDdplus}::and::${noAtmos}::and::${noTruehd}`, M.audDd) +
  gate("stream.filename::~FLAC", M.audFlac) +
  gate("stream.filename::~Opus", M.audOpus) +
  gate("stream.filename::~AAC", M.audAac) +
  gate("stream.filename::~MP3", M.audMp3) +
  gate("stream.filename::~PCM", M.audPcm);

export const FORMATTER_V2_INJECT_AUDIO_CORE = AUDIO_TAG_CHAIN;

const noAudioTags = "stream.audioTags::exists::isfalse";
export const FORMATTER_V2_INJECT_AUDIO_FILENAME =
  gate(`${noAudioTags}::and::stream.filename::~Atmos`, M.audAtmos) +
  gate(`${noAudioTags}::and::stream.filename::~TrueHD`, M.audTruehd) +
  gate(`${noAudioTags}::and::stream.filename::~DDP`, M.audDdplus) +
  gate(`${noAudioTags}::and::stream.filename::~AC3`, M.audDd) +
  gate(`${noAudioTags}::and::stream.filename::~DTS-X`, M.audDtsx) +
  gate(`${noAudioTags}::and::stream.filename::~DTS-HD.MA`, M.audDtsma) +
  gate(`${noAudioTags}::and::stream.filename::~DTS-HD::and::stream.filename::~DTS-HD.MA::isfalse`, M.audDtshd) +
  gate(`${noAudioTags}::and::stream.filename::~DTS-ES`, M.audDtses) +
  gate(`${noAudioTags}::and::stream.filename::~FLAC`, M.audFlac) +
  gate(`${noAudioTags}::and::stream.filename::~Opus`, M.audOpus) +
  gate(`${noAudioTags}::and::stream.filename::~AAC`, M.audAac) +
  gate(`${noAudioTags}::and::stream.filename::~MP3`, M.audMp3) +
  gate(`${noAudioTags}::and::stream.filename::~PCM`, M.audPcm);

export const FORMATTER_V2_INJECT_AUDIO =
  FORMATTER_V2_INJECT_AUDIO_CORE + FORMATTER_V2_INJECT_AUDIO_FILENAME;

// --- v1-pattern oracle for tests (parity reference) ---

function nuvioRegex(pattern) {
  let flags = "";
  let body = pattern;
  while (body.startsWith("(?i)") || body.startsWith("(?s)")) {
    if (body.startsWith("(?i)")) {
      flags += "i";
      body = body.slice(4);
    } else if (body.startsWith("(?s)")) {
      flags += "s";
      body = body.slice(4);
    }
  }
  try {
    return new RegExp(body, flags);
  } catch {
    return null;
  }
}

function nuvioHaystacks(candidates) {
  const unique = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (unique.length <= 1) return unique;
  return [...unique, unique.join(" ")];
}

const V1_GA_PATTERNS = Object.fromEntries(
  GA_IDS.map((id) => {
    const pat = applyFilterMeta({ id, pattern: "" }).pattern;
    return [id, nuvioRegex(pat)];
  })
);

/** Badge IDs v1 would match on filename/audioTags haystacks (parity oracle). */
export function audioBadgeIdsFromFields(fields) {
  const candidates = [fields.filename, fields.audioTags].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  const hits = new Set();
  for (const h of haystacks) {
    for (const id of GA_IDS) {
      const re = V1_GA_PATTERNS[id];
      if (re?.test(h)) hits.add(id);
    }
  }
  return [...hits];
}

/**
 * Invisible marker string for ga badges (test simulation — uses v1 parity oracle).
 * @param {{ filename?: string, audioTags?: string }} fields
 */
export function buildAudioMarkers(fields) {
  const ids = audioBadgeIdsFromFields(fields);
  let out = "";
  for (const id of ids) {
    for (const m of resolveMarkerRef(BADGE_MARKERS[id])) {
      if (m && !out.includes(m)) out += m;
    }
  }
  return out;
}

export { GA_IDS };
