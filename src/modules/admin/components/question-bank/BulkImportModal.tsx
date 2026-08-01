import React, { useState, useCallback } from 'react';
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
  Tooltip
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
  ContentPaste as PasteIcon
} from '@mui/icons-material';
import { QuestionType, DifficultyLevel } from '../../types/questionBank';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (questions: any[]) => void;
  batches: string[];
  branches: string[];
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

const STEPS = ['Paste Data', 'Preview & Validate', 'Import'];

const SAMPLE_CSV = `text,subject,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName
"What is 2+2?","Mathematics","mcq","easy","1",5,"2|3|4|5","C","Basic addition","math,basic","2023-24","CSE",false,,
"Explain Newton's first law","Physics","long","medium","2",10,"","","Law of inertia","physics,newton","2023-24","ME",false,,`;

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  onImport,
  batches,
  branches
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [rawData, setRawData] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [importing, setImporting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [defaultBatch, setDefaultBatch] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');

  const parseCSV = useCallback((csvText: string): ParsedQuestion[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (doesn't handle quoted commas perfectly)
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
        subject: getValue('subject'),
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
      if (!q.text) q.errors.push('Question text is required');
      if (!q.subject) q.errors.push('Subject is required');
      if (q.type === 'mcq' && q.options.length < 2) q.errors.push('MCQ needs at least 2 options');
      if (q.type === 'mcq' && !q.correctAnswer) q.errors.push('Correct answer required for MCQ');
      if (q.isPYQ && !q.examYear) q.errors.push('Exam year required for PYQ');
      if (q.isPYQ && !q.examName) q.errors.push('Exam name required for PYQ');

      q.valid = q.errors.length === 0;
      questions.push(q);
    }

    return questions;
  }, [defaultBatch, defaultBranch]);

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
            <Tab label="Sample Format" icon={<PreviewIcon />} iconPosition="start" />
          </Tabs>

          {tabValue === 0 && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
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
                <Grid size={{ xs: 12, sm: 6 }}>
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
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={10}
                placeholder="Paste your CSV data here..."
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  First row must be headers. Use | to separate options.
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

          {tabValue === 1 && (
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>Expected CSV Format:</Typography>
              <Box component="pre" sx={{ overflow: 'auto', fontSize: '0.75rem' }}>
                {SAMPLE_CSV}
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Required columns: text, subject, type, difficulty, marks<br/>
                Optional: unit, options (pipe-separated), correctAnswer, explanation, tags (comma-separated), batch, branch, isPYQ, examYear, examName
              </Alert>
            </Paper>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
                  <TableCell>Status</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>PYQ</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedQuestions.map((q, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      backgroundColor: q.valid ? 'success.light' : 'error.light',
                      opacity: q.valid ? 1 : 0.7
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
                      {q.errors.length > 0 && (
                        <Typography variant="caption" color="error">
                          {q.errors.join(', ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{q.subject}</TableCell>
                    <TableCell>{q.type}</TableCell>
                    <TableCell>{q.difficulty}</TableCell>
                    <TableCell>{q.marks}</TableCell>
                    <TableCell>{q.batch || '-'}</TableCell>
                    <TableCell>{q.branch || '-'}</TableCell>
                    <TableCell>{q.isPYQ ? `${q.examYear}` : '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => removeQuestion(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={() => setActiveStep(0)}>
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudIcon />}
              onClick={handleImport}
              disabled={validCount === 0 || importing}
            >
              {importing ? <CircularProgress size={20} /> : `Import ${validCount} Questions`}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Import Complete */}
      {activeStep === 2 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>Import Complete!</Typography>
          <Typography color="text.secondary">
            {validCount} questions have been imported successfully.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BulkImportModal;