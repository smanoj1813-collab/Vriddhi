// src/shared/components/courses/CourseMarkdown.tsx
//
// Dependency-free Markdown renderer for the bundled course lessons.
//
// Supports what the lesson authoring template uses and nothing more:
// headings (# … ####), paragraphs, ordered / unordered / nested / task lists,
// fenced code blocks (used for prompts), block quotes (used as call-outs),
// GFM pipe tables, horizontal rules, links, http(s) images and inline
// **bold**, *italic*, `code`. Raw HTML is never rendered — the content is
// trusted authoring, but keeping it text-only means a stray "<script>" in a
// lesson can do nothing.

import React, { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'

// ─── Block model ─────────────────────────────────────────────────────────────

type ListItem = { text: string; children: ListBlock[]; checked?: boolean | null }
type ListBlock = { kind: 'list'; ordered: boolean; start: number; items: ListItem[] }
type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'table'; header: string[]; align: Array<'left' | 'center' | 'right' | null>; rows: string[][] }
  | { kind: 'hr' }
  | { kind: 'image'; alt: string; src: string }
  | ListBlock

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/
const TABLE_SEP_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  const flushParagraph = (buf: string[]) => {
    if (buf.length) blocks.push({ kind: 'paragraph', text: buf.join(' ').trim() })
    buf.length = 0
  }

  const para: string[] = []

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Blank line ends a paragraph.
    if (!trimmed) {
      flushParagraph(para)
      i += 1
      continue
    }

    // Fenced code block.
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/)
    if (fence) {
      flushParagraph(para)
      const lang = fence[1] || ''
      const code: string[] = []
      i += 1
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        code.push(lines[i])
        i += 1
      }
      i += 1 // closing fence
      blocks.push({ kind: 'code', lang, code: code.join('\n') })
      continue
    }

    // Heading.
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/)
    if (heading) {
      flushParagraph(para)
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] })
      i += 1
      continue
    }

    // Horizontal rule.
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flushParagraph(para)
      blocks.push({ kind: 'hr' })
      i += 1
      continue
    }

    // Stand-alone image (http(s) only).
    const image = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/)
    if (image) {
      flushParagraph(para)
      blocks.push({ kind: 'image', alt: image[1], src: image[2] })
      i += 1
      continue
    }

    // Block quote: collect consecutive "> " lines and parse recursively.
    if (/^\s{0,3}>/.test(line)) {
      flushParagraph(para)
      const inner: string[] = []
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
        inner.push(lines[i].replace(/^\s{0,3}>\s?/, ''))
        i += 1
      }
      blocks.push({ kind: 'quote', blocks: parseBlocks(inner.join('\n')) })
      continue
    }

    // Table: a header row followed by a separator row.
    if (trimmed.startsWith('|') && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      flushParagraph(para)
      const header = splitRow(lines[i])
      const align = splitRow(lines[i + 1]).map((cell) => {
        const c = cell.trim()
        if (c.startsWith(':') && c.endsWith(':')) return 'center' as const
        if (c.endsWith(':')) return 'right' as const
        if (c.startsWith(':')) return 'left' as const
        return null
      })
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]))
        i += 1
      }
      blocks.push({ kind: 'table', header, align, rows })
      continue
    }

    // List: gather the whole run (including indented continuation lines).
    if (LIST_RE.test(line)) {
      flushParagraph(para)
      const run: string[] = []
      while (i < lines.length) {
        const l = lines[i]
        if (!l.trim()) {
          // A blank line inside a list is allowed if the next non-blank line is
          // still part of the list (indented or another item).
          const next = lines[i + 1]
          if (next !== undefined && (LIST_RE.test(next) || /^\s{2,}\S/.test(next))) {
            run.push('')
            i += 1
            continue
          }
          break
        }
        if (LIST_RE.test(l) || /^\s{2,}\S/.test(l)) {
          run.push(l)
          i += 1
          continue
        }
        break
      }
      blocks.push(parseList(run))
      continue
    }

    para.push(trimmed)
    i += 1
  }
  flushParagraph(para)
  return blocks
}

function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  // Split on unescaped pipes.
  const cells: string[] = []
  let cur = ''
  for (let k = 0; k < s.length; k += 1) {
    const ch = s[k]
    if (ch === '\\' && s[k + 1] === '|') {
      cur += '|'
      k += 1
    } else if (ch === '|') {
      cells.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur.trim())
  return cells
}

