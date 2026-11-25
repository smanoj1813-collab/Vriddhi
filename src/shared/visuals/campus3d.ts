// src/shared/visuals/campus3d.ts
//
// A tiny hand-rolled 3D engine for the public landing / sign-in hero.
//
// Why not three.js / WebGL: this is one decorative illustration that must load
// instantly on a budget Android phone over 4G, never request a network resource
// at runtime, and never add a paid service. It draws with the SVG primitives the
// page already ships, so the incremental cost is a few kB of code — no extra
// npm dependency, no GPU context, no CDN, no per-render billing.
//
// What it does: boxes are described in world space, rotated by a yaw/pitch
// camera, perspective-projected, lit per face, tinted by depth (aerial
// perspective), then sorted far-to-near so SVG's painter's algorithm produces
// correct overlaps. Everything here is pure, so the maths is unit-tested.

export type Vec3 = [number, number, number];

export interface View {
  /** Rotation around the vertical axis, in radians. 0 looks at the front. */
  yaw: number;
  /** Small tilt, in radians. Positive tips the camera down a little. */
  pitch: number;
  /** Camera stand-off in world units. Kept well beyond the scene's depth. */
  distance: number;
  /** World height that maps to the vertical centre of the drawing. */
  centreY: number;
}

export type WorldFace = {
  /** Points in world space, wound in screen order. */
  points: Vec3[];
  /** Flat face colour before lighting. */
  base: string;
  /** Outward normal, used for the facing ratio. Omit for flat decals. */
  normal?: Vec3;
  /** 0-1, multiplied into the final alpha. */
  opacity?: number;
  /** Optional hairline so abutting panels stay legible when lit alike. */
  stroke?: string;
};

export type WorldShape = {
  id: string;
  /** Groups shapes so hover/drag can react to a whole building. */
  group?: string;
  faces: WorldFace[];
};

export type ScreenFace = {
  points: [number, number][];
  fill: string;
  stroke?: string;
};

export type Solid = {
  id: string;
  group?: string;
  depth: number;
  faces: ScreenFace[];
};

export type Billboard = {
  id: string;
  art: 'student' | 'student-alt' | 'sun' | 'cloud' | 'leaf';
  anchor: [number, number];
  /** Screen pixels per world unit at this anchor's depth. */
  scale: number;
  depth: number;
  tint: number;
};

export type Link = {
  id: string;
  from: [number, number];
  to: [number, number];
  depth: number;
};

export type Scene = {
  ground: ScreenFace[];
  solids: Solid[];
  billboards: Billboard[];
  links: Link[];
};

/** Camera stand-off. Far enough back that no geometry crosses the eye plane. */
export const CAMERA_DISTANCE = 1100;
/** Pitch follows yaw slightly, so looking around also lifts the view. */
export const PITCH_FROM_YAW = 0.055;
/** Screen pixels per world unit at unit depth. */
export const FOCAL = 1450;
/** The light comes from the upper front-left, matching the page's sun. */
export const LIGHT: Vec3 = [-0.42, -0.78, 0.46];
/** How much of a face's own colour survives when the light never reaches it. */
const AMBIENT = 0.7;
/** Depth at which aerial tint starts, and how long it takes to reach full. */
const HAZE_NEAR = 520;
const HAZE_SPAN = 1700;
const HAZE_MAX = 0.26;
const HAZE_COLOUR = [238, 246, 237] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Rotation about the world's vertical axis. The camera lives at -z looking
 * toward +z, so a point's depth is `distance - z`: nearer geometry (larger z)
 * must come out with the smaller depth.
 */
export function rotateY(v: Vec3, yaw: number): { x: number; y: number; z: number } {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return { x: v[0] * cos + v[2] * sin, y: v[1], z: -v[0] * sin + v[2] * cos };
}

/**
 * Projects a world point to screen space. Screen y is flipped so +y is up, and
 * the result is centred on the world's vertical centre so the caller can place
 * the whole drawing with a single translate.
 */
