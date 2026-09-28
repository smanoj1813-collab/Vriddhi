// functions/src/subpartMerge.ts
// Shared sub-topic awareness, used by BOTH parse pipelines:
//   • paperParsing.ts  — faculty/admin paper upload (deterministic + Gemini)
//   • questionImport.ts — superadmin bulk "Import papers (ZIP / PDF)"
//
// Many university papers print ONE question that carries several sub-topics:
// "(A) … (B) … (C) … (D) …", "a) … b) … c) …", "(i) … (ii) …" or even
// numbered "1) … 2) …" — the whole group is ONE question worth the combined
// marks. These helpers keep such groups together instead of surfacing every
// sub-topic as its own question. Pure: no Firebase, no network, no disk.

/** Leading marker on a line that starts with a sub-topic: "(A)", "b)", "(ii)", "1)" … */
const SUBPART_LEADING_RE = /^\s*(?:\(\s*([a-hA-H]|i{1,3}|iv|v|vi|vii|viii|\d{1,2})\s*\)|([a-h]|i{1,3}|iv|v|vi|vii|viii)\s*[.)])\s/

export function leadingSubpartMarker(text: string): string | null {
  const match = text.match(SUBPART_LEADING_RE)
  if (!match) return null
  return match[1] || match[2]
}

/** "a" / "(a)" / "i" / "1" — markers that can legitimately OPEN a fresh group. */
export function isFirstSubpartMarker(marker: string): boolean {
  const compact = marker.toLowerCase()
  return compact === 'a' || compact === 'i' || compact === '1'
}

const SUBPART_ORDER_ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii']
const SUBPART_ORDER_LETTERS = 'abcdefgh'

/** Ordering rank of a marker: a→0 … h→7, roman i→0 … viii→7, digits by value. */
export function subpartRank(marker: string): number {
  const compact = marker.toLowerCase()
  const roman = SUBPART_ORDER_ROMAN.indexOf(compact)
  if (roman >= 0) return roman
  const letter = SUBPART_ORDER_LETTERS.indexOf(compact)
  if (letter >= 0) return letter
  return Number(compact)
}

/** True when the text visibly contains a letter/roman sub-topic marker. */
const SUBPART_ANYWHERE_RE = /(?:^|[\s(])(?:[a-hA-H]|i{1,3}|iv|v|vi|vii|viii)\s*[.)]/

export function containsSubpartMarker(text: string): boolean {
  return SUBPART_ANYWHERE_RE.test(text)
}

/**
 * Scans every letter/roman marker occurrence ("(A)", "b)", "(ii)" …) in a
 * text. Deliberately ignores BARE digits: "11." / "2025." are question
 * numbers and dates, and counting them as a marker chain would block a
 * legitimate "(a) …" sub-part from merging into its "Answer the following :"
 * stem. (Digit sub-part chains are tracked separately, with layout context,
 * by the deterministic parser.)
 */
const SUBPART_MARKER_SCAN_RE = /(?:\(|\b)([a-hA-H]|i{1,3}|iv|v|vi|vii|viii)\s*[.)]/g

/** Rank of the LAST letter/roman sub-topic marker inside the text, or null. */
export function lastSubpartRank(text: string): number | null {
  let last: number | null = null
  for (const match of text.matchAll(SUBPART_MARKER_SCAN_RE)) {
    last = subpartRank(match[1])
  }
  return last
}

/**
 * True when a question's text opens a numbered sub-part group
 * ("Answer the following :", "Answer any two of the following …"). A bare
 * trailing colon is deliberately NOT enough here — many plain questions end
 * with ":" and their successor is a fresh question, not a sub-part. The
 * "of the following" inside MCQ stems ("Which of the following …?") must NOT
 * count, so the phrase must be an instruction ("answer … following") or the
 * line must END with "following :".
 */
export function prevOpensNumberedSubparts(text: string): boolean {
  if (/\banswer\s+(?:the|any|all)\b[^.?!]{0,60}?\bfollowing\b/i.test(text)) return true
  if (/following\s*[:：]\s*$/i.test(text)) return true
  return false
}

/**
 * True when a question "opens the door" for sub-topics: it already carries a
 * marker, ends with a colon, or is an "Answer the following"-style opener.
 */
export function prevAcceptsSubpart(text: string): boolean {
  return containsSubpartMarker(text) || /[:：]\s*$/.test(text) || prevOpensNumberedSubparts(text)
}

/** Marks rule shared by both merge paths: sum when both are known, keep the
 * known one otherwise — never invent anything. */
export function combinedMarks(prevMarks: number, curMarks: number): number {
  if (prevMarks > 0 && curMarks > 0) return Math.round((prevMarks + curMarks) * 100) / 100
  return Math.max(prevMarks, curMarks)
}

/**
 * Re-combines sub-topic entries that a line-based pass (or the AI) split into
 * separate questions:
 *  • a question starting with "(b)" / "b)" / "(ii)" can never be standalone,
 *    so it always joins the previous question;
 *  • a FIRST marker ("(a)" / "(i)") joins the previous question only when
 *    that question opens a group ("Answer the following :", already carries
 *    markers …) AND its marker chain has not reached this marker yet — so a
 *    fresh "(A) …" question after a finished "(A)…(D)" group stays separate.
 * Digit-leading entries are NOT merged here — "1)" style top-level numbering
 * exists and needs the layout context only the deterministic pass has.
 */
export function mergeSubpartQuestions<T extends { text: string; marks: number }>(questions: T[]): T[] {
  const out: T[] = []
  for (const question of questions) {
    const prev = out[out.length - 1]
    const marker = leadingSubpartMarker(question.text)
    const isDigit = marker !== null && /^\d+$/.test(marker)
    if (prev && marker && !isDigit) {
      const first = isFirstSubpartMarker(marker)
      const prevRank = lastSubpartRank(prev.text)
      if (!first || (prevAcceptsSubpart(prev.text) && (prevRank === null || prevRank < subpartRank(marker)))) {
        out[out.length - 1] = {
          ...prev,
          text: `${prev.text} ${question.text}`.replace(/\s+/g, ' ').trim(),
          marks: combinedMarks(prev.marks, question.marks),
        }
        continue
      }
    }
    out.push(question)
  }
  return out
}
