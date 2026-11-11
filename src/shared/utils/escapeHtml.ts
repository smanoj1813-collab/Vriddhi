// Minimal HTML entity escaping for the handful of places that build markup as a
// string instead of as React elements.
//
// React escapes interpolations for you; a template literal written into
// `document.write`, `innerHTML` or `dangerouslySetInnerHTML` does not. The same
// five replacements are used by pdfGenerator and timetableExport; this module is
// the dependency-free copy so a component does not have to import a PDF library
// to escape a string.
//
// `&` must be replaced first, or the entities produced by the later replacements
// would themselves be double-escaped.
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
