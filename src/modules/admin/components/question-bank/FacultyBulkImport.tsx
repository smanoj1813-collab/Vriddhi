import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  FileUpload as UploadIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  CloudUpload as CloudIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  ContentPaste as PasteIcon,
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { QuestionType, DifficultyLevel } from '../../types/questionBank';

interface FacultyBulkImportProps {
  batches: string[];
  branches: string[];
  subjects: string[];
  onImport: (questions: any[]) => void;
  onCancel: () => void;
}

interface ParsedQuestion {
  text: string;
  subject: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  unit: string;
  marks: number;
  options: string[];
  correctAnswer: string;
  explanation: string;
  tags: string[];
  batch: string;
  branch: string;
  isPYQ: boolean;
  examYear: string;
  examName: string;
  valid: boolean;
  errors: string[];
}

const STEPS = ['Paste Data', 'Preview & Validate', 'Import Results'];

const SAMPLE_CSV = `text,subject,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName
"What is 2+2?","Mathematics","mcq","easy","1",5,"2|3|4|5","C","Basic addition","math,basic","2023-24","CSE",false,,
"Explain Newton's first law","Physics","long","medium","2",10,"","","Law of inertia","physics,newton","2023-24","ME",false,,`;

// Styled drop zone for drag & drop
const DropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: `${(theme.shape.borderRadius as number) * 2}px`,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: theme.palette.action.hover,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected,
  },
  '&.drag-over': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '20',
    transform: 'scale(1.01)',
  },
}));

