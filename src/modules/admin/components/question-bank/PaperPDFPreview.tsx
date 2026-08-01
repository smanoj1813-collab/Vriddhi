// src/components/question-bank/PaperPDFPreview.tsx
// PDF Preview & Download component for papers — MUI v5 compatible

import React, { useState, useRef } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import type { Paper } from '../../types/questionBank'
import { downloadElementAsPDF, generatePaperHTML } from '../../../../shared/utils/pdfGenerator'
import { downloadPaperPDF } from '../../../../shared/utils/pdfDownloader'

interface PaperPDFPreviewProps {
  paper: Paper
  collegeName?: string
  variant?: 'button' | 'icon' | 'menu'
}

const PaperPDFPreview: React.FC<PaperPDFPreviewProps> = ({
  paper,
  collegeName,
  variant = 'button',
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    setOpen(true)
    setError(null)
  }

  const handleClose = () => {
    setOpen(false)
    setError(null)
  }

  const handleClientDownload = async () => {
    if (!previewRef.current) return
    setLoading(true)
    setError(null)
    try {
      await downloadElementAsPDF(
        previewRef.current.id,
        `${paper.title || 'paper'}_preview`,
        { scale: 2 }
      )
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleBackendDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      await downloadPaperPDF(paper.id, paper.title)
    } catch (err: any) {
      setError(err.message || 'Failed to download PDF from server')
    } finally {
      setLoading(false)
    }
  }

  const triggerButton =
    variant === 'icon' ? (
      <Tooltip title="Preview / Download PDF">
        <IconButton onClick={handleOpen} size="small" color="primary">
          <PdfIcon />
        </IconButton>
      </Tooltip>
    ) : (
      <Button
        variant="outlined"
        size="small"
        startIcon={<PdfIcon />}
        onClick={handleOpen}
      >
        PDF
      </Button>
    )

  return (
    <>
      {triggerButton}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{  // ← MUI v5: use slotProps instead of PaperProps
          paper: {
            sx: { minHeight: '80vh' }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Paper Preview — {paper.title}</span>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            id="paper-preview-container"
            ref={previewRef}
            sx={{
              bgcolor: '#fff',
              color: '#000',
              p: 4,
              minHeight: 500,
              fontFamily: "'Times New Roman', serif",
              fontSize: '12pt',
              lineHeight: 1.6,
              '& .paper-header': {
                textAlign: 'center',
                borderBottom: '2px solid #000',
                pb: 2,
                mb: 3,
              },
              '& .college-name': {
                fontSize: '16pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              },
              '& .exam-title': {
                fontSize: '14pt',
                fontWeight: 'bold',
                mt: 1,
              },
              '& .meta-row': {
                display: 'flex',
                justifyContent: 'space-between',
                my: 2,
                fontSize: '11pt',
              },
              '& .instructions': {
                bgcolor: '#f5f5f5',
                border: '1px solid #ccc',
                p: 1.5,
                my: 2,
                fontSize: '10pt',
              },
              '& .section': { mt: 3 },
              '& .section-header': {
                fontSize: '13pt',
                fontWeight: 'bold',
                borderBottom: '1px solid #000',
                pb: 0.5,
                mb: 1.5,
              },
              '& .question': { my: 2, pl: 1 },
              '& .question-num': { fontWeight: 'bold', mr: 1 },
              '& .options': { ml: 3, my: 1 },
              '& .option': { my: 0.5 },
              '& .marks': { float: 'right', fontWeight: 'bold' },
              '& .footer': {
                mt: 4,
                textAlign: 'center',
                fontSize: '10pt',
                borderTop: '1px solid #ccc',
                pt: 1,
              },
            }}
            dangerouslySetInnerHTML={{
              __html: generatePaperHTML(paper, collegeName),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleClose} color="inherit">
            Close
          </Button>

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <PreviewIcon />}
            onClick={handleClientDownload}
            disabled={loading}
          >
            Quick Download (Preview)
          </Button>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleBackendDownload}
            disabled={loading}
          >
            Download Official PDF
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PaperPDFPreview
