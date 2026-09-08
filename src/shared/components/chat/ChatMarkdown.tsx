// src/shared/components/chat/ChatMarkdown.tsx
import React, { useMemo } from 'react';

/**
 * Zero-dependency markdown renderer for AI chat replies.
 *
 * Vriddhi's assistant answers are authored (and prompted) in a constrained
 * markdown subset: ATX headings, **bold**, *italic*, `code`, "- " bullets,
 * "1. " numbered steps, "> " callouts and "---" rules. Rendering them as real
 * markup — instead of dumping the raw string into a <div> — is what turns
 * "### 📊 Attendance" into an actual section header.
 *
 * Safety: output is assembled from React elements only. There is no
 * dangerouslySetInnerHTML, so markdown arriving from the model can never
 * inject markup.
 */

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'rule' }
  | { kind: 'paragraph'; lines: string[] };

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE_RE = /^\s*>\s?(.*)$/;
const RULE_RE = /^\s*(?:[-*_]\s*){3,}$/;
const INLINE_RE = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^\s)]+\)|\*[^*\n]+\*|`[^`\n]+`)/;

/** Splits a reply into structural blocks. Blank lines separate blocks. */
function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n/g, '\n').split('\n');

  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'paragraph', lines: paragraph });
      paragraph = [];
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    // Trailing "___" separators are cosmetic in assistant replies.
    if (RULE_RE.test(line.trim())) {
      flushParagraph();
      blocks.push({ kind: 'rule' });
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      flushParagraph();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() });
      continue;
    }

    const quote = line.match(QUOTE_RE);
    if (quote) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'quote') last.lines.push(quote[1].trim());
      else blocks.push({ kind: 'quote', lines: [quote[1].trim()] });
      continue;
    }

    const bullet = line.match(BULLET_RE);
    const ordered = bullet ? null : line.match(ORDERED_RE);
    if (bullet || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const text = (bullet ? bullet[1] : ordered![1]).trim();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === 'list' && last.ordered === isOrdered) last.items.push(text);
      else blocks.push({ kind: 'list', ordered: isOrdered, items: [text] });
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  return blocks;
}

/** Renders **bold**, *italic* and `code` inside a single line. */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let i = 0;

  while (rest.length) {
    const match = rest.match(INLINE_RE);
    if (!match || match.index === undefined) {
      nodes.push(rest);
      break;
    }
    if (match.index > 0) nodes.push(rest.slice(0, match.index));

    const token = match[0];
    const key = `${keyBase}-${i++}`;
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-slate-900 dark:text-white">
          {renderInline(token.slice(2, -2), key)}
        </strong>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="px-1 py-px rounded bg-slate-100 dark:bg-slate-800 font-mono text-[0.9em] text-teal-700 dark:text-teal-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const close = token.lastIndexOf('](');
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      // External links are only mounted for http(s); anything else (javascript:,
      // data:, a stray relative path) is shown as the literal text the model sent.
      if (/^https?:\/\//i.test(href)) {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 underline decoration-teal-400/50 underline-offset-2"
          >
            {renderInline(label, key)}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(
        <em key={key} className="italic text-slate-600 dark:text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }

    rest = rest.slice(match.index + token.length);
  }

  return nodes;
}

const headingClass = (level: number) => {
  if (level <= 2) return 'text-[1.05em] font-bold text-slate-900 dark:text-white mt-3 mb-1 first:mt-0';
  if (level === 3) return 'text-[1em] font-bold text-slate-900 dark:text-white mt-3 mb-1 first:mt-0';
  return 'text-[0.92em] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300 mt-2.5 mb-1 first:mt-0';
};

export default function ChatMarkdown({ content, className = '' }: ChatMarkdownProps) {
  const blocks = useMemo(() => parseBlocks(content || ''), [content]);

  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        const key = `b-${idx}`;

        if (block.kind === 'heading') {
          return (
            <p key={key} className={headingClass(block.level)}>
              {renderInline(block.text, key)}
            </p>
          );
        }

        if (block.kind === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag
              key={key}
              className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-4 mb-1 marker:text-teal-500`}
            >
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`} className="pl-0.5">
                  {renderInline(item, `${key}-${i}`)}
                </li>
              ))}
            </Tag>
          );
        }

        if (block.kind === 'quote') {
          return (
            <blockquote
              key={key}
              className="my-2 rounded-r-lg border-l-[3px] border-teal-400 bg-teal-50/70 dark:bg-teal-950/40 px-3 py-2 space-y-1 text-slate-700 dark:text-slate-200"
            >
              {block.lines.map((line, i) => (
                <p key={`${key}-${i}`}>{renderInline(line, `${key}-${i}`)}</p>
              ))}
            </blockquote>
          );
        }

        if (block.kind === 'rule') {
          return <hr key={key} className="my-2.5 border-slate-200 dark:border-slate-700" />;
        }

        return (
          <p key={key} className="mb-1 last:mb-0">
            {block.lines.map((line, i) => (
              <React.Fragment key={`${key}-${i}`}>
                {i > 0 && <br />}
                {renderInline(line, `${key}-${i}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
