/** Dark artwork on transparent — for light badge fills (white / yellow). */
export const OMNI_REGEX =
  "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/regex%20tags";

const BF_IMAGES =
  "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images";

/** filter id -> imageURL (dark-on-transparent Omni regex tags) */
export const EXTERNAL_IMAGES = {
  "r-4k": `${BF_IMAGES}/4k.png`,
  // Visual
  "v-hdr10p": `${OMNI_REGEX}/HDR10Plus.png`,
  "v-hdr10": `${OMNI_REGEX}/HDR10.png`,
  "v-hdr": `${OMNI_REGEX}/HDR.png`,
  "v-sdr": `${OMNI_REGEX}/sdr.png`,
  "a-dv": `${OMNI_REGEX}/DV.png`,

  // Audio
  "a-dtsx": `${OMNI_REGEX}/dtsx.png`,
  "a-dtsma": `${OMNI_REGEX}/dtsHDMA.png`,
  "a-dtshd": `${OMNI_REGEX}/dtsHD.png`,
  "a-dts": `${OMNI_REGEX}/dts.png`,
  "a-at": `${OMNI_REGEX}/Atmos.png`,
  "a-th": `${OMNI_REGEX}/TrueHD.png`,
  "a-dp": `${OMNI_REGEX}/DDPLUS.png`,
  "a-dd": `${OMNI_REGEX}/DD.png`,

  // Channels — generated from BetterFormatter art (see generate-icons.mjs)
};

export const KINGSIZE_ICON_IDS = new Set([
  "v-dv-hdr10p",
  "v-dv-hdr10",
  "v-dv-hdr",
  "a-at-th",
  "a-at-dp",
  "a-dtsx-ma",
  "a-dtsx-hd",
  "a-dtses",
  "v-hlg",
  "v-10bit",
  "v-ai",
  "seadex-release",
  "hybrid-release",
  "criterion-collection",
  "proper-release",
  "repack-release",
  "remastered-release",
  "open-matte-edition",
  "regraded-release",
  "edition-directors-cut",
  "edition-extended",
  "uncut-edition",
  "uncensored-edition",
  "edition-theatrical",
  "edition-bw",
  "edition-true-hue",
  "r-1440",
]);

/** Generated/hosted icons always win over stale filter imageURL values. */
export const GENERATED_ICON_IDS = new Set([
  "v-at-dv",
  ...KINGSIZE_ICON_IDS,
  "seadex-release",
  "edition-directors-cut",
  "edition-extended",
  "edition-true-hue",
  "edition-bw",
  "a-aac",
  "a-flac",
  "a-opus",
  "a-mp3",
  "a-pcm",
  "ch-71",
  "ch-61",
  "ch-51",
  "ch-20",
  "q-wr",
  "q-cam",
  "q-hdtv",
  "r-576",
  "r-480",
  "r-360",
  "r-240",
  "v-3d",
  "v-imax",
  "v-imax-e",
  "l-en",
  "l-es",
  "l-fr",
  "l-de",
  "l-it",
  "l-pt-br",
  "l-pt-pt",
  "l-tr",
  "l-pl",
  "l-uk",
  "l-id",
  "l-th",
  "l-vi",
  "l-ja",
  "l-ko",
  "l-zh",
  "l-hi",
  "l-ar",
  "l-ru",
  "l-el",
  "l-mu",
]);

/** Light artwork for dark badge fills (e.g. SeaDex on black). */
export const LIGHT_ON_DARK_ICONS = {
  "seadex-release":
    "https://raw.githubusercontent.com/nobnobz/Omni-Template-Bot-Bid-Raiser/main/Other/white%20regex%20tags/white_SEADEX.png",
};
