/**
 * Edition detection for formatter inject + ANY_FLAG (badges own visible display).
 * Keep expressions short — description must stay under 5000 chars.
 */
// `editions` is nullable. Applying `::remove(...)` before a conditional makes
// AIOStreams resolve undefined on streams without parsed editions, which then
// leaks cannot_coerce_boolean errors through the mixed OR chains below.
// These checks only look for edition names unrelated to IMAX, so direct array
// containment is both equivalent and null-safe.
export const EDITIONS_BASE = "stream.editions";

/** Parsed editions + filename/folder fallbacks (compact). */
export const DC_HIT =
  `${EDITIONS_BASE}::~Director::or::stream.filename::~Director`;

export const EXT_HIT =
  `${EDITIONS_BASE}::~Extended::or::stream.filename::~Extended Cut::or::stream.filename::~Extended Edition`;

export const HUE_HIT =
  `${EDITIONS_BASE}::~True-Hue::or::stream.filename::~True-Hue::or::stream.filename::~COLORIZED`;

export const BW_HIT =
  `${EDITIONS_BASE}::~Authentic::or::stream.filename::~.BW.`;

/** @deprecated Tests only — prefer DC_HIT. */
export const DC_FF = "stream.filename::~Director::or::stream.folderName::~Director";
/** @deprecated Tests only — prefer EXT_HIT. */
export const EXT_FF =
  "stream.filename::~Extended Cut::or::stream.filename::~Extended Edition::or::stream.folderName::~Extended";
/** @deprecated Tests only — prefer HUE_HIT. */
export const HUE_FF = "stream.filename::~True-Hue::or::stream.folderName::~True-Hue";
/** @deprecated Tests only — prefer BW_HIT. */
export const BW_FF = "stream.filename::~Authentic BW::or::stream.folderName::~Authentic";
