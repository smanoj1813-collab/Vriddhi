import { useState, useCallback } from 'react';
import { Box, Typography, Alert, Button, Chip, Stack } from '@mui/material';
import { CloudUpload as SeedIcon } from '@mui/icons-material';
import UniversalQuestionBank from '@/modules/admin/components/UniversalQuestionBank';
import { useAuth } from '../../auth/context/AuthContext';
import SeedQuestionBankDialog from '../components/SeedQuestionBankDialog';
import { SEED_FILES } from '../data/questionBankSeed';

// Superadmin sees the entire universal pool (public + private via isSuperadmin gate)
// collegeId is intentionally empty — the gate bypasses visibility when viewerIsSuperadmin is true.
export default function SuperAdminQuestionBank() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  // The pool browser loads on mount, so a successful seed remounts it rather
  // than leaving the superadmin staring at the pre-seed list.
  const [reloadKey, setReloadKey] = useState(0);
  const [seedOpen, setSeedOpen] = useState(false);
  const [lastSeed, setLastSeed] = useState<{ created: number; skipped: number } | null>(null);

  const handleSeeded = useCallback((result: { created: number; skipped: number }) => {
    setLastSeed({ created: result.created, skipped: result.skipped });
    setReloadKey((k) => k + 1);
  }, []);

  const seedTotal = SEED_FILES[0]?.expectedRows ?? 0;

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Question Bank — Platform View
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse every question in the universal pool. As superadmin you see all visibilities
            (public, college_only, shared_with) without college scoping.
          </Typography>
        </Box>

        {/* The pool itself is read-only here; this is the one way platform-curated
            content gets loaded into it (see SeedQuestionBankDialog). */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip label={`${seedTotal} curated questions bundled`} size="small" variant="outlined" />
          <Button
            variant="contained"
            startIcon={<SeedIcon />}
            onClick={() => setSeedOpen(true)}
            disabled={!isSuperadmin}
          >
            Seed Question Bank
          </Button>
        </Stack>
      </Box>

      <Alert severity="info" sx={{ mt: 1.5, mb: 2 }}>
        Superadmin bypass is active — visibility gating is disabled. Use filters to narrow by
        subject, topic, difficulty or search keywords.
        {lastSeed && lastSeed.created > 0 && (
          <>
            {' '}
            <strong>
              Last seed wrote {lastSeed.created} question{lastSeed.created === 1 ? '' : 's'}
              {lastSeed.skipped > 0 && ` (${lastSeed.skipped} already existed)`} — the list below
              has been refreshed.
            </strong>
          </>
        )}
      </Alert>

      {!isSuperadmin && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Seeding the platform pool requires the superadmin role — Firestore rules reject writes
          from any other role.
        </Alert>
      )}

      <UniversalQuestionBank key={reloadKey} />

      <SeedQuestionBankDialog
        open={seedOpen}
        onClose={() => setSeedOpen(false)}
        onSeeded={handleSeeded}
      />
    </Box>
  );
}
