// src/modules/superadmin/components/BulkStudentAccessUpdate.tsx
// ─── Assign a platform-access product to the selected students ───────────────
//
// The bulk counterpart of the product picker in the onboarding import: choose a
// product, choose the day access starts, and every selected student gets the
// window the product buys (end = start + duration − 1 day, inclusive).
//
// "Clear access" exists for the students who were sold access outside the
// system (or imported before products existed): it removes the fields instead
// of inventing a window, and the MIS then reports them as unassigned rather
// than expired.

import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Switch, TextField, Typography, FormControlLabel } from '@mui/material'
import { KeyRound, Info, Users, X } from 'lucide-react'
import { useAccessProducts, useBulkUpdateStudentAccess } from '../hooks/useSuperAdmin'
import { computeAccessWindow, formatDurationMonths } from '@/shared/utils/accessWindow'
import { useNotification } from '@/shared/providers/NotificationProvider'
import type { Student } from '../types/superAdmin'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** Today as yyyy-mm-dd in IST — the same day the server stamps. */
function todayIst(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

interface Props {
  students: Student[]
  onClose: () => void
  onUpdated: () => void
}

export default function BulkStudentAccessUpdate({ students, onClose, onUpdated }: Props) {
  const { showSuccess, showError } = useNotification()
  const { data: products } = useAccessProducts()
  const assign = useBulkUpdateStudentAccess()
  const [productId, setProductId] = useState('')
  const [startDate, setStartDate] = useState(todayIst())
  const [clearAccess, setClearAccess] = useState(false)
  const [error, setError] = useState('')

  const product = (products || []).find((p) => p.id === productId)
  const preview = product ? computeAccessWindow(startDate, product.durationMonths) : null

  const submit = async () => {
    setError('')
    if (!clearAccess && !productId) {
      setError('Pick a product, or switch on "Clear access".')
      return
    }
    try {
      const result = await assign.mutateAsync({
        studentIds: students.map((student) => student.id),
        ...(clearAccess ? { clearAccess: true } : { productId, startDate }),
      })
      const missing = result.missingIds.length ? ` ${result.missingIds.length} missing record(s) were skipped.` : ''
      showSuccess(
        clearAccess
          ? `Cleared platform access on ${result.updated} student${result.updated === 1 ? '' : 's'}.${missing}`
          : `${result.updated} student${result.updated === 1 ? '' : 's'} on "${result.productName}" until ${result.accessEnd}.${missing}`,
      )
      onUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The access window could not be saved')
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <KeyRound size={20} />
          <span>
            Change platform access
            <Typography variant="body2" color="text.secondary">
              {students.length} selected student{students.length === 1 ? '' : 's'}
            </Typography>
          </span>
        </Stack>
        <Button size="small" onClick={onClose} aria-label="Close" sx={{ minWidth: 0 }}>
          <X size={16} />
        </Button>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="info" icon={<Info size={16} />}>
            Everyone selected gets the same product and start date. The end date is computed from the
            product&apos;s duration — the last day of access, inclusive.
          </Alert>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={clearAccess}
            fullWidth
          >
            {(products || []).filter((p) => p.active).length === 0 && (
              <MenuItem value="" disabled>
                No active products — create one on Products &amp; Access MIS
              </MenuItem>
            )}
            {(products || [])
              .filter((p) => p.active)
              .map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} · {formatDurationMonths(p.durationMonths)} · {inr.format(p.price)} per student
                </MenuItem>
              ))}
          </TextField>

          <TextField
            label="Access starts"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={clearAccess}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          {preview && (
            <Alert severity="success">
              Covered from <strong>{preview.start}</strong> to <strong>{preview.end}</strong> (inclusive) —{' '}
              {formatDurationMonths(preview.durationMonths)} of access.
            </Alert>
          )}

          <FormControlLabel
            control={<Switch checked={clearAccess} onChange={(e) => setClearAccess(e.target.checked)} />}
            label="Clear access instead (no product / sold outside the system)"
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <Users size={14} />
            <Typography variant="caption">
              {students.slice(0, 4).map((s) => s.name).join(', ')}
              {students.length > 4 ? ` and ${students.length - 4} more` : ''}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={assign.isPending || (!clearAccess && !productId)}>
          {assign.isPending ? 'Saving…' : `Update ${students.length} student${students.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
