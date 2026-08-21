// ═══════════════════════════════════════════════════════════════════════
// components/AcademicCalendar.tsx — Academic Calendar (Month/Week/Day/List)
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Search, X, Trash2, Edit3,
  Clock, MapPin, User as UserIcon, BookOpen, AlertCircle, RefreshCw,
  GraduationCap, PartyPopper, FileText, Users, Flag,
} from 'lucide-react';

import type {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  CalendarViewMode,
  CreateCalendarEventInput,
  EventPriority,
} from '@/shared/types/academicCalendar';
import { EVENT_TYPE_COLORS, eventColor, toISODate } from '@/shared/api/academicCalendarApi';
import { useAcademicCalendar } from '@/shared/hooks/useAcademicCalendar';

// ─── Loosely-typed inputs so any caller can pass its own lists ─────────
export interface CalendarFacultyOption {
  id: string;
  name: string;
  department?: string;
  email?: string;
}

export interface CalendarCourseOption {
  id: string;
  code: string;
  name: string;
  modules?: { id: string; moduleName?: string; title?: string; moduleNo?: number }[];
}

export interface CalendarCurriculumOption {
  id: string;
  title: string;
  branch: string;
  semester: number;
  courses?: CalendarCourseOption[];
}

export interface AcademicCalendarProps {
  collegeId: string | undefined;
  userId: string;
  userName?: string | null;
  facultyList?: CalendarFacultyOption[];
  curriculumList?: CalendarCurriculumOption[];
  /** Hide the stats strip (e.g. when embedded under another stats row). */
  showStats?: boolean;
  /** Read-only mode — hides create/edit/delete affordances. */
  readOnly?: boolean;
}

// ─── Static config ─────────────────────────────────────────────────────

const EVENT_TYPES: { value: CalendarEventType; label: string; icon: React.ElementType }[] = [
  { value: 'class', label: 'Class', icon: BookOpen },
  { value: 'exam', label: 'Exam', icon: GraduationCap },
  { value: 'holiday', label: 'Holiday', icon: PartyPopper },
  { value: 'event', label: 'Event', icon: CalendarDays },
  { value: 'deadline', label: 'Deadline', icon: FileText },
  { value: 'meeting', label: 'Meeting', icon: Users },
];

