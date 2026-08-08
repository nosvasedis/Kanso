/**
 * Language badge rendering — shared logic for normal + mono icon pipelines.
 * Mono: cover-crop (no white plate / corner paint) so edges are real flag pixels, not arcs.
 */
import sharp from "sharp";

const LANG = {
  height: 80,
  badgeWidth: { short: 120, medium: 128, long: 168 },
};

const RENDER_SCALE = 2;
const TWEMOJI_72 =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";
/** Tiny cover boost — trims twemoji rounded plate without heavy crop. */
const MONO_FLAG_COVER = 1.06;

const FLAG_ZOOM = 1.9;
const CIRCLE_FLAG_ZOOM = 2.75;
const GLOBE_ZOOM = 3.2;
/** Mono MULTI — large globe behind label (taller than MULTI text, fits in badge). */
const GLOBE_ZOOM_MONO = 3.15;
/** Max sphere height vs badge (fit-inside keeps full circle off canvas edges). */
const GLOBE_MONO_HEIGHT_RATIO = 0.97;
/** Hi-res mono badge render → downscale for smooth flags/text. */
const MONO_BADGE_SCALE = 2;

const CIRCLE_FLAG_CODES = new Set(["jp", "kr"]);

/** @type {Array<{ id: string, file: string, label: string, flag: string }>} */
export const LANG_BADGE_SPECS = [
  { id: "l-en", file: "lang-en.png", label: "EN", flag: "gb" },
  { id: "l-es", file: "lang-es.png", label: "ES", flag: "es" },
  { id: "l-fr", file: "lang-fr.png", label: "FR", flag: "fr" },
  { id: "l-de", file: "lang-de.png", label: "DE", flag: "de" },
  { id: "l-it", file: "lang-it.png", label: "IT", flag: "it" },
  { id: "l-pt-br", file: "lang-pt-br.png", label: "PT", flag: "br" },
  { id: "l-pt-pt", file: "lang-pt-pt.png", label: "PT", flag: "pt" },
  { id: "l-tr", file: "lang-tr.png", label: "TR", flag: "tr" },
  { id: "l-pl", file: "lang-pl.png", label: "PL", flag: "pl" },
  { id: "l-uk", file: "lang-uk.png", label: "UA", flag: "ua" },
  { id: "l-id", file: "lang-id.png", label: "ID", flag: "id" },
  { id: "l-th", file: "lang-th.png", label: "TH", flag: "th" },
  { id: "l-vi", file: "lang-vi.png", label: "VI", flag: "vn" },
  { id: "l-ja", file: "lang-ja.png", label: "JA", flag: "jp" },
  { id: "l-ko", file: "lang-ko.png", label: "KO", flag: "kr" },
  { id: "l-zh", file: "lang-zh.png", label: "ZH", flag: "cn" },
  { id: "l-hi", file: "lang-hi.png", label: "HI", flag: "in" },
  { id: "l-ar", file: "lang-ar.png", label: "AR", flag: "sa" },
  { id: "l-ru", file: "lang-ru.png", label: "RU", flag: "ru" },
  { id: "l-el", file: "lang-el.png", label: "EL", flag: "gr" },
  { id: "l-mu", file: "lang-multi.png", label: "MULTI", flag: "globe" },
];

