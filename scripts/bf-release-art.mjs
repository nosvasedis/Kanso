/**
 * BetterFormatter release artwork — WebRip composite; Remux/Blu-ray/WebDL use BF mono-* sources as-is.
 */
import sharp from "sharp";

const BF_IMAGES =
  "https://raw.githubusercontent.com/9mousaa/BetterFormatter/main/images";

export const BF_MONO_BLURAY = `${BF_IMAGES}/mono-bluray.png`;
export const BF_MONO_WEBDL = `${BF_IMAGES}/mono-webdl.png`;
export const BF_MONO_REMUX = `${BF_IMAGES}/mono-remux.png`;

/** Shared BF release canvas (mono-webdl layout). */
export const BF_RELEASE = {
  height: 320,
  canvasWidth: 1228,
  discWidth: 256,
  textX: 323,
  baselineY: 255,
  fontSize: 210,
  letterSpacing: -8,
  /** Extra height for WebRip label vs WebDL reference ink. */
  webRipExtraHeight: 20,
  /** Scale WebRip text slightly to match WebDL optical size on solid pills. */
  webRipScale: 1.08,
  /** Right margin so WebRip “p” descender is not clipped on composite canvas. */
  canvasPadRight: 56,
};

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function measureInkBounds(buffer, { minX = 0, maxX } = {}) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const xEnd = maxX ?? info.width;
  let minY = info.height;
  let maxY = 0;
  let minXInk = info.width;
  let maxXInk = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = minX; x < xEnd && x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] > 20 && data[i] > 128) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minXInk = Math.min(minXInk, x);
        maxXInk = Math.max(maxXInk, x);
      }
    }
  }
  if (minY > maxY) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centroidY: 0 };
  }
  let sumY = 0;
  let count = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = minX; x < xEnd && x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] > 20 && data[i] > 128) {
        sumY += y;
        count++;
      }
    }
  }
  return {
    minX: minXInk,
    maxX: maxXInk,
    minY,
    maxY,
    width: maxXInk - minXInk + 1,
    height: maxY - minY + 1,
    centroidY: count ? sumY / count : minY,
  };
}

let bfWebReferenceCache = null;
let bfWebGlobeCache = null;

async function fetchBf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function getBfWebReferenceLayout() {
  if (bfWebReferenceCache) return bfWebReferenceCache;
  const input = await fetchBf(BF_MONO_WEBDL);
  const textInk = await measureInkBounds(input, { minX: BF_RELEASE.textX });
  bfWebReferenceCache = { textInk, textCentroidY: textInk.centroidY };
  return bfWebReferenceCache;
}

export async function getBfWebGlobe() {
  if (bfWebGlobeCache) return bfWebGlobeCache;
  const input = await fetchBf(BF_MONO_WEBDL);
  bfWebGlobeCache = await sharp(input)
    .extract({
      left: 0,
      top: 0,
      width: BF_RELEASE.discWidth,
      height: BF_RELEASE.height,
    })
    .png()
    .toBuffer();
  return bfWebGlobeCache;
}

/**
 * @param {string} label
 * @param {{ textInk: object, textCentroidY: number }} ref
 * @param {{ webRip?: boolean }} [opts]
 */
