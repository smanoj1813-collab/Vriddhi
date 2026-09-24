// src/modules/admin/api/feeProofStorage.ts
//
// Firebase Storage wrapper for fee payment-proof screenshots. The pure
// validation/path logic lives in ../utils/feeProof (unit-tested); this module
// performs the actual upload and returns a download URL to store on the
// transaction. Screenshots live under colleges/{collegeId}/fee-proofs/… so a
// college can only ever reach its own tenant's proofs (mirrors Firestore
// tenancy); storage.rules enforces the same boundary.

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/Firebase/config'
import { feeProofPath, proofObjectName, validateProofFile } from '../utils/feeProof'

export { feeProofPath, proofObjectName, validateProofFile } from '../utils/feeProof'

/** Uploads a payment screenshot to the tenant's fee-proofs folder; returns its download URL. */
export async function uploadPaymentProof(
  collegeId: string,
  paymentId: string,
  file: File,
): Promise<string> {
  const invalid = validateProofFile(file)
  if (invalid) throw new Error(invalid)
  if (!collegeId || !paymentId) {
    throw new Error('Missing college or fee record to attach the screenshot to.')
  }
  const objectRef = ref(storage, feeProofPath(collegeId, paymentId, proofObjectName(file.name)))
  await uploadBytes(objectRef, file, { contentType: file.type })
  return getDownloadURL(objectRef)
}
