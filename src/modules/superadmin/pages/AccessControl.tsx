import React, { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { AdminPanelSettings, Search, VerifiedUser } from '@mui/icons-material'
import { functions } from '@/Firebase/config'

type Role = 'superadmin' | 'admin' | 'principal' | 'hod' | 'mentor' | 'faculty' | 'student' | 'parent'
const roles: Role[] = ['superadmin', 'admin', 'principal', 'hod', 'mentor', 'faculty', 'student', 'parent']
const grant = httpsCallable<Record<string, string>, any>(functions, 'grantUserRole')
const diagnose = httpsCallable<{ email: string }, any>(functions, 'diagnoseIdentity')
const syncClaims = httpsCallable<Record<string, never>, { scanned: number; updated: number; skipped: number; errors: string[] }>(functions, 'syncIdentityClaims')

export default function AccessControl() {
  const [form, setForm] = useState({ email: '', name: '', role: 'superadmin' as Role, collegeId: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [auditEmail, setAuditEmail] = useState('')
  const [audit, setAudit] = useState<any>(null)

  const change = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: event.target.value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null)
    try {
      const result = await grant(form)
      const data = result.data
      setMessage({ type: 'success', text: data.created ? `Account created. Temporary password: ${data.temporaryPassword || 'the supplied password'}` : 'Identity granted and wired to all profile systems. The user must sign out and sign in again to refresh claims.' })
      setForm(prev => ({ ...prev, email: '', name: '', password: '' }))
    } catch (error: any) { setMessage({ type: 'error', text: error?.message || 'Unable to grant identity' }) }
    finally { setBusy(false) }
  }
  const runAudit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null)
    try { setAudit((await diagnose({ email: auditEmail })).data) }
    catch (error: any) { setMessage({ type: 'error', text: error?.message || 'Unable to diagnose identity' }) }
    finally { setBusy(false) }
  }
  const runSyncClaims = async () => {
    if (!window.confirm('Backfill role/college claims for all existing accounts that have none? Run once after deploying the claim-based rules.')) return
    setBusy(true); setMessage(null)
    try {
      const data = (await syncClaims({})).data
      setMessage({ type: 'success', text: `Claims backfilled — scanned ${data.scanned}, updated ${data.updated}, skipped ${data.skipped}.${data.errors?.length ? ` Errors: ${data.errors.join('; ')}` : ''}` })
    }
    catch (error: any) { setMessage({ type: 'error', text: error?.message || 'Unable to backfill claims' }) }
    finally { setBusy(false) }
  }
  return <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 } }}>
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1 }}><AdminPanelSettings color="primary" fontSize="large" /><Typography variant="h4" sx={{ fontWeight: 700 }}>Access Control</Typography></Stack>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Create, grant, repair, or audit a user identity. Grants update Auth claims and every relevant Firestore profile in one audited operation.</Typography>
    {message && <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>{message.text}</Alert>}
    <Card sx={{ mb: 3 }}><CardContent><Typography variant="h6" gutterBottom>Grant or create an account</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>For a new superadmin, enter an email, name, and optional password. Existing Auth accounts keep their current password.</Typography>
      <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <TextField label="Email" type="email" required value={form.email} onChange={change('email')} />
        <TextField label="Display name" value={form.name} onChange={change('name')} helperText="Required when creating a new Auth account" />
        <TextField select label="Role" value={form.role} onChange={change('role')}>{roles.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField>
        <TextField label="College ID" value={form.collegeId} onChange={change('collegeId')} helperText={form.role === 'superadmin' ? 'Optional for superadmins' : 'Required for this role'} />
        <TextField label="Password for a new account" type="password" value={form.password} onChange={change('password')} helperText="Optional; minimum 10 characters" />
        <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={18} /> : <VerifiedUser />} sx={{ alignSelf: 'center' }}>Grant identity</Button>
      </Box>
    </CardContent></Card>
    <Card><CardContent><Typography variant="h6" gutterBottom>Identity audit</Typography><Box component="form" onSubmit={runAudit} sx={{ display: 'flex', gap: 2, mb: 2 }}><TextField fullWidth label="Account email" type="email" required value={auditEmail} onChange={e => setAuditEmail(e.target.value)} /><Button type="submit" variant="outlined" disabled={busy} startIcon={<Search />}>Audit</Button></Box>
      {audit && <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2, overflow: 'auto' }}><Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}><Chip label={audit.uid ? `UID ${audit.uid}` : 'No Auth account'} color={audit.uid ? 'success' : 'error'} />{(audit.issues || []).map((issue: string) => <Chip key={issue} label={issue} color="warning" />)}</Stack><pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(audit, null, 2)}</pre></Box>}
    </CardContent></Card>
    <Card sx={{ mt: 3 }}><CardContent>
      <Typography variant="h6" gutterBottom>Backfill identity claims (one-time migration)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>After deploying the claim-based security rules, accounts created before this release have no role/college claims and would be treated as unprivileged. Run this once to stamp claims from their existing profile documents. It never overwrites an existing claim.</Typography>
      <Button variant="contained" color="secondary" disabled={busy} startIcon={busy ? <CircularProgress size={18} /> : <VerifiedUser />} onClick={runSyncClaims}>Backfill claims</Button>
    </CardContent></Card>
  </Box>
}
