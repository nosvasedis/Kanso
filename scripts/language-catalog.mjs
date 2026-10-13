/**
 * Language + subtitle inventory. Kingsize supplies the glyphs; Kanso ids and
 * Instant markers stay local. Tokens are AIOStreams PARSE_REGEX language names.
 */
export const LANGUAGE_CATALOG = [
  { id: "l-en", name: "EN", file: "english", tokens: ["English"] },
  { id: "l-es", name: "ES", file: "spanish", tokens: ["Spanish"] },
  { id: "l-lat", name: "LAT", file: "latino", tokens: ["Latino"] },
  { id: "l-fr", name: "FR", file: "french", tokens: ["French"] },
  { id: "l-de", name: "DE", file: "german", tokens: ["German"] },
  { id: "l-it", name: "IT", file: "italian", tokens: ["Italian"] },
  { id: "l-pt-br", name: "PT-BR", file: "portuguese-brazil", tokens: ["Portuguese (Brazil)"] },
  { id: "l-pt-pt", name: "PT", file: "portuguese", tokens: ["Portuguese"] },
  { id: "l-tr", name: "TR", file: "turkish", tokens: ["Turkish"] },
  { id: "l-pl", name: "PL", file: "polish", tokens: ["Polish"] },
  { id: "l-uk", name: "UK", file: "ukrainian", tokens: ["Ukrainian"] },
  { id: "l-id", name: "ID", file: "indonesian", tokens: ["Indonesian"] },
  { id: "l-th", name: "TH", file: "thai", tokens: ["Thai"] },
  { id: "l-vi", name: "VI", file: "vietnamese", tokens: ["Vietnamese"] },
  { id: "l-ja", name: "JA", file: "japanese", tokens: ["Japanese"] },
  { id: "l-ko", name: "KO", file: "korean", tokens: ["Korean"] },
  { id: "l-zh", name: "ZH", file: "chinese", tokens: ["Chinese"] },
  { id: "l-hi", name: "HI", file: "hindi", tokens: ["Hindi"] },
  { id: "l-ar", name: "AR", file: "arabic", tokens: ["Arabic"] },
  { id: "l-ru", name: "RU", file: "russian", tokens: ["Russian"] },
  { id: "l-el", name: "EL", file: "greek", tokens: ["Greek"] },
  { id: "l-sv", name: "SV", file: "swedish", tokens: ["Swedish"] },
  { id: "l-nl", name: "NL", file: "dutch", tokens: ["Dutch"] },
  { id: "l-da", name: "DA", file: "danish", tokens: ["Danish"] },
  { id: "l-no", name: "NO", file: "norwegian", tokens: ["Norwegian"] },
  { id: "l-fi", name: "FI", file: "finnish", tokens: ["Finnish"] },
  { id: "l-cs", name: "CS", file: "czech", tokens: ["Czech"] },
  { id: "l-sk", name: "SK", file: "slovak", tokens: ["Slovak"] },
  { id: "l-hu", name: "HU", file: "hungarian", tokens: ["Hungarian"] },
  { id: "l-ro", name: "RO", file: "romanian", tokens: ["Romanian"] },
  { id: "l-bg", name: "BG", file: "bulgarian", tokens: ["Bulgarian"] },
  { id: "l-hr", name: "HR", file: "croatian", tokens: ["Croatian"] },
  { id: "l-sr", name: "SR", file: "serbian", tokens: ["Serbian"] },
  { id: "l-sl", name: "SL", file: "slovenian", tokens: ["Slovenian"] },
  { id: "l-et", name: "ET", file: "estonian", tokens: ["Estonian"] },
  { id: "l-lv", name: "LV", file: "latvian", tokens: ["Latvian"] },
  { id: "l-lt", name: "LT", file: "lithuanian", tokens: ["Lithuanian"] },
  { id: "l-he", name: "HE", file: "hebrew", tokens: ["Hebrew"] },
  { id: "l-fa", name: "FA", file: "persian", tokens: ["Persian"] },
  { id: "l-ms", name: "MS", file: "malay", tokens: ["Malay"] },
  { id: "l-bn", name: "BN", file: "bengali", tokens: ["Bengali"] },
  { id: "l-ta", name: "TA", file: "tamil", tokens: ["Tamil"] },
  { id: "l-te", name: "TE", file: "telugu", tokens: ["Telugu"] },
  { id: "l-ml", name: "ML", file: "malayalam", tokens: ["Malayalam"] },
  { id: "l-kn", name: "KN", file: "kannada", tokens: ["Kannada"] },
  { id: "l-mr", name: "MR", file: "marathi", tokens: ["Marathi"] },
  { id: "l-gu", name: "GU", file: "gujarati", tokens: ["Gujarati"] },
  { id: "l-pa", name: "PA", file: "punjabi", tokens: ["Punjabi"] },
];

export const LANGUAGE_BADGE_IDS = LANGUAGE_CATALOG.map((l) => l.id);
export const SUBTITLE_BADGE_IDS = LANGUAGE_CATALOG.map((l) => `sub-${l.id.slice(2)}`);

export function subtitleIdForLanguage(languageId) {
  return `sub-${languageId.slice(2)}`;
}

/** Longest AIOStreams names first so Portuguese (Brazil) wins over Portuguese. */
export function languageReplaceEntries() {
  return [...LANGUAGE_CATALOG]
    .sort((a, b) => b.tokens[0].length - a.tokens[0].length)
    .flatMap((l) => l.tokens.map((token) => [token, l.id]));
}