const FacultyBulkImport: React.FC<FacultyBulkImportProps> = ({
  batches,
  branches,
  subjects,
  onImport,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [rawData, setRawData] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [defaultBatch, setDefaultBatch] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [defaultSubject, setDefaultSubject] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((csvText: string): ParsedQuestion[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const getValue = (field: string) => {
        const idx = headers.indexOf(field);
        return idx >= 0 ? values[idx] || '' : '';
      };

      const optionsStr = getValue('options');
      const options = optionsStr ? optionsStr.split('|').map(o => o.trim()) : [];
      const tagsStr = getValue('tags');
      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];

      const q: ParsedQuestion = {
        text: getValue('text'),
        subject: getValue('subject') || defaultSubject,
        type: (getValue('type') as QuestionType) || 'mcq',
        difficulty: (getValue('difficulty') as DifficultyLevel) || 'medium',
        unit: getValue('unit'),
        marks: parseInt(getValue('marks')) || 10,
        options,
        correctAnswer: getValue('correctAnswer'),
        explanation: getValue('explanation'),
        tags,
        batch: getValue('batch') || defaultBatch,
        branch: getValue('branch') || defaultBranch,
        isPYQ: getValue('isPYQ').toLowerCase() === 'true',
        examYear: getValue('examYear'),
        examName: getValue('examName'),
        valid: true,
        errors: []
      };

      // Validate
      if (!q.text) q.errors.push('Question text required');
      if (!q.subject) q.errors.push('Subject required');
      if (q.type === 'mcq' && q.options.length < 2) q.errors.push('Need 2+ options');
      if (q.type === 'mcq' && !q.correctAnswer) q.errors.push('Correct answer required');
      if (q.isPYQ && !q.examYear) q.errors.push('Exam year required');
      if (q.isPYQ && !q.examName) q.errors.push('Exam name required');

      q.valid = q.errors.length === 0;
      questions.push(q);
    }

    return questions;
  }, [defaultBatch, defaultBranch, defaultSubject]);

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawData(text);
      setUploadedFile(file);
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please upload a CSV file.');
        return;
      }
      handleFileRead(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please upload a CSV file.');
        return;
      }
      handleFileRead(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setRawData('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = () => {
    const questions = parseCSV(rawData);
    setParsedQuestions(questions);
    setActiveStep(1);
  };

  const handleImport = async () => {
    const validQuestions = parsedQuestions.filter(q => q.valid);
    if (validQuestions.length === 0) return;

    setImporting(true);
    try {
      const questionsToImport = validQuestions.map(q => ({
        text: q.text,
        subject: q.subject,
        type: q.type,
        difficulty: q.difficulty,
        unit: q.unit,
        marks: q.marks,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        tags: q.tags,
        batch: q.batch,
        branch: q.branch,
        isPYQ: q.isPYQ,
        examYear: q.examYear,
        examName: q.examName
      }));

      await onImport(questionsToImport);
      setImportResult({ success: validQuestions.length, failed: parsedQuestions.length - validQuestions.length });
      setActiveStep(2);
    } finally {
      setImporting(false);
    }
  };

  const removeQuestion = (index: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const validCount = parsedQuestions.filter(q => q.valid).length;
  const invalidCount = parsedQuestions.filter(q => !q.valid).length;

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: Paste Data */}
      {activeStep === 0 && (
        <Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Paste CSV" icon={<PasteIcon />} iconPosition="start" />
            <Tab label="Upload CSV" icon={<UploadIcon />} iconPosition="start" />
            <Tab label="Sample Format" icon={<PreviewIcon />} iconPosition="start" />
          </Tabs>

          {/* Paste CSV Tab */}
          {tabValue === 0 && (
            <>
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Default Values (Optional)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Default Subject</InputLabel>
                        <Select
                          value={defaultSubject}
                          onChange={(e) => setDefaultSubject(e.target.value)}
                          label="Default Subject"
                        >
                          <MenuItem value="">None</MenuItem>
                          {subjects.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Default Batch</InputLabel>
                        <Select
                          value={defaultBatch}
                          onChange={(e) => setDefaultBatch(e.target.value)}
                          label="Default Batch"
                        >
                          <MenuItem value="">None</MenuItem>
                          {batches.map(b => (
                            <MenuItem key={b} value={b}>{b}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Default Branch</InputLabel>
                        <Select
                          value={defaultBranch}
                          onChange={(e) => setDefaultBranch(e.target.value)}
                          label="Default Branch"
                        >
                          <MenuItem value="">None</MenuItem>
                          {branches.map(b => (
                            <MenuItem key={b} value={b}>{b}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <TextField
                fullWidth
                multiline
                rows={10}
                placeholder="Paste your CSV data here... First row must be headers."
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Use | to separate options, comma for tags
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'sample_questions.csv';
                    a.click();
                  }}
                >
                  Download Sample
                </Button>
              </Box>
            </>
          )}

          {/* Upload CSV Tab */}
          {tabValue === 1 && (
            <>
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Default Values (Optional)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Default Subject</InputLabel>
                        <Select
                          value={defaultSubject}
                          onChange={(e) => setDefaultSubject(e.target.value)}
                          label="Default Subject"
                        >
                          <MenuItem value="">None</MenuItem>
                          {subjects.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Default Batch</InputLabel>
                        <Select
                          value={defaultBatch}
                          onChange={(e) => setDefaultBatch(e.target.value)}
                          label="Default Batch"
                        >
                          <MenuItem value="">None</MenuItem>
                          {batches.map(b => (
                            <MenuItem key={b} value={b}>{b}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Default Branch</InputLabel>
                        <Select
                          value={defaultBranch}
                          onChange={(e) => setDefaultBranch(e.target.value)}
                          label="Default Branch"
                        >
                          <MenuItem value="">None</MenuItem>
                          {branches.map(b => (
                            <MenuItem key={b} value={b}>{b}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Drag & Drop Zone */}
              <DropZone
                className={isDragOver ? 'drag-over' : ''}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                {uploadedFile ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                    <FileIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {uploadedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearUploadedFile();
                      }}
                      sx={{ ml: 2 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <CloudIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1, opacity: 0.7 }} />
                    <Typography variant="h6" gutterBottom>
                      Drag & drop your CSV file here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      or click to browse files
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AttachFileIcon />}
                      component="span"
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </DropZone>

              {/* Show raw data preview if file uploaded */}
              {rawData && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    File content preview (first 500 chars):
                  </Typography>
                  <Paper sx={{ p: 1.5, backgroundColor: 'grey.900', overflow: 'auto' }}>
                    <Typography
                      component="pre"
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: 'grey.300',
                        m: 0
                      }}
                    >
                      {rawData.length > 500 ? rawData.substring(0, 500) + '...' : rawData}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Supported format: .csv (max 5MB)
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'sample_questions.csv';
                    a.click();
                  }}
                >
                  Download Sample
                </Button>
              </Box>
            </>
          )}

          {/* Sample Format Tab */}
          {tabValue === 2 && (
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Expected CSV Format:</Typography>
              <Box component="pre" sx={{ overflow: 'auto', fontSize: '0.75rem', p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                {SAMPLE_CSV}
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Required:</strong> text, subject, type, difficulty, marks<br/>
                <strong>Optional:</strong> unit, options (| separated), correctAnswer, explanation, tags (comma separated), batch, branch, isPYQ, examYear, examName
              </Alert>
            </Paper>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={!rawData.trim()}
            >
              Preview & Validate
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Preview & Validate */}
      {activeStep === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Preview
              <Chip label={`${validCount} valid`} color="success" size="small" sx={{ ml: 1 }} />
              {invalidCount > 0 && (
                <Chip label={`${invalidCount} invalid`} color="error" size="small" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Button size="small" onClick={() => setActiveStep(0)}>
              Back to Edit
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={50}>Status</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Diff</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>PYQ</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedQuestions.map((q, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: q.valid ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)'
                    }}
                  >
                    <TableCell>
                      {q.valid ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <Tooltip title={q.errors.join(', ')}>
                          <ErrorIcon color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {q.text}
                      </Typography>
                      {!q.valid && (
                        <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                          {q.errors.join(', ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{q.subject}</TableCell>
                    <TableCell>{q.type}</TableCell>
                    <TableCell>
                      <Chip label={q.difficulty} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell>{q.marks}</TableCell>
                    <TableCell>{q.batch || '-'}</TableCell>
                    <TableCell>{q.branch || '-'}</TableCell>
                    <TableCell>{q.isPYQ ? 'Yes' : '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => removeQuestion(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={importing ? <CircularProgress size={20} /> : <CloudIcon />}
              onClick={handleImport}
              disabled={validCount === 0 || importing}
            >
              {importing ? 'Importing...' : `Import ${validCount} Questions`}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Import Complete */}
      {activeStep === 2 && importResult && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>Import Complete!</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Chip
              icon={<CheckIcon />}
              label={`${importResult.success} imported`}
              color="success"
              size="medium"
            />
            {importResult.failed > 0 && (
              <Chip
                icon={<ErrorIcon />}
                label={`${importResult.failed} skipped`}
                color="error"
                size="medium"
              />
            )}
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={onCancel}>
              Done
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FacultyBulkImport;