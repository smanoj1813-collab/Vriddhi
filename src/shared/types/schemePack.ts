// src/shared/types/schemePack.ts
// ─── University Scheme Packs (G1) ────────────────────────────────────────────
//
// A "scheme pack" is the machine-readable form of one university's scheme of
// examination: marks split, IA composition, attendance slabs, pass criteria,
// grade table, mediums. Karnataka's ~33 state universities each publish a
// slightly different one (BCU 80+20 with 35/40 pass, Karnatak Dharwad NEP
// 60+40, 50-mark sub-3-credit courses, ...). Before G1 these constants were
// hardcoded in bcuCompliance.ts, which made every compliance screen, hall
// ticket and result import correct for exactly one university.
//
// The pure evaluation logic lives in src/shared/utils/schemeEngine.ts.
// bcuCompliance.ts keeps its historical exported API as thin wrappers over
// the BCU_SEP_2024 pack so every existing caller behaves identically.
//
// Persistence: custom packs are Firestore docs in `schemePacks`
// ({ collegeId: '<college>' | '*GLOBAL*', ...pack }), written only through
// the saveSchemePack callable (admin SDK — no client write path). A college
// points at its active pack via colleges/{id}.schemePackId; when unset the
// BCU pack is the default, matching pre-G1 behaviour exactly.

export type SchemePackStatus = 'active' | 'draft' | 'archived';

/** One attendance → IA-marks slab (inclusive both ends). */
export interface AttendanceMarksSlab {
  /** inclusive lower bound, e.g. 86 */
  min: number;
  /** inclusive upper bound, e.g. 90 */
  max: number;
  /** IA marks awarded inside the slab */
  marks: number;
  /** short label shown on dashboards, e.g. "Good — 4 marks" */
  label: string;
}

export interface SchemeAttendanceRules {
  /** Below this % the student is exam-blocked (BCU: 75). */
  minimumPercentage: number;
  /** Marks slabs, ordered ascending by min; must start at minimumPercentage. */
  marksSlabs: AttendanceMarksSlab[];
  /** When false, attendance never blocks exam eligibility (some schemes only
   *  carry attendance marks and leave blocking to the university's EB). */
  blocksExamEligibility: boolean;
}

export interface SchemeInternalAssessment {
  /** Total IA marks on a "standard" course (BCU 20, KUD-NEP-4cr 40). */
  totalMarks: number;
  test: {
    /** Tests conducted per course in a semester. */
    count: number;
    /** Max marks per test (BCU: 20). */
    maxMarksEach: number;
    /** Best-N of the tests are averaged (BCU: best 2). */
    bestOf: number;
    /** Marks the test average contributes to total IA (BCU: 10). */
    weightInTotal: number;
  };
  /** Marks contribution of the attendance slab (BCU: 5; 0 = none). */
  attendanceMaxMarks: number;
  /** Marks contribution of assignment/record/skill work (BCU: 5, KUD: rest). */
  assignmentMaxMarks: number;
}

export interface SchemeSemesterEndExam {
  /** Default SEE max marks for a standard course (BCU 80, KUD 60). */
  defaultMaxMarks: number;
  durationMinutes: number;
  /** Minimum % of SEE marks required to pass the course (BCU 35). */
  passPercentage: number;
}

export interface SchemePassCriteria {
  /** Minimum % of (SEE + IA) aggregate to pass (BCU/KUD 40). */
  aggregatePassPercentage: number;
  /** Minimum % of IA alone; 0 = none (BCU). */
  minimumInternalPercentage: number;
  /** SEE pass % must be met in addition to aggregate (BCU true). */
  requireSemesterEndPass: boolean;
}

export interface SchemeGrade {
  grade: string;
  gradePoint: number;
  /** Percentage bands are read from the top down: first min ≤ marks wins. */
  minPercentage: number;
  description: string;
}