export function project(v: Vec3, view: View): { x: number; y: number; depth: number; scale: number } {
  const rotated = rotateY(v, view.yaw);
  const pitchCos = Math.cos(view.pitch);
  const pitchSin = Math.sin(view.pitch);
  const y = rotated.y * pitchCos - rotated.z * pitchSin;
  const z = rotated.y * pitchSin + rotated.z * pitchCos;
  // Camera at -z looking toward +z: nearer geometry (larger z) projects larger.
  // Guard the divisor: a shape that somehow slid behind the camera should
  // degrade to a very small drawing, never to Infinity/NaN in the SVG path.
  const depth = Math.max(view.distance - z, 40);
  const scale = FOCAL / depth;
  return {
    x: rotated.x * scale,
    y: -(y - view.centreY) * scale,
    depth,
    scale,
  };
}

export function makeView(yaw = -0.5, pitch = 0.15, distance = CAMERA_DISTANCE, centreY = 96): View {
  return { yaw, pitch, distance, centreY };
}

/** Far-to-near. SVG has no depth buffer, so drawing order *is* the depth test. */
export function sortByDepth<T extends { depth: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.depth - a.depth);
}

/** Lambert-style dot product, clamped to 0..1. Back faces get no direct light. */
export function facingRatio(normal: Vec3, light: Vec3 = LIGHT): number {
  const length = Math.hypot(normal[0], normal[1], normal[2]) || 1;
  const lightLength = Math.hypot(light[0], light[1], light[2]) || 1;
  const dot =
    (normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2]) / (length * lightLength);
  return Number.isFinite(dot) ? clamp(dot, 0, 1) : 0;
}

/**
 * Reads either `#rrggbb`/`#rgb` or `rgb(r, g, b)`, because lighting produces the
 * latter and aerial haze then has to consume its own pipeline's output.
 * Unrecognised input degrades to mid-grey rather than throwing.
 */
function parseColour(colour: string): [number, number, number] {
  const rgb = colour.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const value = colour.trim().replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [128, 128, 128];
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

// Comma-separated on purpose: the space-separated rgb() syntax is CSS Color 4
// and unsupported by older SVG rasterisers and some in-app webviews.
// Note the single-argument arrow: passing this straight to Array#map would hand
// map's index in as the clamp's minimum and quietly flatten every channel.
const toRgb = (channels: number[]) => `rgb(${channels.map((c) => clampChannel(c)).join(', ')})`;
const clampChannel = (value: number) => Math.round(clamp(value, 0, 255));

/** Applies the facing ratio to a flat colour, keeping it inside the sRGB gamut. */
export function shade(hex: string, ratio: number): string {
  const safe = Number.isFinite(ratio) ? clamp(ratio, 0, 1) : 0;
  const factor = AMBIENT + (1 - AMBIENT) * safe;
  return toRgb(parseColour(hex).map((channel) => channel * factor));
}

/** Mixes toward the page's paper colour as things get further away. */
export function haze(hex: string, depth: number): string {
  const t = clamp((depth - HAZE_NEAR) / HAZE_SPAN, 0, HAZE_MAX);
  const base = parseColour(hex);
  return toRgb(base.map((channel, index) => channel + (HAZE_COLOUR[index] - channel) * t));
}

export const finish = (hex: string, ratio: number, depth: number) => haze(shade(hex, ratio), depth);

export interface BoxOptions {
  /** Base colour for all faces before lighting. */
  color: string;
  opacity?: number;
  stroke?: string;
  /** Faces to omit, when a box sits against another one and hides it anyway. */
  skip?: Array<'top' | 'front' | 'back' | 'left' | 'right' | 'bottom'>;
}

const enumSide = { front: [0, 0, 1], back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0], top: [0, 1, 0], bottom: [0, -1, 0] } as const;

/**
 * An axis-aligned box standing on `origin` (its bottom-centre), extruded upward.
 * Returns five faces — the bottom is never visible from a camera above it.
 */
