const fs = require('fs');
const path = require('path');

// Mapping: barrel import → direct import
const HOOK_MAP = {
  'useAuth': { name: 'useAuth', from: '../contexts/AuthContext' },
  'useAdminDashboard': { name: 'useAdminDashboardData', from: './useAdminDashboard' },
  'useAttendance': { name: 'useAttendance', from: './useAttendance' },
  'useAttendanceMarking': { name: 'useAttendanceMarking', from: './useAttendanceMarking' },
  'useAttendanceExport': { name: 'useAttendanceExport', from: './useAttendanceExport' },
  'useCollegeStudents': { name: 'useCollegeStudents', from: './useCollegeStudents' },
  'useCurriculum': { name: 'useCurriculum', from: './useCurriculum' },
  'useDashboardData': { name: 'useDashboardData', from: './useDashboardData' },
  'useFacultyData': { name: 'useFacultyData', from: './useFacultyData' },
  'useFacultyAttendance': { name: 'useFacultyAttendance', from: './useFacultyAttendance' },
  'useFeeData': { name: 'useFeeData', from: './useFeeData' },
  'useGreeting': { name: 'useGreeting', from: './useGreeting' },
  'useAIAgent': { name: 'useAIAgent', from: './useAIAgent' },
  'useSchedules': { name: 'useAdminSchedule', from: './useAdminSchedule' },
  'useStudentData': { name: 'useStudentData', from: './useStudentData' },
  'useQuestionBank': { name: 'useQuestionBank', from: './useQuestionBank' },
  'usePaperGenerator': { name: 'usePaperGenerator', from: './usePaperGenerator' },
  'useAIQuestionGenerator': { name: 'useAIQuestionGenerator', from: './useAIQuestionGenerator' },
  'useSyllabusParser': { name: 'useSyllabusParser', from: './useSyllabusParser' },
};

// Assessment hooks (all from useAssessment)
const ASSESSMENT_HOOKS = [
  'useQuestions', 'useQuestion', 'usePapers', 'usePaper',
  'useScheduledTests', 'useStudentTests', 'useActiveTest',
  'useTestResult', 'useTestResults', 'useTestAnalytics',
  'useReviewQueue', 'useTestNotifications', 'useBulkImport'
];

// Syllabus curriculum hooks
const SYLLABUS_HOOKS = [
  'useSyllabusExtracts', 'useSyllabusExtract', 'useCurriculumDocs',
  'useCurriculumAssignment', 'useCurriculumStats'
];

function findFiles(dir, extensions) {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
      files.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern: import { ... } from '../hooks' or '../../hooks'
  const barrelPattern = /import\s+\{([^}]+)\}\s+from\s+['"](\.\.\/)+hooks['"]/g;
  
  let match;
  while ((match = barrelPattern.exec(content)) !== null) {
    const imports = match[1].split(',').map(s => s.trim());
    const newImports = [];
    
    for (const imp of imports) {
      const hookName = imp.split(' as ')[0].trim();
      
      if (HOOK_MAP[hookName]) {
        newImports.push(`import { ${imp} } from '${HOOK_MAP[hookName].from}'`);
      } else if (ASSESSMENT_HOOKS.includes(hookName)) {
        newImports.push(`import { ${imp} } from './useAssessment'`);
      } else if (SYLLABUS_HOOKS.includes(hookName)) {
        newImports.push(`import { ${imp} } from './useSyllabusCurriculum'`);
      } else {
        // Unknown hook — leave as comment for manual review
        newImports.push(`// TODO: Fix import for ${imp}`);
      }
    }
    
    content = content.replace(match[0], newImports.join('\n'));
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

const files = findFiles('src', ['.ts', '.tsx']);
for (const file of files) {
  processFile(file);
}

console.log('\n🎉 Done! Run `npm run build` to verify.');