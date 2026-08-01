// src/components/question-bank/QuestionPreview.tsx
// ─── Question Preview Component ─────────────────────────

import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import type { Question } from '../../types/questionBank'

interface QuestionPreviewProps {
  question: Question
  showAnswer?: boolean
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  question,
  showAnswer = false,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Chip label={question.type} size="small" />
        <Chip
          label={question.difficulty}
          size="small"
          color={
            question.difficulty === 'easy'
              ? 'success'
              : question.difficulty === 'medium'
              ? 'warning'
              : 'error'
          }
        />
        {question.marks && <Chip label={`${question.marks} marks`} size="small" />}
        {question.isPYQ && <Chip label="PYQ" size="small" color="secondary" />}
      </Box>

      <Typography variant="body1" gutterBottom>
        {question.text}
      </Typography>

      {question.options && question.options.length > 0 && (
        <List dense>
          {question.options.map((opt, i) => (
            <ListItem key={opt.id || i}>
              <Typography variant="body2">
                {String.fromCharCode(97 + i)}. {opt.text}
                {showAnswer && opt.isCorrect && (
                  <Chip label="Correct" size="small" color="success" sx={{ ml: 1 }} />
                )}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}

      {showAnswer && question.correctAnswer && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="success.main">
            <strong>Answer:</strong>{' '}
            {Array.isArray(question.correctAnswer)
              ? question.correctAnswer.join(', ')
              : question.correctAnswer}
          </Typography>
        </Box>
      )}

      {question.explanation && (
        <Box sx={{ mt: 1, p: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Explanation:</strong> {question.explanation}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {question.tags?.map((tag, i) => (
          <Chip key={i} label={tag} size="small" variant="outlined" />
        ))}
      </Box>
    </Box>
  )
}

export default QuestionPreview