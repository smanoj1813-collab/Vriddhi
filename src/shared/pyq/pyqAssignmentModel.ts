// Pure rules for platform-assigned previous-year papers (PYQs).
// Firestore I/O lives in pyqAssignments.ts; this file stays import-free so it
// runs in the Node unit tests. Mirrors functions/src/pyqAssessments.ts — the
// server re-checks everything, these helpers only drive the UI.

export const PYQ_ASSIGNMENT_CONFIG_DOC = 'pyqPapers';

export interface PyqAssignment {
  enabled: boolean;
  assignedAt?: string;
  assignedBy?: string;
  notes?: string;
}

export interface PyqAssignmentSettings {
  assignments: Record<string, PyqAssignment>;
  updatedAt?: string;
  updatedBy?: string;
}

/** The list-row fields the assignment UIs read (a PrepPaperSummary subset). */
export interface PyqPaperRow {
  id: string;
  contentType?: 'structured' | 'source_pdf';
  program: string;
  programLabel: string;
  semester: number;
  subjectName: string;
  examLabel?: string;
  questionCount: number;
  maxMarks?: number;
  language?: string;
  sourceFile?: { fileName: string; url: string; folderPath?: string };
}

export interface PyqSectionLike {
  id: string;
  title?: string;
  instruction?: string;
  answerCount?: number;
  marksEach?: number;
  questions?: Array<{ label?: string; text?: string; marks?: number; parts?: string[] }>;
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizePyqAssignments(value: unknown): PyqAssignmentSettings {
  if (!isRecord(value) || !isRecord(value.assignments)) return { assignments: {} };
  const assignments: Record<string, PyqAssignment> = {};
  for (const [paperId, raw] of Object.entries(value.assignments)) {
    if (!isRecord(raw) || !paperId) continue;
    assignments[paperId] = {
      enabled: raw.enabled === true,
      assignedAt: typeof raw.assignedAt === 'string' ? raw.assignedAt : undefined,
      assignedBy: typeof raw.assignedBy === 'string' ? raw.assignedBy : undefined,
      notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    };
  }
  return {
    assignments,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
    updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : undefined,
  };
}

/** Ids of the papers currently assigned (enabled) — missing records stay hidden. */
export function assignedPyqIds(settings: PyqAssignmentSettings): string[] {
  return Object.entries(settings.assignments)
    .filter(([, assignment]) => assignment.enabled === true)
    .map(([paperId]) => paperId);
}

/**
 * Next settings from a set of enabled ids: newly enabled rows are stamped
 * with who/when; rows that stay enabled keep their original stamp; disabled
 * rows are kept as `enabled: false` so the audit trail of a past assignment
 * survives an unassign.
 */
export function applyPyqAssignmentChanges(
  previous: PyqAssignmentSettings,
  enabledIds: Iterable<string>,
  actorUid: string,
  nowIso: string,
): PyqAssignmentSettings {
  const enabled = new Set(enabledIds);
  const assignments: Record<string, PyqAssignment> = {};
  for (const [paperId, assignment] of Object.entries(previous.assignments)) {
    assignments[paperId] = enabled.has(paperId)
      ? { ...assignment, enabled: true }
      : { ...assignment, enabled: false };
  }
  for (const paperId of enabled) {
    const before = previous.assignments[paperId];
    if (before?.enabled) continue;
    assignments[paperId] = { ...before, enabled: true, assignedAt: nowIso, assignedBy: actorUid };
  }
  return { assignments, updatedAt: nowIso, updatedBy: actorUid };
}

/** A file-only (original PDF) paper cannot be used for an online assessment yet. */
export function isAssessmentReadyRow(row: Pick<PyqPaperRow, 'contentType' | 'questionCount'>): boolean {
  return row.contentType !== 'source_pdf' && Number(row.questionCount) > 0;
}

export interface PyqRowFilters {
  program?: string;
  semester?: string;
  readiness?: 'all' | 'ready' | 'pdf';
  q?: string;
}

export function filterPyqRows<T extends PyqPaperRow>(rows: T[], filters: PyqRowFilters): T[] {
  const q = (filters.q || '').trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.program && row.program !== filters.program) return false;
    if (filters.semester && String(row.semester) !== filters.semester) return false;
    if (filters.readiness === 'ready' && !isAssessmentReadyRow(row)) return false;
    if (filters.readiness === 'pdf' && isAssessmentReadyRow(row)) return false;
    if (q) {
      const hay = `${row.subjectName} ${row.programLabel} ${row.examLabel || ''} ${row.sourceFile?.fileName || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortPyqRows<T extends PyqPaperRow>(rows: T[]): T[] {
  return rows.slice().sort((a, b) =>
    a.programLabel.localeCompare(b.programLabel)
    || (a.semester || 0) - (b.semester || 0)
    || a.subjectName.localeCompare(b.subjectName)
    || a.id.localeCompare(b.id));
}

export function pyqProgramOptions(rows: PyqPaperRow[]): Array<{ value: string; label: string; count: number }> {
  const map = new Map<string, { value: string; label: string; count: number }>();
  for (const row of rows) {
    const entry = map.get(row.program) || { value: row.program, label: row.programLabel || row.program, count: 0 };
    entry.count += 1;
    map.set(row.program, entry);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Stable key for one question — must match functions/src/pyqAssessments.ts. */
export function pyqQuestionKey(sectionId: string, index: number): string {
  return `${sectionId}#${index}`;
}

export function pyqQuestionMarks(section: PyqSectionLike, question: { marks?: number }): number {
  return Number(question.marks ?? section.marksEach) || 0;
}

/** Every non-blank question key in the paper (the default selection). */
export function allPyqQuestionKeys(sections: PyqSectionLike[]): string[] {
  const keys: string[] = [];
  for (const section of sections) {
    (section.questions || []).forEach((question, index) => {
      if (String(question.text || '').trim()) keys.push(pyqQuestionKey(section.id, index));
    });
  }
  return keys;
}

export interface PyqSelectionSummary {
  questions: number;
  marks: number;
  /** Per section: selected count vs the paper's "answer any N" rubric (0 = all compulsory). */
  sections: Array<{ id: string; selected: number; answerCount: number; total: number }>;
}

export function summarizePyqSelection(sections: PyqSectionLike[], selected: Set<string>): PyqSelectionSummary {
  let questions = 0;
  let marks = 0;
  const perSection: PyqSelectionSummary['sections'] = [];
  for (const section of sections) {
    let count = 0;
    let total = 0;
    (section.questions || []).forEach((question, index) => {
      if (!String(question.text || '').trim()) return;
      total += 1;
      if (!selected.has(pyqQuestionKey(section.id, index))) return;
      count += 1;
      marks += pyqQuestionMarks(section, question);
    });
    questions += count;
    perSection.push({ id: section.id, selected: count, answerCount: Number(section.answerCount) || 0, total });
  }
  return { questions, marks, sections: perSection };
}

/**
 * Keys for "match the rubric": the first N questions of every "answer any N"
 * section, all questions where every question is compulsory.
 */
export function rubricPyqQuestionKeys(sections: PyqSectionLike[]): string[] {
  const keys: string[] = [];
  for (const section of sections) {
    const limit = Number(section.answerCount) || 0;
    let taken = 0;
    (section.questions || []).forEach((question, index) => {
      if (!String(question.text || '').trim()) return;
      if (limit > 0 && taken >= limit) return;
      taken += 1;
      keys.push(pyqQuestionKey(section.id, index));
    });
  }
  return keys;
}
