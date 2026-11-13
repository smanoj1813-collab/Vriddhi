import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCollegeSchemePack } from '../api/schemePackApi';
import { resolveSchemeCourse } from '@/shared/utils/schemeEngine';
import { deriveOfficialGrade } from '../../../../functions/src/academic/gradePolicy';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/data';
import { useAuth } from '../../auth/context/AuthContext';
import DrillDown, { type DrillGroup, type DrillLevelSpec } from '@/shared/components/DrillDown';

interface StudentOption {
  id: string;
  name: string;
  regNo: string;
  /** Cohort fields — the drill keys (department = programme). */
  department: string;
  programme: string;
  batch: string;
}

interface GradeRecord {
  id: string;
  collegeId: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  semester: number;
  subject: string;
  code: string;
  credits?: number;
  internal?: number;
  external?: number;
  total?: number;
  grade: string;
  gradePoint?: number;
  schemePackId?: string;
  schemePackRevision?: number;
  result?: string;
  status: 'draft' | 'published';
  updatedAt: string;
  publishedAt?: string;
}

interface GradeForm {
  semester: string;
  subject: string;
  code: string;
  credits: string;
  internal: string;
  external: string;
  total: string;
  grade: string;
  gradePoint: string;
  result: string;
}

const EMPTY_FORM: GradeForm = {
  semester: '',
  subject: '',
  code: '',
  credits: '',
  internal: '',
  external: '',
  total: '',
  grade: '',
  gradePoint: '',
  result: '',
};

function optionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

