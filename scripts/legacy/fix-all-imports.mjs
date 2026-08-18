import fs from 'fs';
import path from 'path';

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ==========================================
// GLOBAL IMPORT FIXES (applied to ALL files)
// Format: [searchString, replaceString]
// These are safe to apply globally
// ==========================================
const GLOBAL_FIXES = [
  // --- ROUTE FILES ---
  ["from '../pages/Students'", "from '../modules/student/pages/Students'"],
  ["from '../pages/View360'", "from '../pages/View360'"],
  ["from '../pages/Attendance'", "from '../modules/faculty/pages/Attendance'"],
  ["from '../pages/Assessments'", "from '../pages/Assessments'"],
  ["from '../pages/Settings'", "from '../pages/Settings'"],
  ["from '../pages/AdminDashboard'", "from '../pages/AdminDashboard'"],
  ["from '../pages/AdminClassSchedule'", "from '../pages/AdminClassSchedule'"],
  ["from '../pages/AdminFeeManagement'", "from '../pages/AdminFeeManagement'"],
  ["from '../pages/AdminCurriculum'", "from '../pages/AdminCurriculum'"],
  ["from '../pages/HODDashboard'", "from '../pages/HODDashboard'"],
  ["from '../pages/QuestionBank'", "from '../pages/QuestionBank'"],
  ["from '../components/question-bank/FacultyBankAdmin'", "from '../components/question-bank/FacultyBankAdmin'"],
  ["from '../pages/PaperGeneratorAdmin'", "from '../pages/PaperGeneratorAdmin'"],
  ["from '../pages/Analytics'", "from '../pages/Analytics'"],
  ["from '../pages/Journey'", "from '../pages/Journey'"],

  ["from '../pages/faculty/FacultyDashboard'", "from '../modules/faculty/pages/FacultyDashboard'"],
  ["from '../pages/faculty/FacultyAttendance'", "from '../modules/faculty/pages/FacultyAttendance'"],
  ["from '../pages/faculty/FacultyTopics'", "from '../modules/faculty/pages/FacultyTopics'"],
  ["from '../pages/faculty/FacultyPapers'", "from '../modules/faculty/pages/FacultyPapers'"],
  ["from '../pages/faculty/FacultyQuestionBank'", "from '../modules/faculty/pages/FacultyQuestionBank'"],
  ["from '../pages/faculty/FacultyPaperGenerator'", "from '../modules/faculty/pages/FacultyPaperGenerator'"],
  ["from '../pages/faculty/FacultyStudentAnalysis'", "from '../modules/faculty/pages/FacultyStudentAnalysis'"],
  ["from '../pages/faculty/FacultyReschedule'", "from '../modules/faculty/pages/FacultyReschedule'"],
  ["from '../pages/faculty/FacultyUploadMaterial'", "from '../modules/faculty/pages/FacultyUploadMaterial'"],
  ["from '../pages/faculty/FacultyLibrary'", "from '../modules/faculty/pages/FacultyLibrary'"],
  ["from '../pages/faculty/FacultyAnnouncements'", "from '../modules/faculty/pages/FacultyAnnouncements'"],
  ["from '../pages/faculty/FacultyAssignments'", "from '../modules/faculty/pages/FacultyAssignments'"],
  ["from '../pages/faculty/FacultyCalendar'", "from '../modules/faculty/pages/FacultyCalendar'"],
  ["from '../pages/faculty/FacultyCurriculum'", "from '../modules/faculty/pages/FacultyCurriculum'"],
  ["from '../components/FacultyAttendanceMarking'", "from '../modules/faculty/components/FacultyAttendanceMarking'"],
  ["from '../components/question-bank/AIQuestionGenerator'", "from '../components/question-bank/AIQuestionGenerator'"],

  ["from '../components/student/StudentSidebar'", "from '../modules/student/components/StudentSidebar'"],
  ["from '../pages/StudentDashboard'", "from '../modules/student/pages/StudentDashboard'"],
  ["from '../components/student/SchedulingPage'", "from '../modules/student/components/SchedulingPage'"],
  ["from '../components/student/UpcomingAssessments'", "from '../modules/student/components/UpcomingAssessments'"],
  ["from '../components/student/PendingAssignments'", "from '../modules/student/components/PendingAssignments'"],
  ["from '../components/student/AttendancePage'", "from '../modules/student/components/AttendancePage'"],
  ["from '../components/student/FeeManagementPage'", "from '../modules/student/components/FeeManagementPage'"],
  ["from '../components/student/NotificationsPanel'", "from '../modules/student/components/NotificationsPanel'"],
  ["from '../pages/student/StudentGrades'", "from '../modules/student/pages/StudentGrades'"],
  ["from '../pages/student/StudentSettings'", "from '../modules/student/pages/StudentSettings'"],
  ["from '../pages/student/StudentMaterials'", "from '../modules/student/pages/StudentMaterials'"],
  ["from '../pages/student/StudentTimetable'", "from '../modules/student/pages/StudentTimetable'"],
  ["from '../pages/student/StudentLibrary'", "from '../modules/student/pages/StudentLibrary'"],
  ["from '../pages/student/StudentEvents'", "from '../modules/student/pages/StudentEvents'"],
  ["from '../pages/student/StudentNotificationsPage'", "from '../modules/student/pages/StudentNotificationsPage'"],
  ["from '../pages/student/StudentTestDashboard'", "from '../modules/student/pages/StudentTestDashboard'"],
  ["from '../pages/student/TestInstructionsPage'", "from '../modules/student/pages/TestInstructionsPage'"],
  ["from '../pages/student/ActiveTestPage'", "from '../modules/student/pages/ActiveTestPage'"],
  ["from '../pages/student/TestResultPage'", "from '../modules/student/pages/TestResultPage'"],

  ["from '../pages/superadmin/SuperAdminDashboard'", "from '../modules/superadmin/pages/SuperAdminDashboard'"],
  ["from '../pages/superadmin/SuperAdminColleges'", "from '../modules/superadmin/pages/SuperAdminColleges'"],
  ["from '../pages/superadmin/SuperAdminAdmins'", "from '../modules/superadmin/pages/SuperAdminAdmins'"],
  ["from '../pages/superadmin/SuperAdminStudents'", "from '../modules/superadmin/pages/SuperAdminStudents'"],
  ["from '../pages/superadmin/CreateCollege'", "from '../modules/superadmin/pages/CreateCollege'"],
  ["from '../pages/superadmin/SuperAdminFaculty'", "from '../modules/superadmin/pages/SuperAdminFaculty'"],
  ["from '../pages/superadmin/SuperAdminFacultyDetail'", "from '../modules/superadmin/pages/SuperAdminFacultyDetail'"],
  ["from '../pages/superadmin/CreateCollegeAdmin'", "from '../modules/superadmin/pages/CreateCollegeAdmin'"],
  ["from '../pages/superadmin/UserImport'", "from '../modules/superadmin/pages/UserImport'"],
  ["from '../pages/superadmin/SuperAdminCollegeDetail'", "from '../modules/superadmin/pages/SuperAdminCollegeDetail'"],
  ["from '../pages/superadmin/SuperAdminUniversities'", "from '../modules/superadmin/pages/SuperAdminUniversities'"],
  ["from '../pages/superadmin/SuperAdminUniversityDetail'", "from '../modules/superadmin/pages/SuperAdminUniversityDetail'"],
  ["from '../pages/superadmin/SuperAdminCurriculum'", "from '../modules/superadmin/pages/SuperAdminCurriculum'"],
  ["from '../pages/superadmin/MultiCollegeComparison'", "from '../modules/superadmin/pages/MultiCollegeComparison'"],
  ["from '../pages/superadmin/SubscriptionBilling'", "from '../modules/superadmin/pages/SubscriptionBilling'"],
  ["from '../pages/superadmin/SystemHealthMonitor'", "from '../modules/superadmin/pages/SystemHealthMonitor'"],

  // --- SUPERADMIN PAGES: self-referencing fix ---
  ["from '../../modules/superadmin/types/superAdmin'", "from '../types/superAdmin'"],
  ["from '../../modules/superadmin/hooks/useSuperAdmin'", "from '../hooks/useSuperAdmin'"],
  ["from '../../modules/superadmin/api/superAdminApi'", "from '../api/superAdminApi'"],
  ["from '../../modules/superadmin/components/SyllabusUploader'", "from '../components/SyllabusUploader'"],
  ["from '../../modules/superadmin/components/CurriculumReviewTable'", "from '../components/CurriculumReviewTable'"],
  ["from '../../../superadmin/types/curriculum'", "from '../types/curriculum'"],

  // --- PROVIDERS ---
  ["from '../../providers/NotificationProvider'", "from '../../shared/providers/NotificationProvider'"],
  ["from '../providers/NotificationProvider'", "from '../shared/providers/NotificationProvider'"],

  // --- SHARED CROSS-REFERENCES ---
  ["from '../hooks/useGreeting'", "from '../../admin/hooks/useGreeting'"],
  ["from '../contexts/AuthContext'", "from '../../auth/context/AuthContext'"],
  ["from '../hooks/useAuth'", "from '../../auth/hooks/useAuth'"],
  ["from '../types/university'", "from '../../superadmin/types/university'"],
  ["from '../hooks/useDashboardData'", "from '../../admin/hooks/useDashboardData'"],
  ["from '../types/questionBank'", "from '../../admin/types/questionBank'"],
  ["from '../types/universalQuestionBank'", "from '../../admin/types/universalQuestionBank'"],

  // --- APP.TSX ---
  ["from './contexts/AuthContext'", "from './modules/auth/context/AuthContext'"],
  ["from './contexts/ThemeProvider'", "from './shared/contexts/ThemeProvider'"],
  ["from './providers/NotificationProvider'", "from './shared/providers/NotificationProvider'"],
  ["from './components/Layout'", "from './shared/components/Layout'"],
  ["from './components/ErrorBoundary'", "from './shared/components/ErrorBoundary'"],
  ["from './components/Toast'", "from './shared/components/Toast'"],

  // --- MAIN.TSX ---
  ["from './contexts/AuthContext'", "from './modules/auth/context/AuthContext'"],
  ["from './contexts/ThemeProvider'", "from './shared/contexts/ThemeProvider'"],
  ["from './providers/NotificationProvider'", "from './shared/providers/NotificationProvider'"],

  // --- ROUTES/COMPONENTS.TSX ---
  ["from '../components/Layout'", "from '../shared/components/Layout'"],

  // --- SHARED COMPONENTS ---
  ["from '../components/Layout'", "from './Layout'"],
  ["from '../components/Header'", "from './Header'"],
  ["from '../components/Sidebar'", "from './Sidebar'"],
  ["from '../components/Toast'", "from './Toast'"],

  // --- SHARED API ---
  ["from './questionBankApi'", "from '../../admin/api/questionBankApi'"],

  // --- SUPERADMIN SERVICES ---
  ["from '../../api/universityApi'", "from '../api/universityApi'"],

  // --- SUPERADMIN PAGES: other cross-references ---
  ["from '../../hooks/useSyllabusCurriculum'", "from '../hooks/useSyllabusCurriculum'"],
  ["from '../../hooks/useUniversities'", "from '../hooks/useUniversities'"],
  ["from '../../types/university'", "from '../types/university'"],
  ["from '../../data/karnatakaUniversities'", "from '../data/karnatakaUniversities'"],
  ["from '../../utils/parseCSV'", "from '../../shared/utils/parseCSV'"],

  // --- LAZY IMPORTS (inside import() calls) ---
  ["import('../pages/Students')", "import('../modules/student/pages/Students')"],
  ["import('../pages/View360')", "import('../modules/admin/pages/View360')"],
  ["import('../pages/Attendance')", "import('../modules/faculty/pages/Attendance')"],
  ["import('../pages/Assessments')", "import('../modules/admin/pages/Assessments')"],
  ["import('../pages/Settings')", "import('../modules/admin/pages/Settings')"],
  ["import('../pages/AdminDashboard')", "import('../modules/admin/pages/AdminDashboard')"],
  ["import('../pages/AdminClassSchedule')", "import('../modules/admin/pages/AdminClassSchedule')"],
  ["import('../pages/AdminFeeManagement')", "import('../modules/admin/pages/AdminFeeManagement')"],
  ["import('../pages/AdminCurriculum')", "import('../modules/admin/pages/AdminCurriculum')"],
  ["import('../pages/HODDashboard')", "import('../modules/admin/pages/HODDashboard')"],
  ["import('../pages/QuestionBank')", "import('../modules/admin/pages/QuestionBank')"],
  ["import('../components/question-bank/FacultyBankAdmin')", "import('../modules/admin/components/question-bank/FacultyBankAdmin')"],
  ["import('../pages/PaperGeneratorAdmin')", "import('../modules/admin/pages/PaperGeneratorAdmin')"],
  ["import('../pages/Analytics')", "import('../modules/admin/pages/Analytics')"],
  ["import('../pages/Journey')", "import('../modules/admin/pages/Journey')"],

  ["import('../pages/faculty/FacultyDashboard')", "import('../modules/faculty/pages/FacultyDashboard')"],
  ["import('../pages/faculty/FacultyAttendance')", "import('../modules/faculty/pages/FacultyAttendance')"],
  ["import('../pages/faculty/FacultyTopics')", "import('../modules/faculty/pages/FacultyTopics')"],
  ["import('../pages/faculty/FacultyPapers')", "import('../modules/faculty/pages/FacultyPapers')"],
  ["import('../pages/faculty/FacultyQuestionBank')", "import('../modules/faculty/pages/FacultyQuestionBank')"],
  ["import('../pages/faculty/FacultyPaperGenerator')", "import('../modules/faculty/pages/FacultyPaperGenerator')"],
  ["import('../pages/faculty/FacultyStudentAnalysis')", "import('../modules/faculty/pages/FacultyStudentAnalysis')"],
  ["import('../pages/faculty/FacultyReschedule')", "import('../modules/faculty/pages/FacultyReschedule')"],
  ["import('../pages/faculty/FacultyUploadMaterial')", "import('../modules/faculty/pages/FacultyUploadMaterial')"],
  ["import('../pages/faculty/FacultyLibrary')", "import('../modules/faculty/pages/FacultyLibrary')"],
  ["import('../pages/faculty/FacultyAnnouncements')", "import('../modules/faculty/pages/FacultyAnnouncements')"],
  ["import('../pages/faculty/FacultyAssignments')", "import('../modules/faculty/pages/FacultyAssignments')"],
  ["import('../pages/faculty/FacultyCalendar')", "import('../modules/faculty/pages/FacultyCalendar')"],
  ["import('../pages/faculty/FacultyCurriculum')", "import('../modules/faculty/pages/FacultyCurriculum')"],
  ["import('../components/FacultyAttendanceMarking')", "import('../modules/faculty/components/FacultyAttendanceMarking')"],
  ["import('../components/question-bank/AIQuestionGenerator')", "import('../modules/admin/components/question-bank/AIQuestionGenerator')"],

  ["import('../components/student/StudentSidebar')", "import('../modules/student/components/StudentSidebar')"],
  ["import('../pages/StudentDashboard')", "import('../modules/student/pages/StudentDashboard')"],
  ["import('../components/student/SchedulingPage')", "import('../modules/student/components/SchedulingPage')"],
  ["import('../components/student/UpcomingAssessments')", "import('../modules/student/components/UpcomingAssessments')"],
  ["import('../components/student/PendingAssignments')", "import('../modules/student/components/PendingAssignments')"],
  ["import('../components/student/AttendancePage')", "import('../modules/student/components/AttendancePage')"],
  ["import('../components/student/FeeManagementPage')", "import('../modules/student/components/FeeManagementPage')"],
  ["import('../components/student/NotificationsPanel')", "import('../modules/student/components/NotificationsPanel')"],
  ["import('../pages/student/StudentGrades')", "import('../modules/student/pages/StudentGrades')"],
  ["import('../pages/student/StudentSettings')", "import('../modules/student/pages/StudentSettings')"],
  ["import('../pages/student/StudentMaterials')", "import('../modules/student/pages/StudentMaterials')"],
  ["import('../pages/student/StudentTimetable')", "import('../modules/student/pages/StudentTimetable')"],
  ["import('../pages/student/StudentLibrary')", "import('../modules/student/pages/StudentLibrary')"],
  ["import('../pages/student/StudentEvents')", "import('../modules/student/pages/StudentEvents')"],
  ["import('../pages/student/StudentNotificationsPage')", "import('../modules/student/pages/StudentNotificationsPage')"],
  ["import('../pages/student/StudentTestDashboard')", "import('../modules/student/pages/StudentTestDashboard')"],
  ["import('../pages/student/TestInstructionsPage')", "import('../modules/student/pages/TestInstructionsPage')"],
  ["import('../pages/student/ActiveTestPage')", "import('../modules/student/pages/ActiveTestPage')"],
  ["import('../pages/student/TestResultPage')", "import('../modules/student/pages/TestResultPage')"],

  ["import('../pages/superadmin/SuperAdminDashboard')", "import('../modules/superadmin/pages/SuperAdminDashboard')"],
  ["import('../pages/superadmin/SuperAdminColleges')", "import('../modules/superadmin/pages/SuperAdminColleges')"],
  ["import('../pages/superadmin/SuperAdminAdmins')", "import('../modules/superadmin/pages/SuperAdminAdmins')"],
  ["import('../pages/superadmin/SuperAdminStudents')", "import('../modules/superadmin/pages/SuperAdminStudents')"],
  ["import('../pages/superadmin/CreateCollege')", "import('../modules/superadmin/pages/CreateCollege')"],
  ["import('../pages/superadmin/SuperAdminFaculty')", "import('../modules/superadmin/pages/SuperAdminFaculty')"],
  ["import('../pages/superadmin/SuperAdminFacultyDetail')", "import('../modules/superadmin/pages/SuperAdminFacultyDetail')"],
  ["import('../pages/superadmin/CreateCollegeAdmin')", "import('../modules/superadmin/pages/CreateCollegeAdmin')"],
  ["import('../pages/superadmin/UserImport')", "import('../modules/superadmin/pages/UserImport')"],
  ["import('../pages/superadmin/SuperAdminCollegeDetail')", "import('../modules/superadmin/pages/SuperAdminCollegeDetail')"],
  ["import('../pages/superadmin/SuperAdminUniversities')", "import('../modules/superadmin/pages/SuperAdminUniversities')"],
  ["import('../pages/superadmin/SuperAdminUniversityDetail')", "import('../modules/superadmin/pages/SuperAdminUniversityDetail')"],
  ["import('../pages/superadmin/SuperAdminCurriculum')", "import('../modules/superadmin/pages/SuperAdminCurriculum')"],
  ["import('../pages/superadmin/MultiCollegeComparison')", "import('../modules/superadmin/pages/MultiCollegeComparison')"],
  ["import('../pages/superadmin/SubscriptionBilling')", "import('../modules/superadmin/pages/SubscriptionBilling')"],
  ["import('../pages/superadmin/SystemHealthMonitor')", "import('../modules/superadmin/pages/SystemHealthMonitor')"],
];

