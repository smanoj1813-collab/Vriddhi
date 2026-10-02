// src/modules/superadmin/pages/PlatformEmployees.tsx
//
// Superadmin screen for Vriddhi platform employees (internal staff who work
// across colleges). The identity must already exist: create it in Access
// Control with the "employee" role first, then assign colleges here. Writes go
// through the assignEmployeeColleges callable, which is the only writer of
// platform_employees/{uid} (Firestore rules deny client writes).
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress, Stack,
  TextField, Typography,
} from '@mui/material'
import { useColleges } from '../hooks/useSuperAdmin'
import { collegeLabel, type CollegeOption } from '@/shared/utils/collegeReference'
import {
  EMPLOYEE_GRANT_LABELS,
  assignEmployee,
  listPlatformEmployees,
  setEmployeeSuspended,
  type EmployeeAssignment,
  type EmployeeGrant,
} from '@/modules/employee/api/employeeApi'

const ALL_GRANTS = Object.keys(EMPLOYEE_GRANT_LABELS) as EmployeeGrant[]

export default function PlatformEmployees() {
  const { data: collegesData, isLoading: collegesLoading } = useColleges()
  const collegeOptions: CollegeOption[] = useMemo(
    () => (collegesData?.items || []).map((c) => ({ id: c.id, name: c.name || '', code: c.code || '' })),
    [collegesData],
  )

  const [employees, setEmployees] = useState<EmployeeAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedColleges, setSelectedColleges] = useState<CollegeOption[]>([])
  const [grants, setGrants] = useState<EmployeeGrant[]>(ALL_GRANTS)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setEmployees(await listPlatformEmployees())
    } catch (err: any) {
      setError(String(err?.message || err || 'Could not load platform employees.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const onAssign = async () => {
    if (!email.trim()) { setError('Enter the employee email.'); return }
    if (selectedColleges.length === 0) { setError('Pick at least one college.'); return }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const employee = await assignEmployee({
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
        collegeIds: selectedColleges.map((college) => college.id),
        grants,
      })
      setNotice(
        `${employee.name} can now work in ${employee.colleges.length} college(s). ` +
        'Their sign-in token was revoked so the new assignment applies on their next sign-in.',
      )
      setEmail('')
      setName('')
      setSelectedColleges([])
      await load()
    } catch (err: any) {
      setError(String(err?.message || err || 'Assignment failed.'))
    } finally {
      setBusy(false)
    }
  }

  const onToggleSuspend = async (employee: EmployeeAssignment) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const suspend = employee.status !== 'suspended'
      await setEmployeeSuspended(employee.uid, suspend)
      setNotice(`${employee.name} is now ${suspend ? 'suspended' : 'active'}.`)
      await load()
    } catch (err: any) {
      setError(String(err?.message || err || 'Status change failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Platform Employees</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Vriddhi staff who work across colleges as academic staff. Create the sign-in identity first in
        <strong> Access Control</strong> with the <strong>employee</strong> role (no college), then assign colleges here.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>Assign colleges</Typography>
          <Stack spacing={2} sx={{ maxWidth: 760 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Employee email"
                size="small"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="Must already exist as an employee account in Auth / users."
              />
              <TextField
                label="Display name (optional)"
                size="small"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Stack>
            <Autocomplete
              multiple
              options={collegeOptions}
              loading={collegesLoading}
              value={selectedColleges}
              getOptionLabel={(option) => collegeLabel(option)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, value) => setSelectedColleges(value)}
              renderInput={(params) => (
                <TextField {...params} label="Assigned colleges" size="small" placeholder="Search by name or code" />
              )}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {ALL_GRANTS.map((grant) => (
                <Chip
                  key={grant}
                  label={EMPLOYEE_GRANT_LABELS[grant]}
                  color={grants.includes(grant) ? 'primary' : 'default'}
                  variant={grants.includes(grant) ? 'filled' : 'outlined'}
                  onClick={() =>
                    setGrants((prev) => (prev.includes(grant) ? prev.filter((g) => g !== grant) : [...prev, grant]))
                  }
                />
              ))}
            </Stack>
            <Box>
              <Button variant="contained" onClick={onAssign} disabled={busy}>
                {busy ? 'Saving…' : 'Assign colleges'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
            Assigned employees{employees.length ? ` (${employees.length})` : ''}
          </Typography>
          {loading ? (
            <CircularProgress size={24} />
          ) : employees.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No platform employees assigned yet.</Typography>
          ) : (
            <Stack spacing={2}>
              {employees.map((employee) => (
                <Card key={employee.uid} variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {employee.name} <Typography component="span" variant="caption" color="text.secondary">{employee.email}</Typography>
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                          {employee.colleges.map((college) => (
                            <Chip
                              key={college.id}
                              size="small"
                              label={`${college.name} (${college.code})`}
                              color={college.id === employee.activeCollegeId ? 'primary' : 'default'}
                              variant={college.id === employee.activeCollegeId ? 'filled' : 'outlined'}
                            />
                          ))}
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                          {employee.grants.map((grant) => (
                            <Chip key={grant} size="small" variant="outlined" label={EMPLOYEE_GRANT_LABELS[grant] || grant} />
                          ))}
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Chip
                          size="small"
                          label={employee.status === 'suspended' ? 'Suspended' : 'Active'}
                          color={employee.status === 'suspended' ? 'error' : 'success'}
                        />
                        <Button size="small" variant="outlined" disabled={busy} onClick={() => void onToggleSuspend(employee)}>
                          {employee.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
