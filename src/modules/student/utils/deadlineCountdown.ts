// src/modules/student/utils/deadlineCountdown.ts
// ------------------------------------------------------------------
// One place for the "how long until this assignment is due" wording so the
// bell feed (dashboard card + notifications page) and any future surfaces
// cannot drift apart. Returns null when there is no parseable deadline.
// ------------------------------------------------------------------

export type DeadlineTone = 'overdue' | 'soon' | 'ok';

export interface DeadlineCountdown {
  /** Human wording, e.g. "3 days left" / "5h left" / "Overdue by 2 days". */
  text: string;
  /** Drives the chip colour: red, amber or slate. */
  tone: DeadlineTone;
}

export function deadlineCountdown(
  deadlineIso: string | null | undefined,
  now: number = Date.now()
): DeadlineCountdown | null {
  if (!deadlineIso) return null;
  const due = new Date(deadlineIso);
  if (Number.isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - now;
  const DAY = 86_400_000;
  if (diffMs < 0) {
    const days = Math.floor(-diffMs / DAY);
    return { text: days > 0 ? `Overdue by ${days} day${days === 1 ? '' : 's'}` : 'Overdue', tone: 'overdue' };
  }
  if (diffMs < 24 * 3_600_000) {
    const hours = Math.max(1, Math.ceil(diffMs / 3_600_000));
    return { text: `${hours}h left`, tone: 'soon' };
  }
  const days = Math.ceil(diffMs / DAY);
  return { text: `${days} day${days === 1 ? '' : 's'} left`, tone: 'ok' };
}

/** Violet badge wording for the course → module linkage, or null. */
export function linkageBadgeText(courseName?: string, moduleTitle?: string): string | null {
  const course = (courseName || '').trim();
  const module = (moduleTitle || '').trim();
  if (!course && !module) return null;
  return course && module ? `${course} → ${module}` : course || module;
}
