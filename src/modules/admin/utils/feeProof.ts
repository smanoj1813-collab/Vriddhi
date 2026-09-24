// src/modules/admin/utils/feeProof.ts
//
// Pure validators + path-builders for fee payment-proof screenshots. No Firebase
// import, so they unit-test cleanly under `node --test`; api/feeProofStorage.ts
// wraps these with the actual Firebase Storage upload.

export const PROOF_MAX_BYTES = 5 * 1024 * 1024 // 5 MB
export const PROOF_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

export interface ProofFileLike {
  name: string
  type: string
  size: number
}

/** Pure: a human error string when unacceptable, or null when the file is fine. */
export function validateProofFile(file: ProofFileLike | null | undefined): string | null {
  if (!file) return 'Choose a payment screenshot to upload.'
  if (!(PROOF_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return 'Screenshot must be a PNG, JPG, WEBP or GIF image.'
  }
  if (file.size <= 0) return 'Screenshot file is empty.'
  if (file.size > PROOF_MAX_BYTES) {
    return `Screenshot is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${PROOF_MAX_BYTES / 1024 / 1024} MB.`
  }
  return null
}

/** Pure: collision-resistant, filesystem-safe object name for a screenshot. */
export function proofObjectName(fileName: string, now: number = Date.now()): string {
  const dot = fileName.lastIndexOf('.')
  const rawExt = dot > 0 ? fileName.slice(dot).toLowerCase() : ''
  const ext = /^\.(png|jpe?g|webp|gif)$/.test(rawExt) ? rawExt : '.png'
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName).replace(/[^a-zA-Z0-9_-]/g, '').slice(-40)
  return `${now}-${base || 'proof'}${ext}`
}

/** Pure: tenant-scoped Storage path — a college only ever touches its own proofs. */
export function feeProofPath(collegeId: string, paymentId: string, fileName: string): string {
  return `colleges/${collegeId}/fee-proofs/${paymentId}/${fileName}`
}
