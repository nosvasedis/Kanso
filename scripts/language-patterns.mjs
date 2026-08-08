/**
 * Language badge patterns aligned with AIOStreams PARSE_REGEX.languages
 * (packages/core/src/parser/regex.ts — createLanguageRegex boundaries).
 *
 * Badges match language/audio (stream.languages + filename). Greek softsubs are
 * a separate formatter cue (ELˢ on the release row), not a subtitle badge.
 */

/** Delimiter-bounded token — avoids eng in danger, fra in FrameSTOR, etc. */
export function aioLanguageToken(patternBody) {
  return `(?<![^\\s\\[(_\\-.,])(${patternBody})(?![ .\\-_]?sub(title)?s?)(?=[\\s\\)\\]_.\\-,]|$)`;
}

export function aioLanguagePattern(...parts) {
  return `(?i)${parts.join("|")}`;
}

/** @type {Record<string, string>} */
export const LANGUAGE_BADGE_PATTERNS = {
  "l-en": aioLanguagePattern(aioLanguageToken("english|eng")),
  "l-es": aioLanguagePattern(
    aioLanguageToken("spanish|spa|esp|latino|lat")
  ),
  "l-fr": aioLanguagePattern(
    aioLanguageToken("french|fra|fr|vf|vff|vfi|vf2|vfq|truefrench")
  ),
  "l-de": aioLanguagePattern(
    aioLanguageToken("deu(?:tsch)?(?:land)?|ger(?:man)?|german")
  ),
  "l-it": aioLanguagePattern(aioLanguageToken("italian|ita")),
  "l-pt-br": aioLanguagePattern(
    aioLanguageToken("portuguese[ .\\-_]?brazil|pt[ .\\-_]?br|brazilian")
  ),
  "l-pt-pt": aioLanguagePattern(
    aioLanguageToken(
      "portuguese(?!(?:[ .\\-_]?brazil))|portuguese[ .\\-_]?(?:portugal|europe(?:an)?)|pt[ .\\-_]?pt"
    )
  ),
  "l-tr": aioLanguagePattern(aioLanguageToken("turkish|tur")),
  "l-pl": aioLanguagePattern(aioLanguageToken("polish|pol")),
  "l-uk": aioLanguagePattern(aioLanguageToken("ukrainian|ukr")),
  "l-id": aioLanguagePattern(aioLanguageToken("indonesian|ind")),
  "l-th": aioLanguagePattern(aioLanguageToken("thai|tha")),
  "l-vi": aioLanguagePattern(aioLanguageToken("vietnamese|vie")),
  "l-ja": aioLanguagePattern(
    aioLanguageToken("japanese|jap|jpn"),
    "[぀-ゟ゠-ヿ]{3,}"
  ),
  "l-ko": aioLanguagePattern(
    aioLanguageToken("korean|kor"),
    "[가-힯]{3,}"
  ),
  "l-zh": aioLanguagePattern(
    aioLanguageToken("chinese|chi|zho|mandarin|cantonese"),
    "[一-鿿]{3,}"
  ),
  "l-hi": aioLanguagePattern(
    aioLanguageToken("hindi|hin"),
    "[ऀ-ॿ]{3,}"
  ),
  "l-ar": aioLanguagePattern(
    aioLanguageToken("arabic|ara"),
    "[؀-ۿ]{3,}"
  ),
  "l-ru": aioLanguagePattern(
    aioLanguageToken("russian|rus"),
    "[Ѐ-ӿ]{3,}"
  ),
  "l-el": aioLanguagePattern(
    aioLanguageToken("greek|ellinika|hellenic|grec|ell|gre"),
    "[\\u0370-\\u03FF\\u1F00-\\u1FFF]{3,}"
  ),
  "l-mu": aioLanguagePattern(
    aioLanguageToken("multi"),
    aioLanguageToken("dual[ .\\-_]?(?:audio|lang(?:uage)?|flac|ac3|aac2?)")
  ),
};
