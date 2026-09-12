// src/modules/faculty/api/sessionTopicsApi.ts
// ─── Slice 2 S2.3 — what a faculty member can tag on a class ───────────────
//
// Feeds the topic picker shown when a session is marked complete, and the
// faculty Topics page's "Curriculum topics" section.
//
// There are two topic stores and nothing joins them:
//   * `topics/*`        — the superadmin curriculum bank. Field is `name`, plus
//                         `subject` / `course` / `semester`. Superadmin writes
//                         only (current-firestore.rules ≈798). Bank rows carry
//                         NO facultyId — assignment to a person is derived from
//                         the subjects on their curriculumFacultyMappings.
//   * `facultyTopics/*` — the faculty's own ledger. Field is `title`, plus
//                         `subject` / `course`. The faculty owns these rows
//                         (rules ≈815).
//
// The merge keeps both, filtered to the session's subject where possible, and
// de-duplicates on a normalised title so the same topic taught from either
// store does not appear twice.

import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { resolveFacultyAliases } from '../../admin/api/curriculumMappingApi'
import { fetchFacultyWeeklySchedule } from '../../admin/api/scheduleApi'

export interface SessionTopicOption {
  /** Document id — `topics/*` ids go into the session's `topicIds`. */
  id: string
  title: string
  moduleNo?: string
  moduleName?: string
  unit?: string
  status: string
  /** Which store the option came from. */
  source: 'curriculum' | 'ledger'
  covered: boolean
  subject?: string
  course?: string
  semester?: number
}

const COVERED = ['covered', 'completed']

/** Loose key for de-duplication: "Integration  by Parts" === "integration by parts". */
function topicKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchesSubject(candidate: string | undefined, wanted: string): boolean {
  if (!wanted) return true
  const a = topicKey(candidate || '')
  const b = topicKey(wanted)
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

/** Subjects this faculty member teaches, from curriculum mappings + timetable. */
async function fetchTaughtSubjects(facultyId: string): Promise<Set<string>> {
  const subjects = new Set<string>()
  const aliases = await resolveFacultyAliases(facultyId).catch(() => null)

  try {
    const snap = await getDocs(
      query(collection(db, 'curriculumFacultyMappings'), limit(200))
    )
    snap.docs.forEach((d) => {
      const data = d.data()
      const mine = aliases
        ? aliases.ids.includes(String(data.facultyId || '')) ||
          (aliases.email &&
            String(data.facultyEmail || '').trim().toLowerCase() === aliases.email)
        : String(data.facultyId || '') === facultyId
      if (!mine) return
      const name = String(data.courseName || '').trim()
      const code = String(data.courseCode || '').trim()
      if (name) subjects.add(name.toLowerCase())
      if (code) subjects.add(code.toLowerCase())
    })
  } catch (err) {
    console.warn('[SessionTopics] mapping subject lookup failed:', err)
  }

  // The timetable is the second source of "what do I teach" — it works even
  // when no curriculum has been mapped yet.
  try {
    const weekly = await fetchFacultyWeeklySchedule(facultyId)
    weekly.forEach((w) => {
      if (w.subject) subjects.add(String(w.subject).trim().toLowerCase())
      if (w.subjectCode) subjects.add(String(w.subjectCode).trim().toLowerCase())
    })
  } catch (err) {
    console.warn('[SessionTopics] schedule subject lookup failed:', err)
  }

  subjects.delete('')
  return subjects
}

/**
 * Curriculum-bank topics for this faculty member.
 *
 * Bank rows have no facultyId, so relevance is derived from the subjects the
 * faculty teaches (mappings first, timetable as fallback). A bank topic is
 * included when its subject matches one of those — or, when nothing could be
 * resolved, the whole bank is surfaced rather than an empty list, because a
 * picker that is empty for want of an exact subject string is worse than one
 * showing a few extra topics.
 */
export async function fetchFacultyCurriculumTopics(facultyId: string): Promise<SessionTopicOption[]> {
  if (!facultyId) return []

  const [taught, bankSnap] = await Promise.all([
    fetchTaughtSubjects(facultyId),
    // Rules allow any staff member to list `topics`; the bank is small, so one
    // bounded read + client-side subject filter beats per-subject queries
    // (each of which would need a composite index).
    getDocs(query(collection(db, 'topics'), limit(500))).catch((err) => {
      console.warn('[SessionTopics] curriculum bank lookup failed:', err)
      return null
    }),
  ])

  const rows: SessionTopicOption[] = []
  bankSnap?.docs.forEach((d) => {
    const data = d.data()
    const title = String(data.name || data.title || '').trim()
    if (!title) return
    const rowSubject = String(data.subject || '')
    rows.push({
      id: d.id,
      title,
      moduleNo: String(data.moduleNo || ''),
      moduleName: String(data.moduleName || ''),
      unit: String(data.unit || ''),
      status: String(data.status || 'active'),
      source: 'curriculum',
      covered: COVERED.includes(String(data.status || '').toLowerCase()),
      subject: rowSubject,
      course: String(data.course || ''),
      semester: Number(data.semester) || undefined,
    })
  })

  if (taught.size === 0) return rows
  const matched = rows.filter(
    (row) => [...taught].some((s) => matchesSubject(row.subject, s) || matchesSubject(row.course, s)),
  )
  return matched.length > 0 ? matched : rows
}

/**
 * Topic options for one class, best-effort from both stores.
 *
 * Subject filtering is a nicety, not a filter that can fail closed: if nothing
 * matches the session's subject the unfiltered list is returned.
 */
export async function fetchSessionTopicOptions(input: {
  facultyId: string
  subject?: string
  subjectCode?: string
}): Promise<SessionTopicOption[]> {
  const { facultyId, subject = '', subjectCode = '' } = input
  if (!facultyId) return []

  const results = new Map<string, SessionTopicOption>()

  const add = (option: SessionTopicOption) => {
    const key = topicKey(option.title)
    if (!key) return
    const existing = results.get(key)
    // A curriculum row wins over a ledger row with the same title, because
    // only the curriculum row has a stable id to store in `topicIds`.
    if (!existing || (existing.source === 'ledger' && option.source === 'curriculum')) {
      results.set(key, option)
    }
  }

  // ─── Curriculum bank: topics for the subjects this faculty teaches ──────
  try {
    const bank = await fetchFacultyCurriculumTopics(facultyId)
    bank.forEach(add)
  } catch (err) {
    console.warn('[SessionTopics] curriculum topic lookup failed:', err)
  }

  // ─── Faculty ledger: rows the faculty already plans against ─────────────
  try {
    const snap = await getDocs(
      query(collection(db, 'facultyTopics'), where('facultyId', '==', facultyId), limit(300))
    )
    snap.docs.forEach((d) => {
      const data = d.data()
      const title = String(data.title || data.name || '').trim()
      if (!title) return
      add({
        id: d.id,
        title,
        moduleNo: String(data.moduleNo || ''),
        moduleName: String(data.moduleName || ''),
        unit: String(data.unit || ''),
        status: String(data.status || 'pending'),
        source: 'ledger',
        covered: COVERED.includes(String(data.status || '').toLowerCase()),
        subject: String(data.subject || ''),
      })
    })
  } catch (err) {
    console.warn('[SessionTopics] faculty topic lookup failed:', err)
  }

  const all = [...results.values()].sort((a, b) => a.title.localeCompare(b.title))
  const wanted = subject || subjectCode
  const filtered = wanted ? all.filter((option) => matchesSubject(option.subject, wanted)) : all
  return filtered.length > 0 ? filtered : all
}
