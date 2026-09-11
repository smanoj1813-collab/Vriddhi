// src/utils/parseCSV.ts
// Unified CSV parser for student and faculty imports

export type ImportType = 'students' | 'faculty';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  mappedHeaders: Record<string, string>;
  unknownHeaders: string[];
  warnings: string[];
}

export interface ValidationResult {
  validRows: Record<string, string>[];
  /** Rows rejected pre-flight, with the reason(s) and their 1-based sheet row. */
  invalidRows?: Array<{
    rowNumber: number;
    row: Record<string, string>;
    reasons: string[];
  }>;
  errors: string[];
  /** Non-blocking notes, e.g. a phone number that was normalised. */
  warnings?: string[];
  validCount: number;
  errorCount: number;
  /** Distinct rows rejected — an invalid row can raise several `errors`. */
  invalidCount?: number;
}

// ─── Column Mapping Configuration ───────────────────────────────────────────

interface ColumnMapping {
  field: string;
  required: boolean;
  aliases: string[];
  validator?: (value: string, rowNum: number) => string | null;
}

// Student import column definitions
const STUDENT_COLUMNS: ColumnMapping[] = [
  {
    field: 'name',
    required: true,
    aliases: ['student name', 'name', 'full name', 'studentname', 'student_name'],
  },
  {
    field: 'email',
    required: true,
    aliases: ['email', 'email address', 'emailaddress', 'email_address', 'e-mail', 'e_mail'],
    validator: (val, rowNum) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) return `Row ${rowNum}: Invalid email format "${val}"`;
      return null;
    },
  },
  {
    field: 'regNo',
    required: false,
    aliases: ['registration number', 'reg no', 'regno', 'roll number', 'roll_no', 'rollno', 'reg_number', 'registration_no', 'enrollment number', 'enrollment_no'],
  },
  {
    field: 'phone',
    required: false,
    aliases: ['phone', 'phone number', 'phonenumber', 'phone_number', 'mobile', 'mobile number', 'contact', 'contact number'],
  },
  {
    field: 'division',
    required: false,
    aliases: ['division', 'class', 'section', 'class division', 'class_section'],
  },
  {
    field: 'batch',
    required: false,
    aliases: ['batch', 'year', 'academic year', 'academic_year', 'batch year', 'batch_year', 'passing year'],
  },
  {
    field: 'mentor',
    required: false,
    aliases: [
      'mentor', 'mentor name', 'mentorname', 'mentor_name',
      'mentor id', 'mentorid', 'mentor_id',
      'faculty mentor', 'faculty_mentor', 'faculty id', 'facultyid', 'faculty_id',
      'guide',
    ],
  },
  {
    field: 'department',
    required: false,
    aliases: ['department', 'branch', 'course', 'dept', 'stream', 'specialization'],
  },
  {
    field: 'semester',
    required: false,
    aliases: ['semester', 'sem', 'current semester', 'current_semester'],
    validator: (val, rowNum) => {
      if (val && isNaN(parseInt(val))) return `Row ${rowNum}: Semester must be a number, got "${val}"`;
      return null;
    },
  },
  {
    field: 'dob',
    required: false,
    aliases: ['dob', 'date of birth', 'date_of_birth', 'birthdate', 'birth date'],
  },
  {
    field: 'gender',
    required: false,
    aliases: ['gender', 'sex'],
  },
  {
    field: 'address',
    required: false,
    aliases: ['address', 'residential address', 'residential_address', 'home address', 'home_address'],
  },
];

