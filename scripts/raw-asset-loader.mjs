// scripts/raw-asset-loader.mjs
//
// Legacy (Node < 22.15) ESM loader implementing Vite's `?raw` import suffix.
// Registered by ./raw-asset-hooks.mjs, which prefers the synchronous
// `module.registerHooks` API when the running Node has it.
//
// Kept separate because the two APIs are not interchangeable: `register()` runs
// these hooks on a loader thread where only the async `load` form is supported,
// while `registerHooks` runs them in-thread and can read synchronously.
//
import { readFile } from 'node:fs/promises';

const RAW_QUERY = /\?raw$/;

export async function resolve(specifier, context, nextResolve) {
  if (!RAW_QUERY.test(specifier)) return nextResolve(specifier, context);

  const clean = specifier.replace(RAW_QUERY, '');
  // Keep the `?raw` marker on the resolved URL so `load` can spot it, while
  // pointing at the real file (parent-relative specifiers resolved here).
  const parentURL = context.parentURL ? new URL(context.parentURL) : undefined;
  const url = parentURL ? new URL(clean, parentURL) : new URL(clean);
  return { url: `${url.href}?raw`, format: 'module', shortCircuit: true };
}

export async function load(url, context, nextLoad) {
  if (!url.endsWith('?raw')) return nextLoad(url, context);
  const source = await readFile(new URL(url.replace(/\?raw$/, '')), 'utf8');
  return {
    format: 'module',
    shortCircuit: true,
    source: `export default ${JSON.stringify(source)};`,
  };
}
