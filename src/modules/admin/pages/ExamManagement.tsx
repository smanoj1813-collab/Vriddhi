import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Plus, FileText, Users, Building2, Bell, CheckCircle,
  Clock, AlertTriangle, Download, Eye, Settings, GraduationCap,
  MapPin, Ticket, Loader2, Search
} from 'lucide-react';
import {
  listExamSessions,
  createExamSession,
  listHallTickets,
  listExamRooms,
  listUniversityNotifications,
} from '../api/examManagementApi';
import type { CreateExamSessionInput, ExamSession } from '../types/examManagement';

export default function ExamManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'sessions' | 'halltickets' | 'rooms' | 'notifications'>('sessions');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['examSessions'],
    queryFn: () => listExamSessions(),
  });

  const { data: hallTickets = [] } = useQuery({
    queryKey: ['hallTickets', selectedSession?.id],
    queryFn: () => selectedSession ? listHallTickets(selectedSession.id) : Promise.resolve([]),
    enabled: !!selectedSession,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['examRooms'],
    queryFn: () => listExamRooms(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['universityNotifications'],
    queryFn: () => listUniversityNotifications(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateExamSessionInput) => createExamSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examSessions'] });
      setShowCreateModal(false);
    },
  });

  const filteredSessions = sessions.filter(s => 
    !searchQuery || 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-teal-600" />
            Karnataka University Exams
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hall Tickets, Room Allotment & UUCMS Sync - BCU, BNU, Davangere, Rani Channamma
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Exam Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600">
              <Calendar size={18} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Sessions</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">{sessions.length}</p>
          <p className="text-xs text-slate-500 mt-1">{sessions.filter(s => s.status === 'ongoing').length} active</p>
        </div>
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
              <Ticket size={18} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Hall Tickets</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {sessions.reduce((acc, s) => acc + (s.hallTicketsGenerated || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Generated</p>
        </div>
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600">
              <Building2 size={18} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Rooms</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">{rooms.length}</p>
          <p className="text-xs text-slate-500 mt-1">{rooms.reduce((acc, r) => acc + r.capacity, 0)} capacity</p>
        </div>
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600">
              <Bell size={18} />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase">Notifications</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">{notifications.length}</p>
          <p className="text-xs text-slate-500 mt-1">University alerts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'sessions', label: 'Exam Sessions', icon: Calendar, count: sessions.length },
          { id: 'halltickets', label: 'Hall Tickets', icon: Ticket, count: hallTickets.length },
          { id: 'rooms', label: 'Exam Rooms', icon: Building2, count: rooms.length },
          { id: 'notifications', label: 'University Alerts', icon: Bell, count: notifications.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search exam sessions..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Content */}
      {activeTab === 'sessions' && (
        <div className="grid gap-4">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#131b2e] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No exam sessions yet</p>
              <p className="text-sm text-slate-500 mt-1">Create your first exam session for BCU/BNU</p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div
                key={session.id}
                className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-white">{session.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        session.status === 'ongoing' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        session.status === 'hall_tickets_generated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {session.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {session.scheme}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><GraduationCap size={12} /> {session.course} Sem {session.semester}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {session.examStartDate} to {session.examEndDate}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {session.hallTicketsGenerated || 0} HTs</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-slate-500">Fee Last Date:</span>
                      <span className="text-xs font-bold text-amber-600">{session.feeLastDate}</span>
                      {session.feeLastDateWithFine && (
                        <span className="text-xs text-rose-600">With fine: {session.feeLastDateWithFine}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <Eye size={16} className="text-slate-500" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <Settings size={16} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'halltickets' && (
        <div className="space-y-4">
          {!selectedSession ? (
            <div className="text-center py-12 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Select an exam session to view hall tickets</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Hall Tickets - {selectedSession.title}
                </h3>
                <span className="text-sm text-slate-500">{hallTickets.length} tickets</span>
              </div>
              <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Hall Ticket No</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">USN / Reg No</th>
                        <th className="py-3 px-4">Eligibility</th>
                        <th className="py-3 px-4">Room</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {hallTickets.map(ht => (
                        <tr key={ht.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-bold text-teal-600">{ht.hallTicketNo}</td>
                          <td className="py-3 px-4 font-medium">{ht.studentName}</td>
                          <td className="py-3 px-4">{ht.regNo}</td>
                          <td className="py-3 px-4">
                            {ht.attendanceEligibility ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                                ht.attendanceEligibility.isEligible
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {ht.attendanceEligibility.isEligible ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                {ht.attendanceEligibility.overallPercentage.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Not checked</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {ht.roomNo ? (
                              <span className="flex items-center gap-1 text-xs">
                                <MapPin size={12} /> {ht.building} - {ht.roomNo} ({ht.seatNo})
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Not allotted</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              ht.status === 'downloaded' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              ht.status === 'blocked' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {ht.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold">Exam Rooms</h3>
            <span className="text-sm text-slate-500">{rooms.length} rooms, {rooms.reduce((a, r) => a + r.capacity, 0)} seats</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {rooms.map(room => (
              <div key={room.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">{room.roomNo}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${room.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {room.isAvailable ? 'Available' : 'Blocked'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{room.building} {room.floor && `- ${room.floor}`}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span>Capacity: {room.capacity}</span>
                  <span>{room.rows}x{room.columns}</span>
                  <span className="capitalize">{room.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div key={notif.id} className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">{notif.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      notif.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      notif.priority === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {notif.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {notif.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{notif.createdAt} • {notif.totalRecipients || 0} recipients</p>
                </div>
                {notif.actionUrl && (
                  <a href={notif.actionUrl} className="text-xs font-bold text-teal-600 hover:underline">
                    {notif.actionLabel || 'View'} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateExamSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(input) => createMutation.mutate(input)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateExamSessionModal({ onClose, onCreate, isLoading }: {
  onClose: () => void;
  onCreate: (input: CreateExamSessionInput) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<CreateExamSessionInput>({
    title: '',
    academicYear: '2024-25',
    semester: 1,
    examType: 'regular',
    scheme: 'SEP 2024',
    course: 'BCA',
    applicationStartDate: new Date().toISOString().slice(0, 10),
    applicationEndDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10),
    feeLastDate: new Date(Date.now() + 10*24*60*60*1000).toISOString().slice(0, 10),
    examStartDate: new Date(Date.now() + 20*24*60*60*1000).toISOString().slice(0, 10),
    examEndDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold">Create Exam Session - Karnataka University</h2>
          <p className="text-xs text-slate-500 mt-1">BCU / BNU / Davangere / Rani Channamma - SEP 2024 Compliant</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Exam Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="BCA 3rd Sem Regular - SEP 2024"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Academic Year</label>
              <select
                value={form.academicYear}
                onChange={e => setForm({ ...form, academicYear: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option>2024-25</option>
                <option>2025-26</option>
                <option>2023-24</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Scheme</label>
              <select
                value={form.scheme}
                onChange={e => setForm({ ...form, scheme: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option>SEP 2024</option>
                <option>SEP 2024-25</option>
                <option>NEP 2020</option>
                <option>CBCS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course</label>
              <select
                value={form.course}
                onChange={e => setForm({ ...form, course: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option>BCA</option>
                <option>BBA</option>
                <option>B.Com</option>
                <option>BA</option>
                <option>B.Sc</option>
                <option>BSW</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Semester</label>
              <select
                value={form.semester}
                onChange={e => setForm({ ...form, semester: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Exam Type</label>
              <select
                value={form.examType}
                onChange={e => setForm({ ...form, examType: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="regular">Regular</option>
                <option value="supplementary">Supplementary</option>
                <option value="improvement">Improvement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fee Last Date</label>
              <input
                type="date"
                value={form.feeLastDate}
                onChange={e => setForm({ ...form, feeLastDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Exam Start</label>
              <input
                type="date"
                value={form.examStartDate}
                onChange={e => setForm({ ...form, examStartDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Exam End</label>
              <input
                type="date"
                value={form.examEndDate}
                onChange={e => setForm({ ...form, examEndDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(form)}
            disabled={isLoading || !form.title}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Create Session
          </button>
        </div>
      </div>
    </div>
  );
}