async function renderBfReleaseText(label, ref, opts = {}) {
  const isWebRip = opts.webRip === true;
  let inkHeight = ref.textInk.height;
  if (isWebRip) {
    inkHeight = Math.round(
      (ref.textInk.height + BF_RELEASE.webRipExtraHeight) * BF_RELEASE.webRipScale
    );
  }

  const full = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${BF_RELEASE.height}">
        <text x="0" y="${BF_RELEASE.baselineY}" dominant-baseline="alphabetic"
          font-family="'Arial Black', 'Segoe UI', Arial, Helvetica, sans-serif"
          font-size="${BF_RELEASE.fontSize}" font-weight="900"
          letter-spacing="${BF_RELEASE.letterSpacing}"
          text-rendering="geometricPrecision"
          fill="#FFFFFF">${escapeXml(label)}</text>
      </svg>`
    )
  )
    .png()
    .toBuffer();

  const trimmed = await sharp(full).trim({ threshold: 1 }).png().toBuffer();
  const scaled = await sharp(trimmed).resize({ height: inkHeight }).png().toBuffer();
  const ink = await measureInkBounds(scaled);
  const { width = 0 } = await sharp(scaled).metadata();

  const top = isWebRip
    ? Math.round(ref.textCentroidY - ink.centroidY)
    : ref.textInk.minY;

  return { buffer: scaled, width, top };
}

function compositeRelease(disc, text) {
  const width = Math.max(
    BF_RELEASE.canvasWidth,
    BF_RELEASE.textX + text.width + BF_RELEASE.canvasPadRight
  );
  return sharp({
    create: {
      width,
      height: BF_RELEASE.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: disc, left: 0, top: 0 },
      { input: text.buffer, left: BF_RELEASE.textX, top: text.top },
    ])
    .png()
    .toBuffer();
}

/** Globe + WebRip (matches WebDL metrics). */
export async function renderBfWebRipComposite() {
  const ref = await getBfWebReferenceLayout();
  const [globe, text] = await Promise.all([
    getBfWebGlobe(),
    renderBfReleaseText("WebRip", ref, { webRip: true }),
  ]);
  return compositeRelease(globe, text);
}

/** Small white glyph in the BF disc slot (left of release label). */
async function renderReleaseDiscGlyph(innerSvg, size = 172) {
  const left = Math.round((BF_RELEASE.discWidth - size) / 2);
  const top = Math.round((BF_RELEASE.height - size) / 2) - 6;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BF_RELEASE.discWidth}" height="${BF_RELEASE.height}">
      <g transform="translate(${left}, ${top}) scale(${size / 200})">
        <svg width="200" height="200" viewBox="0 0 200 200">${innerSvg}</svg>
      </g>
    </svg>`
  );
  return sharp(svg).png().toBuffer();
}

const BF_CAM_GLYPH = `
  <rect x="18" y="78" width="108" height="72" rx="14" fill="#FFFFFF"/>
  <path d="M58 78 L78 48 L98 78 Z" fill="#FFFFFF"/>
  <circle cx="152" cy="114" r="40" fill="none" stroke="#FFFFFF" stroke-width="14"/>
  <circle cx="152" cy="114" r="22" fill="#FFFFFF"/>`;

const BF_TV_GLYPH = `
  <rect x="28" y="46" width="144" height="96" rx="12" fill="none" stroke="#FFFFFF" stroke-width="12"/>
  <rect x="44" y="62" width="112" height="68" rx="6" fill="#FFFFFF" opacity="0.28"/>
  <rect x="88" y="150" width="24" height="16" fill="#FFFFFF"/>
  <rect x="68" y="166" width="64" height="10" rx="4" fill="#FFFFFF"/>`;

/** Camera glyph + CAM (matches Remux/WebDL release badge layout). */
export async function renderBfCamComposite() {
  const ref = await getBfWebReferenceLayout();
  const [glyph, text] = await Promise.all([
    renderReleaseDiscGlyph(BF_CAM_GLYPH),
    renderBfReleaseText("CAM", ref),
  ]);
  return compositeRelease(glyph, text);
}

/** TV glyph + HDTV (matches Remux/WebDL release badge layout). */
export async function renderBfHdtvComposite() {
  const ref = await getBfWebReferenceLayout();
  const [glyph, text] = await Promise.all([
    renderReleaseDiscGlyph(BF_TV_GLYPH, 168),
    renderBfReleaseText("HDTV", ref),
  ]);
  return compositeRelease(glyph, text);
}

/** @param {string} url mono-bluray | mono-webdl | mono-remux full canvas */
export async function fetchBfReleaseCanvas(url) {
  return fetchBf(url);
}
