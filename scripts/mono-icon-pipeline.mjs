/**
 * Image processing for mono badges — white or brand icons on transparent PNGs.
 */
import sharp from "sharp";

export const OMNI = {
  height: 80,
  padX: 18,
  contentHeight: 56,
};

export async function fitOmniCanvas(
  input,
  contentHeight = OMNI.contentHeight,
  { trim = true, padLeft = OMNI.padX, padRight = OMNI.padX } = {}
) {
  const padY = Math.max(0, Math.floor((OMNI.height - contentHeight) / 2));
  let pipe = sharp(input);
  if (trim) {
    pipe = pipe.trim({ threshold: 10 });
  }
  return pipe
    .resize({ height: contentHeight, fit: "inside" })
    .extend({
      top: padY,
      bottom: OMNI.height - contentHeight - padY,
      left: padLeft,
      right: padRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Streaming logos — skip trim (avoids clipping letterforms like Hulu “h”). */
export async function fitStreamingCanvas(
  input,
  contentHeight = 52,
  { padLeft = 24, padRight = 10, padY = 8 } = {}
) {
  const padded = await sharp(input)
    .extend({
      left: padLeft,
      right: padRight,
      top: padY,
      bottom: padY,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return fitOmniCanvas(padded, contentHeight, { trim: false });
}

/** @param {string} url */
export async function fetchImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "nosvasedis-mono-icons/1.0" },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Remove baked white badge plates (language, channel, codec labels). */
export async function stripNearWhiteBackground(input) {
  const { data, info } = await sharp(input)
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
      data[i + 3] = Math.round(data[i + 3] * (1 - (max - 200) / 35));
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer();
}

/** Dark ink on transparent → white, preserving anti-aliasing. */
export async function darkInkToWhite(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum >= 248) {
      data[i + 3] = 0;
      continue;
    }
    const ink = Math.min(255, Math.round((255 - lum) * 1.05));
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.min(255, Math.max(32, Math.round(ink * (a / 255))));
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Dark ink on transparent → black (solid gv/ga/gc on white/yellow fills). */
export async function darkInkToBlack(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum >= 248) {
      data[i + 3] = 0;
      continue;
    }
    const ink = Math.min(255, Math.round((255 - lum) * 1.05));
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = Math.min(255, Math.max(32, Math.round(ink * (a / 255))));
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** White ink on transparent → black (only for white-label sources). */
export async function whiteInkToBlack(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 8) {
      data[i + 3] = 0;
      continue;
    }
    const ink = Math.min(255, Math.round(lum * 1.05));
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = Math.min(255, Math.max(32, Math.round(ink * (a / 255))));
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Colored artwork → white (legacy; tier badges use darkInkToWhite via darkTransparent). */
export async function coloredArtToWhite(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (lum > 242 && chroma < 18) {
      data[i + 3] = 0;
      continue;
    }
    const strength = Math.min(255, chroma * 0.65 + (255 - lum) * 0.55);
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.min(255, Math.max(36, Math.round(strength * (a / 255))));
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** @deprecated Use darkInkToWhite — kept for any external callers. */
export async function recolorInkToWhite(input) {
  return darkInkToWhite(input);
}

/** Light-on-black artwork → white on transparent (BetterFormatter mono-*). */
export async function lightOnBlackToWhite(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 8) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 32) {
      data[i + 3] = 0;
      continue;
    }
    const ink = Math.min(255, Math.round(((lum - 32) / 223) * 255));
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.min(255, Math.max(32, Math.round(ink * (a / 255))));
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Je1992 streaming logos — strip near-black plate, keep brand colors. */
export async function stripStreamingBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 42 && chroma < 28) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else if (lum < 58 && chroma < 28) {
      data[i + 3] = Math.round(((lum - 42) / 16) * data[i + 3]);
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Match build-solid-icons.mjs — full-color logos at 58px (not mono-shrunk 52px). */
const STREAMING_CANVAS = {
  "s-hulu": { contentHeight: 58, padLeft: 40, padRight: 32, padY: 8 },
  "s-pcok": { contentHeight: 62, padLeft: 18, padRight: 10, padY: 6 },
};

const RELEASE_SOLID_HEIGHT = {
  "q-w": 58,
  "q-wr": 60,
  "q-r": 58,
  "q-b": 58,
  /** Shorter labels — 50px content matches Remux/WebDL ~48px cap height on 80px omni. */
  "q-cam": 50,
  "q-hdtv": 50,
};

/** White release art on transparent omni canvas (same as solid gray pills). */
export async function releaseWhiteOnCanvas(input, filterId) {
  const height = RELEASE_SOLID_HEIGHT[filterId] ?? 58;
  let white = await lightOnBlackToWhite(input);

  if (filterId === "q-wr" || filterId === "q-cam" || filterId === "q-hdtv") {
    white = await sharp(white)
      .trim({ threshold: 8 })
      .extend({
        left: 10,
        right: 32,
        top: 6,
        bottom: 6,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }

  const padRight = filterId === "q-wr" ? 32 : OMNI.padX;
  return fitOmniCanvas(white, height, { trim: false, padRight });
}

/** Already-light artwork (white SEADEX) — normalize on canvas. */
export async function processLightArtwork(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 40) {
      data[i + 3] = 0;
      continue;
    }
    const alpha = Math.min(255, Math.round((lum / 255) * data[i + 3]));
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = alpha;
  }

  return fitOmniCanvas(
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer()
  );
}

/**
 * @param {Buffer} buffer
 * @param {'streaming'|'languageMono'|'whiteBadge'|'whiteLabel'|'darkTransparent'|'coloredTier'|'lightOnBlack'|'lightArtwork'|'whiteOnClear'|'releaseWhite'|'imported'} mode
 * @param {{ filterId?: string }} [opts]
 */
export async function adaptStandardToMono(buffer, mode, opts = {}) {
  const { filterId } = opts;
  switch (mode) {
    case "streaming": {
      const canvas = STREAMING_CANVAS[filterId ?? ""];
      if (canvas) {
        return fitStreamingCanvas(
          await stripStreamingBackground(buffer),
          canvas.contentHeight,
          canvas
        );
      }
      return fitOmniCanvas(await stripStreamingBackground(buffer), 58, { trim: false });
    }
    case "whiteBadge":
      return fitOmniCanvas(
        await darkInkToWhite(await stripNearWhiteBackground(buffer))
      );
    /** Black label art on clear PNG (edition badges) — do not strip white ink. */
    case "whiteLabel":
      return fitOmniCanvas(await darkInkToWhite(buffer));
    case "lightOnBlack":
      return fitOmniCanvas(await lightOnBlackToWhite(buffer));
    case "coloredTier":
      return fitOmniCanvas(await coloredArtToWhite(buffer));
    case "lightArtwork":
      return processLightArtwork(buffer);
    /** Catbox tier/quality/resolution — already white on clear at 80px; do not downscale to 56px. */
    case "whiteOnClear":
      return fitOmniCanvas(buffer, OMNI.height, { trim: false });
    case "releaseWhite":
      return releaseWhiteOnCanvas(buffer, filterId ?? "");
    case "imported":
      return fitOmniCanvas(
        await darkInkToWhite(await stripNearWhiteBackground(buffer)),
        76
      );
    case "darkTransparent":
    default:
      return fitOmniCanvas(await darkInkToWhite(buffer));
  }
}

/** @param {string} url @param {'white'|'streaming'|'lightOnBlack'} mode */
export async function processFromUrl(url, mode = "white") {
  const buf = await fetchImage(url);
  const mapped =
    mode === "streaming"
      ? "streaming"
      : mode === "lightOnBlack"
        ? "lightOnBlack"
        : "darkTransparent";
  return adaptStandardToMono(buf, mapped);
}
