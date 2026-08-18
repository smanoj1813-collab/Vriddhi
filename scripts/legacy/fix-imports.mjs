import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// OLD -> NEW mapping (from the move operation)
// ==========================================
const MOVE_MAP = {
  'src/components/ProtectedRoute.tsx': 'src/modules/auth/guards/ProtectedRoute.tsx',
  'src/components/RoleGuard.tsx': 'src/modules/auth/guards/RoleGuard.tsx',
  'src/hooks/useFacultyAttendance.ts': 'src/modules/faculty/hooks/useFacultyAttendance.ts',
  'src/hooks/useAttendanceExport.ts': 'src/modules/faculty/hooks/useAttendanceExport.ts',
  'src/hooks/useAttendance.ts': 'src/modules/faculty/hooks/useAttendance.ts',
  'src/hooks/useAttendanceMarking.ts': 'src/modules/faculty/hooks/useAttendanceMarking.ts',
  'src/api/facultyApi.ts': 'src/modules/faculty/api/facultyApi.ts',
  'src/types/attendance.ts': 'src/modules/faculty/types/attendance.ts',
  'src/components/QuestionBank.tsx': 'src/modules/admin/pages/QuestionBank.tsx',
  'src/components/PaperBuilder.tsx': 'src/modules/admin/pages/PaperBuilder.tsx',
  'src/hooks/useQuestionBank.ts': 'src/modules/admin/hooks/useQuestionBank.ts',
  'src/api/paperApi.ts': 'src/modules/admin/api/paperApi.ts',
  'src/types/questionBank.ts': 'src/modules/admin/types/questionBank.ts',
  'src/hooks/useSuperAdmin.ts': 'src/modules/superadmin/hooks/useSuperAdmin.ts',
  'src/api/superAdminApi.ts': 'src/modules/superadmin/api/superAdminApi.ts',
  'src/types/superAdmin.ts': 'src/modules/superadmin/types/superAdmin.ts',
  'src/components/SyllabusUploader.tsx': 'src/modules/superadmin/components/SyllabusUploader.tsx',
  'src/components/CurriculumReviewTable.tsx': 'src/modules/superadmin/components/CurriculumReviewTable.tsx',
  'src/components/ModuleBreakdown.tsx': 'src/modules/superadmin/components/ModuleBreakdown.tsx',
  'src/hooks/useSyllabusParser.ts': 'src/modules/superadmin/hooks/useSyllabusParser.ts',
  'src/hooks/useCurriculum.ts': 'src/modules/superadmin/hooks/useCurriculum.ts',
  'src/api/curriculumApi.ts': 'src/modules/superadmin/api/curriculumApi.ts',
  'src/types/curriculum.ts': 'src/modules/superadmin/types/curriculum.ts',
  'src/services/syllabusParser.ts': 'src/modules/superadmin/services/syllabusParser.ts',
  'src/components/Layout.tsx': 'src/shared/components/Layout.tsx',
};

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Build resolved path map (absolute path -> new absolute path)
const resolvedMap = {};
for (const [oldPath, newPath] of Object.entries(MOVE_MAP)) {
  const oldAbs = path.resolve(oldPath).replace(/\\/g, '/');
  const newAbs = path.resolve(newPath).replace(/\\/g, '/');
  resolvedMap[oldAbs] = newAbs;
  // Also without extension
  resolvedMap[oldAbs.replace(/\.(tsx?|jsx?)$/, '')] = newAbs.replace(/\.(tsx?|jsx?)$/, '');
}

// Build import string map for quick replacement
const importMap = {};
for (const [oldPath, newPath] of Object.entries(MOVE_MAP)) {
  const oldName = path.basename(oldPath).replace(/\.(tsx?|jsx?)$/, '');
  const newName = path.basename(newPath).replace(/\.(tsx?|jsx?)$/, '');
  const oldDir = path.dirname(oldPath).replace(/^src\//, '');
  const newDir = path.dirname(newPath).replace(/^src\//, '');

  // Various import styles
  importMap[`${oldDir}/${oldName}`] = `${newDir}/${newName}`;
  importMap[`@/${oldDir}/${oldName}`] = `@/${newDir}/${newName}`;
}

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

function resolveImport(importPath, fromFile) {
  // Handle @/ alias
  if (importPath.startsWith('@/')) {
    return path.resolve('src', importPath.slice(2)).replace(/\\/g, '/');
  }
  // Handle relative
  if (importPath.startsWith('.')) {
    const fromDir = path.dirname(fromFile);
    return path.resolve(fromDir, importPath).replace(/\\/g, '/');
  }
  // Absolute from src
  return path.resolve('src', importPath).replace(/\\/g, '/');
}

function getNewImportPath(oldImportPath, fromFile) {
  const resolved = resolveImport(oldImportPath, fromFile);
  const resolvedNoExt = resolved.replace(/\.(tsx?|jsx?)$/, '');

  // Check if this resolved path matches a moved file
  for (const [oldAbs, newAbs] of Object.entries(resolvedMap)) {
    if (resolved === oldAbs || resolvedNoExt === oldAbs) {
      // Compute new relative path from current file location
      const fromDir = path.dirname(fromFile);
      let rel = path.relative(fromDir, newAbs).replace(/\\/g, '/');
      if (!rel.startsWith('.')) rel = './' + rel;
      return rel;
    }
  }
  return null;
}

console.log('🔧 Fixing imports across all source files...\n');

let fixedFiles = 0;
let totalChanges = 0;

walk('src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileChanges = 0;

  // Pattern: from '...' or from "..."
  const importRegex = /from\s+(['"])([^'"]+)\1/g;

  content = content.replace(importRegex, (match, quote, importPath) => {
    // First try direct string replacement for @/ and absolute paths
    for (const [oldStr, newStr] of Object.entries(importMap)) {
      if (importPath === oldStr) {
        fileChanges++;
        return `from ${quote}${newStr}${quote}`;
      }
    }

    // Then try resolving relative paths
    const newPath = getNewImportPath(importPath, filePath);
    if (newPath) {
      fileChanges++;
      return `from ${quote}${newPath}${quote}`;
    }

    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    fixedFiles++;
    totalChanges += fileChanges;
    console.log(`  ✓ ${filePath} (${fileChanges} fixes)`);
  }
});

console.log(`\n✅ Fixed ${totalChanges} imports across ${fixedFiles} files.`);
console.log('🔍 Run `npx tsc --noEmit` to verify.');clea