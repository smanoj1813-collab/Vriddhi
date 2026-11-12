/**
 * Public landing-page navigation, deliberately separate from authorization.
 * Only these six entry points are advertised. A query parameter is a sign-in
 * hint, never a role assignment; AuthContext and the route guards still decide
 * access. Finance is the public label for the existing `accounts` workspace.
 */
export const LANDING_ROLES = [
  {
    id: 'principal',
    label: 'Principal',
    tagline: 'The bigger picture',
    heading: 'Lead with a clearer view.',
    description: 'Bring academic progress, campus operations, and financial oversight together. Spend less time chasing updates and more time moving your college forward.',
    features: ['College-wide insights', 'Academic approvals', 'Payroll review'],
    loginPath: '/login?role=principal',
  },
  {
    id: 'hod',
    label: 'HOD',
    tagline: 'A connected department',
    heading: 'Keep your department in step.',
    description: 'Coordinate curriculum, support your faculty, and stay close to departmental progress — without piecing together updates from different places.',
    features: ['Department dashboard', 'Curriculum oversight', 'Faculty coordination'],
    loginPath: '/login?role=hod',
  },
  {
    id: 'faculty',
    label: 'Faculty',
    tagline: 'More time to teach',
    heading: 'Make room for the teaching.',
    description: 'Your classes, attendance, and assessments, thoughtfully connected. Keep everyday tasks in one place and give your students more of your attention.',
    features: ['Attendance & schedules', 'Question banks & papers', 'Student progress'],
    loginPath: '/login?role=faculty',
  },
  {
    id: 'operations',
    label: 'Operations',
    tagline: 'A smoother campus',
    heading: 'Keep the everyday running smoothly.',
    description: 'Connect the moving parts of your campus, from timetables to the library. Give every request a place and every workflow a clear next step.',
    features: ['Timetable coordination', 'Library & inventory', 'Procurement workflows'],
    loginPath: '/login?role=operations',
  },
  {
    id: 'finance',
    label: 'Finance',
    tagline: 'Clarity in every number',
    heading: 'Bring order to the numbers.',
    description: 'Manage fees, receipts, and financial workflows with a clear trail of activity. Keep your records connected and your college informed.',
    features: ['Fees & receipts', 'Payroll preparation', 'Financial reports'],
    loginPath: '/login?role=finance',
  },
  {
    id: 'students',
    label: 'Students',
    tagline: 'Your next step',
    heading: 'Your campus life. Your next chapter.',
    description: 'Find your classes, follow your progress, and take the next step in your learning. Your academic life and assigned upskill courses, together in one place.',
    features: ['Classes & assessments', 'Learning progress', 'Assigned upskill courses'],
    loginPath: '/student/login',
  },
] as const;

export type LandingRole = (typeof LANDING_ROLES)[number];
export type LandingRoleId = LandingRole['id'];

/** Ignore unknown values rather than rendering arbitrary user-controlled text. */
export function landingRoleFromSearch(search: string): LandingRole | undefined {
  const value = new URLSearchParams(search).get('role');
  return LANDING_ROLES.find((role) => role.id === value);
}
