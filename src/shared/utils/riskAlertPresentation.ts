import type { AcademicRiskAlert } from '../services/riskAlertsApi';

export const RISK_CATEGORY_LABELS: Record<AcademicRiskAlert['category'], string> = {
  attendance: 'Student attendance', 'class-register': 'Class registers', 'staff-attendance': 'Faculty check-in/out',
  curriculum: 'Curriculum', assignment: 'Assignments', assessment: 'Assessments', coverage: 'Coverage',
};
export function riskInboxPath(role: string | undefined): string {
  return role === 'student' ? '/student/risk-alerts' : ['faculty', 'mentor'].includes(role || '') ? '/faculty/risk-alerts' : '/admin/risk-alerts';
}
export function safeRiskActionPath(path: string, role?: string): string {
  const prefix = role === 'student' ? '/student/' : ['faculty', 'mentor'].includes(role || '') ? '/faculty/' : '/admin/';
  const allowed = role === 'student' ? ['attendance', 'assignments', 'assessments', 'risk-alerts']
    : ['faculty', 'mentor'].includes(role || '') ? ['attendance', 'my-attendance', 'topics', 'assignments', 'assessments', 'risk-alerts']
      : ['attendance', 'faculty-attendance', 'curriculum-progress', 'assignment-analytics', 'test-reports', 'risk-alerts'];
  return allowed.some(p => path === `${prefix}${p}`) ? path : riskInboxPath(role);
}
export function activeRiskAlerts(alerts: AcademicRiskAlert[]): AcademicRiskAlert[] {
  return alerts.filter(a => a.category !== 'coverage' && ['active', 'unverified'].includes(a.state))
    .sort((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical') || b.updatedAt - a.updatedAt);
}
export function riskCheckedLabel(stamp?: number | null): string {
  return stamp ? new Date(stamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST' : 'Not checked yet';
}
export function riskErrorMessage(error: unknown): string {
  const code = String((error as { code?: string })?.code || '');
  if (code.includes('not-found') || code.includes('unavailable')) return 'Academic alert services are unavailable. Retry later; no “all clear” conclusion has been made.';
  if (code.includes('permission-denied') || code.includes('unauthenticated')) return 'Your verified academic account could not be confirmed. Sign in again or contact your college administrator.';
  return error instanceof Error ? error.message : 'Academic checks could not be loaded. Please retry.';
}
