/**
 * Vriddhi Institutions — brand asset generator
 * ---------------------------------------------------------------------------
 * Concept: a monogram of "V" + "I".
 *   V — its right stroke rises into an arrowhead      → vriddhi (growth)
 *   I — drawn as a torch whose flame is a brain       → knowledge, intellect
 *
 * The mark is fully parametric and the wordmark is converted to outlines, so
 * the logo has no font dependency. The brain is an implicit surface (union of
 * lobes minus folds and the midline split) traced with marching squares, which
 * makes its folds genuine negative space — the mark survives being printed in
 * one flat colour.
 *
 * Usage:
 *   BRAND_NODE_MODULES=/path/to/node_modules BRAND_FONT_DIR=/path/to/fonts \
 *     node brand/tools/build-brand.mjs [--variants]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAND_DIR = path.resolve(HERE, '..');
const REPO = path.resolve(BRAND_DIR, '..');
// Prefer the repo's own devDependencies; BRAND_NODE_MODULES overrides for
// sandboxes that keep the toolchain outside the checkout.
const MODULES = process.env.BRAND_NODE_MODULES || path.join(REPO, 'node_modules');
const FONT_DIR = process.env.BRAND_FONT_DIR || path.join(HERE, 'fonts');

const opentype = require(path.join(MODULES, 'opentype.js'));
const sharp = (() => {
  try {
    return require(path.join(MODULES, 'sharp'));
  } catch {
    return null;
  }
})();

/* =========================================================================
 * 1. BRAND TOKENS
 * ====================================================================== */

const C = {
  teal300: '#5eead4',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal900: '#134e4a',
  teal50: '#f0fdfa',
  slate900: '#0f172a',
  white: '#ffffff',
};

/* =========================================================================
 * 2. GEOMETRY HELPERS
 * ====================================================================== */

const n = (v) => {
  const r = Math.round(v * 100) / 100;
  if (!Number.isFinite(r)) return '0';
  const s = r.toFixed(2).replace(/\.?0+$/, '');
  return s === '-0' || s === '' ? '0' : s;
};
const poly = (points) => `${points.map(([x, y], i) => `${i ? 'L' : 'M'} ${n(x)} ${n(y)}`).join(' ')} Z`;

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  return [
    `M ${n(x + rr)} ${n(y)}`,
    `H ${n(x + w - rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x + w)} ${n(y + rr)}`,
    `V ${n(y + h - rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x + w - rr)} ${n(y + h)}`,
    `H ${n(x + rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x)} ${n(y + h - rr)}`,
    `V ${n(y + rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(x + rr)} ${n(y)}`,
    'Z',
  ].join(' ');
}

const distSeg = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy || 1;
  let t = (wx * vx + wy * vy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(wx - t * vx, wy - t * vy);
};

/* ---- implicit surface → smooth cubic contours ------------------------- */

function traceContours(sdf, bbox, { samplesPerUnit = 16, smoothPasses = 3, tolerance = 0.2 } = {}) {
  const S = samplesPerUnit;
  const W = Math.ceil((bbox.x1 - bbox.x0) * S) + 3;
  const H = Math.ceil((bbox.y1 - bbox.y0) * S) + 3;
  const grid = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = bbox.x0 + (i - 1 + 0.5) / S;
      const y = bbox.y0 + (j - 1 + 0.5) / S;
      if (sdf(x, y) <= 0) grid[j * W + i] = 1;
    }
  }
  const isIn = (i, j) => (i >= 0 && j >= 0 && i < W && j < H ? grid[j * W + i] === 1 : false);

  const key = (i, j) => j * (W + 4) + i;
  const edges = new Map();
  const push = (ax, ay, bx, by) => {
    const k = key(ax, ay);
    if (!edges.has(k)) edges.set(k, []);
    edges.get(k).push({ ax, ay, bx, by, used: false });
  };
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      if (!isIn(i, j)) continue;
      if (!isIn(i, j - 1)) push(i, j, i + 1, j);
      if (!isIn(i + 1, j)) push(i + 1, j, i + 1, j + 1);
      if (!isIn(i, j + 1)) push(i + 1, j + 1, i, j + 1);
      if (!isIn(i - 1, j)) push(i, j + 1, i, j);
    }
  }

  const loops = [];
  for (const list of edges.values()) {
    for (const first of list) {
      if (first.used) continue;
      const pts = [];
      let cur = first;
      const startKey = key(first.ax, first.ay);
      let guard = 0;
      while (cur && guard++ < 4 * W * H) {
        cur.used = true;
        pts.push([cur.ax, cur.ay]);
        const nextKey = key(cur.bx, cur.by);
        if (nextKey === startKey) break;
        const cands = edges.get(nextKey);
        cur = cands ? cands.find((e) => !e.used) : null;
      }
      if (pts.length > 6) loops.push(pts);
    }
  }

  const toUnits = ([i, j]) => [bbox.x0 + (i - 1) / S, bbox.y0 + (j - 1) / S];
  return loops.map((loop) => {
    let pts = loop.map(toUnits);
    for (let p = 0; p < smoothPasses; p++) pts = chaikin(pts);
    return catmullToBezier(rdp(pts, tolerance));
  });
}

function chaikin(pts) {
  const out = [];
  const len = pts.length;
  for (let i = 0; i < len; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % len];
    out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
    out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
  }
  return out;
}

function rdp(points, eps) {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = -1;
    let idx = -1;
    const [sx, sy] = points[s];
    const [ex, ey] = points[e];
    for (let i = s + 1; i < e; i++) {
      const d = distSeg(points[i][0], points[i][1], sx, sy, ex, ey);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function catmullToBezier(pts, alpha = 0.5) {
  const N = pts.length;
  if (N < 3) return '';
  const k = (alpha * 2) / 6;
  const d = [`M ${n(pts[0][0])} ${n(pts[0][1])}`];
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    d.push(
      `C ${n(p1[0] + (p2[0] - p0[0]) * k)} ${n(p1[1] + (p2[1] - p0[1]) * k)} ` +
        `${n(p2[0] - (p3[0] - p1[0]) * k)} ${n(p2[1] - (p3[1] - p1[1]) * k)} ${n(p2[0])} ${n(p2[1])}`
    );
  }
  return `${d.join(' ')} Z`;
}

/** Detect the index of "I" in a word so the torch can stand in for that letter. */
export const I_INDEX = 5; // V R I D D H I

/* =========================================================================
 * 3. THE MARK — V (growth) + I (torch of intellect)
 * ====================================================================== */

const GEO = {
  capTop: -100,
  bottom: 0,
  leftOuter: -104,
  vWidth: 96,
  vArm: 27,
  cutY: -86,
  torchCx: 38,
  handleHWBottom: 10.5,
  handleHWTop: 11.5,
  cupTopY: -54,
  cupHW: 22,
  rimTop: -80,
  rimBottom: -72.5,
  rimHW: 28,
  brainWidth: 57,
  brainHeight: 53,
  brainBottom: -87,
};

/* ---- flame silhouette (the brain sits inside this) --------------------- */

/** Signed distance to a closed polygon (negative inside). */
function polySDF(points) {
  return (x, y) => {
    let d = Infinity;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      d = Math.min(d, distSeg(x, y, a[0], a[1], b[0], b[1]));
    }
    // ray crossing test
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside ? -d : d;
  };
}

