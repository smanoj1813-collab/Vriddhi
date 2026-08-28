// src/shared/constants/academicPrograms.ts
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for programs / departments / subjects.
//
// Vriddhi targets NON-TECHNICAL UG & PG colleges (arts, commerce, science,
// management, computer applications) — and PUC/pre-university colleges later.
// Engineering / B.Tech branches (CSE, ECE, ME, CE, EEE, IT) are intentionally
// NOT part of any seeded list. Colleges configure their own programs in
// Firestore (`colleges/{id}/config/batchBranch`); these values are only the
// fallback shown before a college has configured anything.
// ─────────────────────────────────────────────────────────────────────────────

/** Undergraduate (UG) non-technical programs. */
export const UG_PROGRAMS = [
  'B.A',
  'B.Com',
  'B.Sc',
  'BBA',
  'BCA',
  'B.Ed',
] as const;

/** Postgraduate (PG) non-technical programs. */
export const PG_PROGRAMS = [
  'M.A',
  'M.Com',
  'M.Sc',
  'MBA',
  'MCA',
] as const;

/**
 * Default program list used wherever a "branch" / "program" dropdown needs
 * options and the college has not configured its own.
 */
export const DEFAULT_PROGRAMS: string[] = [
  ...UG_PROGRAMS,
  ...PG_PROGRAMS,
  'General',
];

/** Backwards-compatible alias — the data model still calls this field `branch`. */
export const DEFAULT_BRANCHES = DEFAULT_PROGRAMS;

/** Departments of a typical non-tech UG/PG college. */
export const DEFAULT_DEPARTMENTS: string[] = [
  'Commerce',
  'Management',
  'Computer Applications',
  'Science',
  'Arts & Humanities',
  'Languages',
  'Education',
  'General',
];

/** Neutral fallback used when a user has no department set. */
export const DEFAULT_DEPARTMENT = 'General';

/** Subjects commonly taught in non-tech UG/PG programs. */
export const DEFAULT_SUBJECTS: string[] = [
  'Accountancy',
  'Financial Accounting',
  'Business Studies',
  'Business Management',
  'Marketing Management',
  'Human Resource Management',
  'Economics',
  'Business Statistics',
  'Mathematics',
  'Statistics',
  'Computer Applications',
  'Information Technology',
  'Physics',
  'Chemistry',
  'Botany',
  'Zoology',
  'Microbiology',
  'Biotechnology',
  'English',
  'Kannada',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Hindi',
  'History',
  'Political Science',
  'Sociology',
  'Psychology',
  'Journalism',
  'Education',
  'Environmental Studies',
  'Communication Skills',
];

/** Default academic batches (rolling four-year window is set by the college). */
export const DEFAULT_BATCHES: string[] = [
  '2022-23',
  '2023-24',
  '2024-25',
  '2025-26',
];

/**
 * UG/PG courses are typically 3 years (UG) or 2 years (PG); we expose 3 years
 * by default and let colleges extend. No 4th year (engineering-style) default.
 */
export const DEFAULT_ACADEMIC_YEARS: string[] = ['1st Year', '2nd Year', '3rd Year'];

export const DEFAULT_SEMESTERS: string[] = ['1', '2', '3', '4', '5', '6'];

/** Sample values used in CSV templates / onboarding examples. */
export const SAMPLE_PROGRAM = 'B.Com';
export const SAMPLE_COURSE = 'B.Com (Computer Applications)';
export const SAMPLE_DEPARTMENT = 'Commerce';
export const SAMPLE_SUBJECT = 'Financial Accounting';
export const SAMPLE_SPECIALIZATION = 'Finance & Taxation';

/**
 * Legacy engineering branch codes that must never be seeded again.
 * Exported so tests / lint scripts can assert they are absent.
 */
export const DEPRECATED_TECH_BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'EEE', 'B.Tech', 'BTech'];

/** Strips legacy engineering branch codes out of any configured list. */
export function withoutTechBranches(list: string[] | undefined | null): string[] {
  if (!list?.length) return [];
  const banned = new Set(DEPRECATED_TECH_BRANCHES.map((b) => b.toLowerCase()));
  return list.filter((item) => !banned.has(String(item).trim().toLowerCase()));
}
