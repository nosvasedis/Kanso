/**
 * Language formatter inject — prefer media-info stream.languages when present;
 * filename gates only when languages is empty/null.
 *
 * AIOStreams 2.32 nested conditionals encode prefer/fallback in one block:
 *   {languages::exists["{languages::~Tok[M||]}"||"{filename::~Tok[M||]}"]}
 */
import { LANGUAGE_MARKERS } from "./formatter-markers.mjs";
import { MONO_FILTER_ORDER } from "./badge-transparent-theme.mjs";
import { BADGE_MARKERS, resolveMarkerRef } from "./formatter-markers.mjs";
import { LANGUAGE_BADGE_PATTERNS } from "./language-patterns.mjs";

const GL_IDS = MONO_FILTER_ORDER.gl;

/**
 * Canonical AIOStreams PARSE_REGEX.languages names for stream.languages::~…
 * @type {Record<string, string[]>}
 */
export const LANGUAGE_ARRAY_TOKENS = {
  "l-en": ["English"],
  "l-es": ["Spanish", "Latino"],
  "l-fr": ["French"],
  "l-de": ["German"],
  "l-it": ["Italian"],
  "l-pt-br": ["Portuguese (Brazil)"],
  "l-pt-pt": ["Portuguese"],
  "l-tr": ["Turkish"],
  "l-pl": ["Polish"],
  "l-uk": ["Ukrainian"],
  "l-id": ["Indonesian"],
  "l-th": ["Thai"],
  "l-vi": ["Vietnamese"],
  "l-ja": ["Japanese"],
  "l-ko": ["Korean"],
  "l-zh": ["Chinese"],
  "l-hi": ["Hindi"],
  "l-ar": ["Arabic"],
  "l-ru": ["Russian"],
  "l-el": ["Greek"],
  "l-mu": ["Multi", "Dual Audio"],
};

/**
 * Compact filename fallbacks (literal substring tokens — AIOStreams `~` is
 * String/Array.includes, not RegExp).
 * @type {Record<string, string[]>}
 */
export const LANGUAGE_FILENAME_TOKENS = {
  "l-en": ["English", ".Eng."],
  "l-es": ["Spanish", "Latino"],
  "l-fr": ["French", ".VFF"],
  "l-de": ["German", ".GER."],
  "l-it": ["Italian", ".ITA."],
  "l-pt-br": ["PT-BR", "Portuguese-Brazil"],
  "l-pt-pt": ["PT-PT", "Portuguese"],
  "l-tr": ["Turkish", ".TUR."],
  "l-pl": ["Polish", ".POL."],
  "l-uk": ["Ukrainian", ".UKR."],
  "l-id": ["Indonesian", ".IND."],
  "l-th": ["Thai", ".THA."],
  "l-vi": ["Vietnamese", ".VIE."],
  "l-ja": ["Japanese", ".JPN"],
  "l-ko": ["Korean", ".KOR."],
  "l-zh": ["Chinese", "Mandarin"],
  "l-hi": ["Hindi", ".HIN."],
  "l-ar": ["Arabic", ".ARA."],
  "l-ru": ["Russian", ".RUS."],
  "l-el": ["Greek", ".ELL."],
  "l-mu": ["MULTi", "Dual.Audio"],
};

/** @deprecated filename OR string — prefer LANGUAGE_FILENAME_TOKENS */
export const LANGUAGE_FILENAME_CONDITIONS = Object.fromEntries(
  Object.entries(LANGUAGE_FILENAME_TOKENS).map(([id, tokens]) => [
    id,
    tokens.map((t) => `stream.filename::~${t}`).join("::or::"),
  ])
);

/** @param {string} id */
export function languageInjectGates(id) {
  const fileTokens = LANGUAGE_FILENAME_TOKENS[id];
  const tokens = LANGUAGE_ARRAY_TOKENS[id];
  const marker = LANGUAGE_MARKERS[id];
  if (!fileTokens?.length || !tokens?.length || !marker) return "";

  let out = "";
  // Pair media-info token with filename fallback via nesting when indices align;
  // extra filename-only tokens stay as languages-empty gates.
  const n = Math.max(tokens.length, fileTokens.length);
  for (let i = 0; i < n; i++) {
    const mediaTok = tokens[i];
    const fileTok = fileTokens[i];
    if (mediaTok && fileTok) {
      let mediaCond = `stream.languages::~${mediaTok}`;
      if (id === "l-pt-pt") {
        mediaCond += `::and::stream.languages::~Portuguese (Brazil)::isfalse`;
      }
      out += `{stream.languages::exists["{${mediaCond}["${marker}"||""]}"||"{stream.filename::~${fileTok}["${marker}"||""]}"]}`;
    } else if (mediaTok) {
      let mediaCond = `stream.languages::exists::and::stream.languages::~${mediaTok}`;
      if (id === "l-pt-pt") {
        mediaCond += `::and::stream.languages::~Portuguese (Brazil)::isfalse`;
      }
      out += `{${mediaCond}["${marker}"||""]}`;
    } else if (fileTok) {
      out += `{stream.languages::exists::isfalse::and::stream.filename::~${fileTok}["${marker}"||""]}`;
    }
  }
  return out;
}

let inject = "";
for (const id of GL_IDS) {
  inject += languageInjectGates(id);
}

export const FORMATTER_V2_INJECT_LANGUAGES = inject;

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

const v1Language = Object.fromEntries(
  GL_IDS.map((id) => [id, nuvioRegex(LANGUAGE_BADGE_PATTERNS[id])])
);

/**
 * @param {{ filename?: string, languages?: string[] | null }} fields
 */
export function languageBadgeIdsFromFields(fields) {
  const langs = Array.isArray(fields.languages)
    ? fields.languages.filter((l) => typeof l === "string" && l.trim())
    : [];

  if (langs.length) {
    const hits = new Set();
    const lower = langs.map((l) => l.toLowerCase());
    const has = (token) => lower.some((l) => l.includes(token.toLowerCase()));
    for (const id of GL_IDS) {
      const tokens = LANGUAGE_ARRAY_TOKENS[id];
      if (!tokens?.length) continue;
      if (id === "l-pt-pt") {
        if (has("Portuguese") && !has("Portuguese (Brazil)")) hits.add(id);
        continue;
      }
      if (tokens.some((t) => has(t))) hits.add(id);
    }
    return [...hits];
  }

  const candidates = [fields.filename].filter(Boolean);
  const haystacks = nuvioHaystacks(candidates);
  const hits = new Set();
  for (const h of haystacks) {
    for (const id of GL_IDS) {
      if (v1Language[id]?.test(h)) hits.add(id);
    }
  }
  return [...hits];
}

/** Inject simulator for tests. @param {{ filename?: string, languages?: string[] | null }} fields */
export function buildLanguageMarkersSync(fields) {
  const ids = languageBadgeIdsFromFields(fields);
  let out = "";
  for (const id of ids) {
    for (const m of resolveMarkerRef(BADGE_MARKERS[id])) {
      if (m && !out.includes(m)) out += m;
    }
  }
  return out;
}

export { GL_IDS };
