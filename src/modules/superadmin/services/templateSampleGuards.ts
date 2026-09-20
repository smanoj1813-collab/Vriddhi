// src/modules/superadmin/services/templateSampleGuards.ts
// ------------------------------------------------------------------
// Sample-value detection for the standardized curriculum Excel template.
//
// WHY THIS EXISTS: the downloadable template used to ship fully pre-filled
// with BBA sample data (Program Info said "Bachelor of Business
// Administration" / "BBA"; the Course Matrix carried five "BBA 3.x" example
// rows). A college uploading a B.Com (or any other) curriculum that left any
// of those sample cells in place got its whole upload stamped "BBA" — the
// parser faithfully reads Program Info['Branch / Stream'] as the fallback
// for every course whose Branch cell is blank, and the assignment title
// becomes "BBA - Semester N". Nothing downstream is hardcoded; the sample
// data simply leaks into saved documents.
//
// The template now ships with a BLANK Program Info sheet, and this pure
// module lets the parser warn when a filled file still contains the old
// sample signatures (or leaves Branch / Stream blank). Warnings, not errors:
// a college that genuinely teaches BBA must never be blocked.
//
// Kept free of the `xlsx` import so it stays cheap to unit-test.
// ------------------------------------------------------------------

export interface TemplateSampleIssue {
  sheet: string;
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/** Program Info values the template historically shipped as samples. */
export const TEMPLATE_SAMPLE_PROGRAM_INFO: Record<string, string> = {
  'University Name': 'University of Mysore',
  'Program Name': 'Bachelor of Business Administration',
  'Scheme / Regulation': 'SEP 2026-2027',
  'Branch / Stream': 'BBA',
  'Total Semesters': '6',
  'Academic Year': '2026-2027',
};

/** Course-code/name pairs used by the template's example Course Matrix rows. */
export const TEMPLATE_SAMPLE_COURSES: Array<{ code: string; name: string }> = [
  { code: 'BBA 3.1', name: 'Cost Accounting' },
  { code: 'BBA 3.2', name: 'Business Statistics II' },
  { code: 'BBA 3.3', name: 'Business Environment' },
  { code: 'BBA 3.4', name: 'Entrepreneurship and Startup Ecosystem' },
  { code: 'BBA 3.5', name: 'Banking and Financial Services' },
];

/**
 * How many sample Program Info values must match together before the upload
 * is flagged as "template header untouched". Deliberately above 1: common
 * real-world values (the degree name "Bachelor of Business Administration",
 * an academic year of "2026-2027") appear in genuine curricula, so single
 * matches never warn. An untouched header matches all six.
 */
export const TEMPLATE_SAMPLE_FINGERPRINT_THRESHOLD = 3;

const normalise = (value: unknown): string => String(value ?? '').trim().toLowerCase();

/**
 * Detects leftover template sample data in a parsed upload.
 *
 * @param programInfo the parsed Program Info sheet as key → value
 * @param courses parsed Course Matrix rows (code + name are inspected)
 */
export function detectTemplateSampleIssues(
  programInfo: Record<string, string>,
  courses: Array<{ code?: string | null; name?: string | null }>
): TemplateSampleIssue[] {
  const issues: TemplateSampleIssue[] = [];

  // 1. Blank Branch / Stream: courses will fall back to the Course Matrix
  //    Branch column — or be stamped "General", which silently mislabels the
  //    whole program on the curriculum pages.
  const branch = String(programInfo['Branch / Stream'] ?? '').trim();
  if (!branch) {
    issues.push({
      sheet: 'Program Info',
      row: 5,
      field: 'Branch / Stream',
      message:
        'Branch / Stream is blank. Fill it with your program (e.g. B.Com) — otherwise courses are labelled from the Course Matrix Branch column, or "General".',
      severity: 'warning',
    });
  }

  // 2. The template's old sample Program Info, still present. Single fields
  //    must NOT trigger on their own — "Bachelor of Business Administration"
  //    is the real degree name, "2026-2027" a real academic year — so the
  //    warning fires only on the template's FINGERPRINT: several sample
  //    values matching together, which is what an untouched header sheet
  //    looks like (the original failure mode).
  const sampleFields = Object.entries(TEMPLATE_SAMPLE_PROGRAM_INFO).filter(
    ([field, sample]) => normalise(programInfo[field]) === normalise(sample)
  );
  if (sampleFields.length >= TEMPLATE_SAMPLE_FINGERPRINT_THRESHOLD) {
    issues.push({
      sheet: 'Program Info',
      row: 1,
      field: sampleFields.map(([field]) => field).join(', '),
      message:
        `Program Info still matches the template's example values in ${sampleFields.length} fields (${sampleFields
          .map(([, sample]) => sample)
          .join(', ')}). If you are uploading a different program (e.g. B.Com), replace them with your program's real values before submitting.`,
      severity: 'warning',
    });
  }

  // 3. The template's example Course Matrix rows, still present: they become
  //    real (wrong) courses in the saved curriculum.
  const sampleRows = courses.filter((course) =>
    TEMPLATE_SAMPLE_COURSES.some(
      (sample) =>
        normalise(course.code) === normalise(sample.code) &&
        normalise(course.name) === normalise(sample.name)
    )
  );
  if (sampleRows.length > 0) {
    issues.push({
      sheet: 'Course Matrix',
      row: 2,
      field: 'Course Code',
      message:
        `Course Matrix still contains ${sampleRows.length} of the template's example rows (${sampleRows
          .map((row) => row.code)
          .join(', ')}). Delete the example rows you did not intend to upload.`,
      severity: 'warning',
    });
  }

  return issues;
}
