import { SCHEME_PACK_PRESETS, type AcademicContext, type UniversitySchemePack } from './schemePack'
import { academicKey, normalizeSchemePack, SchemeConfigurationError } from './schemeValidation'

export interface SchemePackChoice { schemePackId: string; revision: number }
export interface CollegeSchemeRoute extends AcademicContext { schemePackId: string }
export interface CollegeSchemeSelection {
  assignments: SchemePackChoice[]
  primarySchemePackId: string | null
  routes: CollegeSchemeRoute[]
}
export interface PinnedSchemeAssignment extends SchemePackChoice { snapshot: UniversitySchemePack }
export interface CollegeSchemeConfiguration {
  assignments: PinnedSchemeAssignment[]
  primarySchemePackId: string | null
  routes: CollegeSchemeRoute[]
  revision: number
  needsReconfirmation: boolean
}
const fail = (message: string): never => { throw new SchemeConfigurationError(message) }
export function normalizeCollegeSchemeSelection(value: unknown): CollegeSchemeSelection {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('College scheme selection is required')
  const r = value as Record<string, unknown>
  if (!Array.isArray(r.assignments) || r.assignments.length > 10) return fail('Select at most 10 scheme packs')
  const assignments = r.assignments.map((v): SchemePackChoice => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return fail('Invalid scheme assignment')
    const a = v as Record<string, unknown>
    if (typeof a.schemePackId !== 'string' || !a.schemePackId.trim() || a.schemePackId.length > 200 || a.schemePackId.includes('/')) return fail('Invalid scheme identifier')
    if (typeof a.revision !== 'number' || !Number.isInteger(a.revision) || a.revision < 1 || a.revision > 100000) return fail('Review a valid scheme revision before assigning')
    return { schemePackId: a.schemePackId.trim(), revision: a.revision }
  })
  const ids = new Set(assignments.map(a => a.schemePackId))
  if (ids.size !== assignments.length) return fail('Duplicate assigned scheme packs')
  const primarySchemePackId = r.primarySchemePackId == null || r.primarySchemePackId === '' ? null : r.primarySchemePackId
  if ((assignments.length && (typeof primarySchemePackId !== 'string' || !ids.has(primarySchemePackId))) || (!assignments.length && primarySchemePackId !== null)) return fail('Choose exactly one primary from the assigned scheme packs')
  if (!Array.isArray(r.routes) || r.routes.length > 100) return fail('At most 100 programme/cohort routes are supported')
  const routes = r.routes.map((value): CollegeSchemeRoute => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Invalid scheme route')
    const route = value as Record<string, unknown>
    if (typeof route.schemePackId !== 'string' || !ids.has(route.schemePackId)) return fail('Every route must use an assigned scheme pack')
    const result: CollegeSchemeRoute = { schemePackId: route.schemePackId }
    for (const key of ['programme', 'batch'] as const) {
      if (route[key] !== undefined && route[key] !== '') {
        if (typeof route[key] !== 'string' || route[key].length > 120 || !academicKey(route[key])) return fail(`Route ${key} must identify a real scope`)
        result[key] = route[key].trim()
      }
    }
    if (route.semester !== undefined && route.semester !== null && route.semester !== '') {
      if (typeof route.semester !== 'number' || !Number.isInteger(route.semester) || route.semester < 1 || route.semester > 20) return fail('Route semester must be between 1 and 20')
      result.semester = route.semester
    }
    if (!result.programme && !result.batch && !result.semester) return fail('A route needs a programme, batch or semester; use Primary for the college-wide default')
    return result
  })
  const scope = (r: CollegeSchemeRoute) => `${academicKey(r.programme)}|${academicKey(r.batch)}|${r.semester ?? ''}`
  if (new Set(routes.map(scope)).size !== routes.length) return fail('Duplicate/competing scheme routes for the same scope')
  // Intersecting equal-specificity routes must not silently pick a pack by order.
  for (let i = 0; i < routes.length; i++) for (let j = i + 1; j < routes.length; j++) {
    const a = routes[i], b = routes[j]
    if (a.schemePackId !== b.schemePackId && specificity(a) === specificity(b) &&
      (!a.programme || !b.programme || academicKey(a.programme) === academicKey(b.programme)) &&
      (!a.batch || !b.batch || academicKey(a.batch) === academicKey(b.batch)) &&
      (!a.semester || !b.semester || a.semester === b.semester)) return fail('Equally specific scheme routes overlap; narrow their programme/cohort scope')
  }
  return { assignments, primarySchemePackId: primarySchemePackId as string | null, routes }
}
const specificity = (r: CollegeSchemeRoute) => Number(!!r.programme) + Number(!!r.batch) + Number(!!r.semester)

