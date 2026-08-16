// ═══════════════════════════════════════════════════════════════════════
// src/components/StandardizedCurriculumUploader.tsx
// FIXED: Import paths, unused imports, MUI ListItemText typings, implicit any
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from 'react';
import {
  Box, Button, Paper, Typography, Alert, Chip, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress,
  List, ListItem, Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  UploadFile as UploadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandIcon,
  School as CourseIcon,
} from '@mui/icons-material';

import {
  parseCurriculumTemplate,
  downloadTemplate,
  type ParsedTemplateResult,
  type TemplateValidationError,
} from '../../superadmin/services/standardizedTemplate';

import { createSyllabusExtract } from '../../superadmin/api/curriculumApi';
import type { ParsedCourse } from '../../superadmin/types/curriculum';

interface StandardizedCurriculumUploaderProps {
  userId: string;
  userName: string;
  onExtractReady: (extractId: string) => void;
}

type Step = 'upload' | 'parsing' | 'preview' | 'submitting' | 'done';

export const StandardizedCurriculumUploader: React.FC<StandardizedCurriculumUploaderProps> = ({
  userId,
  userName,
  onExtractReady,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParsedTemplateResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDownload = useCallback(() => {
    downloadTemplate();
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setStep('parsing');
    setSubmitError(null);

    const parsed = await parseCurriculumTemplate(selected, userId, userName);
    setResult(parsed);
    setStep('preview');
  }, [userId, userName]);

  const handleSubmit = useCallback(async () => {
    if (!result?.extract) return;
    setStep('submitting');
    setSubmitError(null);

    try {
      const saved = await createSyllabusExtract(result.extract);
      setStep('done');
      onExtractReady(saved.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save curriculum');
      setStep('preview');
    }
  }, [result, onExtractReady]);

  const errors = result?.errors.filter((e: TemplateValidationError) => e.severity === 'error') || [];
  const warnings = result?.warnings || [];
  const hasErrors = errors.length > 0;

  return (
    <Box>
      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Standardized Curriculum Upload
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Download the template, fill it with your curriculum data, then upload.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 3 }}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload} size="large">
              Download Excel Template
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle1">Click to upload filled template</Typography>
            <Typography variant="caption" color="text.secondary">
              Accepted: .xlsx files only
            </Typography>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={handleFileSelect}
            />
          </Box>
        </Paper>
      )}

      {/* STEP 2: Parsing */}
      {step === 'parsing' && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography>Parsing structured curriculum data...</Typography>
        </Box>
      )}

      {/* STEP 3: Preview */}
      {(step === 'preview' || step === 'submitting') && result && (
        <Box>
          {/* Validation Banner */}
          {hasErrors ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Found {errors.length} error(s). Please fix the template and re-upload.
            </Alert>
          ) : warnings.length > 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Found {warnings.length} warning(s). You can proceed after review.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              Template validated successfully — {result.extract?.totalCourses ?? 0} courses parsed.
            </Alert>
          )}

          {/* Program Info Card */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Program Information
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(result.programInfo).map(([k, v]) => (
                v ? <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" /> : null
              ))}
            </Box>
          </Paper>

          {/* Validation Details */}
          {(errors.length > 0 || warnings.length > 0) && (
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, maxHeight: 240, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Validation Report</Typography>
              <List dense>
                {errors.map((e: TemplateValidationError, i: number) => (
                  <ListItem key={`e-${i}`} sx={{ py: 0.5 }}>
                    <ErrorIcon color="error" sx={{ mr: 1, fontSize: 18 }} />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {e.sheet} • Row {e.row}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                        {e.field}: {e.message}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
                {warnings.map((w: TemplateValidationError, i: number) => (
                  <ListItem key={`w-${i}`} sx={{ py: 0.5 }}>
                    <WarningIcon color="warning" sx={{ mr: 1, fontSize: 18 }} />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {w.sheet} • Row {w.row}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                        {w.field}: {w.message}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Course Matrix Preview */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Parsed Course Matrix
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Sem</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Modules</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.extract?.courses.map((c: ParsedCourse) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.semester}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{c.code}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.credits}</TableCell>
                    <TableCell>{c.totalHours}</TableCell>
                    <TableCell>{c.totalMarks}</TableCell>
                    <TableCell>
                      <Chip label={c.courseType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{c.modules.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Per-Course Detail Accordions */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Course Details
          </Typography>
          <Stack spacing={1} sx={{ mb: 3 }}>
            {result.extract?.courses.map((course: ParsedCourse) => (
              <Accordion key={course.id} variant="outlined" disableGutters>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                    <CourseIcon color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                      {course.code} — {course.name}
                    </Typography>
                    <Chip label={`${course.modules.length} modules`} size="small" variant="outlined" />
                    <Chip label={`${course.outcomes?.length || 0} outcomes`} size="small" variant="outlined" />
                    <Chip label={`${course.references?.length || 0} refs`} size="small" variant="outlined" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Modules */}
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                        Modules
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          {course.modules.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell sx={{ width: 40, fontWeight: 600 }}>{m.moduleNo}</TableCell>
                              <TableCell>{m.moduleName}</TableCell>
                              <TableCell sx={{ width: 60 }}>{m.hours}h</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {m.topics.slice(0, 3).map((t: string, i: number) => (
                                    <Chip key={i} label={t} size="small" variant="outlined" />
                                  ))}
                                  {m.topics.length > 3 && (
                                    <Chip label={`+${m.topics.length - 3} more`} size="small" />
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>

                    {/* Outcomes */}
                    {course.outcomes && course.outcomes.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                          Outcomes
                        </Typography>
                        <List dense>
                          {course.outcomes.map((o: string, i: number) => (
                            <ListItem key={i} sx={{ py: 0 }}>
                              <Typography variant="body2">{`${i + 1}. ${o}`}</Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* References */}
                    {course.references && course.references.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                          References
                        </Typography>
                        <List dense>
                          {course.references.map((r: string, i: number) => (
                            <ListItem key={i} sx={{ py: 0 }}>
                              <Typography variant="body2">{`${i + 1}. ${r}`}</Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => { setStep('upload'); setFile(null); setResult(null); }}>
              Upload Different File
            </Button>
            <Button
              variant="contained"
              disabled={hasErrors || step === 'submitting'}
              onClick={handleSubmit}
              startIcon={step === 'submitting' ? <CircularProgress size={16} /> : <CheckIcon />}
            >
              {step === 'submitting' ? 'Saving...' : 'Submit to Review'}
            </Button>
          </Box>
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </Box>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <CheckIcon color="success" sx={{ fontSize: 56, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Curriculum Submitted Successfully
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The curriculum has been added to the review queue. Switch to the Review tab to inspect and assign it.
          </Typography>
          <Button variant="outlined" onClick={() => { setStep('upload'); setFile(null); setResult(null); }}>
            Upload Another Curriculum
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default StandardizedCurriculumUploader;