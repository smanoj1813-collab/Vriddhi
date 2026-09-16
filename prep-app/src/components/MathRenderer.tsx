// prep-app/src/components/MathRenderer.tsx
import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function MathRenderer({ math, block = false, className = '' }: MathRendererProps) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode: block,
      throwOnError: false,
    });
    return (
      <span
        className={`${block ? 'block my-2 overflow-x-auto text-center' : 'inline font-mono'} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (e) {
    return <code className="font-mono text-xs">{math}</code>;
  }
}

/**
 * Parses markdown text containing $$block math$$ or $inline math$
 * and renders with KaTeX display & inline math modes.
 */
export function renderMarkdownWithMath(text: string): React.ReactNode {
  if (!text) return null;

  // Split on $$...$$ display math blocks
  const displayBlocks = text.split(/(\$\$[\s\S]+?\$\$)/g);

  return (
    <>
      {displayBlocks.map((segment, sIdx) => {
        if (segment.startsWith('$$') && segment.endsWith('$$') && segment.length >= 4) {
          const innerMath = segment.slice(2, -2).trim();
          return (
            <div
              key={sIdx}
              className="my-3 py-3 px-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 overflow-x-auto text-center text-teal-950 dark:text-teal-200 shadow-sm"
            >
              <MathRenderer math={innerMath} block />
            </div>
          );
        }

        // Within normal text segments, handle inline $...$ math
        const inlineParts = segment.split(/(\$[^\$\n]+\$)/g);
        return (
          <React.Fragment key={sIdx}>
            {inlineParts.map((part, pIdx) => {
              if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                const inner = part.slice(1, -1);
                return <MathRenderer key={pIdx} math={inner} />;
              }
              return part;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

