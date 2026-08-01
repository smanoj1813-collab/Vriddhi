import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIG: Edit these paths to match your project
// Format: [sourcePath, destinationPath]
// Both relative to project root
// ==========================================
const MOVES = [
  // --- AUTH MODULE ---
  ['src/context/AuthContext.tsx', 'src/modules/auth/context/AuthContext.tsx'],
  ['src/components/Login.tsx', 'src/modules/auth/pages/Login.tsx'],
  ['src/components/ProtectedRoute.tsx', 'src/modules/auth/guards/ProtectedRoute.tsx'],
  ['src/components/RoleGuard.tsx', 'src/modules/auth/guards/RoleGuard.tsx'],

  // --- STUDENT MODULE ---
  ['src/components/StudentSidebar.tsx', 'src/modules/student/components/StudentSidebar.tsx'],

  // --- FACULTY MODULE ---
  ['src/components/FacultyAttendance.tsx', 'src/modules/faculty/pages/FacultyAttendance.tsx'],
  ['src/components/ExportButton.tsx', 'src/modules/faculty/components/ExportButton.tsx'],
  ['src/hooks/useFacultyAttendance.ts', 'src/modules/faculty/hooks/useFacultyAttendance.ts'],
  ['src/hooks/useAttendanceExport.ts', 'src/modules/faculty/hooks/useAttendanceExport.ts'],
  ['src/hooks/useAttendance.ts', 'src/modules/faculty/hooks/useAttendance.ts'],
  ['src/hooks/useAttendanceMarking.ts', 'src/modules/faculty/hooks/useAttendanceMarking.ts'],
  ['src/api/facultyApi.ts', 'src/modules/faculty/api/facultyApi.ts'],
  ['src/types/attendance.ts', 'src/modules/faculty/types/attendance.ts'],

  // --- ADMIN MODULE (HOD + Question Bank) ---
  ['src/components/QuestionBank.tsx', 'src/modules/admin/pages/QuestionBank.tsx'],
  ['src/components/PaperBuilder.tsx', 'src/modules/admin/pages/PaperBuilder.tsx'],
  ['src/components/AIQuestionGenerator.tsx', 'src/modules/admin/components/AIQuestionGenerator.tsx'],
  ['src/hooks/useQuestionBank.ts', 'src/modules/admin/hooks/useQuestionBank.ts'],
  ['src/api/paperApi.ts', 'src/modules/admin/api/paperApi.ts'],
  ['src/types/questionBank.ts', 'src/modules/admin/types/questionBank.ts'],
  ['src/services/seedQuestions.ts', 'src/modules/admin/services/seedQuestions.ts'],

  // --- SUPERADMIN MODULE ---
  ['src/components/SuperAdminAdmins.tsx', 'src/modules/superadmin/pages/SuperAdminAdmins.tsx'],
  ['src/components/MultiCollegeComparison.tsx', 'src/modules/superadmin/pages/MultiCollegeComparison.tsx'],
  ['src/components/SubscriptionBilling.tsx', 'src/modules/superadmin/pages/SubscriptionBilling.tsx'],
  ['src/components/SystemHealthMonitor.tsx', 'src/modules/superadmin/pages/SystemHealthMonitor.tsx'],
  ['src/hooks/useSuperAdmin.ts', 'src/modules/superadmin/hooks/useSuperAdmin.ts'],
  ['src/api/superAdminApi.ts', 'src/modules/superadmin/api/superAdminApi.ts'],
  ['src/types/superAdmin.ts', 'src/modules/superadmin/types/superAdmin.ts'],

  // --- CURRICULUM (under superadmin) ---
  ['src/components/SyllabusUploader.tsx', 'src/modules/superadmin/components/SyllabusUploader.tsx'],
  ['src/components/CurriculumReviewTable.tsx', 'src/modules/superadmin/components/CurriculumReviewTable.tsx'],
  ['src/components/ModuleBreakdown.tsx', 'src/modules/superadmin/components/ModuleBreakdown.tsx'],
  ['src/hooks/useSyllabusParser.ts', 'src/modules/superadmin/hooks/useSyllabusParser.ts'],
  ['src/hooks/useCurriculum.ts', 'src/modules/superadmin/hooks/useCurriculum.ts'],
  ['src/api/curriculumApi.ts', 'src/modules/superadmin/api/curriculumApi.ts'],
  ['src/types/curriculum.ts', 'src/modules/superadmin/types/curriculum.ts'],
  ['src/services/syllabusParser.ts', 'src/modules/superadmin/services/syllabusParser.ts'],

  // --- SHARED ---
  ['src/components/Layout.tsx', 'src/shared/components/Layout.tsx'],
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ==========================================
// STEP 1: Create directories and move files
// ==========================================
console.log('📦 Phase 3: Physical File Reorganization\n');

console.log('Step 1: Moving files...');
const movedFiles = [];
for (const [src, dest] of MOVES) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    movedFiles.push({ old: src, new: dest });
    console.log(`  ✓ ${src} → ${dest}`);
  } else {
    console.log(`  ⚠️  Not found (skipped): ${src}`);
  }
}