const STATUSES: CalendarEventStatus[] = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];
const PRIORITIES: EventPriority[] = ['low', 'medium', 'high', 'urgent'];
const VIEW_MODES: CalendarViewMode[] = ['month', 'week', 'day', 'list'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY_STYLES: Record<EventPriority, string> = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  medium: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const STATUS_STYLES: Record<CalendarEventStatus, string> = {
  scheduled: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  ongoing: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  postponed: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

function typeIcon(type: CalendarEventType): React.ElementType {
  return EVENT_TYPES.find(t => t.value === type)?.icon || CalendarDays;
}

function timeLabel(e: CalendarEvent): string {
  if (e.allDay) return 'All day';
  if (e.startTime && e.endTime) return `${e.startTime} – ${e.endTime}`;
  return e.startTime || 'All day';
}

// ─── Small presentational pieces ───────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-card px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1a`, color }}>
        <CalendarDays size={16} />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

function EventPill({ event, onClick, compact = true }: {
  event: CalendarEvent;
  onClick: () => void;
  compact?: boolean;
}) {
  const color = eventColor(event);
  const Icon = typeIcon(event.eventType);
  const cancelled = event.status === 'cancelled';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={`${event.title} · ${timeLabel(event)}`}
      className={`w-full text-left rounded-lg px-2 py-1 flex items-center gap-1.5 transition-opacity hover:opacity-80
        ${compact ? 'text-[11px]' : 'text-xs py-2'} ${cancelled ? 'line-through opacity-60' : ''}`}
      style={{ backgroundColor: `${color}22`, color, borderLeft: `3px solid ${color}` }}
    >
      <Icon size={compact ? 10 : 13} className="shrink-0" />
      {!event.allDay && event.startTime && (
        <span className="shrink-0 font-medium opacity-80">{event.startTime}</span>
      )}
      <span className="truncate">{event.title}</span>
    </button>
  );
}

// ─── Event details popover ─────────────────────────────────────────────

function EventDetails({ event, onClose, onEdit, onDelete, readOnly }: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}) {
  const color = eventColor(event);
  const Icon = typeIcon(event.eventType);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}1a`, color }}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full border capitalize" style={{ borderColor: `${color}55`, color, backgroundColor: `${color}12` }}>
                  {event.eventType}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[event.status]}`}>
                  {event.status}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${PRIORITY_STYLES[event.priority]}`}>
                  {event.priority}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
            <X size={16} />
          </button>
        </div>

        {event.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{event.description}</p>
        )}

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <CalendarDays size={14} className="text-slate-400" />
            <span>
              {event.startDate}
              {event.endDate && event.endDate !== event.startDate ? ` → ${event.endDate}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock size={14} className="text-slate-400" />
            <span>{timeLabel(event)}</span>
          </div>
          {(event.courseName || event.courseCode) && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <BookOpen size={14} className="text-slate-400" />
              <span>{[event.courseCode, event.courseName].filter(Boolean).join(' · ')}</span>
            </div>
          )}
          {event.facultyName && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <UserIcon size={14} className="text-slate-400" />
              <span>{event.facultyName}</span>
            </div>
          )}
          {(event.room || event.building) && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <MapPin size={14} className="text-slate-400" />
              <span>{[event.room, event.building].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {(event.branch || event.semester || event.batch || event.division || event.section) && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Flag size={14} className="text-slate-400" />
              <span>
                {[
                  event.branch,
                  event.semester ? `Sem ${event.semester}` : null,
                  event.batch,
                  event.division ? `Div ${event.division}` : null,
                  event.section ? `Sec ${event.section}` : null,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 mt-6">
            <button onClick={onEdit} className="btn-secondary flex items-center gap-2 text-sm">
              <Edit3 size={14} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}

        {event.createdByName && (
          <p className="text-[11px] text-slate-400 mt-4">Created by {event.createdByName}</p>
        )}
      </div>
    </div>
  );
}

// ─── Create / Edit modal ───────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  eventType: CalendarEventType;
  status: CalendarEventStatus;
  priority: EventPriority;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  curriculumId: string;
  courseId: string;
  moduleId: string;
  facultyId: string;
  branch: string;
  semester: string;
  batch: string;
  division: string;
  section: string;
  room: string;
  building: string;
  color: string;
}

function emptyForm(date: Date): FormState {
  const iso = toISODate(date);
  return {
    title: '', description: '', eventType: 'class', status: 'scheduled', priority: 'medium',
    startDate: iso, endDate: iso, allDay: true, startTime: '09:00', endTime: '10:00',
    curriculumId: '', courseId: '', moduleId: '', facultyId: '',
    branch: '', semester: '', batch: '', division: '', section: '',
    room: '', building: '', color: '',
  };
}

function EventModal({
  open, initial, defaultDate, facultyList, curriculumList, saving, onClose, onSubmit, onDelete,
}: {
  open: boolean;
  initial: CalendarEvent | null;
  defaultDate: Date;
  facultyList: CalendarFacultyOption[];
  curriculumList: CalendarCurriculumOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => Promise<void>;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultDate));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description || '',
        eventType: initial.eventType,
        status: initial.status,
        priority: initial.priority,
        startDate: initial.startDate,
        endDate: initial.endDate || initial.startDate,
        allDay: initial.allDay,
        startTime: initial.startTime || '09:00',
        endTime: initial.endTime || '10:00',
        curriculumId: initial.curriculumId || '',
        courseId: initial.courseId || '',
        moduleId: initial.moduleId || '',
        facultyId: initial.facultyId || '',
        branch: initial.branch || '',
        semester: initial.semester ? String(initial.semester) : '',
        batch: initial.batch || '',
        division: initial.division || '',
        section: initial.section || '',
        room: initial.room || '',
        building: initial.building || '',
        color: initial.color || '',
      });
    } else {
      setForm(emptyForm(defaultDate));
    }
  }, [open, initial, defaultDate]);

  const selectedCurriculum = useMemo(
    () => curriculumList.find(c => c.id === form.curriculumId),
    [curriculumList, form.curriculumId]
  );
  const courses = selectedCurriculum?.courses || [];
  const selectedCourse = courses.find(c => c.id === form.courseId);
  const modules = selectedCourse?.modules || [];

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleCurriculum = (id: string) => {
    const cur = curriculumList.find(c => c.id === id);
    setForm(prev => ({
      ...prev,
      curriculumId: id,
      courseId: '',
      moduleId: '',
      branch: cur?.branch || prev.branch,
      semester: cur?.semester ? String(cur.semester) : prev.semester,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setFormError('Title is required');
    if (!form.startDate) return setFormError('Start date is required');
    if (form.endDate && form.endDate < form.startDate) return setFormError('End date cannot be before start date');
    if (!form.allDay && form.startTime && form.endTime && form.endTime <= form.startTime) {
      return setFormError('End time must be after start time');
    }
    setFormError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save event');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="glass-card w-full max-w-2xl p-6 my-8 animate-fade-in"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {initial ? 'Edit Event' : 'New Calendar Event'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50">
            <X size={16} />
          </button>
        </div>

        {formError && (
          <div className="mb-4 flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            <AlertCircle size={14} /> {formError}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Title *</label>
            <input
              className="input-field" value={form.title} autoFocus
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Mid-Semester Exam — Data Structures"
            />
          </div>

          {/* Type / Status / Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Type</label>
              <select className="input-field" value={form.eventType} onChange={e => set('eventType', e.target.value as CalendarEventType)}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
              <select className="input-field capitalize" value={form.status} onChange={e => set('status', e.target.value as CalendarEventStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Priority</label>
              <select className="input-field capitalize" value={form.priority} onChange={e => set('priority', e.target.value as EventPriority)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Start date *</label>
              <input type="date" className="input-field" value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value, endDate: p.endDate < e.target.value ? e.target.value : p.endDate }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">End date</label>
              <input type="date" className="input-field" value={form.endDate} min={form.startDate}
                onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Timing */}
          <div className="flex items-center gap-2">
            <input id="allDay" type="checkbox" checked={form.allDay}
              onChange={e => set('allDay', e.target.checked)}
              className="h-4 w-4 rounded accent-teal-500" />
            <label htmlFor="allDay" className="text-sm text-slate-600 dark:text-slate-300">All-day event</label>
          </div>

          {!form.allDay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Start time</label>
                <input type="time" className="input-field" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">End time</label>
                <input type="time" className="input-field" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </div>
            </div>
          )}

          {/* Academic context */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 mt-3 uppercase tracking-wide">Academic context</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Curriculum</label>
                <select className="input-field" value={form.curriculumId} onChange={e => handleCurriculum(e.target.value)}>
                  <option value="">— None —</option>
                  {curriculumList.map(c => (
                    <option key={c.id} value={c.id}>{c.title} · {c.branch} · Sem {c.semester}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Course</label>
                <select className="input-field" value={form.courseId} disabled={!courses.length}
                  onChange={e => setForm(p => ({ ...p, courseId: e.target.value, moduleId: '' }))}>
                  <option value="">{courses.length ? '— None —' : 'Select a curriculum first'}</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Module</label>
                <select className="input-field" value={form.moduleId} disabled={!modules.length}
                  onChange={e => set('moduleId', e.target.value)}>
                  <option value="">{modules.length ? '— None —' : 'Select a course first'}</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.moduleNo ? `M${m.moduleNo} · ` : ''}{m.moduleName || m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Faculty</label>
                <select className="input-field" value={form.facultyId} onChange={e => set('facultyId', e.target.value)}>
                  <option value="">— None —</option>
                  {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}{f.department ? ` · ${f.department}` : ''}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Branch</label>
                <input className="input-field" value={form.branch} onChange={e => set('branch', e.target.value)} placeholder="CSE" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Semester</label>
                <input className="input-field" type="number" min={1} max={12} value={form.semester} onChange={e => set('semester', e.target.value)} placeholder="5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Batch</label>
                <input className="input-field" value={form.batch} onChange={e => set('batch', e.target.value)} placeholder="2022-26" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Division</label>
                <input className="input-field" value={form.division} onChange={e => set('division', e.target.value)} placeholder="A" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Section</label>
                <input className="input-field" value={form.section} onChange={e => set('section', e.target.value)} placeholder="A1" />
              </div>
            </div>
          </div>

          {/* Location + colour */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Room</label>
              <input className="input-field" value={form.room} onChange={e => set('room', e.target.value)} placeholder="LH-201" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Building</label>
              <input className="input-field" value={form.building} onChange={e => set('building', e.target.value)} placeholder="Block B" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Colour override</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-11 w-14 rounded-xl bg-transparent border border-slate-300 dark:border-slate-700 cursor-pointer"
                  value={form.color || EVENT_TYPE_COLORS[form.eventType]}
                  onChange={e => set('color', e.target.value)} />
                {form.color && (
                  <button type="button" onClick={() => set('color', '')} className="text-xs text-slate-400 hover:text-rose-400">Reset</button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
            <textarea className="input-field min-h-[80px] resize-y" value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Optional notes, syllabus coverage, instructions…" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-6">
          <div>
            {initial && onDelete && (
              <button type="button" onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export default function AcademicCalendar({
  collegeId,
  userId,
  userName,
  facultyList = [],
  curriculumList = [],
  showStats = true,
  readOnly = false,
}: AcademicCalendarProps) {
  const cal = useAcademicCalendar(collegeId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [modalDate, setModalDate] = useState<Date>(new Date());

  const openCreate = (date?: Date) => {
    if (readOnly) return;
    setEditing(null);
    setModalDate(date || cal.currentDate);
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setSelected(null);
    setEditing(event);
    setModalOpen(true);
  };

  const handleDelete = async (event: CalendarEvent) => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    await cal.removeEvent(event.id);
    setSelected(null);
    setModalOpen(false);
  };

  const handleSubmit = async (form: FormState) => {
    const faculty = facultyList.find(f => f.id === form.facultyId);
    const curriculum = curriculumList.find(c => c.id === form.curriculumId);
    const course = curriculum?.courses?.find(c => c.id === form.courseId);
    const module = course?.modules?.find(m => m.id === form.moduleId);

    const base = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      eventType: form.eventType,
      status: form.status,
      priority: form.priority,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      allDay: form.allDay,
      startTime: form.allDay ? null : form.startTime || null,
      endTime: form.allDay ? null : form.endTime || null,
      curriculumId: form.curriculumId || null,
      courseId: form.courseId || null,
      courseName: course?.name ?? null,
      courseCode: course?.code ?? null,
      moduleId: form.moduleId || null,
      moduleName: module ? (module.moduleName || module.title || null) : null,
      facultyId: form.facultyId || null,
      facultyName: faculty?.name ?? null,
      branch: form.branch.trim() || null,
      semester: form.semester ? Number(form.semester) : null,
      batch: form.batch.trim() || null,
      division: form.division.trim() || null,
      section: form.section.trim() || null,
      room: form.room.trim() || null,
      building: form.building.trim() || null,
      color: form.color || null,
    };

    if (editing) {
      await cal.editEvent(editing.id, base);
    } else {
      const payload: CreateCalendarEventInput = {
        ...base,
        collegeId: collegeId || '',
        createdBy: userId,
        createdByName: userName ?? null,
        isRecurring: false,
        recurringRule: null,
      };
      await cal.addEvent(payload);
    }
    setModalOpen(false);
    setEditing(null);
  };

  // ─── Guard ─────────────────────────────────────────────────────────
  if (!collegeId) {
    return (
      <div className="glass-card p-8 text-center">
        <CalendarDays size={32} className="mx-auto text-slate-400 mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No college context available — the academic calendar needs a college to load events.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* ─── Stats ─────────────────────────────────────────────────── */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatChip label="Total events" value={cal.stats.totalEvents} color="#14b8a6" />
          <StatChip label="Upcoming" value={cal.stats.upcomingEvents} color="#0ea5e9" />
          <StatChip label="Classes today" value={cal.stats.classesToday} color="#f59e0b" />
          <StatChip label="Exams this week" value={cal.stats.examsThisWeek} color="#ef4444" />
        </div>
      )}

      {/* ─── Toolbar ───────────────────────────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={cal.goPrev} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={cal.goNext} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors">
              <ChevronRight size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white ml-1">{cal.periodLabel}</h2>
            <button onClick={cal.goToday} className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-400 border border-teal-500/30 hover:bg-teal-500/10 transition-colors">
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/60 dark:bg-slate-900/50">
              {VIEW_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => cal.setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                    ${cal.viewMode === mode ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button onClick={cal.refresh} title="Refresh"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors">
              <RefreshCw size={16} className={cal.loading ? 'animate-spin' : ''} />
            </button>
            {!readOnly && (
              <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2 text-sm !py-2.5">
                <Plus size={16} /> New Event
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field !py-2.5 pl-9 text-sm"
              placeholder="Search events, courses, faculty, rooms…"
              value={cal.search}
              onChange={e => cal.setSearch(e.target.value)}
            />
          </div>
          <select className="input-field !py-2.5 !w-auto text-sm capitalize" value={cal.typeFilter}
            onChange={e => cal.setTypeFilter(e.target.value as CalendarEventType | 'all')}>
            <option value="all">All types</option>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="input-field !py-2.5 !w-auto text-sm capitalize" value={cal.statusFilter}
            onChange={e => cal.setStatusFilter(e.target.value as CalendarEventStatus | 'all')}>
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {facultyList.length > 0 && (
            <select className="input-field !py-2.5 !w-auto text-sm" value={cal.facultyFilter}
              onChange={e => cal.setFacultyFilter(e.target.value)}>
              <option value="all">All faculty</option>
              {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {EVENT_TYPES.map(t => (
            <span key={t.value} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[t.value] }} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {cal.error && (
        <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={15} /> {cal.error}
        </div>
      )}

      {/* ─── Views ─────────────────────────────────────────────────── */}
      {cal.loading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
        </div>
      ) : cal.viewMode === 'month' ? (
        <div className="glass-card p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cal.monthGrid.map(cell => (
              <div
                key={cell.date.toISOString()}
                onClick={() => { cal.setSelectedDate(cell.date); openCreate(cell.date); }}
                className={`min-h-[96px] rounded-xl p-1.5 border transition-colors cursor-pointer
                  ${cell.isCurrentMonth
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800'
                    : 'bg-transparent border-transparent opacity-50'}
                  ${cell.isToday ? '!border-teal-500/50 !bg-teal-500/5' : ''}
                  hover:border-teal-500/30`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${cell.isToday ? 'text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {cell.date.getDate()}
                  </span>
                  {cell.events.length > 0 && (
                    <span className="text-[10px] text-slate-400">{cell.events.length}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {cell.events.slice(0, 3).map(ev => (
                    <EventPill key={ev.id} event={ev} onClick={() => setSelected(ev)} />
                  ))}
                  {cell.events.length > 3 && (
                    <button
                      onClick={e => { e.stopPropagation(); cal.setCurrentDate(cell.date); cal.setViewMode('day'); }}
                      className="text-[10px] text-teal-400 hover:underline pl-1"
                    >
                      +{cell.events.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : cal.viewMode === 'week' ? (
        <div className="glass-card p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {cal.weekGrid.map(cell => (
              <div
                key={cell.date.toISOString()}
                onClick={() => openCreate(cell.date)}
                className={`min-h-[180px] rounded-xl p-2 border cursor-pointer transition-colors
                  bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 hover:border-teal-500/30
                  ${cell.isToday ? '!border-teal-500/50 !bg-teal-500/5' : ''}`}
              >
                <div className="mb-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{WEEKDAYS[cell.date.getDay()]}</p>
                  <p className={`text-sm font-bold ${cell.isToday ? 'text-teal-400' : 'text-slate-900 dark:text-white'}`}>
                    {cell.date.getDate()}
                  </p>
                </div>
                <div className="space-y-1">
                  {cell.events.map(ev => (
                    <EventPill key={ev.id} event={ev} onClick={() => setSelected(ev)} compact={false} />
                  ))}
                  {cell.events.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">No events</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : cal.viewMode === 'day' ? (
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {cal.currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <span className="text-xs text-slate-400">{cal.dayEvents.length} event(s)</span>
          </div>
          {cal.dayEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Nothing scheduled for this day.</p>
              {!readOnly && (
                <button onClick={() => openCreate(cal.currentDate)} className="btn-secondary text-sm mt-4 inline-flex items-center gap-2">
                  <Plus size={14} /> Add event
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {cal.dayEvents.map(ev => {
                const color = eventColor(ev);
                const Icon = typeIcon(ev.eventType);
                return (
                  <button key={ev.id} onClick={() => setSelected(ev)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl text-left bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 hover:border-teal-500/30 transition-colors">
                    <div className="w-20 shrink-0 text-xs text-slate-500 dark:text-slate-400 pt-0.5">{timeLabel(ev)}</div>
                    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${color}1a`, color }}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium text-slate-900 dark:text-white ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>
                        {ev.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {[ev.courseCode, ev.facultyName, ev.room].filter(Boolean).join(' · ') || ev.eventType}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_STYLES[ev.status]}`}>
                      {ev.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-4 sm:p-6">
          {cal.listEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays size={28} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No events match your filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cal.listEvents.map(ev => {
                const color = eventColor(ev);
                const Icon = typeIcon(ev.eventType);
                return (
                  <button key={ev.id} onClick={() => setSelected(ev)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 hover:border-teal-500/30 transition-colors">
                    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${color}1a`, color }}>
                      <Icon size={15} />
                    </div>
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{ev.startDate}</p>
                      <p className="text-[11px] text-slate-400">{timeLabel(ev)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium text-slate-900 dark:text-white truncate ${ev.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>
                        {ev.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {[ev.courseCode, ev.facultyName, ev.branch, ev.semester ? `Sem ${ev.semester}` : null, ev.room]
                          .filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <span className={`hidden sm:inline text-[11px] px-2 py-0.5 rounded-full border capitalize shrink-0 ${PRIORITY_STYLES[ev.priority]}`}>
                      {ev.priority}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_STYLES[ev.status]}`}>
                      {ev.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Overlays ──────────────────────────────────────────────── */}
      {selected && (
        <EventDetails
          event={selected}
          readOnly={readOnly}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onDelete={() => handleDelete(selected)}
        />
      )}

      <EventModal
        open={modalOpen}
        initial={editing}
        defaultDate={modalDate}
        facultyList={facultyList}
        curriculumList={curriculumList}
        saving={cal.saving}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        onDelete={editing ? () => handleDelete(editing) : undefined}
      />
    </div>
  );
}
