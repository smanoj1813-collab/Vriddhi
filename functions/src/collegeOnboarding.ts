// Superadmin college creation/editing + reviewed scheme assignment are ONE
// transaction. A failed academic configuration must never leave a half-onboarded college.
import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { assertAcademicDocumentBudget } from './utils/firestoreBudget'
import { collegeSchemeFields } from './academic/collegeSchemes'
import { assertSchemeConfigurationRevision, pinCollegeSchemeSelection, queueSchemeAssignmentAudit, validateCollegeSchemeSelection } from './schemePacks'

const TEXT_FIELDS = ['name', 'code', 'shortName', 'address', 'city', 'state', 'country', 'location', 'phone', 'email', 'website', 'district', 'universityId', 'pincode', 'principalName', 'principalEmail', 'principalPhone', 'establishedYear', 'affiliation', 'accreditation', 'description', 'subscriptionEnd'] as const
const ENUMS: Record<string, string[]> = {
  plan: ['basic', 'standard', 'premium', 'enterprise', 'pro'],
  billingCycle: ['monthly', 'quarterly', 'yearly'],
  status: ['active', 'inactive', 'suspended', 'trial'],
  managementType: ['Government', 'Government Aided', 'Private'],
  autonomyStatus: ['Autonomous', 'Non-Autonomous'],
}
export function validateCollegeDetails(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpsError('invalid-argument', 'College details are required')
  const raw = value as Record<string, unknown>
  const clean: Record<string, unknown> = {}
  for (const field of TEXT_FIELDS) if (raw[field] !== undefined) {
    if (typeof raw[field] !== 'string' || raw[field].length > (field === 'description' ? 10000 : 1000)) throw new HttpsError('invalid-argument', `Invalid college ${field}`)
    clean[field] = raw[field].trim()
  }
  if (!clean.name || !clean.code) throw new HttpsError('invalid-argument', 'College name and code are required')
  if (String(clean.code).length > 80 || /[/\u0000-\u001f]/u.test(String(clean.code))) throw new HttpsError('invalid-argument', 'Invalid college code')
  if (clean.universityId && String(clean.universityId).includes('/')) throw new HttpsError('invalid-argument', 'Invalid university identifier')
  for (const [field, options] of Object.entries(ENUMS)) if (raw[field] !== undefined) {
    if (!options.includes(String(raw[field]))) throw new HttpsError('invalid-argument', `Invalid college ${field}`)
    clean[field] = raw[field]
  }
  for (const field of ['currentStudents', 'currentFaculty', 'courses']) if (raw[field] !== undefined) {
    if (typeof raw[field] !== 'number' || !Number.isInteger(raw[field]) || raw[field] < 0 || raw[field] > 10000000) throw new HttpsError('invalid-argument', `Invalid college ${field}`)
    clean[field] = raw[field]
  }
  if (raw.offeredCourses !== undefined) {
    if (!Array.isArray(raw.offeredCourses) || raw.offeredCourses.length > 30 || raw.offeredCourses.some(c => typeof c !== 'string' || c.length > 80)) throw new HttpsError('invalid-argument', 'Invalid offered programmes')
    clean.offeredCourses = [...new Set(raw.offeredCourses)]
  }
  // Unknown fields, counters, client snapshots, audit actors and protected
  // academic fields are intentionally not spread into the server document.
  return clean
}

export const saveCollegeWithSchemes = onCall({ region: 'asia-south1' }, async request => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const uid = request.auth.uid
  const user = await admin.firestore().collection('users').doc(uid).get()
  if (!user.exists || String(request.auth.token.role || user.data()?.role || '').toLowerCase() !== 'superadmin') throw new HttpsError('permission-denied', 'Only a platform superadmin may onboard or edit colleges')
  const raw = (request.data || {}) as Record<string, unknown>
  const details = validateCollegeDetails(raw.details)
  const selection = raw.selection === undefined ? undefined : validateCollegeSchemeSelection(raw.selection)
  const db = admin.firestore()
  const id = raw.collegeId === undefined ? '' : raw.collegeId
  if (typeof id !== 'string' || id.includes('/')) throw new HttpsError('invalid-argument', 'Invalid college identifier')
  const ref = id ? db.collection('colleges').doc(id) : db.collection('colleges').doc()
  return db.runTransaction(async transaction => {
    const [existing, system] = await transaction.getAll(ref, db.collection('systemConfig').doc('app'))
    if (id && !existing.exists) throw new HttpsError('not-found', 'College not found')
    if (!id && system.exists && system.data()?.allowCollegeOnboarding !== true) throw new HttpsError('failed-precondition', 'College onboarding is disabled in System Management')
    const duplicates = await transaction.get(db.collection('colleges').where('code', '==', details.code).limit(2))
    if (duplicates.docs.some(d => d.id !== ref.id)) throw new HttpsError('already-exists', 'College code is already in use. Open the existing college or choose another code.')
    if (details.universityId) {
      const university = await transaction.get(db.collection('universities').doc(String(details.universityId)))
      if (!university.exists) throw new HttpsError('invalid-argument', 'Choose a seeded university, or leave affiliation unconfigured')
      details.universityName = String(university.data()?.name || '')
      details.universityCode = String(university.data()?.code || '')
    } else if (details.universityId === '') {
      details.universityName = ''
      details.universityCode = ''
    }
    if (selection && id) assertSchemeConfigurationRevision(raw.expectedConfigurationRevision, existing.data()!)
    const configuration = selection ? await pinCollegeSchemeSelection(ref.id, selection, transaction, existing.data()) : undefined
    const now = admin.firestore.FieldValue.serverTimestamp()
    const data = { ...details, updatedAt: now,
      ...(configuration ? { ...collegeSchemeFields(configuration), schemePackAssignedAt: now, schemePackAssignedBy: uid } : {}) }
    const created = { plan: 'standard', billingCycle: 'monthly', status: 'active', ...data, createdAt: now, createdBy: uid, studentCount: 0, facultyCount: 0, adminCount: 0 }
    assertAcademicDocumentBudget(id ? { ...existing.data(), ...data } : created)
    if (id) transaction.update(ref, data)
    else transaction.create(ref, created)
    if (configuration) queueSchemeAssignmentAudit(transaction, ref.id, uid, configuration, existing.data())
    return { collegeId: ref.id, configurationRevision: configuration?.revision ?? Number(existing.data()?.schemeConfigurationRevision || 0) }
  })
})