// ==========================================
// STEP 2: Build lookup maps
// ==========================================
const basenameMap = {};
for (const { new: dest } of movedFiles) {
  const base = path.basename(dest);
  const nameWithoutExt = base.replace(/\.(tsx?|jsx?)$/, '');
  if (!basenameMap[nameWithoutExt]) basenameMap[nameWithoutExt] = [];
  basenameMap[nameWithoutExt].push(dest);
}

const importPathMap = {};
for (const { old: src, new: dest } of movedFiles) {
  const oldDir = path.dirname(src).replace(/^src\//, '');
  const newDir = path.dirname(dest).replace(/^src\//, '');
  const name = path.basename(src).replace(/\.(tsx?|jsx?)$/, '');

  const patterns = [
    `${oldDir}/${name}`,
    `@/${oldDir}/${name}`,
  ];

  const newPatterns = [
    `${newDir}/${name}`,
    `@/${newDir}/${name}`,
  ];

  patterns.forEach((p, i) => {
    importPathMap[p] = newPatterns[i];
  });
}

// ==========================================
// STEP 3: Fix imports in all source files
// ==========================================
console.log('\nStep 2: Fixing imports...');

function walk(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walk(fullPath, callback);
    } else if (entry.isFile() && EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      callback(fullPath);
    }
  }
}

function getRelativePath(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, toFile);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\.(tsx?|jsx?)$/, '');
}

let fixedCount = 0;

walk('src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Fix absolute-style imports (including @/ aliases)
  for (const [oldPath, newPath] of Object.entries(importPathMap)) {
    const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`from\s+['"]${escaped}['"]`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from '${newPath}'`);
    }
  }

  // Fix relative imports
  const relImportRegex = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
  let match;
  const relImports = [];
  while ((match = relImportRegex.exec(originalContent)) !== null) {
    relImports.push(match[1]);
  }

  for (const relPath of relImports) {
    const fromDir = path.dirname(filePath);
    const resolved = path.resolve(fromDir, relPath);
    const resolvedNoExt = resolved.replace(/\.(tsx?|jsx?)$/, '');

    for (const { old: oldPath, new: newPath } of movedFiles) {
      const oldResolved = path.resolve(oldPath).replace(/\.(tsx?|jsx?)$/, '');
      const oldResolvedIndex = oldResolved + '\index';

      if (resolvedNoExt === oldResolved || resolvedNoExt === oldResolvedIndex) {
        const newRel = getRelativePath(filePath, newPath);
        const escapedRel = relPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`from\s+['"]${escapedRel}['"]`, 'g');
        content = content.replace(regex, `from '${newRel}'`);
        break;
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    fixedCount++;
    console.log(`  ✓ ${filePath}`);
  }
});

// ==========================================
// STEP 4: Clean up empty directories
// ==========================================
console.log('\nStep 3: Cleaning up empty directories...');

function removeEmptyDirs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeEmptyDirs(fullPath);
      try {
        fs.rmdirSync(fullPath);
        console.log(`  ✓ Removed empty: ${fullPath}`);
      } catch (e) {
        // Directory not empty, ignore
      }
    }
  }
}

['src/components', 'src/hooks', 'src/api', 'src/types', 'src/context', 'src/services'].forEach(dir => {
  if (fs.existsSync(dir)) {
    removeEmptyDirs(dir);
    try {
      fs.rmdirSync(dir);
    } catch (e) {}
  }
});

console.log(`\n✅ Done! Moved ${movedFiles.length} files, fixed imports in ${fixedCount} files.`);
console.log('🔍 Run `npx tsc --noEmit` to check for remaining issues.');
console.log('\n📋 Post-reorganization checklist:');
console.log('   1. Update tsconfig.json paths if you use specific aliases (e.g., "@/components/*")');
console.log('   2. Update any barrel index.ts files (src/components/index.ts, etc.)');
console.log('   3. Update vite.config.ts / webpack aliases if needed');
console.log('   4. Run your test suite');