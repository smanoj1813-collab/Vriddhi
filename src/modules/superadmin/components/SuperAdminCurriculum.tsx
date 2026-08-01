// ═══════════════════════════════════════════════════════════════════════
// SUPER ADMIN CURRICULUM — 4-Tab Master Page
// Tabs: UPLOAD → REVIEW → ASSIGNED → STATS
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  LinearProgress,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  AssignmentInd as AssignIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Assessment as StatsIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Archive as ArchiveIcon,
} from "@mui/icons-material";
import { collection, getDocs } from "firebase/firestore";
import { db } from '@/Firebase/config';

import { useSyllabusParser } from '../hooks/useSyllabusParser';
import {
  useSyllabusList,
  useCurriculumList,
  useCurriculumStats,
  useCurriculumAssignment,
  useDeleteExtract,
} from '../hooks/useCurriculum';
import { CurriculumReviewTable } from "./CurriculumReviewTable";
import { CurriculumAssignmentDialog } from "./CurriculumAssignmentDialog";

import type { SyllabusExtract, CollegeOption, CurriculumDoc } from '../types/curriculum';

// ─── Tab Panel ──────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`curriculum-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────

export const SuperAdminCurriculum: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [reviewExtractId, setReviewExtractId] = useState<string | null>(null);
  const [assignExtract, setAssignExtract] = useState<SyllabusExtract | null>(null);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const parser = useSyllabusParser();
  const syllabusList = useSyllabusList({ status: "all", limit: 50 });
  const assignedList = useCurriculumList({ status: "active", limit: 50 });
  const stats = useCurriculumStats();
  const assignment = useCurriculumAssignment();
  const deleter = useDeleteExtract();

  // Fetch colleges
  useEffect(() => {
    const fetchColleges = async () => {
      setCollegesLoading(true);
      try {
        const snap = await getDocs(collection(db, "colleges"));
        const list = snap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id }));
        setColleges(list);
      } catch (e) {
        console.error("Failed to load colleges:", e);
      } finally {
        setCollegesLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // Show notification helper
  const notify = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // ─── Upload Handlers ────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const userId = "superadmin";
      const userName = "Super Admin";

      const result = await parser.uploadAndParse(file, userId, userName);
      if (result) {
        notify("success", `Parsed ${result.totalCourses} courses from ${result.fileName}`);
        syllabusList.refresh();
        setTab(1);
      } else {
        notify("error", parser.error || "Upload failed");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [parser, syllabusList, notify]
  );

  // ─── Review Handlers ────────────────────────────────────────────────

  const handleApprove = useCallback(
    async (extractId: string) => {
      const extract = syllabusList.items.find((e: SyllabusExtract) => e.id === extractId);
      if (!extract) return;
      setAssignExtract(extract);
    },
    [syllabusList.items]
  );

  const handleAssign = useCallback(
    async (input: {
      syllabusExtractId: string;
      collegeId: string;
      collegeName: string;
      selectedCourseIds: string[];
      reviewNotes: string;
    }) => {
      const result = await assignment.assign(input);
      if (result) {
        notify("success", `Assigned to ${input.collegeName}`);
        setAssignExtract(null);
        syllabusList.refresh();
        assignedList.refresh();
        stats.refresh();
        setTab(2);
      } else {
        notify("error", assignment.error || "Assignment failed");
      }
    },
    [assignment, notify, syllabusList, assignedList, stats]
  );

  const handleDelete = useCallback(
    async (extractId: string) => {
      if (!window.confirm("Delete this syllabus extract?")) return;
      const ok = await deleter.deleteExtract(extractId);
      if (ok) {
        notify("success", "Deleted");
        syllabusList.refresh();
        stats.refresh();
      } else {
        notify("error", deleter.error || "Delete failed");
      }
    },
    [deleter, notify, syllabusList, stats]
  );

  // ─── Render Helpers ─────────────────────────────────────────────────

  const statusChip = (status: string) => {
    const config: Record<string, { color: "default" | "primary" | "success" | "warning" | "error"; icon: React.ReactElement }> = {
      parsing: { color: "warning", icon: <PendingIcon fontSize="small" /> },
      review: { color: "primary", icon: <PendingIcon fontSize="small" /> },
      approved: { color: "success", icon: <ApprovedIcon fontSize="small" /> },
      assigned: { color: "success", icon: <AssignIcon fontSize="small" /> },
      archived: { color: "default", icon: <ArchiveIcon fontSize="small" /> },
    };
    const c = config[status] || config.review;
    return <Chip icon={c.icon} label={status.toUpperCase()} color={c.color} size="small" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 700 }}>
            <SchoolIcon color="primary" fontSize="large" />
            Curriculum Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Upload, review, and assign syllabus extracts to colleges
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => { syllabusList.refresh(); assignedList.refresh(); stats.refresh(); }}
        >
          Refresh All
        </Button>
      </Box>

      {/* Notification */}
      {notification && (
        <Alert severity={notification.type} sx={{ mb: 2 }} onClose={() => setNotification(null)}>
          {notification.message}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<UploadIcon />} iconPosition="start" label="Upload" />
          <Tab icon={<PendingIcon />} iconPosition="start" label={`Review (${syllabusList.items.filter((i: SyllabusExtract) => i.status === "review" || i.status === "approved").length})`} />
          <Tab icon={<AssignIcon />} iconPosition="start" label={`Assigned (${assignedList.items.length})`} />
          <Tab icon={<StatsIcon />} iconPosition="start" label="Stats" />
        </Tabs>
      </Paper>

      {/* ─── TAB 0: UPLOAD ───────────────────────────────────────────── */}
      <TabPanel value={tab} index={0}>
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pdf,.txt"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <Box
            sx={{
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 2,
              p: 6,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { borderColor: "primary.main", backgroundColor: "action.hover" },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop a syllabus file here, or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports DOCX, PDF, and TXT files
            </Typography>
          </Box>

          {(parser.uploading || parser.parsing) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {parser.uploading ? `Uploading... ${parser.uploadProgress}%` : "Parsing syllabus..."}
              </Typography>
              <LinearProgress
                variant={parser.uploading ? "determinate" : "indeterminate"}
                value={parser.uploadProgress}
                sx={{ mt: 1 }}
              />
            </Box>
          )}

          {parser.error && (
            <Alert severity="error" sx={{ mt: 3, textAlign: "left" }}>
              {parser.error}
            </Alert>
          )}
        </Paper>
      </TabPanel>

      {/* ─── TAB 1: REVIEW ───────────────────────────────────────────── */}
      <TabPanel value={tab} index={1}>
        {reviewExtractId ? (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Button variant="outlined" onClick={() => setReviewExtractId(null)}>
                ← Back to List
              </Button>
              <Typography variant="h6">
                Reviewing: {syllabusList.items.find((e: SyllabusExtract) => e.id === reviewExtractId)?.fileName}
              </Typography>
            </Box>
            {(() => {
              const extract = syllabusList.items.find((e: SyllabusExtract) => e.id === reviewExtractId);
              if (!extract) return null;
              return (
                <CurriculumReviewTable
                  extract={extract}
                  onUpdateCourse={async () => {
                    setTimeout(() => syllabusList.refresh(), 300);
                  }}
                  onUpdateModule={async () => {
                    setTimeout(() => syllabusList.refresh(), 300);
                  }}
                  onApprove={() => handleApprove(extract.id)}
                />
              );
            })()}
          </Box>
        ) : (
          <Box>
            {syllabusList.loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : syllabusList.items.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">No syllabus extracts found. Upload one first.</Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                      <TableCell><strong>File</strong></TableCell>
                      <TableCell><strong>Format</strong></TableCell>
                      <TableCell><strong>Courses</strong></TableCell>
                      <TableCell><strong>Hours</strong></TableCell>
                      <TableCell><strong>Marks</strong></TableCell>
                      <TableCell><strong>Confidence</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell width={120}><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {syllabusList.items.map((item: SyllabusExtract) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                            {item.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatSize(item.fileSize)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.format.toUpperCase()} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{item.totalCourses}</TableCell>
                        <TableCell>{item.totalHours}</TableCell>
                        <TableCell>{item.totalMarks}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${item.confidenceScore}%`}
                            color={item.confidenceScore >= 70 ? "success" : item.confidenceScore >= 40 ? "warning" : "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{statusChip(item.status)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(item.extractedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Review">
                              <IconButton size="small" onClick={() => setReviewExtractId(item.id)}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {(item.status === "review" || item.status === "approved") && (
                              <Tooltip title="Assign">
                                <IconButton size="small" color="primary" onClick={() => setAssignExtract(item)}>
                                  <AssignIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </TabPanel>

      {/* ─── TAB 2: ASSIGNED ─────────────────────────────────────────── */}
      <TabPanel value={tab} index={2}>
        {assignedList.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : assignedList.items.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No curriculum assigned yet.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "action.hover" }}>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>College</strong></TableCell>
                  <TableCell><strong>Branch</strong></TableCell>
                  <TableCell><strong>Semester</strong></TableCell>
                  <TableCell><strong>Courses</strong></TableCell>
                  <TableCell><strong>Hours</strong></TableCell>
                  <TableCell><strong>Marks</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Assigned</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedList.items.map((item: CurriculumDoc) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.collegeName}</TableCell>
                    <TableCell>{item.branch}</TableCell>
                    <TableCell>{item.semester}</TableCell>
                    <TableCell>{item.totalCourses}</TableCell>
                    <TableCell>{item.totalHours}</TableCell>
                    <TableCell>{item.totalMarks}</TableCell>
                    <TableCell>
                      <Chip label={item.status.toUpperCase()} color={item.status === "active" ? "success" : "default"} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ─── TAB 3: STATS ──────────────────────────────────────────────── */}
      <TabPanel value={tab} index={3}>
        {stats.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !stats.stats ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No stats available.</Typography>
          </Paper>
        ) : (
          <Box>
            {/* Stat Cards */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
              {[
                { label: "Total Extracts", value: stats.stats.totalExtracts },
                { label: "Pending Review", value: stats.stats.pendingReview, color: "warning" as const },
                { label: "Approved", value: stats.stats.approved, color: "info" as const },
                { label: "Assigned", value: stats.stats.assigned, color: "success" as const },
                { label: "Total Courses", value: stats.stats.totalCourses },
                { label: "Total Modules", value: stats.stats.totalModules },
              ].map((s) => (
                <Box key={s.label} sx={{ flex: "1 1 160px" }}>
                  <Paper sx={{ p: 2.5, textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }} color={s.color ? `${s.color}.main` : "text.primary"}>
                      {s.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.label}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>

            {/* Format & Status Breakdown */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <Box sx={{ flex: "1 1 300px" }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    By Format
                  </Typography>
                  <Stack spacing={1.5}>
                    {stats.stats && Object.entries(stats.stats.byFormat).map(([fmt, count]: [string, number]) => (
                      <Box key={fmt} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="body2" sx={{ width: 60, textTransform: "uppercase", fontWeight: 500 }}>
                          {fmt}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={stats.stats!.totalExtracts > 0 ? (count / stats.stats!.totalExtracts) * 100 : 0}
                          sx={{ flex: 1, height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="body2" sx={{ width: 30, textAlign: "right", fontWeight: 600 }}>
                          {count}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Box>

              <Box sx={{ flex: "1 1 300px" }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    By Status
                  </Typography>
                  <Stack spacing={1.5}>
                    {stats.stats && Object.entries(stats.stats.byStatus).map(([st, count]: [string, number]) => (
                      <Box key={st} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="body2" sx={{ width: 80, textTransform: "capitalize", fontWeight: 500 }}>
                          {st}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={stats.stats!.totalExtracts > 0 ? (count / stats.stats!.totalExtracts) * 100 : 0}
                          sx={{ flex: 1, height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="body2" sx={{ width: 30, textAlign: "right", fontWeight: 600 }}>
                          {count}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Box>
            </Box>

            {/* Average Confidence */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Average Parse Confidence
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={stats.stats?.averageConfidence || 0}
                    sx={{ height: 16, borderRadius: 8 }}
                    color={
                      stats.stats && stats.stats.averageConfidence >= 70
                        ? "success"
                        : stats.stats && stats.stats.averageConfidence >= 40
                        ? "warning"
                        : "error"
                    }
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {stats.stats?.averageConfidence || 0}%
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </TabPanel>

      {/* Assignment Dialog */}
      <CurriculumAssignmentDialog
        open={!!assignExtract}
        extract={assignExtract}
        colleges={colleges}
        collegesLoading={collegesLoading}
        onClose={() => setAssignExtract(null)}
        onAssign={handleAssign}
        assigning={assignment.assigning}
      />
    </Box>
  );
};
