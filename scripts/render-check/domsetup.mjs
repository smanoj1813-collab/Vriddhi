// Scratch jsdom bootstrap for the render check. Installed via --import so the
// DOM globals exist BEFORE react-dom is loaded.
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const { window } = dom;

// Node 22 already defines several of these as getter-only globals, so plain
// assignment throws ("Cannot set property navigator ... which has only a
// getter"). defineProperty replaces them.
function define(name, value) {
  if (value === undefined) return;
  Object.defineProperty(globalThis, name, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

define('window', window);
define('document', window.document);
define('navigator', window.navigator);
define('location', window.location);
define('history', window.history);
define('localStorage', window.localStorage);
define('sessionStorage', window.sessionStorage);
define('getComputedStyle', window.getComputedStyle.bind(window));
define('requestAnimationFrame', window.requestAnimationFrame.bind(window));
define('cancelAnimationFrame', window.cancelAnimationFrame.bind(window));

for (const key of [
  'HTMLElement', 'HTMLInputElement', 'HTMLAnchorElement', 'HTMLCanvasElement',
  'Element', 'Node', 'Text', 'DocumentFragment', 'Event', 'CustomEvent',
  'MouseEvent', 'KeyboardEvent', 'SVGElement', 'DOMParser', 'XMLSerializer',
  'ResizeObserver', 'MutationObserver', 'IntersectionObserver',
]) {
  define(key, window[key]);
}

// Libraries probe for these without guarding.
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false, media: '', onchange: null,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  });
}
define('matchMedia', window.matchMedia);

class RO {
  observe() {} unobserve() {} disconnect() {}
}
if (!window.ResizeObserver) window.ResizeObserver = RO;
define('ResizeObserver', window.ResizeObserver);

// react-dom/client act() refuses to run without this.
define('IS_REACT_ACT_ENVIRONMENT', true);