/** Parse a run of list lines into a (possibly nested) list block. */
function parseList(run: string[]): ListBlock {
  type Raw = { indent: number; ordered: boolean; start: number; text: string[] }
  const raws: Raw[] = []
  for (const line of run) {
    const m = line.match(LIST_RE)
    if (m) {
      const marker = m[2]
      const ordered = /\d/.test(marker)
      raws.push({ indent: m[1].length, ordered, start: ordered ? parseInt(marker, 10) : 1, text: [m[3]] })
    } else if (raws.length) {
      // Continuation line (or blank inside an item). A quoted line inside an
      // item ("   > text") is kept as emphasised text — nested block quotes are
      // not modelled inside lists.
      const t = line.trim()
      raws[raws.length - 1].text.push(t.startsWith('>') ? `*${t.replace(/^>\s?/, '')}*` : t)
    }
  }

  const build = (startIdx: number, indent: number): { block: ListBlock; next: number } => {
    const block: ListBlock = { kind: 'list', ordered: raws[startIdx].ordered, start: raws[startIdx].start, items: [] }
    let idx = startIdx
    while (idx < raws.length) {
      const raw = raws[idx]
      if (raw.indent < indent) break
      if (raw.indent > indent) {
        // Nested list under the previous item.
        const nested = build(idx, raw.indent)
        const parent = block.items[block.items.length - 1]
        if (parent) parent.children.push(nested.block)
        else block.items.push({ text: '', children: [nested.block] })
        idx = nested.next
        continue
      }
      const text = raw.text.join(' ').replace(/\s+/g, ' ').trim()
      const task = text.match(/^\[( |x|X)\]\s+(.*)$/)
      block.items.push({
        text: task ? task[2] : text,
        children: [],
        checked: task ? task[1] !== ' ' : null,
      })
      idx += 1
    }
    return { block, next: idx }
  }

  return build(0, raws[0]?.indent ?? 0).block
}

// ─── Inline rendering ────────────────────────────────────────────────────────

const INLINE_SOURCE = /(`[^`\n]+`)|(!\[[^\]]*\]\(https?:\/\/[^\s)]+\))|(\[[^\]\n]+\]\([^\s)]+\))|(\*\*[^*\n]+?\*\*)|(__[^_\n]+?__)|(\*[^*\n]+?\*)|(_[^_\n]+?_)/.source

export function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let n = 0
  let m: RegExpExecArray | null
  // A fresh regex per call: renderInline recurses for bold / link contents,
  // and a shared global regex would have its lastIndex reset by the inner
  // loop, restarting the outer one forever.
  const re = new RegExp(INLINE_SOURCE, 'g')
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyBase}-${n++}`
    if (m[1]) {
      out.push(
        <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          {tok.slice(1, -1)}
        </code>,
      )
    } else if (m[2]) {
      const im = tok.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/)
      if (im) out.push(<img key={key} src={im[2]} alt={im[1]} loading="lazy" className="my-2 inline-block max-w-full rounded-lg" />)
    } else if (m[3]) {
      const lm = tok.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/)
      if (lm) {
        const href = lm[2]
        const safe = /^(https?:\/\/|mailto:|\/|#)/i.test(href)
        out.push(
          safe ? (
            <a
              key={key}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-700 dark:hover:text-teal-200"
            >
              {renderInline(lm[1], `${key}-l`)}
            </a>
          ) : (
            <span key={key}>{lm[1]}</span>
          ),
        )
      }
    } else if (m[4] || m[5]) {
      out.push(<strong key={key} className="font-semibold text-slate-900 dark:text-white">{renderInline(tok.slice(2, -2), `${key}-b`)}</strong>)
    } else if (m[6] || m[7]) {
      out.push(<em key={key}>{renderInline(tok.slice(1, -1), `${key}-i`)}</em>)
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// ─── Block rendering ─────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  const isPrompt = !lang || lang === 'text' || lang === 'prompt' || lang === 'md' || lang === 'markdown'
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  }
  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
        <span>{isPrompt ? 'Prompt' : lang}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/40"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
        <code className="whitespace-pre-wrap break-words font-mono">{code}</code>
      </pre>
    </div>
  )
}

function ListView({ block, keyBase }: { block: ListBlock; keyBase: string }) {
  const Tag = block.ordered ? 'ol' : 'ul'
  return (
    <Tag
      start={block.ordered ? block.start : undefined}
      className={`my-3 space-y-1.5 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-teal-600 dark:marker:text-teal-400`}
    >
      {block.items.map((item, idx) => (
        <li key={`${keyBase}-${idx}`} className="leading-relaxed text-slate-700 dark:text-slate-300">
          {item.checked !== null && item.checked !== undefined ? (
            <span
              aria-hidden
              className={`mr-2 inline-flex h-4 w-4 -translate-y-px items-center justify-center rounded border align-middle text-[10px] ${
                item.checked
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-slate-400 bg-white dark:bg-slate-900'
              }`}
            >
              {item.checked ? '✓' : ''}
            </span>
          ) : null}
          {renderInline(item.text, `${keyBase}-${idx}`)}
          {item.children.map((child, cIdx) => (
            <ListView key={`${keyBase}-${idx}-c${cIdx}`} block={child} keyBase={`${keyBase}-${idx}-c${cIdx}`} />
          ))}
        </li>
      ))}
    </Tag>
  )
}