/** Flatten through-points (Catmull-Rom) into a polyline. */
function flatten(points, per = 10, closed = false) {
  const pts = closed ? [...points, points[0], points[1], points[2]] : points;
  const out = [];
  const N = closed ? points.length : pts.length;
  const get = (i) => pts[((i % N) + N) % N];
  for (let i = 0; i < N; i++) {
    const p0 = closed ? get(i - 1) : pts[Math.max(0, i - 1)];
    const p1 = closed ? get(i) : pts[i];
    const p2 = closed ? get(i + 1) : pts[Math.min(pts.length - 1, i + 1)];
    const p3 = closed ? get(i + 2) : pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

/**
 * The flame: widest just below the middle, tapering to a soft point.
 * Built in mark-local coordinates (negative y is up).
 */
function flameSDF({ H = 58, HW = 31, yBase = -2 } = {}) {
  const u = (k) => yBase - k * H;
  const right = [
    [0.0, u(1.0)],
    [0.24 * HW, u(0.9)],
    [0.55 * HW, u(0.76)],
    [0.85 * HW, u(0.54)],
    [1.0 * HW, u(0.3)],
    [0.9 * HW, u(0.12)],
    [0.6 * HW, u(0.0)],
  ];
  const left = right.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  const outline = flatten([...right, ...left], 8, true);
  return polySDF(outline);
}

/** Bounding box of path data (cubics are flattened parametrically). */
function pathBounds(paths) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const hit = (x, y) => {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  };
  for (const d of paths) {
    const tokens = d.match(/[MCLZ]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
    let i = 0;
    let cmd = 'M';
    let cur = [0, 0];
    while (i < tokens.length) {
      const t = tokens[i];
      if (/^[MCLZ]$/.test(t)) { cmd = t; i++; continue; }
      if (cmd === 'M' || cmd === 'L') {
        cur = [parseFloat(tokens[i]), parseFloat(tokens[i + 1])];
        i += 2;
        hit(cur[0], cur[1]);
      } else if (cmd === 'C') {
        const p = [0, 1, 2].map((k) => [parseFloat(tokens[i + k * 2]), parseFloat(tokens[i + k * 2 + 1])]);
        i += 6;
        for (let s = 0; s <= 1.0001; s += 0.05) {
          const mt = 1 - s;
          hit(
            mt ** 3 * cur[0] + 3 * mt ** 2 * s * p[0][0] + 3 * mt * s ** 2 * p[1][0] + s ** 3 * p[2][0],
            mt ** 3 * cur[1] + 3 * mt ** 2 * s * p[0][1] + 3 * mt * s ** 2 * p[1][1] + s ** 3 * p[2][1]
          );
        }
        cur = p[2];
      } else {
        i++;
      }
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/**
 * @param {object} opt
 * @param {'arm'|'vertical'} opt.variant  arrow direction
 * @param {number} opt.barbHalf           half-width of the arrowhead barbs
 * @param {number} opt.length             arrowhead length base → apex
 * @param {number} opt.notch              depth of the concave base (0 = flat)
 * @param {number} opt.torchCx            horizontal position of the torch
 * @param {number} opt.folds              fold strokes per hemisphere
 */
function buildMark(opt = {}) {
  const g = { ...GEO, ...opt };
  const { variant = 'arm', barbHalf = 22, length = 44, notch = 14, foldHW = 2.2 } = g;
  const center = g.leftOuter + g.vWidth / 2;
  const innerVertexY = g.capTop * (g.vArm / (g.vWidth / 2));

  const outerRightAtCut = center + (g.vWidth / 2) * (g.cutY / g.capTop);
  const innerRightAtCut = center + (g.vWidth / 2 - g.vArm) * ((g.cutY - innerVertexY) / (g.capTop - innerVertexY));

  // The V is built as two halves that meet on the letter's centre line, so the
  // two strokes can carry different colours (see V_TREATMENTS below). Above the
  // counter's apex the halves are already separate arms, so the split is exact
  // and the union is identical to a single V path.
  const vLeft = poly([
    [g.leftOuter, g.capTop],
    [center, g.bottom],
    [center, innerVertexY],
    [g.leftOuter + g.vArm, g.capTop],
  ]);
  const vRight = poly([
    [center, g.bottom],
    [outerRightAtCut, g.cutY],
    [innerRightAtCut, g.cutY],
    [center, innerVertexY],
  ]);

  const baseCenter = [(outerRightAtCut + innerRightAtCut) / 2, g.cutY];
  let dir;
  if (variant === 'arm') {
    const dx = g.vWidth / 2;
    const dy = g.capTop - g.bottom;
    const len = Math.hypot(dx, dy);
    dir = [dx / len, dy / len];
  } else {
    dir = [0, -1];
  }
  const perp = [-dir[1], dir[0]];
  const apex = [baseCenter[0] + dir[0] * length, baseCenter[1] + dir[1] * length];
  const rightBarb = [baseCenter[0] + perp[0] * barbHalf, baseCenter[1] + perp[1] * barbHalf];
  const leftBarb = [baseCenter[0] - perp[0] * barbHalf, baseCenter[1] - perp[1] * barbHalf];
  const arrow =
    notch > 0
      ? poly([
          apex,
          rightBarb,
          [baseCenter[0] + dir[0] * notch, baseCenter[1] + dir[1] * notch], // concave back
          leftBarb,
        ])
      : poly([apex, rightBarb, leftBarb]);

  /* ---- torch: rim bar + flared cup + tapered handle --------------------- */
  const cx = g.torchCx;
  const torch = [
    `M ${n(cx - g.handleHWBottom)} 0`,
    `L ${n(cx - g.handleHWTop)} ${n(g.cupTopY)}`,
    `L ${n(cx - g.cupHW)} ${n(g.rimBottom)}`,
    `L ${n(cx + g.cupHW)} ${n(g.rimBottom)}`,
    `L ${n(cx + g.handleHWTop)} ${n(g.cupTopY)}`,
    `L ${n(cx + g.handleHWBottom)} 0`,
    `C ${n(cx + g.handleHWBottom)} ${n(g.handleHWBottom * 0.62)} ${n(cx - g.handleHWBottom)} ${n(g.handleHWBottom * 0.62)} ${n(cx - g.handleHWBottom)} 0`,
    'Z',
  ].join(' ');
  const rim = roundRect(cx - g.rimHW, g.rimTop, g.rimHW * 2, g.rimBottom - g.rimTop, (g.rimBottom - g.rimTop) / 2);

  /* ---- brain ------------------------------------------------------------
   * A brain pictogram needs two things, and a ring of equal lobes has neither:
   * an irregular outline (uniform scallops look like a flower) and folds that
   * curve (straight strokes look like ticks).
   *
   * The silhouette is therefore drawn by hand as a half-outline and mirrored —
   * fully predictable, no radial-function surprises — and the gyri are smooth
   * arcs sampled around it. Both are still carved from one implicit surface, so
   * the folds stay true negative space.
   * -------------------------------------------------------------------- */
  const H = g.brainHeight;
  const HW = g.brainWidth / 2;
  const yc = -H * 0.5; // centre of the envelope, in brain-local units
  /* Brain profile.
   * A radial outline gives smooth, rounded scallops; the irregularity comes from
   * mixing several incommensurate frequencies rather than from alternating
   * control points, which is what produced a sawtooth edge. The lower half is
   * tapered so the shape narrows to the temporal lobes instead of ending as a
   * ball. */
  const outlinePtsRaw = [];
  const STEPS = 220;
  for (let i = 0; i < STEPS; i++) {
    const th = (2 * Math.PI * i) / STEPS - Math.PI / 2;
    const sn = Math.sin(th);
    const cs = Math.cos(th);
    const taper = sn > 0 ? 1 - 0.22 * sn * sn : 1; // narrower base
    const lumps =
      1 +
      0.055 * Math.sin(13 * th + 0.7) +
      0.042 * Math.sin(8 * th + 2.1) +
      0.07 * Math.sin(3 * th + 1.2) +
      0.035 * Math.sin(2 * th + 0.25);
    outlinePtsRaw.push([HW * cs * taper * lumps, yc - (H / 2) * sn * lumps]);
  }

  const envelope = polySDF(flatten(outlinePtsRaw, 2, true));

  /* Gyri.
   * The trick to reading as a brain rather than a mask is variety: the strokes
   * must not all start at the midline and fan out evenly. These are hand-drawn
   * curls — one hooks inward, one floats free of the midline, one sweeps up —
   * and each is mirrored across the midline. */
  const foldsL = [
    // upper curl: leaves the midline, hooks down and back in
    [[-0.06, -0.76], [-0.26, -0.82], [-0.46, -0.78], [-0.57, -0.66], [-0.48, -0.57], [-0.31, -0.58]],
    // middle stroke: floats clear of the midline, arcs the other way
    [[-0.70, -0.42], [-0.61, -0.29], [-0.42, -0.25], [-0.23, -0.30], [-0.12, -0.38]],
    // lower stroke: sweeps out and slightly up, staying clear of the base
    [[-0.06, -0.14], [-0.24, -0.18], [-0.42, -0.15], [-0.53, -0.06]],
    // inner curl tying the upper strokes together
    [[-0.14, -0.64], [-0.26, -0.60], [-0.30, -0.50]],
  ].slice(0, g.folds ?? 4);

  const foldPolylines = foldsL.map((pts) =>
    flatten(pts.map(([nx, ny]) => [HW * nx, H * ny]), 10, false)
  );

  const brainRaw = (x, y) => {
    let d = envelope(x, y);
    for (const fold of foldPolylines) {
      let fd = Infinity;
      for (let i = 0; i < fold.length - 1; i++) {
        fd = Math.min(fd, distSeg(x, y, fold[i][0], fold[i][1], fold[i + 1][0], fold[i + 1][1]));
        fd = Math.min(fd, distSeg(x, y, -fold[i][0], fold[i][1], -fold[i + 1][0], fold[i + 1][1]));
      }
      d = Math.max(d, -(fd - foldHW));
    }
    // midline: overshoots the outline top and bottom so the base splits in two
    d = Math.max(d, -(distSeg(x, y, 0, -H * 1.4, 0, H * 0.9) - 1.4));
    return d;
  };

  const simple = !!opt.simple; // icon variant: silhouette only, no fold detail
  const simpleSDF = envelope;
  const sdf = simple ? simpleSDF : brainRaw;
  const raw = traceContours(sdf, { x0: -HW - 4, y0: -H - 4, x1: HW + 4, y1: 4 }, {
    samplesPerUnit: 22,
    tolerance: 0.13,
  });
  const rawBox = pathBounds(raw);
  const brainScale = Math.min(g.brainWidth / rawBox.w, g.brainHeight / rawBox.h) * 0.999;
  const brainTransform = {
    scale: brainScale,
    tx: cx - ((rawBox.x0 + rawBox.x1) / 2) * brainScale,
    ty: g.brainBottom - rawBox.y1 * brainScale,
  };
  const brainTop = g.brainBottom - rawBox.h * brainScale;

  const apexY = Math.min(apex[1], leftBarb[1], rightBarb[1]);
  return {
    vLeft,
    vRight,
    arrow,
    torch,
    rim,
    brainContours: raw,
    brainTransform,
    opts: g,
    box: {
      x0: g.leftOuter,
      y0: Math.min(apexY, brainTop),
      x1: Math.max(cx + g.rimHW, rightBarb[0]),
      y1: 5,
    },
  };
}

// The arrow treatment is shared: the simplified mark must line up with the
// detailed one, otherwise the app icons and the logo would be different marks.
const MARK_OPTS = { variant: 'arm', barbHalf: 22, length: 44, notch: 14 };
const MARK = buildMark(MARK_OPTS);
const SIMPLE_MARK = buildMark({ ...MARK_OPTS, simple: true });

/* =========================================================================
 * 4. WORDMARK
 * ====================================================================== */

const FONTS = {};
const loadFont = (file) => {
  if (!FONTS[file]) {
    const buf = fs.readFileSync(path.join(FONT_DIR, file));
    FONTS[file] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return FONTS[file];
};

function outline(font, text, size, tracking = 0) {
  const scale = size / font.unitsPerEm;
  let x = 0;
  const parts = [];
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    const d = glyph.getPath(x, 0, size).toPathData(2);
    if (d && d.trim()) parts.push(d);
    x += glyph.advanceWidth * scale + tracking;
  }
  return { d: parts.join(' '), width: x - tracking };
}

const TEXT = (() => {
  const semi = loadFont('Inter-SemiBold.ttf');
  const medium = loadFont('Inter-Medium.ttf');
  const capRatio = 0.7275; // Inter cap height / em
  const wordCaps = 56;
  const subCaps = 23;
  const word = outline(semi, 'VRIDDHI', wordCaps / capRatio, -(wordCaps / capRatio) * 0.02);
  const subNatural = outline(medium, 'INSTITUTIONS', subCaps / capRatio, 0);
  const target = word.width * 0.95;
  const gaps = 'INSTITUTIONS'.length - 1;
  const track = Math.max((subCaps / capRatio) * 0.1, Math.min((target - subNatural.width) / gaps, (subCaps / capRatio) * 0.2));
  const sub = outline(medium, 'INSTITUTIONS', subCaps / capRatio, track);
  return { word, sub, wordCaps, subCaps, lineGap: 16 };
})();

/* =========================================================================
 * 5. COLOUR THEMES + SVG COMPOSITION
 * ====================================================================== */

/** Soft elevation for hero / app-icon use. Never applied to the flat logo. */
const SHADOW_DEFS = (id = 'softShadow', { dy = 7, blur = 7, o = 0.22, color = '#0f172a' } = {}) => `
    <filter id="${id}" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${o}"/>
    </filter>`;

const THEMES = {
  color: {
    v: 'url(#gradV)',
    vL: C.teal700,
    vR: 'url(#gradV)',
    arrow: 'url(#gradV)',
    torch: 'url(#gradTorch)',
    rim: C.teal600,
    brain: 'url(#gradBrain)',
    word: C.slate900,
    sub: C.teal600,
    defs: `
    <linearGradient id="gradV" gradientUnits="userSpaceOnUse" x1="-20" y1="-140" x2="-20" y2="6">
      <stop offset="0" stop-color="${C.teal400}"/><stop offset="0.5" stop-color="${C.teal500}"/><stop offset="1" stop-color="${C.teal700}"/>
    </linearGradient>
    <linearGradient id="gradTorch" gradientUnits="userSpaceOnUse" x1="0" y1="-84" x2="0" y2="6">
      <stop offset="0" stop-color="${C.teal700}"/><stop offset="1" stop-color="${C.teal900}"/>
    </linearGradient>
    <linearGradient id="gradBrain" gradientUnits="userSpaceOnUse" x1="0" y1="-145" x2="0" y2="-88">
      <stop offset="0" stop-color="${C.teal300}"/><stop offset="1" stop-color="${C.teal500}"/>
    </linearGradient>${SHADOW_DEFS('softShadow', { dy: 6, blur: 6, o: 0.2 })}${SHADOW_DEFS('liftShadow', { dy: 11, blur: 13, o: 0.3 })}`,
  },
  depth: {
    v: 'url(#gradV)', vL: C.teal700, vR: 'url(#gradV)',
    arrow: 'url(#gradV)', torch: 'url(#gradTorch)', rim: C.teal600,
    brain: 'url(#gradBrain)', word: C.slate900, sub: C.teal600,
    filter: 'url(#softShadow)',
    defs: '',
  },
  reverse: {
    v: C.teal300,
    vL: '#14b8a6',
    vR: '#5eead4',
    arrow: C.teal300,
    torch: C.teal400,
    rim: C.teal300,
    brain: C.white,
    word: C.white,
    sub: C.teal300,
    defs: `
    <linearGradient id="gradBrain" gradientUnits="userSpaceOnUse" x1="0" y1="-145" x2="0" y2="-88">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${C.teal300}"/>
    </linearGradient>`,
  },
  black: { v: '#000000', arrow: '#000000', torch: '#000000', rim: '#000000', brain: '#000000', word: '#000000', sub: '#000000', defs: '' },
  white: { v: '#ffffff', arrow: '#ffffff', torch: '#ffffff', rim: '#ffffff', brain: '#ffffff', word: '#ffffff', sub: '#ffffff', defs: '' },
};

THEMES.depth.defs = THEMES.color.defs; // shares the gradients + the soft shadow filter

function markMarkup(mark, theme, indent = '  ', { filter = THEMES[theme].filter || null, fills = null } = {}) {
  const p = fills ? { ...THEMES[theme], ...fills } : THEMES[theme];
  const bt = mark.brainTransform;
  return [
    `${indent}<g class="vriddhi-mark"${filter ? ` filter="${filter}"` : ''}>`,
    `${indent}  <path d="${mark.vLeft}" fill="${p.vL ?? p.v}"/>`,
    `${indent}  <path d="${mark.vRight}" fill="${p.vR ?? p.v}"/>`,
    `${indent}  <path d="${mark.arrow}" fill="${p.arrow}"/>`,
    `${indent}  <path d="${mark.torch}" fill="${p.torch}"/>`,
    `${indent}  <path d="${mark.rim}" fill="${p.rim}"/>`,
    `${indent}  <g transform="translate(${n(bt.tx)} ${n(bt.ty)}) scale(${n(bt.scale)})">`,
    `${indent}    <path fill-rule="evenodd" fill="${p.brain}" d="${mark.brainContours.join(' ')}"/>`,
    `${indent}  </g>`,
    `${indent}</g>`,
  ].join('\n');
}

/** Rewrite the root width/height so librsvg renders exactly that many pixels. */
const svgAtPixels = (svgStr, width) => {
  const vb = svgStr.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const h = Math.max(1, Math.round((width * vb[3]) / vb[2]));
  return svgStr.replace(/width="[^"]*"/, `width="${width}"`).replace(/height="[^"]*"/, `height="${h}"`);
};

const renderPng = async (svgStr, width, bg = null) => {
  let img = sharp(Buffer.from(svgAtPixels(svgStr, width)), { density: 72 });
  if (bg) img = img.flatten({ background: bg });
  return img.png().toBuffer();
};

const svgDoc = (viewBox, defs, body, label = 'Vriddhi Institutions') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.map(n).join(' ')}" width="${n(viewBox[2])}" height="${n(viewBox[3])}" role="img" aria-label="${label}">
  <title>${label}</title>
${defs ? `  <defs>${defs}\n  </defs>\n` : ''}${body}
</svg>
`;

/** Horizontal lockup: mark + two-line wordmark. */
function horizontalLockup(mark, { theme = 'color', pad = 20 } = {}) {
  const p = THEMES[theme];
  const mb = mark.box;
  const gapX = 42;
  const wordX = mb.x1 + gapX;
  // Baseline alignment: "INSTITUTIONS" sits on the same line as the foot of the
  // mark, with "VRIDDHI" stacked above it. A vertically-centred block leaves the
  // mark's baseline floating between the two lines, which reads as misaligned.
  const subBaselineY = 0;
  const wordBaselineY = subBaselineY - (TEXT.lineGap + TEXT.subCaps);

  const x0 = mb.x0 - pad;
  const y0 = mb.y0 - pad;
  const x1 = wordX + TEXT.word.width + pad;
  const y1 = Math.max(mb.y1, subBaselineY) + pad;

  const body = [
    markMarkup(mark, theme, '  '),
    `<path transform="translate(${n(wordX)} ${n(wordBaselineY)})" d="${TEXT.word.d}" fill="${p.word}"/>`,
    `<path transform="translate(${n(wordX)} ${n(subBaselineY)})" d="${TEXT.sub.d}" fill="${p.sub}"/>`,
  ].join('\n');

  return svgDoc([x0, y0, x1 - x0, y1 - y0], p.defs, body);
}

/** Stacked lockup: mark above the centred wordmark. */
function stackedLockup(mark, { theme = 'color', pad = 20 } = {}) {
  const p = THEMES[theme];
  const mb = mark.box;
  const markW = mb.x1 - mb.x0;
  const contentW = Math.max(markW, TEXT.word.width);
  const gapY = 34;
  const blockH = TEXT.wordCaps + TEXT.lineGap + TEXT.subCaps;

  const x0 = -pad;
  const y0 = mb.y0 - pad;
  const x1 = contentW + pad;
  const y1 = mb.y1 + gapY + blockH + pad;

  const markTx = contentW / 2 - (mb.x0 + markW / 2);
  const body = [
    `<g transform="translate(${n(markTx)} 0)">`,
    markMarkup(mark, theme, '  '),
    '</g>',
    `<path transform="translate(${n((contentW - TEXT.word.width) / 2)} ${n(mb.y1 + gapY + TEXT.wordCaps)})" d="${TEXT.word.d}" fill="${p.word}"/>`,
    `<path transform="translate(${n((contentW - TEXT.sub.width) / 2)} ${n(mb.y1 + gapY + TEXT.wordCaps + TEXT.lineGap + TEXT.subCaps)})" d="${TEXT.sub.d}" fill="${p.sub}"/>`,
  ].join('\n');

  return svgDoc([x0, y0, x1 - x0, y1 - y0], p.defs, body);
}

/** Wordmark only — "VRIDDHI" over a letterspaced "INSTITUTIONS". */
function wordmarkOnly({ theme = 'color', pad = 8 } = {}) {
  const p = THEMES[theme];
  const h = TEXT.wordCaps + TEXT.lineGap + TEXT.subCaps;
  const body = [
    `<path d="${TEXT.word.d}" fill="${p.word}"/>`,
    `<path transform="translate(0 ${n(TEXT.wordCaps + TEXT.lineGap + TEXT.subCaps)})" d="${TEXT.sub.d}" fill="${p.sub}"/>`,
  ].join('\n');
  return svgDoc([-pad, -TEXT.wordCaps - pad, TEXT.word.width + pad * 2, h + pad * 2], p.defs, body);
}

/** Mark only. */
function markOnly(mark, { theme = 'color', pad = 12 } = {}) {
  const p = THEMES[theme];
  const mb = mark.box;
  const x0 = mb.x0 - pad;
  const y0 = mb.y0 - pad;
  const body = markMarkup(mark, theme, '  ');
  return svgDoc([x0, y0, mb.x1 - mb.x0 + pad * 2, mb.y1 - mb.y0 + pad * 2], p.defs, body);
}

/** Teal tile with the mark — app icon / avatar. */
function badgeMark(mark, { size = 512, radius = 112, pad = 0.22, mono = '#ffffff', radiusPct = null } = {}) {
  const mb = mark.box;
  const markW = mb.x1 - mb.x0;
  const markH = mb.y1 - mb.y0;
  const inner = size * (1 - pad * 2);
  const scale = Math.min(inner / markW, inner / markH);
  const tx = size / 2 - ((mb.x0 + mb.x1) / 2) * scale;
  const ty = size / 2 - ((mb.y0 + mb.y1) / 2) * scale;
  const rx = radiusPct === null ? radius : size * radiusPct;
  const inner2 = markMarkup(mark, 'white', '    ').replace(/url\(#grad[A-Za-z]+\)/g, mono);
  return svgDoc(
    [0, 0, size, size],
    `<linearGradient id="tile" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size}" y2="${size}">
      <stop offset="0" stop-color="${C.teal500}"/><stop offset="1" stop-color="${C.teal700}"/>
    </linearGradient>`,
    `  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#tile)"/>\n  <g transform="translate(${n(tx)} ${n(ty)}) scale(${n(scale)})">\n${inner2}\n  </g>`
  );
}

/**
 * Presentation icon for store listings / hero art: the tile is inset so a real
 * shadow has room to fall. Deliberately NOT used for the installed app icon
 * (the OS masks and composites those itself).
 */
function storeIcon(mark, { size = 1024, scale = 0.74, radiusPct = 0.225 } = {}) {
  const s2 = size * scale;
  const ox = (size - s2) / 2;
  const oy = (size - s2) / 2;
  const mb = mark.box;
  const inner = s2 * 0.68;
  const mScale = Math.min(inner / (mb.x1 - mb.x0), inner / (mb.y1 - mb.y0));
  const tx = size / 2 - ((mb.x0 + mb.x1) / 2) * mScale;
  const ty = size / 2 - ((mb.y0 + mb.y1) / 2) * mScale;
  const body = `  <g filter="url(#tileShadow)">
    <rect x="${n(ox)}" y="${n(oy)}" width="${n(s2)}" height="${n(s2)}" rx="${n(s2 * radiusPct)}" fill="url(#tile)"/>
  </g>
  <g transform="translate(${n(tx)} ${n(ty)}) scale(${n(mScale)})">
${markMarkup(mark, 'white', '    ').replace(/url\(#grad[A-Za-z]+\)/g, '#ffffff')}
  </g>`;
  return svgDoc(
    [0, 0, size, size],
    `
    <linearGradient id="tile" gradientUnits="userSpaceOnUse" x1="${n(ox)}" y1="${n(oy)}" x2="${n(ox + s2)}" y2="${n(oy + s2)}">
      <stop offset="0" stop-color="${C.teal500}"/><stop offset="1" stop-color="${C.teal700}"/>
    </linearGradient>
    <filter id="tileShadow" x="-45%" y="-45%" width="190%" height="200%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="${n(size * 0.035)}" stdDeviation="${n(size * 0.032)}" flood-color="#0f172a" flood-opacity="0.30"/>
      <feDropShadow dx="0" dy="${n(size * 0.012)}" stdDeviation="${n(size * 0.012)}" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>`,
    body
  );
}


/* =========================================================================
 * 7. REACT COMPONENT (generated from the same geometry as the files above)
 * ====================================================================== */

function reactComponent() {
  const mb = MARK.box;
  const inkLeft = MARK.vLeft;
  const inkRight = [MARK.vRight, MARK.arrow].join(' ');
  const inkTorch = [MARK.torch, MARK.rim].join(' ');
  const wordX = mb.x1 + 42;
  const blockH = TEXT.wordCaps + TEXT.lineGap + TEXT.subCaps;
  const blockY = (mb.y0 + mb.y1) / 2 - blockH / 2;

  // badge: centre the mark on a 512 tile with 22% padding
  const badgeInner = 512 * 0.56;
  const badgeScale = Math.min(badgeInner / (mb.x1 - mb.x0), badgeInner / (mb.y1 - mb.y0));
  const badgeTx = 256 - ((mb.x0 + mb.x1) / 2) * badgeScale;
  const badgeTy = 256 - ((mb.y0 + mb.y1) / 2) * badgeScale;

  return `/**
 * Vriddhi Institutions — logo component.
 *
 * GENERATED FILE — do not edit by hand.
 * Source of truth: brand/tools/build-brand.mjs  →  npm run brand:build
 *
 * The mark is a monogram of the two initials: the "V" is cut square and its
 * right stroke rises into an arrowhead (vriddhi = growth), while the "I" is
 * drawn as a torch whose flame is a brain (knowledge). Every path is flat
 * geometry, so the logo stays crisp at any size and works in one colour.
 */

import React, { useId } from 'react';

export type VriddhiLogoVariant = 'mark' | 'horizontal' | 'stacked' | 'badge' | 'wordmark';

export interface VriddhiLogoProps {
  variant?: VriddhiLogoVariant;
  /** Renders the logo in a single colour — use for print, stamps and favicons. */
  mono?: string;
  /** Renders for dark backgrounds. */
  reverse?: boolean;
  /** Rendered height in pixels (the aspect ratio is preserved). */
  height?: number | string;
  /**
   * Drops the brain's fold detail. The 'badge' variant does this by default,
   * because below ~32px the folds stop being readable and turn into noise.
   */
  simple?: boolean;
  className?: string;
  title?: string;
}

const VIEWBOXES: Record<VriddhiLogoVariant, [number, number, number, number]> = {
  mark: [${n(mb.x0 - 12)}, ${n(mb.y0 - 12)}, ${n(mb.x1 - mb.x0 + 24)}, ${n(mb.y1 - mb.y0 + 24)}],
  badge: [0, 0, 512, 512],
  wordmark: [${n(-6)}, ${n(-TEXT.wordCaps - 6)}, ${n(TEXT.word.width + 12)}, ${n(TEXT.wordCaps * 2 + TEXT.lineGap + TEXT.subCaps + 12)}],
  horizontal: [${n(mb.x0 - 20)}, ${n(mb.y0 - 20)}, ${n(wordX + TEXT.word.width - mb.x0 + 40)}, ${n(Math.max(mb.y1, blockY + blockH) - mb.y0 + 40)}],
  stacked: [${n(-20)}, ${n(mb.y0 - 20)}, ${n(Math.max(mb.x1 - mb.x0, TEXT.word.width) + 40)}, ${n(mb.y1 - mb.y0 + 34 + blockH + 40)}],
};

const MARK_LEFT = '${inkLeft}';
const MARK_RIGHT = '${inkRight}';
const MARK_TORCH = '${inkTorch}';
const BRAIN = '${MARK.brainContours.join(' ')}';
/** Same silhouette with the fold detail dropped — for icons and tiny sizes. */
const BRAIN_SIMPLE = '${SIMPLE_MARK.brainContours.join(' ')}';
const BRAIN_T = { x: ${n(MARK.brainTransform.tx)}, y: ${n(MARK.brainTransform.ty)}, s: ${n(MARK.brainTransform.scale)} };
const WORD = '${TEXT.word.d}';
const SUB = '${TEXT.sub.d}';
const TEXT_METRICS = { wordCaps: ${n(TEXT.wordCaps)}, lineGap: ${n(TEXT.lineGap)}, subCaps: ${n(TEXT.subCaps)} };
const MARK_BOX = { x1: ${n(mb.x1)} };

export default function VriddhiLogo({
  variant = 'horizontal',
  mono,
  reverse = false,
  height,
  className,
  title = 'Vriddhi Institutions',
  simple,
}: VriddhiLogoProps) {
  const uid = useId().replace(/[:]/g, '');
  const id = (name: string) => \`\${name}-\${uid}\`;

  // Two-tone V: the left stroke sits in shadow, the right stroke (and the
  // arrow growing out of it) carries the light. The torch then repeats the
  // same dark-to-light rhythm, so the mark alternates in a deliberate beat.
  const inkLeft = mono ?? (reverse ? '#14b8a6' : '#0f766e');
  const inkRight = mono ?? (reverse ? '#5eead4' : \`url(#\${id('ink')})\`);
  const inkTorch = mono ?? (reverse ? '#5eead4' : \`url(#\${id('torch')})\`);
  const brain = mono ?? (reverse ? '#ffffff' : \`url(#\${id('brain')})\`);
  const word = mono ?? (reverse ? '#ffffff' : '#0f172a');
  const sub = mono ?? (reverse ? '#5eead4' : '#0d9488');
  const flat = (v: string) => (mono ? mono : v);

  const useSimple = simple ?? variant === 'badge';
  const brainPath = useSimple ? BRAIN_SIMPLE : BRAIN;

  const mark = (
    <>
      <path d={MARK_LEFT} fill={inkLeft} />
      <path d={MARK_RIGHT} fill={inkRight} />
      <path d={MARK_TORCH} fill={inkTorch} />
      <g transform={\`translate(\${BRAIN_T.x} \${BRAIN_T.y}) scale(\${BRAIN_T.s})\`}>
        <path fillRule="evenodd" fill={brain} d={brainPath} />
      </g>
    </>
  );

  const wordX = MARK_BOX.x1 + 42;
  const blockY = (${n(mb.y0)} + ${n(mb.y1)}) / 2 - (TEXT_METRICS.wordCaps + TEXT_METRICS.lineGap + TEXT_METRICS.subCaps) / 2;
  const stackedWidth = Math.max(${n(mb.x1 - mb.x0)}, ${n(TEXT.word.width)});
  const stackedSubX = (stackedWidth - ${n(TEXT.sub.width)}) / 2;

  const [vx, vy, vw, vh] = VIEWBOXES[variant];
  const needsGradients = !mono;

  return (
    <svg
      viewBox={\`\${vx} \${vy} \${vw} \${vh}\`}
      height={height}
      className={className}
      role="img"
      aria-label={title}
      style={{ height, width: 'auto', display: 'block' }}
    >
      <title>{title}</title>
      {needsGradients && (
        <defs>
          <linearGradient id={id('ink')} gradientUnits="userSpaceOnUse" x1="-20" y1="-140" x2="-20" y2="6">
            <stop offset="0" stopColor="#2dd4bf" />
            <stop offset="0.5" stopColor="#14b8a6" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id={id('torch')} gradientUnits="userSpaceOnUse" x1="0" y1="-84" x2="0" y2="6">
            <stop offset="0" stopColor="#0f766e" />
            <stop offset="1" stopColor="#134e4a" />
          </linearGradient>
          <linearGradient id={id('brain')} gradientUnits="userSpaceOnUse" x1="0" y1="-140" x2="0" y2="-86">
            <stop offset="0" stopColor="#5eead4" />
            <stop offset="1" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id={id('tile')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="512" y2="512">
            <stop offset="0" stopColor="#14b8a6" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
      )}

      {variant === 'mark' && <g>{mark}</g>}

      {variant === 'badge' && (
        <>
          <rect width="512" height="512" rx="112" fill={flat(\`url(#\${id('tile')})\`)} />
          <g transform={\`translate(${n(badgeTx)} ${n(badgeTy)}) scale(${n(badgeScale)})\`}>
            <path d={MARK_LEFT} fill={mono ?? '#ffffff'} />
            <path d={MARK_RIGHT} fill={mono ?? '#ffffff'} />
            <path d={MARK_TORCH} fill={mono ?? '#ffffff'} />
            <g transform={\`translate(\${BRAIN_T.x} \${BRAIN_T.y}) scale(\${BRAIN_T.s})\`}>
              <path fillRule="evenodd" fill={mono ?? '#ffffff'} d={brainPath} />
            </g>
          </g>
        </>
      )}

      {variant === 'wordmark' && (
        <>
          <path d={WORD} fill={word} />
          <g transform={\`translate(0 \${TEXT_METRICS.wordCaps + TEXT_METRICS.lineGap + TEXT_METRICS.subCaps})\`}>
            <path d={SUB} fill={sub} />
          </g>
        </>
      )}

      {variant === 'horizontal' && (
        <>
          <g>{mark}</g>
          <g transform={\`translate(\${wordX} \${blockY + TEXT_METRICS.wordCaps})\`}>
            <path d={WORD} fill={word} />
          </g>
          <g transform={\`translate(\${wordX} \${blockY + TEXT_METRICS.wordCaps + TEXT_METRICS.lineGap + TEXT_METRICS.subCaps})\`}>
            <path d={SUB} fill={sub} />
          </g>
        </>
      )}

      {variant === 'stacked' && (
        <>
          <g transform={\`translate(\${(stackedWidth - (${n(mb.x1 - mb.x0)})) / 2 - ${n(mb.x0)}} 0)\`}>{mark}</g>
          <g transform={\`translate(\${(stackedWidth - ${n(TEXT.word.width)}) / 2} \${${n(mb.y1)} + 34 + TEXT_METRICS.wordCaps})\`}>
            <path d={WORD} fill={word} />
          </g>
          <g
            transform={\`translate(\${stackedSubX} \${${n(mb.y1)} + 34 + TEXT_METRICS.wordCaps + TEXT_METRICS.lineGap + TEXT_METRICS.subCaps})\`}
          >
            <path d={SUB} fill={sub} />
          </g>
        </>
      )}
    </svg>
  );
}
`;
}

/* =========================================================================
 * 6. OUTPUT
 * ====================================================================== */

const svgDir = path.join(BRAND_DIR, 'logo', 'svg');
const pngDir = path.join(BRAND_DIR, 'logo', 'png');
fs.mkdirSync(svgDir, { recursive: true });
fs.mkdirSync(pngDir, { recursive: true });

const files = {
  'vriddhi-logo-horizontal.svg': horizontalLockup(MARK, { theme: 'color' }),
  'vriddhi-logo-horizontal-reverse.svg': horizontalLockup(MARK, { theme: 'reverse' }),
  'vriddhi-logo-stacked.svg': stackedLockup(MARK, { theme: 'color' }),
  'vriddhi-logo-horizontal-mono-black.svg': horizontalLockup(MARK, { theme: 'black' }),
  'vriddhi-logo-stacked-mono-black.svg': stackedLockup(MARK, { theme: 'black' }),
  'vriddhi-mark.svg': markOnly(MARK, { theme: 'color' }),
  'vriddhi-mark-mono-black.svg': markOnly(MARK, { theme: 'black' }),
  'vriddhi-mark-mono-white.svg': markOnly(MARK, { theme: 'white' }),
  'vriddhi-mark-badge.svg': badgeMark(MARK),
  'vriddhi-logo-horizontal-lift.svg': horizontalLockup(MARK, { theme: 'depth' }),
  'vriddhi-mark-lift.svg': markOnly(MARK, { theme: 'depth' }),
  'vriddhi-store-icon.svg': storeIcon(MARK),
  'vriddhi-store-icon-simple.svg': storeIcon(SIMPLE_MARK),
  'vriddhi-wordmark.svg': wordmarkOnly({ theme: 'color' }),
};

for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(svgDir, name), content);