export default function GradeRecords() {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  // A platform employee grades inside the active college and leaves DRAFTS;
  // publishing official grades is the institution's approval step, so the
  // button stays with the college even though the page is shared.
  const canPublish = user?.role !== 'employee';
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [records, setRecords] = useState<GradeRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [form, setForm] = useState<GradeForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useComponents, setUseComponents] = useState(false);
  const [componentMarks, setComponentMarks] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!collegeId) return;
    try {
      setLoading(true);
      setError(null);
      const [studentSnapshot, recordResponse] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(500))),
        httpsCallable<
          { collegeId: string },
          { records: GradeRecord[] }
        >(functions, 'listManagedGradeRecords')({ collegeId }),
      ]);
      setStudents(studentSnapshot.docs.map((student) => {
        const data = student.data();
        return {
          id: student.id,
          name: String(data.name || 'Unnamed student'),
          regNo: String(data.regNo || data.registrationNumber || ''),
          department: String(data.department || data.branch || ''),
          programme: String(data.course || data.programme || data.program || data.department || data.branch || ''),
          batch: String(data.batch || data.academicYear || ''),
        };
      }).sort((left, right) => left.name.localeCompare(right.name)));
      setRecords(recordResponse.data.records);
      setSelectedDrafts((current) => new Set(
        [...current].filter((id) => recordResponse.data.records.some((record) => record.id === id && record.status === 'draft'))
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grade records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => { void load(); }, [load]);

  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  // The drill's programme level joins the student's department (records carry
  // no branch of their own).
  type EnrichedRecord = GradeRecord & { programme: string; batch: string };
  const enriched: EnrichedRecord[] = useMemo(
    () => records.map((record) => ({
      ...record,
      programme: studentById.get(record.studentId)?.department || 'Unassigned',
      batch: studentById.get(record.studentId)?.batch || '',
    })),
    [records, studentById]
  );

  const drillLevels: Array<DrillLevelSpec<EnrichedRecord>> = [
    {
      title: 'Programme',
      group: (rows) => {
        const byProgramme = new Map<string, EnrichedRecord[]>();
        rows.forEach((record) => {
          const list = byProgramme.get(record.programme) || [];
          list.push(record);
          byProgramme.set(record.programme, list);
        });
        return [...byProgramme.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([programme, list]) => ({
            label: programme,
            subLabel: `${new Set(list.map((r) => r.studentId)).size} students`,
            chips: [...new Set(list.map((r) => (r.semester ? `Sem ${r.semester}` : 'Unassigned')))]
              .sort()
              .slice(0, 4),
            items: list,
          }));
      },
    },
    {
      title: 'Semester',
      group: (rows) => {
        const bySemester = new Map<number, EnrichedRecord[]>();
        rows.forEach((record) => {
          const list = bySemester.get(record.semester) || [];
          list.push(record);
          bySemester.set(record.semester, list);
        });
        return [...bySemester.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([semester, list]) => ({
            label: semester ? `Semester ${semester}` : 'Unassigned semester',
            subLabel: `${new Set(list.map((r) => r.subject || r.code)).size} subjects`,
            items: list,
          }));
      },
    },
    {
      title: 'Subject',
      group: (rows) => {
        const bySubject = new Map<string, EnrichedRecord[]>();
        rows.forEach((record) => {
          const key = `${record.subject || 'Subject'}||${record.code || ''}`;
          const list = bySubject.get(key) || [];
          list.push(record);
          bySubject.set(key, list);
        });
        return [...bySubject.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([key, list]) => {
            const [subject, code] = key.split('||');
            return {
              label: code ? `${subject} (${code})` : subject,
              subLabel: `${new Set(list.map((r) => r.studentId)).size} students`,
              items: list,
            };
          });
      },
    },
  ];

  const visibleRecords = useMemo(() => enriched.filter((record) =>
    status === 'all' || record.status === status
  ), [enriched, status]);

  const updateField = (field: keyof GradeForm, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if ((field === 'internal' || field === 'external') && next.internal && next.external) {
        next.total = String(Number(next.internal) + Number(next.external));
      }
      return next;
    });
  };

  useEffect(() => { setComponentMarks({}); setAttendance(''); }, [form.code, form.semester, selectedStudent?.id]);
  const context = { programme: selectedStudent?.programme, batch: selectedStudent?.batch, semester: Number(form.semester) || undefined };
  const schemeQuery = useQuery({ queryKey: ['schemePack', collegeId, 'for-student', selectedStudent?.programme, selectedStudent?.batch, context.semester], queryFn: () => getCollegeSchemePack(collegeId, selectedStudent ? context : undefined), enabled: !!collegeId, retry: false });
  const mapping = (() => {
    try { return schemeQuery.data && form.code ? resolveSchemeCourse(schemeQuery.data.pack, form.code, context) : null; }
    catch { return null; }
  })();
  const componentEvidence = useComponents && mapping ? Object.fromEntries(mapping.profile.internalComponents.filter(c => c.method !== 'attendance').map(c => [c.id, Array.from({ length: c.count }, (_, i) => componentMarks[`${c.id}:${i}`]?.trim() ? Number(componentMarks[`${c.id}:${i}`]) : NaN)])) : undefined;
  let previewError = '';
  const preview = (() => {
    try { return schemeQuery.data && form.code ? deriveOfficialGrade({ code: form.code, semester: Number(form.semester), internal: useComponents ? undefined : optionalNumber(form.internal), external: optionalNumber(form.external), result: form.result, internalComponents: componentEvidence, attendancePercentage: optionalNumber(attendance) }, schemeQuery.data.pack, context) : null; }
    catch (err) { previewError = err instanceof Error ? err.message : 'Incomplete assessment marks'; return null; }
  })();

  const saveDraft = async () => {
    if (!selectedStudent) {
      setError('Choose a student.');
      return;
    }
    const semester = Number(form.semester);
    if (!Number.isInteger(semester) || semester < 1 || !form.code.trim() || !schemeQuery.data) {
      setError('Student, semester, approved course code and an active college scheme are required.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const save = httpsCallable<
        { collegeId: string; schemePackId: string; schemePackRevision: number; schemeConfigurationRevision?: number; records: Array<Record<string, unknown>> },
        { saved: number; ids: string[] }
      >(functions, 'saveDraftGradeRecords');
      await save({
        collegeId,
        schemePackId: schemeQuery.data.schemePackId,
        schemePackRevision: schemeQuery.data.revision,
        schemeConfigurationRevision: schemeQuery.data.configurationRevision,
        records: [{
          studentId: selectedStudent.id,
          semester,
          subject: mapping?.course.name || form.subject.trim() || form.code.trim(),
          code: form.code.trim(),
          ...(useComponents ? { internalComponents: componentEvidence, attendancePercentage: optionalNumber(attendance) } : { internal: optionalNumber(form.internal) }),
          external: optionalNumber(form.external),
          result: form.result || undefined,
        }],
      });
      setForm(EMPTY_FORM); setUseComponents(false); setComponentMarks({}); setAttendance('');
      setNotice('Draft grade record saved. Review it before publishing.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const mutateDrafts = async (action: 'publishGradeRecords' | 'deleteDraftGradeRecords') => {
    const ids = [...selectedDrafts];
    if (ids.length === 0) {
      setError('Choose at least one draft record.');
      return;
    }
    if (action === 'publishGradeRecords' && !window.confirm(
      `Publish ${ids.length} official grade record${ids.length === 1 ? '' : 's'} to students? Published records cannot be edited.`
    )) return;
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const mutate = httpsCallable<{ ids: string[] }, Record<string, number>>(functions, action);
      await mutate({ ids });
      setSelectedDrafts(new Set());
      setNotice(action === 'publishGradeRecords' ? 'Official grades published.' : 'Draft records deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grade records could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1500, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>Official Grade Records</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Create registrar drafts and explicitly publish verified transcript rows to students.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {schemeQuery.isError && <Alert severity="warning" sx={{ mb: 2 }}>{schemeQuery.error.message} <RouterLink to="/admin/scheme-packs">Configure Scheme Packs</RouterLink>. Existing published records remain unchanged.</Alert>}
      {schemeQuery.data && <Alert severity="info" sx={{ mb: 2 }}>Active policy: {schemeQuery.data.pack.code}, revision {schemeQuery.data.revision}. Credits, maxima, pass result and grade are derived and revalidated by the server. No test score is converted into college credits.</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>New or replacement draft</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Autocomplete
              options={students}
              value={selectedStudent}
              onChange={(_, value) => setSelectedStudent(value)}
              getOptionLabel={(student) => `${student.name}${student.regNo ? ` (${student.regNo})` : ''}`}
              renderInput={(params) => <TextField {...params} label="Student" required />}
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <TextField label="Semester" required type="number" value={form.semester} onChange={(event) => updateField('semester', event.target.value)} slotProps={{ htmlInput: { min: 1, max: 20 } }} />
            <TextField label="Course code" required value={form.code} onChange={(event) => updateField('code', event.target.value)} />
            <TextField label="Approved subject" value={mapping?.course.name ?? ''} slotProps={{ input: { readOnly: true } }} sx={{ gridColumn: { md: 'span 2' } }} />
            <TextField label="Approved credits" value={mapping?.course.credits ?? ''} slotProps={{ input: { readOnly: true } }} />
            <TextField label="Calculated grade" value={preview?.grade ?? ''} slotProps={{ input: { readOnly: true } }} />
            <TextField disabled={useComponents} label={`Internal marks${mapping ? ` (0–${mapping.profile.internalMaxMarks})` : ''}`} type="number" value={useComponents ? preview?.internal ?? '' : form.internal} onChange={(event) => updateField('internal', event.target.value)} />
            <TextField label={`External marks${mapping ? ` (0–${mapping.profile.externalMaxMarks})` : ''}`} type="number" value={form.external} onChange={(event) => updateField('external', event.target.value)} />
            <TextField label="Calculated total" value={preview?.total ?? ''} slotProps={{ input: { readOnly: true } }} />
            <TextField label="Calculated grade point" value={preview?.gradePoint ?? ''} slotProps={{ input: { readOnly: true } }} />
            <TextField select label="Result status" value={form.result} onChange={e => updateField('result', e.target.value)}>
              <MenuItem value="">Calculate from marks</MenuItem><MenuItem value="F">Recorded failure</MenuItem><MenuItem value="A">Absent</MenuItem>
            </TextField>
          </Box>
          {mapping && mapping.profile.internalMaxMarks > 0 && <Box sx={{ mt: 2 }}>
            <label><Checkbox checked={useComponents} onChange={e => setUseComponents(e.target.checked)} />Calculate IA from assessment components</label>
            {useComponents && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              {mapping.profile.internalComponents.map(component => component.method === 'attendance' ? <TextField key={component.id} label="Recorded attendance %" type="number" value={attendance} onChange={e => setAttendance(e.target.value)} /> :
                Array.from({ length: component.count }, (_, i) => <TextField key={`${component.id}:${i}`} type="number" label={`${component.label} ${component.count > 1 ? i + 1 : ''} / ${component.maxMarksEach}`} value={componentMarks[`${component.id}:${i}`] ?? ''} onChange={e => setComponentMarks({ ...componentMarks, [`${component.id}:${i}`]: e.target.value })} helperText={`${component.method}${component.bestOf ? ` ${component.bestOf}` : ''} → ${component.weight} IA marks`} />))}
              <Typography variant="caption">Provide every conducted component (0 for a recorded absence). The server recalculates and retains this evidence. College-approved aggregate IA entry remains available when the component breakdown is not imported.</Typography>
            </Box>}
          </Box>}
          {form.code && !mapping && <Alert severity="warning" sx={{ mt: 2 }}>No unambiguous course mapping for this student’s programme, batch and semester. Configure approved credits and an assessment profile in Scheme Packs.</Alert>}
          {mapping && previewError && <Alert severity="info" sx={{ mt: 2 }}>{previewError}</Alert>}
          <Button variant="contained" onClick={() => void saveDraft()} disabled={saving || !schemeQuery.data || !mapping || !preview} sx={{ mt: 2 }}>
            Save draft
          </Button>
        </CardContent>
      </Card>

      {!canPublish && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are grading as Vriddhi platform staff. Marks are saved as drafts and are published by the
          college HOD after approval.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value as typeof status)}>
            <MenuItem value="all">All records</MenuItem>
            <MenuItem value="draft">Drafts</MenuItem>
            <MenuItem value="published">Published</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="success"
          disabled={saving || selectedDrafts.size === 0 || !canPublish || !schemeQuery.data}
          title={canPublish ? undefined : 'Publishing is the college HOD’s approval step'}
          onClick={() => void mutateDrafts('publishGradeRecords')}
        >
          Publish selected ({selectedDrafts.size})
        </Button>
        <Button color="error" disabled={saving || selectedDrafts.size === 0 || !canPublish} onClick={() => void mutateDrafts('deleteDraftGradeRecords')}>
          Delete selected drafts
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <DrillDown
          items={visibleRecords}
          levels={drillLevels}
          itemKey={(record) => record.id}
          itemUnit="records"
          searchPlaceholder="Search student / subject / code"
          searchText={(record) => `${record.studentName} ${record.studentRegNo} ${record.subject} ${record.code}`}
          renderItem={(record) => (
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                <Checkbox
                  disabled={record.status !== 'draft'}
                  checked={selectedDrafts.has(record.id)}
                  onChange={(event) => setSelectedDrafts((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(record.id); else next.delete(record.id);
                    return next;
                  })}
                />
                <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{record.studentName}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {record.studentRegNo}{record.programme && record.programme !== 'Unassigned' ? ` · ${record.programme}` : ''}{record.batch ? ` · Batch ${record.batch}` : ''}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
                  <Typography variant="body2">{record.code || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{record.subject}</Typography>
                </Box>
                <Box sx={{ flex: '0 1 140px' }}>
                  <Typography variant="body2">{record.total ?? '—'} total{record.credits !== undefined ? ` · ${record.credits} cr` : ''}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{record.internal ?? '—'} + {record.external ?? '—'}</Typography>
                  {record.schemePackId && <Typography variant="caption" sx={{ display: 'block' }}>Policy r{record.schemePackRevision}: {record.result}</Typography>}
                </Box>
                <Typography sx={{ fontWeight: 700, minWidth: 70 }}>
                  {record.grade}{record.gradePoint !== undefined ? ` (${record.gradePoint})` : ''}
                </Typography>
                <Chip size="small" label={record.status} color={record.status === 'published' ? 'success' : 'warning'} />
                <Button component={RouterLink} size="small" to={`/admin/view360?student=${record.studentId}`}>
                  360° View
                </Button>
              </CardContent>
            </Card>
          )}
        />
      )}
    </Box>
  );
}
