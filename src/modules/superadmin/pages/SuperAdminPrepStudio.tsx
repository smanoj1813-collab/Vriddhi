// src/modules/superadmin/pages/SuperAdminPrepStudio.tsx
//
// Superadmin → "Prep Content Studio" (direct route: /superadmin/prep-studio)
//
// The Prep-Content authoring console previously lived only inside
// /admin/settings under the "AI Content & Cost" tab, which made it effectively
// undiscoverable for superadmins — the Settings page is a college-admin surface
// and the tab renders conditionally on role. This page exposes the very same
// <PrepContentStudioTab /> behind its own first-class sidebar entry so the
// platform content team can reach it without navigating college settings.
//
// It is a thin wrapper by design: all authoring, AI drafting, publishing state
// machine and practice-pool logic stays in PrepContentStudioTab, so there is a
// single source of truth for the studio UI regardless of entry point.
// Access is still enforced by the parent route's RoleRoute(['superadmin']) and,
// independently, by the /prep/* server endpoints.

import PrepContentStudioTab from '@/modules/admin/components/PrepContentStudioTab';
import { Box, Typography, Alert } from '@mui/material';

export default function SuperAdminPrepStudio() {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Prep Content Studio — Platform Curriculum
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Centrally author the Karnataka NEP 2020 / CBCS prep catalog: subjects,
          module topics (Explanation, Formulas, Tricks, How To Solve), AI draft
          generation and the draft → in-review → published review workflow.
        </Typography>
        <Alert severity="info" sx={{ mt: 1.5 }}>
          Platform-wide content authored here is served to every college and to
          B2C learners on Vriddhi Prep. Changes are cache-backed, so publish
          deliberately — students ride free cache hits rather than fresh AI calls.
        </Alert>
      </Box>
      <PrepContentStudioTab />
    </Box>
  );
}