export function boxes(
  origin: Vec3,
  size: { w: number; h: number; d: number },
  options: BoxOptions | string,
): WorldFace[] {
  const opts: BoxOptions = typeof options === 'string' ? { color: options } : options;
  const [x, y, z] = origin;
  const { w, h, d } = size;
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const y0 = y;
  const y1 = y + h;
  const skip = new Set(opts.skip ?? []);

  const definitions: Array<{ side: keyof typeof enumSide; points: Vec3[] }> = [
    { side: 'top', points: [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]] },
    { side: 'front', points: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
    { side: 'right', points: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]] },
    { side: 'back', points: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]] },
    { side: 'left', points: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] },
  ];

  return definitions
    .filter((definition) => !skip.has(definition.side))
    .map((definition) => ({
      points: definition.points,
      base: opts.color,
      normal: [...enumSide[definition.side]] as Vec3,
      opacity: opts.opacity,
      stroke: opts.stroke,
    }));
}

/** A four-sided pitched roof plus its underside, sized to sit on a box. */
export function pyramid(
  origin: Vec3,
  size: { w: number; h: number; d: number },
  options: BoxOptions | string,
): WorldFace[] {
  const opts: BoxOptions = typeof options === 'string' ? { color: options } : options;
  const [x, y, z] = origin;
  const { w, h, d } = size;
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const apexY = y + h;
  const apexFront: Vec3 = [x, apexY, z + d * 0.12];
  const apexBack: Vec3 = [x, apexY, z - d * 0.12];

  return [
    { points: [[x0, y, z1], [x1, y, z1], apexFront], base: opts.color, normal: [0, 0.35, 1] },
    { points: [[x1, y, z0], [x0, y, z0], apexBack], base: opts.color, normal: [0, 0.35, -1] },
    { points: [[x0, y, z0], [x0, y, z1], apexFront, apexBack], base: opts.color, normal: [-1, 0.35, 0] },
    { points: [[x1, y, z1], [x1, y, z0], apexBack, apexFront], base: opts.color, normal: [1, 0.35, 0] },
  ];
}

/**
 * A low-poly canopy (an octahedron) used for trees. Rounded shapes read better
 * than boxes at this size, and eight triangles is cheap enough to rotate live.
 */
export function octahedron(origin: Vec3, radius: number, options: BoxOptions | string): WorldFace[] {
  const opts: BoxOptions = typeof options === 'string' ? { color: options } : options;
  const [x, y, z] = origin;
  const r = radius;
  const top: Vec3 = [x, y + r * 1.35, z];
  const bottom: Vec3 = [x, y - r * 0.55, z];
  const ring: Vec3[] = [
    [x + r, y + r * 0.28, z],
    [x, y + r * 0.28, z + r],
    [x - r, y + r * 0.28, z],
    [x, y + r * 0.28, z - r],
  ];

  const faces: WorldFace[] = [];
  for (let index = 0; index < 4; index += 1) {
    const a = ring[index];
    const b = ring[(index + 1) % 4];
    const midX = (a[0] + b[0]) / 2 - x;
    const midZ = (a[2] + b[2]) / 2 - z;
    faces.push({ points: [a, b, top], base: opts.color, normal: [midX, 0.6, midZ], opacity: opts.opacity });
    faces.push({ points: [b, a, bottom], base: opts.color, normal: [midX, -0.5, midZ], opacity: opts.opacity });
  }
  return faces;
}

/** A vertical circle in the xy plane, for clock dials and round windows. */
export function frontDisc(centre: Vec3, radius: number, options: BoxOptions | string, segments = 18): WorldFace[] {
  const opts: BoxOptions = typeof options === 'string' ? { color: options } : options;
  const points: Vec3[] = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push([centre[0] + Math.cos(angle) * radius, centre[1] + Math.sin(angle) * radius, centre[2]]);
  }
  return [{ points, base: opts.color, normal: [0, 0, 1], opacity: opts.opacity, stroke: opts.stroke }];
}

/**
 * A low-poly sphere: an apex, three rings and a base. Rounder than an
 * octahedron at a face count a phone can re-sort on every drag frame.
 */
