// src/modules/employee/api/employeeApi.ts
// Client wrapper around the employeeAccess callables. The assignment document
// itself is Admin-SDK-only (Firestore rules deny client writes), so every
// mutation goes through these callables.
import { functions } from '@/Firebase/config'
import { httpsCallable } from 'firebase/functions'

export type EmployeeGrant =
  | 'schedule'
  | 'curriculum'
  | 'assessments'
  | 'papers'
  | 'grading'
  | 'reports'

export const EMPLOYEE_GRANT_LABELS: Record<EmployeeGrant, string> = {
  schedule: 'Class scheduling',
  curriculum: 'Curriculum assign & verify',
  assessments: 'Assessment scheduling',
  papers: 'Question & paper generation',
  grading: 'Grading → HOD approval',
  reports: 'Reports',
}

export interface EmployeeCollege {
  id: string
  name: string
  code: string
}

export interface EmployeeAssignment {
  uid: string
  email: string
  name: string
  status: 'active' | 'suspended'
  grants: EmployeeGrant[]
  activeCollegeId: string | null
  colleges: EmployeeCollege[]
  collegeIds: string[]
}

export interface AssignEmployeeInput {
  email?: string
  uid?: string
  name?: string
  collegeIds: string[]
  grants?: EmployeeGrant[]
  status?: 'active' | 'suspended'
}

const assignCall = httpsCallable<AssignEmployeeInput, { success: boolean; employee: EmployeeAssignment }>(
  functions,
  'assignEmployeeColleges',
)
const listCall = httpsCallable<Record<string, never>, { success: boolean; count: number; employees: EmployeeAssignment[] }>(
  functions,
  'listPlatformEmployees',
)
const mineCall = httpsCallable<Record<string, never>, { success: boolean; employee: EmployeeAssignment | null; superadmin: boolean }>(
  functions,
  'getMyEmployeeAccess',
)
const switchCall = httpsCallable<{ collegeId: string }, { success: boolean; collegeId: string; collegeName: string }>(
  functions,
  'setEmployeeActiveCollege',
)
const suspendCall = httpsCallable<{ uid: string; suspend: boolean }, { success: boolean; status: string }>(
  functions,
  'suspendPlatformEmployee',
)

export async function assignEmployee(input: AssignEmployeeInput): Promise<EmployeeAssignment> {
  const result = await assignCall(input)
  return result.data.employee
}

export async function listPlatformEmployees(): Promise<EmployeeAssignment[]> {
  const result = await listCall({})
  return result.data.employees
}

export async function getMyEmployeeAccess(): Promise<{ employee: EmployeeAssignment | null; superadmin: boolean }> {
  const result = await mineCall({})
  return { employee: result.data.employee, superadmin: result.data.superadmin }
}

export async function setActiveCollege(collegeId: string): Promise<void> {
  await switchCall({ collegeId })
}

export async function setEmployeeSuspended(uid: string, suspend: boolean): Promise<void> {
  await suspendCall({ uid, suspend })
}
