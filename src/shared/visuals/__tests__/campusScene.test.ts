// src/shared/visuals/__tests__/campusScene.test.ts
//
// The 3D campus hero is a hand-rolled projection (no three.js, no WebGL
// library), so the maths that decides where every vertex lands is plain
// functions here and testable without a browser. If this file passes, the
// scene is geometrically sound: faces are lit, sorting is far-to-near, and
// nothing can divide by zero or draw outside the viewBox.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMERA_DISTANCE,
  PITCH_FROM_YAW,
  fitTransform,
  makeView,
  project,
  rotateY,
  sortByDepth,
  facingRatio,
  shade,
  boxes,
  buildScene,
  geometryBounds,
  type View,
  PITCH_FROM_YAW,
  blendHex,
  clockHand,
  darknessAt,
} from '../campusScene';

const ORIGIN: [number, number, number] = [0, 0, 0];
const DEG = Math.PI / 180;

function view(yawRadians: number, pitchRadians = 0): View {
  return { yaw: yawRadians, pitch: pitchRadians, distance: CAMERA_DISTANCE, centreY: 0 };
}

test('yaw of zero keeps x and z untouched', () => {
  assert.deepEqual(rotateY([1, 2, 3], 0), { x: 1, y: 2, z: 3 });
});

test('a quarter turn swaps the horizontal axes', () => {
  const r = rotateY([1, 0, 0], Math.PI / 2);
  assert.ok(Math.abs(r.x) < 1e-9);
  assert.equal(r.y, 0);
  assert.equal(r.z, -1);
});

test('projection is finite for every yaw and every pitch the hero can reach', () => {
  const vertices: [number, number, number][] = [
    [0, 0, 0], [200, -90, 260], [-200, -90, -260], [300, 400, 40], [-300, -400, -40],
  ];
  for (let yaw = -Math.PI; yaw <= Math.PI; yaw += DEG * 7) {
    for (const pitch of [0, 4 * DEG, -2 * DEG]) {
      for (const vertex of vertices) {
        const p = project(vertex, view(yaw, pitch));
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `projection blew up at yaw ${yaw}`);
        assert.ok(Number.isFinite(p.scale) && p.scale > 0, 'scale must stay positive');
        assert.ok(Number.isFinite(p.depth));
      }
    }
  }
});

test('closer points project larger than farther ones', () => {
  const near = project([0, 0, 100], view(0));
  const far = project([0, 0, -100], view(0));
  assert.ok(near.scale > far.scale);
});

test('depth sorting is far-to-near, which is the order an SVG painter wants', () => {
  // Smaller depth is nearer: the camera sits CAMERA_DISTANCE away and geometry
  // closer to it yields a smaller number.
  const items = [
    { id: 'near', depth: 80 },
    { id: 'far', depth: 900 },
    { id: 'middle', depth: 400 },
  ];
  assert.deepEqual(sortByDepth(items).map((item) => item.id), ['far', 'middle', 'near']);
});

test('faces turned away from a light get no direct light, faces turned toward it are brighter', () => {
  const light: [number, number, number] = [0, 0, 1];
  assert.equal(facingRatio([0, 0, 1], light), 1);
  assert.equal(facingRatio([0, 0, -1], light), 0);
  assert.equal(facingRatio([-1, 0, 0], light), 0);
  assert.equal(facingRatio([1, 1, 1], light), Number(facingRatio([1, 1, 1], light)));
  assert.ok(facingRatio([1, 1, 1], light) > 0 && facingRatio([1, 1, 1], light) < 1);
  const lit = shade('#176b53', 1);
  const unlit = shade('#176b53', 0);
  assert.notEqual(lit, unlit);
  assert.match(lit, /^rgb\(\d+, \d+, \d+\)$/);
});

test('shade never leaves the 0-255 range, even with an out-of-range ratio', () => {
  for (const ratio of [-5, -0.2, 0, 0.5, 1, 4, Number.NaN]) {
    const rgb = shade('#e2b45d', ratio).match(/^rgb\((\d+), (\d+), (\d+)\)$/);
    assert.ok(rgb, 'shade returns rgb() notation');
    for (const channel of rgb!.slice(1).map(Number)) {
      assert.ok(channel >= 0 && channel <= 255, `channel ${channel} out of range`);
    }
  }
});

test('a face the light cannot reach keeps its ambient colour instead of going black', () => {
  const unlit = shade('#176b53', 0);
  const lit = shade('#176b53', 1);
  assert.notEqual(unlit, lit);
  assert.notEqual(unlit, 'rgb(0 0 0)', 'ambient keeps unlit faces legible');
});