export function foliage(centre: Vec3, radius: number, options: BoxOptions | string, segments = 8): WorldFace[] {
  const opts: BoxOptions = typeof options === 'string' ? { color: options } : options;
  const [x, y, z] = centre;
  const top: Vec3 = [x, y + radius, z];
  const bottom: Vec3 = [x, y - radius * 0.78, z];
  // Three rings: high and narrow, widest at the equator, tapering underneath.
  // Distinct radii keep every quad a real quad — no duplicated vertices.
  const rings = [
    { radius: radius * 0.6, offset: radius * 0.6 },
    { radius, offset: radius * 0.06 },
    { radius: radius * 0.63, offset: -radius * 0.5 },
  ].map(({ radius: ringRadius, offset }) =>
    Array.from({ length: segments }, (_, index) => {
      const angle = (index / segments) * Math.PI * 2;
      return [x + Math.cos(angle) * ringRadius, y + offset, z + Math.sin(angle) * ringRadius] as Vec3;
    }),
  );

  const faces: WorldFace[] = [];
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    const midAngle = ((index + 0.5) / segments) * Math.PI * 2;
    const outX = Math.cos(midAngle);
    const outZ = Math.sin(midAngle);
    faces.push({ points: [rings[0][index], rings[0][next], top], base: opts.color, normal: [outX * 0.4, 1, outZ * 0.4] });
    for (let band = 0; band < rings.length - 1; band += 1) {
      faces.push({
        points: [rings[band + 1][next], rings[band + 1][index], rings[band][index], rings[band][next]],
        base: opts.color,
        normal: [outX * 0.85, band === 0 ? 0.75 : -0.1, outZ * 0.85],
      });
    }
    faces.push({ points: [rings[2][next], rings[2][index], bottom], base: opts.color, normal: [outX * 0.4, -1, outZ * 0.4] });
  }
  return faces;
}

/** A flat horizontal polygon (plaza, rink, shadow disc) built from a circle. */
export function disc(centre: Vec3, radius: number, options: BoxOptions | string, segments = 24): WorldFace[] {
  const opts: BoxOptions = typeof options === 'string' ? { color: options } : options;
  const points: Vec3[] = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push([centre[0] + Math.cos(angle) * radius, centre[1], centre[2] + Math.sin(angle) * radius]);
  }
  return [{ points, base: opts.color, normal: [0, 1, 0], opacity: opts.opacity, stroke: opts.stroke }];
}

/** A flat billboard-ish quad facing the camera's front plane (sun, cloud, card). */
export function panel(
  centre: Vec3,
  size: { w: number; h: number },
  options: BoxOptions | string,
): WorldFace[] {
  const opts: BoxOptions = typeof options === 'string' ? { color: options } : options;
  const [x, y, z] = centre;
  const w = size.w / 2;
  const h = size.h / 2;
  return [
    {
      points: [[x - w, y - h, z], [x + w, y - h, z], [x + w, y + h, z], [x - w, y + h, z]],
      base: opts.color,
      opacity: opts.opacity,
      stroke: opts.stroke,
    },
  ];
}

const PALETTE = {
  paper: '#FBF5E6',
  cream: '#EFE9D6',
  stone: '#DDE3D1',
  sage: '#D5DCCB',
  window: '#6FA894',
  windowLit: '#CFE6DA',
  roof: '#12604E',
  roofLight: '#38886F',
  green: '#176b53',
  mint: '#9CC7AF',
  gold: '#E2B45D',
  goldPale: '#F3DDA8',
  lawn: '#BAD7C3',
  trunk: '#6B7F5E',
  canopy: '#4C8F6F',
  canopyLight: '#76A88A',
  card: '#FFFFFF',
  shadow: '#274E3D',
} as const;

