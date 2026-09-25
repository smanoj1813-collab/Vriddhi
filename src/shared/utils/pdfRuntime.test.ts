// src/shared/utils/pdfRuntime.test.ts
//
// Two things are worth testing here and neither is "does jsPDF work":
//
//  1. the caching contract — the libraries load once, and a *failed* load is not
//     cached (a student on a flaky connection must not be locked out for the rest
//     of the session by one rejected promise);
//  2. the one-entry-point rule — no file outside this module may import jspdf or
//     html2canvas by value. One stray static import drags ~580 kB into the first
//     page load of every user, and a bundle mistake is invisible in review. This
//     test reads the source tree, like the model-canary guard does.
//
// Run: `npm run test:unit`.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import test from 'node:test'

import { createPdfLibsCache, type PdfLibs } from './pdfRuntime'

const REPO_ROOT = join(process.cwd())
const SRC_ROOT = join(REPO_ROOT, 'src')
const RUNTIME_FILE = join('src', 'shared', 'utils', 'pdfRuntime.ts')
// This guard necessarily contains the literals it looks for.
const SELF_FILE = join('src', 'shared', 'utils', 'pdfRuntime.test.ts')

const fakeLibs = {} as PdfLibs

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full))
      continue
    }
    if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

/** Strip comments so a commented-out import never fails the guard. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

test('the libraries are imported once and reused', async () => {
  let loads = 0
  const cache = createPdfLibsCache(async () => {
    loads += 1
    return fakeLibs
  })

  const first = await cache.loadPdfLibs()
  const second = await cache.loadPdfLibs()

  assert.equal(loads, 1, 'the second call must reuse the first load')
  assert.equal(first, fakeLibs)
  assert.equal(second, fakeLibs)
  assert.equal(cache.isLoaded(), true)
})

test('concurrent callers share one load', async () => {
  let loads = 0
  const cache = createPdfLibsCache(async () => {
    loads += 1
    await new Promise((r) => setTimeout(r, 5))
    return fakeLibs
  })

  const [a, b, c] = await Promise.all([cache.loadPdfLibs(), cache.loadPdfLibs(), cache.loadPdfLibs()])

  assert.equal(loads, 1, 'the chunk must be requested once, not once per caller')
  assert.equal(a, b)
  assert.equal(b, c)
})

test('a failed load is retried on the next click', async () => {
  let attempts = 0
  const cache = createPdfLibsCache(async () => {
    attempts += 1
    if (attempts === 1) throw new Error('network down')
    return fakeLibs
  })

  await assert.rejects(() => cache.loadPdfLibs(), /network down/)
  assert.equal(cache.isLoaded(), false, 'a rejection must not be cached')

  const libs = await cache.loadPdfLibs()
  assert.equal(libs, fakeLibs, 'the retry must succeed')
  assert.equal(attempts, 2)
})

test('isLoaded() only reports a started load, and stays true after success', async () => {
  const cache = createPdfLibsCache(async () => fakeLibs)
  assert.equal(cache.isLoaded(), false, 'nothing is loaded before the first call')
  const pending = cache.loadPdfLibs()
  assert.equal(cache.isLoaded(), true, 'a warm-up in flight counts as loaded (no spinner flash)')
  await pending
  assert.equal(cache.isLoaded(), true)
})

test('nothing outside pdfRuntime.ts imports jspdf or html2canvas by value', () => {
  const offenders: string[] = []
  // `import X from 'jspdf'`, `import { jsPDF } from 'jspdf'`, `require('jspdf')`.
  // `import type { … }` is fine: it is erased at build time.
  const staticImport = /(?:^|[^.\w])import\s+(?!type\b)[^;]*?from\s*['"](jspdf|html2canvas)['"]|require\(\s*['"](jspdf|html2canvas)['"]\s*\)/m
  // A dynamic import is only allowed in a *type* position:
  //   `type Doc = import('jspdf').jsPDF`  /  `foo: import('jspdf').jsPDF`
  const typeOnlyDynamic = /[:=]\s*import\(\s*['"](?:jspdf|html2canvas)['"]\s*\)/

  for (const file of sourceFiles(SRC_ROOT)) {
    const rel = relative(REPO_ROOT, file)
    const normalised = rel.split(sep).join('/')
    if (normalised === RUNTIME_FILE.split(sep).join('/')) continue
    if (normalised === SELF_FILE.split(sep).join('/')) continue
    const source = stripComments(readFileSync(file, 'utf8'))
    if (source.includes("from 'jspdf'") || source.includes('from "jspdf"')
      || source.includes("from 'html2canvas'") || source.includes('from "html2canvas"')) {
      // Allow the erased, type-only form.
      const valueImport = source
        .split('\n')
        .filter((line) => /from\s+['"](jspdf|html2canvas)['"]/.test(line))
        .filter((line) => !/^\s*import\s+type\b/.test(line))
      if (valueImport.length > 0) offenders.push(`${rel}: ${valueImport[0].trim()}`)
      continue
    }
    if (staticImport.test(source) && !typeOnlyDynamic.test(source)) {
      offenders.push(`${rel}: static or bare dynamic import`)
      continue
    }
    const dynamicImports = source.match(/import\(\s*['"](?:jspdf|html2canvas)['"]\s*\)/g) ?? []
    const typeImports = source.match(/[:=]\s*import\(\s*['"](?:jspdf|html2canvas)['"]\s*\)/g) ?? []
    if (dynamicImports.length > typeImports.length) {
      offenders.push(`${rel}: dynamic import outside pdfRuntime.ts`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `jspdf / html2canvas must only be loaded through src/shared/utils/pdfRuntime.ts.\n${offenders.join('\n')}`,
  )
})

test('pdfRuntime.ts itself keeps the libraries behind dynamic imports', () => {
  const source = stripComments(readFileSync(join(REPO_ROOT, RUNTIME_FILE), 'utf8'))
  assert.match(source, /await Promise\.all\(\[import\('jspdf'\), import\('html2canvas'\)\]\)/)
  assert.doesNotMatch(source, /^\s*import\s+(?!type\b).*from\s*['"](jspdf|html2canvas)['"]/m,
    'a static import here would defeat the whole point')
})