// Faculty import column definitions
const FACULTY_COLUMNS: ColumnMapping[] = [
  {
    field: 'facultyId',
    required: true,
    aliases: ['faculty id', 'facultyid', 'faculty_id', 'employee id', 'employee_id', 'emp id', 'emp_id', 'staff id', 'staff_id'],
  },
  {
    field: 'firstName',
    required: true,
    aliases: ['first name', 'firstname', 'first_name', 'fname'],
  },
  {
    field: 'lastName',
    required: false,
    aliases: ['last name', 'lastname', 'last_name', 'lname', 'surname'],
  },
  {
    field: 'email',
    required: true,
    aliases: ['email', 'email address', 'emailaddress', 'email_address', 'e-mail', 'e_mail'],
    validator: (val, rowNum) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) return `Row ${rowNum}: Invalid email format "${val}"`;
      return null;
    },
  },
  {
    field: 'phone',
    required: false,
    aliases: ['phone', 'phone number', 'phonenumber', 'phone_number', 'mobile', 'contact'],
  },
  {
    field: 'gender',
    required: false,
    aliases: ['gender', 'sex'],
  },
  {
    field: 'collegeCode',
    required: false,
    aliases: ['college code', 'collegecode', 'college_code', 'college id', 'college_id', 'institution code', 'institution_code'],
  },
  {
    field: 'collegeName',
    required: false,
    aliases: ['college name', 'collegename', 'college_name', 'institution', 'institution name', 'institution_name', 'university'],
  },
  {
    field: 'department',
    required: false,
    aliases: ['department', 'dept', 'branch', 'discipline'],
  },
  {
    field: 'designation',
    required: false,
    aliases: ['designation', 'title', 'position', 'job title', 'job_title', 'rank'],
  },
  {
    field: 'employmentType',
    required: false,
    aliases: ['employment type', 'employmenttype', 'employment_type', 'employment status', 'employment_status', 'job type', 'job_type', 'type'],
  },
  {
    field: 'joiningDate',
    required: false,
    aliases: ['joining date', 'joiningdate', 'joining_date', 'date of joining', 'date_of_joining', 'doj', 'start date', 'start_date'],
  },
  {
    field: 'qualification',
    required: false,
    aliases: ['qualification', 'qualifications', 'degree', 'degrees', 'education'],
  },
  {
    field: 'specialization',
    required: false,
    aliases: ['specialization', 'specialisation', 'specializations', 'expertise', 'field of study', 'field_of_study'],
  },
  {
    field: 'subjectsUG',
    required: false,
    aliases: ['subjects ug', 'subjectsug', 'subjects_ug', 'ug subjects', 'ug_subjects', 'undergraduate subjects', 'undergraduate_subjects'],
  },
  {
    field: 'subjectsPG',
    required: false,
    aliases: ['subjects pg', 'subjectspg', 'subjects_pg', 'pg subjects', 'pg_subjects', 'postgraduate subjects', 'postgraduate_subjects'],
  },
  {
    field: 'experienceYears',
    required: false,
    aliases: ['experience', 'experience years', 'experienceyears', 'experience_years', 'years of experience', 'years_of_experience', 'total experience', 'total_experience'],
    validator: (val, rowNum) => {
      if (val && isNaN(parseFloat(val))) return `Row ${rowNum}: Experience must be a number, got "${val}"`;
      return null;
    },
  },
  {
    field: 'isHOD',
    required: false,
    aliases: ['is hod', 'ishod', 'is_hod', 'hod', 'head of department', 'head_of_department', 'is head'],
  },
  {
    field: 'profilePhotoUrl',
    required: false,
    aliases: ['profile photo', 'profilephoto', 'profile_photo', 'photo url', 'photo_url', 'image url', 'image_url', 'avatar'],
  },
];

// ─── Core Parser ────────────────────────────────────────────────────────────

function getColumnConfig(type: ImportType): ColumnMapping[] {
  return type === 'students' ? STUDENT_COLUMNS : FACULTY_COLUMNS;
}

function normalizeHeader(header: string): string {
  let normalized = header
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, '')
    .replace(/[_\-]+/g, ' ')
    .trim();

  // Handle camelCase / PascalCase by inserting spaces before capitals
  // e.g., "collegeName" -> "college name", "subjectsUG" -> "subjects ug"
  // But we already lowercased, so "collegename" stays "collegename"
  // We need to handle concatenated lowercase words

  // Try to split concatenated words by matching known patterns
  // e.g., "collegename" should match "college name"
  // e.g., "subjectsug" should match "subjects ug"
  // e.g., "employmenttype" should match "employment type"
  // e.g., "experienceyears" should match "experience years"
  // e.g., "profilephotourl" should match "profile photo url"
  // e.g., "joiningdate" should match "joining date"
  // e.g., "ishod" should match "is hod"

  return normalized;
}

