// functions/src/data/prepPapers/index.ts
//
// Previous-year university question papers shipped with the Prep platform.
// Each program file holds compact PrepPaperSeed records transcribed from
// papers that universities and their affiliated colleges publish openly;
// every record cites the public source it was taken from.
//
// Text is English-only: the Kannada rendering printed beside each question on
// Karnataka papers is not reproduced. Amounts and dates in accounting /
// statistics problems are transcribed as printed.

import { expandPrepPaperSeeds, type PrepPaper, type PrepPaperSeed } from '../../prepPapers'
import { BCOM_PAPERS } from './bcomPapers'
import { BBA_PAPERS } from './bbaPapers'
import { BSC_PAPERS } from './bscPapers'
import { BA_PAPERS } from './baPapers'
import { BBM_PAPERS } from './bbmPapers'

export const PREP_PAPER_SEEDS: PrepPaperSeed[] = [
  ...BCOM_PAPERS,
  ...BBA_PAPERS,
  ...BSC_PAPERS,
  ...BA_PAPERS,
  ...BBM_PAPERS,
]

/** Fully expanded documents, ready for prep_papers/{id}. */
export const SEEDED_PREP_PAPERS: PrepPaper[] = expandPrepPaperSeeds(PREP_PAPER_SEEDS)