function windowSlots(x: number, z0: number, width: number, height: number, columns: number, rows: number): WorldFace[] {
  const faces: WorldFace[] = [];
  const colGap = width / columns;
  const rowGap = height / (rows + 1);
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cx = x - width / 2 + colGap * (column + 0.5);
      const cy = rowGap * row;
      const lit = (row + column) % 3 === 1;
      faces.push({
        points: [
          [cx - colGap * 0.26, cy - rowGap * 0.28, z0],
          [cx + colGap * 0.26, cy - rowGap * 0.28, z0],
          [cx + colGap * 0.26, cy + rowGap * 0.28, z0],
          [cx - colGap * 0.26, cy + rowGap * 0.28, z0],
        ],
        base: lit ? PALETTE.windowLit : PALETTE.window,
      });
    }
  }
  return faces;
}

/**
 * The campus, in world space: y is up, +z is toward the viewer, x is across.
 * Kept as plain data so the projection and the composition can be read (and
 * tested) apart from each other.
 */
export function campusShapes(): WorldShape[] {
  const shapes: WorldShape[] = [];
  const add = (id: string, faces: WorldFace[], group?: string) => shapes.push({ id, group, faces });

  // ── Plaza ──────────────────────────────────────────────────────────────
  add('lawn', disc([0, -0.5, 0], 330, { color: PALETTE.lawn }));
  add('lawn-inner', disc([0, 0.2, 4], 252, { color: '#D5E8D8' }));
  add('lawn-path', disc([0, 0.8, 60], 176, { color: '#E2EEDF' }));
  add('plaza', disc([0, 1.2, 44], 132, { color: PALETTE.stone, opacity: 0.92 }));
  add('shadow-main', disc([0, 1.6, -22], 156, { color: PALETTE.shadow, opacity: 0.14 }));
  add('shadow-wings', disc([0, 1.6, -46], 214, { color: PALETTE.shadow, opacity: 0.05 }));

  // ── Steps up to the main entrance ──────────────────────────────────────
  add('steps', [
    ...boxes([0, 0.4, 96], { w: 150, h: 9, d: 34 }, { color: PALETTE.cream }),
    ...boxes([0, 9.4, 96], { w: 136, h: 8, d: 24 }, { color: PALETTE.stone }),
    ...boxes([0, 17.4, 96], { w: 120, h: 7, d: 15 }, { color: PALETTE.paper }),
  ]);

  // ── Side wings, set back so the main block reads as the tallest thing ──
  add('wing-left', boxes([-238, 0, -46], { w: 96, h: 96, d: 86 }, { color: PALETTE.cream }), 'wing-left');
  add('wing-left-plinth', boxes([-238, 0, -46], { w: 106, h: 6, d: 96 }, { color: PALETTE.stone }), 'wing-left');
  add('wing-left-roof', boxes([-238, 96, -46], { w: 110, h: 10, d: 100 }, { color: PALETTE.roofLight }), 'wing-left');
  add('wing-left-windows', windowSlots(-238, 7, 74, 70, 3, 2), 'wing-left');
  add('wing-right', boxes([238, 0, -46], { w: 96, h: 86, d: 86 }, { color: PALETTE.stone }), 'wing-right');
  add('wing-right-plinth', boxes([238, 0, -46], { w: 106, h: 6, d: 96 }, { color: PALETTE.sage }), 'wing-right');
  add('wing-right-roof', boxes([238, 86, -46], { w: 110, h: 10, d: 100 }, { color: PALETTE.roof }), 'wing-right');
  add('wing-right-windows', windowSlots(238, 7, 74, 60, 3, 2), 'wing-right');

  // ── Main block: body, cornice, pitched roof, clock tower ───────────────
  add('main-body', boxes([0, 0, -40], { w: 236, h: 126, d: 138 }, { color: PALETTE.paper }), 'main');
  add('main-cornice', boxes([0, 126, -40], { w: 250, h: 9, d: 152 }, { color: PALETTE.sage }), 'main');
  add('main-roof', pyramid([0, 135, -40], { w: 244, h: 52, d: 148 }, { color: PALETTE.roof }), 'main');
  add('main-roof-trim', pyramid([0, 135, -40], { w: 206, h: 40, d: 120 }, { color: PALETTE.roofLight }), 'main');
  add(
    'main-windows',
    [
      ...windowSlots(-62, 29, 44, 96, 2, 3),
      ...windowSlots(62, 29, 44, 96, 2, 3),
      ...windowSlots(0, 29, 40, 96, 1, 2),
    ],
    'main',
  );
  add('portico-plinth', boxes([0, 0, 40], { w: 96, h: 6, d: 30 }, { color: PALETTE.paper }), 'main');
  add('portico-column-left', boxes([-34, 6, 44], { w: 12, h: 56, d: 12 }, { color: PALETTE.paper }), 'main');
  add('portico-column-right', boxes([34, 6, 44], { w: 12, h: 56, d: 12 }, { color: PALETTE.paper }), 'main');
  add('portico-lintel', boxes([0, 62, 44], { w: 92, h: 11, d: 18 }, { color: PALETTE.sage }), 'main');
  add('door', boxes([0, 6, 31], { w: 46, h: 52, d: 5 }, { color: PALETTE.green }), 'main');
  add('door-glass', boxes([0, 12, 33.8], { w: 34, h: 40, d: 3 }, { color: PALETTE.windowLit }), 'main');
  add('door-trim', boxes([0, 56, 33.8], { w: 46, h: 4, d: 4 }, { color: PALETTE.gold }), 'main');

  // ── Clock tower ────────────────────────────────────────────────────────
  add('tower', boxes([0, 187, -40], { w: 46, h: 54, d: 46 }, { color: PALETTE.paper }), 'tower');
  add('tower-cap', pyramid([0, 241, -40], { w: 56, h: 34, d: 56 }, { color: PALETTE.roof }), 'tower');
  add('tower-dial', frontDisc([0, 214, -16.4], 14, { color: PALETTE.goldPale, stroke: PALETTE.gold }, 22), 'tower');
  add('tower-dial-hand', boxes([0, 214, -15.8], { w: 2.4, h: 9, d: 1 }, { color: PALETTE.green }), 'tower');
  add('flagpole', boxes([0, 275, -40], { w: 4, h: 46, d: 4 }, { color: PALETTE.trunk }), 'tower');
  add('flag', panel([15, 308, -40], { w: 30, h: 18 }, { color: PALETTE.gold }), 'tower');

  // ── Trees flanking the plaza ───────────────────────────────────────────
  const trees: Array<[number, number, number, string, string]> = [
    [-362, 156, 42, 'tree-1', PALETTE.canopy],
    [356, -40, 38, 'tree-2', PALETTE.canopyLight],
    [-292, -214, 32, 'tree-3', PALETTE.canopyLight],
    [286, -206, 30, 'tree-4', PALETTE.canopy],
  ];
  for (const [x, z, radius, id, canopy] of trees) {
    add(`${id}-shadow`, disc([x, 1.4, z], radius * 1.05, { color: PALETTE.shadow, opacity: 0.1 }), id);
    add(`${id}-trunk`, boxes([x, 0, z], { w: radius * 0.2, h: radius * 1.05, d: radius * 0.2 }, { color: PALETTE.trunk }), id);
    add(`${id}-canopy`, foliage([x, radius * 1.05 + radius * 0.42, z], radius, { color: canopy }), id);
  }

  // ── Benches and a pair of lamp posts to give the plaza human scale ─────
  for (const [x, z, id] of [[-150, 152, 'bench-left'], [152, 148, 'bench-right']] as Array<[number, number, string]>) {
    add(`${id}-shadow`, disc([x, 1.4, z], 44, { color: PALETTE.shadow, opacity: 0.08 }), id);
    add(`${id}-leg-left`, boxes([x - 22, 0, z], { w: 6, h: 13, d: 18 }, { color: PALETTE.sage }), id);
    add(`${id}-leg-right`, boxes([x + 22, 0, z], { w: 6, h: 13, d: 18 }, { color: PALETTE.sage }), id);
    add(`${id}-seat`, boxes([x, 13, z], { w: 64, h: 5, d: 20 }, { color: PALETTE.cream }), id);
    add(`${id}-back`, boxes([x, 18, z - 8], { w: 64, h: 16, d: 4 }, { color: PALETTE.cream }), id);
  }
  for (const [x, z, id] of [[-196, 134, 'lamp-left'], [196, 128, 'lamp-right']] as Array<[number, number, string]>) {
    add(`${id}-post`, boxes([x, 0, z], { w: 5, h: 82, d: 5 }, { color: PALETTE.trunk }), id);
    add(`${id}-head`, foliage([x, 90, z], 10, { color: PALETTE.goldPale }, 6), id);
  }

  // A gold nameplate over the entrance, so the front reads as a real facade.
  add('nameplate', boxes([0, 96, 30], { w: 96, h: 13, d: 2.5 }, { color: PALETTE.goldPale }), 'main');
  add('nameplate-trim', boxes([0, 109, 30], { w: 104, h: 3, d: 3 }, { color: PALETTE.gold }), 'main');

  // ── Floating "connected campus" cards orbiting the building ───────────
  const cards: Array<[number, number, number, 'card-a' | 'card-b' | 'card-c']> = [
    [-212, 196, 24, 'card-a'],
    [214, 178, 40, 'card-b'],
    [-150, 268, -40, 'card-c'],
  ];
  for (const [x, y, z, id] of cards) {
    add(`${id}-body`, boxes([x, y, z], { w: 84, h: 50, d: 8 }, { color: PALETTE.card, stroke: '#DCE7DA' }), id);
    add(`${id}-bar`, boxes([x, y + 31, z + 5], { w: 48, h: 6, d: 2 }, { color: PALETTE.mint }), id);
    add(`${id}-bar-soft`, boxes([x - 6, y + 18, z + 5], { w: 36, h: 5, d: 2 }, { color: '#CFE0CE' }), id);
    add(`${id}-dot`, boxes([x - 28, y + 30, z + 5], { w: 12, h: 12, d: 2 }, { color: PALETTE.gold }), id);
  }

  return shapes;
}

