/**
 * Cross-branch audio Smart Tier — Dolby vs DTS vs FLAC/Opus/AAC (kingsizew parity).
 */
import {
  AAC_SEG,
  AAC_SUPPRESS,
  DTS_ES_SEG,
  DTS_ES_SUPPRESS_DOLBY_FLAC,
  DTS_PLAIN_SEG,
  DTS_SUPPRESS_DOLBY_FLAC,
  DTSMA_SEG,
  DTSX_STACK,
  DTSHD_NOT_MA,
  FLAC_SEG,
  FLAC_SUPPRESS_DOLBY_DTSX_MA,
  OPUS_SEG,
  OPUS_SUPPRESS,
} from "./audio-cross-branch.mjs";
import { BASE as RELEASE_BASE } from "./release-guards.mjs";

export {
  DDPLUS_SUPPRESS_FLAC_DTS,
  DD_SUPPRESS_FLAC_DTS,
  DTSHD_SUPPRESS_FLAC_DOLBY,
} from "./audio-cross-branch.mjs";

export const AUDIO_CODEC_PATTERNS = {
  "a-flac": {
    name: "FLAC",
    pattern: `${RELEASE_BASE}${FLAC_SUPPRESS_DOLBY_DTSX_MA}(?=[\\s\\S]*${FLAC_SEG})`,
  },
  "a-dtses": {
    name: "DTS-ES",
    pattern: `${RELEASE_BASE}${DTS_ES_SUPPRESS_DOLBY_FLAC}(?![\\s\\S]*${DTSX_STACK})(?![\\s\\S]*${DTSMA_SEG})(?![\\s\\S]*${DTSHD_NOT_MA})(?=[\\s\\S]*${DTS_ES_SEG})`,
  },
  "a-dts": {
    name: "DTS",
    pattern: `${RELEASE_BASE}${DTS_SUPPRESS_DOLBY_FLAC}(?![\\s\\S]*${DTSX_STACK})(?![\\s\\S]*${DTSMA_SEG})(?![\\s\\S]*${DTSHD_NOT_MA})(?![\\s\\S]*${DTS_ES_SEG})(?=[\\s\\S]*${DTS_PLAIN_SEG})`,
  },
  "a-opus": {
    name: "OPUS",
    pattern: `${RELEASE_BASE}${OPUS_SUPPRESS}(?=[\\s\\S]*${OPUS_SEG})`,
  },
  "a-aac": {
    name: "AAC",
    pattern: `${RELEASE_BASE}${AAC_SUPPRESS}(?=[\\s\\S]*${AAC_SEG})`,
  },
};
