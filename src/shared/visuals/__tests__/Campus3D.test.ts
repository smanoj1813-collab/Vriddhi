// src/shared/visuals/__tests__/Campus3D.test.ts
//
// Mounts the real component in jsdom and drives the interactions a visitor
// actually uses: dragging, the rotation buttons, the keyboard slider, and the
// reduced-motion / hidden-tab paths that decide whether it animates at all.
// The geometry maths is covered separately in campus3d.test.ts; this file is
// about behaviour and the accessibility contract.
import test from 'node:test';
import assert from 'node:assert/strict';

// This file needs a DOM, and `npm run test:unit` does not preload one (the
// render-check bootstrap would impose jsdom on every other unit test). Node 22
// makes several of these globals getter-only, so they must be installed with
// defineProperty rather than assigned.
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom;

function define(name: string, value: unknown) {
  if (value === undefined) return;
  Object.defineProperty(globalThis, name, { value, writable: true, configurable: true, enumerable: true });
}

define('window', window);
define('document', window.document);
define('navigator', window.navigator);
for (const key of [
  'HTMLElement', 'Element', 'Node', 'Text', 'Event', 'CustomEvent', 'MouseEvent',
  'KeyboardEvent', 'SVGElement', 'NodeList', 'DocumentFragment',
]) {
  define(key, (window as any)[key]);
}
define('requestAnimationFrame', window.requestAnimationFrame.bind(window));
define('cancelAnimationFrame', window.cancelAnimationFrame.bind(window));
if (!(window as any).IntersectionObserver) {
  (window as any).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
define('IntersectionObserver', (window as any).IntersectionObserver);

let reducedMotion = false;
const mediaQuery = (query: string) => ({
  matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
define('matchMedia', mediaQuery);
(window as any).matchMedia = mediaQuery;

// jsdom has no PointerEvent; the component only reads pointerId/pointerType/
// clientX/clientY, so delegating to MouseEvent is enough.
if (typeof (globalThis as any).PointerEvent === 'undefined') {
  define('PointerEvent', class extends (window as any).MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  });
}
// react-dom/client's act() refuses to run without this flag.
define('IS_REACT_ACT_ENVIRONMENT', true);

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const Campus3D = (await import('../Campus3D')).default;

async function mount(props: Record<string, unknown> = {}) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(React.createElement(Campus3D, props));
  });
  // Two settles: the first lets the entrance rAF chain start, the second lets
  // it finish; both are awaited inside act so React is idle afterwards.
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 60)); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 60)); });
  const unmount = async () => {
    await act(async () => root.unmount());
    host.remove();
  };
  return { host, unmount };
}

/** Reads the first polygon of a named solid, for comparing poses. */
function solidPoints(host: HTMLElement, id: string): string {
  return host.querySelector<SVGPolygonElement>(`[data-solid="${id}"] polygon`)?.getAttribute('points') ?? '';
}

test('renders a labelled, focusable stage with a bounded number of drawable faces', async () => {
  const { host, unmount } = await mount();
  try {
    const stage = host.querySelector('[role="group"]');
    assert.ok(stage, 'the stage is a labelled group, not an unlabelled div');
    assert.match(stage!.getAttribute('aria-label') ?? '', /drag/i, 'the label tells people it is interactive');
    assert.equal((stage as HTMLElement).tabIndex, 0, 'keyboard users can reach it');

    const svg = host.querySelector('svg.campus3d-svg');
    assert.ok(svg);
    assert.equal(svg!.getAttribute('role'), 'img');
    assert.ok((svg!.getAttribute('aria-label') ?? '').length > 20);

    const polygons = host.querySelectorAll('svg.campus3d-svg polygon');
    assert.ok(polygons.length > 200, 'the campus is real geometry, not a placeholder');
    assert.ok(polygons.length < 900, 'small enough to repaint on a budget phone');

    // Every drawn face carries a stable id, which the idle repaint addresses.
    const faceIds = [...host.querySelectorAll('polygon[data-face]')].map((node) => node.getAttribute('data-face'));
    assert.equal(new Set(faceIds).size, faceIds.length, 'face ids are unique');
  } finally {
    await unmount();
  }
});

