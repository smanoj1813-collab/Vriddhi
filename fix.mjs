import fs from 'fs';
import path from 'path';

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

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

console.log('Fixing imports...\n');

let fixedFiles = 0;
let totalChanges = 0;

walk('src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  let changes = 0;

  // Helper to count and replace
  const rep = (from, to) => {
    const before = content;
    content = content.split(from).join(to);
    const count = (before.length - content.length) / (from.length - to.length);
    if (count > 0) changes += count;
  };

  // ===== ROUTE FILES =====
  rep("from '../pages/Students'", "from '../modules/student/pages/Students'");
  rep("from '../pages/View360'", "from '../pages/View360'");
  rep("from '../pages/Attendance'", "from '../modules/faculty/pages/Attendance'");
  rep("from '../pages/Assessments'", "from '../pages/Assessments'");
  rep("from '../pages/Settings'", "from '../pages/Settings'");
  rep("from '../pages/AdminDashboard'", "from '../pages/AdminDashboard'");
  rep("from '../pages/AdminClassSchedule'", "from '../pages/AdminClassSchedule'");
  rep("from '../pages/AdminFeeManagement'", "from '../pages/AdminFeeManagement'");
  rep("from '../pages/AdminCurriculum'", "from '../pages/AdminCurriculum'");
  rep("from '../pages/HODDashboard'", "from '../pages/HODDashboard'");
  rep("from '../pages/QuestionBank'", "from '../pages/QuestionBank'");
  rep("from '../components/question-bank/FacultyBankAdmin'", "from '../components/question-bank/FacultyBankAdmin'");
  rep("from '../pages/PaperGeneratorAdmin'", "from '../pages/PaperGeneratorAdmin'");
  rep("from '../pages/Analytics'", "from '../pages/Analytics'");
  rep("from '../pages/Journey'", "from '../pages/Journey'");

  rep("from '../pages/faculty/FacultyDashboard'", "from '../modules/faculty/pages/FacultyDashboard'");
  rep("from '../pages/faculty/FacultyAttendance'", "from '../modules/faculty/pages/FacultyAttendance'");
  rep("from '../pages/faculty/FacultyTopics'", "from '../modules/faculty/pages/FacultyTopics'");
  rep("from '../pages/faculty/FacultyPapers'", "from '../modules/faculty/pages/FacultyPapers'");
  rep("from '../pages/faculty/FacultyQuestionBank'", "from '../modules/faculty/pages/FacultyQuestionBank'");
  rep("from '../pages/faculty/FacultyPaperGenerator'", "from '../modules/faculty/pages/FacultyPaperGenerator'");
  rep("from '../pages/faculty/FacultyStudentAnalysis'", "from '../modules/faculty/pages/FacultyStudentAnalysis'");
  rep("from '../pages/faculty/FacultyReschedule'", "from '../modules/faculty/pages/FacultyReschedule'");
  rep("from '../pages/faculty/FacultyUploadMaterial'", "from '../modules/faculty/pages/FacultyUploadMaterial'");
  rep("from '../pages/faculty/FacultyLibrary'", "from '../modules/faculty/pages/FacultyLibrary'");
  rep("from '../pages/faculty/FacultyAnnouncements'", "from '../modules/faculty/pages/FacultyAnnouncements'");
  rep("from '../pages/faculty/FacultyAssignments'", "from '../modules/faculty/pages/FacultyAssignments'");
  rep("from '../pages/faculty/FacultyCalendar'", "from '../modules/faculty/pages/FacultyCalendar'");
  rep("from '../pages/faculty/FacultyCurriculum'", "from '../modules/faculty/pages/FacultyCurriculum'");
  rep("from '../components/FacultyAttendanceMarking'", "from '../modules/faculty/components/FacultyAttendanceMarking'");
  rep("from '../components/question-bank/AIQuestionGenerator'", "from '../components/question-bank/AIQuestionGenerator'");

  rep("from '../components/student/StudentSidebar'", "from '../modules/student/components/StudentSidebar'");
  rep("from '../pages/StudentDashboard'", "from '../modules/student/pages/StudentDashboard'");
  rep("from '../components/student/SchedulingPage'", "from '../modules/student/components/SchedulingPage'");
  rep("from '../components/student/UpcomingAssessments'", "from '../modules/student/components/UpcomingAssessments'");
  rep("from '../components/student/PendingAssignments'", "from '../modules/student/components/PendingAssignments'");
  rep("from '../components/student/AttendancePage'", "from '../modules/student/components/AttendancePage'");
  rep("from '../components/student/FeeManagementPage'", "from '../modules/student/components/FeeManagementPage'");
  rep("from '../components/student/NotificationsPanel'", "from '../modules/student/components/NotificationsPanel'");
  rep("from '../pages/student/StudentGrades'", "from '../modules/student/pages/StudentGrades'");
  rep("from '../pages/student/StudentSettings'", "from '../modules/student/pages/StudentSettings'");
  rep("from '../pages/student/StudentMaterials'", "from '../modules/student/pages/StudentMaterials'");
  rep("from '../pages/student/StudentTimetable'", "from '../modules/student/pages/StudentTimetable'");
  rep("from '../pages/student/StudentLibrary'", "from '../modules/student/pages/StudentLibrary'");
  rep("from '../pages/student/StudentEvents'", "from '../modules/student/pages/StudentEvents'");
  rep("from '../pages/student/StudentNotificationsPage'", "from '../modules/student/pages/StudentNotificationsPage'");
  rep("from '../pages/student/StudentTestDashboard'", "from '../modules/student/pages/StudentTestDashboard'");
  rep("from '../pages/student/TestInstructionsPage'", "from '../modules/student/pages/TestInstructionsPage'");
  rep("from '../pages/student/ActiveTestPage'", "from '../modules/student/pages/ActiveTestPage'");
  rep("from '../pages/student/TestResultPage'", "from '../modules/student/pages/TestResultPage'");

  rep("from '../pages/superadmin/SuperAdminDashboard'", "from '../modules/superadmin/pages/SuperAdminDashboard'");
  rep("from '../pages/superadmin/SuperAdminColleges'", "from '../modules/superadmin/pages/SuperAdminColleges'");
  rep("from '../pages/superadmin/SuperAdminAdmins'", "from '../modules/superadmin/pages/SuperAdminAdmins'");
  rep("from '../pages/superadmin/SuperAdminStudents'", "from '../modules/superadmin/pages/SuperAdminStudents'");
  rep("from '../pages/superadmin/CreateCollege'", "from '../modules/superadmin/pages/CreateCollege'");
  rep("from '../pages/superadmin/SuperAdminFaculty'", "from '../modules/superadmin/pages/SuperAdminFaculty'");
  rep("from '../pages/superadmin/SuperAdminFacultyDetail'", "from '../modules/superadmin/pages/SuperAdminFacultyDetail'");
  rep("from '../pages/superadmin/CreateCollegeAdmin'", "from '../modules/superadmin/pages/CreateCollegeAdmin'");
  rep("from '../pages/superadmin/UserImport'", "from '../modules/superadmin/pages/UserImport'");
  rep("from '../pages/superadmin/SuperAdminCollegeDetail'", "from '../modules/superadmin/pages/SuperAdminCollegeDetail'");
  rep("from '../pages/superadmin/SuperAdminUniversities'", "from '../modules/superadmin/pages/SuperAdminUniversities'");
  rep("from '../pages/superadmin/SuperAdminUniversityDetail'", "from '../modules/superadmin/pages/SuperAdminUniversityDetail'");
  rep("from '../pages/superadmin/SuperAdminCurriculum'", "from '../modules/superadmin/pages/SuperAdminCurriculum'");
  rep("from '../pages/superadmin/MultiCollegeComparison'", "from '../modules/superadmin/pages/MultiCollegeComparison'");
  rep("from '../pages/superadmin/SubscriptionBilling'", "from '../modules/superadmin/pages/SubscriptionBilling'");
  rep("from '../pages/superadmin/SystemHealthMonitor'", "from '../modules/superadmin/pages/SystemHealthMonitor'");

  // Lazy imports
  rep("import('../pages/Students')", "import('../modules/student/pages/Students')");
  rep("import('../pages/View360')", "import('../modules/admin/pages/View360')");
  rep("import('../pages/Attendance')", "import('../modules/faculty/pages/Attendance')");
  rep("import('../pages/Assessments')", "import('../modules/admin/pages/Assessments')");
  rep("import('../pages/Settings')", "import('../modules/admin/pages/Settings')");
  rep("import('../pages/AdminDashboard')", "import('../modules/admin/pages/AdminDashboard')");
  rep("import('../pages/AdminClassSchedule')", "import('../modules/admin/pages/AdminClassSchedule')");
  rep("import('../pages/AdminFeeManagement')", "import('../modules/admin/pages/AdminFeeManagement')");
  rep("import('../pages/AdminCurriculum')", "import('../modules/admin/pages/AdminCurriculum')");
  rep("import('../pages/HODDashboard')", "import('../modules/admin/pages/HODDashboard')");
  rep("import('../pages/QuestionBank')", "import('../modules/admin/pages/QuestionBank')");
  rep("import('../components/question-bank/FacultyBankAdmin')", "import('../modules/admin/components/question-bank/FacultyBankAdmin')");
  rep("import('../pages/PaperGeneratorAdmin')", "import('../modules/admin/pages/PaperGeneratorAdmin')");
  rep("import('../pages/Analytics')", "import('../modules/admin/pages/Analytics')");
  rep("import('../pages/Journey')", "import('../modules/admin/pages/Journey')");

  rep("import('../pages/faculty/FacultyDashboard')", "import('../modules/faculty/pages/FacultyDashboard')");
  rep("import('../pages/faculty/FacultyAttendance')", "import('../modules/faculty/pages/FacultyAttendance')");
  rep("import('../pages/faculty/FacultyTopics')", "import('../modules/faculty/pages/FacultyTopics')");
  rep("import('../pages/faculty/FacultyPapers')", "import('../modules/faculty/pages/FacultyPapers')");
  rep("import('../pages/faculty/FacultyQuestionBank')", "import('../modules/faculty/pages/FacultyQuestionBank')");
  rep("import('../pages/faculty/FacultyPaperGenerator')", "import('../modules/faculty/pages/FacultyPaperGenerator')");
  rep("import('../pages/faculty/FacultyStudentAnalysis')", "import('../modules/faculty/pages/FacultyStudentAnalysis')");
  rep("import('../pages/faculty/FacultyReschedule')", "import('../modules/faculty/pages/FacultyReschedule')");
  rep("import('../pages/faculty/FacultyUploadMaterial')", "import('../modules/faculty/pages/FacultyUploadMaterial')");
  rep("import('../pages/faculty/FacultyLibrary')", "import('../modules/faculty/pages/FacultyLibrary')");
  rep("import('../pages/faculty/FacultyAnnouncements')", "import('../modules/faculty/pages/FacultyAnnouncements')");
  rep("import('../pages/faculty/FacultyAssignments')", "import('../modules/faculty/pages/FacultyAssignments')");
  rep("import('../pages/faculty/FacultyCalendar')", "import('../modules/faculty/pages/FacultyCalendar')");
  rep("import('../pages/faculty/FacultyCurriculum')", "import('../modules/faculty/pages/FacultyCurriculum')");
  rep("import('../components/FacultyAttendanceMarking')", "import('../modules/faculty/components/FacultyAttendanceMarking')");
  rep("import('../components/question-bank/AIQuestionGenerator')", "import('../modules/admin/components/question-bank/AIQuestionGenerator')");

  rep("import('../components/student/StudentSidebar')", "import('../modules/student/components/StudentSidebar')");
  rep("import('../pages/StudentDashboard')", "import('../modules/student/pages/StudentDashboard')");
  rep("import('../components/student/SchedulingPage')", "import('../modules/student/components/SchedulingPage')");
  rep("import('../components/student/UpcomingAssessments')", "import('../modules/student/components/UpcomingAssessments')");
  rep("import('../components/student/PendingAssignments')", "import('../modules/student/components/PendingAssignments')");
  rep("import('../components/student/AttendancePage')", "import('../modules/student/components/AttendancePage')");
  rep("import('../components/student/FeeManagementPage')", "import('../modules/student/components/FeeManagementPage')");
  rep("import('../components/student/NotificationsPanel')", "import('../modules/student/components/NotificationsPanel')");
  rep("import('../pages/student/StudentGrades')", "import('../modules/student/pages/StudentGrades')");
  rep("import('../pages/student/StudentSettings')", "import('../modules/student/pages/StudentSettings')");
  rep("import('../pages/student/StudentMaterials')", "import('../modules/student/pages/StudentMaterials')");
  rep("import('../pages/student/StudentTimetable')", "import('../modules/student/pages/StudentTimetable')");
  rep("import('../pages/student/StudentLibrary')", "import('../modules/student/pages/StudentLibrary')");
  rep("import('../pages/student/StudentEvents')", "import('../modules/student/pages/StudentEvents')");
  rep("import('../pages/student/StudentNotificationsPage')", "import('../modules/student/pages/StudentNotificationsPage')");
  rep("import('../pages/student/StudentTestDashboard')", "import('../modules/student/pages/StudentTestDashboard')");
  rep("import('../pages/student/TestInstructionsPage')", "import('../modules/student/pages/TestInstructionsPage')");
  rep("import('../pages/student/ActiveTestPage')", "import('../modules/student/pages/ActiveTestPage')");
  rep("import('../pages/student/TestResultPage')", "import('../modules/student/pages/TestResultPage')");

  rep("import('../pages/superadmin/SuperAdminDashboard')", "import('../modules/superadmin/pages/SuperAdminDashboard')");
  rep("import('../pages/superadmin/SuperAdminColleges')", "import('../modules/superadmin/pages/SuperAdminColleges')");
  rep("import('../pages/superadmin/SuperAdminAdmins')", "import('../modules/superadmin/pages/SuperAdminAdmins')");
  rep("import('../pages/superadmin/SuperAdminStudents')", "import('../modules/superadmin/pages/SuperAdminStudents')");
  rep("import('../pages/superadmin/CreateCollege')", "import('../modules/superadmin/pages/CreateCollege')");
  rep("import('../pages/superadmin/SuperAdminFaculty')", "import('../modules/superadmin/pages/SuperAdminFaculty')");
  rep("import('../pages/superadmin/SuperAdminFacultyDetail')", "import('../modules/superadmin/pages/SuperAdminFacultyDetail')");
  rep("import('../pages/superadmin/CreateCollegeAdmin')", "import('../modules/superadmin/pages/CreateCollegeAdmin')");
  rep("import('../pages/superadmin/UserImport')", "import('../modules/superadmin/pages/UserImport')");
  rep("import('../pages/superadmin/SuperAdminCollegeDetail')", "import('../modules/superadmin/pages/SuperAdminCollegeDetail')");
  rep("import('../pages/superadmin/SuperAdminUniversities')", "import('../modules/superadmin/pages/SuperAdminUniversities')");
  rep("import('../pages/superadmin/SuperAdminUniversityDetail')", "import('../modules/superadmin/pages/SuperAdminUniversityDetail')");
  rep("import('../pages/superadmin/SuperAdminCurriculum')", "import('../modules/superadmin/pages/SuperAdminCurriculum')");
  rep("import('../pages/superadmin/MultiCollegeComparison')", "import('../modules/superadmin/pages/MultiCollegeComparison')");
  rep("import('../pages/superadmin/SubscriptionBilling')", "import('../modules/superadmin/pages/SubscriptionBilling')");
  rep("import('../pages/superadmin/SystemHealthMonitor')", "import('../modules/superadmin/pages/SystemHealthMonitor')");

  // ===== SUPERADMIN SELF-REFERENCES =====
  rep("from '../../modules/superadmin/types/superAdmin'", "from '../types/superAdmin'");
  rep("from '../../modules/superadmin/hooks/useSuperAdmin'", "from '../hooks/useSuperAdmin'");
  rep("from '../../modules/superadmin/api/superAdminApi'", "from '../api/superAdminApi'");
  rep("from '../../modules/superadmin/components/SyllabusUploader'", "from '../components/SyllabusUploader'");
  rep("from '../../modules/superadmin/components/CurriculumReviewTable'", "from '../components/CurriculumReviewTable'");
  rep("from '../../../superadmin/types/curriculum'", "from '../types/curriculum'");
  rep("from '../../hooks/useSyllabusCurriculum'", "from '../hooks/useSyllabusCurriculum'");
  rep("from '../../hooks/useUniversities'", "from '../hooks/useUniversities'");
  rep("from '../../types/university'", "from '../types/university'");
  rep("from '../../data/karnatakaUniversities'", "from '../data/karnatakaUniversities'");

  // ===== PROVIDERS =====
  rep("from '../../providers/NotificationProvider'", "from '../../shared/providers/NotificationProvider'");
  rep("from '../providers/NotificationProvider'", "from '../shared/providers/NotificationProvider'");

  // ===== SHARED CROSS-REFERENCES =====
  rep("from '../hooks/useGreeting'", "from '../../admin/hooks/useGreeting'");
  rep("from '../contexts/AuthContext'", "from '../../auth/context/AuthContext'");
  rep("from '../hooks/useAuth'", "from '../../auth/hooks/useAuth'");
  rep("from '../types/university'", "from '../../superadmin/types/university'");
  rep("from '../hooks/useDashboardData'", "from '../../admin/hooks/useDashboardData'");
  rep("from '../types/questionBank'", "from '../../admin/types/questionBank'");
  rep("from '../types/universalQuestionBank'", "from '../../admin/types/universalQuestionBank'");

  // ===== SHARED COMPONENTS =====
  rep("from '../components/Layout'", "from './Layout'");
  rep("from '../components/Header'", "from './Header'");
  rep("from '../components/Sidebar'", "from './Sidebar'");
  rep("from '../components/Toast'", "from './Toast'");

  // ===== APP.TSX =====
  rep("from './contexts/AuthContext'", "from './modules/auth/context/AuthContext'");
  rep("from './contexts/ThemeProvider'", "from './shared/contexts/ThemeProvider'");
  rep("from './providers/NotificationProvider'", "from './shared/providers/NotificationProvider'");
  rep("from './components/Layout'", "from './shared/components/Layout'");
  rep("from './components/ErrorBoundary'", "from './shared/components/ErrorBoundary'");
  rep("from './components/Toast'", "from './shared/components/Toast'");

  // ===== MAIN.TSX =====
  rep("from './contexts/AuthContext'", "from './modules/auth/context/AuthContext'");
  rep("from './contexts/ThemeProvider'", "from './shared/contexts/ThemeProvider'");
  rep("from './providers/NotificationProvider'", "from './shared/providers/NotificationProvider'");

  // ===== ROUTES/COMPONENTS.TSX =====
  rep("from '../components/Layout'", "from '../shared/components/Layout'");

  // ===== SHARED API =====
  rep("from './questionBankApi'", "from '../../admin/api/questionBankApi'");

  // ===== SUPERADMIN SERVICES =====
  rep("from '../../api/universityApi'", "from '../api/universityApi'");

  // ===== SUPERADMIN PAGES: utils =====
  rep("from '../../utils/parseCSV'", "from '../../shared/utils/parseCSV'");

  // ===== FIREBASE (file-specific logic below) =====
  // We handle Firebase with path depth check
  const relPath = filePath.replace(/\\/g, '/');
  const depth = relPath.split('/').length - 1; // relative to src/

  if (relPath.startsWith('src/shared/')) {
    rep("from '../../Firebase/config'", "from '../../../Firebase/config'");
  }
  if (relPath.startsWith('src/modules/') && (relPath.includes('/pages/') || relPath.includes('/components/'))) {
    rep("from '../../../Firebase/config'", "from '../../../../Firebase/config'");
  }
  if (relPath.startsWith('src/modules/') && relPath.includes('/api/')) {
    rep("from '../../Firebase/config'", "from '../../../Firebase/config'");
  }
  if (relPath.startsWith('src/modules/') && relPath.includes('/services/')) {
    rep("from '../../../Firebase/config'", "from '../../../../Firebase/config'");
  }

  // ===== STATUS BADGE =====
  if (relPath.includes('StatusBadge.tsx')) {
    rep("from '../types'", "from '../../faculty/types/attendance'");
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    fixedFiles++;
    totalChanges += changes;
    console.log(`  ${filePath} (${changes} fixes)`);
  }
});

console.log(`\nDone! Fixed ${totalChanges} imports across ${fixedFiles} files.`);
console.log('Run: npx tsc --noEmit');