export function langSpecById(id) {
  const spec = LANG_BADGE_SPECS.find((s) => s.id === id);
  if (!spec) throw new Error(`Unknown language badge id: ${id}`);
  return spec;
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

async function renderLangOverlayText(
  label,
  fontSize,
  badgeWidth,
  badgeHeight,
  { outputWidth = badgeWidth, outputHeight = badgeHeight } = {}
) {
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

  const { data, info } = await sharp(expanded)
    .resize(outputWidth, outputHeight, { kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

async function trimFlagAsset(flagRaw) {
  return sharp(flagRaw).trim({ threshold: 18 }).png().toBuffer();
}

async function zoomFlagAsset(flagRaw, zoom) {
  const { width = 72, height = 72 } = await sharp(flagRaw).metadata();
  return sharp(flagRaw)
    .resize(Math.round(width * zoom), Math.round(height * zoom), {
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function prepareFlagAsset(flagRaw, flag, { globeZoom, monoGlobe = false } = {}) {
  if (flag === "globe" && monoGlobe) {
    return prepareMonoGlobeAsset(flagRaw);
  }
  const trimmed = await trimFlagAsset(flagRaw);
  if (flag === "globe") {
    return zoomFlagAsset(trimmed, globeZoom ?? GLOBE_ZOOM);
  }
  const zoom = CIRCLE_FLAG_CODES.has(flag) ? CIRCLE_FLAG_ZOOM : FLAG_ZOOM;
  return zoomFlagAsset(trimmed, zoom);
}

/** Twemoji 🌐 — light margin so poles are not flush with tile edge, then zoom. */
async function prepareMonoGlobeAsset(flagRaw) {
  const { width = 72, height = 72 } = await sharp(flagRaw).metadata();
  const p = 5;
  const padded = await sharp(flagRaw)
    .extend({
      top: p,
      bottom: p,
      left: p,
      right: p,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return zoomFlagAsset(padded, GLOBE_ZOOM_MONO);
}

/**
 * Large centred globe on l-mu — nearly full badge height so it extends above/below MULTI.
 * fit-inside (not cover) keeps the sphere from being cropped at the pill edges.
 */
async function renderMonoGlobeBackground(prepared, width, height) {
  const globeH = Math.max(1, Math.round(height * GLOBE_MONO_HEIGHT_RATIO));
  const fitted = await sharp(prepared)
    .resize({ height: globeH, fit: "inside", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const { width: gw = globeH, height: gh = globeH } = await sharp(fitted).metadata();
  const left = Math.floor((width - gw) / 2);
  const top = Math.floor((height - gh) / 2);
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, left, top }])
    .png()
    .toBuffer();
}

function twemojiFlagUrl(countryCode) {
  const chars = [...countryCode.toLowerCase()].map(
    (char) => (0x1f1e6 - 97 + char.charCodeAt(0)).toString(16)
  );
  return `${TWEMOJI_72}/${chars.join("-")}.png`;
}

export async function fetchFlagBuffer(flag) {
  const url =
    flag === "globe" ? `${TWEMOJI_72}/1f310.png` : twemojiFlagUrl(flag);
  const response = await fetch(url, {
    headers: { "User-Agent": "nosvasedis-lang-badges/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch flag ${flag}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Normal badges — stretch-fill on white plate (twemoji may show soft corner arcs). */
async function renderFlagBackground(flagRaw, flag, width, height) {
  const prepared = await prepareFlagAsset(flagRaw, flag);
  const cropped = await sharp(prepared)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

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

  return sharp(base).composite([{ input: cropped }]).png().toBuffer();
}

/**
 * Mono language icons — centre cover-crop (no white plate, no painted square corners).
 * Slightly oversize then crop so twemoji’s rounded mask is trimmed with real flag pixels.
 */
async function renderMonoFlagBackground(flagRaw, flag, width, height) {
  if (flag === "globe") {
    const prepared = await prepareFlagAsset(flagRaw, flag, { monoGlobe: true });
    return renderMonoGlobeBackground(prepared, width, height);
  }
  const prepared = await prepareFlagAsset(flagRaw, flag);
  const { width: pw = 72, height: ph = 72 } = await sharp(prepared).metadata();
  const scale =
    MONO_FLAG_COVER * Math.max(width / pw, height / ph);
  const enlarged = await sharp(prepared)
    .resize(Math.round(pw * scale), Math.round(ph * scale), {
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
  return sharp(enlarged)
    .resize(width, height, {
      fit: "cover",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function renderLangBadge(spec) {
  const fontSize = langOverlayFontSize(spec.label);
  const height = LANG.height;
  const width = langBadgeWidth(spec.label);
  const flagRaw = await fetchFlagBuffer(spec.flag);

  const [flagBackground, textOverlay] = await Promise.all([
    renderFlagBackground(flagRaw, spec.flag, width, height),
    renderLangOverlayText(spec.label, fontSize, width, height),
  ]);

  return sharp(flagBackground)
    .composite([{ input: textOverlay }])
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();
}

/** Mono language icons — 2× supersample, cover-crop flag, same text styling as normal. */
export async function renderLangBadgeFullRect(spec) {
  const fontSize = langOverlayFontSize(spec.label);
  const width = langBadgeWidth(spec.label);
  const height = LANG.height;
  const hiW = width * MONO_BADGE_SCALE;
  const hiH = height * MONO_BADGE_SCALE;
  const flagRaw = await fetchFlagBuffer(spec.flag);

  const flagHi = await renderMonoFlagBackground(flagRaw, spec.flag, hiW, hiH);
  const textHi = await renderLangOverlayText(spec.label, fontSize, width, height, {
    outputWidth: hiW,
    outputHeight: hiH,
  });
  const merged = await sharp(flagHi)
    .composite([{ input: textHi }])
    .png()
    .toBuffer();
  return sharp(merged)
    .resize(width, height, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();
}
