// ═══════════════════════════════════════════════════════════════════════
// Vriddhi Common Error Auto-Fix (Node.js / Cross-Platform)
// Run: node fix-common-errors.mjs
// ═══════════════════════════════════════════════════════════════════════

import fs from 'fs'
import path from 'path'

const SRC_DIR = './src'
let fixedCount = 0

function getFiles(dir, ext = ['.ts', '.tsx']) {
  const files = []
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getFiles(fullPath, ext))
    } else if (ext.some(e => fullPath.endsWith(e))) {
      files.push(fullPath)
    }
  }
  return files
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content
  let changed = false

  // ── FIX 1: Leading slash imports ──────────────────────────────────
  // e.g., from '/../../../auth/context/AuthContext' → from '../../../auth/context/AuthContext'
  const leadingSlashPattern = /from\s+['"]\/(\.\.\/[^'"]+)['"]/g
  if (leadingSlashPattern.test(content)) {
    content = content.replace(leadingSlashPattern, "from '$1'")
    changed = true
  }

  // ── FIX 2: Broken Firebase/config paths ───────────────────────────
  // Various depth patterns all → @/Firebase/config
  const firebasePatterns = [
    /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/Firebase\/config['"]/g,
    /from\s+['"]\.\.\/\.\.\/\.\.\/Firebase\/config['"]/g,
    /from\s+['"]\.\.\/\.\.\/Firebase\/config['"]/g,
    /from\s+['"]\.\.\/Firebase\/config['"]/g,
    /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/Firebase\/config['"]/g,
  ]
  for (const pattern of firebasePatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, "from '@/Firebase/config'")
      changed = true
    }
  }

  // ── FIX 3: Old relative paths to moved modules ────────────────────
  // If a file in modules/admin/ imports from old locations
  if (filePath.includes('modules/admin')) {
    // Fix old hooks imports
    content = content.replace(
      /from\s+['"]\.\.\/\.\.\/\.\.\/hooks\/useAssessment['"]/g,
      "from '../../hooks/useAssessment'"
    )
    // Fix old types imports  
    content = content.replace(
      /from\s+['"]\.\.\/\.\.\/\.\.\/types\/assessment['"]/g,
      "from '../../types/assessment'"
    )
    // Fix old components imports
    content = content.replace(
      /from\s+['"]\.\.\/\.\.\/\.\.\/components\/ReviewQueue['"]/g,
      "from '../../components/ReviewQueue'"
    )
  }

  // ── FIX 4: AttendanceStatus string literal fixes ─────────────────
  // These are common in BulkActionsBar and similar
  if (content.includes('"Present"') && content.includes('AttendanceStatus')) {
    content = content.replace(/status:\s*"Present"/g, 'status: "Present" as AttendanceStatus')
    content = content.replace(/status:\s*"Absent"/g, 'status: "Absent" as AttendanceStatus')
    changed = true
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  ✅ Fixed: ${filePath}`)
    fixedCount++
    return true
  }
  return false
}

// ── MAIN ──────────────────────────────────────────────────────────────
console.log('🔧 Scanning for common Vriddhi errors...\n')
const files = getFiles(SRC_DIR)
let totalFixed = 0

for (const file of files) {
  if (fixFile(file)) totalFixed++
}

console.log(`\n✅ Fixed ${totalFixed} files.`)
console.log('Run: npx tsc --noEmit 2>&1 | Select-Object -First 40')