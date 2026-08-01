// src/components/question-bank/QuestionPDFExport.tsx
// Export selected questions as PDF

import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Alert,
  Typography,
  Box,
} from '@mui/material'
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import type { Question } from '../../types/questionBank'
import { downloadQuestionsPDF } from '../../../../shared/utils/pdfDownloader'

interface QuestionPDFExportProps {
  questions: Question[]
  title?: string
}

const QuestionPDFExport: React.FC<QuestionPDFExportProps> = ({
  questions,
  title = 'Question Bank Export',
}) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setOpen(true)
    setSelected(new Set(questions.map((q) => q.id)))
    setError(null)
  }

  const handleClose = () => {
    setOpen(false)
    setError(null)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map((q) => q.id)))
    }
  }

  const handleDownload = async () => {
    if (selected.size === 0) {
      setError('Please select at least one question')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const selectedIds = Array.from(selected)
      await downloadQuestionsPDF(selectedIds, title)
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to download PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PdfIcon />}
        onClick={handleOpen}
      >
        Export PDF
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Export Questions to PDF</DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selected.size} of {questions.length} questions selected
          </Typography>

          <Button size="small" onClick={selectAll} sx={{ mb: 1 }}>
            {selected.size === questions.length ? 'Deselect All' : 'Select All'}
          </Button>

          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {questions.map((q) => (
              <ListItem key={q.id} dense disablePadding>
                <Checkbox
                  edge="start"
                  checked={selected.has(q.id)}
                  onChange={() => toggleSelect(q.id)}
                />
                <ListItemText
                  primary={q.text.substring(0, 80) + (q.text.length > 80 ? '...' : '')}
                  secondary={`${q.subject} | ${q.type} | ${q.difficulty} | ${q.marks} marks`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleDownload}
            disabled={loading || selected.size === 0}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default QuestionPDFExport
