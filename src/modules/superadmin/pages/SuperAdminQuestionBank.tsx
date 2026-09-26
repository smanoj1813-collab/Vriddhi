import { useState, useCallback } from 'react';
import { Box, Typography, Alert, Button, Chip, Stack, Tab, Tabs } from '@mui/material';
import { CloudUpload as SeedIcon, LibraryBooks as PoolIcon, FactCheck as ReviewIcon, UploadFile as ImportIcon } from '@mui/icons-material';
import UniversalQuestionBank from '@/modules/admin/components/UniversalQuestionBank';
import ReviewQueue from '@/modules/admin/components/ReviewQueue';
import { useAuth } from '../../auth/context/AuthContext';
import SeedQuestionBankDialog from '../components/SeedQuestionBankDialog';
import PaperImportPanel from '../components/PaperImportPanel';
import { SEED_FILES } from '../data/questionBankSeed';

// Superadmin sees the entire universal pool (public + private via isSuperadmin gate)
// collegeId is intentionally empty — the gate bypasses visibility when viewerIsSuperadmin is true.
//
// Three things live here:
//   1. Pool      — browse every question in the universal pool
//   2. Review    — the SAME ReviewQueue college admins use; imported paper
//                  drafts land there as `pending` and are approved/rejected here
//   3. Import    — bulk previous-year-paper import (PaperImportPanel)
export default function SuperAdminQuestionBank() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  // The pool browser loads on mount, so a successful seed/import remounts it
  // rather than leaving the superadmin staring at the pre-seed list.
  const [reloadKey, setReloadKey] = useState(0);
  const [seedOpen, setSeedOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [lastSeed, setLastSeed] = useState<{ created: number; skipped: number } | null>(null);
  const [lastImport, setLastImport] = useState<{ drafted: number; files: number } | null>(null);

  const handleSeeded = useCallback((result: { created: number; skipped: number }) => {
    setLastSeed({ created: result.created, skipped: result.skipped });
    setReloadKey((k) => k + 1);
  }, []);

  // Imported drafts are pending, so the pool list is unchanged — but the review
  // tab and the stats chips should reflect them, hence the remount.
  const handleImported = useCallback((job: { counters: { drafted: number; parsed: number } }) => {
    if (job.counters.drafted > 0) {
      setLastImport({ drafted: job.counters.drafted, files: job.counters.parsed });
      setReloadKey((k) => k + 1);
    }
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

        {/* The pool itself is read-only here; these are the two ways platform-curated
            content gets loaded into it — the bundled CSV seed, and the previous-year
            paper importer (see PaperImportPanel). */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={`${seedTotal} curated questions bundled`} size="small" variant="outlined" />
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setImportOpen((v) => !v)}
            disabled={!isSuperadmin}
          >
            Import papers (ZIP)
          </Button>
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
        {lastImport && lastImport.drafted > 0 && (
          <>
            {' '}
            <strong>
              Imported {lastImport.drafted} draft question{lastImport.drafted === 1 ? '' : 's'} from{' '}
              {lastImport.files} paper{lastImport.files === 1 ? '' : 's'} — review them in the Review queue tab.
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

      {importOpen && isSuperadmin && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <PaperImportPanel onImported={handleImported} />
        </Box>
      )}

      <Tabs value={tab} onChange={(_e, next) => setTab(next)} sx={{ mb: 2 }}>
        <Tab icon={<PoolIcon fontSize="small" />} iconPosition="start" label="Pool" />
        <Tab icon={<ReviewIcon fontSize="small" />} iconPosition="start" label="Review queue" />
      </Tabs>

      {tab === 0 && <UniversalQuestionBank key={reloadKey} />}
      {tab === 1 && <ReviewQueue key={`review-${reloadKey}`} />}

      <SeedQuestionBankDialog
        open={seedOpen}
        onClose={() => setSeedOpen(false)}
        onSeeded={handleSeeded}
      />
    </Box>
  );
}
