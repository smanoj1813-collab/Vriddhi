// ═══════════════════════════════════════════════════════════════════════
// CurriculumReviewTable.tsx — Rich Syllabus Review with Units, Topics, Outcomes
// Displays: Course cards → Expandable Units → Topics, Outcomes, References
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Tooltip, Box, Typography, Button,
  Stack, Collapse, TextField, Alert, Divider, List, ListItem, ListItemText,
  Tabs, Tab,
} from "@mui/material";
import {
  CheckCircle, Cancel, Edit, ExpandMore, ExpandLess, Save, School,
  Delete as DeleteIcon, MenuBook, Lightbulb, Assignment,
} from "@mui/icons-material";

import type { SyllabusExtract, ParsedCourse, ParsedModule, CollegeOption } from "../types/curriculum";

// ─── Legacy flat item (kept for backward compat) ─────────────────────────

export interface CurriculumReviewItem {
  id: string;
  courseName: string;
  moduleName: string;
  hours: number;
  marks: number;
  confidence: number;
  extractedText: string;
  status: "pending" | "approved" | "rejected";
}

// ─── Props ──────────────────────────────────────────────────────────────

export interface CurriculumReviewTableProps {
  items?: CurriculumReviewItem[];
  onApproveItem?: (id: string) => void;
  onRejectItem?: (id: string) => void;
  onEditItem?: (item: CurriculumReviewItem) => void;

  extractId?: string;
  extract?: SyllabusExtract;
  colleges?: CollegeOption[];
  onApprove?: (extractId: string) => void | Promise<void>;
  onUpdateCourse?: (courseId: string, updates: Partial<ParsedCourse>) => void | Promise<void>;
  onUpdateModule?: (courseId: string, moduleId: string, updates: Partial<ParsedModule>) => void | Promise<void>;
  onDeleteCourse?: (courseId: string) => void | Promise<void>;

