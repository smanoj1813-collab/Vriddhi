// src/modules/admin/pages/GuestFacultyBilling.tsx
// Guest Faculty Billing (G5) — Karnataka degree colleges staff 30–50% of
// sections with guest/P&T teachers paid PER PERIOD, and their pay sheet is
// today a hand-counted register. This page derives the sheet from the actual
// weekly timetable: for a chosen month it counts how many scheduled periods
// each guest actually lands (per-weekday occurrences in that month) and
// multiplies by the contract's per-period rate.
//
// Sources: `faculty` (employmentType ≠ FULL_TIME + guestContract.periodRate)
// × `weeklySchedules` (the live timetable). Fully derived — nothing to
// double-enter; when the timetable changes, next month's bill changes.

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Alert, Box, Button, Card, CardContent, Chip, Stack, TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Download as DownloadIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  CurrencyRupee as MoneyIcon,
  Schedule as ScheduleIcon2,
} from '@mui/icons-material';
import { db } from '@/Firebase/config';
import { fetchWeeklySchedules } from '../api/scheduleApi';
import type { DayOfWeek, WeeklyClassSchedule } from '../types/schedule';

// ─── Types & pure helpers (kept dependency-free for testability) ─────────────

interface GuestFacultyDoc {
  profileId: string;
  uid: string;
  staffCode: string;
  name: string;
  department: string;
  employmentType: string;
  guestContract?: { startDate?: string; endDate?: string | null; periodRate?: number; notes?: string } | null;
}

const DAY_INDEX: Record<DayOfWeek, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

/** Number of `dayOfWeek` occurrences inside month `yyyy-MM` (exact, calendar-safe). */
export function countWeekdayInMonth(monthKey: string, dayOfWeek: DayOfWeek): number {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return 0;
  const want = DAY_INDEX[dayOfWeek];
  const daysInMonth = new Date(y, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(y, m - 1, d).getDay() === want) count++;
  }
  return count;
}

interface BillingRow {
  name: string;
  staffCode: string;
  department: string;
  employmentType: string;
  periodRate: number;
  hoursPerWeek: number;
  periodsInMonth: number;
  amount: number;
  contract: string;
  expired: boolean;
}

