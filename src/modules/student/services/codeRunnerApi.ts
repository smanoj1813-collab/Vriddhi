import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'
import type { CodingLanguage } from '../codingLabCatalog'

export interface RunStudentCodeInput {
  language: CodingLanguage
  sourceCode: string
  stdin: string
}

export interface RunStudentCodeResult {
  statusId: number
  status: string
  stdout: string
  stderr: string
  compileOutput: string
  message: string
  time: string | null
  memory: number | null
  dailyLimit: number
  dailyRemaining: number
}

const runStudentCodeCallable = httpsCallable<RunStudentCodeInput, RunStudentCodeResult>(
  functions,
  'runStudentCode',
  { timeout: 25_000 },
)

/** Runs code in the server-configured Judge0 sandbox. Source is never saved by this client. */
export async function runStudentCode(input: RunStudentCodeInput): Promise<RunStudentCodeResult> {
  const response = await runStudentCodeCallable(input)
  return response.data
}
