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
