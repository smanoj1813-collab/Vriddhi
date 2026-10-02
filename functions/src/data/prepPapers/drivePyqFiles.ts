// Public file links supplied by the user. These are original-PDF PYQs, not AI
// questions or verified transcriptions. Keep this bundle separate from the
// existing university-attributed text papers so seeding is an explicit choice.
import sources from './drivePyqSources.json'
import { prepareDrivePyqFiles, type DrivePyqGroup } from '../../prepPaperFiles'

export const DRIVE_PYQ_SOURCE_GROUPS = sources.groups as DrivePyqGroup[]
export const DRIVE_PYQ_PREPARATION = prepareDrivePyqFiles(DRIVE_PYQ_SOURCE_GROUPS, sources.recordedOn)
export const SEEDED_DRIVE_PYQ_FILES = DRIVE_PYQ_PREPARATION.papers
export const DRIVE_PYQ_SOURCE_URL = sources.sourceFolderUrl