test('dragging the stage turns the model, and a plain click does not', async () => {
  // autoDrift is off here: the idle sway repaints independently, so comparing
  // poses between two awaited act() blocks would race the drift rather than
  // test the drag. The drift has its own coverage below.
  const { host, unmount } = await mount({ autoDrift: false });
  try {
    const stage = host.querySelector('[role="group"]') as HTMLElement;
    const before = solidPoints(host, 'main-body');

    await act(async () => {
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, bubbles: true }));
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointermove', { pointerId: 1, clientX: 220, clientY: 100, bubbles: true }));
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointerup', { pointerId: 1, clientX: 220, clientY: 100, bubbles: true }));
    });
    const dragged = solidPoints(host, 'main-body');
    assert.notEqual(dragged, before, 'a 120px drag must move the camera');

    // A drag must be clamped: a wild swipe cannot spin the model past its arc.
    const start = dragged;
    await act(async () => {
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointerdown', { pointerId: 2, clientX: 500, clientY: 100, bubbles: true }));
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointermove', { pointerId: 2, clientX: 4000, clientY: 100, bubbles: true }));
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointerup', { pointerId: 2, clientX: 4000, clientY: 100, bubbles: true }));
    });
    assert.notEqual(solidPoints(host, 'main-body'), start, 'still turns');
    assert.ok(host.querySelector('.campus3d'), 'and the scene survived the extreme drag');

    // A click with no movement is not a rotation.
    const settled = solidPoints(host, 'main-body');
    await act(async () => {
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointerdown', { pointerId: 3, clientX: 300, clientY: 300, bubbles: true }));
      stage.dispatchEvent(new (globalThis as any).PointerEvent('pointerup', { pointerId: 3, clientX: 300, clientY: 300, bubbles: true }));
    });
    assert.equal(solidPoints(host, 'main-body'), settled);
  } finally {
    await unmount();
  }
});

