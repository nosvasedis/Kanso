import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { BADGE_COLORS } from "./badge-colors.mjs";
import {
  renderBfCamComposite,
  renderBfHdtvComposite,
  renderBfWebRipComposite,
} from "./bf-release-art.mjs";
import { LIGHT_ON_DARK_ICONS, OMNI_REGEX } from "./external-icons.mjs";
import { publishLocalIcon } from "./publish-local-icon.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "badges", "generated");

/** BetterFormatter channel artwork (light-on-black → inverted for white badges). */
const BF_IMAGES =
  "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images";
const BF_CHANNEL_SPEAKER = `${BF_IMAGES}/5dot1.png`;

/** Match Omni regex tag canvas (80px tall). */
const OMNI = {
  height: 80,
  padX: 18,
  contentHeight: 56,
  radius: 12,
};

const LANG = {
  height: OMNI.height,
  padX: OMNI.padX,
  radius: OMNI.radius,
  /** Fixed canvas width — flag fills this regardless of text size. */
  badgeWidth: { short: 120, medium: 128, long: 168 },
};

const RENDER_SCALE = 2;

function omniFontSize(label, { channel = false } = {}) {
  if (channel) return 74;
  const n = label.length;
  if (n <= 3) return 62;
  if (n === 4) return 54;
  if (n === 5) return 46;
  return 40;
}

function langOverlayFontSize(label) {
  const n = label.length;
  if (n <= 2) return 48;
  if (n <= 3) return 42;
  if (n <= 5) return 30;
  return 28;
}

function langOverlayStrokeWidth(label) {
  const n = label.length;
  if (n > 4) return 5 * RENDER_SCALE;
  return 4 * RENDER_SCALE;
}

function langOverlayShadowFilter() {
  const s = RENDER_SCALE;
  const dx = 2 * s;
  const dy = 2 * s;
  const blur = 2.5 * s;
  const opacity = 0.82;
  return `<filter id="langTextShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="blur"/>
      <feOffset in="blur" dx="${dx}" dy="${dy}" result="offsetBlur"/>
      <feFlood flood-color="#000000" flood-opacity="${opacity}" result="shadowColor"/>
      <feComposite in="shadowColor" in2="offsetBlur" operator="in" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`;
}

function langBadgeWidth(label) {
  const n = label.length;
  if (n <= 2) return LANG.badgeWidth.short;
  if (n <= 5) return LANG.badgeWidth.medium;
  return LANG.badgeWidth.long;
}

const LANG_ENTRIES = [
  ["l-en", "lang-en.png", "EN", "gb"],
  ["l-es", "lang-es.png", "ES", "es"],
  ["l-fr", "lang-fr.png", "FR", "fr"],
  ["l-de", "lang-de.png", "DE", "de"],
  ["l-it", "lang-it.png", "IT", "it"],
  ["l-pt-br", "lang-pt-br.png", "PT", "br"],
  ["l-pt-pt", "lang-pt-pt.png", "PT", "pt"],
  ["l-tr", "lang-tr.png", "TR", "tr"],
  ["l-pl", "lang-pl.png", "PL", "pl"],
  ["l-uk", "lang-uk.png", "UA", "ua"],
  ["l-id", "lang-id.png", "ID", "id"],
  ["l-th", "lang-th.png", "TH", "th"],
  ["l-vi", "lang-vi.png", "VI", "vn"],
  ["l-ja", "lang-ja.png", "JA", "jp"],
  ["l-ko", "lang-ko.png", "KO", "kr"],
  ["l-zh", "lang-zh.png", "ZH", "cn"],
  ["l-hi", "lang-hi.png", "HI", "in"],
  ["l-ar", "lang-ar.png", "AR", "sa"],
  ["l-ru", "lang-ru.png", "RU", "ru"],
  ["l-el", "lang-el.png", "EL", "gr"],
  ["l-mu", "lang-multi.png", "MULTI", "globe"],
];

