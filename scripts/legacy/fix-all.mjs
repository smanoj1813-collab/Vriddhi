// Vriddhi 591-Error Comprehensive Fix Script
// Run: node fix-all.mjs
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
let totalFixed = 0

function getTsFiles(dir) {
  const files = []
  for (const item of fs.readdirSync(dir)) {
    if (item === 'node_modules') continue
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getTsFiles(fullPath))
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }
  return files
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content
  let changed = false

  // FIX 1: Leading slash imports
  if (/from\s+['"]\/\.\.\//.test(content)) {
    content = content.replace(/from\s+['"]\/(\.\.\/[^'"]+)['"]/g, "from '$1'")
    changed = true
  }

  // FIX 2: Firebase config paths
  const patterns = [
    [/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/Firebase\/config['"]/g, "from '@/Firebase/config'"],
    [/from\s+['"]\.\.\/\.\.\/\.\.\/Firebase\/config['"]/g, "from '@/Firebase/config'"],
    [/from\s+['"]\.\.\/\.\.\/Firebase\/config['"]/g, "from '@/Firebase/config'"],
    [/from\s+['"]\.\.\/Firebase\/config['"]/g, "from '@/Firebase/config'"],
  ]
  for (const [p, r] of patterns) {
    if (p.test(content)) { content = content.replace(p, r); changed = true }
  }

  // FIX 3: SuperAdmin curriculum paths
  const curPatterns = [
    [/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/superadmin\/types\/curriculum['"]/g, "from '@/modules/superadmin/types/curriculum'"],
    [/from\s+['"]\.\.\/\.\.\/\.\.\/superadmin\/types\/curriculum['"]/g, "from '@/modules/superadmin/types/curriculum'"],
  ]
  for (const [p, r] of curPatterns) {
    if (p.test(content)) { content = content.replace(p, r); changed = true }
  }

  // FIX 4: Shared types paths
  if (/from\s+['"]\.\.\/\.\.\/\.\.\/shared\/types\//.test(content)) {
    content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/shared\/types\/([^'"]+)['"]/g, "from '@/shared/types/$1'")
    changed = true
  }

  // FIX 5: Old relative paths in modules/admin
  if (filePath.includes('modules') && filePath.includes('admin')) {
    if (/from\s+['"]\.\.\/\.\.\/\.\.\/hooks\//.test(content)) {
      content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/hooks\/([^'"]+)['"]/g, "from '../../hooks/$1'")
      changed = true
    }
    if (/from\s+['"]\.\.\/\.\.\/\.\.\/types\//.test(content)) {
      content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/types\/([^'"]+)['"]/g, "from '../../types/$1'")
      changed = true
    }
    if (/from\s+['"]\.\.\/\.\.\/\.\.\/components\//.test(content)) {
      content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/components\/([^'"]+)['"]/g, "from '../../components/$1'")
      changed = true
    }
  }

  // FIX 6: AttendanceStatus casts
  if (content.includes('AttendanceStatus') && (content.includes('"Present"') || content.includes('"Absent"'))) {
    content = content.replace(/status:\s*"Present"/g, 'status: "Present" as AttendanceStatus')
    content = content.replace(/status:\s*"Absent"/g, 'status: "Absent" as AttendanceStatus')
    changed = true
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    totalFixed++
    console.log('  Fixed:', path.relative(ROOT, filePath))
    return true
  }
  return false
}

console.log('Vriddhi Comprehensive Error Fix')
console.log('================================\n')

const srcFiles = getTsFiles(path.join(ROOT, 'src'))
console.log('Scanning', srcFiles.length, 'TypeScript files...\n')

for (const file of srcFiles) {
  fixFile(file)
}

console.log('\nFixed', totalFixed, 'files.')
console.log('\nNext: npx tsc --noEmit')