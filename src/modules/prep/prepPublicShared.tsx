// src/modules/prep/prepPublicShared.tsx
//
// Building blocks shared by the public /prep views (catalog, topic, company):
// program labels, the tiny markdown renderer, share button and difficulty chip.
// Kept separate so PrepPublicViewer and PrepCompanyViews do not import each
// other.

import React, { useState } from 'react';
import { Box, Button, Chip, Divider, TextField, Typography } from '@mui/material';
import { Check, Share } from '@mui/icons-material';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { formatDifficultyBadge } from '@/shared/utils/prepHelpers';

// Platform catalog, mirroring PREP_PROGRAM_CATALOG in functions/src/prepShared.ts
// (kept local so the public page has no cross-app import into the functions
// source tree).
export const PROGRAMS: Array<{ code: string; label: string; level: 'undergraduate' | 'postgraduate' }> = [
  { code: 'bba', label: 'BBA', level: 'undergraduate' },
  { code: 'bcom', label: 'B.Com', level: 'undergraduate' },
  { code: 'ba', label: 'BA', level: 'undergraduate' },
  { code: 'bsc', label: 'B.Sc', level: 'undergraduate' },
  { code: 'bca', label: 'BCA', level: 'undergraduate' },
  { code: 'mba', label: 'MBA', level: 'postgraduate' },
  { code: 'mcom', label: 'M.Com', level: 'postgraduate' },
  { code: 'mca', label: 'MCA', level: 'postgraduate' },
];

export const PROGRAM_LABELS: Record<string, string> = Object.fromEntries(PROGRAMS.map((p) => [p.code, p.label]));

export const AUDIENCE_LABELS: Record<string, string> = {
  ug: 'UG (BBA / B.Com / BA / B.Sc)',
  pg: 'PG (MBA / M.Com / MCA)',
  tech: 'Tech roles (BCA / MCA)',
};

// ─── Tiny markdown renderer (headings, lists, bold/italic/code, KaTeX) ──────

export function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // $math$ → KaTeX inline, `code` → <code>, **bold** / *italic*
  const parts: React.ReactNode[] = [];
  const pattern = /(\$[^$\n]+\$)|(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (match[1]) {
      const math = token.slice(1, -1);
      let html = '';
      try {
        html = katex.renderToString(math, { throwOnError: false });
      } catch {
        html = '';
      }
      parts.push(
        <code key={`${keyBase}-m${i}`} style={{ fontFamily: 'inherit' }}>
          {html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : math}
        </code>
      );
    } else if (match[2]) {
      parts.push(<code key={`${keyBase}-c${i}`} style={{ background: 'rgba(0,0,0,0.06)', padding: '0 4px', borderRadius: 4 }}>{token.slice(1, -1)}</code>);
    } else if (match[3]) {
      parts.push(<strong key={`${keyBase}-b${i}`}>{token.slice(2, -2)}</strong>);
    } else if (match[4]) {
      parts.push(<em key={`${keyBase}-i${i}`}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
    i += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function PrepMarkdown({ text }: { text: string }) {
  const lines = (text || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items;
    const ordered = list.ordered;
    blocks.push(
      ordered ? (
        <ol key={key++} style={{ margin: '8px 0', paddingLeft: 22 }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>{renderInline(it, `li${key}-${idx}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key++} style={{ margin: '8px 0', paddingLeft: 22 }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>{renderInline(it, `lu${key}-${idx}`)}</li>
          ))}
        </ul>
      )
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const displayMath = line.match(/^\$\$[\s\S]+\$\$/);
    if (displayMath) {
      flushList();
      let html = '';
      try {
        html = katex.renderToString(displayMath[0].slice(2, -2).trim(), { displayMode: true, throwOnError: false });
      } catch {
        html = '';
      }
      blocks.push(
        <Box key={key++} sx={{ my: 1.5, px: 2, py: 1, bgcolor: 'rgba(13,148,136,0.06)', borderRadius: 2, overflowX: 'auto', textAlign: 'center' }}>
          {html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : displayMath[0]}
        </Box>
      );
      continue;
    }
    // ![Caption](https://…) on its own line → figure block. Only http(s)
    // URLs are rendered (the Studio "Upload image" control produces exactly
    // this syntax with a Storage URL).
    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/\S+?)\)\s*$/);
    if (image) {
      flushList();
      blocks.push(
        <Box key={key++} sx={{ my: 1.5, textAlign: 'center' }}>
          <img
            src={image[2]}
            alt={image[1] || 'Diagram'}
            loading="lazy"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)' }}
          />
          {image[1] ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {image[1]}
            </Typography>
          ) : null}
        </Box>,
      );
      continue;
    }
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(<Typography key={key++} variant="subtitle2" sx={{ mt: 2, mb: 0.5, fontWeight: 700 }}>{line.slice(4)}</Typography>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push(<Typography key={key++} variant="h6" sx={{ mt: 2, mb: 0.5, fontWeight: 700 }}>{line.slice(3)}</Typography>);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      blocks.push(<Typography key={key++} variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 800 }}>{line.slice(2)}</Typography>);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushList();
      blocks.push(<Divider key={key++} sx={{ my: 1.5 }} />);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet || numbered)![1]);
      continue;
    }
    flushList();
    blocks.push(<Typography key={key++} variant="body2" sx={{ my: 0.5, lineHeight: 1.7 }}>{renderInline(line, `p${key}`)}</Typography>);
  }
  flushList();
  return <Box>{blocks}</Box>;
}

// ─── Share link ──────────────────────────────────────────────────────────────

export function ShareLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${path}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API can be unavailable on http origins; fall back to a
      // transient prompt so the link is still retrievable.
      window.prompt('Copy this link:', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="small" variant="outlined" onClick={copy} startIcon={copied ? <Check fontSize="inherit" /> : <Share fontSize="inherit" />}>
      {copied ? 'Link copied' : 'Share / copy link'}
    </Button>
  );
}


export function DifficultyChip({ difficulty }: { difficulty?: string }) {
  // formatDifficultyBadge returns Tailwind classes (studio-tab styling); this
  // public page is MUI, so map the difficulty onto MUI chip colors instead.
  const norm = (difficulty || '').toLowerCase();
  const color =
    norm === 'basic' ? ('success' as const)
      : norm === 'advanced' ? ('secondary' as const)
        : ('primary' as const);
  return <Chip size="small" label={formatDifficultyBadge(difficulty).label} color={color} variant="outlined" />;
}