test('box geometry keeps its top plus four sides, all of them finite quads', () => {
  const faces = boxes([0, 0, 0], { w: 100, h: 100, d: 100 }, { color: '#176b53' });
  assert.equal(faces.length, 5, 'the bottom face is never drawn from a camera above it');
  assert.ok(faces.every((face) => face.points.length === 4));
  assert.ok(faces.every((face) => face.points.every((v) => v.every(Number.isFinite))));
  assert.deepEqual(boxes([0, 0, 0], { w: 1, h: 1, d: 1 }, { color: '#000', skip: ['back'] }).length, 4);
});

test('the scene is far more than a handful of boxes, and every face is drawable', () => {
  const scene = buildScene();
  assert.ok(scene.solids.length > 40, 'the campus is made of many ordered solids');
  const totalFaces = scene.solids.reduce((sum, item) => sum + item.faces.length, 0);
  assert.ok(totalFaces > 200, 'windows and trim add up');
  for (const solid of scene.solids) {
    assert.ok(solid.faces.length >= 1, `${solid.id} has something to draw`);
    assert.ok(Number.isFinite(solid.depth));
    assert.ok(solid.faces.every((face) => face.points.length >= 3));
    assert.ok(
      solid.faces.every((face) => face.points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))),
      `${solid.id} stays finite even at extreme angles`,
    );
  }
});