  readOnly?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────

export function CurriculumReviewTable({
  items: legacyItems,
  onApproveItem, onRejectItem, onEditItem,
  extract, onApprove, onUpdateCourse, onUpdateModule, onDeleteCourse,
  readOnly = false,
}: CurriculumReviewTableProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, number>>({});
  const [editingModule, setEditingModule] = useState<{ courseId: string; moduleId: string } | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; hours: string; marks: string }>({ name: "", hours: "", marks: "" });
  const [localError, setLocalError] = useState<string | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);

  // ─── Auto-convert extract.courses into review rows ────────────────────
  const displayItems = useMemo<CurriculumReviewItem[]>(() => {
    if (Array.isArray(legacyItems) && legacyItems.length > 0) return legacyItems;
    if (!extract) return [];
    const courses = Array.isArray(extract.courses) ? extract.courses : [];
    const rows: CurriculumReviewItem[] = [];
    for (const course of courses) {
      const modules = Array.isArray(course?.modules) ? course.modules : [];
      if (modules.length === 0) {
        rows.push({
          id: `${course.id}__course`,
          courseName: course.name ?? "Untitled Course",
          moduleName: "—",
          hours: course.totalHours ?? 0,
          marks: course.totalMarks ?? 0,
          confidence: course.confidence === "high" ? 0.9 : course.confidence === "medium" ? 0.6 : 0.3,
          extractedText: "",
          status: "pending",
        });
      } else {
        for (const mod of modules) {
          rows.push({
            id: `${course.id}__${mod.id}`,
            courseName: course.name ?? "Untitled Course",
            moduleName: mod.moduleName ?? mod.title ?? mod.name ?? "Untitled Module",
            hours: mod.hours ?? 0,
            marks: mod.marks ?? 0,
            confidence: mod.confidence === "high" ? 0.9 : mod.confidence === "medium" ? 0.6 : 0.3,
            extractedText: mod.description ?? "",
            status: mod.isEdited ? "approved" : "pending",
          });
        }
      }
    }
    return rows;
  }, [legacyItems, extract]);

  const handleToggleCourse = (courseId: string) => {
    setExpandedCourse((prev) => (prev === courseId ? null : courseId));
  };

  const handleTabChange = (courseId: string, tabIndex: number) => {
    setActiveTab((prev) => ({ ...prev, [courseId]: tabIndex }));
  };

  const handleStartEditModule = (course: ParsedCourse, mod: ParsedModule) => {
    setEditingModule({ courseId: course.id, moduleId: mod.id });
    setEditValues({
      name: mod.moduleName ?? mod.title ?? mod.name ?? "",
      hours: String(mod.hours ?? 0),
      marks: String(mod.marks ?? 0),
    });
    setLocalError(null);
  };

  const handleSaveModule = async (course: ParsedCourse, mod: ParsedModule) => {
    const hoursNum = parseInt(editValues.hours, 10);
    const marksNum = parseInt(editValues.marks, 10);
    if (isNaN(hoursNum) || isNaN(marksNum)) {
      setLocalError("Hours and marks must be valid numbers");
      return;
    }
    if (onUpdateModule) {
      await onUpdateModule(course.id, mod.id, {
        moduleName: editValues.name,
        title: editValues.name,
        name: editValues.name,
        hours: hoursNum,
        marks: marksNum,
        isEdited: true,
      });
    }
    setEditingModule(null);
    setLocalError(null);
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Delete course "${courseName}" from this extract?`)) return;
    setDeletingCourse(courseId);
    try {
      await onDeleteCourse?.(courseId);
    } finally {
      setDeletingCourse(null);
    }
  };

  if (!Array.isArray(displayItems)) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Unable to load review data. The extract may be empty or corrupted.
      </Alert>
    );
  }

  if (displayItems.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <School sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography color="text.secondary">
          No courses or modules found in this extract.
        </Typography>
      </Paper>
    );
  }

  // Rich course-module view
  if (extract && Array.isArray(extract.courses) && extract.courses.length > 0) {
    return (
      <Box>
        {localError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError(null)}>
            {localError}
          </Alert>
        )}

        {/* Extract summary */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {extract.fileName ?? "Untitled Extract"}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip label={`${extract.totalCourses ?? 0} courses`} size="small" />
              <Chip label={`${extract.totalModules ?? 0} modules`} size="small" />
              <Chip label={`${extract.totalHours ?? 0} hrs`} size="small" />
              <Chip label={`${extract.totalMarks ?? 0} marks`} size="small" />
              <Chip
                label={`${extract.confidenceScore ?? 0}% confidence`}
                size="small"
                color={(extract.confidenceScore ?? 0) >= 70 ? "success" : (extract.confidenceScore ?? 0) >= 40 ? "warning" : "error"}
              />
            </Stack>
          </Box>
        </Paper>

        {/* Course cards */}
        <Stack spacing={2}>
          {extract.courses.map((course) => {
            const modules = Array.isArray(course?.modules) ? course.modules : [];
            const isExpanded = expandedCourse === course.id;
            const courseName = course.name ?? "Untitled Course";
            const isEmpty = modules.length === 0;
            const currentTab = activeTab[course.id] ?? 0;

            return (
              <Paper key={course.id} variant="outlined" sx={{ overflow: "hidden" }}>
                {/* Course header */}
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    cursor: "pointer",
                    bgcolor: isEmpty ? "error.light" : "action.hover",
                    opacity: deletingCourse === course.id ? 0.5 : 1,
                    transition: "opacity 0.2s",
                    "&:hover": { bgcolor: isEmpty ? "error.light" : "action.selected" },
                  }}
                  onClick={() => handleToggleCourse(course.id)}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {course.code ? `[${course.code}] ` : ""}
                      {courseName}
                      {isEmpty && (
                        <Chip label="Empty" size="small" color="error" sx={{ ml: 1 }} />
                      )}
                      {course.courseType && (
                        <Chip label={course.courseType} size="small" variant="outlined" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {course.branch ?? "N/A"} · Sem {course.semester ?? 0} · {course.credits ?? 0} credits · {modules.length} modules · {course.totalHours ?? 0} hrs · {course.totalMarks ?? 0} marks
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {!readOnly && onDeleteCourse && (
                      <Tooltip title={`Delete ${courseName}`}>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={deletingCourse === course.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id, courseName);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small">
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Stack>
                </Box>

                {/* Expanded content with tabs */}
                <Collapse in={isExpanded}>
                  <Box sx={{ borderTop: 1, borderColor: "divider" }}>
                    <Tabs
                      value={currentTab}
                      onChange={(_, v) => handleTabChange(course.id, v)}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{ minHeight: 40 }}
                    >
                      <Tab icon={<MenuBook fontSize="small" />} iconPosition="start" label="Syllabus" sx={{ minHeight: 40 }} />
                      <Tab icon={<Lightbulb fontSize="small" />} iconPosition="start" label={`Outcomes (${(course.outcomes ?? []).length})`} sx={{ minHeight: 40 }} />
                      <Tab icon={<Assignment fontSize="small" />} iconPosition="start" label={`References (${(course.references ?? []).length})`} sx={{ minHeight: 40 }} />
                    </Tabs>

                    {/* Tab 0: Syllabus / Units */}
                    {currentTab === 0 && (
                      <Box sx={{ p: 2 }}>
                        {modules.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                            No modules found for this course.
                          </Typography>
                        ) : (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "background.default" }}>
                                  <TableCell width={50}>#</TableCell>
                                  <TableCell>Unit / Module</TableCell>
                                  <TableCell width={80}>Hours</TableCell>
                                  <TableCell width={80}>Marks</TableCell>
                                  <TableCell width={100}>Topics</TableCell>
                                  {!readOnly && <TableCell width={80}>Actions</TableCell>}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {modules.map((mod) => {
                                  const isEditing =
                                    editingModule?.courseId === course.id &&
                                    editingModule?.moduleId === mod.id;
                                  return (
                                    <TableRow key={mod.id} hover>
                                      <TableCell>{mod.moduleNo ?? "—"}</TableCell>
                                      <TableCell>
                                        {isEditing ? (
                                          <TextField
                                            size="small"
                                            value={editValues.name}
                                            onChange={(e) => setEditValues((prev) => ({ ...prev, name: e.target.value }))}
                                            sx={{ minWidth: 200 }}
                                          />
                                        ) : (
                                          <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                              {mod.moduleName ?? mod.title ?? mod.name ?? "Untitled"}
                                            </Typography>
                                            {mod.topics && mod.topics.length > 0 && (
                                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                                {mod.topics.slice(0, 3).join(" · ")}
                                                {mod.topics.length > 3 && ` +${mod.topics.length - 3} more`}
                                              </Typography>
                                            )}
                                          </Box>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {isEditing ? (
                                          <TextField size="small" type="number" value={editValues.hours}
                                            onChange={(e) => setEditValues((prev) => ({ ...prev, hours: e.target.value }))}
                                            sx={{ width: 80 }} />
                                        ) : (mod.hours ?? 0)}
                                      </TableCell>
                                      <TableCell>
                                        {isEditing ? (
                                          <TextField size="small" type="number" value={editValues.marks}
                                            onChange={(e) => setEditValues((prev) => ({ ...prev, marks: e.target.value }))}
                                            sx={{ width: 80 }} />
                                        ) : (mod.marks ?? 0)}
                                      </TableCell>
                                      <TableCell>
                                        <Chip label={mod.confidence ?? "low"} size="small"
                                          color={mod.confidence === "high" ? "success" : mod.confidence === "medium" ? "warning" : "error"} />
                                      </TableCell>
                                      {!readOnly && (
                                        <TableCell>
                                          {isEditing ? (
                                            <Tooltip title="Save">
                                              <IconButton size="small" color="primary"
                                                onClick={() => handleSaveModule(course, mod)}>
                                                <Save fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          ) : (
                                            <Tooltip title="Edit">
                                              <IconButton size="small"
                                                onClick={() => handleStartEditModule(course, mod)}>
                                                <Edit fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    )}

                    {/* Tab 1: Course Outcomes */}
                    {currentTab === 1 && (
                      <Box sx={{ p: 2 }}>
                        {(course.outcomes ?? []).length === 0 ? (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                            No course outcomes extracted.
                          </Typography>
                        ) : (
                          <List dense>
                            {(course.outcomes ?? []).map((outcome, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5 }}>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2">
                                      <strong>CO{idx + 1}:</strong> {outcome}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    )}

                    {/* Tab 2: References */}
                    {currentTab === 2 && (
                      <Box sx={{ p: 2 }}>
                        {(course.references ?? []).length === 0 ? (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                            No reference books extracted.
                          </Typography>
                        ) : (
                          <List dense>
                            {(course.references ?? []).map((ref, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5 }}>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2">
                                      {idx + 1}. {ref}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>

        {/* Bottom actions */}
        {!readOnly && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            {onApprove && (
              // FIX: This only approves the extract — it never assigns to a college.
              // Renamed from "Approve & Assign" and dropped the false success toast.
              <Button variant="contained" color="success" startIcon={<CheckCircle />}
                onClick={() => { onApprove(extract.id); }}>
                Approve
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // ─── Fallback: legacy flat table view ─────────────────────────────────
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Course</TableCell>
            <TableCell>Module</TableCell>
            <TableCell align="right">Hours</TableCell>
            <TableCell align="right">Marks</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Status</TableCell>
            {!readOnly && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {displayItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.courseName}</TableCell>
              <TableCell>{item.moduleName}</TableCell>
              <TableCell align="right">{item.hours}</TableCell>
              <TableCell align="right">{item.marks}</TableCell>
              <TableCell>
                <Chip label={`${Math.round(item.confidence * 100)}%`} size="small"
                  color={item.confidence > 0.8 ? "success" : item.confidence > 0.5 ? "warning" : "error"} />
              </TableCell>
              <TableCell>
                <Chip label={item.status} size="small"
                  color={item.status === "approved" ? "success" : item.status === "rejected" ? "error" : "default"} />
              </TableCell>
              {!readOnly && (
                <TableCell align="right">
                  {item.status === "pending" && (
                    <>
                      <Tooltip title="Approve">
                        <IconButton size="small" color="success" onClick={() => onApproveItem?.(item.id)}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error" onClick={() => onRejectItem?.(item.id)}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEditItem?.(item)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default CurriculumReviewTable;