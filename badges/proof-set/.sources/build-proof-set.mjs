import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = path.join(root, ".sources");
const height = 160;
const artworkHeight = 112;
const sidePadding = 36;
const face = "Bahnschrift";
const ids = [
  "v-imax", "a-dv", "a-at-th", "v-hdr10",
  "s-nflx", "l-en", "sub-en", "hybrid-release",
  "q-b", "r-4k", "ch-51", "web-1",
];

async function renderSvg(svg, density) {
  return sharp(Buffer.from(svg), density ? { density } : {}).png().toBuffer();
}

async function alphaBounds(buffer, region = null) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const left = region?.left ?? 0;
  const top = region?.top ?? 0;
  const right = Math.min(info.width, left + (region?.width ?? info.width));
  const bottom = Math.min(info.height, top + (region?.height ?? info.height));
  let minX = right, minY = bottom, maxX = -1, maxY = -1;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 0) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("Cannot find visible artwork");
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function trimAlpha(buffer, region = null) {
  const bounds = await alphaBounds(buffer, region);
  return sharp(buffer).extract(bounds).png().toBuffer();
}

async function whiteReverse(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
}

async function fitHeight(buffer, targetHeight) {
  const trimmed = await trimAlpha(buffer);
  return sharp(trimmed).resize({ height: targetHeight }).png().toBuffer();
}

async function textMark(text, letterSpacing = 4) {
  const safe = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400">
    <text x="800" y="294" text-anchor="middle" fill="#fff" font-family="${face}" font-size="245" font-weight="700" letter-spacing="${letterSpacing}">${safe}</text>
  </svg>`;
  const raster = await renderSvg(svg);
  return fitHeight(raster, artworkHeight);
}

async function placeRow(parts, gap = 18) {
  const metas = await Promise.all(parts.map(part => sharp(part).metadata()));
  const width = metas.reduce((n, m) => n + m.width, 0) + gap * (parts.length - 1) + sidePadding * 2;
  let x = sidePadding;
  const layers = [];
  for (let i = 0; i < parts.length; i++) {
    layers.push({ input: parts[i], left: x, top: Math.round((height - metas[i].height) / 2) });
    x += metas[i].width + gap;
  }
  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers).png().toBuffer();
}

async function oneMark(buffer, color = null) {
  const image = color === "white" ? await whiteReverse(buffer) : buffer;
  const glyph = await fitHeight(image, artworkHeight);
  const meta = await sharp(glyph).metadata();
  return sharp({ create: { width: meta.width + sidePadding * 2, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, left: sidePadding, top: (height - artworkHeight) / 2 }]).png().toBuffer();
}

async function stackedOfficialMarks(top, bottom, gap = 4) {
  const topMeta = await sharp(top).metadata();
  const bottomMeta = await sharp(bottom).metadata();
  const contentWidth = Math.max(topMeta.width, bottomMeta.width);
  const contentHeight = topMeta.height + gap + bottomMeta.height;
  if (contentHeight > artworkHeight) throw new Error("Stacked official marks exceed the art height");
  const topY = Math.round((height - contentHeight) / 2);
  return sharp({ create: { width: contentWidth + sidePadding * 2, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: top, left: sidePadding + Math.round((contentWidth - topMeta.width) / 2), top: topY },
      { input: bottom, left: sidePadding + Math.round((contentWidth - bottomMeta.width) / 2), top: topY + topMeta.height + gap },
    ]).png().toBuffer();
}

const subtitleIcon = await renderSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="88" viewBox="0 0 96 88">
  <path d="M13 8h70a6 6 0 0 1 6 6v45a6 6 0 0 1-6 6H50L32 80V65H13a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
  <path d="M22 27h52M22 43h39" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
</svg>`);

const displayIcon = await renderSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="88" height="78" viewBox="0 0 88 78">
  <rect x="6" y="6" width="76" height="52" rx="4" fill="none" stroke="#fff" stroke-width="5"/>
  <path d="M44 59v10M28 73h32" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
