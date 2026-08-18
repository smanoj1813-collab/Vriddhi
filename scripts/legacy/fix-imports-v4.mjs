import fs from 'fs';
import path from 'path';

function walk(dir, files) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (f === 'node_modules' || f === '.git') continue;
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) files.push(p);
  }
}

const files = [];
walk('src', files);

function ri(content, fromPath, toPath) {
  // Replaces both single and double quoted imports
  return content
    .replaceAll(`from '${fromPath}'`, `from '${toPath}'`)
    .replaceAll(`from "${fromPath}"`, `from "${toPath}"`);
}

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  const rel = f.replace(/\\/g, '/');

  // === STUDENT COMPONENTS (src/modules/student/components/) ===
  if (rel.startsWith('src/modules/student/components/')) {
    content = ri(content, '../../../../shared/types/student', '../types/student');
    content = ri(content, '../../../../shared/hooks/useAssessment', '../../hooks/useAssessment');
    content = ri(content, '../../../../shared/hooks/useAuth', '../../../auth/hooks/useAuth');
    content = ri(content, '../../../../shared/types/assessment', '../../types/assessment');
    content = ri(content, '../../services/studentService', '../services/studentService');
    content = ri(content, '../../services/assignmentService', '../services/assignmentService');
    content = ri(content, '../../hooks/useStudentData', '../hooks/useStudentData');
  }

  // === STUDENT PAGES (src/modules/student/pages/) ===
  if (rel.startsWith('src/modules/student/pages/')) {
    content = ri(content, '../../../../shared/hooks/useAssessment', '../../hooks/useAssessment');
    content = ri(content, '../../../../shared/types/assessment', '../../types/assessment');
    content = ri(content, '../../pages/StudentFeePortal', '../pages/StudentFeePortal');
  }

  // === FACULTY PAGES (src/modules/faculty/pages/) ===
  if (rel.startsWith('src/modules/faculty/pages/')) {
    content = ri(content, '../../../auth/context/AuthContext', '../../../auth/context/AuthContext');
    content = ri(content, './../contexts/AuthContext', '../../../auth/context/AuthContext');
    content = ri(content, './../services/questionBankAPI', '../../services/questionBankAPI');
    content = ri(content, './../components/question-bank/FacultyQuestionForm', '../../components/question-bank/FacultyQuestionForm');
    content = ri(content, './../components/question-bank/FacultyBulkImport', '../../components/question-bank/FacultyBulkImport');
    content = ri(content, './../components/question-bank/FacultyPaperLinker', '../../components/question-bank/FacultyPaperLinker');
  }

  // === FACULTY SERVICES ===
  if (rel.startsWith('src/modules/faculty/services/')) {
    content = ri(content, '../modules/faculty/types/attendance', '../types/attendance');
  }

  // === SUPERADMIN API ===
  if (rel.startsWith('src/modules/superadmin/api/')) {
    content = ri(content, '../../shared/data/karnatakaUniversities', '../../../shared/data/karnatakaUniversities');
  }

  // === SUPERADMIN SERVICES ===
  if (rel === 'src/modules/superadmin/services/seedUniversities.ts') {
    content = ri(content, '../../api/universityApi', '../api/universityApi');
  }

  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log('Fixed:', rel);
  }
}
console.log('v4 import fixes complete.');