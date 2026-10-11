// src/modules/prep/routes.ts
//
// Public Prep catalog routes — the shareable, college-free URL for browsing
// the platform curriculum (issue: "I need a URL link for Prep studio where I
// can check and verify, without assigning a college").
//
// Deliberately OUTSIDE every RoleRoute/ProtectedRoute: the underlying API
// endpoints serve only PUBLISHED content to anonymous callers, so the page is
// safe to open from any shared link. Draft/in-review content stays visible
// only to the superadmin authoring studio.

import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Lazy on purpose: the public viewer pulls in KaTeX (~590 KB rendered, with
// its CSS) and the prep markdown/company/paper views. Importing it eagerly
// from src/routes put all of that in the entry chunk that every visitor
// downloads, including people who never open /prep.
const PrepPublicViewer = lazy(() => import('./PrepPublicViewer'));

function PrepFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

type PrepView = 'hub' | 'subject' | 'topic' | 'company' | 'papers' | 'paper' | 'repeats';

const viewer = (view: PrepView) => (
  <Suspense fallback={<PrepFallback />}>
    <PrepPublicViewer view={view} />
  </Suspense>
);

export const prepRoutes: RouteObject[] = [
  { path: '/prep', element: viewer("hub") },
  { path: '/prep/subject/:subjectId', element: viewer("subject") },
  { path: '/prep/subject/:subjectId/topic/:topicId', element: viewer("topic") },
  { path: '/prep/company/:companyCode', element: viewer("company") },
  // Previous-year university question papers (published only, like the rest).
  { path: '/prep/papers', element: viewer("papers") },
  // Item 3.3 — repeated-question groupings. Declared BEFORE /prep/papers/:paperId
  // so 'repeats' can never be read as a paper id.
  { path: '/prep/papers/repeats', element: viewer("repeats") },
  { path: '/prep/papers/:paperId', element: viewer("paper") },
];
