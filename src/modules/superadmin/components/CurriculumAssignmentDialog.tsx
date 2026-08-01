// ═══════════════════════════════════════════════════════════════════════
// CURRICULUM ASSIGNMENT DIALOG — Assign extracted syllabus to a college
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { AssignmentInd as AssignIcon } from "@mui/icons-material";

import type { SyllabusExtract, ParsedCourse, CollegeOption } from '../types/curriculum';

interface CurriculumAssignmentDialogProps {
  open: boolean;
  extract: SyllabusExtract | null;
  colleges: CollegeOption[];
  collegesLoading: boolean;
  onClose: () => void;
  onAssign: (input: {
    syllabusExtractId: string;
    collegeId: string;
    collegeName: string;
    selectedCourseIds: string[];
    reviewNotes: string;
  }) => void;
  assigning: boolean;
}

export const CurriculumAssignmentDialog: React.FC<CurriculumAssignmentDialogProps> = ({
  open,
  extract,
  colleges,
  collegesLoading,
  onClose,
  onAssign,
  assigning,
}) => {
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const courses = extract?.courses || [];
  const allCourseIds = useMemo(() => courses.map((c) => c.id), [courses]);
  const allSelected = selectedCourseIds.length === allCourseIds.length && allCourseIds.length > 0;

  useEffect(() => {
    if (open) {
      setSelectedCollegeId("");
      setSelectedCourseIds(courses.map((c) => c.id));
      setReviewNotes("");
      setError(null);
    }
  }, [open, courses]);

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleToggleAll = () => {
    setSelectedCourseIds(allSelected ? [] : [...allCourseIds]);
  };

  const handleAssign = () => {
    if (!selectedCollegeId) {
      setError("Please select a college.");
      return;
    }
    if (selectedCourseIds.length === 0) {
      setError("Please select at least one course.");
      return;
    }
    const college = colleges.find((c) => c.id === selectedCollegeId);
    if (!college || !extract) return;

    onAssign({
      syllabusExtractId: extract.id,
      collegeId: college.id,
      collegeName: college.name,
      selectedCourseIds,
      reviewNotes,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <AssignIcon color="primary" />
        Assign Curriculum to College
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="college-select-label">Select College</InputLabel>
            <Select
              labelId="college-select-label"
              value={selectedCollegeId}
              label="Select College"
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              disabled={collegesLoading || assigning}
            >
              {collegesLoading ? (
                <MenuItem disabled>Loading colleges...</MenuItem>
              ) : colleges.length === 0 ? (
                <MenuItem disabled>No colleges found</MenuItem>
              ) : (
                colleges.map((college) => (
                  <MenuItem key={college.id} value={college.id}>
                    {college.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Review Notes (optional)"
            fullWidth
            multiline
            rows={2}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            disabled={assigning}
            placeholder="Any notes for the college admin..."
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Select Courses to Assign
            </Typography>
            <Button size="small" onClick={handleToggleAll} disabled={assigning}>
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ maxHeight: 320, overflow: "auto" }}>
            <List dense>
              {courses.map((course: ParsedCourse) => {
                const isSelected = selectedCourseIds.includes(course.id);
                return (
                  <ListItem key={course.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleToggleCourse(course.id)}
                      disabled={assigning}
                      sx={{
                        backgroundColor: isSelected ? "rgba(25, 118, 210, 0.08)" : "inherit",
                        "&:hover": { backgroundColor: isSelected ? "rgba(25, 118, 210, 0.12)" : "action.hover" },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {course.code}
                            </Typography>
                            <Typography variant="body2">{course.name}</Typography>
                            <Chip label={`${course.modules.length} modules`} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={`${course.branch} • Sem ${course.semester} • ${course.totalHours}h • ${course.totalMarks} marks`}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Paper>

          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`${selectedCourseIds.length} selected`} color="primary" size="small" />
            <Chip label={`${selectedCourseIds.reduce((sum, id) => sum + (courses.find((c) => c.id === id)?.modules.length || 0), 0)} modules`} size="small" />
            <Chip label={`${selectedCourseIds.reduce((sum, id) => sum + (courses.find((c) => c.id === id)?.totalHours || 0), 0)} hours`} size="small" />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={assigning}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={assigning || !selectedCollegeId || selectedCourseIds.length === 0}
          startIcon={assigning ? <CircularProgress size={16} /> : <AssignIcon />}
        >
          {assigning ? "Assigning..." : "Assign Curriculum"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
