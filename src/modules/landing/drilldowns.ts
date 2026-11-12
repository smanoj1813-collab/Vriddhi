import { LANDING_ROLES, type LandingRoleId } from './roles';

/**
 * Public, static drill-down copy. This module intentionally does not import
 * the course catalog or any tenant data. It describes capabilities already
 * present in the product while keeping course titles behind student sign-in.
 */
export type PlatformDrilldownId = 'academics' | 'assessments' | 'campus-operations';

export type DrilldownSelection =
  | { kind: 'platform'; id: PlatformDrilldownId }
  | { kind: 'role'; id: LandingRoleId }
  | { kind: 'upskilling' };

export interface DrilldownHighlight {
  title: string;
  description: string;
}

export interface DrilldownStep {
  label: string;
  description: string;
}

export type DrilldownAction =
  | { type: 'roles' }
  | { type: 'role-login'; roleId: LandingRoleId }
  | { type: 'courses' };

export interface DrilldownContent {
  eyebrow: string;
  title: string;
  intro: string;
  highlights: DrilldownHighlight[];
  workflow: DrilldownStep[];
  roleIds: readonly LandingRoleId[];
  note: string;
  action: DrilldownAction;
}

const PLATFORM_CONTENT: Record<PlatformDrilldownId, DrilldownContent> = {
  academics: {
    eyebrow: 'The platform / Academics',
    title: 'Academics, in step.',
    intro: 'Connect the academic plan to the people and classes delivering it. Curriculum, schedules, attendance, and teaching progress stay visible to the roles that need them.',
    highlights: [
      { title: 'Curriculum coordination', description: 'Map syllabus courses to faculty and teaching groups, then move approved plans into the academic workflow.' },
      { title: 'Clash-aware schedules', description: 'Prepare and adjust timetables with faculty, room, and cohort conflicts in view.' },
      { title: 'Attendance & coverage', description: 'Mark class attendance and follow teaching progress without losing the history of delivered classes.' },
      { title: 'Shared academic visibility', description: 'Give departments and leadership a connected view of schedules, attendance, and curriculum progress.' },
    ],
    workflow: [
      { label: 'Plan', description: 'Align curriculum, faculty, and teaching groups.' },
      { label: 'Schedule', description: 'Turn the plan into classes with conflict checks.' },
      { label: 'Track', description: 'Follow attendance, coverage, and academic progress.' },
    ],
    roleIds: ['operations', 'hod', 'principal', 'faculty', 'students'],
    note: 'The tools shown in each workspace depend on the role and permissions assigned by the college.',
    action: { type: 'roles' },
  },
  assessments: {
    eyebrow: 'The platform / Assessments',
    title: 'Assessments, simplified.',
    intro: 'Keep the assessment cycle connected: prepare questions, build papers, run tests, and bring results back into the student’s academic record.',
    highlights: [
      { title: 'Question banks', description: 'Organize questions by subject, topic, and difficulty so faculty can reuse and review them.' },
      { title: 'Paper preparation', description: 'Draft question papers from the bank and keep faculty review in the preparation flow.' },
      { title: 'Online tests', description: 'Run structured assessments with clear instructions, timed attempts, and saved progress.' },
      { title: 'Results & feedback', description: 'Review outcomes, support grading workflows, and give students a clearer view of performance.' },
    ],
    workflow: [
      { label: 'Prepare', description: 'Build the bank and shape the paper.' },
      { label: 'Assess', description: 'Run the test or examination workflow.' },
      { label: 'Review', description: 'Bring results and feedback back to learners.' },
    ],
    roleIds: ['faculty', 'hod', 'principal', 'students'],
    note: 'Assessment availability and grading actions follow the college’s academic setup and role permissions.',
    action: { type: 'roles' },
  },
  'campus-operations': {
    eyebrow: 'The platform / Campus operations',
    title: 'Operations, connected.',
    intro: 'Bring campus services and financial records into one organized flow, with clear responsibility for requests, approvals, receipts, and reports.',
    highlights: [
      { title: 'Fees & receipts', description: 'Maintain fee ledgers, record collections, and keep receipt history connected to the student record.' },
      { title: 'Library & inventory', description: 'Manage circulation, stock, and campus resources from the operations workspace.' },
      { title: 'Procurement & vendors', description: 'Route purchase requests and orders through the college’s approval chain.' },
      { title: 'Payroll & financial reports', description: 'Support payroll preparation and review, with financial reporting for the roles that need it.' },
    ],
    workflow: [
      { label: 'Record', description: 'Capture the request, transaction, or resource movement.' },
      { label: 'Route', description: 'Move approvals to the responsible role.' },
      { label: 'Report', description: 'Keep ledgers, receipts, and summaries available for review.' },
    ],
    roleIds: ['operations', 'finance', 'principal', 'students'],
    note: 'Finance and operations remain separate responsibilities. Students see only their own self-service information.',
    action: { type: 'roles' },
  },
};