/**
 * Try to match a raw header against column aliases using multiple strategies:
 * 1. Exact match after normalization
 * 2. camelCase/PascalCase split (insert spaces before uppercase -> lowercase transitions)
 * 3. Known concatenated word patterns
 */
function matchHeader(rawHeader: string, aliases: string[]): boolean {
  const normalized = normalizeHeader(rawHeader);

  // Strategy 1: Direct normalized match
  if (aliases.includes(normalized)) return true;

  // Strategy 2: Try splitting camelCase by inserting spaces
  // e.g., "collegeName" (already lowercased to "collegename") -> try "college name"
  // We need to find word boundaries in concatenated strings
  const withSpaces = insertSpacesInConcatenated(normalized);
  if (aliases.includes(withSpaces)) return true;

  // Strategy 3: Check if any alias is a substring or vice versa
  for (const alias of aliases) {
    const aliasNoSpaces = alias.replace(/\s+/g, '');
    if (aliasNoSpaces === normalized) return true;
    if (alias === normalized) return true;
  }

  return false;
}

/**
 * Insert spaces into concatenated lowercase words based on common patterns.
 * This handles headers like "collegename" -> "college name"
 */
function insertSpacesInConcatenated(str: string): string {
  // Common word boundaries for academic/institutional data
  const patterns: [RegExp, string][] = [
    [/college(name|code|id)/g, 'college $1'],
    [/employment(type|status)/g, 'employment $1'],
    [/joining(date)/g, 'joining $1'],
    [/subjects(ug|pg)/g, 'subjects $1'],
    [/experience(years)/g, 'experience $1'],
    [/profile(photo|image)/g, 'profile $1'],
    [/photo(url|link)/g, 'photo $1'],
    [/first(name)/g, 'first $1'],
    [/last(name)/g, 'last $1'],
    [/faculty(id)/g, 'faculty $1'],
    [/student(name)/g, 'student $1'],
    [/registration(number|no)/g, 'registration $1'],
    [/roll(number|no)/g, 'roll $1'],
    [/phone(number)/g, 'phone $1'],
    [/email(address)/g, 'email $1'],
    [/dateof(birth|joining)/g, 'date of $1'],
    [/academic(year)/g, 'academic $1'],
    [/batch(year)/g, 'batch $1'],
    [/current(semester)/g, 'current $1'],
    [/mentor(name|id)/g, 'mentor $1'],
    [/faculty(mentor)/g, 'faculty $1'],
    [/job(title|type)/g, 'job $1'],
    [/headof(department)/g, 'head of $1'],
    [/is(hod)/g, 'is $1'],
    [/undergraduate(subjects)/g, 'undergraduate $1'],
    [/postgraduate(subjects)/g, 'postgraduate $1'],
    [/ug(subjects)/g, 'ug $1'],
    [/pg(subjects)/g, 'pg $1'],
    [/full(time)/g, 'full $1'],
    [/part(time)/g, 'part $1'],
    [/years(of|experience)/g, 'years $1'],
    [/speciali[sz]ation/g, 'specialization'],
    [/qualification/g, 'qualification'],
    [/designation/g, 'designation'],
    [/department/g, 'department'],
    [/specialization/g, 'specialization'],
  ];

  let result = str;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

function buildHeaderMap(rawHeaders: string[], config: ColumnMapping[]): {
  mapped: Record<number, string>;
  mappedHeaders: Record<string, string>;
  unknown: string[];
} {
  const mapped: Record<number, string> = {};
  const mappedHeaders: Record<string, string> = {};
  const unknown: string[] = [];

  rawHeaders.forEach((raw, idx) => {
    let found = false;

    for (const col of config) {
      if (matchHeader(raw, col.aliases) || col.field.toLowerCase() === normalizeHeader(raw)) {
        mapped[idx] = col.field;
        mappedHeaders[raw] = col.field;
        found = true;
        break;
      }
    }

    if (!found) {
      unknown.push(raw);
    }
  });

  return { mapped, mappedHeaders, unknown };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse CSV text into structured data with column mapping
 */
export function parseCSV(csvText: string, type: ImportType = 'students'): ParsedCSV {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const config = getColumnConfig(type);
  const { mapped, mappedHeaders, unknown } = buildHeaderMap(rawHeaders, config);

  const warnings: string[] = [];

  if (unknown.length > 0) {
    warnings.push(`Unknown columns ignored: ${unknown.join(', ')}`);
  }

  const requiredFields = config.filter(c => c.required).map(c => c.field);
  const foundFields = Object.values(mapped);
  const missingRequired = requiredFields.filter(f => !foundFields.includes(f));

  if (missingRequired.length > 0) {
    const missingNames = missingRequired.map(f => {
      const col = config.find(c => c.field === f);
      return col ? col.aliases[0] : f;
    });
    warnings.push(`Missing required columns: ${missingNames.join(', ')}`);
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2 && values.every(v => !v.trim())) continue;

    const row: Record<string, string> = {};
    values.forEach((val, idx) => {
      const field = mapped[idx];
      if (field) {
        row[field] = val.replace(/^["']|["']$/g, '').trim();
      }
    });

    if (Object.values(row).some(v => v.trim() !== '')) {
      rows.push(row);
    }
  }

  return {
    headers: rawHeaders,
    rows,
    rowCount: rows.length,
    mappedHeaders,
    unknownHeaders: unknown,
    warnings,
  };
}

/**
 * Validate parsed rows against column configuration
 */
export function validateCSV(parsed: ParsedCSV, type: ImportType = 'students'): ValidationResult {
  const config = getColumnConfig(type);
  const errors: string[] = [];
  const warnings: string[] = [];
  const validRows: Record<string, string>[] = [];
  const invalidRows: NonNullable<ValidationResult['invalidRows']> = [];

  // Cross-row state. The server rejects a repeated email or registration
  // number, so a file carrying duplicates silently loses every copy after the
  // first — which is invisible from the row itself and was the whole of
  // "300 uploaded, 43 onboarded". Catching it here means the row is reported
  // before anything is sent, rather than coming back as an unexplained failure.
  const seenEmails = new Map<string, number>();
  const seenRegNos = new Map<string, number>();

  parsed.rows.forEach((row, index) => {
    const rowNum = index + 2;
    const reasons: string[] = [];
    const reject = (message: string) => {
      const full = `Row ${rowNum}: ${message}`;
      errors.push(full);
      reasons.push(message);
    };

    for (const col of config) {
      if (col.required) {
        const val = row[col.field];
        if (!val || val.trim() === '') {
          reject(`Missing required field "${col.aliases[0]}"`);
        }
      }
    }

    for (const col of config) {
      if (col.validator && row[col.field]) {
        const err = col.validator(row[col.field], rowNum);
        if (err) {
          errors.push(err);
          reasons.push(err.replace(/^Row \d+: /, ''));
        }
      }
    }

    // ── Cross-row checks ────────────────────────────────────────────────
    const rawEmail = row.email ?? '';
    const email = String(rawEmail).trim();

    // Internal whitespace is not fixable by trimming and is rejected by the
    // server's email pattern, where it looks identical to a blank address.
    if (email && /\s/.test(String(rawEmail))) {
      reject(`Email contains a space — "${String(rawEmail).trim()}"`);
    }

    if (email) {
      const key = email.toLowerCase();
      const firstRow = seenEmails.get(key);
      if (firstRow !== undefined) {
        reject(`Duplicate email "${email}" (first used on row ${firstRow})`);
      } else {
        seenEmails.set(key, rowNum);
      }
    }

    const regNo = String(row.regNo ?? '').trim();
    if (regNo) {
      const key = regNo.toLowerCase();
      const firstRow = seenRegNos.get(key);
      if (firstRow !== undefined) {
        reject(`Duplicate registration number "${regNo}" (first used on row ${firstRow})`);
      } else {
        seenRegNos.set(key, rowNum);
      }
    }

    // ── Normalisation (non-blocking) ────────────────────────────────────
    // toPhoneE164 already strips non-digits server-side, so a spaced-out
    // number imports fine. Normalise it and say so rather than failing a row
    // that would have succeeded.
    const rawPhone = row.phone;
    if (rawPhone && /\s/.test(String(rawPhone))) {
      const digits = String(rawPhone).replace(/\D/g, '');
      row.phone = digits;
      warnings.push(`Row ${rowNum}: phone "${String(rawPhone).trim()}" had spaces — normalised to "${digits}"`);
    }

    if (reasons.length === 0) {
      validRows.push(row);
    } else {
      invalidRows.push({ rowNumber: rowNum, row, reasons });
    }
  });

  return {
    validRows,
    invalidRows,
    errors,
    warnings,
    validCount: validRows.length,
    errorCount: errors.length,
    invalidCount: invalidRows.length,
  };
}

/**
 * Write `rows` to a CSV file and trigger a browser download.
 *
 * Used for the three post-import exports (validation-failed, import-failed,
 * import-successful) so an operator can fix and re-send just the rows that
 * did not land, instead of reconstructing them from an on-screen list.
 */
export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | undefined>>): void {
  const escape = (value: string | number | undefined): string => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a CSV template for download
 */
export function generateCSVTemplate(type: ImportType = 'students'): string {
  if (type === 'students') {
    const headers = [
      'Student Name',
      'Email Address',
      'Registration Number',
      'Phone Number',
      'Division',
      'Batch',
      'Mentor ID',
      'Department',
      'Semester',
      'Date of Birth',
      'Gender',
      'Address',
    ];
    const sampleRow = [
      'Rahul Sharma',
      'rahul.sharma@college.edu',
      'REG-2026-001',
      '+91 98765 43210',
      'A',
      '2026',
      'FAC001',
      'B.Com',
      '1',
      '2005-03-15',
      'Male',
      '123 Main St, Bangalore',
    ];
    return [headers.join(','), sampleRow.join(',')].join('\n');
  } else {
    const headers = [
      'Faculty ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Gender',
      'College Code',
      'Department',
      'Designation',
      'Employment Type',
      'Joining Date',
      'Qualification',
      'Specialization',
      'Subjects UG',
      'Subjects PG',
      'Experience Years',
      'Is HOD',
      'Profile Photo URL',
    ];
    const sampleRow = [
      'FAC001',
      'Jayashree',
      'G',
      'jayashree199528@gmail.com',
      '8088230042',
      'Female',
      'VA-001',
      'Commerce',
      'Assistant Professor',
      'Full Time',
      '2026-06-15',
      'M.Com, UGC-NET',
      'Financial Accounting',
      'BCom101,BCom102',
      '',
      '5',
      'No',
      '',
    ];
    return [headers.join(','), sampleRow.join(',')].join('\n');
  }
}

/**
 * Normalize boolean-like strings
 */
export function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return ['yes', 'true', '1', 'y', 't', 'hod', 'head'].includes(normalized);
}

/**
 * Normalize employment type strings
 */
export function normalizeEmploymentType(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[\s\-_]+/g, '_');
  const map: Record<string, string> = {
    'FULL_TIME': 'FULL_TIME',
    'FULLTIME': 'FULL_TIME',
    'FULL': 'FULL_TIME',
    'PERMANENT': 'FULL_TIME',
    'PART_TIME': 'PART_TIME',
    'PARTTIME': 'PART_TIME',
    'PART': 'PART_TIME',
    'VISITING': 'VISITING',
    'VISITOR': 'VISITING',
    'ADJUNCT': 'ADJUNCT',
  };
  return map[normalized] || normalized;
}

/**
 * Split comma-separated subjects into array
 */
export function parseSubjects(value: string): string[] {
  if (!value.trim()) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

// ─── BACKWARD COMPATIBILITY ─────────────────────────────────────────────────

/**
 * @deprecated Use parseCSV(csvText, 'students') instead
 */
export function validateStudentCSV(rows: Record<string, string>[]): ValidationResult {
  const parsed: ParsedCSV = {
    headers: [],
    rows,
    rowCount: rows.length,
    mappedHeaders: {},
    unknownHeaders: [],
    warnings: [],
  };
  return validateCSV(parsed, 'students');
}

export default {
  parseCSV,
  validateCSV,
  generateCSVTemplate,
  parseBoolean,
  normalizeEmploymentType,
  parseSubjects,
  validateStudentCSV,
};
