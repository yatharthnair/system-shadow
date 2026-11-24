#!/usr/bin/env node
/**
 * Generates SYSTEM: SHADOW's app icon, launch-screen mark and Android/web icons.
 *
 *   node scripts/generate-brand-assets.js
 *
 * The artwork is drawn procedurally (signed-distance shapes, 4×4 supersampled) and written with a
 * minimal built-in PNG encoder, so it has no dependencies and is fully reproducible.
 *
 * Design — "the awakening eye": a glowing cyan diamond frame (the in-app rank-badge motif) around
 * an electric-blue core split by a dark vertical slit, on the app's near-black navy.
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'images');

// Brand colors (match src/constants/colors.js)
const VOID = [2, 4, 9];
const NAVY = [16, 28, 54];
const ELECTRIC = [47, 123, 255];
const CYAN = [59, 227, 255];
const FROST = [234, 242, 255];

// ---------- PNG encoding ----------
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}
/** pixels: Float32Array of RGBA in 0..1 (premultiplied=false). */
function encodePng(width, height, pixels, { alpha }) {
  const channels = alpha ? 4 : 3;
  const raw = Buffer.alloc((width * channels + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * channels + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      const target = rowStart + 1 + x * channels;
      for (let channel = 0; channel < channels; channel += 1) {
        raw[target + channel] = Math.round(Math.min(1, Math.max(0, pixels[source + channel])) * 255);
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = alpha ? 6 : 2; // RGBA : RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Shapes (coordinates in -1..1, y down) ----------
const mix = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t);
const smooth = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
/** Signed distance to a diamond (rotated square) with "radius" r (center to vertex). */
const diamond = (x, y, r) => (Math.abs(x) + Math.abs(y) - r) / Math.SQRT2;
/** Signed distance to a vertical lens (intersection of two circles). */
function lens(x, y, halfWidth, halfHeight) {
  const radius = (halfHeight * halfHeight + halfWidth * halfWidth) / (2 * halfWidth);
  const offset = radius - halfWidth;
  return Math.max(Math.hypot(x - offset, y) - radius, Math.hypot(x + offset, y) - radius);
}

/** Straight-alpha "source over": paints `color` with coverage `amount` (0..1) over `base`. */
function over(base, color, amount) {
  const a = amount + base.a * (1 - amount);
  if (a === 0) return { rgb: [0, 0, 0], a: 0 };
  return {
    rgb: color.map((value, index) => (value * amount + base.rgb[index] * base.a * (1 - amount)) / a),
    a,
  };
}

/**
 * Shades one sample. `withBackground` false gives the sigil alone on transparency.
 * `monochrome` renders a flat white silhouette (Android themed icon).
 */
function shade(x, y, { withBackground, monochrome, scale }) {
  const s = scale; // sigil size relative to canvas
  let pixel = { rgb: [0, 0, 0], a: 0 };

  if (withBackground) {
    const r = Math.hypot(x, y * 0.92 + 0.08);
    pixel = { rgb: mix(NAVY, VOID, smooth(0.0, 1.15, r)), a: 1 };
    // Faint horizontal scan bands for a HUD texture.
    const band = 0.5 + 0.5 * Math.sin((y + 1) * 90);
    pixel.rgb = mix(pixel.rgb, VOID, 0.06 * band * smooth(0.2, 1.0, r));
  }

  const outer = diamond(x, y, 0.78 * s);
  const ringWidth = 0.045 * s;
  const ring = Math.abs(outer) - ringWidth / 2;
  const core = diamond(x, y, 0.5 * s);
  const slit = lens(x, y, 0.085 * s, 0.42 * s);

  if (monochrome) {
    const ringCoverage = 1 - smooth(-0.004, 0.004, ring);
    const coreCoverage = (1 - smooth(-0.004, 0.004, core)) * smooth(-0.004, 0.004, slit);
    return { rgb: [1, 1, 1], a: Math.max(ringCoverage, coreCoverage) };
  }

  const glowColor = CYAN.map((value) => value / 255);
  // Outer halo and ring glow (exponential falloff outside the shapes).
  pixel = over(pixel, glowColor, 0.22 * Math.exp(-Math.max(0, outer) / (0.16 * s)) * (withBackground ? 1 : 0.85));
  pixel = over(pixel, glowColor, 0.55 * Math.exp(-Math.max(0, ring) / (0.03 * s)));
  // Ring
  pixel = over(pixel, mix(glowColor, FROST.map((v) => v / 255), 0.25), 1 - smooth(-0.003, 0.003, ring));

  // Core: vertical gradient electric → cyan, with an inner glow toward the slit.
  const coreCoverage = 1 - smooth(-0.003, 0.003, core);
  if (coreCoverage > 0) {
    const t = smooth(0.5 * s, -0.5 * s, y);
    let coreColor = mix(ELECTRIC, CYAN, t).map((value) => value / 255);
    coreColor = mix(coreColor, FROST.map((v) => v / 255), 0.35 * Math.exp(-Math.abs(slit) / (0.05 * s)));
    pixel = over(pixel, coreColor, coreCoverage);
    // Slit: the dark pupil.
    const slitCoverage = (1 - smooth(-0.003, 0.003, slit)) * coreCoverage;
    pixel = { rgb: mix(pixel.rgb, VOID.map((v) => v / 255), slitCoverage), a: pixel.a };
  }

  return pixel;
}

function render(size, options) {
  const pixels = new Float32Array(size * size * 4);
  const SAMPLES = 4;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const x = ((px + (sx + 0.5) / SAMPLES) / size) * 2 - 1;
          const y = ((py + (sy + 0.5) / SAMPLES) / size) * 2 - 1;
          const sample = shade(x, y, options);
          const rgb = sample.rgb;
          r += rgb[0] * sample.a;
          g += rgb[1] * sample.a;
          b += rgb[2] * sample.a;
          a += sample.a;
        }
      }
      const index = (py * size + px) * 4;
      const count = SAMPLES * SAMPLES;
      pixels[index + 3] = a / count;
      // Un-premultiply for straight-alpha PNG.
      pixels[index] = a > 0 ? r / a : 0;
      pixels[index + 1] = a > 0 ? g / a : 0;
      pixels[index + 2] = a > 0 ? b / a : 0;
    }
  }
  return pixels;
}

function write(fileName, size, options) {
  const pixels = render(size, options);
  fs.writeFileSync(path.join(OUT_DIR, fileName), encodePng(size, size, pixels, { alpha: options.alpha }));
  console.log(`wrote assets/images/${fileName} (${size}×${size})`);
}

// Background colors are authored 0..255; normalize NAVY/VOID usage inside shade().
NAVY.forEach((value, index) => (NAVY[index] = value / 255));
VOID.forEach((value, index) => (VOID[index] = value / 255));

// iOS app icon: full-bleed and opaque (App Store icons must not contain transparency).
write('icon.png', 1024, { withBackground: true, alpha: false, scale: 1 });
// Launch-screen mark on transparency; the splash background color comes from app.json.
write('splash-icon.png', 512, { withBackground: false, alpha: true, scale: 0.9 });
// Android adaptive icon layers (sigil kept inside the 66% safe zone) and themed monochrome.
write('android-icon-foreground.png', 512, { withBackground: false, alpha: true, scale: 0.6 });
write('android-icon-background.png', 512, { withBackground: true, alpha: false, scale: 0.0001 });
write('android-icon-monochrome.png', 432, { withBackground: false, alpha: true, scale: 0.6, monochrome: true });
// Web favicon.
write('favicon.png', 48, { withBackground: true, alpha: false, scale: 1 });
