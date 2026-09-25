import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLibraryAnnualReport, yearBounds } from './libraryReports'

test('annual library report (NAAC 4.2) aggregates holdings, additions, circulation and footfall', () => {
  const r = buildLibraryAnnualReport({
    from: '2025-06-01',
    to: '2026-05-31',
    titles: [
      { id: 't1', type: 'book', title: 'Accounts', price: 500, department: 'Commerce', category: 'Textbook' },
      { id: 't2', type: 'book', title: 'Novel', price: 200, department: '', category: 'General' },
      { id: 'e1', type: 'database', title: 'N-LIST', price: 5900, department: '', category: '' },
      { id: 'j1', type: 'journal', title: 'Indian Journal of Commerce', price: 0, department: '', category: 'Journal' },
    ],
    copies: [
      { titleId: 't1', status: 'available', price: 500, acquiredOn: '2025-07-01', source: 'purchase' },
      { titleId: 't1', status: 'issued', price: 500, acquiredOn: '2024-07-01', source: 'purchase' },
      { titleId: 't2', status: 'available', price: 200, acquiredOn: '2025-08-01', source: 'donation' },
      { titleId: 't2', status: 'lost', price: 200, acquiredOn: '2020-01-01', source: 'purchase' },
    ],
    loans: [
      { titleId: 't1', titleName: 'Accounts', memberId: 's1', memberType: 'student', department: '', course: 'B.Com', issueDate: '2025-09-01' },
      { titleId: 't1', titleName: 'Accounts', memberId: 's2', memberType: 'student', department: '', course: 'B.Com', issueDate: '2025-10-01' },
      { titleId: 't2', titleName: 'Novel', memberId: 'f1', memberType: 'faculty', department: 'English', course: '', issueDate: '2025-10-05' },
      { titleId: 't2', titleName: 'Novel', memberId: 's1', memberType: 'student', department: '', course: 'B.Com', issueDate: '2024-10-05' },
    ],
    visits: [
      { memberType: 'student', date: '2025-09-01' },
      { memberType: 'student', date: '2025-09-01' },
      { memberType: 'faculty', date: '2025-09-02' },
    ],
  })
  assert.deepEqual(r.holdings.titles, 2)
  assert.equal(r.holdings.volumes, 3) // lost copy excluded
  assert.equal(r.holdings.value, 1200)
  assert.deepEqual(r.additions, { volumes: 2, titles: 2, value: 700, purchased: 1, donated: 1 })
  assert.equal(r.eResources.databases, 1)
  assert.equal(r.eResources.annualCost, 5900)
  assert.equal(r.periodicals.printJournals, 1)
  assert.equal(r.circulation.issues, 3)
  assert.equal(r.circulation.uniqueBorrowers, 3)
  assert.equal(r.circulation.studentIssues, 2)
  assert.deepEqual(r.circulation.byDepartment[0], { department: 'B.Com', issues: 2 })
  assert.deepEqual(r.topTitles[0], { title: 'Accounts', issues: 2 })
  assert.deepEqual(r.footfall, { visits: 3, openDays: 2, averagePerDay: 1.5, students: 2, teachers: 1 })
  assert.equal(r.losses.lost, 1)
})

test('year bounds', () => {
  assert.deepEqual(yearBounds(2025, 'academic'), { from: '2025-06-01', to: '2026-05-31' })
  assert.deepEqual(yearBounds(2025, 'financial'), { from: '2025-04-01', to: '2026-03-31' })
})
