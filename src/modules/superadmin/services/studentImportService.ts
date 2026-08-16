// src/services/studentImportService.ts
// Client-side wrapper for the bulkCreateStudentAccounts Cloud Function

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { getApp } from 'firebase/app'

const functions = getFunctions(getApp())

// ─── Connect to emulator in development (safe for Vite) ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viteEnv = (import.meta as any).env
if (viteEnv?.DEV && viteEnv?.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface StudentImportPayload {
  regNo: string
  name: string
  email: string
  phone?: string
  department: string
  batch: string
  division: string
  semester?: number | string
  dob?: string
  gender?: string
  address?: string
  mentorId?: string
}

export interface StudentImportResult {
  regNo: string
  name: string
  email: string
  success: boolean
  uid?: string
  password?: string
  error?: string
}

export interface BulkImportResponse {
  success: boolean
  total: number
  created: number
  failed: number
  errors: Array<{ row: number; regNo: string; message: string }>
  students: StudentImportResult[]
  collegeId: string
}

export type PasswordStrategy = 'auto' | 'default'

// ═════════════════════════════════════════════════════════════════════════════
// MAIN: bulkCreateStudentAccounts callable
// ═════════════════════════════════════════════════════════════════════════════

export async function bulkCreateStudentAccounts(
  collegeId: string,
  students: StudentImportPayload[],
  options: {
    passwordStrategy?: PasswordStrategy
    defaultPassword?: string
  } = {}
): Promise<BulkImportResponse> {
  if (students.length === 0) {
    throw new Error('No students to import')
  }
  if (students.length > 500) {
    throw new Error('Maximum 500 students per import batch')
  }

  const callable = httpsCallable(functions, 'bulkCreateStudentAccounts')
  const response = await callable({
    collegeId,
    students,
    passwordStrategy: options.passwordStrategy || 'auto',
    defaultPassword: options.defaultPassword,
  })

  return response.data as BulkImportResponse
}

// ═════════════════════════════════════════════════════════════════════════════
// UTIL: Download credentials CSV
// ═════════════════════════════════════════════════════════════════════════════

export function downloadCredentialsCSV(
  results: StudentImportResult[],
  filename = 'student_credentials.csv'
): void {
  const headers = ['Registration Number', 'Name', 'Email', 'Password', 'UID', 'Status', 'Error']
  const rows = results.map((r) => [
    r.regNo,
    r.name,
    r.email,
    r.password || '',
    r.uid || '',
    r.success ? 'Created' : 'Failed',
    r.error || '',
  ])

  const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '\"')}"`).join(','))].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

// ═════════════════════════════════════════════════════════════════════════════
// UTIL: Format import summary
// ═════════════════════════════════════════════════════════════════════════════

export function formatImportSummary(response: BulkImportResponse): string {
  const lines = [
    `Total: ${response.total}`,
    `Created: ${response.created}`,
    `Failed: ${response.failed}`,
    `Success Rate: ${response.total > 0 ? Math.round((response.created / response.total) * 100) : 0}%`,
  ]
  if (response.errors.length > 0) {
    lines.push('', 'Errors:')
    response.errors.forEach((e) => {
      lines.push(`  Row ${e.row} (${e.regNo}): ${e.message}`)
    })
  }
  return lines.join('\n')
}