test('the scene has no duplicate ids, so React keys are stable', () => {
  const ids = buildScene().solids.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('rebuilding the scene is deterministic, so a drag frame is a pure function of yaw', () => {
  const a = buildScene(view(0.4)).solids;
  const b = buildScene(view(0.4)).solids;
  assert.deepEqual(a, b);
  assert.notDeepEqual(buildScene(view(0.2)).solids, a);
});

test('a rotated view changes the drawing but never the drawable count', () => {
  const front = buildScene(view(0));
  const turned = buildScene(view(0.9));
  assert.equal(front.solids.length, turned.solids.length);
  assert.notDeepEqual(front.solids[10].faces[0].points, turned.solids[10].faces[0].points);
});

test('the drawing is centred: geometry extends above and below the zero line', () => {
  const scene = buildScene();
  let min = Infinity;
  let max = -Infinity;
  for (const solid of scene.solids) {
    for (const face of solid.faces) for (const [, y] of face.points) {
      min = Math.min(min, y);
      max = Math.max(max, y);
    }
  }
  assert.ok(min < 0 && max > 0, 'the view is composed around its middle, not pinned to the floor');
});

test('ground discs always draw before the solids standing on them', () => {
  const scene = buildScene();
  assert.ok(scene.ground.length >= 2, 'the lawn and plaza are ground layers');
  assert.ok(scene.solids.every((solid) => !/^lawn|^plaza$/.test(solid.id)));
  for (let index = 1; index < scene.solids.length; index += 1) {
    assert.ok(scene.solids[index - 1].depth >= scene.solids[index].depth, 'solids are far-to-near');
  }
});

test('CAMERA_DISTANCE is far enough out that nothing flips behind the eye', () => {
  assert.ok(CAMERA_DISTANCE > 900, 'keeps the nearest box in front of the camera');
  assert.equal(project(ORIGIN, view(0)).depth, CAMERA_DISTANCE);
});

test('the fitted drawing never clips the viewBox at any rotation the hero allows', () => {
  const viewBox = { width: 1000, height: 660 };
  const angles = [-1.05, -0.8, -0.5, -0.2, 0.4, 1.05];
  const fit = fitTransform(angles, viewBox, 28);
  assert.ok(fit.scale > 0 && Number.isFinite(fit.scale));
  for (const yaw of angles) {
    const scene = buildScene(makeView(yaw, PITCH_FROM_YAW + yaw * 0.02));
    const b = geometryBounds(scene);
    const left = b.minX * fit.scale + fit.translateX;
    const right = b.maxX * fit.scale + fit.translateX;
    const top = b.minY * fit.scale + fit.translateY;
    const bottom = b.maxY * fit.scale + fit.translateY;
    assert.ok(left >= 0 && right <= viewBox.width, `yaw ${yaw} overflows horizontally`);
    assert.ok(top >= 0 && bottom <= viewBox.height, `yaw ${yaw} overflows vertically`);
  }
});

test('the fit is independent of the current yaw, so dragging never zooms', () => {
  const a = fitTransform([-1.05, -0.5, 1.05], { width: 1000, height: 660 }, 28);
  const b = fitTransform([-1.05, -0.5, 1.05], { width: 1000, height: 660 }, 28);
  assert.deepEqual(a, b);
});

test('face identity is stable across yaw, which the imperative repaint relies on', () => {
  // Campus3D paints idle-drift frames onto the nodes React already mounted,
  // addressing them by shapeId + faceIndex. That is only safe if those ids mean
  // the same face at every angle. Document *order* deliberately does change —
  // solids are sorted far-to-near — so identity, not position, is the contract.
  const idsOf = (scene: ReturnType<typeof buildScene>) =>
    [...scene.solids.map((solid) => solid.id)].sort();
  const faceIdsOf = (scene: ReturnType<typeof buildScene>) =>
    scene.solids.flatMap((solid) => solid.faces.map((_, index) => `${solid.id}-${index}`)).sort();

  const a = buildScene(makeView(-0.5));
  const b = buildScene(makeView(0.6));
  const c = buildScene(makeView(1.05));
  assert.deepEqual(idsOf(a), idsOf(b));
  assert.deepEqual(idsOf(a), idsOf(c));
  assert.deepEqual(faceIdsOf(a), faceIdsOf(b), 'every face keeps its id as the model turns');
  assert.deepEqual(faceIdsOf(a), faceIdsOf(c));

  // And order really does move, which is why painting by index would have been
  // a bug: this assertion documents the hazard the id addressing avoids.
  const orderA = a.solids.map((solid) => solid.id);
  const orderC = c.solids.map((solid) => solid.id);
  assert.notDeepEqual(orderA, orderC, 'depth sorting reorders solids as the model turns');
});

// ── The campus keeps the visitor's local time ─────────────────────────────
// The caller supplies the hour, so the scene stays a pure function: these
// assertions are the contract that stops someone reaching for `Date.now()`
// inside the engine later.

test('daylight vs after dark: darkness is 0 by day and 1 overnight, eased in between', () => {
  for (const hour of [7, 9, 12, 15, 17]) {
    assert.equal(darknessAt(hour), 0, `${hour}:00 is full daylight`);
  }
  for (const hour of [19, 21, 23, 0, 3, 5]) {
    assert.equal(darknessAt(hour), 1, `${hour}:00 is after dark`);
  }
  // The transition is a ramp, not a step: 18:00 sits part way up.
  const dusk = darknessAt(18);
  assert.ok(dusk > 0 && dusk < 1, `dusk eases (got ${dusk})`);
  const dawn = darknessAt(6);
  assert.ok(dawn > 0 && dawn < 1, `dawn eases (got ${dawn})`);
  // Monotonic through each ramp, so a page left open never flickers.
  assert.ok(darknessAt(17.6) <= darknessAt(18) && darknessAt(18) <= darknessAt(18.6));
});

test('darkness ignores nonsense instead of inventing a time of day', () => {
  for (const bad of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(darknessAt(bad), 0, `${String(bad)} falls back to daylight`);
  }
  // Hours outside 0-24 wrap rather than clamping to midnight.
  assert.equal(darknessAt(25), darknessAt(1));
  assert.equal(darknessAt(-1), darknessAt(23));
});

test('the same hour always produces the identical scene, at every rotation', () => {
  // The purity contract. If this ever fails, something started reading a clock
  // inside buildScene and the illustration stops being reproducible.
  assert.deepEqual(buildScene(makeView(-0.5), { hour: 21 }), buildScene(makeView(-0.5), { hour: 21 }));
  assert.deepEqual(buildScene(makeView(0.4)), buildScene(makeView(0.4)), 'and with no time at all');
});

test('the tower hand reads like a real clock: twelve up, three right, six down', () => {
  const centre: [number, number, number] = [0, 200, 0];
  // Read the farthest point from the pivot rather than an array index: the hand
  // is a prism and the tip moves between vertices as it turns.
  const tip = (hour: number) => {
    const points = clockHand(hour, centre, 10)!.flatMap((face) => face.points);
    return points.reduce((best, point) => {
      const d = (point[0] - centre[0]) ** 2 + (point[1] - centre[1]) ** 2;
      const bestD = (best[0] - centre[0]) ** 2 + (best[1] - centre[1]) ** 2;
      return d > bestD ? point : best;
    }, points[0]);
  };
  const up = tip(12);
  assert.ok(up[1] > 205, `twelve points up (y was ${up[1]})`);
  assert.ok(Math.abs(up[0]) < 1, 'and straight up, not tilted');
  const three = tip(3);
  assert.ok(three[0] > 5, `three points right (x was ${three[0]})`);
  assert.ok(Math.abs(three[1] - 200) < 1, 'and lies flat');
  const six = tip(6);
  assert.ok(six[1] < 195, 'six points down');
  const nine = tip(9);
  assert.ok(nine[0] < -5, 'nine points left');
  // A twelve-hour dial, so AM and PM show the same hand.
  assert.deepEqual(tip(3), tip(15));
  assert.ok(Math.abs(tip(3)[0] - 200) > 5, 'three oclock sits at ninety degrees, not forty-five');
});

test('the tower hand keeps its identity and count as the hour changes', () => {
  // The imperative repaint addresses faces by id, so a hand that appeared and
  // vanished would leave a stale polygon behind.
  const idsAt = (hour: number) => buildScene(makeView(-0.5), { hour }).solids.map((solid) => solid.id).sort();
  assert.deepEqual(idsAt(3), idsAt(15));
  assert.ok(idsAt(3).includes('tower-hand'));
  // Five faces, same as the box it replaces: a time-dependant hand must not
  // change the model's polygon count just because it is night.
  const handFaces = (hour: number) =>
    buildScene(makeView(-0.5), { hour }).solids.find((solid) => solid.id === 'tower-hand')!.faces.length;
  assert.equal(handFaces(3), 5);
  // With no time the still frame falls back to the static hand the drawing had.
  const noTime = buildScene(makeView(-0.5)).solids.map((solid) => solid.id);
  assert.ok(noTime.includes('tower-dial-hand'));
  assert.ok(!noTime.includes('tower-hand'));
});

test('windows recolour after dark without gaining or losing any', () => {
  // `ground` is where the lawn discs go; folding in only `solids` would miss
  // them and make a colour change look like a count change.
  const countFaces = (hour?: number) => {
    const scene = buildScene(makeView(-0.5), hour === undefined ? undefined : { hour });
    return [...scene.solids.flatMap((solid) => solid.faces), ...scene.ground].length;
  };
  assert.equal(countFaces(12), countFaces(22), 'the same faces, lit differently');
  assert.equal(countFaces(12), countFaces());
  // And the lit arrangement genuinely differs: a caretaker walks the corridors,
  // so the evening pattern is not the daytime one simply brightened.
  const fills = (hour: number) =>
    buildScene(makeView(-0.5), { hour }).solids
      .filter((solid) => solid.id.includes('windows'))
      .flatMap((solid) => solid.faces.map((face) => face.fill));
  assert.notDeepEqual(fills(12), fills(22));
});

test('blendHex is clamped and returns its endpoints exactly', () => {
  assert.equal(blendHex('#000000', '#ffffff', 0), '#000000');
  assert.equal(blendHex('#000000', '#ffffff', 1), '#ffffff');
  assert.equal(blendHex('#000000', '#ffffff', -2), '#000000');
  assert.equal(blendHex('#000000', '#ffffff', 5), '#ffffff');
  // Comma-separated rgb(), matching shade(): older SVG rasterisers reject the
  // CSS Color 4 space-separated form.
  assert.match(blendHex('#000000', '#ffffff', 0.5), /^rgb\(\d+, \d+, \d+\)$/);
});

test('the tower hand is never painted underneath its dial', () => {
  // The bug this guards: the dial is drawn as a solid, the hand as a thinner
  // prism, and the painter's sort compares average depth. With the hand too far
  // back the dial painted over it and the clock read as a blank gold disc —
  // invisible to every test that only checked the hand's own geometry.
  const bad: string[] = [];
  for (let yaw = -1.05; yaw <= 1.05; yaw += 0.05) {
    const scene = buildScene(makeView(yaw, PITCH_FROM_YAW + yaw * 0.02), { hour: 22 });
    const hand = scene.solids.find((solid) => solid.id === 'tower-hand');
    const dial = scene.solids.find((solid) => solid.id === 'tower-dial');
    assert.ok(hand && dial, 'both the hand and the dial are present');
    const handIndex = scene.solids.indexOf(hand!);
    const dialIndex = scene.solids.indexOf(dial!);
    // Later index paints last, i.e. on top. The hand must come *after* the dial.
    if (handIndex < dialIndex) bad.push(`yaw ${yaw.toFixed(2)}`);
  }
  assert.deepEqual(bad, [], 'the hand paints after the dial, so it stays visible');
});

test('the clock hand is wide enough to see at the size the artwork is drawn', () => {
  // Two world units of width project to well under a pixel at the hero's scale,
  // so a thin hand is invisible even when it is correctly layered.
  const face = clockHand(12, [0, 214, -15.6], 13)![0];
  const xs = face.points.map((point) => point[0]);
  const width = Math.max(...xs) - Math.min(...xs);
  assert.ok(width >= 2, `the hand has body (was ${width.toFixed(2)} world units)`);
});
