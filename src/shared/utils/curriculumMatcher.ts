// ═══════════════════════════════════════════════════════════════════════
// src/shared/utils/curriculumMatcher.ts
// Canonical Topic and Subject Normalization Engine
// Decouples local university / college codes (e.g. "BBA 3.1", "COM-302", "21CS32")
// from universal academic subject and topic names.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Strips university course codes, degree abbreviations, paper numbers,
 * and punctuation to extract the canonical, cross-institution subject name.
 *
 * Examples:
 *   "BBA 3.1 — Cost Accounting"          -> "cost accounting"
 *   "COM 302: Advanced Financial Acc"    -> "advanced financial acc"
 *   "21CS32 - Data Structures & App"     -> "data structures app"
 *   "B.Com (Hons) - Corporate Accounting"-> "corporate accounting"
 */
export function extractCanonicalSubject(raw: string | null | undefined): string {
  if (!raw) return '';

  let cleaned = String(raw).trim();

  // Remove common course/degree prefixes with codes, e.g.:
  // "BBA 3.1 - ", "B.COM 1.2: ", "BCA-301 ", "21CS32 - ", "CS8391: ", "Paper IV: "
  cleaned = cleaned.replace(
    /^(?:bba|b\.?\s*com(?:\s*\(hons\))?|bca|ba|b\.?\s*sc|b\.?\s*tech|be|mba|m\.?\s*com|mca)\s*[-–:]*\s*[\w\.\-]+(?:\s*[-–:]+\s*|\s+)/i,
    ''
  );

  // Remove university paper code patterns at the beginning like "21CS32 -", "COM302 -", "BCAC-101:"
  cleaned = cleaned.replace(/^(?:\d{2,4})?[a-z]{2,5}\s*[-–:]*\s*\d{2,4}[a-z]?\s*[-–:]+\s*/i, '');

  // Remove generic "Paper I", "Paper 1", "Course 3"
  cleaned = cleaned.replace(/^(?:paper|course|subject)\s*[-–:]*\s*(?:[ivxlcdm]+|\d+)\s*[-–:]+\s*/i, '');

  // Normalize separator dashes or colons if leftover
  cleaned = cleaned.replace(/^[-–:]+\s*/, '');

  // Strip punctuation and reduce whitespace
  cleaned = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Strips module/unit numbering, roman numerals, and chapter tags
 * to extract the canonical academic topic name.
 *
 * Examples:
 *   "Unit 3: Marginal Costing & BEP"     -> "marginal costing bep"
 *   "Module II - Capital Budgeting"      -> "capital budgeting"
 *   "Chapter 4: Process Costing"         -> "process costing"
 */
export function extractCanonicalTopic(raw: string | null | undefined): string {
  if (!raw) return '';

  let cleaned = String(raw).trim();

  // Remove "Unit 1:", "Unit - III:", "Module 2 -", "Chapter 4:"
  cleaned = cleaned.replace(
    /^(?:unit|module|chapter|session|part)\s*[-–:]*\s*(?:[ivxlcdm]+|\d+[\.\d]*)\s*[-–:]+\s*/i,
    ''
  );

  // Remove trailing hour or mark markers like "(10 Hours)", "[8 Marks]"
  cleaned = cleaned.replace(/\s*[\(\[]\s*\d+\s*(?:hrs?|hours?|marks?)\s*[\)\]]/gi, '');

  cleaned = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Checks if two subject strings refer to the same academic discipline.
 * Returns true if canonical forms match or if there is a strong token overlap.
 */
export function isSameSubject(subjectA: string, subjectB: string): boolean {
  if (!subjectA || !subjectB) return false;

  const a = extractCanonicalSubject(subjectA);
  const b = extractCanonicalSubject(subjectB);

  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  // Token-based Jaccard similarity for multi-word subjects (e.g. "principles of cost accounting" vs "cost accounting")
  const tokensA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const tokensB = new Set(b.split(/\s+/).filter(w => w.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union >= 0.5;
}

/**
 * Checks if two topic titles refer to the same academic concept.
 */
export function isSameTopic(topicA: string, topicB: string): boolean {
  if (!topicA || !topicB) return false;

  const a = extractCanonicalTopic(topicA);
  const b = extractCanonicalTopic(topicB);

  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const tokensA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const tokensB = new Set(b.split(/\s+/).filter(w => w.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union >= 0.5;
}
