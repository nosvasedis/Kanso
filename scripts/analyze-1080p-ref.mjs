import sharp from "sharp";

const ref = await sharp("badges/source/1080p-ref.png").ensureAlpha().raw().toBuffer({
  info: true,
});
const { width, height, channels } = ref.info;
const data = ref.data;

function rowWhiteCount(y) {
  let count = 0;
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200 && data[i + 3] > 20) count++;
  }
  return count;
}

function colWhiteCount(x) {
  let count = 0;
  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels;
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200 && data[i + 3] > 20) count++;
  }
  return count;
}

let top = 0;
let bottom = height - 1;
for (let y = 0; y < height; y++) {
  if (rowWhiteCount(y) > 0) {
    top = y;
    break;
  }
}
for (let y = height - 1; y >= 0; y--) {
  if (rowWhiteCount(y) > 0) {
    bottom = y;
    break;
  }
}

let left = 0;
let right = width - 1;
for (let x = 0; x < width; x++) {
  if (colWhiteCount(x) > 0) {
    left = x;
    break;
  }
}
for (let x = width - 1; x >= 0; x--) {
  if (colWhiteCount(x) > 0) {
    right = x;
    break;
  }
}

const textH = bottom - top + 1;
const textW = right - left + 1;
console.log("1080p ref", { width, height, textW, textH, top, bottom, left, right });
console.log("text height ratio", (textH / height).toFixed(3));

// find vertical gaps (columns with no white pixels) inside text bbox
const gaps = [];
let inGap = false;
let gapStart = 0;
for (let x = left; x <= right; x++) {
  const white = colWhiteCount(x);
  if (white === 0) {
    if (!inGap) {
      inGap = true;
      gapStart = x;
    }
  } else if (inGap) {
    gaps.push({ start: gapStart, end: x - 1, width: x - gapStart });
    inGap = false;
  }
}
if (inGap) gaps.push({ start: gapStart, end: right, width: right - gapStart + 1 });

console.log(
  "internal gaps",
  gaps.filter((g) => g.width >= 2 && g.width <= 40)
);

// scaled to omni 80px height
const scale = 80 / height;
console.log("scaled text height @80px canvas", Math.round(textH * scale));
console.log("scaled total width @80px canvas", Math.round(width * scale));
