import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// COMPLETE FILE REORGANIZATION MAP
// Format: [oldPath, newPath] relative to project root
// Files already moved by previous script will be skipped
// ==========================================
const MOVES = [
  // --- AUTH MODULE ---
  ['src/contexts/AuthContext.tsx', 'src/modules/auth/context/AuthContext.tsx'],
  ['src/pages/Login.tsx', 'src/modules/auth/pages/Login.tsx'],
  ['src/pages/StudentLogin.tsx', 'src/modules/auth/pages/StudentLogin.tsx'],
  ['src/pages/Unauthorized.tsx', 'src/modules/auth/pages/Unauthorized.tsx'],
  ['src/hooks/useAuth.ts', 'src/modules/auth/hooks/useAuth.ts'],
  // Guards already moved by previous script, but include for import fixing
  ['src/components/ProtectedRoute.tsx', 'src/modules/auth/guards/ProtectedRoute.tsx'],
  ['src/components/RoleGuard.tsx', 'src/modules/auth/guards/RoleGuard.tsx'],

  // --- STUDENT MODULE ---
  ['src/components/student/AssignmentSubmissionPage.tsx', 'src/modules/student/components/AssignmentSubmissionPage.tsx'],
  ['src/components/student/AssignmentUploadModal.tsx', 'src/modules/student/components/AssignmentUploadModal.tsx'],
  ['src/components/student/AttendancePage.tsx', 'src/modules/student/components/AttendancePage.tsx'],
  ['src/components/student/FeeDueCard.tsx', 'src/modules/student/components/FeeDueCard.tsx'],
  ['src/components/student/FeeManagementPage.tsx', 'src/modules/student/components/FeeManagementPage.tsx'],
  ['src/components/student/NotificationsPanel.tsx', 'src/modules/student/components/NotificationsPanel.tsx'],
  ['src/components/student/PendingAssignments.tsx', 'src/modules/student/components/PendingAssignments.tsx'],
  ['src/components/student/SchedulingPage.tsx', 'src/modules/student/components/SchedulingPage.tsx'],
  ['src/components/student/StudentAssessmentPortal.tsx', 'src/modules/student/components/StudentAssessmentPortal.tsx'],
  ['src/components/student/StudentSidebar.tsx', 'src/modules/student/components/StudentSidebar.tsx'],
  ['src/components/student/TestInterface.tsx', 'src/modules/student/components/TestInterface.tsx'],
  ['src/components/student/TestResults.tsx', 'src/modules/student/components/TestResults.tsx'],
  ['src/components/student/TestResultView.tsx', 'src/modules/student/components/TestResultView.tsx'],
  ['src/components/student/TestTaking.tsx', 'src/modules/student/components/TestTaking.tsx'],
  ['src/components/student/UpcomingAssessments.tsx', 'src/modules/student/components/UpcomingAssessments.tsx'],
  ['src/components/student/UpcomingClasses.tsx', 'src/modules/student/components/UpcomingClasses.tsx'],
  ['src/components/student/shared/PageHeader.tsx', 'src/modules/student/components/shared/PageHeader.tsx'],
  ['src/components/student/shared/StatusBadge.tsx', 'src/modules/student/components/shared/StatusBadge.tsx'],
  ['src/components/student/StatsCards.tsx', 'src/modules/student/components/StatsCards.tsx'],
  ['src/components/StudentAvatar.tsx', 'src/modules/student/components/StudentAvatar.tsx'],
  ['src/pages/student/ActiveTestPage.tsx', 'src/modules/student/pages/ActiveTestPage.tsx'],
  ['src/pages/student/StudentEvents.tsx', 'src/modules/student/pages/StudentEvents.tsx'],
  ['src/pages/student/StudentGrades.tsx', 'src/modules/student/pages/StudentGrades.tsx'],
  ['src/pages/student/StudentLibrary.tsx', 'src/modules/student/pages/StudentLibrary.tsx'],
  ['src/pages/student/StudentMaterials.tsx', 'src/modules/student/pages/StudentMaterials.tsx'],
  ['src/pages/student/StudentNotificationsPage.tsx', 'src/modules/student/pages/StudentNotificationsPage.tsx'],
  ['src/pages/student/StudentSettings.tsx', 'src/modules/student/pages/StudentSettings.tsx'],
  ['src/pages/student/StudentTestDashboard.tsx', 'src/modules/student/pages/StudentTestDashboard.tsx'],
  ['src/pages/student/StudentTimetable.tsx', 'src/modules/student/pages/StudentTimetable.tsx'],
  ['src/pages/student/TestInstructionsPage.tsx', 'src/modules/student/pages/TestInstructionsPage.tsx'],
  ['src/pages/student/TestResultPage.tsx', 'src/modules/student/pages/TestResultPage.tsx'],
  ['src/pages/StudentDashboard.tsx', 'src/modules/student/pages/StudentDashboard.tsx'],
  ['src/pages/StudentFeePortal.tsx', 'src/modules/student/pages/StudentFeePortal.tsx'],
  ['src/pages/Students.tsx', 'src/modules/student/pages/Students.tsx'],
  ['src/hooks/useStudentData.ts', 'src/modules/student/hooks/useStudentData.ts'],
  ['src/hooks/useStudentSchedule.ts', 'src/modules/student/hooks/useStudentSchedule.ts'],
  ['src/hooks/useCollegeStudents.ts', 'src/modules/student/hooks/useCollegeStudents.ts'],
  ['src/hooks/StudentSidebarWrapper.tsx', 'src/modules/student/hooks/StudentSidebarWrapper.tsx'],

  // --- FACULTY MODULE ---
  ['src/components/faculty/PaperBuilder.tsx', 'src/modules/faculty/components/PaperBuilder.tsx'],
  ['src/components/faculty/QuestionManager.tsx', 'src/modules/faculty/components/QuestionManager.tsx'],
  ['src/components/faculty/TestScheduler.tsx', 'src/modules/faculty/components/TestScheduler.tsx'],
  ['src/components/AttendanceForm.tsx', 'src/modules/faculty/components/AttendanceForm.tsx'],
  ['src/components/AttendanceTable.tsx', 'src/modules/faculty/components/AttendanceTable.tsx'],
  ['src/components/FacultyAttendanceMarking.tsx', 'src/modules/faculty/components/FacultyAttendanceMarking.tsx'],
  ['src/components/ClassCard.tsx', 'src/modules/faculty/components/ClassCard.tsx'],
  ['src/components/shared/ExportButton.tsx', 'src/modules/faculty/components/ExportButton.tsx'],
  ['src/pages/faculty/FacultyAnnouncements.tsx', 'src/modules/faculty/pages/FacultyAnnouncements.tsx'],
  ['src/pages/faculty/FacultyAssignments.tsx', 'src/modules/faculty/pages/FacultyAssignments.tsx'],
  ['src/pages/faculty/FacultyAttendance.tsx', 'src/modules/faculty/pages/FacultyAttendance.tsx'],
  ['src/pages/faculty/FacultyCalendar.tsx', 'src/modules/faculty/pages/FacultyCalendar.tsx'],
  ['src/pages/faculty/FacultyCurriculum.tsx', 'src/modules/faculty/pages/FacultyCurriculum.tsx'],
  ['src/pages/faculty/FacultyDashboard.tsx', 'src/modules/faculty/pages/FacultyDashboard.tsx'],
  ['src/pages/faculty/FacultyLibrary.tsx', 'src/modules/faculty/pages/FacultyLibrary.tsx'],
  ['src/pages/faculty/FacultyPaperGenerator.tsx', 'src/modules/faculty/pages/FacultyPaperGenerator.tsx'],
  ['src/pages/faculty/FacultyPapers.tsx', 'src/modules/faculty/pages/FacultyPapers.tsx'],
  ['src/pages/faculty/FacultyQuestionBank.tsx', 'src/modules/faculty/pages/FacultyQuestionBank.tsx'],
  ['src/pages/faculty/FacultyReschedule.tsx', 'src/modules/faculty/pages/FacultyReschedule.tsx'],
  ['src/pages/faculty/FacultySchedule.tsx', 'src/modules/faculty/pages/FacultySchedule.tsx'],
  ['src/pages/faculty/FacultyStudentAnalysis.tsx', 'src/modules/faculty/pages/FacultyStudentAnalysis.tsx'],
  ['src/pages/faculty/FacultyTopics.tsx', 'src/modules/faculty/pages/FacultyTopics.tsx'],
  ['src/pages/faculty/FacultyUploadMaterial.tsx', 'src/modules/faculty/pages/FacultyUploadMaterial.tsx'],
  ['src/pages/Attendance.tsx', 'src/modules/faculty/pages/Attendance.tsx'],
  ['src/pages/FacultyQuestionBank.tsx', 'src/modules/faculty/pages/FacultyQuestionBank.tsx'],
  ['src/pages/PaperGenerator.tsx', 'src/modules/faculty/pages/PaperGenerator.tsx'],
  ['src/hooks/useFacultyData.ts', 'src/modules/faculty/hooks/useFacultyData.ts'],
  ['src/hooks/useFacultySchedule.ts', 'src/modules/faculty/hooks/useFacultySchedule.ts'],
  ['src/hooks/useFacultyAssessment.ts', 'src/modules/faculty/hooks/useFacultyAssessment.ts'],
  ['src/hooks/useFacultyCurriculum.ts', 'src/modules/faculty/hooks/useFacultyCurriculum.ts'],
  // Already moved by previous script
  ['src/hooks/useFacultyAttendance.ts', 'src/modules/faculty/hooks/useFacultyAttendance.ts'],
  ['src/hooks/useAttendanceExport.ts', 'src/modules/faculty/hooks/useAttendanceExport.ts'],
  ['src/hooks/useAttendance.ts', 'src/modules/faculty/hooks/useAttendance.ts'],
  ['src/hooks/useAttendanceMarking.ts', 'src/modules/faculty/hooks/useAttendanceMarking.ts'],
  ['src/api/facultyApi.ts', 'src/modules/faculty/api/facultyApi.ts'],
  ['src/api/attendanceApi.ts', 'src/modules/faculty/api/attendanceApi.ts'],
  ['src/types/attendance.ts', 'src/modules/faculty/types/attendance.ts'],
  ['src/services/attendanceService.ts', 'src/modules/faculty/services/attendanceService.ts'],

  // --- ADMIN MODULE ---
  ['src/components/admin/ReviewQueue.tsx', 'src/modules/admin/components/ReviewQueue.tsx'],
  ['src/components/ai-agent/AIQuestionGenerator.tsx', 'src/modules/admin/components/ai-agent/AIQuestionGenerator.tsx'],
  ['src/components/question-bank/AIQuestionGenerator.tsx', 'src/modules/admin/components/question-bank/AIQuestionGenerator.tsx'],
  ['src/components/question-bank/BulkImportModal.tsx', 'src/modules/admin/components/question-bank/BulkImportModal.tsx'],
  ['src/components/question-bank/FacultyBankAdmin.tsx', 'src/modules/admin/components/question-bank/FacultyBankAdmin.tsx'],
  ['src/components/question-bank/FacultyBulkImport.tsx', 'src/modules/admin/components/question-bank/FacultyBulkImport.tsx'],
  ['src/components/question-bank/FacultyPaperLinker.tsx', 'src/modules/admin/components/question-bank/FacultyPaperLinker.tsx'],
  ['src/components/question-bank/FacultyQuestionForm.tsx', 'src/modules/admin/components/question-bank/FacultyQuestionForm.tsx'],
  ['src/components/question-bank/PaperGenerator.tsx', 'src/modules/admin/components/question-bank/PaperGenerator.tsx'],
  ['src/components/question-bank/PaperLinkageModal.tsx', 'src/modules/admin/components/question-bank/PaperLinkageModal.tsx'],
  ['src/components/question-bank/PaperPDFPreview.tsx', 'src/modules/admin/components/question-bank/PaperPDFPreview.tsx'],
  ['src/components/question-bank/QuestionBankManager.tsx', 'src/modules/admin/components/question-bank/QuestionBankManager.tsx'],
  ['src/components/question-bank/QuestionForm.tsx', 'src/modules/admin/components/question-bank/QuestionForm.tsx'],
  ['src/components/question-bank/QuestionPDFExport.tsx', 'src/modules/admin/components/question-bank/QuestionPDFExport.tsx'],
  ['src/components/question-bank/QuestionPreview.tsx', 'src/modules/admin/components/question-bank/QuestionPreview.tsx'],
  ['src/components/QuestionSubmissionForm.tsx', 'src/modules/admin/components/QuestionSubmissionForm.tsx'],
  ['src/components/ReviewQueue.tsx', 'src/modules/admin/components/ReviewQueue.tsx'],
  ['src/components/TemplateSelector.tsx', 'src/modules/admin/components/TemplateSelector.tsx'],
  ['src/components/UniversalQuestionBank.tsx', 'src/modules/admin/components/UniversalQuestionBank.tsx'],
  ['src/components/BulkActionsBar.tsx', 'src/modules/admin/components/BulkActionsBar.tsx'],
  ['src/pages/admin/AIAgentPage.tsx', 'src/modules/admin/pages/AIAgentPage.tsx'],
  ['src/pages/admin/CollegeOnboarding.tsx', 'src/modules/admin/pages/CollegeOnboarding.tsx'],
  ['src/pages/AdminClassSchedule.tsx', 'src/modules/admin/pages/AdminClassSchedule.tsx'],
  ['src/pages/AdminCurriculum.tsx', 'src/modules/admin/pages/AdminCurriculum.tsx'],
  ['src/pages/AdminDashboard.tsx', 'src/modules/admin/pages/AdminDashboard.tsx'],
  ['src/pages/AdminFeeManagement.tsx', 'src/modules/admin/pages/AdminFeeManagement.tsx'],
  ['src/pages/HODDashboard.tsx', 'src/modules/admin/pages/HODDashboard.tsx'],
  ['src/pages/Analytics.tsx', 'src/modules/admin/pages/Analytics.tsx'],
  ['src/pages/Assessments.tsx', 'src/modules/admin/pages/Assessments.tsx'],
  ['src/pages/Curriculum.tsx', 'src/modules/admin/pages/Curriculum.tsx'],
  ['src/pages/Dashboard.tsx', 'src/modules/admin/pages/Dashboard.tsx'],
  ['src/pages/PaperGeneratorAdmin.tsx', 'src/modules/admin/pages/PaperGeneratorAdmin.tsx'],
  ['src/pages/QuestionBank.tsx', 'src/modules/admin/pages/QuestionBank.tsx'],
  ['src/pages/Settings.tsx', 'src/modules/admin/pages/Settings.tsx'],
  ['src/pages/View360.tsx', 'src/modules/admin/pages/View360.tsx'],
  ['src/pages/Journey.tsx', 'src/modules/admin/pages/Journey.tsx'],
  ['src/hooks/useAdminDashboard.ts', 'src/modules/admin/hooks/useAdminDashboard.ts'],
  ['src/hooks/useAdminSchedule.ts', 'src/modules/admin/hooks/useAdminSchedule.ts'],
  ['src/hooks/useAssessment.ts', 'src/modules/admin/hooks/useAssessment.ts'],
  ['src/hooks/useCurriculumMapping.ts', 'src/modules/admin/hooks/useCurriculumMapping.ts'],
  ['src/hooks/useDashboardData.ts', 'src/modules/admin/hooks/useDashboardData.ts'],
  ['src/hooks/useFeeData.ts', 'src/modules/admin/hooks/useFeeData.ts'],
  ['src/hooks/useMaterials.ts', 'src/modules/admin/hooks/useMaterials.ts'],
  ['src/hooks/usePaperGenerator.ts', 'src/modules/admin/hooks/usePaperGenerator.ts'],
  ['src/hooks/useTopics.ts', 'src/modules/admin/hooks/useTopics.ts'],
  ['src/hooks/useAIQuestionGenerator.ts', 'src/modules/admin/hooks/useAIQuestionGenerator.ts'],
  ['src/hooks/useAIAgent.ts', 'src/modules/admin/hooks/useAIAgent.ts'],
  ['src/hooks/useUniversities.ts', 'src/modules/admin/hooks/useUniversities.ts'],
  ['src/hooks/useJourney.ts', 'src/modules/admin/hooks/useJourney.ts'],
  ['src/hooks/useGreeting.ts', 'src/modules/admin/hooks/useGreeting.ts'],
  // Already moved by previous script
  ['src/components/QuestionBank.tsx', 'src/modules/admin/pages/QuestionBank.tsx'],
  ['src/components/PaperBuilder.tsx', 'src/modules/admin/pages/PaperBuilder.tsx'],
  ['src/hooks/useQuestionBank.ts', 'src/modules/admin/hooks/useQuestionBank.ts'],
  ['src/api/paperApi.ts', 'src/modules/admin/api/paperApi.ts'],
  ['src/api/questionBankApi.ts', 'src/modules/admin/api/questionBankApi.ts'],
  ['src/api/aiAgentApi.ts', 'src/modules/admin/api/aiAgentApi.ts'],
  ['src/api/aiQuestionApi.ts', 'src/modules/admin/api/aiQuestionApi.ts'],
  ['src/api/assessmentsApi.ts', 'src/modules/admin/api/assessmentsApi.ts'],
  ['src/api/curriculumMappingApi.ts', 'src/modules/admin/api/curriculumMappingApi.ts'],
  ['src/api/dashboardApi.ts', 'src/modules/admin/api/dashboardApi.ts'],
  ['src/api/feeApi.ts', 'src/modules/admin/api/feeApi.ts'],
  ['src/api/journeyApi.ts', 'src/modules/admin/api/journeyApi.ts'],
  ['src/api/materialApi.ts', 'src/modules/admin/api/materialApi.ts'],
  ['src/api/paperGeneratorApi.ts', 'src/modules/admin/api/paperGeneratorApi.ts'],
  ['src/api/questions.ts', 'src/modules/admin/api/questions.ts'],
  ['src/api/questionSubmissionApi.ts', 'src/modules/admin/api/questionSubmissionApi.ts'],
  ['src/api/scheduleApi.ts', 'src/modules/admin/api/scheduleApi.ts'],
  ['src/api/topicApi.ts', 'src/modules/admin/api/topicApi.ts'],
  ['src/types/questionBank.ts', 'src/modules/admin/types/questionBank.ts'],
  ['src/types/aiAgent.ts', 'src/modules/admin/types/aiAgent.ts'],
  ['src/types/aiQuestion.ts', 'src/modules/admin/types/aiQuestion.ts'],
  ['src/types/assessment.ts', 'src/modules/admin/types/assessment.ts'],
  ['src/types/onboarding.ts', 'src/modules/admin/types/onboarding.ts'],
  ['src/types/schedule.ts', 'src/modules/admin/types/schedule.ts'],
  ['src/types/paper.ts', 'src/modules/admin/types/paper.ts'],
  ['src/types/universalQuestionBank.ts', 'src/modules/admin/types/universalQuestionBank.ts'],
  ['src/services/paperAPI.ts', 'src/modules/admin/services/paperAPI.ts'],
  ['src/services/questionBankAPI.ts', 'src/modules/admin/services/questionBankAPI.ts'],
  ['src/services/assignmentService.ts', 'src/modules/admin/services/assignmentService.ts'],
  ['src/services/onboardingService.ts', 'src/modules/admin/services/onboardingService.ts'],
  ['src/services/promptBuilder.ts', 'src/modules/admin/services/promptBuilder.ts'],
  ['src/services/responseParser.ts', 'src/modules/admin/services/responseParser.ts'],
  ['src/services/llmProviders.ts', 'src/modules/admin/services/llmProviders.ts'],
  ['src/services/llmService.ts', 'src/modules/admin/services/llmService.ts'],

  // --- SUPERADMIN MODULE ---
  ['src/components/superadmin/CurriculumAssignmentDialog.tsx', 'src/modules/superadmin/components/CurriculumAssignmentDialog.tsx'],
  ['src/components/superadmin/CurriculumReviewTable.tsx', 'src/modules/superadmin/components/CurriculumReviewTable.tsx'],
  ['src/components/superadmin/FacultyImport.tsx', 'src/modules/superadmin/components/FacultyImport.tsx'],
  ['src/components/superadmin/StudentImport.tsx', 'src/modules/superadmin/components/StudentImport.tsx'],
  ['src/components/superadmin/SuperAdminCurriculum.tsx', 'src/modules/superadmin/components/SuperAdminCurriculum.tsx'],
  ['src/pages/superadmin/CreateCollege.tsx', 'src/modules/superadmin/pages/CreateCollege.tsx'],
  ['src/pages/superadmin/CreateCollegeAdmin.tsx', 'src/modules/superadmin/pages/CreateCollegeAdmin.tsx'],
  ['src/pages/superadmin/FacultyImport.tsx', 'src/modules/superadmin/pages/FacultyImport.tsx'],
  ['src/pages/superadmin/MultiCollegeComparison.tsx', 'src/modules/superadmin/pages/MultiCollegeComparison.tsx'],
  ['src/pages/superadmin/SubscriptionBilling.tsx', 'src/modules/superadmin/pages/SubscriptionBilling.tsx'],
  ['src/pages/superadmin/SuperAdminAdmins.tsx', 'src/modules/superadmin/pages/SuperAdminAdmins.tsx'],
  ['src/pages/superadmin/SuperAdminCollegeDetail.tsx', 'src/modules/superadmin/pages/SuperAdminCollegeDetail.tsx'],
  ['src/pages/superadmin/SuperAdminColleges.tsx', 'src/modules/superadmin/pages/SuperAdminColleges.tsx'],
  ['src/pages/superadmin/SuperAdminCurriculum.tsx', 'src/modules/superadmin/pages/SuperAdminCurriculum.tsx'],
  ['src/pages/superadmin/SuperAdminDashboard.tsx', 'src/modules/superadmin/pages/SuperAdminDashboard.tsx'],
  ['src/pages/superadmin/SuperAdminFaculty.tsx', 'src/modules/superadmin/pages/SuperAdminFaculty.tsx'],
  ['src/pages/superadmin/SuperAdminFacultyDetail.tsx', 'src/modules/superadmin/pages/SuperAdminFacultyDetail.tsx'],
  ['src/pages/superadmin/SuperAdminStudents.tsx', 'src/modules/superadmin/pages/SuperAdminStudents.tsx'],
  ['src/pages/superadmin/SuperAdminUniversities.tsx', 'src/modules/superadmin/pages/SuperAdminUniversities.tsx'],
  ['src/pages/superadmin/SuperAdminUniversityDetail.tsx', 'src/modules/superadmin/pages/SuperAdminUniversityDetail.tsx'],
  ['src/pages/superadmin/SystemHealthMonitor.tsx', 'src/modules/superadmin/pages/SystemHealthMonitor.tsx'],
  ['src/pages/superadmin/UserImport.tsx', 'src/modules/superadmin/pages/UserImport.tsx'],
  ['src/pages/superadmin/seedUniversities.ts', 'src/modules/superadmin/services/seedUniversities.ts'],
  // Already moved by previous script
  ['src/hooks/useSuperAdmin.ts', 'src/modules/superadmin/hooks/useSuperAdmin.ts'],
  ['src/hooks/useCurriculum.ts', 'src/modules/superadmin/hooks/useCurriculum.ts'],
  ['src/hooks/useSyllabusParser.ts', 'src/modules/superadmin/hooks/useSyllabusParser.ts'],
  ['src/hooks/useSyllabusCurriculum.ts', 'src/modules/superadmin/hooks/useSyllabusCurriculum.ts'],
  ['src/api/superAdminApi.ts', 'src/modules/superadmin/api/superAdminApi.ts'],
  ['src/api/curriculumApi.ts', 'src/modules/superadmin/api/curriculumApi.ts'],
  ['src/api/universityApi.ts', 'src/modules/superadmin/api/universityApi.ts'],
  ['src/api/syllabusCurriculumApi.ts', 'src/modules/superadmin/api/syllabusCurriculumApi.ts'],
  ['src/types/superAdmin.ts', 'src/modules/superadmin/types/superAdmin.ts'],
  ['src/types/curriculum.ts', 'src/modules/superadmin/types/curriculum.ts'],
  ['src/types/university.ts', 'src/modules/superadmin/types/university.ts'],
  ['src/services/syllabusParser.ts', 'src/modules/superadmin/services/syllabusParser.ts'],
  ['src/components/SyllabusUploader.tsx', 'src/modules/superadmin/components/SyllabusUploader.tsx'],
  ['src/components/CurriculumReviewTable.tsx', 'src/modules/superadmin/components/CurriculumReviewTable.tsx'],
  ['src/components/ModuleBreakdown.tsx', 'src/modules/superadmin/components/ModuleBreakdown.tsx'],

  // --- SHARED ---
  ['src/components/Layout.tsx', 'src/shared/components/Layout.tsx'],
  ['src/components/ErrorBoundary.tsx', 'src/shared/components/ErrorBoundary.tsx'],
  ['src/components/Header.tsx', 'src/shared/components/Header.tsx'],
  ['src/components/Sidebar.tsx', 'src/shared/components/Sidebar.tsx'],
  ['src/components/StatsCards.tsx', 'src/shared/components/StatsCards.tsx'],
  ['src/components/StatusBadge.tsx', 'src/shared/components/StatusBadge.tsx'],
  ['src/components/Toast.tsx', 'src/shared/components/Toast.tsx'],
  ['src/components/MathRenderer.tsx', 'src/shared/components/MathRenderer.tsx'],
  ['src/contexts/ThemeProvider.tsx', 'src/shared/contexts/ThemeProvider.tsx'],
  ['src/providers/NotificationProvider.tsx', 'src/shared/providers/NotificationProvider.tsx'],
  ['src/api/client.ts', 'src/shared/api/client.ts'],
  ['src/api/cloudStorageApi.ts', 'src/shared/api/cloudStorageApi.ts'],
  ['src/api/studentApi.ts', 'src/shared/api/studentApi.ts'],
  ['src/services/collegeService.ts', 'src/shared/services/collegeService.ts'],
  ['src/services/firebaseAuth.ts', 'src/shared/services/firebaseAuth.ts'],
  ['src/services/firebaseDb.ts', 'src/shared/services/firebaseDb.ts'],
  ['src/services/firestoreService.ts', 'src/shared/services/firestoreService.ts'],
  ['src/services/studentService.ts', 'src/shared/services/studentService.ts'],
  ['src/types/auth.ts', 'src/shared/types/auth.ts'],
  ['src/types/auth-types.ts', 'src/shared/types/auth-types.ts'],
  ['src/types/student.ts', 'src/shared/types/student.ts'],
  ['src/types/system.ts', 'src/shared/types/system.ts'],
  ['src/types/journey.ts', 'src/shared/types/journey.ts'],
  ['src/types/html2pdf.d.ts', 'src/shared/types/html2pdf.d.ts'],
  ['src/types/index.ts', 'src/shared/types/index.ts'],
  ['src/types.ts', 'src/shared/types/root-types.ts'],
  ['src/utils/exportUtils.ts', 'src/shared/utils/exportUtils.ts'],
  ['src/utils/journeyData.ts', 'src/shared/utils/journeyData.ts'],
  ['src/utils/parseCSV.ts', 'src/shared/utils/parseCSV.ts'],
  ['src/utils/pdfDownloader.ts', 'src/shared/utils/pdfDownloader.ts'],
  ['src/utils/pdfGenerator.ts', 'src/shared/utils/pdfGenerator.ts'],
  ['src/utils/seedAttendanceData.ts', 'src/shared/utils/seedAttendanceData.ts'],
  ['src/data/karnatakaUniversities.ts', 'src/shared/data/karnatakaUniversities.ts'],
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ==========================================
// STEP 1: MOVE FILES
// ==========================================
console.log('📦 Phase 3: Complete File Reorganization\n');

console.log('Step 1: Moving files...');
const movedFiles = [];
const skippedFiles = [];

for (const [src, dest] of MOVES) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    movedFiles.push({ old: src, new: dest });
    console.log(`  ✓ ${src} → ${dest}`);
  } else if (fs.existsSync(dest)) {
    // Already moved by previous script
    movedFiles.push({ old: src, new: dest });
    console.log(`  ⏭  Already moved: ${dest}`);
  } else {
    skippedFiles.push(src);
    console.log(`  ⚠️  Not found: ${src}`);
  }
}

