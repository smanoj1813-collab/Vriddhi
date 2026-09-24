// src/modules/admin/utils/assessmentStats.ts
//
// Pure aggregation over an assessment list. Kept separate from the Firestore
// API layer so the dashboard counts are computed from the SAME rows the table
// shows (no second source of truth), are trivially unit-testable, and are easy
// to extend when new dimensions (division, section, mode…) need their own card.
//
// Adding a future dimension is a one-liner: `bump(stats.byX, a.x)`.

import type { Assessment, AssessmentStats } from '../types/assessment';

/** Keys we surface a dedicated count for; anything else still lands in byStatus. */
const KNOWN_STATUSES = ['draft', 'published', 'active', 'completed', 'archived'] as const;

function bump(record: Record<string, number> | undefined, key: string | number | undefined | null): void {
  if (!record || key === undefined || key === null || key === '') return;
  const k = String(key);
  record[k] = (record[k] || 0) + 1;
}

/**
 * Aggregate assessment counts. `now` is injectable so tests are deterministic.
 */
export function computeAssessmentStats(
  assessments: Assessment[],
  now: Date = new Date(),
): AssessmentStats {
  const stats: AssessmentStats = {
    totalAssessments: assessments.length,
    activeAssessments: 0,
    completedAssessments: 0,
    draftCount: 0,
    publishedCount: 0,
    activeCount: 0,
    completedCount: 0,
    archivedCount: 0,
    upcomingCount: 0,
    ongoingCount: 0,
    byType: {},
    byStatus: {},
    byBranch: {},
    bySemester: {},
    byBatch: {},
  };

  const nowMs = now.getTime();

  for (const a of assessments) {
    const status = String(a.status || '').toLowerCase();

    if (status === 'draft') stats.draftCount! += 1;
    else if (status === 'published') stats.publishedCount! += 1;
    else if (status === 'active') stats.activeCount! += 1;
    else if (status === 'completed') stats.completedCount! += 1;
    else if (status === 'archived') stats.archivedCount! += 1;

    if (status === 'active') stats.activeAssessments += 1;
    if (status === 'completed') stats.completedAssessments += 1;

    // Unknown statuses still show up under byStatus so nothing is silently dropped.
    bump(stats.byStatus, a.status);
    bump(stats.byType, a.type);
    bump(stats.byBranch, a.branch);
    bump(stats.bySemester, a.semester);
    bump(stats.byBatch, a.batch);

    // Scheduled vs. ongoing: only meaningful when a date exists and is parseable.
    if (a.scheduledDate) {
      const d = new Date(a.scheduledDate as unknown as string);
      if (!Number.isNaN(d.getTime())) {
        if (d.getTime() > nowMs) stats.upcomingCount! += 1;
        else stats.ongoingCount! += 1;
      }
    }
  }

  return stats;
}

/** Exposed for future filters/UIs that want to know which statuses we count. */
export const COUNTED_ASSESSMENT_STATUSES = KNOWN_STATUSES;