/** Resolve the institution's explicit route, not a caller-selected university.
 * With no context this returns the explicitly chosen PRIMARY for settings views.
 * Official grading must provide the linked student's server-owned context. */
export function selectCollegeScheme(configuration: CollegeSchemeConfiguration, context?: AcademicContext) {
  if (!configuration.assignments.length || !configuration.primarySchemePackId) return fail('Scheme configuration required. No university is selected automatically.')
  let id = configuration.primarySchemePackId
  let selection: 'primary' | 'route' = 'primary'
  if (context) {
    const possible = configuration.routes.filter(r =>
      (!r.programme || !context.programme || academicKey(r.programme) === academicKey(context.programme)) &&
      (!r.batch || !context.batch || academicKey(r.batch) === academicKey(context.batch)) &&
      (!r.semester || !context.semester || r.semester === context.semester))
    if (possible.some(r => (r.programme && !context.programme) || (r.batch && !context.batch) || (r.semester && !context.semester))) return fail('Student programme, batch or semester is missing; the assigned scheme route cannot be determined safely')
    possible.sort((a, b) => specificity(b) - specificity(a))
    if (possible.length) {
      const top = possible.filter(r => specificity(r) === specificity(possible[0]))
      if (new Set(top.map(r => r.schemePackId)).size > 1) return fail('Ambiguous assigned schemes; ask the college to review programme/cohort routes')
      id = possible[0].schemePackId
      selection = 'route'
    }
  }
  const assignment = configuration.assignments.find(a => a.schemePackId === id)
  if (!assignment) return fail('The selected primary/routed pack is not assigned to this college')
  return { pack: assignment.snapshot, schemePackId: id, revision: assignment.revision,
    origin: (id.includes('__') ? 'custom' : 'preset') as 'custom' | 'preset',
    needsReconfirmation: configuration.needsReconfirmation, selection,
    configurationRevision: configuration.revision }
}

export function readPinnedCollegeSchemes(collegeId: string, college: Record<string, unknown>): CollegeSchemeConfiguration | null {
  if (college.schemePackAssignments === undefined) return null // explicit legacy adapter handles only old bindings
  if (!Array.isArray(college.schemePackAssignments)) return fail('Assigned scheme configuration is malformed')
  const selection = normalizeCollegeSchemeSelection({ assignments: college.schemePackAssignments, primarySchemePackId: college.primarySchemePackId, routes: college.schemePackRoutes })
  if (typeof college.schemeConfigurationRevision !== 'number' || !Number.isInteger(college.schemeConfigurationRevision) || college.schemeConfigurationRevision < 1) return fail('Assigned scheme configuration revision is invalid')
  const assignments = selection.assignments.map((choice, i) => {
    const raw = (college.schemePackAssignments as Array<Record<string, unknown>>)[i]
    const snapshot = normalizeSchemePack(raw.snapshot)
    if (snapshot.id !== choice.schemePackId || snapshot.revision !== choice.revision || snapshot.status !== 'active') return fail('An assigned scheme snapshot/revision is invalid; explicitly reconfigure it')
    if (!SCHEME_PACK_PRESETS.some(p => p.id === snapshot.id) && !snapshot.id.startsWith(`${collegeId}__`)) return fail('An assigned scheme is not owned by this college')
    return { ...choice, snapshot }
  })
  return { ...selection, assignments, revision: college.schemeConfigurationRevision, needsReconfirmation: false }
}

/** Legacy primary mirrors keep old readers fail-closed during a coordinated rollout. */
export function collegeSchemeFields(configuration: CollegeSchemeConfiguration) {
  const primary = configuration.assignments.find(a => a.schemePackId === configuration.primarySchemePackId)
  return { schemePackAssignments: configuration.assignments, primarySchemePackId: configuration.primarySchemePackId,
    schemePackRoutes: configuration.routes, schemeConfigurationRevision: configuration.revision,
    schemePackId: primary?.schemePackId ?? null, schemePackSnapshot: primary?.snapshot ?? null, schemePackRevision: primary?.revision ?? null }
}
