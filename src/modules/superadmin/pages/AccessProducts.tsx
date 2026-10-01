// src/modules/superadmin/pages/AccessProducts.tsx
// ─── Products & Access MIS ──────────────────────────────────────────────────
//
// Two tabs, one subject: what platform access is sold, and what has been sold.
//
//   Products — the catalogue. A product is a NAME, a DURATION in months
//              (12 / 24 / 36 = the 1-year, 2-year and 3-year access the
//              onboarding flow had no way to express) and a PRICE per student.
//   Access MIS — students per product, split into Active / Expiring (≤60 days)
//              / Expired, with the value of each bucket and the next expiries.
//
// The MIS numbers come from the `getAccessMis` callable, which aggregates
// server-side over the students collection: a college with thousands of
// students never has to load every row into the browser to draw this page.

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  IndianRupee,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import {
  useAccessMis,
  useAccessProducts,
  useArchiveAccessProduct,
  useCreateAccessProduct,
  useDeleteAccessProduct,
  useUpdateAccessProduct,
  useColleges,
} from '../hooks/useSuperAdmin'
import { deriveProductCode, validateAccessProductInput } from '../api/accessProductsApi'
import {
  ACCESS_EXPIRING_SOON_DAYS,
  accessDaysLeft,
  computeAccessWindow,
  formatDurationMonths,
} from '@/shared/utils/accessWindow'
import { useNotification } from '@/shared/providers/NotificationProvider'
import type { AccessProduct, AccessProductInput } from '../types/superAdmin'

const DURATION_PRESETS = [
  { months: 12, label: '1 year' },
  { months: 24, label: '2 years' },
  { months: 36, label: '3 years' },
]

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** Today as yyyy-mm-dd in IST — the same day the server stamps. */
function todayIst(): string {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 10)
}

// ─── Create / edit dialog ───────────────────────────────────────────────────

interface FormState extends AccessProductInput {
  id?: string
}

