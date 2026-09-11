// src/shared/utils/attendanceExport.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Pins the download contract: CSV escaping, filenames, and the shape of every
// sheet a principal gets when they click "download monthly attendance".

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildStaffAttendanceReport,
  buildStaffDetailSheet,
  buildStaffRegisterSheet,
  buildStaffSummarySheet,
  buildStudentAttendanceReport,
  buildStudentDetailSheet,
  escapeCsvValue,
  exportFilename,
  toCsv,
} from './attendanceExport'
import {
  buildRegister,
  customRange,
  monthRange,
  summarizeByFaculty,
} from './staffAttendanceStats'
import type { StaffAttendanceRecord, StaffRosterEntry } from '../types/staffAttendance'

const ROSTER: StaffRosterEntry[] = [
  { id: 'f1', name: 'Asha Rao', department: 'Commerce', designation: 'Professor' },
  { id: 'f2', name: 'Bala Kumar', department: 'Science' },
]

function record(facultyId: string, date: string, status: StaffAttendanceRecord['status'], extra: Partial<StaffAttendanceRecord> = {}): StaffAttendanceRecord {
  const member = ROSTER.find((m) => m.id === facultyId)!
  return {
    id: `${facultyId}__${date}`,
    collegeId: 'c1',
    facultyId,
    facultyName: member.name,
    department: member.department,
    designation: member.designation,
    date,
    status,
    checkIn: '09:00',
    checkOut: '17:00',
    hoursWorked: 8,
    note: '',
    markedAt: `${date}T09:05:00.000Z`,
    source: 'self',
    markedBy: facultyId,
    ...extra,
  }
}

describe('CSV', () => {
  it('quotes values containing commas, quotes or newlines', () => {
    assert.equal(escapeCsvValue('plain'), 'plain')
    assert.equal(escapeCsvValue('Rao, Asha'), '"Rao, Asha"')
    assert.equal(escapeCsvValue('said "hi"'), '"said ""hi"""')
    assert.equal(escapeCsvValue('line1\nline2'), '"line1\nline2"')
    assert.equal(escapeCsvValue(null), '')
    assert.equal(escapeCsvValue(0), '0')
  })

  it('emits a header row plus CRLF-terminated data rows', () => {
    const csv = toCsv({ name: 'S', headers: ['A', 'B'], rows: [['1', 'x,y'], ['2', '']] })
    assert.equal(csv, 'A,B\r\n1,"x,y"\r\n2,\r\n')
  })
})

describe('exportFilename', () => {
  it('names a monthly download after the month', () => {
    assert.equal(exportFilename('faculty_attendance', monthRange('2026-09'), 'excel'), 'faculty_attendance_2026-09.xlsx')
    assert.equal(exportFilename('faculty_attendance', monthRange('2026-09'), 'csv'), 'faculty_attendance_2026-09.csv')
    assert.equal(exportFilename('faculty_attendance', monthRange('2026-09'), 'pdf'), 'faculty_attendance_2026-09.pdf')
  })

  it('names a date-range download after both ends', () => {
    const range = customRange('2026-08-15', '2026-09-14')
    assert.equal(exportFilename('faculty_attendance', range, 'excel'), 'faculty_attendance_2026-08-15_to_2026-09-14.xlsx')
  })

  it('names a single-day download after that day', () => {
    const range = customRange('2026-09-07', '2026-09-07')
    assert.equal(exportFilename('student_attendance_Commerce', range, 'csv'), 'student_attendance_Commerce_2026-09-07.csv')
  })
})

describe('staff attendance sheets', () => {
  const range = monthRange('2026-09')
  const records = [
    record('f1', '2026-09-01', 'present', { note: 'Duty at exam centre, room 12' }),
    record('f1', '2026-09-02', 'leave'),
    record('f2', '2026-09-01', 'late'),
  ]
  const summaries = summarizeByFaculty(records, ROSTER, range)
  const register = buildRegister(records, ROSTER, range)

  it('builds a detail row per record, sorted by date then name', () => {
    const sheet = buildStaffDetailSheet(records, range)
    assert.equal(sheet.rows.length, 3)
    assert.deepEqual(sheet.rows[0].slice(0, 3), ['2026-09-01', '01 Sep 2026', 'Asha Rao'])
    assert.equal(sheet.rows[0][5], 'Present')
    assert.equal(sheet.rows[0][10], 'Self')
    assert.equal(sheet.rows[2][0], '2026-09-02')
  })

  it('keeps an unmarked faculty member in the summary sheet', () => {
    const sheet = buildStaffSummarySheet(summaries, range)
    assert.equal(sheet.rows.length, 2)
    const headers = sheet.headers
    assert.ok(headers.includes('Working Days'))
    assert.ok(headers.includes('Attendance %'))
    // Bala: one late day out of 26 working days.
    const bala = sheet.rows.find((r) => r[0] === 'Bala Kumar')!
    assert.equal(bala[headers.indexOf('Working Days')], 26)
    assert.equal(bala[headers.indexOf('Attendance %')], 3.8)
  })

  it('builds a register with one column per working day', () => {
    const sheet = buildStaffRegisterSheet(register)
    assert.equal(sheet.headers.length, 2 + register.dates.length + 1)
    assert.equal(sheet.headers[0], 'Faculty')
    assert.equal(sheet.headers[sheet.headers.length - 1], '%')
    assert.equal(sheet.rows[0].length, sheet.headers.length)
  })

  it('assembles a three-sheet report the PDF/XLSX writers can consume', () => {
    const report = buildStaffAttendanceReport({ records, summaries, register, range, collegeName: 'Vriddhi College' })
    assert.equal(report.title, 'Faculty Attendance Report')
    assert.equal(report.collegeName, 'Vriddhi College')
    assert.deepEqual(report.sheets.map((s) => s.name), ['Faculty Summary', 'Monthly Register', 'Daily Records'])
    // Every sheet must have matching column weights or the PDF grid skews.
    report.sheets.forEach((sheet, i) => {
      assert.equal(report.columnWeights[i].length, sheet.headers.length, `${sheet.name} weight count`)
    })
    assert.match(report.subtitle, /September 2026/)
  })
})

describe('student attendance sheets', () => {
  const range = monthRange('2026-09')

  it('filters and sorts detail rows by the range', () => {
    const sheet = buildStudentDetailSheet(
      [
        { date: '2026-09-02', studentName: 'Zoya', regNo: 'R2', status: 'absent' },
        { date: '2026-09-01', studentName: 'Arun', regNo: 'R1', status: 'present' },
        { date: '2026-08-31', studentName: 'Out', regNo: 'R0', status: 'present' },
      ],
      range,
    )
    assert.equal(sheet.rows.length, 2, 'the August row is outside the range')
    assert.equal(sheet.rows[0][2], 'Arun')
    assert.equal(sheet.rows[0][9], 'Present')
    assert.equal(sheet.rows[1][9], 'Absent')
  })

  it('assembles a two-sheet student report', () => {
    const report = buildStudentAttendanceReport({
      detail: [{ date: '2026-09-01', studentName: 'Arun', regNo: 'R1', status: 'present' }],
      summary: [{ studentName: 'Arun', regNo: 'R1', totalClasses: 1, present: 1, absent: 0, late: 0, leave: 0, percentage: 100 }],
      range,
    })
    assert.deepEqual(report.sheets.map((s) => s.name), ['Student Summary', 'Attendance Records'])
    report.sheets.forEach((sheet, i) => {
      assert.equal(report.columnWeights[i].length, sheet.headers.length, `${sheet.name} weight count`)
    })
    assert.match(report.subtitle, /1 students/)
  })
})
