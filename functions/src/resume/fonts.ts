// functions/src/resume/fonts.ts
//
// Fonts for the resume PDFs. Cloud Functions' Chrome has almost no fonts of
// its own, so the print HTML embeds the two families the templates use as
// base64 `@font-face` rules (latin + latin-ext, ≈350 KB, cached in module memory). The browser
// preview loads the same families from Google Fonts instead so the preview
// payload stays small — the same names, weights and metrics either way.
//
// Text stays text: embedding a font subset in a PDF does not change how an
// ATS extracts it; Chrome writes a ToUnicode map for every embedded glyph.

import { readFileSync } from 'fs'

export type ResumeFontFace = 'inter' | 'source-serif-4'

interface FontFile {
  face: ResumeFontFace
  family: string
  weight: 400 | 600 | 700
  subset: 'latin' | 'latin-ext'
  specifier: string
}

// Google's subset ranges. `latin-ext` matters for Indian resumes: it carries
// the rupee sign (U+20B9) and the accented letters in names like "Zoë" or
// "José"; without it Chrome would fall back to whatever font the runtime has
// (often nothing) and print a blank box.
const UNICODE_RANGE: Record<FontFile['subset'], string> = {
  latin:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, ' +
    'U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext':
    'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, ' +
    'U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
}

function fontFiles(): FontFile[] {
  const out: FontFile[] = []
  const families: Array<{ face: ResumeFontFace; family: string; pkg: string; file: string }> = [
    { face: 'inter', family: 'Inter', pkg: '@fontsource/inter', file: 'inter' },
    { face: 'source-serif-4', family: 'Source Serif 4', pkg: '@fontsource/source-serif-4', file: 'source-serif-4' },
  ]
  for (const f of families) {
    for (const subset of ['latin', 'latin-ext'] as const) {
      for (const weight of [400, 600, 700] as const) {
        out.push({ face: f.face, family: f.family, weight, subset, specifier: `${f.pkg}/files/${f.file}-${subset}-${weight}-normal.woff2` })
      }
    }
  }
  return out
}

const FONT_FILES: readonly FontFile[] = fontFiles()

const cache = new Map<ResumeFontFace, string>()

function loadFace(face: ResumeFontFace, logger: Pick<Console, 'warn'> = console): string {
  const cached = cache.get(face)
  if (cached !== undefined) return cached
  const rules: string[] = []
  for (const file of FONT_FILES) {
    if (file.face !== face) continue
    try {
      const path = require.resolve(file.specifier)
      const base64 = readFileSync(path).toString('base64')
      rules.push(
        `@font-face{font-family:'${file.family}';font-style:normal;font-weight:${file.weight};font-display:block;` +
          `src:url(data:font/woff2;base64,${base64}) format('woff2');unicode-range:${UNICODE_RANGE[file.subset]};}`,
      )
    } catch (err) {
      // Missing package or file: the template's fallback stack (Arial/Georgia) takes over.
      logger.warn(`[resume/fonts] could not embed ${file.specifier}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  const css = rules.join('\n')
  cache.set(face, css)
  return css
}

/** Inline `@font-face` CSS for the faces a template needs (print mode). */
export function inlineFontCss(faces: readonly ResumeFontFace[], logger?: Pick<Console, 'warn'>): string {
  return Array.from(new Set(faces)).map((face) => loadFace(face, logger)).filter(Boolean).join('\n')
}

/** `<link>` tags for the same faces from Google Fonts (browser preview mode). */
export function linkedFontHtml(faces: readonly ResumeFontFace[]): string {
  const families: string[] = []
  if (faces.includes('inter')) families.push('family=Inter:wght@400;600;700')
  if (faces.includes('source-serif-4')) families.push('family=Source+Serif+4:wght@400;600;700')
  if (!families.length) return ''
  return (
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.join('&')}&display=swap">`
  )
}

/** Test seam: forget the cached CSS. */
export function resetFontCache(): void {
  cache.clear()
}
