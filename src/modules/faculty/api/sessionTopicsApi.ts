// src/modules/faculty/api/sessionTopicsApi.ts
// ─── Slice 2 S2.3 — what a faculty member can tag on a class ───────────────
//
// Feeds the topic picker shown when a session is marked complete.
//
// There are two topic stores and nothing joins them:
//   * `topics/*`        — the superadmin curriculum bank. Field is `name`, plus
//                         `subject` / `course` / `semester`. Superadmin writes
//                         only (current-firestore.rules ≈747).
//   * `facultyTopics/*` — the faculty's own ledger. Field is `title`, plus
//                         `subject` / `course`. The faculty owns these rows
//                         (rules ≈764).
//
// The picker merges both, filtered to the session's subject where possible, and
// de-duplicates on a normalised title so the same topic taught from either
// store does not appear twice.

import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/Firebase/config'

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

/**
 * Topic options for one class, best-effort from both stores.
 *
 * Subject filtering is a nicety, not a filter that can fail closed: if nothing
 * matches the session's subject the unfiltered list is returned, because a
 * picker that is empty for want of an exact subject string is worse than one
 * showing a few extra topics.
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

  // ─── Curriculum bank: topics assigned to this faculty ───────────────────
  try {
    const snap = await getDocs(
      query(collection(db, 'topics'), where('facultyId', '==', facultyId), limit(200))
    )
    snap.docs.forEach((d) => {
      const data = d.data()
      const title = String(data.name || data.title || '').trim()
      if (!title) return
      const rowSubject = String(data.subject || '')
      add({
        id: d.id,
        title,
        moduleNo: String(data.moduleNo || ''),
        moduleName: String(data.moduleName || ''),
        unit: String(data.unit || ''),
        status: String(data.status || 'active'),
        source: 'curriculum',
        covered: COVERED.includes(String(data.status || '').toLowerCase()),
        subject: rowSubject,
      })
      void rowSubject
    })
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
