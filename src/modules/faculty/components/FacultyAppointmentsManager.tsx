// src/modules/faculty/components/FacultyAppointmentsManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, UserCheck, MessageSquare, CheckCircle2,
  XCircle, MapPin, Video, Check, X, AlertCircle, Plus, Trash2,
  Save, Loader2, Filter, User, BookOpen
} from 'lucide-react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  getFacultyAppointments,
  updateAppointmentStatus,
  getFacultyAvailabilitySlots,
  saveFacultyAvailabilitySlots,
  type FacultyAppointment,
  type FacultyAvailabilitySlot,
  type AppointmentStatus,
} from '@/api/facultyAppointmentApi';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export default function FacultyAppointmentsManager() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<FacultyAppointment[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<FacultyAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlots, setSavingSlots] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal for Confirming/Rejecting
  const [selectedAppt, setSelectedAppt] = useState<FacultyAppointment | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null);
  const [meetingLocation, setMeetingLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const collegeId = user?.collegeId || '';
  const facultyId = user?.id || user?.uid || '';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    if (!collegeId || !facultyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [appts, slots] = await Promise.all([
        getFacultyAppointments(collegeId, facultyId),
        getFacultyAvailabilitySlots(collegeId, facultyId),
      ]);
      setAppointments(appts);
      setAvailabilitySlots(slots);
    } catch {
      showToast('Failed to load student requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [collegeId, facultyId]);

  // Handle availability slot edits
  const handleAddSlot = () => {
    const newSlot: FacultyAvailabilitySlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: 'Monday',
      startTime: '15:00',
      endTime: '16:30',
      location: '',
      isAcceptingRequests: true,
    };
    setAvailabilitySlots(prev => [...prev, newSlot]);
  };

  const handleRemoveSlot = (id: string) => {
    setAvailabilitySlots(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateSlot = (id: string, updates: Partial<FacultyAvailabilitySlot>) => {
    setAvailabilitySlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSaveAvailability = async () => {
    setSavingSlots(true);
    try {
      await saveFacultyAvailabilitySlots(collegeId, facultyId, availabilitySlots);
      showToast('Office hours & availability saved successfully!');
    } catch {
      showToast('Failed to save availability', 'error');
    } finally {
      setSavingSlots(false);
    }
  };

  // Confirm or Reject appointment
  const handleProcessAction = async () => {
    if (!selectedAppt || !actionType) return;
    setProcessingAction(true);
    try {
      const status: AppointmentStatus = actionType === 'confirm' ? 'confirmed' : 'rejected';
      await updateAppointmentStatus(
        collegeId,
        selectedAppt.id,
        status,
        remarks,
        actionType === 'confirm' ? meetingLocation : undefined
      );

      showToast(`Appointment request ${status === 'confirmed' ? 'confirmed' : 'declined'} successfully!`);
      setSelectedAppt(null);
      setActionType(null);
      setRemarks('');
      loadData();
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await updateAppointmentStatus(collegeId, id, 'completed');
      showToast('Marked as completed');
      loadData();
    } catch {
      showToast('Failed to mark completed', 'error');
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-8">
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

      {/* Section 1: Office Hours & Availability */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              My Office Hours & Consultation Availability
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set the days and time windows when students can book 1-on-1 doubt clearing or mentoring sessions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddSlot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Slot
            </button>
            <button
              onClick={handleSaveAvailability}
              disabled={savingSlots}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all"
            >
              {savingSlots ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Office Hours
            </button>
          </div>
        </div>

        {availabilitySlots.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No office hours configured yet. Click "Add Slot" to add your weekly availability.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availabilitySlots.map((slot) => (
              <div
                key={slot.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => handleUpdateSlot(slot.id, { dayOfWeek: e.target.value as any })}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Start Time</label>
                    <input
                      type="text"
                      value={slot.startTime}
                      onChange={(e) => handleUpdateSlot(slot.id, { startTime: e.target.value })}
                      placeholder="15:00"
                      className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">End Time</label>
                    <input
                      type="text"
                      value={slot.endTime}
                      onChange={(e) => handleUpdateSlot(slot.id, { endTime: e.target.value })}
                      placeholder="16:30"
                      className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Cabin / Link</label>
                  <input
                    type="text"
                    value={slot.location}
                    onChange={(e) => handleUpdateSlot(slot.id, { location: e.target.value })}
                    placeholder="Cabin 204 or Google Meet"
                    className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Student Conversation Requests */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Incoming Student Requests ({appointments.length})
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {pendingCount} Pending
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rejected">Declined</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <p className="text-sm text-slate-500 font-medium">No student requests found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-teal-500" />
                      {appt.studentName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {appt.studentRegNo ? `Reg: ${appt.studentRegNo} • ` : ''}
                      {appt.studentBranch} {appt.studentBatch ? `(${appt.studentBatch})` : ''}
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    appt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                    appt.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                    appt.status === 'completed' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {appt.status}
                  </span>
                </div>

                {/* Subject & Purpose */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                  <p className="font-semibold text-teal-600 dark:text-teal-400">
                    {appt.subject} {appt.topic ? `• ${appt.topic}` : ''}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Query: </span>
                    "{appt.doubtDescription}"
                  </p>
                </div>

                {/* Requested Slot */}
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
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Location: {appt.meetingLocation}</span>
                  </div>
                )}

                {/* Action Buttons */}
                {appt.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedAppt(appt);
                        setActionType('reject');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800 transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppt(appt);
                        setActionType('confirm');
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
                    >
                      Confirm & Assign Location
                    </button>
                  </div>
                )}

                {appt.status === 'confirmed' && (
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleMarkCompleted(appt.id)}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                    >
                      Mark Session Completed ✓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm / Reject Modal */}
      {selectedAppt && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {actionType === 'confirm' ? 'Confirm Student Session' : 'Decline Request'}
            </h3>

            <p className="text-xs text-slate-500">
              {actionType === 'confirm'
                ? `Confirm meeting with ${selectedAppt.studentName} for ${selectedAppt.subject}.`
                : `Decline meeting request from ${selectedAppt.studentName}.`}
            </p>

            {actionType === 'confirm' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Location / Virtual Link *
                </label>
                <input
                  type="text"
                  required
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="e.g., Faculty Cabin 204 or https://meet.google.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {actionType === 'confirm' ? 'Note for Student (Optional)' : 'Reason / Remark *'}
              </label>
              <textarea
                rows={3}
                required={actionType === 'reject'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionType === 'confirm' ? 'e.g. Please bring your textbook and notebook' : 'e.g. In exam duty, please request on Friday instead'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedAppt(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessAction}
                disabled={processingAction || (actionType === 'reject' && !remarks.trim())}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all ${
                  actionType === 'confirm' ? 'bg-teal-600 hover:bg-teal-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
