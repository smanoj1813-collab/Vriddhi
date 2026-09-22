/**
 * Extract the AI concept render's mark as hero art.
 *
 * The concept is a raster with a noisy off-white background, so keying it to
 * transparency leaves grey haze around the glow. Instead we crop tightly to the
 * mark and bake the background to the exact colours the app paints behind it,
 * which composites perfectly and keeps the soft glow intact.
 *
 *   node brand/tools/extract-hero.mjs
 *
 * Outputs brand/hero/vriddhi-mark-hero-light.png (+ an @600 half size).
 *
 * Only the light bake is shipped. Keying the render against a dark surface is
 * not worth it here: the render's own background is noisy off-white, and the
 * brain's glow is near-white too — so an alpha key either keeps the noise or
 * eats the glow. Mounting the light bake on a white card reads as intentional
 * artwork and keeps the glow exactly as designed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.BRAND_NODE_MODULES
  ? path.join(process.env.BRAND_NODE_MODULES, 'sharp')
  : 'sharp');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SRC = path.join(REPO, 'brand', 'logo', 'concepts', 'vriddhi-primary-lockup.png');
const OUT = path.join(REPO, 'brand', 'hero');

// the app's own surfaces, so the baked background matches exactly
const LIGHT = { r: 255, g: 255, b: 255 };

const CONTENT = 236; // min-channel below this counts as artwork, not paper

const meta = await sharp(SRC).metadata();
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const at = (x, y) => {
  const o = (y * W + x) * C;
  return [data[o], data[o + 1], data[o + 2]];
};
const isContent = (x, y) => Math.min(...at(x, y)) < CONTENT;

/* ---- 1. per-column content profile, then split mark from wordmark -------- */
const colHasContent = new Uint8Array(W);
for (let x = 0; x < W; x++) {
  for (let y = 0; y < H; y += 2) {
    if (isContent(x, y)) {
      colHasContent[x] = 1;
      break;
    }
  }
}
// contiguous runs of content columns, separated by empty gaps
const runs = [];
let run = null;
for (let x = 0; x < W; x++) {
  if (colHasContent[x]) {
    if (!run) run = { x0: x, x1: x };
    else run.x1 = x;
  } else if (run) {
    runs.push(run);
    run = null;
  }
}
if (run) runs.push(run);

// merge runs that are separated by only a hairline, keep real gaps
const merged = [];
for (const r of runs) {
  const last = merged[merged.length - 1];
  if (last && r.x0 - last.x1 < W * 0.02) last.x1 = r.x1;
  else merged.push({ ...r });
}
if (merged.length < 2) throw new Error('could not separate the mark from the wordmark');

const mark = merged[0];
console.log(`mark columns: ${mark.x0}–${mark.x1} of ${W}  (${merged.length} runs found)`);

/* ---- 2. vertical bounds inside that column band ------------------------- */
let y0 = H;
let y1 = 0;
for (let y = 0; y < H; y++) {
  for (let x = mark.x0; x <= mark.x1; x++) {
    if (isContent(x, y)) {
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      break;
    }
  }
}
const pad = Math.round(Math.min(mark.x1 - mark.x0, y1 - y0) * 0.06);
const left = Math.max(0, mark.x0 - pad);
const top = Math.max(0, y0 - pad);
const width = Math.min(W - left, mark.x1 - mark.x0 + pad * 2 + 1);
const height = Math.min(H - top, y1 - y0 + pad * 2 + 1);
console.log(`crop: ${left},${top} ${width}x${height}`);

const crop = await sharp(SRC)
  .extract({ left, top, width, height })
  .removeAlpha()
  .raw()
  .toBuffer();

/* ---- 3. bake the background to each surface ----------------------------- */
function bake(background) {
  const out = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const r = crop[i * 3];
    const g = crop[i * 3 + 1];
    const b = crop[i * 3 + 2];
    const mn = Math.min(r, g, b);
    const mx = Math.max(r, g, b);
    // near-neutral and bright → it is paper, not artwork
    const isPaper = mn >= 238 && mx - mn <= 22;
    if (isPaper) {
      // smooth ramp so the glow fades into the surface instead of banding
      const t = Math.min(1, Math.max(0, (255 - mn) / 17));
      out[i * 3] = Math.round(background.r + (r - background.r) * t);
      out[i * 3 + 1] = Math.round(background.g + (g - background.g) * t);
      out[i * 3 + 2] = Math.round(background.b + (b - background.b) * t);
    } else {
      out[i * 3] = r;
      out[i * 3 + 1] = g;
      out[i * 3 + 2] = b;
    }
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
const jobs = [['vriddhi-mark-hero-light.png', LIGHT]];
for (const [name, bg] of jobs) {
  const pixels = bake(bg);
  const file = path.join(OUT, name);
  // native = 1:1 with the source crop; also emit a 2x-friendly half size
  await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(file);
  await sharp(pixels, { raw: { width, height, channels: 3 } })
    .resize({ width: Math.round(width / 2) })
    .png({ compressionLevel: 9 })
    .toFile(file.replace(/\.png$/, '@600.png'));
  console.log(`✓ brand/hero/${name}  (${width}x${height})`);
}
