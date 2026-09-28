// src/modules/faculty/utils/curriculumCoverage.ts
//
// The faculty curriculum page shows the PLAN: which modules and topics a
// subject has. It had no notion of what has actually been taught, so a teacher
// who marked a topic covered on the attendance page got no confirmation back
// on the page that lists those topics — the only place the coverage data is
// rendered at all is the student portal, which the teacher never sees.
//
// The coverage evidence already exists: `facultyTopics`, the ledger row
// `completeClassSession` creates/updates when a class is closed ("Mark topics
// covered"). This module is the pure join between that ledger and the
// curriculum modules — no Firebase, so it is unit-testable, and shared with
// anything else that needs the same answer.

/**
 * Loose key for matching a topic across the ledger and the curriculum bank.
 * MUST stay identical to `normalizeTopicKey` in functions/src/classSchedule.ts
 * (the server that writes the ledger) and to the key the student portal's
 * `getMyCurriculum` uses — three implementations that must agree, or a
 * teacher marks a topic covered and the portal calls it untouched.
 */
export function normalizeTopicKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Every status the ledger uses for "this was taught". */
const COVERED_STATUSES = new Set(['completed', 'covered', 'done', 'taught'])

export function isCoveredStatus(status: unknown): boolean {
  return COVERED_STATUSES.has(String(status ?? '').trim().toLowerCase())
}

export type CoverageState = 'covered' | 'planned' | 'not-planned';

export interface LedgerTopicRow {
  id?: string;
  title?: string;
  status?: string;
  dateCovered?: string;
  coveredAt?: string;
  plannedDate?: string;
  sessionId?: string;
  subject?: string;
  subjectCode?: string;
  course?: string;
  batch?: string;
  division?: string;
  semester?: number;
}

export interface ModuleCoverage {
  topics: number;
  covered: number;
  planned: number;
  pct: number;
  state: CoverageState;
}

export interface TopicCoverage {
  title: string;
  state: CoverageState;
  coveredOn: string | null;
  plannedOn: string | null;
}

const fold = (v: unknown) => String(v ?? '').trim().toLowerCase();

/**
 * Index the ledger by normalised topic key.
 *
 * A ledger row is scoped to one subject. The key is therefore the pair
 * (subject, topic) whenever the row names a subject, and the bare topic when
 * it does not — a teacher's own planner rows (written from the Topics page)
 * carry no subject and must still count towards whatever module contains that
 * topic title.
 *
 * When two rows claim the same topic, the one that was covered wins, and the
 * EARLIER date wins: the ledger accumulates rather than replaces, so the first
 * class that taught a topic is the honest answer to "when was this covered".
 */
export function indexLedger(rows: LedgerTopicRow[]): Map<string, LedgerTopicRow> {
  const byKey = new Map<string, LedgerTopicRow>()

  /** Keep the best row for one key: covered beats planned, earlier beats later. */
  const offer = (key: string, row: LedgerTopicRow) => {
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, row)
      return
    }
    if (isCoveredStatus(existing.status) && !isCoveredStatus(row.status)) return
    if (isCoveredStatus(row.status) && !isCoveredStatus(existing.status)) {
      byKey.set(key, row)
      return
    }
    const a = String(existing.dateCovered || existing.coveredAt || '')
    const b = String(row.dateCovered || row.coveredAt || '')
    if (b && (!a || b < a)) byKey.set(key, row)
  }

  for (const row of rows) {
    const key = normalizeTopicKey(row.title)
    if (!key) continue
    const subject = fold(row.subject || row.subjectCode)
    // A row that names its subject is filed under THAT subject only. Indexing
    // it under the bare topic as well would leak one subject's coverage into
    // every other subject that happens to share a topic title — "Introduction"
    // is the most common topic name there is. Rows with no subject (the
    // teacher's own planner rows) are filed under the bare key, which is the
    // only thing they can be matched by.
    if (subject) offer(`${subject}::${key}`, row)
    else offer(key, row)
  }
  return byKey
}

function stateFor(row: LedgerTopicRow | undefined, today: string): TopicCoverage['state'] {
  if (!row) return 'not-planned'
  if (isCoveredStatus(row.status)) return 'covered'
  const planned = String(row.plannedDate || '').trim()
  if (planned && (!today || planned >= today)) return 'planned'
  return 'not-planned'
}

/**
 * Classify one module's topics against the ledger.
 *
 * `today` is passed in (rather than read from the clock) so the result is
 * deterministic and testable, and so the caller's timezone is the one that
 * decides what "planned" means.
 */
export function classifyModule(
  topics: string[],
  ledger: Map<string, LedgerTopicRow>,
  opts: { subject?: string; subjectCode?: string; today: string }
): { topics: TopicCoverage[]; coverage: ModuleCoverage } {
  const subject = fold(opts.subject || opts.subjectCode)
  const seen = new Set<string>()
  const out: TopicCoverage[] = []

  for (const raw of topics) {
    const title = String(raw ?? '').trim()
    const key = normalizeTopicKey(title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const row = (subject ? ledger.get(`${subject}::${key}`) : undefined) ?? ledger.get(key)
    const state = stateFor(row, opts.today)
    out.push({
      title,
      state,
      coveredOn: state === 'covered' ? String(row?.dateCovered || row?.coveredAt || '') || null : null,
      plannedOn: state === 'planned' ? String(row?.plannedDate || '') || null : null,
    })
  }

  const covered = out.filter((t) => t.state === 'covered').length
  const planned = out.filter((t) => t.state === 'planned').length
  const total = out.length
  return {
    topics: out,
    coverage: {
      topics: total,
      covered,
      planned,
      pct: total ? Math.round((covered / total) * 100) : 0,
      state: total === 0 ? 'not-planned' : covered === total ? 'covered' : covered > 0 ? 'planned' : planned > 0 ? 'planned' : 'not-planned',
    },
  };
}

/** Today's date as YYYY-MM-DD in the caller's timezone. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