const componentPath = path.join(REPO, 'src', 'shared', 'components', 'VriddhiLogo.tsx');
fs.mkdirSync(path.dirname(componentPath), { recursive: true });
fs.writeFileSync(componentPath, reactComponent());

fs.mkdirSync(path.join(REPO, 'public', 'icons'), { recursive: true });
// icons are always small: the simplified mark keeps the brain readable
fs.writeFileSync(path.join(REPO, 'public', 'icons', 'icon.svg'), badgeMark(SIMPLE_MARK));
fs.writeFileSync(path.join(REPO, 'public', 'icons', 'maskable.svg'), badgeMark(SIMPLE_MARK, { radius: 0, pad: 0.3 }));

async function exportPng() {
  if (!sharp) return console.log('· sharp unavailable — SVG only');
  // wipe first so no stale asset from an earlier geometry survives
  fs.rmSync(pngDir, { recursive: true, force: true });
  fs.mkdirSync(pngDir, { recursive: true });
  const fromSvg = (file) => fs.readFileSync(path.join(svgDir, file), 'utf8');
  const jobs = [
    ['brand/logo/png/vriddhi-logo-horizontal@1600.png', fromSvg('vriddhi-logo-horizontal.svg'), 1600, '#ffffff'],
    ['brand/logo/png/vriddhi-logo-horizontal-transparent@1600.png', fromSvg('vriddhi-logo-horizontal.svg'), 1600, null],
    ['brand/logo/png/vriddhi-logo-horizontal@800.png', fromSvg('vriddhi-logo-horizontal.svg'), 800, '#ffffff'],
    ['brand/logo/png/vriddhi-logo-stacked@1200.png', fromSvg('vriddhi-logo-stacked.svg'), 1200, '#ffffff'],
    ['brand/logo/png/vriddhi-logo-horizontal-reverse@1600.png', fromSvg('vriddhi-logo-horizontal-reverse.svg'), 1600, '#0b1220'],
    ['brand/logo/png/vriddhi-mark@1024.png', fromSvg('vriddhi-mark.svg'), 1024, '#ffffff'],
    ['brand/logo/png/vriddhi-mark-transparent@1024.png', fromSvg('vriddhi-mark.svg'), 1024, null],
    ['brand/logo/png/vriddhi-mark-mono-black@1024.png', fromSvg('vriddhi-mark-mono-black.svg'), 1024, '#ffffff'],
    ['brand/logo/png/vriddhi-mark-mono-white@1024.png', fromSvg('vriddhi-mark-mono-white.svg'), 1024, C.slate900],
    ['brand/logo/png/vriddhi-mark-badge@1024.png', fromSvg('vriddhi-mark-badge.svg'), 1024, null],
    ['public/icons/icon-192.png', badgeMark(SIMPLE_MARK), 192, null],
    ['public/icons/icon-512.png', badgeMark(SIMPLE_MARK), 512, null],
    ['public/icons/apple-touch-icon.png', badgeMark(SIMPLE_MARK), 180, null],
    ['public/icons/favicon-32.png', badgeMark(SIMPLE_MARK), 32, null],
    ['public/icons/favicon-48.png', badgeMark(SIMPLE_MARK), 48, null],
    ['public/icons/maskable-512.png', badgeMark(SIMPLE_MARK, { radius: 0, pad: 0.3 }), 512, null],
    ['brand/logo/png/vriddhi-logo-horizontal-lift@1600.png', fromSvg('vriddhi-logo-horizontal-lift.svg'), 1600, null],
    ['brand/logo/png/vriddhi-mark-lift@1024.png', fromSvg('vriddhi-mark-lift.svg'), 1024, null],
    ['brand/logo/png/vriddhi-store-icon@1024.png', fromSvg('vriddhi-store-icon.svg'), 1024, null],
    ['brand/logo/png/vriddhi-store-icon@512.png', fromSvg('vriddhi-store-icon.svg'), 512, null],
    ['brand/logo/png/vriddhi-store-icon-simple@1024.png', fromSvg('vriddhi-store-icon-simple.svg'), 1024, null],
    ['brand/logo/png/vriddhi-store-icon-simple@256.png', fromSvg('vriddhi-store-icon-simple.svg'), 256, null],
  ];
  for (const [rel, svgStr, width, bg] of jobs) {
    const abs = path.join(REPO, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    await sharp(await renderPng(svgStr, width, bg)).toFile(abs);
  }
  console.log(`✓ ${jobs.length} PNG exports`);
}

/* ---- optional: comparison sheet of arrow treatments ------------------- */
async function variantSheet() {
  const variants = [
    ['A  arrow rises along the stroke · notched base', { variant: 'arm', barbHalf: 25, length: 44, notch: 10 }],
    ['B  arrow rises along the stroke · solid base', { variant: 'arm', barbHalf: 25, length: 44, notch: 0 }],
    ['C  arrow points straight up · notched base', { variant: 'vertical', barbHalf: 27, length: 42, notch: 11 }],
    ['D  arrow points straight up · solid base', { variant: 'vertical', barbHalf: 27, length: 42, notch: 0 }],
  ];

  const cellW = 620;
  const cellH = 520;
  const cols = 2;
  const rowsN = 2;
  const cells = variants
    .map(([label, opt], i) => {
      const mark = buildMark(opt);
      const mb = mark.box;
      const scale = Math.min((cellW - 120) / (mb.x1 - mb.x0), (cellH - 150) / (mb.y1 - mb.y0));
      const gx = (i % cols) * cellW;
      const gy = Math.floor(i / cols) * cellH;
      const tx = gx + (cellW - (mb.x1 - mb.x0) * scale) / 2 - mb.x0 * scale;
      const ty = gy + 52 - mb.y0 * scale;
      return `<g transform="translate(${n(tx)} ${n(ty)}) scale(${n(scale)})">${markMarkup(mark, 'color', '')}</g>
      <text x="${gx + cellW / 2}" y="${gy + cellH - 46}" text-anchor="middle" font-family="Inter, DejaVu Sans, sans-serif" font-size="19" fill="#334155">${label}</text>`;
    })
    .join('\n');

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cellW * cols} ${cellH * rowsN}" width="${cellW * cols}" height="${cellH * rowsN}">
  <defs>${THEMES.color.defs}</defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <line x1="0" y1="${cellH}" x2="${cellW * cols}" y2="${cellH}" stroke="#e2e8f0" stroke-width="2"/>
  <line x1="${cellW}" y1="0" x2="${cellW}" y2="${cellH * rowsN}" stroke="#e2e8f0" stroke-width="2"/>
  ${cells}
</svg>`;
  fs.mkdirSync(path.join(BRAND_DIR, 'concepts'), { recursive: true });
  fs.writeFileSync(path.join(BRAND_DIR, 'concepts', 'arrow-variants.svg'), svgStr);
  if (sharp) await sharp(Buffer.from(svgStr), { density: 200 }).png().toFile(path.join(BRAND_DIR, 'concepts', 'arrow-variants.png'));
  console.log('✓ arrow variant sheet');
}

/**
 * Renders the same artwork flat, soft-shadowed and heavily shadowed side by
 * side, plus a small-size strip — which is where drop shadows usually fall
 * apart. Each panel is rasterised on its own and composited at exact pixel
 * coordinates, so what you see is what the asset really looks like.
 */
async function shadowSheet() {
  if (!sharp) return;
  const panelW = 780;
  const panelH = 600;
  const cols = 4;
  const W = panelW * cols;
  const H = panelH;

  const flat = horizontalLockup(MARK, { theme: 'color', pad: 24 });
  const lift = horizontalLockup(MARK, { theme: 'depth', pad: 24 });
  const heavy = horizontalLockup(MARK, { theme: 'depth', pad: 24 }).replace('softShadow', 'liftShadow');

  const raster = async (svgStr, width) => {
    const buf = await renderPng(svgStr, width);
    const m = await sharp(buf).metadata();
    return { buf, w: m.width, h: m.height };
  };

  const base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${[1, 2, 3].map((i) => `<line x1="${panelW * i}" y1="0" x2="${panelW * i}" y2="${H}" stroke="#eef2f6" stroke-width="2"/>`).join('')}
  ${['flat — this is the primary logo', 'soft shadow on the mark — hero / splash', "heavy shadow — why we don't", 'app icon, shadowed — premium']
    .map((label, i) => `<text x="${i * panelW + 40}" y="${H - 34}" font-family="Inter, DejaVu Sans, sans-serif" font-size="19" fill="#334155">${label}</text>`)
    .join('')}
  ${[0, 1, 2, 3].map((i) => [96, 48, 28].map((px, k) => `<text x="${i * panelW + 42 + k * 130}" y="452" font-family="Inter, DejaVu Sans, sans-serif" font-size="13" fill="#94a3b8">${px}px</text>`).join('')).join('')}
</svg>`;

  const composites = [];
  const lockups = [flat, lift, heavy];
  for (let i = 0; i < lockups.length; i++) {
    const img = await raster(lockups[i], panelW - 90);
    composites.push({ input: img.buf, left: Math.round(i * panelW + (panelW - img.w) / 2), top: 90 });
    const theme = i === 0 ? 'color' : 'depth';
    for (let k = 0; k < 3; k++) {
      const px = [96, 48, 28][k];
      const mb = MARK.box;
      const sc = px / 236;
      const small = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(mb.x0 * sc).toFixed(1)} ${(mb.y0 * sc).toFixed(1)} ${((mb.x1 - mb.x0) * sc).toFixed(1)} ${((mb.y1 - mb.y0) * sc).toFixed(1)}" width="${Math.ceil((mb.x1 - mb.x0) * sc)}" height="${Math.ceil((mb.y1 - mb.y0) * sc)}">
        <defs>${THEMES[theme].defs}</defs>
        <g transform="scale(${n(sc)})">${markMarkup(MARK, theme, '')}</g>
      </svg>`;
      const img2 = await raster(small, Math.ceil((mb.x1 - mb.x0) * sc));
      composites.push({ input: img2.buf, left: Math.round(i * panelW + 46 + k * 132), top: 430 - img2.h });
    }
  }

  const icon = await raster(storeIcon(MARK, { size: 512 }), 300);
  composites.push({
    input: icon.buf,
    left: Math.round(3 * panelW + (panelW - icon.w) / 2),
    top: 60,
  });

  fs.mkdirSync(path.join(BRAND_DIR, 'concepts'), { recursive: true });
  const baseBuf = await sharp(Buffer.from(base), { density: 72 }).png().toBuffer();
  await sharp(baseBuf).composite(composites).png().toFile(path.join(BRAND_DIR, 'concepts', 'shadow-comparison.png'));
  console.log('✓ shadow comparison sheet');
}

/** Dual-colour treatments for the V, rendered on the real mark. */
const V_TREATMENTS = [
  {
    key: 'ribbon',
    label: 'A · folded ribbon  (shipped)',
    note: 'deep teal + bright teal — the two strokes read as one folded form',
    fills: { vL: C.teal700, vR: 'url(#gradV)', arrow: 'url(#gradV)', torch: 'url(#gradTorch)', rim: C.teal600 },
  },
  {
    key: 'contrast',
    label: 'B · high contrast',
    note: 'teal-800 left stroke — the strongest split, best on screens',
    fills: { vL: C.teal900, vR: 'url(#gradV)', arrow: 'url(#gradV)', torch: 'url(#gradTorch)', rim: C.teal600 },
  },
  {
    key: 'bright-stem',
    label: 'C · bright stem',
    note: 'light left stroke, dark right — reverses which stroke leads',
    fills: { vL: C.teal400, vR: C.teal800, arrow: C.teal800, torch: 'url(#gradTorch)', rim: C.teal600 },
  },
  {
    key: 'subtle',
    label: 'D · subtle two-tone',
    note: 'teal-600 against the gradient — quietest option, closest to flat',
    fills: { vL: C.teal600, vR: 'url(#gradV)', arrow: 'url(#gradV)', torch: 'url(#gradTorch)', rim: C.teal600 },
  },
];

async function colourSheet() {
  if (!sharp) return;
  const cellW = 560;
  const cellH = 520;
  const panels = [];

  for (const [i, t] of V_TREATMENTS.entries()) {
    const mb = MARK.box;
    const sc = 200 / 236;
    const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(mb.x0 * sc).toFixed(1)} ${(mb.y0 * sc).toFixed(1)} ${((mb.x1 - mb.x0) * sc).toFixed(1)} ${((mb.y1 - mb.y0) * sc).toFixed(1)}" width="${Math.ceil((mb.x1 - mb.x0) * sc)}" height="${Math.ceil((mb.y1 - mb.y0) * sc)}">
      <defs>${THEMES.color.defs}</defs>
      <g transform="scale(${n(sc)})">${markMarkup(MARK, 'color', '', { fills: t.fills })}</g>
    </svg>`;
    const buf = await renderPng(markSvg, Math.ceil((mb.x1 - mb.x0) * sc));
    const m = await sharp(buf).metadata();
    panels.push({
      input: buf,
      left: Math.round((i % 2) * cellW + (cellW - m.width) / 2),
      top: Math.round(Math.floor(i / 2) * cellH + 70),
    });
  }

  const base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cellW * 2} ${cellH * 2}" width="${cellW * 2}" height="${cellH * 2}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <line x1="${cellW}" y1="0" x2="${cellW}" y2="${cellH * 2}" stroke="#eef2f6" stroke-width="2"/>
    <line x1="0" y1="${cellH}" x2="${cellW * 2}" y2="${cellH}" stroke="#eef2f6" stroke-width="2"/>
    ${V_TREATMENTS.map((t, i) => {
      const gx = (i % 2) * cellW;
      const gy = Math.floor(i / 2) * cellH;
      return `<text x="${gx + cellW / 2}" y="${gy + cellH - 78}" text-anchor="middle" font-family="Inter, DejaVu Sans, sans-serif" font-size="20" font-weight="600" fill="#0f172a">${t.label}</text>
      <text x="${gx + cellW / 2}" y="${gy + cellH - 50}" text-anchor="middle" font-family="Inter, DejaVu Sans, sans-serif" font-size="15" fill="#64748b">${t.note}</text>`;
    }).join('')}
  </svg>`;

  const baseBuf = await sharp(Buffer.from(base), { density: 72 }).png().toBuffer();
  await sharp(baseBuf).composite(panels).png().toFile(path.join(BRAND_DIR, 'concepts', 'v-colour-treatments.png'));
  console.log('✓ V colour treatment sheet');
}

/**
 * One-glance contact sheet of the whole system: lockups, mark, reverse,
 * one-colour, badge and the small-size ladder.
 */
async function systemSheet() {
  if (!sharp) return;
  const W = 1560;
  const H = 1180;
  const raster = async (svgStr, width) => {
    const buf = await renderPng(svgStr, width);
    const m = await sharp(buf).metadata();
    return { buf, w: m.width, h: m.height };
  };

  const panels = [];
  const add = async (svgStr, width, left, top) => {
    const img = await raster(svgStr, width);
    panels.push({ input: img.buf, left: Math.round(left), top: Math.round(top) });
  };

  await add(horizontalLockup(MARK, { theme: 'color', pad: 24 }), 700, 90, 80);
  await add(horizontalLockup(MARK, { theme: 'black', pad: 24 }), 700, 830, 80);
  await add(stackedLockup(MARK, { theme: 'color', pad: 24 }), 290, 150, 340);
  await add(wordmarkOnly({ theme: 'color' }), 430, 520, 400);
  await add(markOnly(MARK, { theme: 'color', pad: 16 }), 240, 1060, 350);
  await add(badgeMark(SIMPLE_MARK, { size: 512 }), 200, 1290, 660);
  await add(badgeMark(MARK, { size: 512 }), 200, 1060, 660);

  // small-size ladder (the honest test)
  for (const [i, px] of [72, 48, 32, 24, 16].entries()) {
    const mb = MARK.box;
    const sc = px / 236;
    const small = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(mb.x0 * sc).toFixed(1)} ${(mb.y0 * sc).toFixed(1)} ${((mb.x1 - mb.x0) * sc).toFixed(1)} ${((mb.y1 - mb.y0) * sc).toFixed(1)}" width="${Math.ceil((mb.x1 - mb.x0) * sc)}" height="${Math.ceil((mb.y1 - mb.y0) * sc)}">
      <defs>${THEMES.color.defs}</defs>
      <g transform="scale(${n(sc)})">${markMarkup(MARK, 'color', '')}</g>
    </svg>`;
    await add(small, Math.ceil((mb.x1 - mb.x0) * sc), 150 + i * 110, 900);
  }

  const base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="90" y="52" font-family="Inter, DejaVu Sans, sans-serif" font-size="26" font-weight="600" fill="#0f172a">Vriddhi Institutions — logo system</text>
  <text x="90" y="320" font-family="Inter, DejaVu Sans, sans-serif" font-size="15" fill="#94a3b8">primary · stacked · mark · badge</text>
  <text x="830" y="320" font-family="Inter, DejaVu Sans, sans-serif" font-size="15" fill="#94a3b8">one colour (print, engraving, stamps)</text>
  <text x="1060" y="900" font-family="Inter, DejaVu Sans, sans-serif" font-size="15" fill="#94a3b8">badge (detailed / simplified)</text>
  <text x="150" y="880" font-family="Inter, DejaVu Sans, sans-serif" font-size="15" fill="#94a3b8">small-size ladder — still legible at 24px</text>
  <line x1="60" y1="850" x2="${W - 60}" y2="850" stroke="#eef2f6" stroke-width="2"/>
</svg>`;

  const baseBuf = await sharp(Buffer.from(base), { density: 72 }).png().toBuffer();
  await sharp(baseBuf).composite(panels).png().toFile(path.join(BRAND_DIR, 'concepts', 'logo-system.png'));
  console.log('✓ logo system sheet');
}

await exportPng();
if (process.argv.includes('--variants')) await variantSheet();
if (process.argv.includes('--colour') || process.argv.includes('--variants')) await colourSheet();
if (process.argv.includes('--sheet') || process.argv.includes('--variants')) await systemSheet();
if (process.argv.includes('--shadow')) await shadowSheet();

console.log(`✓ ${Object.keys(files).length} SVG files → brand/logo/svg`);
console.log('✓ src/shared/components/VriddhiLogo.tsx');
console.log(`  mark box: ${JSON.stringify(MARK.box, (k, v) => (typeof v === 'number' ? +v.toFixed(1) : v))}`);
