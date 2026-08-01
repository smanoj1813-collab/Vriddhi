// src/api/topicApi.ts
// Firestore API for faculty syllabus topics — ZERO composite indexes

import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../../Firebase/config'

const MAX_READS = 500

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id')
  if (!id) throw new Error('No college ID found')
  return id
}

function collegeRef(path: string) {
  return collection(db, 'colleges', getCollegeId(), path)
}

function collegeDocRef(path: string) {
  return doc(db, 'colleges', getCollegeId(), path)
}

// ─── Types ──────────────────────────────────────────────

export type TopicStatus = 'planned' | 'in-progress' | 'completed' | 'delayed'

export interface FacultyTopic {
  id: string
  title: string
  description: string
  subject: string
  course: string
  batch: string
  division: string
  plannedDate: string
  status: TopicStatus
  duration: number // in minutes
  resources: string[]
  notes: string
  facultyId: string
  facultyName: string
  createdAt?: string
  updatedAt?: string
}

export interface TopicInput {
  title: string
  description: string
  subject: string
  course: string
  batch: string
  division: string
  plannedDate: string
  status: TopicStatus
  duration: number
  resources: string[]
  notes: string
  facultyId: string
  facultyName: string
}

// ─── Read Budget Tracker ────────────────────────────────

let sessionReadCount = 0

function trackRead(count: number): boolean {
  sessionReadCount += count
  if (sessionReadCount > MAX_READS) {
    console.warn(`[TopicApi] Read budget exceeded: ${sessionReadCount}/${MAX_READS}`)
    return false
  }
  return true
}

export function getReadCount(): number {
  return sessionReadCount
}

export function resetReadCount(): void {
  sessionReadCount = 0
}

// ─── Fetchers (NO orderBy + where combo) ──────────────

export async function fetchTopics(facultyId?: string): Promise<FacultyTopic[]> {
  const constraints: any[] = [limit(MAX_READS)]
  if (facultyId) constraints.unshift(where('facultyId', '==', facultyId))

  const snap = await getDocs(query(collegeRef('facultyTopics'), ...constraints))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data(),
      plannedDate: d.data().plannedDate || d.data().createdAt?.toDate?.().toISOString()?.split('T')[0] || '',
      createdAt: d.data().createdAt?.toDate?.().toISOString() || d.data().createdAt,
      updatedAt: d.data().updatedAt?.toDate?.().toISOString() || d.data().updatedAt,
    }) as FacultyTopic)
    .sort((a, b) => {
      // Sort by plannedDate, then by title
      const dateA = a.plannedDate || ''
      const dateB = b.plannedDate || ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return a.title.localeCompare(b.title)
    })
}

export async function fetchTopicsBySubject(subject: string): Promise<FacultyTopic[]> {
  const snap = await getDocs(
    query(collegeRef('facultyTopics'), where('subject', '==', subject), limit(MAX_READS))
  )
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data(),
      plannedDate: d.data().plannedDate || '',
      createdAt: d.data().createdAt?.toDate?.().toISOString() || d.data().createdAt,
      updatedAt: d.data().updatedAt?.toDate?.().toISOString() || d.data().updatedAt,
    }) as FacultyTopic)
    .sort((a, b) => (a.plannedDate || '').localeCompare(b.plannedDate || ''))
}

// ─── Mutations ──────────────────────────────────────────

export async function createTopic(data: TopicInput): Promise<FacultyTopic> {
  const docData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const docRef = await addDoc(collegeRef('facultyTopics'), docData)
  return {
    id: docRef.id,
    ...data,
  }
}

export async function updateTopic(id: string, data: Partial<TopicInput>): Promise<void> {
  await updateDoc(collegeDocRef(`facultyTopics/${id}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTopic(id: string): Promise<void> {
  await deleteDoc(collegeDocRef(`facultyTopics/${id}`))
}