/**
 * Anchors for the figures and scenery that are drawn as flat art rather than
 * geometry. `scale` is pixels per world unit at that point, so callers multiply
 * it by the size they want in world units.
 */
function billboardAnchors(view: View): Billboard[] {
  const people: Array<[Vec3, Billboard['art'], number]> = [
    [[-176, 0, 168], 'student', 1],
    [[-46, 0, 206], 'student-alt', 0.95],
    [[104, 0, 192], 'student', 0.98],
    [[214, 0, 150], 'student-alt', 0.9],
  ];
  const billboards: Billboard[] = people.map(([anchor, art, size], index) => {
    const p = project(anchor, view);
    return { id: `person-${index}`, art, anchor: [p.x, p.y], scale: p.scale * size, depth: p.depth, tint: 0 };
  });

  const sun = project([-330, 352, -700], view);
  billboards.push({ id: 'sun', art: 'sun', anchor: [sun.x, sun.y], scale: sun.scale, depth: sun.depth, tint: 0 });

  const clouds: Array<[Vec3, number]> = [
    [[-420, 336, -330], 1],
    [[392, 372, -420], 0.82],
    [[36, 404, -560], 0.66],
  ];
  clouds.forEach(([anchor, size], index) => {
    const p = project(anchor, view);
    billboards.push({
      id: `cloud-${index}`,
      art: 'cloud',
      anchor: [p.x, p.y],
      scale: p.scale * size,
      depth: p.depth,
      tint: 0,
    });
  });

  return billboards;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** The drawn extent of a scene, ignoring the camera-facing scenery sprites. */
export function geometryBounds(scene: Scene): Bounds {
  const bounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const include = (points: [number, number][]) => {
    for (const [x, y] of points) {
      if (x < bounds.minX) bounds.minX = x;
      if (x > bounds.maxX) bounds.maxX = x;
      if (y < bounds.minY) bounds.minY = y;
      if (y > bounds.maxY) bounds.maxY = y;
    }
  };
  for (const face of scene.ground) include(face.points);
  for (const solid of scene.solids) for (const face of solid.faces) include(face.points);
  return bounds;
}

/**
 * A single transform that fits every reachable camera angle into the viewBox.
 *
 * Computed from the union of several angles rather than the current one: if the
 * fit were recomputed per frame the drawing would subtly zoom while you drag,
 * which reads as a bug. One fixed transform keeps the model rock-steady and
 * still guarantees nothing ever clips at the edges.
 */
export function fitTransform(
  angles: number[],
  viewBox: { width: number; height: number },
  padding = 34,
): { scale: number; translateX: number; translateY: number } {
  const union: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const yaw of angles) {
    const bounds = geometryBounds(buildScene(makeView(yaw, PITCH_FROM_YAW + yaw * 0.02)));
    union.minX = Math.min(union.minX, bounds.minX);
    union.maxX = Math.max(union.maxX, bounds.maxX);
    union.minY = Math.min(union.minY, bounds.minY);
    union.maxY = Math.max(union.maxY, bounds.maxY);
  }
  const width = union.maxX - union.minX;
  const height = union.maxY - union.minY;
  const scale = Math.min(
    (viewBox.width - padding * 2) / width,
    (viewBox.height - padding * 2) / height,
  );
  return {
    scale,
    translateX: viewBox.width / 2 - ((union.minX + union.maxX) / 2) * scale,
    // Bias the model down a touch: the sky above it is part of the composition.
    translateY: viewBox.height / 2 - ((union.minY + union.maxY) / 2) * scale + viewBox.height * 0.06,
  };
}