/** @type {Array<{ id: string, file: string, label?: string, fg?: string, flag?: string, source?: string, remoteDark?: string, remoteLight?: string, channel?: boolean, logoHeight?: number }>} */
const ICON_SPECS = [
  {
    id: "seadex-release",
    file: "seadex.png",
    remoteLight: LIGHT_ON_DARK_ICONS["seadex-release"],
  },
  {
    id: "edition-directors-cut",
    file: "edition-directors-cut.png",
    label: "DCUT",
    fg: "#000000",
  },
  {
    id: "edition-extended",
    file: "edition-extended.png",
    label: "EXT",
    fg: "#000000",
  },
  {
    id: "edition-true-hue",
    file: "edition-true-hue.png",
    label: "HUE",
    fg: "#000000",
  },
  {
    id: "edition-bw",
    file: "edition-bw.png",
    label: "BW",
    fg: "#000000",
  },
  { id: "a-aac", file: "aac.png", label: "AAC", fg: "#000000" },
  { id: "a-flac", file: "flac.png", label: "FLAC", fg: "#000000" },
  { id: "a-opus", file: "opus.png", label: "OPUS", fg: "#000000" },
  { id: "a-mp3", file: "mp3.png", label: "MP3", fg: "#000000" },
  { id: "a-pcm", file: "pcm.png", label: "PCM", fg: "#000000" },
  { id: "ch-71", file: "7-1.png", bfChannelLabel: "7.1" },
  { id: "ch-61", file: "6-1.png", bfChannelLabel: "6.1" },
  { id: "ch-51", file: "5-1.png", bfChannelLabel: "5.1" },
  { id: "ch-20", file: "2-0.png", bfChannelLabel: "2.0" },
  { id: "q-wr", file: "webrip.png", bfWebRip: true },
  { id: "q-cam", file: "cam.png", bfCam: true },
  { id: "q-hdtv", file: "hdtv.png", bfHdtv: true },
  { id: "r-576", file: "576.png", label: "576p", fg: "#FFFFFF" },
  { id: "r-480", file: "480.png", label: "480p", fg: "#FFFFFF" },
  { id: "r-360", file: "360.png", label: "360p", fg: "#FFFFFF" },
  { id: "r-240", file: "240.png", label: "240p", fg: "#FFFFFF" },
  { id: "v-3d", file: "3d.png", label: "3D", fg: "#000000" },
  {
    id: "v-imax",
    file: "imax.png",
    remoteDark: `${OMNI_REGEX}/IMAXv2.PNG`,
  },
  {
    id: "v-imax-e",
    file: "imax-enhanced.png",
    source: "badges/source/imax-enhanced.png",
    logoHeight: 76,
  },
  {
    id: "v-at-dv",
    file: "atmos-dv-combo.png",
    source: "badges/source/atmos-vision-ref.png",
    lightOnBlack: true,
    padX: 12,
  },
  ...LANG_ENTRIES.map(([id, file, label, flag]) => ({
    id,
    file,
    label,
    flag,
    fg: BADGE_COLORS.language.fg,
  })),
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fitOmniCanvas(input, contentHeight = OMNI.contentHeight) {
  const padX = OMNI.padX;
  const padY = Math.max(0, Math.floor((OMNI.height - contentHeight) / 2));

  return sharp(input)
    .trim({ threshold: 10 })
    .resize({ height: contentHeight, fit: "inside" })
    .extend({
      top: padY,
      bottom: OMNI.height - contentHeight - padY,
      left: padX,
      right: padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Light-on-black reference art → dark-on-transparent for white audio fills. */
async function invertLightOnBlackBuffer(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 25) {
      data[i + 3] = 0;
      continue;
    }
    const dark = Math.max(0, Math.min(255, Math.round(255 - lum * 1.1)));
    data[i] = dark;
    data[i + 1] = dark;
    data[i + 2] = dark;
    data[i + 3] = 255;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer();
}

async function processLightOnBlack(sourcePath, contentHeight = OMNI.contentHeight, padX = OMNI.padX) {
  const inverted = await invertLightOnBlackBuffer(await fs.readFile(sourcePath));
  const padY = Math.max(0, Math.floor((OMNI.height - contentHeight) / 2));

  return sharp(inverted)
    .resize({ height: contentHeight, fit: "inside" })
    .extend({
      top: padY,
      bottom: OMNI.height - contentHeight - padY,
      left: padX,
      right: padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Locate speaker vs label columns in BetterFormatter channel art. */
async function findBfChannelRegions(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const cols = Array(w).fill(0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (data[i + 3] > 20 && lum > 30) cols[x]++;
    }
  }

  const threshold = h * 0.02;
  const active = [];
  for (let x = 0; x < w; x++) {
    if (cols[x] > threshold) active.push(x);
  }
  if (!active.length) {
    return { speakerWidth: Math.floor(w * 0.35), gap: 12, textStart: Math.floor(w * 0.4) };
  }

  let maxGap = 0;
  let gapStart = active[0];
  for (let i = 1; i < active.length; i++) {
    const gap = active[i] - active[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = active[i - 1];
    }
  }

  const speakerWidth = gapStart + 1;
  const textStart = gapStart + maxGap;
  return { speakerWidth, gap: maxGap, textStart };
}

let bfChannelLayoutCache = null;

async function getBfChannelLayout() {
  if (bfChannelLayoutCache) return bfChannelLayoutCache;

  const input = Buffer.from(await (await fetch(BF_CHANNEL_SPEAKER)).arrayBuffer());
  const meta = await sharp(input).metadata();
  const { speakerWidth, gap, textStart } = await findBfChannelRegions(input);
  const height = meta.height ?? 320;

  const speakerCrop = await sharp(input)
    .extract({ left: 0, top: 0, width: speakerWidth, height })
    .png()
    .toBuffer();
  const textCrop = await sharp(input)
    .extract({
      left: textStart,
      top: 0,
      width: Math.max(1, (meta.width ?? 1) - textStart),
      height,
    })
    .png()
    .toBuffer();

  const [speakerDark, textDark] = await Promise.all([
    invertLightOnBlackBuffer(speakerCrop),
    invertLightOnBlackBuffer(textCrop),
  ]);

  const [speakerSized, textSized] = await Promise.all([
    sharp(speakerDark).resize({ height: OMNI.contentHeight, fit: "inside" }).png().toBuffer(),
    sharp(textDark).resize({ height: OMNI.contentHeight, fit: "inside" }).png().toBuffer(),
  ]);

  const speakerMeta = await sharp(speakerSized).metadata();
  const textMeta = await sharp(textSized).metadata();
  const scaledGap = Math.max(8, Math.round(gap * (OMNI.contentHeight / height)));

  bfChannelLayoutCache = {
    speakerSized,
    speakerWidth: speakerMeta.width ?? 0,
    speakerHeight: speakerMeta.height ?? OMNI.contentHeight,
    textHeight: textMeta.height ?? OMNI.contentHeight,
    gap: scaledGap,
  };
  return bfChannelLayoutCache;
}

async function renderBfChannelLabel(label, textHeight) {
  const canvasHeight = OMNI.height * RENDER_SCALE;
  const scaledHeight = textHeight * RENDER_SCALE;
  const fontSize = Math.round(scaledHeight * 0.95);

  const textSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${canvasHeight}">
      <text x="600" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="'Arial', 'Segoe UI', Helvetica, sans-serif"
        font-size="${fontSize}" font-weight="600"
        letter-spacing="${-1 * RENDER_SCALE}"
        text-rendering="geometricPrecision"
        fill="#000000">${escapeXml(label)}</text>
    </svg>`
  );

  const trimmed = await sharp(textSvg).trim({ threshold: 1 }).png().toBuffer();
  return sharp(trimmed)
    .resize({
      height: textHeight,
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

/** Shared BetterFormatter speaker glyph + channel label (6.1, 2.0). */
async function renderBfChannelComposite(label) {
  const layout = await getBfChannelLayout();
  const textSized = await renderBfChannelLabel(label, layout.textHeight);
  const textMeta = await sharp(textSized).metadata();

  const padY = Math.max(0, Math.floor((OMNI.height - OMNI.contentHeight) / 2));
  const canvasWidth =
    OMNI.padX + layout.speakerWidth + layout.gap + (textMeta.width ?? 0) + OMNI.padX;

  return sharp({
    create: {
      width: canvasWidth,
      height: OMNI.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: layout.speakerSized,
        left: OMNI.padX,
        top: padY + Math.max(0, Math.floor((OMNI.contentHeight - layout.speakerHeight) / 2)),
      },
      {
        input: textSized,
        left: OMNI.padX + layout.speakerWidth + layout.gap,
        top:
          padY +
          Math.max(0, Math.floor((OMNI.contentHeight - (textMeta.height ?? layout.textHeight)) / 2)),
      },
    ])
    .png()
    .toBuffer();
}

/** Strip near-white backgrounds and size imported artwork for badge use. */
async function processImportedLogo(sourcePath, contentHeight = 76) {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max >= 235 && max - min <= 20) {
      data[i + 3] = 0;
    } else if (max >= 200) {
      data[i + 3] = Math.round(255 * (1 - (max - 200) / 35));
    }
  }

  const trimmed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer();

  return fitOmniCanvas(trimmed, contentHeight);
}

/** Fetch light-on-transparent artwork for dark badge backgrounds (SeaDex). */
async function processRemoteLightBadge(url) {
  const input = Buffer.from(await (await fetch(url)).arrayBuffer());
  return fitOmniCanvas(input, 56);
}

/** Fetch dark-on-transparent Omni artwork (IMAX). */
async function processRemoteDarkBadge(url) {
  const input = Buffer.from(await (await fetch(url)).arrayBuffer());
  return fitOmniCanvas(input, 56);
}

async function renderOmniTextBadge(label, fg, { channel = false } = {}) {
  const fontSize = omniFontSize(label, { channel });
  const canvasHeight = OMNI.height * RENDER_SCALE;
  const scaledFont = fontSize * RENDER_SCALE;
  const scaledPadX = OMNI.padX * RENDER_SCALE;
  const letterSpacing = channel ? -2 * RENDER_SCALE : 0;

  const textSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${canvasHeight}">
      <text x="600" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="'Arial Black', 'Segoe UI', Arial, Helvetica, sans-serif"
        font-size="${scaledFont}" font-weight="900"
        letter-spacing="${letterSpacing}"
        text-rendering="geometricPrecision"
        fill="${fg}">${escapeXml(label)}</text>
    </svg>`
  );

  const trimmed = await sharp(textSvg).trim({ threshold: 1 }).png().toBuffer();
  const { width: textWidth, height: textHeight } = await sharp(trimmed).metadata();
  const totalWidth = textWidth + scaledPadX * 2;
  const top = Math.max(0, Math.floor((canvasHeight - textHeight) / 2));

  const hiRes = await sharp({
    create: {
      width: totalWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: trimmed, left: scaledPadX, top }])
    .png()
    .toBuffer();

  return sharp(hiRes)
    .resize({
      width: Math.max(1, Math.round(totalWidth / RENDER_SCALE)),
      height: OMNI.height,
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

async function renderLangOverlayText(label, fontSize, badgeWidth, badgeHeight) {
  const scale = RENDER_SCALE;
  const canvasW = badgeWidth * scale;
  const canvasH = badgeHeight * scale;
  const scaledFont = fontSize * scale;
  const strokeWidth = langOverlayStrokeWidth(label);

  const textSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">
      <defs>${langOverlayShadowFilter()}</defs>
      <text x="600" y="300" dominant-baseline="middle" text-anchor="middle"
        filter="url(#langTextShadow)"
        font-family="'Arial Black', 'Segoe UI', Arial, Helvetica, sans-serif"
        font-size="${scaledFont}" font-weight="900"
        fill="#FFFFFF"
        stroke="#000000"
        stroke-width="${strokeWidth}"
        stroke-linejoin="round"
        paint-order="stroke fill"
        text-rendering="geometricPrecision">${escapeXml(label)}</text>
    </svg>`
  );

  const trimmed = await sharp(textSvg).trim({ threshold: 1 }).png().toBuffer();
  const maxW = Math.round(canvasW * 0.94);
  const maxH = Math.round(canvasH * 0.88);
  const bounded = await sharp(trimmed)
    .resize(maxW, maxH, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const { width: textW = 0, height: textH = 0 } = await sharp(bounded).metadata();
  const left = Math.max(0, Math.floor((canvasW - textW) / 2));
  const top = Math.max(0, Math.floor((canvasH - textH) / 2));

  const expanded = await sharp(bounded)
    .extend({
      top,
      left,
      right: Math.max(0, canvasW - left - textW),
      bottom: Math.max(0, canvasH - top - textH),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp(expanded)
    .resize(badgeWidth, badgeHeight, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

async function trimFlagAsset(flagRaw) {
  return sharp(flagRaw).trim({ threshold: 18 }).png().toBuffer();
}

/** Twemoji assets include emoji padding — zoom before stretch-fill. */
const FLAG_ZOOM = 1.9;
const CIRCLE_FLAG_ZOOM = 2.75;
const GLOBE_ZOOM = 3.2;

/** Twemoji circle flags (JP, KR) need extra zoom — emoji art doesn't bleed to edges. */
const CIRCLE_FLAG_CODES = new Set(["jp", "kr"]);

async function zoomFlagAsset(flagRaw, zoom) {
  const { width = 72, height = 72 } = await sharp(flagRaw).metadata();
  return sharp(flagRaw)
    .resize(Math.round(width * zoom), Math.round(height * zoom), {
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function prepareFlagAsset(flagRaw, flag) {
  if (flag === "globe") {
    return trimFlagAsset(flagRaw);
  }

  const trimmed = await trimFlagAsset(flagRaw);
  const zoom = CIRCLE_FLAG_CODES.has(flag) ? CIRCLE_FLAG_ZOOM : FLAG_ZOOM;
  return zoomFlagAsset(trimmed, zoom);
}

/** Stretch flag to the full badge — crops twemoji padding and side borders. */
async function renderFlagLayer(prepared, width, height) {
  return sharp(prepared)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

/** Composite foreground onto an opaque white badge canvas. */
async function compositeOnWhite(foreground, width, height) {
  const base = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  return sharp(base)
    .composite([{ input: foreground }])
    .png()
    .toBuffer();
}

async function renderFlagBackground(flagRaw, flag, width, height) {
  if (flag === "globe") {
    const prepared = await trimFlagAsset(flagRaw);
    const zoomed = await zoomFlagAsset(prepared, GLOBE_ZOOM);
    const globeFill = await renderFlagLayer(zoomed, width, height);
    return compositeOnWhite(globeFill, width, height);
  }

  const prepared = await prepareFlagAsset(flagRaw, flag);
  const cropped = await renderFlagLayer(prepared, width, height);
  return compositeOnWhite(cropped, width, height);
}

const TWEMOJI_BASE =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";

function twemojiFlagUrl(countryCode) {
  const chars = [...countryCode.toLowerCase()].map(
    (char) => (0x1f1e6 - 97 + char.charCodeAt(0)).toString(16)
  );
  return `${TWEMOJI_BASE}/${chars.join("-")}.png`;
}

async function fetchFlagBuffer(flag) {
  const url = flag === "globe" ? `${TWEMOJI_BASE}/1f310.png` : twemojiFlagUrl(flag);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch flag asset ${flag}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function renderLangBadge(spec) {
  const fontSize = langOverlayFontSize(spec.label);
  const { height } = LANG;
  const width = langBadgeWidth(spec.label);

  const [flagBackground, textOverlay] = await Promise.all([
    renderFlagBackground(await fetchFlagBuffer(spec.flag), spec.flag, width, height),
    renderLangOverlayText(spec.label, fontSize, width, height),
  ]);

  return sharp(flagBackground)
    .composite([{ input: textOverlay }])
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();
}

async function main() {
  const upload = process.argv.includes("--upload");
  const onlyLang = process.argv.includes("--lang-only");
  const onlyIdsArg = process.argv.find((arg) => arg.startsWith("--only-ids="));
  const onlyIds = onlyIdsArg ? onlyIdsArg.slice("--only-ids=".length).split(",") : null;
  await fs.mkdir(outDir, { recursive: true });

  const manifestPath = path.join(root, "badges", "icons-urls.json");
  let urls = {};
  try {
    urls = { ...(JSON.parse(await fs.readFile(manifestPath, "utf8"))), ...urls };
  } catch {
    /* start fresh */
  }

  let specs = ICON_SPECS;
  if (onlyLang) specs = specs.filter((spec) => spec.flag);
  if (onlyIds) specs = specs.filter((spec) => onlyIds.includes(spec.id));

  for (const spec of specs) {
    const filePath = path.join(outDir, spec.file);
    const pngBuffer = spec.source
      ? spec.lightOnBlack
        ? await processLightOnBlack(
            path.join(root, spec.source),
            spec.logoHeight ?? OMNI.contentHeight,
            spec.padX ?? OMNI.padX
          )
        : await processImportedLogo(
            path.join(root, spec.source),
            spec.logoHeight ?? 76
          )
      : spec.bfChannelLabel
        ? await renderBfChannelComposite(spec.bfChannelLabel)
        : spec.bfWebRip
          ? await renderBfWebRipComposite()
          : spec.bfCam
            ? await renderBfCamComposite()
            : spec.bfHdtv
              ? await renderBfHdtvComposite()
              : spec.remoteLight
                ? await processRemoteLightBadge(spec.remoteLight)
                : spec.remoteDark
                  ? await processRemoteDarkBadge(spec.remoteDark)
                  : spec.flag
                    ? await renderLangBadge(spec)
                    : await renderOmniTextBadge(spec.label, spec.fg, {
                        channel: spec.channel,
                      });
    await sharp(pngBuffer).toFile(filePath);
    const meta = await sharp(pngBuffer).metadata();
    console.log(`Generated ${spec.file} (${meta.width}x${meta.height})`);

    if (upload) {
      urls[spec.id] = await publishLocalIcon(filePath);
      console.log(`  Published -> ${urls[spec.id]}`);
    } else {
      urls[spec.id] = `badges/generated/${spec.file}`;
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(urls, null, 2));
  console.log(`Wrote ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