// ==========================================
// FILE-SPECIFIC FIXES (applied only to matching files)
// Key: glob pattern or substring match
// Value: array of [search, replace]
// ==========================================
const FILE_SPECIFIC_FIXES = {
  // Files in src/shared/ that need Firebase path fixed from ../Firebase to ../../Firebase
  'src/shared/': [
    ["from '../../Firebase/config'", "from '../../../Firebase/config'"],
    ["from '../../Firebase/config'", "from '../../../Firebase/config'"],
  ],
  // Files in src/modules/*/pages/ that need Firebase path fixed from ../../Firebase to ../../../Firebase
  'src/modules/': [
    ["from '../../../Firebase/config'", "from '../../../../Firebase/config'"],
  ],
  // Files in src/modules/*/components/ that need Firebase path fixed from ../../Firebase to ../../../Firebase
  'src/modules/': [
    ["from '../../../Firebase/config'", "from '../../../../Firebase/config'"],
  ],
  // Files in src/modules/*/api/ that need Firebase path fixed from ../Firebase to ../../Firebase
  'src/modules/admin/api/': [
    ["from '../../Firebase/config'", "from '../../../Firebase/config'"],
  ],
  'src/modules/faculty/api/': [
    ["from '../../Firebase/config'", "from '../../../Firebase/config'"],
  ],
  'src/modules/superadmin/api/': [
    ["from '../../Firebase/config'", "from '../../../Firebase/config'"],
  ],
  // StatusBadge.tsx specific fix
  'src/shared/components/StatusBadge.tsx': [
    ["from '../types'", "from '../../faculty/types/attendance'"],
  ],
};

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