function BlockView({ block, keyBase, depth }: { block: Block; keyBase: string; depth: number }) {
  switch (block.kind) {
    case 'heading': {
      const cls: Record<number, string> = {
        1: 'mt-2 mb-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white',
        2: 'mt-8 mb-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5',
        3: 'mt-6 mb-2 text-base font-bold text-slate-900 dark:text-white',
        4: 'mt-4 mb-1.5 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300',
      }
      const level = Math.min(block.level, 4)
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
      return <Tag className={cls[level]}>{renderInline(block.text, keyBase)}</Tag>
    }
    case 'paragraph':
      return <p className="my-3 leading-relaxed text-slate-700 dark:text-slate-300">{renderInline(block.text, keyBase)}</p>
    case 'code':
      return <CodeBlock code={block.code} lang={block.lang} />
    case 'hr':
      return <hr className="my-8 border-slate-200 dark:border-slate-800" />
    case 'image':
      return (
        <figure className="my-4">
          <img src={block.src} alt={block.alt} loading="lazy" className="mx-auto max-w-full rounded-xl border border-slate-200 dark:border-slate-700" />
          {block.alt ? <figcaption className="mt-1.5 text-center text-xs text-slate-500">{block.alt}</figcaption> : null}
        </figure>
      )
    case 'quote': {
      // A lead-in like "**Lesson plan**" or "**Think about it:**" styles the call-out.
      const first = block.blocks[0]
      const lead = first && first.kind === 'paragraph' ? first.text.match(/^\*\*([^*]+)\*\*/)?.[1]?.toLowerCase() || '' : ''
      const tone = /plan|time|duration/.test(lead)
        ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/30'
        : /warn|caution|careful|never|do not/.test(lead)
          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
          : 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30'
      return (
        <blockquote className={`my-4 rounded-r-xl border-l-4 px-4 py-2 text-[15px] ${tone} [&>p]:my-1.5`}>
          {block.blocks.map((b, idx) => (
            <BlockView key={`${keyBase}-q${idx}`} block={b} keyBase={`${keyBase}-q${idx}`} depth={depth + 1} />
          ))}
        </blockquote>
      )
    }
    case 'table':
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[480px] border-collapse text-[14px]">
            <thead className="bg-slate-50 dark:bg-slate-800/70">
              <tr>
                {block.header.map((h, idx) => (
                  <th
                    key={`${keyBase}-h${idx}`}
                    className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100"
                    style={{ textAlign: block.align[idx] || 'left' }}
                  >
                    {renderInline(h, `${keyBase}-h${idx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={`${keyBase}-r${rIdx}`} className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900/40 dark:even:bg-slate-800/40">
                  {block.header.map((_, cIdx) => (
                    <td
                      key={`${keyBase}-r${rIdx}c${cIdx}`}
                      className="border-b border-slate-100 px-3 py-2 align-top leading-relaxed text-slate-700 dark:border-slate-800 dark:text-slate-300"
                      style={{ textAlign: block.align[cIdx] || 'left' }}
                    >
                      {renderInline(row[cIdx] ?? '', `${keyBase}-r${rIdx}c${cIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'list':
      return <ListView block={block} keyBase={keyBase} />
    default:
      return null
  }
}

export interface CourseMarkdownProps {
  source: string
  /** Skip the first H1 when the page already renders the title. */
  skipTitle?: boolean
  className?: string
}

export default function CourseMarkdown({ source, skipTitle = false, className = '' }: CourseMarkdownProps) {
  const blocks = useMemo(() => {
    const parsed = parseBlocks(source || '')
    if (skipTitle && parsed[0]?.kind === 'heading' && parsed[0].level === 1) return parsed.slice(1)
    return parsed
  }, [source, skipTitle])

  return (
    <div className={`course-markdown text-[15px] ${className}`}>
      {blocks.map((block, idx) => (
        <BlockView key={idx} block={block} keyBase={`b${idx}`} depth={0} />
      ))}
    </div>
  )
}

/** Exposed for tests. */
export const __internal = { parseBlocks }
