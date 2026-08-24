#!/usr/bin/env node
/**
 * Dead-code guard.
 *
 * Walks the static import graph from src/main.tsx and fails when a file under
 * src/ cannot be reached from the app entry point.
 *
 * Usage:
 *   node scripts/check-dead-code.cjs            # fail on new orphans
 *   node scripts/check-dead-code.cjs --write    # rewrite the allowlist
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ALLOWLIST = path.join(__dirname, 'dead-code-allowlist.txt');

// Every path used as a Set/Map key is normalised to forward slashes.
// Without this, Windows produces backslashes from path.resolve but forward
// slashes from the '/index.tsx' extension probe, so directory-index imports
// resolve to a key that never matches the walked file list -- and the
// traversal silently dead-ends at the first `import './routes'`.
const norm = (p) => path.normalize(p).split(/[\\/]+/).join('/');

const ENTRY = norm(path.join(SRC, 'main.tsx'));
const EXTS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

// Ambient declaration files are pulled in by tsconfig, never by an import.
function isAmbient(rel) {
  return rel.endsWith('.d.ts');
}

// Standalone developer tooling, run by hand rather than from the app.
function isStandaloneTooling(rel) {
  return rel === 'src/scripts' || rel.startsWith('src/scripts/');
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(norm(p));
  }
  return out;
}

function resolveSpec(spec, fromFile) {
  let base;
  if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else return null; // bare npm package
  for (const ext of EXTS) {
    const candidate = norm(base + ext);
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch (_) {
      /* try next extension */
    }
  }
  return null;
}

// Matches static imports, re-exports, require() and dynamic import().
// Deliberately includes `import type`, so type-only dependencies count.
const IMPORT_RE =
  /(?:import\s+[^'"]*?from\s*|import\s*|export\s+[^'"]*?from\s*|require\s*\(\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;

function buildGraph(files) {
  const deps = new Map();
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const set = new Set();
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(source))) {
      const resolved = resolveSpec(m[1], file);
      if (resolved) set.add(resolved);
    }
    deps.set(file, set);
  }
  return deps;
}

function reachableFrom(entry, deps) {
  const seen = new Set([entry]);
  const stack = [entry];
  while (stack.length) {
    for (const dep of deps.get(stack.pop()) || []) {
      if (!seen.has(dep)) {
        seen.add(dep);
        stack.push(dep);
      }
    }
  }
  return seen;
}

function main() {
  const write = process.argv.includes('--write');

  if (!fs.existsSync(ENTRY)) {
    console.error(`check-dead-code: entry point not found at ${norm(path.relative(ROOT, ENTRY))}`);
    process.exit(1);
  }

  const files = walk(SRC);
  const deps = buildGraph(files);
  const seen = reachableFrom(ENTRY, deps);

  const toRel = (f) => norm(path.relative(ROOT, f));

  const orphans = files
    .filter((f) => !seen.has(f))
    .map(toRel)
    .filter((rel) => !isAmbient(rel))
    .filter((rel) => !isStandaloneTooling(rel))
    .sort();

  if (write) {
    const header =
      '# Files under src/ that are known to be unreachable from src/main.tsx.\n' +
      '# Each entry is deliberate: either standalone tooling or a component that is\n' +
      '# compiled and typechecked but not yet mounted on a route.\n' +
      '# Regenerate with: node scripts/check-dead-code.cjs --write\n';
    fs.writeFileSync(ALLOWLIST, header + orphans.join('\n') + (orphans.length ? '\n' : ''));
    console.log(`check-dead-code: wrote ${orphans.length} entries to ${norm(path.relative(ROOT, ALLOWLIST))}`);
    return;
  }

  let allowed = [];
  if (fs.existsSync(ALLOWLIST)) {
    allowed = fs
      .readFileSync(ALLOWLIST, 'utf8')
      .split('\n')
      .map((l) => l.trim().split(/[\\/]+/).join('/'))
      .filter((l) => l && !l.startsWith('#'));
  }
  const allowedSet = new Set(allowed);
  const orphanSet = new Set(orphans);

  const unlisted = orphans.filter((f) => !allowedSet.has(f));
  const stale = allowed.filter((f) => !orphanSet.has(f));

  console.log(`check-dead-code: ${files.length} files in src/, ${seen.size} reachable from src/main.tsx`);

  let failed = false;

  if (unlisted.length) {
    failed = true;
    console.error(`\n✗ ${unlisted.length} file(s) in src/ are not reachable from src/main.tsx:`);
    for (const f of unlisted) console.error(`    ${f}`);
    console.error(
      '\n  These are dead code: nothing imports them, so they are neither bundled nor\n' +
        '  rendered. Either wire them into the route tree, move them to attic/, or\n' +
        '  delete them. If one is intentionally kept unrouted, add it to\n' +
        '  scripts/dead-code-allowlist.txt with a reason.'
    );
  }

  if (stale.length) {
    failed = true;
    console.error(`\n✗ ${stale.length} stale allowlist entr${stale.length === 1 ? 'y' : 'ies'} (now reachable or removed):`);
    for (const f of stale) console.error(`    ${f}`);
    console.error('\n  Remove them from scripts/dead-code-allowlist.txt.');
  }

  if (failed) process.exit(1);

  console.log(`✓ no unlisted orphans (${allowed.length} deliberately unrouted)`);
}

main();