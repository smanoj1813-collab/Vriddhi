// src/api/materialApi.ts
// Firestore API for faculty course materials — ZERO composite indexes

import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, limit, serverTimestamp, increment,
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

export type MaterialType = 'pdf' | 'video' | 'link' | 'doc' | 'ppt'

export interface Material {
  id: string
  title: string
  type: MaterialType
  topic: string
  subject: string
  batch: string
  uploadDate: string
  size?: string
  url?: string
  downloads: number
  views: number
  facultyId: string
  facultyName: string
  createdAt?: string
  updatedAt?: string
}

export interface MaterialInput {
  title: string
  type: MaterialType
  topic: string
  subject: string
  batch: string
  size?: string
  url?: string
  facultyId: string
  facultyName: string
}

// ─── Read Budget Tracker ────────────────────────────────

let sessionReadCount = 0

function trackRead(count: number): boolean {
  sessionReadCount += count
  if (sessionReadCount > MAX_READS) {
    console.warn(`[MaterialApi] Read budget exceeded: ${sessionReadCount}/${MAX_READS}`)
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

export async function fetchMaterials(facultyId?: string): Promise<Material[]> {
  const constraints: any[] = [limit(MAX_READS)]
  if (facultyId) constraints.unshift(where('facultyId', '==', facultyId))

  const snap = await getDocs(query(collegeRef('materials'), ...constraints))
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data(),
      uploadDate: d.data().uploadDate || d.data().createdAt?.toDate?.().toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: d.data().createdAt?.toDate?.().toISOString() || d.data().createdAt,
      updatedAt: d.data().updatedAt?.toDate?.().toISOString() || d.data().updatedAt,
    }) as Material)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export async function fetchMaterialsBySubject(subject: string): Promise<Material[]> {
  const snap = await getDocs(
    query(collegeRef('materials'), where('subject', '==', subject), limit(MAX_READS))
  )
  if (!trackRead(snap.size)) return []

  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data(),
      uploadDate: d.data().uploadDate || d.data().createdAt?.toDate?.().toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: d.data().createdAt?.toDate?.().toISOString() || d.data().createdAt,
      updatedAt: d.data().updatedAt?.toDate?.().toISOString() || d.data().updatedAt,
    }) as Material)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

// ─── Mutations ──────────────────────────────────────────

export async function createMaterial(data: MaterialInput): Promise<Material> {
  const docData = {
    ...data,
    downloads: 0,
    views: 0,
    uploadDate: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const docRef = await addDoc(collegeRef('materials'), docData)
  return {
    id: docRef.id,
    ...data,
    downloads: 0,
    views: 0,
    uploadDate: new Date().toISOString().split('T')[0],
  }
}

export async function updateMaterial(id: string, data: Partial<MaterialInput>): Promise<void> {
  await updateDoc(collegeDocRef(`materials/${id}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteMaterial(id: string): Promise<void> {
  await deleteDoc(collegeDocRef(`materials/${id}`))
}

// ─── Optimized Counters (ZERO reads, 1 write only) ──────
// Using FieldValue.increment() — no need to read current value first

export async function incrementMaterialViews(id: string): Promise<void> {
  await updateDoc(collegeDocRef(`materials/${id}`), {
    views: increment(1),
    updatedAt: serverTimestamp(),
  })
}

export async function incrementMaterialDownloads(id: string): Promise<void> {
  await updateDoc(collegeDocRef(`materials/${id}`), {
    downloads: increment(1),
    updatedAt: serverTimestamp(),
  })
}