export function buildBillingRows(
  guests: GuestFacultyDoc[],
  schedules: WeeklyClassSchedule[],
  monthKey: string,
): BillingRow[] {
  const today = new Date().toISOString().slice(0, 10);
  return guests.map((g) => {
    const aliases = new Set([g.uid, g.profileId, g.staffCode].filter(Boolean).map((s) => s.toLowerCase()));
    const mine = schedules.filter(
      (s) => s.isActive !== false && aliases.has(String(s.facultyId || '').toLowerCase()),
    );

    let hoursPerWeek = 0;
    let periodsInMonth = 0;
    for (const s of mine) {
      hoursPerWeek++;
      periodsInMonth += countWeekdayInMonth(monthKey, s.dayOfWeek);
    }

    const rate = g.guestContract?.periodRate ?? 0;
    const end = g.guestContract?.endDate ?? null;
    const expired = !!end && end < today;
    return {
      name: g.name,
      staffCode: g.staffCode,
      department: g.department,
      employmentType: g.employmentType,
      periodRate: rate,
      hoursPerWeek,
      periodsInMonth,
      amount: periodsInMonth * rate,
      contract: `${g.guestContract?.startDate || '—'} → ${end || 'ongoing'}`,
      expired,
    };
  }).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

export function billingRowsToCsv(rows: BillingRow[], monthKey: string): string {
  const header = 'Name,Staff Code,Department,Employment,Rate/Period,Periods/Week,Periods in Month,Amount (INR),Contract';
  const lines = rows.map((r) =>
    [
      `"${r.name.replace(/"/g, '""')}"`,
      r.staffCode,
      `"${r.department.replace(/"/g, '""')}"`,
      r.employmentType,
      r.periodRate,
      r.hoursPerWeek,
      r.periodsInMonth,
      r.amount,
      `"${r.contract}"`,
    ].join(','),
  );
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return [`Guest faculty billing — ${monthKey}`, header, ...lines, `,,,,,,TOTAL,${total},`].join('\n');
}

// ─── Data loading ────────────────────────────────────────────────────────────

function currentCollegeId(): string {
  return localStorage.getItem('vriddhi_college_id') || '';
}

async function fetchGuestFaculty(collegeId: string): Promise<GuestFacultyDoc[]> {
  const snap = await getDocs(query(collection(db, 'faculty'), where('collegeId', '==', collegeId)));
  const out: GuestFacultyDoc[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    if (String(data.status ?? 'active') === 'inactive') continue;
    const employmentType = String(data.employmentType ?? 'FULL_TIME').trim() || 'FULL_TIME';
    if (employmentType === 'FULL_TIME') continue;
    out.push({
      profileId: d.id,
      uid: String(data.uid ?? ''),
      staffCode: String(data.facultyId ?? ''),
      name:
        String(data.name ?? '').trim() ||
        `${String(data.firstName ?? '').trim()} ${String(data.lastName ?? '').trim()}`.trim() ||
        d.id,
      department: String(data.department ?? ''),
      employmentType,
      guestContract: (data.guestContract as GuestFacultyDoc['guestContract']) ?? null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GuestFacultyBilling() {
  const collegeId = currentCollegeId();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const guestsQuery = useQuery({
    queryKey: ['guestFaculty', collegeId],
    queryFn: () => fetchGuestFaculty(collegeId),
    enabled: !!collegeId,
  });
  const schedulesQuery = useQuery({
    queryKey: ['weeklySchedules', 'admin', collegeId],
    queryFn: () => fetchWeeklySchedules(collegeId),
    enabled: !!collegeId,
  });

  const rows = useMemo(
    () => buildBillingRows(guestsQuery.data ?? [], schedulesQuery.data ?? [], month),
    [guestsQuery.data, schedulesQuery.data, month],
  );

  const totals = useMemo(
    () => ({
      guests: rows.length,
      scheduled: rows.filter((r) => r.hoursPerWeek > 0).length,
      periods: rows.reduce((s, r) => s + r.periodsInMonth, 0),
      amount: rows.reduce((s, r) => s + r.amount, 0),
      missingRate: rows.filter((r) => r.hoursPerWeek > 0 && r.periodRate <= 0).length,
    }),
    [rows],
  );

  const downloadCsv = () => {
    const blob = new Blob([billingRowsToCsv(rows, month)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-faculty-billing-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Guest Faculty Billing</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
            Period-wise pay sheet for guest / part-time / visiting faculty, derived from the live
            weekly timetable × each teacher's per-period contract rate.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            label="Month"
            type="month"
            size="small"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Guest faculty', value: totals.guests, icon: <PeopleIcon color="primary" /> },
          { label: 'On the timetable', value: totals.scheduled, icon: <ScheduleIcon2 color="action" /> },
          { label: `Periods in ${month}`, value: totals.periods, icon: <InfoIcon color="action" /> },
          { label: 'Total payable', value: `₹ ${totals.amount.toLocaleString('en-IN')}`, icon: <MoneyIcon color="success" /> },
        ].map((c) => (
          <Grid key={c.label} size={{ xs: 6, md: 3 }}>
            <Card variant="outlined"><CardContent>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                {c.icon}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{c.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                </Box>
              </Stack>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      {totals.missingRate > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {totals.missingRate} scheduled guest {totals.missingRate === 1 ? 'teacher has' : 'teachers have'} no per-period
          rate set — their rows show ₹0. Set the rate on the faculty profile (SuperAdmin → Faculty → Edit → Guest contract).
        </Alert>
      )}

      {rows.length === 0 ? (
        <Alert severity="info" icon={<InfoIcon />}>
          No guest faculty found in this college. Mark teachers as Part-time / Adjunct / Visiting (employment type)
          and set their contract rate — they then appear here automatically, and the auto curriculum-mapper
          treats them with guest capacity and full-time preference.
        </Alert>
      ) : (
        <Card variant="outlined">
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(128,128,128,0.3)' }}>
                  {['Faculty', 'Dept', 'Type', 'Rate / period', 'Periods / week', `Periods in ${month}`, 'Amount', 'Contract'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(128,128,128,0.15)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                      {r.name}
                      {r.expired && <Chip size="small" color="error" label="contract expired" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{r.department || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{r.employmentType.replace('_', ' ')}</td>
                    <td style={{ padding: '10px 12px' }}>₹ {r.periodRate.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px' }}>{r.hoursPerWeek}</td>
                    <td style={{ padding: '10px 12px' }}>{r.periodsInMonth}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>₹ {r.amount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.contract}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td style={{ padding: '10px 12px' }} colSpan={6}>Total — {month}</td>
                  <td style={{ padding: '10px 12px' }}>₹ {totals.amount.toLocaleString('en-IN')}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </Box>
        </Card>
      )}
    </Box>
  );
}
