// src/shared/components/PortalPageEnter.tsx
//
// Wraps a workspace page in the one-shot entrance defined in
// portalExperience.css, and re-keys it on navigation so the animation plays
// when a person moves between sections — not only on first load.
//
// Why a key rather than an effect: CSS animations run once per element when it
// mounts. Remounting the wrapper per pathname is the whole mechanism; there is
// no timer, no state, and nothing to clean up. That keeps the cost at one extra
// element per page and guarantees the motion can never become a loop.
//
// It deliberately does NOT wrap the exam surface: a full-bleed test in progress
// must not animate, and StudentLayout skips it there.
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export default function PortalPageEnter({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // Keyed by pathname so each destination replays the entrance; the same route
  // re-rendering (a poll, a state change) does not.
  return (
    <div key={pathname} className="portal-page-enter">
      {children}
    </div>
  );
}
