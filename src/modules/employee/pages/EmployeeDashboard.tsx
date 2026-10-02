// src/modules/employee/pages/EmployeeDashboard.tsx
//
// Landing screen for a Vriddhi platform employee. Two jobs:
//   1. make the active college explicit and switchable (the switch re-mints the
//      collegeId claim, which is what every college-scoped rule reads), and
//   2. hand out the academic workspace (schedule / curriculum / assessments /
//      question papers / reports / grading) for that college.
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, MenuItem,
  Stack, TextField, Typography,
} from '@mui/material'
import { getAuth } from 'firebase/auth'
import {
  EMPLOYEE_GRANT_LABELS,
  getMyEmployeeAccess,
  setActiveCollege,
  type EmployeeAssignment,
} from '../api/employeeApi'

/** Quick links into the curated academic workspace (all /admin academic pages). */
const WORKSPACE: Array<{ label: string; path: string; grant?: EmployeeAssignment['grants'][number] }> = [
  { label: 'Class schedule', path: '/admin/class-schedule', grant: 'schedule' },
  { label: 'Curriculum', path: '/admin/curriculum', grant: 'curriculum' },
  { label: 'Curriculum progress', path: '/admin/curriculum-progress', grant: 'curriculum' },
  { label: 'Assessments', path: '/admin/assessments', grant: 'assessments' },
  { label: 'Schedule a test', path: '/admin/schedule-tests', grant: 'assessments' },
  { label: 'Question bank', path: '/admin/question-bank', grant: 'papers' },
  { label: 'Question generator', path: '/admin/ai-questions', grant: 'papers' },
  { label: 'Paper generator', path: '/admin/paper-generator', grant: 'papers' },
  { label: 'Test reports', path: '/admin/test-reports', grant: 'reports' },
  { label: 'Grade records → HOD approval', path: '/admin/grade-records', grant: 'grading' },
  { label: 'My weekly schedule (faculty mode)', path: '/faculty/schedule' },
  { label: 'My curriculum (faculty mode)', path: '/faculty/curriculum' },
]

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<EmployeeAssignment | null>(null)
  const [superadmin, setSuperadmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [switching, setSwitching] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { employee, superadmin: isSuperadmin } = await getMyEmployeeAccess()
      setAssignment(employee)
      setSuperadmin(isSuperadmin)
      setSelectedCollege(employee?.activeCollegeId || employee?.collegeIds?.[0] || '')
    } catch (err: any) {
      setError(String(err?.message || err || 'Could not load your employee assignment.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const activeCollege = assignment?.colleges.find((c) => c.id === assignment.activeCollegeId) || null

  const onSwitch = async () => {
    if (!selectedCollege || selectedCollege === assignment?.activeCollegeId) return
    setSwitching(true)
    setError('')
    try {
      await setActiveCollege(selectedCollege)
      // The switch mints new claims (College ID + status). Force a token
      // refresh, then reload so every page re-reads its college scope instead
      // of keeping data fetched under the previous college.
      const current = getAuth().currentUser
      if (current) await current.getIdToken(true)
      window.location.reload()
    } catch (err: any) {
      setError(String(err?.message || err || 'Could not switch college.'))
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        Vriddhi Employee Workspace
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Platform employee access — academic work across every assigned college. Marks you record are submitted to
        that college&apos;s HOD for approval.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!assignment && (
        <Alert severity="info">
          {superadmin
            ? 'You are a superadmin — you already have platform-wide access, so no employee assignment is needed.'
            : 'No colleges have been assigned to this account yet. Ask a platform superadmin to open Superadmin → Platform Employees and assign your colleges.'}
        </Alert>
      )}

      {assignment && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Active college</Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                {activeCollege ? `${activeCollege.name} (${activeCollege.code})` : 'No active college selected'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                <TextField
                  select
                  size="small"
                  label="Work in college"
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  sx={{ minWidth: 320 }}
                  helperText="Switching re-issues your access token for that college."
                >
                  {assignment.colleges.map((college) => (
                    <MenuItem key={college.id} value={college.id}>
                      {college.name} ({college.code})
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  onClick={onSwitch}
                  disabled={switching || !selectedCollege || selectedCollege === assignment.activeCollegeId}
                >
                  {switching ? 'Switching…' : 'Switch college'}
                </Button>
                <Chip
                  label={assignment.status === 'active' ? 'Assignment active' : 'Suspended'}
                  color={assignment.status === 'active' ? 'success' : 'error'}
                  size="small"
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                {assignment.grants.map((grant) => (
                  <Chip key={grant} label={EMPLOYEE_GRANT_LABELS[grant] || grant} size="small" variant="outlined" />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assigned colleges ({assignment.colleges.length})
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {assignment.colleges.map((college) => (
                  <Chip
                    key={college.id}
                    label={`${college.name} (${college.code})`}
                    color={college.id === assignment.activeCollegeId ? 'primary' : 'default'}
                    size="small"
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>Academic workspace</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {WORKSPACE.filter((item) => !item.grant || assignment.grants.includes(item.grant)).map((item) => (
                  <Button key={item.path} size="small" variant="outlined" onClick={() => navigate(item.path)}>
                    {item.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
