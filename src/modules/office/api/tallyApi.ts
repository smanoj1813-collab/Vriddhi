// Tally ledger mapping — colleges/{cid}/config/tally (accounts team).
import { getDoc, setDoc } from 'firebase/firestore'
import { actor, clean, nowIso, officeDoc } from './officeDb'
import { normalizeTallyLedgers, type TallyLedgerMap } from '../utils/tallyExport'

export async function fetchTallyLedgers(cid?: string): Promise<TallyLedgerMap> {
  const snap = await getDoc(officeDoc('config', 'tally', cid))
  return normalizeTallyLedgers(snap.exists() ? snap.data() : null)
}

export async function saveTallyLedgers(m: TallyLedgerMap): Promise<void> {
  await setDoc(officeDoc('config', 'tally'), clean({ ...normalizeTallyLedgers(m), updatedAt: nowIso(), updatedBy: actor().name }))
}