// ==========================================
// STEP 2: BUILD IMPORT MAP
// ==========================================
// Map: old absolute path (no ext) -> new absolute path (no ext)
const pathMap = {};
for (const { old: oldPath, new: newPath } of movedFiles) {
  const oldAbs = path.resolve(oldPath).replace(/\\/g, '/').replace(/\.(tsx?|jsx?)$/, '');
  const newAbs = path.resolve(newPath).replace(/\\/g, '/').replace(/\.(tsx?|jsx?)$/, '');
  pathMap[oldAbs] = newAbs;
}

// Also build a map for import strings (for @/ and absolute imports)
const importStringMap = {};
for (const { old: oldPath, new: newPath } of movedFiles) {
  const oldName = path.basename(oldPath).replace(/\.(tsx?|jsx?)$/, '');
  const newName = path.basename(newPath).replace(/\.(tsx?|jsx?)$/, '');
  const oldDir = path.dirname(oldPath).replace(/^src\//, '');
  const newDir = path.dirname(newPath).replace(/^src\//, '');

  importStringMap[`${oldDir}/${oldName}`] = `${newDir}/${newName}`;
  importStringMap[`@/${oldDir}/${oldName}`] = `@/${newDir}/${newName}`;
}

// ==========================================
// STEP 3: FIX IMPORTS
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

function resolveImport(importPath, fromFile) {
  // @/ alias
  if (importPath.startsWith('@/')) {
    return path.resolve('src', importPath.slice(2)).replace(/\\/g, '/');
  }
  // Relative
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

  for (const [oldAbs, newAbs] of Object.entries(pathMap)) {
    if (resolvedNoExt === oldAbs) {
      const fromDir = path.dirname(fromFile);
      let rel = path.relative(fromDir, newAbs).replace(/\\/g, '/');
      if (!rel.startsWith('.')) rel = './' + rel;
      return rel;
    }
  }
  return null;
}

let fixedFiles = 0;
let totalChanges = 0;

walk('src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileChanges = 0;

  // Match: from '...' or from "..."
  const importRegex = /from\s+(['"])([^'"]+)\1/g;

  content = content.replace(importRegex, (match, quote, importPath) => {
    // First: direct string replacement for @/ and absolute paths
    for (const [oldStr, newStr] of Object.entries(importStringMap)) {
      if (importPath === oldStr) {
        fileChanges++;
        return `from ${quote}${newStr}${quote}`;
      }
    }

    // Second: resolve relative paths
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

// ==========================================
// STEP 4: CLEAN UP EMPTY DIRECTORIES
// ==========================================
console.log('\nStep 3: Cleaning up empty directories...');

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeEmptyDirs(fullPath);
      try {
        fs.rmdirSync(fullPath);
        console.log(`  ✓ Removed empty: ${fullPath}`);
      } catch (e) {
        // Not empty
      }
    }
  }
}

const dirsToClean = [
  'src/components',
  'src/hooks',
  'src/api',
  'src/types',
  'src/contexts',
  'src/providers',
  'src/services',
  'src/utils',
  'src/data',
  'src/pages',
];

for (const dir of dirsToClean) {
  if (fs.existsSync(dir)) {
    removeEmptyDirs(dir);
    try {
      fs.rmdirSync(dir);
      console.log(`  ✓ Removed: ${dir}`);
    } catch (e) {
      // Not empty or doesn't exist
    }
  }
}

// ==========================================
// SUMMARY
// ==========================================
console.log(`\n✅ Done!`);
console.log(`   Moved: ${movedFiles.length} files`);
console.log(`   Skipped: ${skippedFiles.length} files`);
console.log(`   Fixed: ${totalChanges} imports across ${fixedFiles} files`);

if (skippedFiles.length > 0) {
  console.log(`\n⚠️  Skipped files (not found):`);
  for (const f of skippedFiles) {
    console.log(`   - ${f}`);
  }
}

console.log('\n🔍 Next steps:');
console.log('   1. Run `npx tsc --noEmit` to check for errors');
console.log('   2. Update tsconfig.json paths if needed');
console.log('   3. Update vite.config.ts aliases if needed');
console.log('   4. Run `npm run dev` to test');