import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { Save as SaveIcon, Terminal as TerminalIcon } from '@mui/icons-material'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useColleges } from '@/modules/superadmin/hooks/useSuperAdmin'
import {
  fetchCollegeCodingLabAccess,
  saveCollegeCodingLabAccess,
} from '@/shared/services/codingLabAccessService'

export default function CodingLabCollegeAssignment() {
  const { user } = useAuth()
  const { data, isLoading: collegesLoading, error: collegesError } = useColleges({ status: 'all', limit: 200 })
  const colleges = data?.items ?? []

  const [collegeId, setCollegeId] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [savedEnabled, setSavedEnabled] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    setError('')
    setNotice('')
    setEnabled(false)
    setSavedEnabled(false)

    if (!collegeId) {
      setSettingsLoading(false)
      return () => { active = false }
    }

    setSettingsLoading(true)
    fetchCollegeCodingLabAccess(collegeId)
      .then((assigned) => {
        if (!active) return
        setEnabled(assigned)
        setSavedEnabled(assigned)
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Could not load this college assignment.')
      })
      .finally(() => {
        if (active) setSettingsLoading(false)
      })

    return () => { active = false }
  }, [collegeId])

  const selectedCollege = colleges.find((college) => college.id === collegeId)

  const handleSave = async () => {
    if (!collegeId || !user?.uid || saving || enabled === savedEnabled) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await saveCollegeCodingLabAccess(collegeId, enabled, user.uid)
      setSavedEnabled(enabled)
      setNotice(`${selectedCollege?.name || 'College'} Coding Lab access ${enabled ? 'enabled' : 'disabled'}.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the college assignment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
              <TerminalIcon color="primary" /> BCA Coding Lab — college assignment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enable the compiler for selected colleges. The lab remains restricted to students whose linked programme is BCA, and the run service checks both conditions.
            </Typography>
          </Box>

          {collegesError && <Alert severity="error">Could not load colleges: {collegesError.message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          {notice && <Alert severity="success">{notice}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <FormControl size="small" fullWidth sx={{ maxWidth: 560 }} disabled={collegesLoading || colleges.length === 0}>
              <InputLabel id="coding-lab-college-label">College</InputLabel>
              <Select
                labelId="coding-lab-college-label"
                value={collegeId}
                label="College"
                onChange={(event) => setCollegeId(event.target.value)}
              >
                <MenuItem value=""><em>Select a college</em></MenuItem>
                {colleges.map((college) => (
                  <MenuItem key={college.id} value={college.id}>
                    {college.name}{college.code ? ` (${college.code})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {collegesLoading && <CircularProgress size={22} />}
          </Stack>

          {collegeId && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
              <FormControlLabel
                control={(
                  <Switch
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                    disabled={settingsLoading || saving}
                    color="success"
                  />
                )}
                label={settingsLoading ? 'Loading assignment…' : enabled ? 'Coding Lab assigned' : 'Coding Lab not assigned'}
              />
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={() => void handleSave()}
                disabled={settingsLoading || saving || enabled === savedEnabled || !user?.uid}
              >
                {saving ? 'Saving…' : 'Save assignment'}
              </Button>
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary">
            New colleges default to unassigned. Turning access off immediately removes the Coding Lab from student navigation and blocks code runs.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
