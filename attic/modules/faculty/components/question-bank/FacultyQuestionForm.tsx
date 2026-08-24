// src/modules/components/question-bank/FacultyQuestionForm.tsx
// FIXED: subjects prop accepts string[] (not readonly), all type casts safe

import React, { useState } from 'react';
import {
  Box, TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, Button, Typography, Divider,
  FormControlLabel, Switch, Radio, RadioGroup, FormLabel,
  IconButton, Paper,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import type { Question } from '../../../admin/types/questionBank';

interface FacultyQuestionFormProps {
  initialData?: Question;
  subjects: string[];
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const TYPES = ['mcq', 'short', 'long', 'numerical'] as const;
const UNITS = ['1', '2', '3', '4', '5'] as const;

const FacultyQuestionForm: React.FC<FacultyQuestionFormProps> = ({
  initialData,
  subjects,
  onSubmit,
  onCancel,
}) => {
  const safeData = (initialData || {}) as Record<string, unknown>;

  const [text, setText] = useState(String(safeData.text || ''));
  const [subject, setSubject] = useState(String(safeData.subject || ''));
  const [type, setType] = useState(String(safeData.type || 'mcq'));
  const [difficulty, setDifficulty] = useState(String(safeData.difficulty || 'medium'));
  const [marks, setMarks] = useState(Number(safeData.marks || 1));
  const [unit, setUnit] = useState(String(safeData.unit || '1'));
  const [batch, setBatch] = useState(String(safeData.batch || ''));
  const [branch, setBranch] = useState(String(safeData.branch || ''));
  const [tags, setTags] = useState<string[]>((safeData.tags as string[]) || []);
  const [tagInput, setTagInput] = useState('');
  const [isPYQ, setIsPYQ] = useState(Boolean(safeData.isPYQ || false));
  const [examYear, setExamYear] = useState(String(safeData.examYear || ''));
  const [examName, setExamName] = useState(String(safeData.examName || ''));
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>(
    (safeData.options as { text: string; isCorrect: boolean }[]) || [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  );
  const [correctAnswer, setCorrectAnswer] = useState(String(safeData.correctAnswer || ''));
  const [answerExplanation, setAnswerExplanation] = useState(String(safeData.answerExplanation || ''));

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleCorrectToggle = (index: number) => {
    const newOptions = options.map((opt, i) => ({ ...opt, isCorrect: i === index }));
    setOptions(newOptions);
    setCorrectAnswer(String.fromCharCode(65 + index));
  };

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      text,
      subject,
      type,
      difficulty,
      marks,
      unit,
      batch: batch || undefined,
      branch: branch || undefined,
      tags,
      isPYQ,
      examYear: isPYQ ? examYear : undefined,
      examName: isPYQ ? examName : undefined,
      options: type === 'mcq' ? options : undefined,
      correctAnswer,
      answerExplanation: answerExplanation || undefined,
    };
    onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        label="Question Text *"
        multiline
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        required
        fullWidth
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ flex: '1 1 200px', minWidth: 160 }}>
          <InputLabel>Subject *</InputLabel>
          <Select value={subject} onChange={e => setSubject(e.target.value)} label="Subject *" required>
            {subjects.map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ flex: '1 1 150px', minWidth: 120 }}>
          <InputLabel>Type *</InputLabel>
          <Select value={type} onChange={e => setType(e.target.value)} label="Type *" required>
            {TYPES.map(t => (
              <MenuItem key={t} value={t}>{t.toUpperCase()}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ flex: '1 1 150px', minWidth: 120 }}>
          <InputLabel>Difficulty *</InputLabel>
          <Select value={difficulty} onChange={e => setDifficulty(e.target.value)} label="Difficulty *" required>
            {DIFFICULTIES.map(d => (
              <MenuItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Marks"
          type="number"
          value={marks}
          onChange={e => setMarks(Number(e.target.value))}
          sx={{ flex: '1 1 100px', minWidth: 80 }}
        />

        <FormControl sx={{ flex: '1 1 100px', minWidth: 80 }}>
          <InputLabel>Unit</InputLabel>
          <Select value={unit} onChange={e => setUnit(e.target.value)} label="Unit">
            {UNITS.map(u => (
              <MenuItem key={u} value={u}>Unit {u}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TextField
        label="Correct Answer *"
        value={correctAnswer}
        onChange={e => setCorrectAnswer(e.target.value)}
        required
        helperText="For MCQ: A, B, C, D etc. For others: write the answer"
        fullWidth
      />

      {type === 'mcq' && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Options</Typography>
          <RadioGroup value={options.findIndex(o => o.isCorrect)}>
            {options.map((opt, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FormControlLabel
                  value={i}
                  control={<Radio onChange={() => handleCorrectToggle(i)} />}
                  label={
                    <TextField
                      size="small"
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt.text}
                      onChange={e => handleOptionChange(i, e.target.value)}
                      sx={{ minWidth: 300 }}
                    />
                  }
                />
                <IconButton size="small" onClick={() => handleRemoveOption(i)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </RadioGroup>
          <Button startIcon={<AddIcon />} onClick={handleAddOption} size="small">
            Add Option
          </Button>
        </Paper>
      )}

      <TextField
        label="Answer Explanation"
        multiline
        rows={2}
        value={answerExplanation}
        onChange={e => setAnswerExplanation(e.target.value)}
        fullWidth
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Batch"
          value={batch}
          onChange={e => setBatch(e.target.value)}
          sx={{ flex: '1 1 200px' }}
        />
        <TextField
          label="Branch"
          value={branch}
          onChange={e => setBranch(e.target.value)}
          sx={{ flex: '1 1 200px' }}
        />
      </Box>

      <Box>
        <Typography variant="body2" gutterBottom>Tags</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} size="small" />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Add tag..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
          />
          <Button variant="outlined" size="small" onClick={handleAddTag}>Add</Button>
        </Box>
      </Box>

      <FormControlLabel
        control={<Switch checked={isPYQ} onChange={e => setIsPYQ(e.target.checked)} />}
        label="Previous Year Question (PYQ)"
      />

      {isPYQ && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Exam Year"
            value={examYear}
            onChange={e => setExamYear(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Exam Name"
            value={examName}
            onChange={e => setExamName(e.target.value)}
            sx={{ flex: 1 }}
          />
        </Box>
      )}

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined">Cancel</Button>
        <Button type="submit" variant="contained">
          {initialData ? 'Update Question' : 'Create Question'}
        </Button>
      </Box>
    </Box>
  );
};

export default FacultyQuestionForm;