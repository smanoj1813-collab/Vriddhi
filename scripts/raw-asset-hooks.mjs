// scripts/raw-asset-hooks.mjs
//
// Teaches `node --import tsx --test` about Vite's `?raw` import suffix.
//
// The question-bank seed module bundles its CSVs with `import csv from
// '…/All_QuestionBank.csv?raw'` so the superadmin seeder works without a server
// round-trip. Vite resolves that at build time; plain Node cannot, which would
// make the seed module (and therefore its unit tests) unimportable outside the
// bundler. These hooks close that gap — any specifier ending in `?raw` is served
// as a module whose default export is the file's text.
//
// Registered for the unit tests in package.json:
//   node --import ./scripts/raw-asset-hooks.mjs --import tsx --test …
//
// Two APIs, one behaviour:
//   • Node ≥ 22.15 — `module.registerHooks` (synchronous, in-thread).
//   • Node < 22.15 — `module.register` + ./raw-asset-loader.mjs (async, loader
//     thread). CI currently pins Node 20, so this path is what runs there.
//
import { readFileSync } from 'node:fs';
import * as nodeModule from 'node:module';

const RAW_QUERY = /\?raw$/;

/** Strip `?raw`, resolve against the importer, and re-tag the URL for `load`. */
function resolveRawUrl(specifier, context) {
  const clean = specifier.replace(RAW_QUERY, '');
  const parentURL = context?.parentURL ? new URL(context.parentURL) : undefined;
  const url = parentURL ? new URL(clean, parentURL) : new URL(clean);
  return `${url.href}?raw`;
}

function rawModuleSource(text) {
  return `export default ${JSON.stringify(text)};`;
}

if (typeof nodeModule.registerHooks === 'function') {
  nodeModule.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (!RAW_QUERY.test(specifier)) return nextResolve(specifier, context);
      return { url: resolveRawUrl(specifier, context), format: 'module', shortCircuit: true };
    },
    load(url, context, nextLoad) {
      if (!url.endsWith('?raw')) return nextLoad(url, context);
      return {
        format: 'module',
        shortCircuit: true,
        source: rawModuleSource(readFileSync(new URL(url.replace(/\?raw$/, '')), 'utf8')),
      };
    },
  });
} else {
  nodeModule.register(new URL('./raw-asset-loader.mjs', import.meta.url).href);
}
