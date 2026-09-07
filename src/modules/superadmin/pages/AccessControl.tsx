import React, { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { AdminPanelSettings, Build, Search, VerifiedUser } from '@mui/icons-material'
import CredentialsTable from '../components/CredentialsTable'
import { runIdentityRepair, type RepairInput, type RepairResult } from '../api/identityApi'
import { useColleges } from '../hooks/useSuperAdmin'
import { functions } from '@/Firebase/config'

/**
 * Sentinel for "no college filter". MUI's Select treats an empty string as *no
 * value* and renders the control blank, so an `''` option reads as an unloaded
 * dropdown — which is exactly what the operator saw.
 */
const ALL_COLLEGES = '*'

/** Which Firestore profile collections one pass should walk. */
const REPAIR_SCOPES: Record<'all' | 'students' | 'faculty' | 'staff', RepairInput['collections']> = {
  all: undefined,
  students: ['students'],
  faculty: ['faculty'],
  staff: ['admins', 'hods', 'mentors', 'superadmins'],
}

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
  // Identity repair: reconciles Firestore profiles with Firebase Authentication.
  const [repairCollege, setRepairCollege] = useState(ALL_COLLEGES)
  const [repairDryRun, setRepairDryRun] = useState(true)
  // Scope controls. A full sweep of six collections across every college is a few
  // thousand Auth/Firestore round trips and can exceed the function's wall clock,
  // so the operator has to be able to narrow it — not just retry it.
  const [repairCollections, setRepairCollections] = useState<'all' | 'students' | 'faculty' | 'staff'>('all')
  const [repairLimit, setRepairLimit] = useState('500')
  const [repairBudget, setRepairBudget] = useState('420')
  const { data: collegesData } = useColleges()
  const collegeOptions = collegesData?.items || []
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null)
  const [repairBusy, setRepairBusy] = useState(false)

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
  const runRepair = async (dryRun: boolean) => {
    if (!dryRun && !window.confirm('Apply the repair? This creates missing Auth accounts, re-issues claims and deletes plaintext password fields from profile documents. Users must sign out and back in afterwards.')) return
    setRepairBusy(true); setMessage(null); setRepairResult(null)
    try {
      const data = await runIdentityRepair({
        dryRun,
        collegeId: repairCollege === ALL_COLLEGES ? undefined : repairCollege,
        collections: REPAIR_SCOPES[repairCollections],
        limit: Math.min(Math.max(Number(repairLimit) || 500, 1), 2000),
        budgetSeconds: Math.min(Math.max(Number(repairBudget) || 420, 30), 480),
        deliveryMode: 'reset-email',
        continueUrl: window.location.origin + '/login',
      })
      setRepairResult(data)
      setMessage({ type: data.errors?.length ? 'error' : 'success', text: data.message })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Unable to run identity repair' })
    } finally { setRepairBusy(false) }
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
    <Card sx={{ mb: 3 }}><CardContent>
      <Typography variant="h6" gutterBottom>Identity repair — Firestore ↔ Firebase Authentication</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Finds profiles that have no Auth account (so the person cannot sign in at all), accounts with no role
        claim (so every page reads “Missing or insufficient permissions”), missing users/{'{uid}'} lookup
        documents, disabled accounts, and legacy plaintext password fields. Preview it first; applying also
        issues password-reset links for any account it had to create.
      </Typography>
      {/* A four-field grid, deliberately: these inputs have long labels and
          helper text, and a wrapping flex row squeezes them into 150 px columns
          where "Time budget (s)" renders as "Time..." and 420 as "42". */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
        <TextField select fullWidth label="College" value={repairCollege} onChange={e => setRepairCollege(e.target.value)}
          helperText={collegeOptions.length
            ? `${collegeOptions.length} college${collegeOptions.length === 1 ? '' : 's'} — one per pass is how you cover a large tenant safely`
            : 'No colleges loaded yet — this pass will cover every college'}>
          <MenuItem value={ALL_COLLEGES}>All colleges</MenuItem>
          {collegeOptions.map(c => <MenuItem key={c.id} value={c.id}>{c.name || c.id}</MenuItem>)}
        </TextField>
        <TextField select fullWidth label="Scope" value={repairCollections} onChange={e => setRepairCollections(e.target.value as any)}
          helperText="Which profile collections the pass walks">
          <MenuItem value="all">All profile collections</MenuItem>
          <MenuItem value="students">Students only</MenuItem>
          <MenuItem value="faculty">Faculty only</MenuItem>
          <MenuItem value="staff">Admins / HODs / mentors / superadmins</MenuItem>
        </TextField>
        <TextField fullWidth label="Docs per collection" type="number" value={repairLimit} onChange={e => setRepairLimit(e.target.value)}
          helperText="1–2000 per collection" />
        <TextField fullWidth label="Time budget (seconds)" type="number" value={repairBudget} onChange={e => setRepairBudget(e.target.value)}
          helperText="30–480. A pass that runs out stops and reports itself partial" />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Button variant="outlined" disabled={repairBusy || !repairDryRun} startIcon={repairBusy ? <CircularProgress size={18} /> : <Search />} onClick={() => runRepair(true)}>Preview</Button>
        <Button variant="contained" color="warning" disabled={repairBusy || repairDryRun} startIcon={<Build />} onClick={() => runRepair(false)}>Apply repair</Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={repairDryRun} onChange={e => setRepairDryRun(e.target.checked)} />
          <Typography variant="body2">Dry run only</Typography>
        </label>
        <Typography variant="caption" color="text.secondary">
          {repairCollege === ALL_COLLEGES ? 'every college' : 'one college'} · {repairCollections === 'all' ? '6 collections' : repairCollections} · up to {Math.min(Math.max(Number(repairLimit) || 500, 1), 2000)} docs each · {Math.min(Math.max(Number(repairBudget) || 420, 30), 480)}s budget
        </Typography>
      </Stack>
      {repairResult && <Box sx={{ mt: 3 }}>
        {repairResult.reverseSweepNote ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Auth-directory sweep: {repairResult.reverseSweepNote}.
          </Typography>
        ) : null}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`scanned ${repairResult.scanned}`} />
          <Chip label={`needs repair ${repairResult.broken}`} color={repairResult.broken ? 'warning' : 'default'} />
          <Chip label={`repaired ${repairResult.repaired}`} color={repairResult.repaired ? 'success' : 'default'} />
          <Chip label={`Auth accounts created ${repairResult.authCreated}`} />
          <Chip label={`claims issued ${repairResult.claimsIssued}`} />
          <Chip label={`users docs created ${repairResult.usersDocsCreated}`} />
          <Chip label={`lookup links written ${repairResult.usersDocsLinked}`} color={repairResult.usersDocsLinked ? 'success' : 'default'} />
          {/* A dry run deletes nothing, so counting only deletions made "0" look
              like "no plaintext passwords anywhere" when the finding was sitting in
              the list below it. Report what was *found*; the deleted count only
              means anything after Apply. */}
          {repairResult.dryRun
            ? <Chip label={`plaintext password fields found ${repairResult.counts?.PLAINTEXT_SECRET || 0}`} color={repairResult.counts?.PLAINTEXT_SECRET ? 'error' : 'default'} />
            : <Chip label={`plaintext passwords deleted ${repairResult.secretsStripped}`} color={repairResult.secretsStripped ? 'error' : 'default'} />}
          {repairResult.counts ? Object.entries(repairResult.counts)
            .filter(([, n]) => n > 0)
            .map(([finding, n]) => (
              <Chip key={finding} size="small" variant="outlined" label={`${finding} × ${n}`}
                color={finding === 'PLAINTEXT_SECRET' || finding === 'MISSING_AUTH' || finding === 'ACCOUNT_DISABLED' ? 'error' : 'default'} />
            )) : null}
          {repairResult.itemsTruncated && <Chip label="list truncated — re-run per collection" color="warning" />}
          {repairResult.partial && <Chip label={`partial pass — stopped after ${repairResult.stoppedAfter || 'the last collection'}`} color="warning" />}
          {repairResult.elapsedMs ? <Chip label={`${Math.round(repairResult.elapsedMs / 1000)}s of ${Math.round((repairResult.budgetMs || 0) / 1000)}s budget`} /> : null}
        </Stack>
        {repairResult.orphanAccounts?.length ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {repairResult.orphanAccountsTotal} Auth account{repairResult.orphanAccountsTotal === 1 ? '' : 's'} can sign in but own
              {repairResult.orphanAccountsTotal === 1 ? 's no profile document' : ' no profile documents'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This is what an import looks like when the Authentication half succeeded and the Firestore
              half was refused: the login works, and then nothing resolves. These are not fixed by giving
              them a password — they need the profile side, or a role to rebuild from.
            </Typography>
            {repairResult.orphanAccounts.map(o => (
              <Typography key={o.uid} variant="body2" component="div" sx={{ mb: 0.5 }}>
                <strong>{o.email || o.uid}</strong> — {o.role ? `claim says ${o.role}` : 'no role claim'}
                {o.collegeId ? ` · college ${o.collegeId}` : ''} · {o.action}
                {o.resolved ? ' ✓' : ''}
              </Typography>
            ))}
            {(repairResult.orphanAccountsTotal || 0) > repairResult.orphanAccounts.length ? (
              <Typography variant="caption">first {repairResult.orphanAccounts.length} of {repairResult.orphanAccountsTotal} shown</Typography>
            ) : null}
          </Alert>
        ) : null}
        {repairResult.strippedAccounts?.length ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {repairResult.strippedAccountsTotal} account{repairResult.strippedAccountsTotal === 1 ? '' : 's'} carried a college role
              that no profile document backs
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {repairResult.dryRun
                ? 'Applying will revoke these role claims (and sign those accounts out). With claim-based rules a claim is access, so an unbacked claim is either damage from the old link order or somebody forging their own profile.'
                : 'These claims have been revoked and their tokens invalidated. The people keep their accounts — they simply stop being staff until a profile document vouches for them.'}
            </Typography>
            {repairResult.strippedAccounts.map(a => (
              <Typography key={a.uid} variant="body2" component="div">
                <strong>{a.email || a.uid}</strong> — claimed {a.role} · uid {a.uid}
              </Typography>
            ))}
          </Alert>
        ) : null}
        {repairResult.claimsStrippedOnScanTruncated ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Claim reclaim was skipped: a collection hit the per-document limit, so this pass did not see every
            profile and could not tell unbacked claims from unscanned ones. Raise “Docs per collection” to
            cover the tenant before applying.
          </Alert>
        ) : null}
        {repairResult.uidEmailMismatches ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {repairResult.uidEmailMismatches} {repairResult.uidEmailMismatches === 1 ? 'row was' : 'rows were'} refused:
            their profile email and their stored uid name different people. Nothing was written on either account,
            because inventing that link is how someone ends up with another college&rsquo;s access — or loses their own
            password. Each one needs a human to decide which side is wrong.
          </Alert>
        ) : null}
        {repairResult.operatorAffected ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            This pass included your own identity document. Applying revokes your refresh tokens, so
            the next request you make will sign you out — that is the mechanism working, not a
            regression. Sign back in before deciding whether the repair behaved.
          </Alert>
        ) : null}
        {repairResult.secretsResetIssued ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {repairResult.secretsResetIssued} {repairResult.secretsResetIssued === 1 ? 'account was' : 'accounts were'} carrying their
            password as a plaintext field on the profile document — the thing you have been reading out of the
            Firestore console. That field is gone now, so {'those people'} cannot sign in with what they know. Hand out the
            link{repairResult.secretsResetIssued === 1 ? '' : 's'} below (or use “send reset link”) before telling them to try again.
          </Alert>
        ) : null}
        {repairResult.credentials?.length ? <Box sx={{ mb: 2 }}>
          <CredentialsTable
            rows={repairResult.credentials.map(c => ({ email: c.email, password: c.password, resetLink: c.resetLink, status: 'created' as const }))}
            filename="identity-repair-credentials"
            title={repairResult.secretsResetIssued
              ? 'Credentials from this repair (shown once) — including accounts whose plaintext password was deleted'
              : "Credentials created by this repair (shown once)"}
          />
        </Box> : null}
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2, maxHeight: 320, overflow: 'auto' }}>
          {repairResult.items.length === 0 ? <Typography variant="body2">No identities need repair in this scope.</Typography> : repairResult.items.map((item, index) => (
            <Typography key={`${item.collection}-${item.docId}-${index}`} variant="body2" sx={{ mb: 1 }}>
              <strong>{item.collection}/{item.docId}</strong> — {item.email || 'no email'} · {item.findings.join(', ')}
              {item.actions?.length ? <em> → {item.actions.join('; ')}</em> : null}
              {item.error ? <span style={{ color: 'crimson' }}> · {item.error}</span> : null}
            </Typography>
          ))}
        </Box>
      </Box>}
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