const ROLE_CONTENT: Record<LandingRoleId, DrilldownContent> = {
  principal: {
    eyebrow: 'Your role / Principal',
    title: 'A clearer view of the whole college.',
    intro: 'The principal workspace brings academic, operational, and financial oversight together so decisions can be reviewed with context instead of chased across separate tools.',
    highlights: [
      { title: 'College-wide visibility', description: 'Review academic progress, campus activity, and key institutional indicators from one leadership surface.' },
      { title: 'Approval responsibility', description: 'Review curriculum and payroll decisions where the workflow places final approval with the principal.' },
      { title: 'Financial oversight', description: 'Follow fees, reports, and payroll review without taking over day-to-day preparation from the finance team.' },
      { title: 'Governance', description: 'Keep access and institutional settings aligned with the college’s responsibilities.' },
    ],
    workflow: [
      { label: 'See', description: 'Start with the college-wide picture.' },
      { label: 'Review', description: 'Approve or query the decisions that need leadership.' },
      { label: 'Follow through', description: 'Track outcomes across departments and offices.' },
    ],
    roleIds: ['principal', 'hod', 'faculty', 'operations', 'finance', 'students'],
    note: 'Oversight does not mean unlimited editing. Actions still follow the college’s role permissions.',
    action: { type: 'role-login', roleId: 'principal' },
  },
  hod: {
    eyebrow: 'Your role / HOD',
    title: 'A department that moves together.',
    intro: 'The HOD workspace keeps departmental academics coordinated: curriculum, faculty schedules, progress, and the requests that need departmental attention.',
    highlights: [
      { title: 'Department dashboard', description: 'Start with the department’s academic picture instead of rebuilding it from separate updates.' },
      { title: 'Curriculum oversight', description: 'Keep syllabus coverage and teaching assignments aligned with the department plan.' },
      { title: 'Faculty coordination', description: 'Review schedules and support faculty when classes or academic plans need adjustment.' },
      { title: 'Department requests', description: 'Raise or review department-level requests that move into the college approval chain.' },
    ],
    workflow: [
      { label: 'Align', description: 'Connect the department plan to faculty and classes.' },
      { label: 'Coordinate', description: 'Review schedules, coverage, and requests.' },
      { label: 'Support', description: 'Follow progress and help unblock the department.' },
    ],
    roleIds: ['hod', 'principal', 'faculty', 'operations'],
    note: 'The HOD surface is academic and departmental; finance management stays with the finance role.',
    action: { type: 'role-login', roleId: 'hod' },
  },
  faculty: {
    eyebrow: 'Your role / Faculty',
    title: 'More of the day for teaching.',
    intro: 'The faculty workspace connects the class plan, attendance, assessment preparation, and student progress so everyday teaching tasks stay in one flow.',
    highlights: [
      { title: 'Classes & schedules', description: 'See the teaching schedule and handle class changes through the academic workflow.' },
      { title: 'Attendance marking', description: 'Mark student attendance for class sessions and keep the record connected to the timetable.' },
      { title: 'Questions & papers', description: 'Prepare question banks and papers for review before assessment use.' },
      { title: 'Student progress', description: 'Follow assessment outcomes and support learners with clearer academic feedback.' },
    ],
    workflow: [
      { label: 'Prepare', description: 'Open the class plan and teaching materials.' },
      { label: 'Teach', description: 'Deliver the class and mark attendance.' },
      { label: 'Assess', description: 'Review learning and support the next step.' },
    ],
    roleIds: ['faculty', 'hod', 'students', 'principal'],
    note: 'Faculty actions are scoped to the classes and responsibilities assigned by the college.',
    action: { type: 'role-login', roleId: 'faculty' },
  },
  operations: {
    eyebrow: 'Your role / Operations',
    title: 'The everyday, kept in motion.',
    intro: 'The operations workspace connects scheduling preparation with the campus resources and requests that keep teaching and student life running.',
    highlights: [
      { title: 'Timetable preparation', description: 'Prepare class schedules and move them through the academic review workflow.' },
      { title: 'Library services', description: 'Manage circulation and library-related activity from the operations desk.' },
      { title: 'Inventory & stores', description: 'Keep stock and campus resources organized with clear movement records.' },
      { title: 'Procurement flow', description: 'Turn requests into orders and route them through the responsible approvers.' },
    ],
    workflow: [
      { label: 'Prepare', description: 'Set up schedules, resources, and requests.' },
      { label: 'Manage', description: 'Keep library, inventory, and procurement moving.' },
      { label: 'Close the loop', description: 'Record fulfilment and keep the trail visible.' },
    ],
    roleIds: ['operations', 'hod', 'principal', 'finance', 'students'],
    note: 'Operations coordinates campus services; financial management remains a separate finance responsibility.',
    action: { type: 'role-login', roleId: 'operations' },
  },
  finance: {
    eyebrow: 'Your role / Finance',
    title: 'Numbers with a clear trail.',
    intro: 'The finance workspace keeps fees, receipts, payroll preparation, and reports connected so the college can see what was recorded, reviewed, and reported.',
    highlights: [
      { title: 'Fee ledger', description: 'Work with student fee records, outstanding balances, and collection history.' },
      { title: 'Receipts & challans', description: 'Keep payment evidence and examination-fee workflows connected to the right records.' },
      { title: 'Payroll preparation', description: 'Prepare payroll for the principal’s review while keeping preparation and approval separate.' },
      { title: 'Financial reports', description: 'Use connected records to support reporting and financial review.' },
    ],
    workflow: [
      { label: 'Record', description: 'Capture collections, receipts, and financial activity.' },
      { label: 'Prepare', description: 'Reconcile ledgers and prepare payroll or reports.' },
      { label: 'Review', description: 'Make the trail available for responsible oversight.' },
    ],
    roleIds: ['finance', 'principal', 'operations', 'students'],
    note: 'Finance is the public label for the college accounts workspace. Access is still decided by the authenticated account.',
    action: { type: 'role-login', roleId: 'finance' },
  },
  students: {
    eyebrow: 'Your role / Students',
    title: 'Your campus life, easier to follow.',
    intro: 'The student workspace brings the timetable, attendance, assessments, fees, and assigned learning into one place so the next step is easier to see.',
    highlights: [
      { title: 'Classes & attendance', description: 'Check the timetable and follow attendance from the student portal.' },
      { title: 'Tests & results', description: 'Take assigned assessments and review published academic outcomes.' },
      { title: 'Campus self-service', description: 'See fee information, library activity, and other student-facing records where the college enables them.' },
      { title: 'Assigned upskill courses', description: 'Open the courses assigned to your college and continue learning without leaving the platform.' },
    ],
    workflow: [
      { label: 'Check', description: 'See classes, tasks, and campus updates.' },
      { label: 'Learn', description: 'Complete assessments and assigned learning.' },
      { label: 'Move forward', description: 'Follow progress and take the next step.' },
    ],
    roleIds: ['students', 'faculty', 'hod', 'finance', 'operations'],
    note: 'Students see their own records. Course titles and materials appear only in the assigned learning workspace.',
    action: { type: 'role-login', roleId: 'students' },
  },
};

