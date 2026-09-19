/** Phase 1/2 flags are intentionally off until the assessment cost gate passes. */
export interface AcademicFeatureFlags {
  academicIntelligenceEnabled: boolean
  studentDailySummaryEnabled: boolean
  facultyPlanningEnabled: boolean
  questionPlanningV2Enabled: boolean
}

export const DEFAULT_ACADEMIC_FEATURE_FLAGS: AcademicFeatureFlags = {
  academicIntelligenceEnabled: false,
  studentDailySummaryEnabled: false,
  facultyPlanningEnabled: false,
  questionPlanningV2Enabled: false,
}

export function academicFeaturesEnabled(flags?: Partial<AcademicFeatureFlags>): AcademicFeatureFlags {
  return { ...DEFAULT_ACADEMIC_FEATURE_FLAGS, ...(flags || {}) }
}
