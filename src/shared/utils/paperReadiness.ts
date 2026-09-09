// src/shared/utils/paperReadiness.ts
// Client-side helpers for the two-artefact paper model:
//   • original file  → "Print" (photocopy) artefact
//   • sections[] / question bank → "Online" artefact (assessments)
// The server (savePaper / confirmPaperStructure) persists printReady /
// onlineReady / bankReady on the paper document; these helpers read the
// persisted flags first and fall back to deriving them for older documents.

export interface PaperReadiness {
  print: boolean;
  online: boolean;
  bank: boolean;
}

export interface ReadinessPaper {
  sections?: Array<{ questions?: unknown[] }>;
  questionIds?: unknown[];
  linkedQuestionIds?: unknown[];
  totalQuestions?: number;
  filePath?: string | null;
  printReady?: boolean;
  onlineReady?: boolean;
  bankReady?: boolean;
}

export function paperQuestionCount(paper: ReadinessPaper): number {
  const sectionsCount = Array.isArray(paper.sections)
    ? paper.sections.reduce((sum, section) => sum + (Array.isArray(section?.questions) ? section.questions.length : 0), 0)
    : 0;
  const bankCount = Math.max(
    Array.isArray(paper.questionIds) ? paper.questionIds.length : 0,
    Array.isArray(paper.linkedQuestionIds) ? paper.linkedQuestionIds.length : 0,
  );
  if (sectionsCount > 0) return sectionsCount;
  if (bankCount > 0) return bankCount;
  return Number(paper.totalQuestions) || 0;
}

export function paperBadges(paper: ReadinessPaper): PaperReadiness {
  const bankCount = Math.max(
    Array.isArray(paper.questionIds) ? paper.questionIds.length : 0,
    Array.isArray(paper.linkedQuestionIds) ? paper.linkedQuestionIds.length : 0,
  );
  return {
    print: paper.printReady ?? Boolean(paper.filePath),
    online: paper.onlineReady ?? paperQuestionCount(paper) > 0,
    bank: paper.bankReady ?? bankCount > 0,
  };
}

/** TestScheduler gate: only papers with a structured question set. */
export function isPaperOnlineReady(paper: ReadinessPaper): boolean {
  return paperBadges(paper).online;
}