/** The dashed "everything is connected" arcs between buildings. */
function sceneLinks(view: View): Link[] {
  const pairs: Array<[Vec3, Vec3]> = [
    [[-238, 128, -30], [0, 178, -30]],
    [[0, 178, -30], [238, 120, -30]],
  ];
  return pairs.map(([from, to], index) => {
    const a = project(from, view);
    const b = project(to, view);
    return { id: `link-${index}`, from: [a.x, a.y], to: [b.x, b.y], depth: Math.min(a.depth, b.depth) };
  });
}

/**
 * Builds the drawable scene for one camera view: everything projected, lit,
 * hazed, and ordered far-to-near.
 */
export function buildScene(view: View = makeView()): Scene {
  const solids: Solid[] = [];
  let ground: ScreenFace[] = [];

  for (const shape of campusShapes()) {
    const faces: ScreenFace[] = [];
    let depthTotal = 0;
    for (const face of shape.faces) {
      const projected = face.points.map((point) => project(point, view));
      const depth = projected.reduce((sum, point) => sum + point.depth, 0) / projected.length;
      depthTotal += depth;
      const ratio = face.normal ? facingRatio(face.normal) : 1;
      const fill = haze(shade(face.base, ratio), depth);
      const stroke = face.stroke ? haze(shade(face.stroke, ratio), depth) : undefined;
      faces.push({
        points: projected.map((point) => [round(point.x), round(point.y)] as [number, number]),
        fill: face.opacity === undefined ? fill : withAlpha(fill, face.opacity),
        stroke,
      });
    }
    const item: Solid = { id: shape.id, group: shape.group, depth: depthTotal / shape.faces.length, faces };
    if (shape.id.startsWith('lawn') || shape.id === 'plaza' || shape.id === 'shadow-main') {
      ground = ground.concat(faces);
    } else {
      solids.push(item);
    }
    if (shape.id === 'plaza') ground = ground.concat(faces);
  }

  // Painter's algorithm across shapes; ground discs are drawn first, by hand.
  const sortedSolids = sortByDepth(solids);

  return {
    ground,
    solids: sortedSolids,
    billboards: billboardAnchors(view),
    links: sceneLinks(view),
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

function withAlpha(rgb: string, alpha: number): string {
  const channels = rgb.match(/\d+/g) ?? ['0', '0', '0'];
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${clamp(alpha, 0, 1)})`;
}
