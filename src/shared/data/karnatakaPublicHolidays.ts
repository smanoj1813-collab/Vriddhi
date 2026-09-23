// src/shared/data/karnatakaPublicHolidays.ts
// ─── UI-side convenience seed for the Academic Calendar (Auto-Scheduler v2) ──
// Bundled static list (no network dependency) so "Import Karnataka public
// holidays (year)" can pre-fill the calendar via saveCalendarEvent in a loop.
// 2026 dates follow the Karnataka DPAR (state government) holiday list;
// 2027 carries fixed-date holidays only — gazetted lunar dates (Ugadi, Deepavali,
// Eid…) must be entered manually once the state list is out. Imported rows are
// ordinary academicCalendar events: edit or delete any of them afterwards.

export interface KarnatakaPublicHoliday {
  /** yyyy-mm-dd */
  date: string
  title: string
  /** Lunar-sighting holidays move a day either way — flagged in the notes. */
  tentative?: boolean
}

export const KARNATAKA_PUBLIC_HOLIDAYS: KarnatakaPublicHoliday[] = [
  // 2026 (Karnataka DPAR list)
  { date: '2026-01-15', title: 'Makara Sankranti (Uttarayana Punyakala)' },
  { date: '2026-01-26', title: 'Republic Day' },
  { date: '2026-03-19', title: 'Ugadi' },
  { date: '2026-03-21', title: 'Khutub-E-Ramzan (Id-ul-Fitr)', tentative: true },
  { date: '2026-03-31', title: 'Mahaveera Jayanthi' },
  { date: '2026-04-03', title: 'Good Friday' },
  { date: '2026-04-14', title: 'Dr B R Ambedkar Jayanthi' },
  { date: '2026-04-20', title: 'Basava Jayanthi / Akshaya Tritiya' },
  { date: '2026-05-01', title: 'May Day' },
  { date: '2026-05-28', title: 'Bakrid (Eid al-Adha)', tentative: true },
  { date: '2026-06-26', title: 'Last Day of Moharam', tentative: true },
  { date: '2026-08-15', title: 'Independence Day' },
  { date: '2026-08-26', title: 'Eid-Milad', tentative: true },
  { date: '2026-09-14', title: 'Varasiddhi Vinayaka Vrata' },
  { date: '2026-10-02', title: 'Gandhi Jayanthi' },
  { date: '2026-10-20', title: 'Mahanavami / Ayudhapooja' },
  { date: '2026-10-21', title: 'Vijayadasami' },
  { date: '2026-11-10', title: 'Balipadyami / Deepavali' },
  { date: '2026-11-27', title: 'Kanakadasa Jayanthi' },
  { date: '2026-12-25', title: 'Christmas Day' },
  // 2027 (fixed-date gazetted holidays only — add lunar dates when gazetted)
  { date: '2027-01-01', title: "New Year's Day" },
  { date: '2027-01-14', title: 'Makara Sankranti (Uttarayana Punyakala)' },
  { date: '2027-01-26', title: 'Republic Day' },
  { date: '2027-04-14', title: 'Dr B R Ambedkar Jayanthi' },
  { date: '2027-05-01', title: 'May Day' },
  { date: '2027-08-15', title: 'Independence Day' },
  { date: '2027-10-02', title: 'Gandhi Jayanthi' },
  { date: '2027-11-01', title: 'Kannada Rajyotsava' },
  { date: '2027-12-25', title: 'Christmas Day' },
]

/** Years the bundle covers, for the Import button's selector. */
export function karnatakaHolidayYears(): number[] {
  const years = new Set<number>()
  for (const h of KARNATAKA_PUBLIC_HOLIDAYS) years.add(Number(h.date.slice(0, 4)))
  return [...years].sort()
}

export function karnatakaHolidaysForYear(year: number): KarnatakaPublicHoliday[] {
  return KARNATAKA_PUBLIC_HOLIDAYS.filter((h) => h.date.startsWith(`${year}-`))
}
