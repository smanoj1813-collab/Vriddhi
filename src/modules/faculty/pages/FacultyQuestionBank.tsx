import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  School as SchoolIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Assessment as AssessmentIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { Question, QuestionFilters } from '../../admin/types/questionBank';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getBatchBranchConfig,
  getPYQExamYears,
  getPYQExamNames,
  getQuestionStats,
  bulkImportQuestions,
  linkQuestionToPaper,
  unlinkQuestionFromPaper
} from '../../../services/questionBankAPI';
import FacultyQuestionForm from '../../components/question-bank/FacultyQuestionForm';
import FacultyBulkImport from '../../components/question-bank/FacultyBulkImport';
import FacultyPaperLinker from '../../components/question-bank/FacultyPaperLinker';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface QuestionBankStats {
  total: number;
  pyqCount: number;
  linkedCount: number;
  unusedCount: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
  byBatch: Record<string, number>;
  byBranch: Record<string, number>;
}

interface QuestionOption {
  id?: string;
  text: string;
  isCorrect?: boolean;
}

const FacultyQuestionBank: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<unknown>(null);

  const [filters, setFilters] = useState<QuestionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [batches, setBatches] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [pyqYears, setPyqYears] = useState<string[]>([]);
  const [pyqNames, setPyqNames] = useState<string[]>([]);

  const [pyqMode, setPyqMode] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [linkerOpen, setLinkerOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const [stats, setStats] = useState<QuestionBankStats | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const [tabValue, setTabValue] = useState(0);
  const [myQuestionsOnly, setMyQuestionsOnly] = useState(false);

  const collegeId = user?.collegeId || '';
  const facultyId = user?.id || '';

  useEffect(() => {
    if (collegeId) {
      loadConfig();
      loadSubjects();
    }
  }, [collegeId]);

  const loadConfig = async () => {
    try {
      const config = await getBatchBranchConfig(collegeId);
      setBatches(config.batches);
      setBranches(config.branches);
      const years = await getPYQExamYears(collegeId);
      setPyqYears(years);
    } catch (err: unknown) {
      console.error('Error loading config:', err);
      showSnackbar('Failed to load configuration', 'error');
    }
  };

  const loadSubjects = async () => {
    setSubjects([
      'Mathematics I', 'Mathematics II', 'Mathematics III',
      'Physics', 'Chemistry',
      'Computer Science', 'Data Structures', 'Algorithms',
      'Database Management', 'Operating Systems',
      'Electronics', 'Digital Logic',
      'Mechanics', 'Thermodynamics',
      'English', 'Communication Skills'
    ]);
  };

  const loadQuestions = useCallback(async (reset = false) => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const currentFilters = { ...filters };
      if (searchQuery) currentFilters.searchQuery = searchQuery;
      if (pyqMode) currentFilters.isPYQ = true;
      if (myQuestionsOnly) currentFilters.createdBy = facultyId;

      const result = await getQuestions(collegeId, currentFilters, 20, reset ? undefined : lastDoc);

      if (reset) setQuestions(result.data);
      else setQuestions(prev => [...prev, ...result.data]);

      setLastDoc(result.lastDoc);
      setHasMore(!!result.hasMore);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error loading questions: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [collegeId, filters, searchQuery, pyqMode, myQuestionsOnly, lastDoc, facultyId]);

  useEffect(() => {
    loadQuestions(true);
  }, [filters, searchQuery, pyqMode, myQuestionsOnly]);

  useEffect(() => {
    if (filters.examYear && collegeId) {
      getPYQExamNames(collegeId, filters.examYear).then(setPyqNames).catch(console.error);
    }
  }, [filters.examYear, collegeId]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFilterChange = (field: keyof QuestionFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
    setLastDoc(null);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPyqMode(false);
    setMyQuestionsOnly(false);
    setLastDoc(null);
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      const questionData = { ...data, createdBy: facultyId, createdByName: user?.name || user?.email || 'Unknown', collegeId };
      await createQuestion(collegeId, questionData);
      showSnackbar('Question created successfully', 'success');
      setFormOpen(false);
      loadQuestions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error creating question: ${msg}`, 'error');
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    try {
      await updateQuestion(id, data);
      showSnackbar('Question updated successfully', 'success');
      setFormOpen(false);
      setEditingQuestion(null);
      loadQuestions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error updating question: ${msg}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;
    try {
      await deleteQuestion(id);
      showSnackbar('Question deleted successfully', 'success');
      loadQuestions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error deleting question: ${msg}`, 'error');
    }
  };

  const handleBulkImport = async (importedQuestions: Record<string, unknown>[]) => {
    try {
      const enrichedQuestions = importedQuestions.map(q => ({
        ...q, createdBy: facultyId, createdByName: user?.name || user?.email || 'Unknown', collegeId
      }));
      const result = await bulkImportQuestions(collegeId, enrichedQuestions);
      showSnackbar(
        `Imported ${result.success} of ${result.total} questions. ${result.failed} failed.`,
        result.failed > 0 ? 'warning' : 'success'
      );
      setImportOpen(false);
      loadQuestions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error importing questions: ${msg}`, 'error');
    }
  };

  const handleLinkPaper = async (questionId: string, paperId: string) => {
    try {
      await linkQuestionToPaper(questionId, paperId);
      showSnackbar('Question linked to paper successfully', 'success');
      loadQuestions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error linking question: ${msg}`, 'error');
    }
  };

  const handleUnlinkPaper = async (questionId: string, paperId: string) => {
    try {
      await unlinkQuestionFromPaper(questionId, paperId);
      showSnackbar('Question unlinked from paper', 'success');
      loadQuestions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error unlinking question: ${msg}`, 'error');
    }
  };

  const openEditForm = (question: Question) => {
    if (question.createdBy !== facultyId && user?.role !== 'admin') {
      showSnackbar('You can only edit your own questions', 'error');
      return;
    }
    setEditingQuestion(question);
    setFormOpen(true);
  };

  const openPreview = (question: Question) => {
    setPreviewQuestion(question);
    setPreviewOpen(true);
  };

  const openLinker = (question: Question) => {
    setSelectedQuestion(question);
    setLinkerOpen(true);
  };

  const loadStats = async () => {
    try {
      const s = await getQuestionStats(collegeId);
      setStats(s as QuestionBankStats);
      setStatsOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showSnackbar(`Error loading stats: ${msg}`, 'error');
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length +
    (searchQuery ? 1 : 0) + (pyqMode ? 1 : 0) + (myQuestionsOnly ? 1 : 0);

  const canEdit = (question: Question) => question.createdBy === facultyId || user?.role === 'admin';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Faculty Question Bank
            {pyqMode && (
              <Chip label="PYQ Mode" color="secondary" size="small" sx={{ ml: 2 }} icon={<SchoolIcon />} />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and organize questions for your subjects
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={loadStats}>Analytics</Button>
          <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setImportOpen(true)}>Import</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingQuestion(null); setFormOpen(true); }}>Add Question</Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)} indicatorColor="primary" textColor="primary">
          <Tab label="All Questions" />
          <Tab label="My Questions" />
          <Tab label="PYQ Questions" />
          <Tab label="Linked Papers" />
        </Tabs>

        <TabPanel value={tabValue} index={0}></TabPanel>
        <TabPanel value={tabValue} index={1}>
          <FormControlLabel control={<Switch checked={myQuestionsOnly} onChange={(e) => setMyQuestionsOnly(e.target.checked)} />} label="Show only my questions" />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <FormControlLabel control={<Switch checked={pyqMode} onChange={(e) => { setPyqMode(e.target.checked); if (!e.target.checked) { handleFilterChange('isPYQ', undefined); handleFilterChange('examYear', undefined); handleFilterChange('examName', undefined); } }} />} label="Show only Previous Year Questions" />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Typography variant="body2" color="text.secondary">Questions linked to generated papers will appear here.</Typography>
        </TabPanel>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 200 }}>
            <TextField fullWidth placeholder="Search questions by text, topic, or tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>), endAdornment: searchQuery && (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery('')}><ClearIcon /></IconButton></InputAdornment>) } }} />
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: 140 }}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select value={filters.subject || ''} onChange={(e) => handleFilterChange('subject', e.target.value)} label="Subject">
                <MenuItem value="">All</MenuItem>
                {subjects.map(subject => (<MenuItem key={subject} value={subject}>{subject}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: 140 }}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select value={filters.difficulty || ''} onChange={(e) => handleFilterChange('difficulty', e.target.value)} label="Difficulty">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: 140 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={filters.type || ''} onChange={(e) => handleFilterChange('type', e.target.value)} label="Type">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="mcq">MCQ</MenuItem>
                <MenuItem value="short">Short Answer</MenuItem>
                <MenuItem value="long">Long Answer</MenuItem>
                <MenuItem value="numerical">Numerical</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 140px', minWidth: 120 }}>
            <Button variant={showFilters ? "contained" : "outlined"} startIcon={<FilterIcon />} onClick={() => setShowFilters(!showFilters)} fullWidth>
              Filters
              {activeFilterCount > 0 && (<Badge badgeContent={activeFilterCount} color="error" sx={{ ml: 1 }} />)}
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <FormControl fullWidth>
                  <InputLabel>Batch</InputLabel>
                  <Select value={filters.batch || ''} onChange={(e) => handleFilterChange('batch', e.target.value)} label="Batch">
                    <MenuItem value="">All Batches</MenuItem>
                    {batches.map(batch => (<MenuItem key={batch} value={batch}>{batch}</MenuItem>))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <FormControl fullWidth>
                  <InputLabel>Branch</InputLabel>
                  <Select value={filters.branch || ''} onChange={(e) => handleFilterChange('branch', e.target.value)} label="Branch">
                    <MenuItem value="">All Branches</MenuItem>
                    {branches.map(branch => (<MenuItem key={branch} value={branch}>{branch}</MenuItem>))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select value={filters.unit || ''} onChange={(e) => handleFilterChange('unit', e.target.value)} label="Unit">
                    <MenuItem value="">All Units</MenuItem>
                    <MenuItem value="1">Unit 1</MenuItem>
                    <MenuItem value="2">Unit 2</MenuItem>
                    <MenuItem value="3">Unit 3</MenuItem>
                    <MenuItem value="4">Unit 4</MenuItem>
                    <MenuItem value="5">Unit 5</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {pyqMode && (
                <>
                  <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                    <FormControl fullWidth>
                      <InputLabel>Exam Year</InputLabel>
                      <Select value={filters.examYear || ''} onChange={(e) => handleFilterChange('examYear', e.target.value)} label="Exam Year">
                        <MenuItem value="">All Years</MenuItem>
                        {pyqYears.map(year => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                    <FormControl fullWidth>
                      <InputLabel>Exam Name</InputLabel>
                      <Select value={filters.examName || ''} onChange={(e) => handleFilterChange('examName', e.target.value)} label="Exam Name">
                        <MenuItem value="">All Exams</MenuItem>
                        {pyqNames.map(name => (<MenuItem key={name} value={name}>{name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <FormControlLabel control={<Switch checked={filters.linkedToPaper || false} onChange={(e) => handleFilterChange('linkedToPaper', e.target.checked)} />} label="Linked to Papers" />
              </Box>
            </Box>
            {activeFilterCount > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="text" onClick={clearFilters} startIcon={<ClearIcon />}>Clear All Filters</Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Paper elevation={2}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell width="40%">Question</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell align="center">PYQ</TableCell>
                <TableCell align="center">Linked</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id} hover sx={{ opacity: canEdit(question) ? 1 : 0.7, '&:hover': { backgroundColor: 'action.hover' } }}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {question.text}
                      </Typography>
                      {question.isPYQ && (
                        <Chip size="small" label={`${question.examYear} - ${question.examName}`} color="secondary" sx={{ mt: 0.5, fontSize: '0.7rem' }} />
                      )}
                      {question.tags && question.tags.length > 0 && (
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {question.tags.slice(0, 3).map((tag: string) => (<Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />))}
                          {question.tags.length > 3 && (<Chip label={`+${question.tags.length - 3}`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />)}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{question.subject}</Typography></TableCell>
                  <TableCell><Chip label={question.type?.toUpperCase()} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell><Chip label={question.difficulty} size="small" color={question.difficulty === 'easy' ? 'success' : question.difficulty === 'medium' ? 'warning' : 'error'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell>{question.batch || '-'}</TableCell>
                  <TableCell>{question.branch || '-'}</TableCell>
                  <TableCell align="center">
                    {question.isPYQ ? (<Tooltip title={`${question.examYear} - ${question.examName}`}><BookmarkIcon color="secondary" fontSize="small" /></Tooltip>) : (<BookmarkBorderIcon color="disabled" fontSize="small" />)}
                  </TableCell>
                  <TableCell align="center">
                    {question.linkedPaperIds && question.linkedPaperIds.length > 0 ? (
                      <Tooltip title={`Linked to ${question.linkedPaperIds.length} paper(s)`}><Badge badgeContent={question.linkedPaperIds.length} color="primary"><LinkIcon color="primary" fontSize="small" /></Badge></Tooltip>
                    ) : (<LinkIcon color="disabled" fontSize="small" />)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Preview"><IconButton size="small" onClick={() => openPreview(question)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Link to Paper"><IconButton size="small" onClick={() => openLinker(question)}><LinkIcon fontSize="small" /></IconButton></Tooltip>
                    {canEdit(question) && (
                      <>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditForm(question)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(question.id)} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary" gutterBottom>No questions found</Typography>
                      <Typography variant="body2" color="text.secondary">Try adjusting your filters or add new questions to the bank.</Typography>
                      <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => { setEditingQuestion(null); setFormOpen(true); }}>Add Your First Question</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: 1, borderColor: 'divider' }}>
          {hasMore && (
            <Button variant="outlined" onClick={() => loadQuestions(false)} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>
              {loading ? 'Loading...' : `Load More (${questions.length} loaded)`}
            </Button>
          )}
          {!hasMore && questions.length > 0 && (
            <Typography variant="body2" color="text.secondary">All {questions.length} questions loaded</Typography>
          )}
        </Box>
      </Paper>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg" fullWidth scroll="paper">
        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
        <DialogContent dividers>
          <FacultyQuestionForm
            initialData={editingQuestion || undefined}
            subjects={subjects}
            onSubmit={editingQuestion ? (data: Record<string, unknown>) => handleUpdate(editingQuestion.id, data) : handleCreate}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Import Questions</DialogTitle>
        <DialogContent>
          <FacultyBulkImport batches={batches} branches={branches} subjects={subjects} onImport={handleBulkImport} onCancel={() => setImportOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={linkerOpen} onClose={() => setLinkerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Link Question to Paper</DialogTitle>
        <DialogContent>
          {selectedQuestion && (
            <FacultyPaperLinker question={selectedQuestion} onLink={handleLinkPaper} onUnlink={handleUnlinkPaper} onClose={() => setLinkerOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Question Preview</DialogTitle>
        <DialogContent dividers>
          {previewQuestion && (
            <Box>
              <Typography variant="h6" gutterBottom>Question:</Typography>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                <Typography>{previewQuestion.text}</Typography>
              </Paper>

              {previewQuestion.options && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Options:</Typography>
                  <List>
                    {previewQuestion.options.map((opt: QuestionOption, i: number) => (
                      <ListItem key={opt.id || i}>
                        <ListItemText 
                          primary={`${String.fromCharCode(65 + i)}. ${opt.text}`}
                          sx={{ color: previewQuestion.correctAnswer === String.fromCharCode(65 + i) ? 'success.main' : 'inherit' }}
                        />
                        {previewQuestion.correctAnswer === String.fromCharCode(65 + i) && (<CheckIcon color="success" />)}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {previewQuestion.correctAnswer && !previewQuestion.options && (
                <Alert severity="info" sx={{ mt: 1 }}>Correct Answer: {previewQuestion.correctAnswer}</Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 200px' }}><Typography variant="body2" color="text.secondary">Subject: {previewQuestion.subject}</Typography></Box>
                <Box sx={{ flex: '1 1 200px' }}><Typography variant="body2" color="text.secondary">Type: {previewQuestion.type}</Typography></Box>
                <Box sx={{ flex: '1 1 200px' }}><Typography variant="body2" color="text.secondary">Difficulty: {previewQuestion.difficulty}</Typography></Box>
                <Box sx={{ flex: '1 1 200px' }}><Typography variant="body2" color="text.secondary">Unit: {previewQuestion.unit}</Typography></Box>
                <Box sx={{ flex: '1 1 200px' }}><Typography variant="body2" color="text.secondary">Batch: {previewQuestion.batch || 'N/A'}</Typography></Box>
                <Box sx={{ flex: '1 1 200px' }}><Typography variant="body2" color="text.secondary">Branch: {previewQuestion.branch || 'N/A'}</Typography></Box>
                {previewQuestion.isPYQ && (
                  <Box sx={{ flex: '1 1 100%' }}><Chip icon={<SchoolIcon />} label={`PYQ: ${previewQuestion.examYear} - ${previewQuestion.examName}`} color="secondary" size="small" /></Box>
                )}
              </Box>

              {previewQuestion.linkedPaperIds && previewQuestion.linkedPaperIds.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Linked Papers:</Typography>
                  <List dense>
                    {previewQuestion.linkedPaperIds.map((paperId: string) => (
                      <ListItem key={paperId}><ListItemText primary={paperId} /></ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setPreviewOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={statsOpen} onClose={() => setStatsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Question Bank Analytics</DialogTitle>
        <DialogContent>
          {stats && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <Card variant="outlined"><CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">{stats.total}</Typography>
                  <Typography color="text.secondary">Total Questions</Typography>
                </CardContent></Card>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <Card variant="outlined"><CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="secondary">{stats.pyqCount}</Typography>
                  <Typography color="text.secondary">PYQs</Typography>
                </CardContent></Card>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <Card variant="outlined"><CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main">{stats.linkedCount}</Typography>
                  <Typography color="text.secondary">Linked to Papers</Typography>
                </CardContent></Card>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: 160 }}>
                <Card variant="outlined"><CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">{stats.unusedCount}</Typography>
                  <Typography color="text.secondary">Unused</Typography>
                </CardContent></Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="h6" gutterBottom>By Subject</Typography>
                  {Object.entries(stats.bySubject).map(([subject, count]) => (
                    <Box key={subject} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">{subject}</Typography>
                      <Chip label={count as number} size="small" />
                    </Box>
                  ))}
                </CardContent></Card>
              </Box>

              <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="h6" gutterBottom>By Difficulty</Typography>
                  {Object.entries(stats.byDifficulty).map(([diff, count]) => (
                    <Box key={diff} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{diff}</Typography>
                      <Chip label={count as number} size="small" color={diff === 'easy' ? 'success' : diff === 'medium' ? 'warning' : 'error'} />
                    </Box>
                  ))}
                </CardContent></Card>
              </Box>

              {Object.keys(stats.byBatch).length > 0 && (
                <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
                  <Card variant="outlined"><CardContent>
                    <Typography variant="h6" gutterBottom>By Batch</Typography>
                    {Object.entries(stats.byBatch).map(([batch, count]) => (
                      <Box key={batch} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2">{batch}</Typography>
                        <Chip label={count as number} size="small" />
                      </Box>
                    ))}
                  </CardContent></Card>
                </Box>
              )}

              {Object.keys(stats.byBranch).length > 0 && (
                <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
                  <Card variant="outlined"><CardContent>
                    <Typography variant="h6" gutterBottom>By Branch</Typography>
                    {Object.entries(stats.byBranch).map(([branch, count]) => (
                      <Box key={branch} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2">{branch}</Typography>
                        <Chip label={count as number} size="small" />
                      </Box>
                    ))}
                  </CardContent></Card>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setStatsOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FacultyQuestionBank;
