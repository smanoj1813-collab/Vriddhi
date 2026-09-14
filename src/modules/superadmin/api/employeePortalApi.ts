// src/modules/admin/api/employeePortalApi.ts
// ------------------------------------------------------------------
// Internal Employee Portal client. Every call is a Cloud Function:
// provisioning, tenancy decisions, attendance authorisation and the
// audit trail all live server-side (functions/src/employeePortal.ts),
// so the browser never decides who is allowed what.
// ------------------------------------------------------------------
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';

async function call<TInput, TOutput>(name: string, input: TInput): Promise<TOutput> {
  const invoke = httpsCallable<TInput, TOutput>(functions, name);
  return (await invoke(input)).data;
}

// ── Types ───────────────────────────────────────────────────────────

export const EMPLOYEE_ROLES = ['faculty', 'hod', 'mentor', 'principal', 'admin'] as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

export const EMPLOYEE_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export interface Employee {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: EmployeeRole | string;
  collegeId: string;
  department?: string;
  designation?: string;
  phone?: string;
  employmentType?: string;
  joiningDate?: string;
  qualification?: string;
  specialization?: string;
  status: EmployeeStatus | string;
  mustChangePassword?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProvisionEmployeeInput {
  collegeId?: string;
  email: string;
  name: string;
  role: EmployeeRole;
  department?: string;
  designation?: string;
  phone?: string;
  employmentType?: string;
  joiningDate?: string;
  qualification?: string;
  specialization?: string;
  /** Optional; must satisfy the server password policy when provided.
   * Omit to have a cryptographically random one issued. */
  password?: string;
}

export interface ProvisionEmployeeResult {
  success: boolean;
  uid: string;
  employeeId: string;
  email: string;
  role: EmployeeRole;
  created: boolean;
  /** One-time credential. Shown once; never stored or logged. */
  temporaryPassword: string;
  reauthenticateRequired: boolean;
  apiVersion?: string;
}

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half-day', 'leave'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface EmployeeAttendanceRow {
  id: string;
  employeeId: string;
  employeeUid: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  date: string;
  status: AttendanceStatus | string;
  checkIn?: string;
  checkOut?: string;
  note?: string;
  source: 'self' | 'manager' | string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  attendanceRate: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  collegeId: string | null;
  targetUid: string | null;
  targetEmail: string | null;
  targetId: string | null;
  targetType: string | null;
  details: Record<string, unknown> | null;
  createdAt: string | null;
}

// ── Directory & provisioning ────────────────────────────────────────

export function provisionEmployee(input: ProvisionEmployeeInput): Promise<ProvisionEmployeeResult> {
  return call('provisionEmployee', input);
}

export function listEmployees(input: {
  collegeId?: string;
  status?: EmployeeStatus | '';
  search?: string;
}): Promise<{ employees: Employee[]; total: number }> {
  return call('listEmployees', input);
}

export function updateEmployee(input: {
  employeeId: string;
  name?: string;
  department?: string;
  designation?: string;
  phone?: string;
  employmentType?: string;
  joiningDate?: string;
  qualification?: string;
  specialization?: string;
}): Promise<{ success: boolean; updatedFields: string[] }> {
  return call('updateEmployee', input);
}

export function setEmployeeStatus(input: {
  employeeId: string;
  status: EmployeeStatus;
}): Promise<{ success: boolean; status: EmployeeStatus }> {
  return call('setEmployeeStatus', input);
}

export function exportEmployeesCsv(input: {
  collegeId?: string;
  status?: EmployeeStatus | '';
}): Promise<{ csv: string; count: number }> {
  return call('exportEmployeesCsv', input);
}

/** Idempotent: creates `employees` rows for pre-existing faculty/staff
 * profiles that do not have one yet. Existing rows are never touched. */
export function backfillEmployeeDirectory(input: { collegeId?: string }): Promise<{
  success: boolean;
  created: number;
  skippedExisting: number;
  unusableProfiles: number;
}> {
  return call('backfillEmployeeDirectory', input);
}

// ── Attendance ──────────────────────────────────────────────────────

export function markEmployeeAttendance(input: {
  employeeUid?: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}): Promise<{ success: boolean; id: string }> {
  return call('markEmployeeAttendance', input);
}

export function listEmployeeAttendance(input: {
  from: string;
  to: string;
  collegeId?: string;
  employeeUid?: string;
}): Promise<{ rows: EmployeeAttendanceRow[]; summary: AttendanceSummary }> {
  return call('listEmployeeAttendance', input);
}

export function exportEmployeeAttendanceCsv(input: {
  from: string;
  to: string;
  collegeId?: string;
  employeeUid?: string;
}): Promise<{ csv: string; count: number }> {
  return call('exportEmployeeAttendanceCsv', input);
}

// ── Question bank (audited, college-scoped writes) ─────────────────

export function upsertQuestionBankItem(input: Record<string, unknown>): Promise<{ success: boolean; questionId: string }> {
  return call('upsertQuestionBankItem', input);
}

export function deleteQuestionBankItem(input: { questionId: string }): Promise<{ success: boolean }> {
  return call('deleteQuestionBankItem', input);
}

// ── Test duplication ────────────────────────────────────────────────

export function duplicateAssessmentTest(input: {
  testId: string;
  title?: string;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
}): Promise<{ success: boolean; testId: string; questionCount: number; status: string }> {
  return call('duplicateAssessmentTest', input);
}

// ── Audit trail ─────────────────────────────────────────────────────

export function listAuditLogs(input: {
  collegeId?: string;
  action?: string;
  actorUid?: string;
  targetEmail?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<{ entries: AuditEntry[]; hasMore: boolean; nextCursor: string | null }> {
  return call('listAuditLogs', input);
}