function ProductDialog({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean
  initial: AccessProduct | null
  onClose: () => void
  onSaved: () => void
}) {
  const { showSuccess, showError } = useNotification()
  const createProduct = useCreateAccessProduct()
  const updateProduct = useUpdateAccessProduct()
  const [form, setForm] = useState<FormState>({
    name: initial?.name || '',
    code: initial?.code || '',
    durationMonths: initial?.durationMonths || 12,
    price: initial?.price ?? 0,
    currency: initial?.currency || 'INR',
    description: initial?.description || '',
    active: initial?.active !== false,
  })

  const durationMonths = Number(form.durationMonths)
  const preview = computeAccessWindow(todayIst(), durationMonths)
  const problem = validateAccessProductInput({ ...form, durationMonths })

  const submit = async () => {
    if (problem) return
    try {
      if (initial) {
        await updateProduct.mutateAsync({ productId: initial.id, updates: { ...form, durationMonths } })
        showSuccess(`Product "${form.name}" updated. Students already on it keep their original dates.`)
      } else {
        await createProduct.mutateAsync({ ...form, durationMonths })
        showSuccess(`Product "${form.name}" created — pick it during student import.`)
      }
      onSaved()
      onClose()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'The product could not be saved')
    }
  }

  const busy = createProduct.isPending || updateProduct.isPending

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit product' : 'New platform-access product'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Product name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="1-Year Platform Access"
            fullWidth
            required
          />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Duration — how long one student&apos;s access lasts
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              {DURATION_PRESETS.map((preset) => (
                <Chip
                  key={preset.months}
                  label={preset.label}
                  color={durationMonths === preset.months ? 'primary' : 'default'}
                  onClick={() => setForm((f) => ({ ...f, durationMonths: preset.months }))}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
              <TextField
                label="Months"
                type="number"
                value={form.durationMonths}
                onChange={(e) => setForm((f) => ({ ...f, durationMonths: Number(e.target.value) }))}
                slotProps={{ htmlInput: { min: 1, max: 120, step: 1 } }}
                sx={{ width: 140 }}
                required
              />
              <TextField
                label="Price per student"
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                slotProps={{
                  input: { startAdornment: <IndianRupee size={16} style={{ marginRight: 6 }} /> },
                  htmlInput: { min: 0, step: 100 },
                }}
                sx={{ width: 220 }}
                required
              />
            </Stack>
            <FormHelperText>
              {preview
                ? `A student enrolled today would be covered from ${preview.start} to ${preview.end} (last day, inclusive).`
                : 'Enter a whole number of months (12 = 1 year).'}
            </FormHelperText>
          </Box>
          <TextField
            label="Code (optional)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder={deriveProductCode(form.name || 'access', durationMonths)}
            fullWidth
          />
          <TextField
            label="Notes (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            placeholder="What the package includes, who it is for…"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.active !== false}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
            }
            label="Active — can be assigned during onboarding"
          />
          {problem && <Alert severity="warning">{problem}</Alert>}
          {initial && (
            <Alert severity="info">
              Editing a product does not rewrite the dates already stamped on students. Use{' '}
              <strong>Students → Change platform access</strong> to move a batch onto the new window.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={busy || Boolean(problem)}>
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Create product'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AccessProducts() {
  const { showSuccess, showError } = useNotification()
  const [tab, setTab] = useState(0)
  const [dialog, setDialog] = useState<{ open: boolean; product: AccessProduct | null }>({ open: false, product: null })
  const [archiveTarget, setArchiveTarget] = useState<AccessProduct | null>(null)
  const [collegeFilter, setCollegeFilter] = useState('')

  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useAccessProducts()
  const { data: mis, isLoading: misLoading, error: misError, refetch: refetchMis } = useAccessMis(collegeFilter || undefined)
  const { data: collegesData } = useColleges({ status: 'all' })
  const archiveProduct = useArchiveAccessProduct()
  const deleteProduct = useDeleteAccessProduct()

  const colleges = collegesData?.items || []
  const collegeNames = useMemo(() => {
    const map = new Map<string, string>()
    colleges.forEach((c) => map.set(c.id, c.name))
    return map
  }, [colleges])

  const countsByProduct = useMemo(() => {
    const map = new Map<string, { students: number; active: number; expiring: number; expired: number }>()
    ;(mis?.byProduct || []).forEach((row) => {
      if (!row.productId) return
      map.set(row.productId, {
        students: row.students,
        active: row.active,
        expiring: row.expiring,
        expired: row.expired,
      })
    })
    return map
  }, [mis])

  const handleArchiveToggle = async (product: AccessProduct) => {
    try {
      await archiveProduct.mutateAsync({ productId: product.id, active: !product.active })
      showSuccess(product.active ? `"${product.name}" archived — it can no longer be assigned.` : `"${product.name}" is active again.`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'The product could not be updated')
    } finally {
      setArchiveTarget(null)
    }
  }

  const handleDelete = async (product: AccessProduct) => {
    const students = countsByProduct.get(product.id)?.students || 0
    if (students > 0) {
      showError(`"${product.name}" is on ${students} student(s) — archive it instead of deleting.`)
      return
    }
    try {
      await deleteProduct.mutateAsync(product.id)
      showSuccess(`"${product.name}" deleted.`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'The product could not be deleted')
    }
  }

  const totals = mis?.totals
  const expiringSoon = mis?.expiringSoon || []

  return (
    <Box className="page-container">
      <Box className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <Box>
          <Box className="mb-1 flex items-center gap-3">
            <Layers className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Products & Access MIS
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Define what platform access costs and how long it lasts, then track every student&apos;s subscription.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => {
              refetchProducts()
              refetchMis()
            }}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setDialog({ open: true, product: null })}>
            New product
          </Button>
        </Stack>
      </Box>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Products" />
        <Tab label="Access MIS" />
      </Tabs>

      {/* ── Products ── */}
      {tab === 0 && (
        <Box className="glass-card overflow-hidden">
          {productsError && (
            <Alert severity="error" sx={{ m: 2 }}>
              {productsError.message}
            </Alert>
          )}
          {productsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (products || []).length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Layers className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <Typography sx={{ fontWeight: 600 }}>No products yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create the 1-year, 2-year and 3-year access packages your college sells, with their prices.
              </Typography>
              <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setDialog({ open: true, product: null })}>
                Create the first product
              </Button>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell align="right">Price / student</TableCell>
                    <TableCell align="right">Students on it</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(products || []).map((product) => {
                    const counts = countsByProduct.get(product.id)
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.code}
                            {product.description ? ` · ${product.description}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDurationMonths(product.durationMonths)}</TableCell>
                        <TableCell align="right">{inr.format(product.price)}</TableCell>
                        <TableCell align="right">{counts?.students ?? 0}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={product.active ? 'Active' : 'Archived'}
                            color={product.active ? 'success' : 'default'}
                            variant={product.active ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" startIcon={<Pencil size={14} />} onClick={() => setDialog({ open: true, product })}>
                            Edit
                          </Button>
                          <Button size="small" onClick={() => setArchiveTarget(product)}>
                            {product.active ? 'Archive' : 'Restore'}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Trash2 size={14} />}
                            onClick={() => handleDelete(product)}
                            disabled={(countsByProduct.get(product.id)?.students || 0) > 0}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}

      {/* ── MIS ── */}
      {tab === 1 && (
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
            <TextField
              select
              size="small"
              label="College"
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">All colleges</MenuItem>
              {colleges.map((college) => (
                <MenuItem key={college.id} value={college.id}>
                  {college.name}
                </MenuItem>
              ))}
            </TextField>
            {mis?.today && (
              <Typography variant="caption" color="text.secondary">
                Buckets computed for {mis.today} (IST) · “Expiring” = ending within {ACCESS_EXPIRING_SOON_DAYS} days
              </Typography>
            )}
          </Stack>

          {misError && <Alert severity="error">{misError.message}</Alert>}

          {misLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  {
                    label: 'Students on a product',
                    value: totals ? `${totals.withProduct} / ${totals.students}` : '—',
                    hint: totals && totals.unassigned ? `${totals.unassigned} without access record` : 'Every student has an access record',
                    icon: <Users size={18} />,
                    tone: 'text-slate-900 dark:text-white',
                  },
                  {
                    label: 'Active',
                    value: totals?.active ?? 0,
                    hint: `Plus ${totals?.expiring ?? 0} expiring within ${ACCESS_EXPIRING_SOON_DAYS} days`,
                    icon: <BarChart3 size={18} />,
                    tone: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    label: 'Expired',
                    value: totals?.expired ?? 0,
                    hint: 'Renewal pipeline',
                    icon: <AlertTriangle size={18} />,
                    tone: 'text-amber-600 dark:text-amber-400',
                  },
                  {
                    label: 'Active subscription value',
                    value: totals ? inr.format(totals.activeValue) : '—',
                    hint: totals ? `${inr.format(totals.expiredValue)} lapsed` : '',
                    icon: <IndianRupee size={18} />,
                    tone: 'text-teal-600 dark:text-teal-400',
                  },
                ].map((card) => (
                  <Box key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]">
                    <Box className="mb-2 flex items-center gap-2 text-slate-500">
                      {card.icon}
                      <span className="text-[11px] font-semibold uppercase tracking-wide">{card.label}</span>
                    </Box>
                    <p className={`text-2xl font-extrabold tracking-tight ${card.tone}`}>{card.value}</p>
                    {card.hint ? <p className="mt-1 text-[11px] text-slate-500">{card.hint}</p> : null}
                  </Box>
                ))}
              </Box>

              <Box className="glass-card overflow-hidden">
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontWeight: 600 }}>By product</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Students</TableCell>
                        <TableCell align="right">Active</TableCell>
                        <TableCell align="right">Expiring</TableCell>
                        <TableCell align="right">Expired</TableCell>
                        <TableCell align="right">Active value</TableCell>
                        <TableCell align="right">Lapsed value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(mis?.byProduct || []).map((row) => (
                        <TableRow key={row.productId || 'unassigned'} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: row.productId ? 600 : 400 }}>{row.productName}</Typography>
                            {row.productId && (
                              <Typography variant="caption" color="text.secondary">
                                {formatDurationMonths(row.durationMonths)} · {inr.format(row.price)} per student
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{row.students}</TableCell>
                          <TableCell align="right">{row.active}</TableCell>
                          <TableCell align="right">{row.expiring}</TableCell>
                          <TableCell align="right">{row.expired}</TableCell>
                          <TableCell align="right">{inr.format(row.activeValue)}</TableCell>
                          <TableCell align="right">{inr.format(row.expiredValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              <Box className="glass-card overflow-hidden">
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box className="flex items-center gap-2">
                    <CalendarClock size={16} className="text-slate-500" />
                    <Typography sx={{ fontWeight: 600 }}>Next expiries</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Soonest first — students whose access ends first need the renewal conversation first.
                  </Typography>
                </Box>
                {expiringSoon.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No dated access yet. Assign a product during student import, or from Students → Change platform access.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto', maxHeight: 420 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>College</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Ends on</TableCell>
                          <TableCell align="right">Days left</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiringSoon.map((row) => {
                          const daysLeft = row.daysLeft ?? accessDaysLeft(row.end, mis?.today || todayIst())
                          return (
                            <TableRow key={row.studentId} hover>
                              <TableCell>
                                <Typography variant="body2">{row.name || '—'}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {row.regNo}
                                </Typography>
                              </TableCell>
                              <TableCell>{collegeNames.get(row.collegeId) || row.collegeId}</TableCell>
                              <TableCell>{row.productName}</TableCell>
                              <TableCell>{row.end}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={daysLeft !== null && daysLeft < 0 ? `expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d`}
                                  color={daysLeft !== null && daysLeft <= 30 ? 'warning' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>

              {(mis?.byCollege?.length || 0) > 1 && (
                <Box className="glass-card overflow-hidden">
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontWeight: 600 }}>By college</Typography>
                  </Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>College</TableCell>
                          <TableCell align="right">Students</TableCell>
                          <TableCell align="right">Active</TableCell>
                          <TableCell align="right">Expiring</TableCell>
                          <TableCell align="right">Expired</TableCell>
                          <TableCell align="right">No product</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(mis?.byCollege || []).map((row) => (
                          <TableRow key={row.collegeId} hover>
                            <TableCell>{collegeNames.get(row.collegeId) || row.collegeId}</TableCell>
                            <TableCell align="right">{row.students}</TableCell>
                            <TableCell align="right">{row.active}</TableCell>
                            <TableCell align="right">{row.expiring}</TableCell>
                            <TableCell align="right">{row.expired}</TableCell>
                            <TableCell align="right">{row.unassigned}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}

              <Alert severity="info">
                To move students onto a product (or fix one imported without access), open{' '}
                <strong>Students</strong>, select the rows, and use <strong>Change platform access</strong>.
              </Alert>
            </>
          )}
        </Stack>
      )}

      {dialog.open && (
        <ProductDialog
          open={dialog.open}
          initial={dialog.product}
          onClose={() => setDialog({ open: false, product: null })}
          onSaved={() => refetchProducts()}
        />
      )}

      <Dialog open={Boolean(archiveTarget)} onClose={() => setArchiveTarget(null)}>
        <DialogTitle>{archiveTarget?.active ? 'Archive product?' : 'Restore product?'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {archiveTarget?.active
              ? `"${archiveTarget?.name}" stays on existing students and in the MIS, but can no longer be assigned to new students.`
              : `"${archiveTarget?.name}" becomes assignable again.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => archiveTarget && handleArchiveToggle(archiveTarget)}>
            {archiveTarget?.active ? 'Archive' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
