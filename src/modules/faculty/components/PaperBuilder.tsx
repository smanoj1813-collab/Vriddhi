// components/faculty/PaperBuilder.tsx
// ============================================
// PAPER BUILDER - Create Question Papers from Approved Questions
// ============================================

import React, { useState } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Paper, Checkbox, FormControlLabel, Tooltip, List, ListItem,
  ListItemText, ListItemSecondaryAction, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, DragIndicator as DragIcon,
  Save as SaveIcon, Search as SearchIcon, ExpandMore as ExpandIcon,
} from '@mui/icons-material';
import { useQuestions, usePapers } from '../../../hooks/useAssessment';
import { useAuth } from '../../../hooks/useAuth';
import {
  AssessmentQuestion, PaperQuestion, PaperSection, CreatePaperInput,
  PaperType, QuestionType, QuestionDifficulty,
} from '../../../types/assessment';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const PAPER_TYPES: { value: PaperType; label: string }[] = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'mid_term', label: 'Mid Term' },
  { value: 'end_term', label: 'End Term' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'practice', label: 'Practice Test' },
  { value: 'mock', label: 'Mock Test' },
];

interface PaperBuilderProps {
  collegeId: string;
  subjectId?: string;
}

const PaperBuilder: React.FC<PaperBuilderProps> = ({ collegeId, subjectId }) => {
  const { user } = useAuth();
  const { questions: approvedQuestions } = useQuestions(collegeId, {
    subjectId, status: 'approved'
  });
  const { create } = usePapers(collegeId);

  const [showBuilder, setShowBuilder] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperType, setPaperType] = useState<PaperType>('quiz');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [passingMarks, setPassingMarks] = useState(0);
  const [hasNegativeMarking, setHasNegativeMarking] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(true);
  const [showResultImmediately, setShowResultImmediately] = useState(false);
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);

  const [sections, setSections] = useState<PaperSection[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<QuestionDifficulty | ''>('');
  const [filterType, setFilterType] = useState<QuestionType | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredQuestions = (approvedQuestions as any[] || []).filter((q: any) => {
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    if (filterType && q.questionType !== filterType) return false;
    if (searchQuery && q.questionText) {
      return q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const addSection = () => {
    const newSection: PaperSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Section ${String.fromCharCode(65 + sections.length)}`,
      description: '',
      questions: [],
      totalMarks: 0,
      instructions: '',
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section && section.questions) {
      const qIds = new Set(section.questions.map((q: PaperQuestion) => q.questionId));
      setSelectedQuestions((prev) => {
        const updated = new Set(prev);
        qIds.forEach((id) => updated.delete(id as string));
        return updated;
      });
    }
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const addQuestionToSection = (question: AssessmentQuestion, sectionId: string) => {
    if (selectedQuestions.has(question.id)) return;
    const paperQuestion: PaperQuestion = {
      questionId: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      difficulty: question.difficulty,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      options: question.options?.map((o: { id: string; text: string }) => ({ id: o.id, text: o.text })),
      order: 0,
      sectionId,
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, questions: [...(s.questions || []), paperQuestion], totalMarks: (s.totalMarks || 0) + question.marks }
          : s
      )
    );
    setSelectedQuestions((prev) => new Set([...prev, question.id]));
  };

  const removeQuestionFromSection = (questionId: string, sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const q = s.questions?.find((q: PaperQuestion) => q.questionId === questionId);
        return {
          ...s,
          questions: (s.questions || []).filter((q: PaperQuestion) => q.questionId !== questionId),
          totalMarks: (s.totalMarks || 0) - (q?.marks || 0),
        };
      })
    );
    setSelectedQuestions((prev) => {
      const updated = new Set(prev);
      updated.delete(questionId);
      return updated;
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sectionId = result.source.droppableId;
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.questions) return;
    const qs = Array.from(section.questions);
    const [reordered] = qs.splice(result.source.index, 1);
    qs.splice(result.destination.index, 0, reordered);
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, questions: qs } : s)));
  };

  const totalMarks = sections.reduce((sum, s) => sum + (s.totalMarks || 0), 0);
  const totalQuestions = sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

  const handleSavePaper = async () => {
    if (!paperTitle.trim()) { setError('Paper title is required'); return; }
    if (sections.length === 0) { setError('Add at least one section with questions'); return; }

    setLoading(true); setError(null);
    try {
      const input: CreatePaperInput = {
        title: paperTitle,
        description: description || undefined,
        paperType,
        subjectId: subjectId || '',
        courseId: '',
        semester: 1,
        sections: sections.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description || undefined,
          instructions: s.instructions || undefined,
          questions: (s.questions || []).map((q: PaperQuestion, idx: number) => ({
            questionId: q.questionId,
            questionText: q.questionText,
            questionType: q.questionType,
            difficulty: q.difficulty,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            options: q.options,
            order: idx,
            sectionId: q.sectionId,
          })),
          totalMarks: s.totalMarks || 0,
          questionType: s.questionType,
          numQuestions: s.numQuestions,
          marksPerQuestion: s.marksPerQuestion,
        })),
        durationMinutes,
        instructions: instructions || 'Read all questions carefully before answering.',
        shuffleQuestions,
        shuffleOptions,
        showResultImmediately,
        allowNavigation,
        allowMultipleAttempts,
        maxAttempts: allowMultipleAttempts ? maxAttempts : undefined,
        passingMarks: passingMarks || undefined,
        hasNegativeMarking,
      };
      await create(input);
      setShowBuilder(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create paper');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaperTitle('');
    setPaperType('quiz');
    setDescription('');
    setDurationMinutes(30);
    setInstructions('');
    setPassingMarks(0);
    setHasNegativeMarking(false);
    setSections([]);
    setSelectedQuestions(new Set());
    setError(null);
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!showBuilder ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Paper Builder</Typography>
              <Typography variant="body2" color="text.secondary">
                Create question papers from approved questions
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowBuilder(true)}>
              Create New Paper
            </Button>
          </Box>
          <Alert severity="info">Paper list will be displayed here</Alert>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Create Paper</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={`${totalQuestions} Questions`} color="primary" />
                <Chip label={`${totalMarks} Marks`} color="success" />
                <Chip label={`${durationMinutes} Mins`} color="info" />
              </Stack>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField label="Paper Title" value={paperTitle} onChange={(e) => setPaperTitle(e.target.value)}
                sx={{ flex: '1 1 300px' }} required />
              <FormControl sx={{ flex: '1 1 200px' }}>
                <InputLabel>Paper Type</InputLabel>
                <Select value={paperType} label="Paper Type" onChange={(e) => setPaperType(e.target.value as PaperType)}>
                  {PAPER_TYPES.map((t) => (<MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>))}
                </Select>
              </FormControl>
              <TextField label="Duration (minutes)" type="number" value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))} sx={{ flex: '1 1 150px' }} />
              <TextField label="Passing Marks" type="number" value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))} sx={{ flex: '1 1 150px' }} />
            </Box>
          </Paper>

          <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
            {/* Question Bank Panel */}
            <Paper variant="outlined" sx={{ width: 400, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                  Question Bank ({filteredQuestions.length})
                </Typography>
                <TextField size="small" fullWidth placeholder="Search questions..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} /> } }}
                  sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Difficulty</InputLabel>
                    <Select value={filterDifficulty} label="Difficulty"
                      onChange={(e) => setFilterDifficulty(e.target.value as QuestionDifficulty)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Type</InputLabel>
                    <Select value={filterType} label="Type"
                      onChange={(e) => setFilterType(e.target.value as QuestionType)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="mcq_single">MCQ Single</MenuItem>
                      <MenuItem value="mcq_multiple">MCQ Multiple</MenuItem>
                      <MenuItem value="true_false">True/False</MenuItem>
                      <MenuItem value="fill_in_blank">Fill Blank</MenuItem>
                      <MenuItem value="short_answer">Short Answer</MenuItem>
                      <MenuItem value="long_answer">Long Answer</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                {filteredQuestions.map((question: any) => (
                  <Card key={question.id} variant="outlined" sx={{
                    mb: 1,
                    cursor: selectedQuestions.has(question.id) ? 'not-allowed' : 'pointer',
                    opacity: selectedQuestions.has(question.id) ? 0.5 : 1,
                    '&:hover': { bgcolor: selectedQuestions.has(question.id) ? 'inherit' : 'action.hover' },
                  }} onClick={() => {
                    if (activeSectionId && !selectedQuestions.has(question.id)) {
                      addQuestionToSection(question, activeSectionId);
                    }
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" noWrap sx={{ mb: 0.5 }}>
                        {question.questionText}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Chip size="small" label={question.difficulty} color={
                          question.difficulty === 'easy' ? 'success' : question.difficulty === 'medium' ? 'warning' : 'error'
                        } />
                        <Chip size="small" label={`${question.marks}m`} variant="outlined" />
                        <Chip size="small" label={question.questionType} variant="outlined" />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>

            {/* Paper Structure Panel */}
            <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Paper Structure</Typography>
                <Button startIcon={<AddIcon />} onClick={addSection} size="small" variant="outlined">
                  Add Section
                </Button>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {sections.length === 0 ? (
                  <Alert severity="info">Add a section and select questions from the bank</Alert>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    {sections.map((section) => (
                      <Accordion key={section.id}
                        expanded={activeSectionId === section.id}
                        onChange={() => setActiveSectionId(activeSectionId === section.id ? null : section.id)}
                        sx={{
                          mb: 1,
                          border: activeSectionId === section.id ? 2 : 1,
                          borderColor: activeSectionId === section.id ? 'primary.main' : 'divider',
                        }}>
                        <AccordionSummary expandIcon={<ExpandIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Typography sx={{ fontWeight: 600 }}>{section.title}</Typography>
                            <Chip size="small" label={`${section.questions?.length || 0} Q`} />
                            <Chip size="small" label={`${section.totalMarks || 0} M`} color="success" />
                            <Box sx={{ flex: 1 }} />
                            <IconButton size="small" color="error"
                              onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TextField size="small" label="Section Title" value={section.title}
                            onChange={(e) => {
                              setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s)));
                            }}
                            sx={{ mb: 2 }} fullWidth />
                          <Droppable droppableId={section.id}>
                            {(provided) => (
                              <List {...provided.droppableProps} ref={provided.innerRef} dense>
                                {(section.questions || []).map((question: PaperQuestion, idx: number) => (
                                  <Draggable key={question.questionId} draggableId={question.questionId} index={idx}>
                                    {(provided, snapshot) => (
                                      <ListItem ref={provided.innerRef} {...provided.draggableProps}
                                        sx={{
                                          bgcolor: snapshot.isDragging ? 'primary.light' : 'background.paper',
                                          borderRadius: 1, mb: 0.5, border: 1, borderColor: 'divider',
                                        }}>
                                        <Box {...provided.dragHandleProps} sx={{ mr: 1, color: 'text.secondary' }}>
                                          <DragIcon />
                                        </Box>
                                        <ListItemText
                                          primary={<Typography variant="body2" noWrap>{idx + 1}. {question.questionText?.substring(0, 60)}...</Typography>}
                                          secondary={
                                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                              <Chip size="small" label={question.questionType} variant="outlined" />
                                              <Chip size="small" label={`${question.marks}m`} color="primary" />
                                              <Chip size="small" label={question.difficulty} color={
                                                question.difficulty === 'easy' ? 'success' : question.difficulty === 'medium' ? 'warning' : 'error'
                                              } />
                                            </Stack>
                                          }
                                        />
                                        <ListItemSecondaryAction>
                                          <IconButton edge="end" size="small" color="error"
                                            onClick={() => removeQuestionFromSection(question.questionId, section.id)}>
                                            <DeleteIcon />
                                          </IconButton>
                                        </ListItemSecondaryAction>
                                      </ListItem>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </List>
                            )}
                          </Droppable>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </DragDropContext>
                )}
              </Box>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>Paper Settings</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControlLabel control={<Checkbox checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />} label="Shuffle Questions" />
                  <FormControlLabel control={<Checkbox checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />} label="Shuffle Options" />
                  <FormControlLabel control={<Checkbox checked={allowNavigation} onChange={(e) => setAllowNavigation(e.target.checked)} />} label="Allow Navigation" />
                  <FormControlLabel control={<Checkbox checked={showResultImmediately} onChange={(e) => setShowResultImmediately(e.target.checked)} />} label="Show Result Immediately" />
                  <FormControlLabel control={<Checkbox checked={hasNegativeMarking} onChange={(e) => setHasNegativeMarking(e.target.checked)} />} label="Negative Marking" />
                  <FormControlLabel control={<Checkbox checked={allowMultipleAttempts} onChange={(e) => setAllowMultipleAttempts(e.target.checked)} />} label="Multiple Attempts" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button variant="outlined" onClick={() => { setShowBuilder(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSavePaper} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Paper'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PaperBuilder;
