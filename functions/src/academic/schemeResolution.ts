import { SCHEME_PACK_PRESETS, type AcademicContext, type UniversitySchemePack } from './schemePack'
import { normalizeSchemePack, SchemeConfigurationError } from './schemeValidation'
import { readPinnedCollegeSchemes, selectCollegeScheme, type CollegeSchemeConfiguration } from './collegeSchemes'

export interface ResolvedCollegeScheme {
  pack: UniversitySchemePack
  schemePackId: string
  origin: 'preset' | 'custom'
  revision: number
  /** Existing explicit assignments remain usable, but should be pinned on reactivation. */
  needsReconfirmation: boolean
  selection?: 'primary' | 'route'
  configurationRevision?: number
}

export interface SchemeReader {
  college: (id: string) => Promise<Record<string, unknown> | undefined>
  customPack: (id: string) => Promise<Record<string, unknown> | undefined>
}

/** No SDK dependencies: the browser and server use the identical resolution contract. */
async function readLegacyCollegeScheme(
  collegeId: string,
  reader: SchemeReader,
): Promise<ResolvedCollegeScheme> {
  if (!collegeId || collegeId.includes('/'))
    throw new SchemeConfigurationError('A valid college is required to resolve academic rules.')
  let college: Record<string, unknown> | undefined
  try {
    college = await reader.college(collegeId)
  } catch {
    throw new SchemeConfigurationError(
      'College scheme configuration could not be read. Retry; no default rules have been applied.',
    )
  }
  if (!college) throw new SchemeConfigurationError('College not found. No academic rules have been applied.')
  const id = typeof college.schemePackId === 'string' ? college.schemePackId.trim() : ''
  if (!id)
    throw new SchemeConfigurationError(
      'Scheme configuration required. Ask the college administrator to explicitly activate a scheme under Scheme Packs. BCU is not applied automatically.',
    )
  if (id.includes('/'))
    throw new SchemeConfigurationError('The assigned scheme identifier is invalid. Review Scheme Packs.')
  const preset = SCHEME_PACK_PRESETS.find((p) => p.id === id || p.code === id)
  if (!preset && !id.startsWith(`${collegeId}__`))
    throw new SchemeConfigurationError('The assigned scheme is not owned by this college.')
  if (college.schemePackSnapshot !== undefined && college.schemePackSnapshot !== null) {
    const pack = normalizeSchemePack(college.schemePackSnapshot)
    if (
      pack.id !== id ||
      pack.status !== 'active' ||
      !Number.isInteger(college.schemePackRevision) ||
      college.schemePackRevision !== pack.revision
    ) {
      throw new SchemeConfigurationError(
        'The activated scheme snapshot is invalid. Explicitly reactivate a reviewed scheme.',
      )
    }
    return {
      pack,
      schemePackId: id,
      origin: preset ? 'preset' : 'custom',
      revision: pack.revision!,
      needsReconfirmation: false,
    }
  }
  // Backward compatibility is ONLY for an existing, explicit assignment.
  if (preset)
    return {
      pack: normalizeSchemePack(preset),
      schemePackId: id,
      origin: 'preset',
      revision: 1,
      needsReconfirmation: true,
    }
  let custom: Record<string, unknown> | undefined
  try {
    custom = await reader.customPack(id)
  } catch {
    throw new SchemeConfigurationError(
      'The assigned scheme could not be read. Retry; no fallback rules have been applied.',
    )
  }
  if (!custom)
    throw new SchemeConfigurationError(
      'The assigned scheme no longer exists. Explicitly activate another reviewed scheme.',
    )
  if (custom.collegeId !== collegeId)
    throw new SchemeConfigurationError('The assigned scheme belongs to a different college.')
  const pack = normalizeSchemePack({ ...custom, id })
  if (pack.status !== 'active')
    throw new SchemeConfigurationError('The assigned scheme is not active. Review Scheme Packs.')
  return { pack, schemePackId: id, origin: 'custom', revision: pack.revision!, needsReconfirmation: true }
}


/** Read all explicitly assigned snapshots once; engines then route each student. */
export async function readCollegeSchemes(collegeId: string, reader: SchemeReader): Promise<CollegeSchemeConfiguration> {
  if (!collegeId || collegeId.includes('/')) throw new SchemeConfigurationError('A valid college is required to resolve academic rules.')
  let college: Record<string, unknown> | undefined
  try { college = await reader.college(collegeId) }
  catch { throw new SchemeConfigurationError('College scheme configuration could not be read. Retry; no default rules have been applied.') }
  if (!college) throw new SchemeConfigurationError('College not found. No academic rules have been applied.')
  const pinned = readPinnedCollegeSchemes(collegeId, college)
  if (pinned) return pinned
  if (!college.schemePackId || (typeof college.schemePackId === 'string' && !college.schemePackId.trim())) return { assignments: [], primarySchemePackId: null, routes: [], revision: 0, needsReconfirmation: false }
  const legacy = await readLegacyCollegeScheme(collegeId, { ...reader, college: async () => college })
  return { assignments: [{ schemePackId: legacy.schemePackId, revision: legacy.revision, snapshot: legacy.pack }],
    primarySchemePackId: legacy.schemePackId, routes: [], revision: 0, needsReconfirmation: legacy.needsReconfirmation }
}
export async function readCollegeScheme(collegeId: string, reader: SchemeReader, context?: AcademicContext): Promise<ResolvedCollegeScheme> {
  return selectCollegeScheme(await readCollegeSchemes(collegeId, reader), context)
}