const UPSKILLING_CONTENT: DrilldownContent = {
  eyebrow: 'Upskilling / The learning experience',
  title: 'A clearer path from learning to doing.',
    intro: 'Upskill courses live inside the student workspace. Here’s how the learning experience works — sign in when you’re ready to discover the courses your college has assigned.',
  highlights: [
    { title: 'Structured modules', description: 'Move through an ordered sequence of lessons and activities instead of hunting for the next step.' },
    { title: 'Lessons & projects', description: 'Combine guided learning with practical work that asks learners to apply what they have read.' },
    { title: 'Knowledge checks', description: 'Use lesson quizzes and module assessments to check understanding before moving ahead.' },
    { title: 'Progress & completion', description: 'Keep completion in view and, where the course checks are met, download a platform completion certificate.' },
  ],
  workflow: [
    { label: 'Open', description: 'Sign in and view the courses assigned to your college.' },
    { label: 'Learn', description: 'Work through lessons, projects, and knowledge checks.' },
    { label: 'Continue', description: 'Resume progress and complete the course requirements.' },
  ],
  roleIds: ['students'],
  note: 'Course titles, syllabi, and learning materials are not listed on this public page. Availability depends on your college assignment.',
  action: { type: 'courses' },
};

export function getDrilldownContent(selection: DrilldownSelection): DrilldownContent {
  if (selection.kind === 'platform') return PLATFORM_CONTENT[selection.id];
  if (selection.kind === 'role') return ROLE_CONTENT[selection.id];
  return UPSKILLING_CONTENT;
}

export function roleLabelForDrilldown(roleId: LandingRoleId): string {
  return LANDING_ROLES.find((role) => role.id === roleId)?.label ?? roleId;
}
