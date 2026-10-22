// Client wrappers for the semester-promotion callables.
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'

export interface PromotionPolicyInput {
  maxBacklogsToPromote: number
  requireAllClearForGraduation: boolean
  programmeSemesters: number
}

export type PromotionAction = 'promote' | 'detain' | 'graduate' | 'repeat_final' | 'skip'

export interface PromotionRow {
  studentId: string
  name: string
  regNo: string
  branch: string
  batch: string
  action: PromotionAction
  fromSemester: number
  toSemester: number
  backlogs: { subjectCode: string; subjectName: string; semester: number }[]
  reason: string
}

const previewFn = httpsCallable<
  { policy: PromotionPolicyInput; filter: { batch?: string; branch?: string; semester?: number } },
  { policy: PromotionPolicyInput; counts: Record<string, number>; rows: PromotionRow[] }
>(functions, 'previewPromotion')

const runFn = httpsCallable<
  { runId: string; policy: PromotionPolicyInput; decisions: { studentId: string; action: PromotionAction }[]; note?: string },
  { alreadyApplied: boolean; counts: Record<string, number> }
>(functions, 'runPromotion')

export async function previewPromotion(policy: PromotionPolicyInput, filter: { batch?: string; branch?: string; semester?: number }) {
  const res = await previewFn({ policy, filter })
  return res.data
}

export async function runPromotion(runId: string, policy: PromotionPolicyInput, decisions: { studentId: string; action: PromotionAction }[], note?: string) {
  const res = await runFn({ runId, policy, decisions, note })
  return res.data
}
