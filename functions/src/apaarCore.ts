// functions/src/apaarCore.ts
//
// Pure APAAR/ABC helpers for the backend: ID normalisation and the
// NAD-ABC award-data row builder. Kept dependency-free so the unit tests
// cover the export contract without Firestore. The client mirror lives in
// src/shared/utils/apaar.ts — validation rules must stay identical.

export function normalizeApaarId(raw: unknown): string {
  return String(raw ?? '').replace(/\D/g, '')
}

export function isValidApaarId(raw: unknown): boolean {
  return /^\d{12}$/.test(normalizeApaarId(raw))
}

/** Grades that earn no credits in every scheme pack shipped so far. */
export const FAIL_GRADES = new Set(['F', 'FR', 'FF', 'X', 'NE', 'I', 'W', 'AB', 'ABSENT', 'UFM'])

export interface NadGradeRecordLike {
  studentId: string
  studentName?: string
  studentRegNo?: string
  semester: number
  subject: string
  code: string
  credits?: number
  grade: string
  gradePoint?: number
  status: string
}

export interface NadStudentLike {
  id: string
  name?: string
  regNo?: string
  apaarId?: string
  dob?: string
  dateOfBirth?: string
  gender?: string
  course?: string
  department?: string
  branch?: string
}

/** One award row for the NAD-ABC upload sheet (one per passed/failed course attempt). */
export interface NadAbcRow {
  apaarId: string
  studentName: string
  registrationNo: string
  dateOfBirth: string
  gender: string
  programme: string
  semester: number
  courseCode: string
  courseName: string
  credits: number
  grade: string
  gradePoint: number | ''
  creditsEarned: number
  result: 'Pass' | 'Fail'
  examYear: string
}

export interface NadBuildResult {
  rows: NadAbcRow[]
  /** Published records whose student has no valid APAAR ID — cannot be uploaded. */
  skipped: Array<{ studentId: string; registrationNo: string; studentName: string; records: number }>
  publishedRecords: number
}

/**
 * Join published grade records to students and shape the NAD-ABC award
 * rows. A course earns credits only when the grade is a pass (grade point
 * > 0 and not a fail grade). Records for students without a valid APAAR
 * ID are reported, never silently dropped — the college must chase those
 * IDs before the examination-year window closes.
 */
export function buildNadAbcRows(records: NadGradeRecordLike[], students: NadStudentLike[], examYear: string): NadBuildResult {
  const byId = new Map(students.map(s => [s.id, s]))
  const rows: NadAbcRow[] = []
  const skippedMap = new Map<string, { studentId: string; registrationNo: string; studentName: string; records: number }>()
  let publishedRecords = 0

  for (const r of records) {
    if (r.status !== 'published') continue
    publishedRecords += 1
    const student = byId.get(r.studentId)
    const apaarId = normalizeApaarId(student?.apaarId)
    const registrationNo = String(student?.regNo || r.studentRegNo || '')
    const studentName = String(student?.name || r.studentName || '')
    if (!student || !isValidApaarId(apaarId)) {
      const cur = skippedMap.get(r.studentId) || { studentId: r.studentId, registrationNo, studentName, records: 0 }
      cur.records += 1
      skippedMap.set(r.studentId, cur)
      continue
    }
    const grade = String(r.grade || '').trim().toUpperCase()
    const gradePoint = typeof r.gradePoint === 'number' && Number.isFinite(r.gradePoint) ? r.gradePoint : ''
    const credits = typeof r.credits === 'number' && Number.isFinite(r.credits) ? r.credits : 0
    const passed = !FAIL_GRADES.has(grade) && gradePoint !== 0
    rows.push({
      apaarId,
      studentName,
      registrationNo,
      dateOfBirth: String(student.dob || student.dateOfBirth || ''),
      gender: String(student.gender || ''),
      programme: String(student.course || student.department || student.branch || ''),
      semester: Number(r.semester) || 0,
      courseCode: String(r.code || ''),
      courseName: String(r.subject || ''),
      credits,
      grade,
      gradePoint,
      creditsEarned: passed ? credits : 0,
      result: passed ? 'Pass' : 'Fail',
      examYear,
    })
  }

  rows.sort((a, b) =>
    a.registrationNo.localeCompare(b.registrationNo)
    || a.semester - b.semester
    || a.courseCode.localeCompare(b.courseCode))
  return { rows, skipped: [...skippedMap.values()].sort((a, b) => a.registrationNo.localeCompare(b.registrationNo)), publishedRecords }
}

export const NAD_ABC_HEADERS = [
  'APAAR ID', 'Student Name', 'Registration No', 'Date of Birth', 'Gender',
  'Programme', 'Semester', 'Course Code', 'Course Name', 'Credits',
  'Grade', 'Grade Point', 'Credits Earned', 'Result', 'Exam Year',
] as const

export function nadRowToCells(r: NadAbcRow): Array<string | number> {
  return [
    r.apaarId, r.studentName, r.registrationNo, r.dateOfBirth, r.gender,
    r.programme, r.semester, r.courseCode, r.courseName, r.credits,
    r.grade, r.gradePoint, r.creditsEarned, r.result, r.examYear,
  ]
}