export interface UniversitySchemePack {
  /** doc id when read from Firestore; matches `code` for built-in presets. */
  id: string;
  /** short stable code, e.g. 'BCU_SEP_2024' */
  code: string;
  /** display name, e.g. 'Bengaluru City University — SEP 2024' */
  name: string;
  universityName: string;
  /** scheme label, e.g. 'SEP 2024', 'NEP 2020 CBAE' */
  schemeName: string;
  /** programmes this pack covers, e.g. ['BA','B.Com','BBA'] (display only) */
  applicableProgrammes: string[];
  attendance: SchemeAttendanceRules;
  internalAssessment: SchemeInternalAssessment;
  semesterEndExam: SchemeSemesterEndExam;
  passCriteria: SchemePassCriteria;
  /** descending by minPercentage; the engine probes in array order. */
  gradeTable: SchemeGrade[];
  /** mediums the university paper is set in, e.g. ['English','Kannada'] */
  mediums: string[];
  status: SchemePackStatus;
  /** true on the built-in presets; true marks the college default among customs */
  isDefault?: boolean;
  /** where the numbers came from (syllabus PDF / regulations page) */
  sourceNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Built-in presets ────────────────────────────────────────────────────────
// Verified against the sources cited in sourceNote. These are *code* so the
// app keeps working before any Firestore seeding: a college that has never
// touched scheme packs behaves exactly as the old BCU build.
//
// The standard NEP grade ladder is shared by every Karnataka scheme we know
// of; only the percentage floors differ between packs.

const STANDARD_GRADE_TABLE: SchemeGrade[] = [
  { grade: 'O', gradePoint: 10, minPercentage: 90, description: 'Outstanding' },
  { grade: 'A+', gradePoint: 9, minPercentage: 80, description: 'Excellent' },
  { grade: 'A', gradePoint: 8, minPercentage: 70, description: 'Very Good' },
  { grade: 'B+', gradePoint: 7, minPercentage: 60, description: 'Good' },
  { grade: 'B', gradePoint: 6, minPercentage: 50, description: 'Above Average' },
  { grade: 'C', gradePoint: 5, minPercentage: 40, description: 'Average' },
  { grade: 'P', gradePoint: 4, minPercentage: 35, description: 'Pass' },
  { grade: 'F', gradePoint: 0, minPercentage: 0, description: 'Fail' },
];

export const BCU_SEP_2024: UniversitySchemePack = {
  id: 'BCU_SEP_2024',
  code: 'BCU_SEP_2024',
  name: 'Bengaluru City University — SEP 2024',
  universityName: 'Bengaluru City University',
  schemeName: 'SEP 2024',
  applicableProgrammes: ['BA', 'B.Com', 'BBA', 'BCA', 'B.Sc', 'BSW'],
  attendance: {
    minimumPercentage: 75,
    marksSlabs: [
      { min: 76, max: 80, marks: 2, label: 'Minimum eligible' },
      { min: 81, max: 85, marks: 3, label: 'Satisfactory' },
      { min: 86, max: 90, marks: 4, label: 'Good' },
      { min: 91, max: 100, marks: 5, label: 'Excellent' },
    ],
    blocksExamEligibility: true,
  },
  internalAssessment: {
    totalMarks: 20,
    test: { count: 3, maxMarksEach: 20, bestOf: 2, weightInTotal: 10 },
    attendanceMaxMarks: 5,
    assignmentMaxMarks: 5,
  },
  semesterEndExam: {
    defaultMaxMarks: 80,
    durationMinutes: 180,
    passPercentage: 35,
  },
  passCriteria: {
    aggregatePassPercentage: 40,
    minimumInternalPercentage: 0,
    requireSemesterEndPass: true,
  },
  gradeTable: STANDARD_GRADE_TABLE,
  mediums: ['English', 'Kannada'],
  status: 'active',
  isDefault: true,
  sourceNote: 'BCU BBA Syllabus SEP 2024 — Scheme of Examination; NEP 2020 model regulations',
};

/**
 * Karnatak University Dharwad NEP CBAE (verified from kud.ac.in NEP PDFs):
 * 3–6 credit courses are 100 marks = 40 CIE + 60 SEE; <3 credit courses are
 * 50 marks. SEE and IA pass floors mirror UGC-NEP 40%, SEE pass required.
 */
export const KUD_NEP_CBAE: UniversitySchemePack = {
  id: 'KUD_NEP_CBAE',
  code: 'KUD_NEP_CBAE',
  name: 'Karnatak University Dharwad — NEP CBAE',
  universityName: 'Karnatak University, Dharwad',
  schemeName: 'NEP 2020 CBAE',
  applicableProgrammes: ['BA', 'B.Com', 'BBA', 'BCA', 'B.Sc', 'BSW', 'B.Voc'],
  attendance: {
    minimumPercentage: 75,
    marksSlabs: [
      { min: 76, max: 85, marks: 2, label: 'Minimum eligible' },
      { min: 86, max: 100, marks: 3, label: 'Good' },
    ],
    blocksExamEligibility: true,
  },
  internalAssessment: {
    totalMarks: 40,
    test: { count: 3, maxMarksEach: 40, bestOf: 2, weightInTotal: 20 },
    attendanceMaxMarks: 5,
    assignmentMaxMarks: 15,
  },
  semesterEndExam: {
    defaultMaxMarks: 60,
    durationMinutes: 180,
    passPercentage: 35,
  },
  passCriteria: {
    aggregatePassPercentage: 40,
    minimumInternalPercentage: 0,
    requireSemesterEndPass: true,
  },
  gradeTable: STANDARD_GRADE_TABLE,
  mediums: ['English', 'Kannada'],
  status: 'active',
  isDefault: false,
  sourceNote: 'KUD UG Regulations (NEP CBAE) — kud.ac.in/file_upload/nep/UG REGULATIONS.pdf; B.Com/BBA scheme PDFs',
};

/** Generic NEP-2020 defaults for any other Karnataka university until its own
 *  pack is authored: 60 SEE + 40 CIE, 75% attendance, 40% aggregate pass. */
export const GENERIC_NEP_2020: UniversitySchemePack = {
  id: 'GENERIC_NEP_2020',
  code: 'GENERIC_NEP_2020',
  name: 'Generic — NEP 2020 (60 + 40)',
  universityName: 'Any Karnataka state university',
  schemeName: 'NEP 2020 (generic)',
  applicableProgrammes: [],
  attendance: {
    minimumPercentage: 75,
    marksSlabs: [
      { min: 76, max: 90, marks: 2, label: 'Minimum eligible' },
      { min: 91, max: 100, marks: 3, label: 'Good' },
    ],
    blocksExamEligibility: true,
  },
  internalAssessment: {
    totalMarks: 40,
    test: { count: 2, maxMarksEach: 40, bestOf: 2, weightInTotal: 30 },
    attendanceMaxMarks: 5,
    assignmentMaxMarks: 5,
  },
  semesterEndExam: {
    defaultMaxMarks: 60,
    durationMinutes: 180,
    passPercentage: 35,
  },
  passCriteria: {
    aggregatePassPercentage: 40,
    minimumInternalPercentage: 0,
    requireSemesterEndPass: true,
  },
  gradeTable: STANDARD_GRADE_TABLE,
  mediums: ['English', 'Kannada'],
  status: 'active',
  isDefault: false,
  sourceNote: 'UGC NEP 2020 model curriculum defaults',
};

export const SCHEME_PACK_PRESETS: UniversitySchemePack[] = [
  BCU_SEP_2024,
  KUD_NEP_CBAE,
  GENERIC_NEP_2020,
];

/** Pack applied when a college has none assigned — pre-G1 behaviour. */
export const DEFAULT_SCHEME_PACK = BCU_SEP_2024;
