// ═══════════════════════════════════════════════════════════════════════════════
// components/AutoMapDialog.tsx — preview & approve the auto curriculum mapping
//
// Two-step, human-in-the-loop: "Generate proposals" calls the autoMapCurriculum
// callable (pure computation — nothing is written), the HOD reviews scores,
// reasons and flags per course, then "Apply" writes only the ticked rows via
// applyAutoMapping. The dialog never writes mappings itself.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  AutoAwesome as AutoIcon,
  CheckCircle as CheckIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'

import type { CurriculumDoc } from '@/shared/types/curriculum'
import {
  autoMapCurriculum,
  applyAutoMapping,
  type AutoMapResult,
} from '../api/autoMappingApi'

interface AutoMapDialogProps {
  curriculum: CurriculumDoc
  /** Batches the college already uses (from mappings) — quick-pick candidates. */
  knownBatches: string[]
  onClose: () => void
  /** Called with the number of mappings written; the page shows the snackbar. */
  onApplied: (created: number) => void
}

function scoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 70) return 'success'
  if (score >= 40) return 'warning'
  return 'error'
}

const AutoMapDialog: React.FC<AutoMapDialogProps> = ({ curriculum, knownBatches, onClose, onApplied }) => {
  const [batch, setBatch] = useState<string>(() => knownBatches[0] || '')
  const [division, setDivision] = useState('')
  const [section, setSection] = useState('')
  const [capacity, setCapacity] = useState('24')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AutoMapResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showLoad, setShowLoad] = useState(false)

  /** "__type__" is the Select placeholder for a custom batch, not a value. */
  const effectiveBatch = batch === '__type__' ? '' : batch.trim()

  const selectedIds = useMemo(() => {
    if (!result) return []
    return result.proposals.filter((p) => p.status === 'proposed' && selected.has(p.courseId)).map((p) => p.courseId)
  }, [result, selected])

  const toggle = (courseId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const handleGenerate = async () => {
    if (!effectiveBatch) {
      setError('Pick a batch first (e.g. 2026)')
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const res = await autoMapCurriculum({
        curriculumId: curriculum.id,
        batch: effectiveBatch,
        division: division.trim() || undefined,
        section: section.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
      })
      setResult(res)
      // Pre-select every proposed course; the HOD unticks what they reject.
      setSelected(new Set(res.proposals.filter((p) => p.status === 'proposed').map((p) => p.courseId)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (selectedIds.length === 0) return
    setApplying(true)
    setError(null)
    try {
      const res = await applyAutoMapping({
        curriculumId: curriculum.id,
        batch: effectiveBatch,
        division: division.trim() || undefined,
        section: section.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        courseIds: selectedIds,
      })
      onApplied(res.created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply the mapping')
      setApplying(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoIcon color="primary" />
          Auto-map faculty — {curriculum.title}
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* ── Step 1: inputs ── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Batch *</InputLabel>
            <Select
              label="Batch *"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              renderValue={(v) => (knownBatches.includes(v as string) ? v : v || 'Select or type a batch')}
            >
              {knownBatches.length === 0 && <MenuItem value="__type__">Type a batch…</MenuItem>}
              {knownBatches.map((b) => (
                <MenuItem key={b} value={b}>{b}</MenuItem>
              ))}
              {knownBatches.length > 0 && <MenuItem value="__type__">Other…</MenuItem>}
            </Select>
          </FormControl>
          {knownBatches.length > 0 && batch === '__type__' ? (
            <TextField
              size="small"
              label="Batch value"
              placeholder="e.g. 2026"
              value={batch === '__type__' ? '' : batch}
              onChange={(e) => setBatch(e.target.value)}
              sx={{ minWidth: 160 }}
            />
          ) : null}
          <TextField size="small" label="Division (optional)" value={division} onChange={(e) => setDivision(e.target.value)} sx={{ minWidth: 150 }} />
          <TextField size="small" label="Section (optional)" value={section} onChange={(e) => setSection(e.target.value)} sx={{ minWidth: 150 }} />
          <TextField
            size="small"
            label="Capacity (hrs/wk)"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            sx={{ minWidth: 150 }}
            helperText="24 = UGC regular faculty"
            slotProps={{ htmlInput: { min: 1, max: 60 } }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Already-mapped courses in this batch are skipped. Scoring: subject fit 50 · branch fit 15 · experience 10 · load balance 25.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AutoIcon />}
          onClick={handleGenerate}
          disabled={loading || !effectiveBatch || batch === '__type__'}
          sx={{ mb: 2 }}
        >
          {loading ? 'Computing…' : 'Generate proposals'}
        </Button>

        {error && (
          <Box sx={{ color: 'error.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon fontSize="small" />
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        {loading && (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <LinearProgress sx={{ width: '60%' }} />
          </Box>
        )}

        {/* ── Step 2: review ── */}
        {result && (
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip label={`${result.summary.proposed} proposed`} color="success" size="small" icon={<CheckIcon />} />
              {result.summary.unassigned > 0 && (
                <Chip label={`${result.summary.unassigned} unassigned`} color="warning" size="small" icon={<WarningIcon />} />
              )}
              {result.summary.overloadFlags > 0 && (
                <Chip label={`${result.summary.overloadFlags} overload risk`} color="error" size="small" icon={<WarningIcon />} />
              )}
              <Button size="small" onClick={() => setShowLoad((s) => !s)} endIcon={showLoad ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
                Faculty load
              </Button>
            </Stack>

            <Collapse in={showLoad}>
              {result.facultyLoad.length > 0 ? (
                <Table size="small" sx={{ mb: 2 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Faculty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Current</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Proposed</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Capacity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.facultyLoad.map((f) => (
                      <TableRow key={f.uid} hover>
                        <TableCell>{f.name}</TableCell>
                        <TableCell align="right">{f.currentWeeklyHours}</TableCell>
                        <TableCell align="right">{f.proposedWeeklyHours}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: f.totalWeeklyHours > f.capacity ? 'error.main' : 'text.primary' }}>
                          {f.totalWeeklyHours}
                        </TableCell>
                        <TableCell align="right">{f.capacity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No faculty with load to show.
                </Typography>
              )}
            </Collapse>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Proposed faculty</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Why</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.proposals.map((p) => (
                  <TableRow
                    key={p.courseId}
                    hover
                    selected={p.status === 'proposed' && selected.has(p.courseId)}
                    sx={{ opacity: p.status === 'unassigned' ? 0.65 : 1 }}
                  >
                    <TableCell padding="checkbox">
                      {p.status === 'proposed' && (
                        <input
                          type="checkbox"
                          checked={selected.has(p.courseId)}
                          onChange={() => toggle(p.courseId)}
                          aria-label={`Include ${p.courseName}`}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{p.courseName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.courseCode} · {p.credits} cr · {p.hoursPerWeek} hrs/wk
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {p.faculty ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={p.faculty.name} size="small" color={scoreColor(p.score)} variant="outlined" />
                          {p.flags.includes('overload-risk') && (
                            <Chip label="overload risk" size="small" color="warning" icon={<WarningIcon />} />
                          )}
                          {p.flags.includes('guest-assigned') && (
                            <Chip size="small" color="info" variant="outlined" label="guest faculty" sx={{ height: 20, fontSize: 11 }} />
                          )}
                          {p.flags.includes('no-subject-match') && (
                            <Chip label="no subject match" size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      ) : (
                        <Chip label="Unassigned — no eligible faculty" size="small" color="warning" variant="outlined" icon={<WarningIcon />} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {p.status === 'proposed' && (
                        <Chip label={p.score} size="small" color={scoreColor(p.score)} sx={{ fontWeight: 700 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 340 }}>
                      <Typography variant="caption" color="text.secondary">
                        {p.reasons.join(' · ')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!result || applying || selectedIds.length === 0}
        >
          {applying
            ? 'Applying…'
            : result
              ? `Apply ${selectedIds.length} mapping${selectedIds.length === 1 ? '' : 's'}`
              : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AutoMapDialog
