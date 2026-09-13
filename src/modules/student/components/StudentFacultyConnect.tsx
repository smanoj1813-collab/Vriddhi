// src/modules/student/components/StudentFacultyConnect.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, UserCheck, MessageSquare, Plus, AlertCircle,
  CheckCircle2, XCircle, MapPin, Video, Send, Loader2, Sparkles, BookOpen
} from 'lucide-react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  createAppointmentRequest,
  getStudentAppointments,
  getFacultyAvailabilitySlots,
  listCollegeFaculty,
  updateAppointmentStatus,
  type FacultyAppointment,
  type FacultyAvailabilitySlot,
  type FacultyProfileOption,
  type MeetingType,
} from '@/api/facultyAppointmentApi';

const MEETING_TYPES: { value: MeetingType; label: string; desc: string }[] = [
  { value: 'doubt_clearing', label: '1-on-1 Doubt Clearing', desc: 'Resolve complex lecture questions or numericals' },
  { value: 'mentorship', label: 'Mentorship & Academic Check-in', desc: 'Discuss attendance, performance, and study roadmap' },
  { value: 'career_guidance', label: 'Career & Internship Advice', desc: 'Guidance on certifications, resumes, and industry pathways' },
  { value: 'project_review', label: 'Assignment / Project Review', desc: 'Review draft report or capstone implementation' },
  { value: 'general', label: 'General Discussion', desc: 'Other academic queries' },
];

export default function StudentFacultyConnect() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<FacultyAppointment[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [facultySlots, setFacultySlots] = useState<FacultyAvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>('doubt_clearing');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [doubtDescription, setDoubtDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('');

  const collegeId = user?.collegeId || '';
  const studentId = user?.id || user?.uid || '';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    if (!collegeId || !studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [appts, faculties] = await Promise.all([
        getStudentAppointments(collegeId, studentId),
        listCollegeFaculty(collegeId),
      ]);
      setAppointments(appts);
      setFacultyList(faculties);
    } catch (err) {
      showToast('Failed to load mentors and requests — sign out and in again if the problem persists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [collegeId, studentId]);

  // When student picks a faculty member, load their availability slots
  const handleFacultyChange = async (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    if (!facultyId) {
      setFacultySlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const slots = await getFacultyAvailabilitySlots(collegeId, facultyId);
      setFacultySlots(slots);
      if (slots.length > 0) {
        setPreferredTimeSlot(`${slots[0].startTime} - ${slots[0].endTime}`);
      }
    } catch {
      setFacultySlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !subject.trim() || !preferredDate || !doubtDescription.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    const selectedFaculty = facultyList.find(f => f.id === selectedFacultyId);
    if (!selectedFaculty) {
      showToast('Selected faculty member is invalid', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createAppointmentRequest(collegeId, {
        collegeId,
        studentId,
        studentName: user?.name || 'Student',
        studentEmail: user?.email || '',
        studentBatch: (user as any)?.batch || '',
        studentBranch: (user as any)?.branch || (user as any)?.department || '',
        studentRegNo: (user as any)?.regNo || '',
        facultyId: selectedFacultyId,
        facultyName: selectedFaculty.name,
        facultyEmail: selectedFaculty.email,
        subject,
        topic,
        doubtDescription,
        meetingType,
        preferredDate,
        preferredTimeSlot: preferredTimeSlot || '15:00 - 16:00',
      });

      showToast('Conversation request submitted successfully!', 'success');
      setModalOpen(false);
      // Reset form
      setSelectedFacultyId('');
      setSubject('');
      setTopic('');
      setDoubtDescription('');
      setPreferredDate('');
      setPreferredTimeSlot('');
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await updateAppointmentStatus(collegeId, id, 'cancelled');
      showToast('Request cancelled');
      loadData();
    } catch {
      showToast('Failed to cancel request', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Declined
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Awaiting Faculty
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between shadow-lg ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
            : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-500/30'
        }`}>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-xs underline opacity-80">Close</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 border border-teal-500/20 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Faculty Connect & 1-on-1 Mentorship</h2>
          </div>
          <p className="text-xs text-slate-300">
            Request doubt clearing sessions, office hours appointments, or academic mentorship directly from your professors.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Request Conversation
        </button>
      </div>

      {/* Appointment History List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-500" />
          My Requested Sessions ({appointments.length})
        </h3>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
            <p className="text-sm text-slate-500 font-medium">No appointment requests yet.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Need help resolving difficult concepts or guidance on projects? Click "Request Conversation" to schedule time with your professors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {appt.facultyName}
                    </h4>
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                      {appt.subject} {appt.topic ? `• ${appt.topic}` : ''}
                    </p>
                  </div>
                  {getStatusBadge(appt.status)}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {MEETING_TYPES.find(t => t.value === appt.meetingType)?.label || appt.meetingType}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    "{appt.doubtDescription}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    <span>{new Date(appt.preferredDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                    <span>{appt.preferredTimeSlot}</span>
                  </div>
                </div>

                {appt.meetingLocation && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium">Location / Link: {appt.meetingLocation}</span>
                  </div>
                )}

                {appt.facultyRemarks && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Faculty Note:</span> {appt.facultyRemarks}
                  </div>
                )}

                {appt.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(appt.id)}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-teal-500" />
                  Request Faculty Conversation
                </h3>
                <p className="text-xs text-slate-500">Book 1-on-1 doubt clearing or mentoring time.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Select Faculty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Faculty Member *
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose Professor / Mentor --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation || 'Faculty'}) {f.department ? `- ${f.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty Office Hours Preview */}
              {selectedFacultyId && (
                <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 space-y-2">
                  <p className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Faculty's Regular Office Hours:
                  </p>
                  {loadingSlots ? (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Loading availability...</div>
                  ) : facultySlots.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No fixed office hours listed. You can request any standard working slot.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {facultySlots.map((s, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {s.dayOfWeek}: {s.startTime} - {s.endTime} ({s.location})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Type / Purpose *
                </label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  {MEETING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Subject & Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Course *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Financial Accounting"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Topic / Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Cash Flow Statements"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Preferred Date & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Time Slot *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 15:00 - 16:00"
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Doubt / Agenda Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doubt Details / Discussion Agenda *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what specific questions or guidance you need..."
                  value={doubtDescription}
                  onChange={(e) => setDoubtDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
