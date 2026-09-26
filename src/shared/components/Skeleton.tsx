// src/shared/components/Skeleton.tsx
// ------------------------------------------------------------------
// Perceived-performance primitives. A centred spinner on an empty page tells
// the brain "wait"; a skeleton shaped like the content that is about to
// arrive tells it "almost there" — the same data feels faster. Use these in
// place of full-page `animate-spin` loaders on the heavy list pages.
// ------------------------------------------------------------------
import type { ReactNode } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/50 ${className}`}
    />
  );
}

/**
 * A card-framed table placeholder: header strip + `rows` × `cols` cell
 * blocks. Mirrors the `.glass-card > table` rhythm the data pages use, so the
 * swap to real content does not jump the layout.
 */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="glass-card overflow-hidden p-0"
      role="status"
      aria-label="Loading data"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="px-4 py-3.5 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3 flex-1 ${c === 0 ? 'max-w-[28%]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Full-page placeholder: title block, a row of stat cards and a table.
 * Drop-in replacement for the `min-h-[60vh]` centred-spinner pattern.
 */
export function PageSkeleton({
  stats = 4,
  rows = 6,
  cols = 5,
  header,
}: {
  stats?: number;
  rows?: number;
  cols?: number;
  /** Optional real header (title/filters) to keep interactive while loading. */
  header?: ReactNode;
}) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page" aria-busy="true">
      {header ?? (
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl hidden sm:block" />
        </div>
      )}
      {stats > 0 && (
        <div className={`grid gap-4 ${stats >= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      )}
      <TableSkeleton rows={rows} cols={cols} />
    </div>
  );
}