</svg>`);

const surroundIcon = await renderSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="92" viewBox="0 0 96 92">
  <g fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M8 35h22L55 15v62L30 57H8Z"/>
    <path d="M67 32c8 8 8 20 0 28M77 21c15 14 15 36 0 50"/>
  </g>
</svg>`);

// Replace only the house marks and the two language/tier lockups that now use the clarified system.
await writeFile(path.join(root, "hybrid-release.png"), await placeRow([await textMark("HYBRID", 5)]));
await writeFile(path.join(root, "r-4k.png"), await placeRow([await trimAlpha(displayIcon), await textMark("4K", 2)], 20));
await writeFile(path.join(root, "ch-51.png"), await placeRow([await trimAlpha(surroundIcon), await textMark("5.1", 3)], 18));
await writeFile(path.join(root, "sub-en.png"), await placeRow([await trimAlpha(subtitleIcon), await textMark("EN", 8)], 20));

// Preserve the existing Kanso WEB family globe and reset its tier label in the shared type style.
const oldWeb = await readFile(path.join(root, "web-1.png"));
const globe = await trimAlpha(oldWeb, { left: 0, top: 0, width: 150, height });
await writeFile(path.join(root, "web-1.png"), await placeRow([globe, await textMark("T1", 5)], 20));

// Use source artwork rather than approximations for the marks that have official vector forms.
const hdr = await renderSvg(await readFile(path.join(sources, "hdr10-logo.svg")));
await writeFile(path.join(root, "v-hdr10.png"), await oneMark(hdr, "white"));
const bluRay = await renderSvg(await readFile(path.join(sources, "blu-ray-disc-association.svg")));
await writeFile(path.join(root, "q-b.png"), await oneMark(bluRay));

// Build a compact two-line lockup from official Dolby marks; the exact TRUEHD paths are cropped
// from Dolby's standalone TrueHD wordmark so Dolby's double-D symbol is not repeated.
const atmosOfficial = await whiteReverse(await readFile(path.join(sources, "dolby-atmos-horizontal.png")));
const atmosLine = await fitHeight(atmosOfficial, 54);
const trueHdSvg = await readFile(path.join(sources, "dolby-truehd.svg"));
const trueHdRaster = await renderSvg(trueHdSvg, 1200);
const scale = (await sharp(trueHdRaster).metadata()).width / 224.86499;
const trueHdWord = await trimAlpha(trueHdRaster, {
  left: Math.round(84 * scale), top: Math.round(32 * scale),
  width: Math.round((224.86499 - 84) * scale), height: Math.round((55.021 - 32) * scale),
});
const trueHdLine = await fitHeight(await whiteReverse(trueHdWord), 54);
await writeFile(path.join(root, "a-at-th.png"), await stackedOfficialMarks(atmosLine, trueHdLine, 4));

// Render the 12-up review sheet with every glyph shown at the 80px live-slot height.
const cellWidth = 520, cellHeight = 126, columns = 4, rows = 3;
const previewLayers = [];
for (let i = 0; i < ids.length; i++) {
  const file = path.join(root, `${ids[i]}.png`);
  const meta = await sharp(file).metadata();
  const live = await sharp(file).resize({ height: 80 }).png().toBuffer();
  const col = i % columns, row = Math.floor(i / columns);
  previewLayers.push({ input: live, left: col * cellWidth + Math.round((cellWidth - meta.width / 2) / 2), top: row * cellHeight });
}
const labels = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth * columns}" height="${cellHeight * rows}">
  ${ids.map((id, i) => `<text x="${i % columns * cellWidth + 22}" y="${Math.floor(i / columns) * cellHeight + 114}" fill="#bac7d5" font-family="Segoe UI" font-size="15">${id}</text>`).join("")}
</svg>`);
const preview = await sharp({ create: { width: cellWidth * columns, height: cellHeight * rows, channels: 3, background: "#111820" } })
  .composite([...previewLayers, { input: labels }]).png().toBuffer();
await writeFile(path.join(root, "proof-preview.png"), preview);

console.log("Rebuilt clarified typography, language marks, sourced logos, and 80px-slot preview.");
