// ═══════════════════════════════════════════════════════════════════════
// pages/superadmin/SuperAdminCurriculum.tsx — Syllabus Parser Dashboard
// PATCHED: Integrated CurriculumAssignmentDialog + assignCurriculumToCollege API
// Flow: REVIEW → click Assign → pick college + courses → ASSIGNED
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Stack, Chip, IconButton, Button, CircularProgress, Alert } from '@mui/material';
import {
  UploadFile as UploadIcon,
  FactCheck as ReviewIcon,
  School as AssignIcon,
  Analytics as StatsIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { collection, getDocs, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import SyllabusUploader from '../components/SyllabusUploader';
import { CurriculumReviewTable } from '../components/CurriculumReviewTable';
import { CurriculumAssignmentDialog } from '../components/CurriculumAssignmentDialog';
import { useSyllabusExtracts, useCurriculumStats } from '../hooks/useSyllabusCurriculum';
import { assignCurriculumToCollege, updateExtractCourse, updateExtractModule } from '../api/curriculumApi';
import type { SyllabusExtract, CollegeOption, ParsedCourse, ParsedModule } from '../types/curriculum';
import StandardizedCurriculumUploader from '../components/StandardizedCurriculumUploader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

const SyllabusUploaderAny = SyllabusUploader as React.FC<any>;
const CurriculumReviewTableAny = CurriculumReviewTable as React.FC<any>;

export default function SuperAdminCurriculum() {
  const [tab, setTab] = useState(0);
  const [reviewExtractId, setReviewExtractId] = useState<string | null>(null);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [assignedCurriculum, setAssignedCurriculum] = useState<any[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ─── Assignment Dialog State ──────────────────────────────────────────
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignExtract, setAssignExtract] = useState<SyllabusExtract | null>(null);
  const [assigning, setAssigning] = useState(false);

  const {
    extracts,
    items,
    loading: extractsLoading,
    approveExtract,
    refresh: refreshExtracts,
  } = useSyllabusExtracts({ status: 'all', limit: 100 });

  const { stats, refresh: refreshStats } = useCurriculumStats();

  // ─── Fetch colleges from Firestore ────────────────────────────────────
  useEffect(() => {
    const fetchColleges = async () => {
      setCollegesLoading(true);
      try {
        const snap = await getDocs(collection(db, 'colleges'));
        const list = snap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id }));
        setColleges(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Failed to load colleges:', e);
        setColleges([{ id: 'NhARLOkWJof1JbnLGijV', name: 'Demo College' }]);
      } finally {
        setCollegesLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // ─── Fetch assigned curriculum ────────────────────────────────────────
  const fetchAssigned = async () => {
    setAssignedLoading(true);
    try {
      const snap = await getDocs(collection(db, 'curriculum'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAssignedCurriculum(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load assigned curriculum:', e);
      setAssignedCurriculum([]);
    } finally {
      setAssignedLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  // DEFENSIVE: ensure arrays even if hook returns garbage
  const safeItems = Array.isArray(items) ? items : [];
  const safeExtracts = Array.isArray(extracts) ? extracts : [];
  // FIX: Show both `review` and `approved` extracts so items approved but not
  // yet assigned don't disappear from the UI. (Assigned/archived stay in Assigned tab.)
  const displayItems = (safeExtracts.length > 0 ? safeExtracts : safeItems).filter(
    (e: SyllabusExtract) => e.status === 'review' || e.status === 'approved'
  );

  // Safe lookup for review
  const reviewExtract = reviewExtractId
    ? displayItems.find((e: SyllabusExtract) => e.id === reviewExtractId)
    : undefined;

  // ─── Assignment Handlers ──────────────────────────────────────────────
  const handleOpenAssign = (extract: SyllabusExtract, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAssignExtract(extract);
    setAssignDialogOpen(true);
  };

  const handleCloseAssign = () => {
    setAssignDialogOpen(false);
    setAssignExtract(null);
  };

  const handleAssign = async (input: {
    syllabusExtractId: string;
    collegeId: string;
    collegeName: string;
    selectedCourseIds: string[];
    reviewNotes: string;
  }) => {
    setAssigning(true);
    setNotification(null);
    try {
      await assignCurriculumToCollege(input);
      setNotification({ type: 'success', message: 'Curriculum assigned successfully!' });
      handleCloseAssign();
      setReviewExtractId(null);
      refreshExtracts();
      refreshStats();
      fetchAssigned();
      setTab(2); // Switch to Assigned tab
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Assignment failed:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to assign curriculum',
      });
    } finally {
      setAssigning(false);
    }
  };

  // ─── Delete course from extract ───────────────────────────────────────
  const handleDeleteCourse = async (extractId: string, courseId: string) => {
    const extract = displayItems.find((e: SyllabusExtract) => e.id === extractId);
    if (!extract) {
      setNotification({ type: 'error', message: 'Extract not found' });
      return;
    }
    const courses = Array.isArray(extract.courses) ? extract.courses : [];
    const newCourses = courses.filter((c: ParsedCourse) => c.id !== courseId);
    if (newCourses.length === courses.length) {
      setNotification({ type: 'error', message: 'Course not found in extract' });
      return;
    }

    const totalModules = newCourses.reduce(
      (sum: number, c: any) => sum + (Array.isArray(c?.modules) ? c.modules.length : 0),
      0
    );
    const totalHours = newCourses.reduce(
      (sum: number, c: any) => sum + (c?.totalHours || 0),
      0
    );
    const totalMarks = newCourses.reduce(
      (sum: number, c: any) => sum + (c?.totalMarks || 0),
      0
    );

    try {
      await updateDoc(doc(db, 'syllabusExtracts', extractId), {
        courses: newCourses,
        totalCourses: newCourses.length,
        totalModules,
        totalHours,
        totalMarks,
        updatedAt: Timestamp.now(),
      });
      setNotification({ type: 'success', message: 'Course deleted from extract' });
      refreshExtracts();
      refreshStats();
    } catch (err) {
      console.error('Failed to delete course:', err);
      setNotification({ type: 'error', message: 'Failed to delete course from extract' });
    }
  };

  const handleExtractReady = (extractId: string) => {
    setReviewExtractId(extractId);
    setTab(1);
  };

  const handleApprove = async (id: string) => {
    await approveExtract(id);
    setReviewExtractId(null);
    refreshExtracts();
    refreshStats();
  };

  // FIX: Actually persist review edits to Firestore (previously edits were discarded)
  const handleUpdateCourse = async (courseId: string, updates: Partial<ParsedCourse>) => {
    if (!reviewExtractId) return;
    try {
      await updateExtractCourse(reviewExtractId, { courseId, updates });
      refreshExtracts();
      refreshStats();
      setNotification({ type: 'success', message: 'Course updated.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to update course:', err);
      setNotification({ type: 'error', message: 'Failed to update course.' });
    }
  };

  const handleUpdateModule = async (courseId: string, moduleId: string, updates: Partial<ParsedModule>) => {
    if (!reviewExtractId) return;
    try {
      await updateExtractModule(reviewExtractId, { courseId, moduleId, updates });
      refreshExtracts();
      refreshStats();
      setNotification({ type: 'success', message: 'Module updated.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to update module:', err);
      setNotification({ type: 'error', message: 'Failed to update module.' });
    }
  };

  const handleDeleteExtract = async (extractId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this syllabus extract permanently?')) return;
    try {
      await deleteDoc(doc(db, 'syllabusExtracts', extractId));
      refreshExtracts();
      refreshStats();
      setNotification({ type: 'success', message: 'Extract deleted.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete extract.' });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
        Curriculum Parser
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload syllabus documents, review extracted courses, assign to colleges
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Paper sx={{ flex: '1 1 200px', p: 2, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">Total Extracts</Typography>
          <Typography variant="h4">{stats?.totalExtracts ?? 0}</Typography>
        </Paper>
        <Paper sx={{ flex: '1 1 200px', p: 2, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">Pending Review</Typography>
          <Typography variant="h4" color="warning.main">{stats?.pendingReview ?? 0}</Typography>
        </Paper>
        <Paper sx={{ flex: '1 1 200px', p: 2, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">Assigned</Typography>
          <Typography variant="h4" color="success.main">{stats?.assigned ?? 0}</Typography>
        </Paper>
        <Paper sx={{ flex: '1 1 200px', p: 2, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">Total Courses</Typography>
          <Typography variant="h4">{stats?.totalCourses ?? 0}</Typography>
        </Paper>
      </Box>

      {/* Notification */}
      {notification && (
        <Alert severity={notification.type} sx={{ mb: 2 }} onClose={() => setNotification(null)}>
          {notification.message}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<UploadIcon />} iconPosition="start" label="Upload" />
          <Tab icon={<ReviewIcon />} iconPosition="start" label={`Review (${displayItems.length})`} />
          <Tab icon={<AssignIcon />} iconPosition="start" label={`Assigned (${Array.isArray(assignedCurriculum) ? assignedCurriculum.length : 0})`} />
          <Tab icon={<StatsIcon />} iconPosition="start" label="Stats" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ─── TAB 0: UPLOAD ───────────────────────────────────── */}
          <TabPanel value={tab} index={0}>
  <StandardizedCurriculumUploader
    userId="super-admin"
    userName="Super Admin"
    onExtractReady={(extractId) => {
      setReviewExtractId(extractId);
      setTab(1);
    }}
  />
</TabPanel>

          {/* ─── TAB 1: REVIEW ───────────────────────────────────── */}
          <TabPanel value={tab} index={1}>
            {reviewExtractId ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button variant="outlined" onClick={() => setReviewExtractId(null)}>
                    ← Back to List
                  </Button>
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    Reviewing: {reviewExtract?.fileName ?? 'Unknown'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AssignIcon />}
                    onClick={() => reviewExtract && handleOpenAssign(reviewExtract)}
                    disabled={!reviewExtract}
                  >
                    Assign to College
                  </Button>
                </Box>
                {reviewExtract && Array.isArray(colleges) && colleges.length > 0 ? (
                  <CurriculumReviewTableAny
                    extractId={reviewExtractId}
                    extract={reviewExtract}
                    colleges={colleges}
                    onApprove={handleApprove}
                    onUpdateCourse={handleUpdateCourse}
                    onUpdateModule={handleUpdateModule}
                    onDeleteCourse={(courseId: string) => handleDeleteCourse(reviewExtractId, courseId)}
                  />
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {collegesLoading
                      ? 'Loading college data...'
                      : 'Unable to load review data. Please go back and try again.'}
                  </Alert>
                )}
              </Box>
            ) : extractsLoading ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                Loading extracts...
              </Typography>
            ) : displayItems.length > 0 ? (
              <Stack spacing={2}>
                {displayItems.map((e: SyllabusExtract) => (
                  <Paper
                    key={e.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setReviewExtractId(e.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {e.fileName ?? 'Untitled'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip label={(e.format ?? 'unknown').toUpperCase()} size="small" />
                          <Chip label={`${e.totalCourses ?? 0} courses`} size="small" variant="outlined" />
                          <Chip label={`${e.totalModules ?? 0} modules`} size="small" variant="outlined" />
                          <Chip label={`${e.totalHours ?? 0} hrs`} size="small" variant="outlined" />
                          <Chip label={`${e.totalMarks ?? 0} marks`} size="small" variant="outlined" />
                          <Chip
                            label={`${e.confidenceScore ?? 0}% confidence`}
                            size="small"
                            color={
                              (e.confidenceScore ?? 0) >= 70
                                ? 'success'
                                : (e.confidenceScore ?? 0) >= 40
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </Stack>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {e.extractedAt ? new Date(e.extractedAt).toLocaleDateString() : '-'}
                        </Typography>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(ev) => handleOpenAssign(e, ev as unknown as React.MouseEvent)}
                          title="Assign to College"
                        >
                          <AssignIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(ev) => handleDeleteExtract(e.id, ev as unknown as React.MouseEvent)}
                          sx={{ '&:hover': { bgcolor: 'error.light' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No extracts pending review. Upload a syllabus to get started.
              </Typography>
            )}
          </TabPanel>

          {/* ─── TAB 2: ASSIGNED ─────────────────────────────────── */}
          <TabPanel value={tab} index={2}>
            {assignedLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : Array.isArray(assignedCurriculum) && assignedCurriculum.length > 0 ? (
              <Stack spacing={2}>
                {assignedCurriculum.map((item: any) => (
                  <Paper key={item.id ?? Math.random()} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {item.title ?? 'Untitled Curriculum'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip label={item.collegeName ?? 'Unknown College'} size="small" color="primary" />
                          <Chip label={`${item.branch ?? 'N/A'}`} size="small" variant="outlined" />
                          <Chip label={`Sem ${item.semester ?? 0}`} size="small" variant="outlined" />
                          <Chip label={`${item.totalCourses ?? 0} courses`} size="small" variant="outlined" />
                          <Chip label={`${item.totalHours ?? 0} hrs`} size="small" variant="outlined" />
                          <Chip label={`${item.totalMarks ?? 0} marks`} size="small" variant="outlined" />
                        </Stack>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No curriculum assigned yet. Review an extract and assign it to a college.
              </Typography>
            )}
          </TabPanel>

          {/* ─── TAB 3: STATS ────────────────────────────────────── */}
          <TabPanel value={tab} index={3}>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Detailed stats coming soon.
            </Typography>
          </TabPanel>
        </Box>
      </Paper>

      {/* ─── Assignment Dialog ────────────────────────────────────────────── */}
      <CurriculumAssignmentDialog
        open={assignDialogOpen}
        extract={assignExtract}
        colleges={colleges}
        collegesLoading={collegesLoading}
        onClose={handleCloseAssign}
        onAssign={handleAssign}
        assigning={assigning}
      />
    </Box>
  );
}