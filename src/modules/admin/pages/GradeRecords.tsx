import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';

interface StudentOption {
  id: string;
  name: string;
  regNo: string;
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
};

function optionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value);
}

export default function GradeRecords() {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [records, setRecords] = useState<GradeRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [form, setForm] = useState<GradeForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const visibleRecords = useMemo(() => records.filter((record) =>
    status === 'all' || record.status === status
  ), [records, status]);

  const updateField = (field: keyof GradeForm, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if ((field === 'internal' || field === 'external') && next.internal && next.external) {
        next.total = String(Number(next.internal) + Number(next.external));
      }
      return next;
    });
  };

  const saveDraft = async () => {
    if (!selectedStudent) {
      setError('Choose a student.');
      return;
    }
    const semester = Number(form.semester);
    if (!Number.isInteger(semester) || semester < 1 || !form.subject.trim() || !form.code.trim() || !form.grade.trim()) {
      setError('Student, semester, subject, course code, and grade are required.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setNotice(null);
      const save = httpsCallable<
        { collegeId: string; records: Array<Record<string, unknown>> },
        { saved: number; ids: string[] }
      >(functions, 'saveDraftGradeRecords');
      await save({
        collegeId,
        records: [{
          studentId: selectedStudent.id,
          semester,
          subject: form.subject.trim(),
          code: form.code.trim(),
          credits: optionalNumber(form.credits),
          internal: optionalNumber(form.internal),
          external: optionalNumber(form.external),
          total: optionalNumber(form.total),
          grade: form.grade.trim(),
          gradePoint: optionalNumber(form.gradePoint),
        }],
      });
      setForm(EMPTY_FORM);
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
            <TextField label="Subject" required value={form.subject} onChange={(event) => updateField('subject', event.target.value)} sx={{ gridColumn: { md: 'span 2' } }} />
            <TextField label="Credits" type="number" value={form.credits} onChange={(event) => updateField('credits', event.target.value)} slotProps={{ htmlInput: { min: 0, max: 30, step: 0.5 } }} />
            <TextField label="Grade" required value={form.grade} onChange={(event) => updateField('grade', event.target.value.toUpperCase())} />
            <TextField label="Internal marks" type="number" value={form.internal} onChange={(event) => updateField('internal', event.target.value)} />
            <TextField label="External marks" type="number" value={form.external} onChange={(event) => updateField('external', event.target.value)} />
            <TextField label="Total" type="number" value={form.total} onChange={(event) => updateField('total', event.target.value)} />
            <TextField label="Grade point" type="number" value={form.gradePoint} onChange={(event) => updateField('gradePoint', event.target.value)} slotProps={{ htmlInput: { min: 0, max: 10, step: 0.1 } }} />
          </Box>
          <Button variant="contained" onClick={() => void saveDraft()} disabled={saving} sx={{ mt: 2 }}>
            Save draft
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value as typeof status)}>
            <MenuItem value="all">All records</MenuItem>
            <MenuItem value="draft">Drafts</MenuItem>
            <MenuItem value="published">Published</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="success" disabled={saving || selectedDrafts.size === 0} onClick={() => void mutateDrafts('publishGradeRecords')}>
          Publish selected ({selectedDrafts.size})
        </Button>
        <Button color="error" disabled={saving || selectedDrafts.size === 0} onClick={() => void mutateDrafts('deleteDraftGradeRecords')}>
          Delete selected drafts
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : visibleRecords.length === 0 ? (
        <Alert severity="info">No grade records match this filter.</Alert>
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Student</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      disabled={record.status !== 'draft'}
                      checked={selectedDrafts.has(record.id)}
                      onChange={(event) => setSelectedDrafts((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(record.id); else next.delete(record.id);
                        return next;
                      })}
                    />
                  </TableCell>
                  <TableCell>{record.studentName}<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{record.studentRegNo}</Typography></TableCell>
                  <TableCell>{record.semester}</TableCell>
                  <TableCell>{record.code}<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{record.subject}</Typography></TableCell>
                  <TableCell>{record.total ?? '—'}{record.internal !== undefined || record.external !== undefined ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{record.internal ?? '—'} + {record.external ?? '—'}</Typography> : null}</TableCell>
                  <TableCell>{record.credits ?? '—'}</TableCell>
                  <TableCell>{record.grade}{record.gradePoint !== undefined ? ` (${record.gradePoint})` : ''}</TableCell>
                  <TableCell><Chip size="small" label={record.status} color={record.status === 'published' ? 'success' : 'warning'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
