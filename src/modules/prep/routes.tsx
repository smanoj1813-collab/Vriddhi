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

import type { RouteObject } from 'react-router-dom';
import PrepPublicViewer from './PrepPublicViewer';

export const prepRoutes: RouteObject[] = [
  { path: '/prep', element: <PrepPublicViewer view="hub" /> },
  { path: '/prep/subject/:subjectId', element: <PrepPublicViewer view="subject" /> },
  { path: '/prep/subject/:subjectId/topic/:topicId', element: <PrepPublicViewer view="topic" /> },
  { path: '/prep/company/:companyCode', element: <PrepPublicViewer view="company" /> },
  // Previous-year university question papers (published only, like the rest).
  { path: '/prep/papers', element: <PrepPublicViewer view="papers" /> },
  { path: '/prep/papers/:paperId', element: <PrepPublicViewer view="paper" /> },
];