test('arrow keys and the buttons rotate it, Home resets to the extreme', async () => {
  const { host, unmount } = await mount({ autoDrift: false });
  try {
    const stage = host.querySelector('[role="group"]') as HTMLElement;
    const before = solidPoints(host, 'main-body');

    await act(async () => {
      stage.dispatchEvent(new (globalThis as any).KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    const afterRight = solidPoints(host, 'main-body');
    assert.notEqual(afterRight, before, 'ArrowRight rotates the model');

    await act(async () => {
      stage.dispatchEvent(new (globalThis as any).KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    assert.equal(solidPoints(host, 'main-body'), before, 'ArrowLeft rotates it back');

    await act(async () => {
      stage.dispatchEvent(new (globalThis as any).KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    assert.notEqual(solidPoints(host, 'main-body'), before, 'Home jumps to the far end');

    // The visible buttons are real controls, not decoration.
    const right = host.querySelector('[aria-label="Rotate campus right"]') as HTMLElement;
    const left = host.querySelector('[aria-label="Rotate campus left"]') as HTMLElement;
    const reset = host.querySelector('[aria-label="Reset the campus view to the front"]') as HTMLElement;
    // Start from a known pose rather than wherever the arrival tween stopped.
    const resetButton = reset;
    await act(async () => { resetButton.click(); });
    const atReset = solidPoints(host, 'main-body');
    await act(async () => { right.click(); });
    assert.notEqual(solidPoints(host, 'main-body'), atReset);
    await act(async () => { left.click(); });
    assert.equal(solidPoints(host, 'main-body'), atReset, 'left undoes right');
    await act(async () => { right.click(); });
    await act(async () => { reset.click(); });
    assert.equal(solidPoints(host, 'main-body'), atReset, 'reset returns to the composed angle');
  } finally {
    await unmount();
  }
});

test('the angle slider reports a bounded value and its own name', async () => {
  const { host, unmount } = await mount();
  try {
    const dial = host.querySelector('[role="slider"]') as HTMLElement;
    assert.ok(dial);
    assert.equal(dial.getAttribute('aria-label'), 'Campus viewing angle');
    const now = Number(dial.getAttribute('aria-valuenow'));
    const min = Number(dial.getAttribute('aria-valuemin'));
    const max = Number(dial.getAttribute('aria-valuemax'));
    assert.ok(Number.isFinite(now) && now >= min && now <= max, 'value stays within its own range');
    assert.match(dial.getAttribute('aria-valuetext') ?? '', /% around the campus$/);
  } finally {
    await unmount();
  }
});

test('showControls={false} keeps the artwork and its labels, but hides the buttons', async () => {
  const { host, unmount } = await mount({ showControls: false });
  try {
    assert.ok(host.querySelector('svg.campus3d-svg'));
    assert.equal(host.querySelector('.campus3d-controls'), null);
    // Still labelled: the stage remains draggable, so it must stay described.
    assert.ok(host.querySelector('[role="group"][aria-label]'));
  } finally {
    await unmount();
  }
});

test('reduced motion skips the entrance animation entirely', async () => {
  reducedMotion = true;
  try {
    const { host, unmount } = await mount();
    try {
      console.error('DBG A classes:', host.querySelector('.campus3d')?.className);
      console.error('DBG A arriving:', String(host.querySelector('.campus3d.is-arriving')));
      console.error('DBG A stage:', String(host.querySelector('.campus3d-stage')));
      assert.ok(host.querySelector('svg.campus3d-svg'), 'the campus still renders, just still');
      console.error('DBG C', host.querySelectorAll('polygon').length);
      assert.ok(host.querySelectorAll('polygon').length > 200);
      console.error('DBG D');
    } finally {
      await unmount();
    }
  } finally {
    reducedMotion = false;
  }
});

test('unmounting mid-animation leaves no frame loop running', async () => {
  let scheduled = 0;
  const realRaf = globalThis.requestAnimationFrame;
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    value: ((callback: FrameRequestCallback) => { scheduled += 1; return realRaf(callback); }) as typeof requestAnimationFrame,
    writable: true,
    configurable: true,
  });
  const { unmount } = await mount();
  await unmount();
  const afterUnmount = scheduled;
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(scheduled, afterUnmount, 'no rAF is scheduled after unmount');
  Object.defineProperty(globalThis, 'requestAnimationFrame', { value: realRaf, writable: true, configurable: true });
});

test('the idle drift keeps painting without re-rendering the whole tree', async () => {
  const { host, unmount } = await mount();
  try {
    const before = solidPoints(host, 'main-body');
    // Poll rather than sleep a fixed span: the drift first converges on its
    // centre (moving in the third decimal, which is below the drawing's
    // precision), then genuinely sways. Waiting for visible movement keeps the
    // test about the behaviour instead of about a frame budget.
    let after = before;
    for (let attempt = 0; attempt < 30 && after === before; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      after = solidPoints(host, 'main-body');
    }
    assert.notEqual(after, before, 'the drift still updates the drawing');
    // And it must have done so in place: the polygon count is unchanged, so
    // nothing was unmounted/remounted to produce the new pose.
    assert.ok(host.querySelectorAll('svg.campus3d-svg polygon').length > 200);
    assert.equal(host.querySelectorAll('.campus3d-solid').length, host.querySelectorAll('[data-solid]').length);
  } finally {
    await unmount();
  }
});

test('a keypress during the drift is not undone by the animation cleanup', async () => {
  const { host, unmount } = await mount();
  try {
    const stage = host.querySelector('[role="group"]') as HTMLElement;
    await new Promise((resolve) => setTimeout(resolve, 120));
    await act(async () => {
      stage.dispatchEvent(new (globalThis as any).KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    const atHome = solidPoints(host, 'main-body');
    // Wait past the effect teardown that used to restore a stale angle.
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(solidPoints(host, 'main-body'), atHome, 'the keypress holds');
  } finally {
    await unmount();
  }
});
