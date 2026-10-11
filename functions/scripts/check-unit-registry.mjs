// Fails if a functions unit test file exists under test/ but is not listed in
// the `test:unit` script of package.json. Unlisted files silently never run.
// Rules-emulator suites (firestore.rules.test.ts) are run by their own script.
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const script = pkg.scripts['test:unit']
const EMULATOR_SUITES = new Set(['test/firestore.rules.test.ts'])

const onDisk = readdirSync(join(root, 'test'))
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => `test/${f}`)
  .filter((f) => !EMULATOR_SUITES.has(f))

const unlisted = onDisk.filter((f) => !script.split(/\s+/).includes(f))
if (unlisted.length) {
  console.error('Unit test files not registered in functions test:unit:')
  for (const f of unlisted) console.error('  ' + f)
  process.exit(1)
}
console.log(`test registry ok: ${onDisk.length} unit test files registered`)
