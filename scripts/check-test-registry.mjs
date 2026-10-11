// Fails if a frontend/scripts test file (*.test.ts|tsx|mjs) exists but is not
// listed in the root `test:unit` script. Unlisted files silently never run.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const listed = new Set(pkg.scripts['test:unit'].split(/\s+/))
const files = execSync("git ls-files 'src/*.test.ts' 'src/*.test.tsx' 'scripts/*.test.mjs' 'scripts/*.test.ts'", {
  cwd: root,
  encoding: 'utf8',
}).split('\n').filter(Boolean)

const unlisted = files.filter((f) => !listed.has(f))
if (unlisted.length) {
  console.error('Test files not registered in root test:unit:')
  for (const f of unlisted) console.error('  ' + f)
  process.exit(1)
}
console.log(`test registry ok: ${files.length} test files registered`)