console.log('🔧 Fixing imports across all source files...\n');

let fixedFiles = 0;
let totalChanges = 0;

walk('src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileChanges = 0;
  const relPath = filePath.replace(/\\/g, '/');

  // Apply global fixes
  for (const [search, replace] of GLOBAL_FIXES) {
    let idx = content.indexOf(search);
    while (idx !== -1) {
      content = content.substring(0, idx) + replace + content.substring(idx + search.length);
      fileChanges++;
      idx = content.indexOf(search, idx + replace.length);
    }
  }

  // Apply file-specific fixes
  for (const [pattern, fixes] of Object.entries(FILE_SPECIFIC_FIXES)) {
    if (relPath.includes(pattern.replace('src/', 'src\'))) {
      for (const [search, replace] of fixes) {
        let idx = content.indexOf(search);
        while (idx !== -1) {
          content = content.substring(0, idx) + replace + content.substring(idx + search.length);
          fileChanges++;
          idx = content.indexOf(search, idx + replace.length);
        }
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    fixedFiles++;
    totalChanges += fileChanges;
    console.log(`  ✓ ${filePath} (${fileChanges} fixes)`);
  }
});

console.log(`\n✅ Fixed ${totalChanges} imports across ${fixedFiles} files.`);
console.log('🔍 Run `npx tsc --noEmit` to verify.');