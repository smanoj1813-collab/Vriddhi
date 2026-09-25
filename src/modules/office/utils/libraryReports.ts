// Pure report builders for the library — NAAC Criterion 4.2 (Library as a
// learning resource), annual report and stock register summaries.
// Unit tested; no Firebase.

export interface ReportTitle { id: string; type: string; title: string; price: number; department: string; category: string }
export interface ReportCopy { titleId: string; status: string; price: number; acquiredOn: string; source: string }
export interface ReportLoan { titleId: string; titleName: string; memberId: string; memberType: string; department: string; course: string; issueDate: string }
export interface ReportVisit { memberType: string; date: string }

export interface LibraryAnnualReport {
  period: { from: string; to: string }
  holdings: { titles: number; volumes: number; value: number; byCategory: Array<{ category: string; titles: number; volumes: number }> }
  additions: { volumes: number; titles: number; value: number; purchased: number; donated: number }
  eResources: { count: number; ebooks: number; ejournals: number; databases: number; annualCost: number }
  periodicals: { printJournals: number; magazines: number }
  circulation: { issues: number; uniqueBorrowers: number; studentIssues: number; staffIssues: number; byDepartment: Array<{ department: string; issues: number }> }
  footfall: { visits: number; openDays: number; averagePerDay: number; students: number; teachers: number }
  topTitles: Array<{ title: string; issues: number }>
  losses: { lost: number; missing: number; withdrawn: number }
}

const inPeriod = (d: string, from: string, to: string) => !!d && d.slice(0, 10) >= from && d.slice(0, 10) <= to
const IN_STOCK = new Set(['available', 'issued', 'on_hold', 'binding', 'damaged'])
const round2 = (n: number) => Math.round(n * 100) / 100

export function buildLibraryAnnualReport(input: {
  titles: ReportTitle[]
  copies: ReportCopy[]
  loans: ReportLoan[]
  visits: ReportVisit[]
  from: string
  to: string
}): LibraryAnnualReport {
  const { titles, copies, loans, visits, from, to } = input
  const titleById = new Map(titles.map(t => [t.id, t]))
  const stock = copies.filter(c => IN_STOCK.has(c.status))
  const physicalTitleIds = new Set(stock.map(c => c.titleId))

  const catMap = new Map<string, { titles: Set<string>; volumes: number }>()
  stock.forEach(c => {
    const cat = titleById.get(c.titleId)?.category || 'Uncategorised'
    const e = catMap.get(cat) || { titles: new Set<string>(), volumes: 0 }
    e.titles.add(c.titleId)
    e.volumes++
    catMap.set(cat, e)
  })

  const added = copies.filter(c => inPeriod(c.acquiredOn, from, to))
  const eTitles = titles.filter(t => ['ebook', 'ejournal', 'database'].includes(t.type))

  const periodLoans = loans.filter(l => inPeriod(l.issueDate, from, to))
  const deptMap = new Map<string, number>()
  const titleMap = new Map<string, { title: string; issues: number }>()
  periodLoans.forEach(l => {
    const dept = l.department || l.course || 'Other'
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
    const t = titleMap.get(l.titleId) || { title: l.titleName, issues: 0 }
    t.issues++
    titleMap.set(l.titleId, t)
  })

  const periodVisits = visits.filter(v => inPeriod(v.date, from, to))
  const openDays = new Set(periodVisits.map(v => v.date.slice(0, 10))).size

  return {
    period: { from, to },
    holdings: {
      titles: physicalTitleIds.size,
      volumes: stock.length,
      value: round2(stock.reduce((s, c) => s + (Number(c.price) || 0), 0)),
      byCategory: [...catMap.entries()].map(([category, e]) => ({ category, titles: e.titles.size, volumes: e.volumes })).sort((a, b) => b.volumes - a.volumes),
    },
    additions: {
      volumes: added.length,
      titles: new Set(added.map(c => c.titleId)).size,
      value: round2(added.reduce((s, c) => s + (Number(c.price) || 0), 0)),
      purchased: added.filter(c => c.source === 'purchase').length,
      donated: added.filter(c => c.source !== 'purchase').length,
    },
    eResources: {
      count: eTitles.length,
      ebooks: eTitles.filter(t => t.type === 'ebook').length,
      ejournals: eTitles.filter(t => t.type === 'ejournal').length,
      databases: eTitles.filter(t => t.type === 'database').length,
      annualCost: round2(eTitles.reduce((s, t) => s + (Number(t.price) || 0), 0)),
    },
    periodicals: {
      printJournals: titles.filter(t => t.type === 'journal').length,
      magazines: titles.filter(t => t.type === 'magazine').length,
    },
    circulation: {
      issues: periodLoans.length,
      uniqueBorrowers: new Set(periodLoans.map(l => l.memberId)).size,
      studentIssues: periodLoans.filter(l => l.memberType === 'student').length,
      staffIssues: periodLoans.filter(l => l.memberType !== 'student').length,
      byDepartment: [...deptMap.entries()].map(([department, issues]) => ({ department, issues })).sort((a, b) => b.issues - a.issues),
    },
    footfall: {
      visits: periodVisits.length,
      openDays,
      averagePerDay: openDays ? Math.round((periodVisits.length / openDays) * 10) / 10 : 0,
      students: periodVisits.filter(v => v.memberType === 'student').length,
      teachers: periodVisits.filter(v => v.memberType !== 'student').length,
    },
    topTitles: [...titleMap.values()].sort((a, b) => b.issues - a.issues).slice(0, 10),
    losses: {
      lost: copies.filter(c => c.status === 'lost').length,
      missing: copies.filter(c => c.status === 'missing').length,
      withdrawn: copies.filter(c => c.status === 'withdrawn').length,
    },
  }
}

/** Academic year (June–May) or financial year (April–March) bounds. */
export function yearBounds(startYear: number, kind: 'academic' | 'financial'): { from: string; to: string } {
  return kind === 'academic'
    ? { from: `${startYear}-06-01`, to: `${startYear + 1}-05-31` }
    : { from: `${startYear}-04-01`, to: `${startYear + 1}-03-31` }
}
