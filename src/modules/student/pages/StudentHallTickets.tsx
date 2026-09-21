import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import {
  Ticket, Download, MapPin, Calendar, Clock, AlertTriangle,
  CheckCircle, Eye, Building2, QrCode, GraduationCap, FileText,
  Bell, Loader2
} from 'lucide-react';
import { calculateBCUAttendanceMarks } from '@/shared/utils/bcuCompliance';

interface HallTicketDoc {
  id: string;
  hallTicketNo: string;
  examTitle: string;
  academicYear: string;
  status: string;
  examCenter?: string;
  roomNo?: string;
  building?: string;
  seatNo?: string;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    examDate: string;
    examTime: string;
    isAppearing: boolean;
  }>;
  attendanceEligibility?: {
    isEligible: boolean;
    overallPercentage: number;
    remarks?: string;
  };
  generatedAt?: string;
  examSessionId: string;
}

export default function StudentHallTickets() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useStudentProfile(user?.uid);
  const [hallTickets, setHallTickets] = useState<HallTicketDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<HallTicketDoc | null>(null);

  useEffect(() => {
    if (profileLoading || !profile) return;
    
    const fetchHallTickets = async () => {
      try {
        setLoading(true);
        const collegeId = profile.collegeId || user?.collegeId;
        if (!collegeId) return;

        // Query hall tickets for this student across all exam sessions
        // We need to query all exam sessions first, then hall tickets
        const sessionsQuery = query(
          collection(db, 'colleges', collegeId, 'examSessions'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        
        const allTickets: HallTicketDoc[] = [];
        
        for (const sessionDoc of sessionsSnap.docs) {
          const ticketsQuery = query(
            collection(db, 'colleges', collegeId, 'examSessions', sessionDoc.id, 'hallTickets'),
            where('studentId', '==', profile.id),
            limit(10)
          );
          const ticketsSnap = await getDocs(ticketsQuery);
          ticketsSnap.docs.forEach(d => {
            const data = d.data();
            allTickets.push({
              id: d.id,
              hallTicketNo: data.hallTicketNo || '',
              examTitle: data.examTitle || sessionDoc.data().title || 'University Exam',
              academicYear: data.academicYear || '',
              status: data.status || 'generated',
              examCenter: data.examCenter,
              roomNo: data.roomNo,
              building: data.building,
              seatNo: data.seatNo,
              subjects: data.subjects || [],
              attendanceEligibility: data.attendanceEligibility,
              generatedAt: data.generatedAt?.toDate?.()?.toISOString() || data.generatedAt,
              examSessionId: sessionDoc.id,
            });
          });
        }

        setHallTickets(allTickets);
      } catch (err) {
        console.error('Failed to fetch hall tickets', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHallTickets();
  }, [profile, profileLoading, user?.collegeId]);

  if (profileLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Hall Tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Ticket className="text-teal-600" />
          Hall Tickets
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Download your university exam hall tickets - BCU, BNU, Davangere, Rani Channamma
        </p>
      </div>

      {/* Info Banner - Uniclare feature parity */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Uniclare-Style Alerts Now in Vriddhi</h3>
            <p className="text-sm text-teal-50 mt-1">
              Get notified for hall ticket release, room allotment, exam dates, fee last dates, and results - just like Uniclare but integrated with your college.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Hall Ticket Download', 'Room Allotment', 'Exam Date Alert', 'Fee Last Date'].map(feature => (
                <span key={feature} className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hallTickets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#131b2e] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white">No hall tickets yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Your college will generate hall tickets for upcoming university exams. 
            You'll get a notification when your hall ticket is ready for download.
            Make sure your attendance is ≥75% to be eligible per BCU ordinance.
          </p>
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl max-w-md mx-auto text-left">
            <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              BCU Eligibility Check
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
              • Minimum 75% attendance required to be eligible<br />
              • 76-80% = 2 marks, 81-85% = 3 marks, 86-90% = 4 marks, 91%+ = 5 marks in IA<br />
              • Hall ticket will be blocked if attendance below 75%
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {hallTickets.map(ticket => {
            const isBlocked = ticket.status === 'blocked';
            const isEligible = ticket.attendanceEligibility?.isEligible ?? true;
            
            return (
              <div
                key={ticket.id}
                className={`bg-white dark:bg-[#131b2e] border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${
                  isBlocked ? 'border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/10' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-white">{ticket.examTitle}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isBlocked
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : ticket.status === 'downloaded'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {ticket.status.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {ticket.academicYear}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Hall Ticket No:</span>
                      <span className="font-mono font-bold text-teal-600 text-sm">{ticket.hallTicketNo}</span>
                    </div>

                    {/* Attendance Eligibility */}
                    {ticket.attendanceEligibility && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center gap-2 ${
                        isEligible
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                      }`}>
                        {isEligible ? (
                          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${isEligible ? 'text-emerald-900 dark:text-emerald-100' : 'text-rose-900 dark:text-rose-100'}`}>
                            Attendance: {ticket.attendanceEligibility.overallPercentage.toFixed(1)}% - {isEligible ? 'Eligible' : 'Not Eligible'}
                          </p>
                          {ticket.attendanceEligibility.remarks && (
                            <p className={`text-xs mt-0.5 ${isEligible ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                              {ticket.attendanceEligibility.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exam Center & Room */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Building2 size={14} className="text-slate-400" />
                        <div>
                          <p className="text-slate-500">Exam Center</p>
                          <p className="font-bold text-slate-900 dark:text-white">{ticket.examCenter || 'Main Campus'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin size={14} className="text-slate-400" />
                        <div>
                          <p className="text-slate-500">Room & Seat</p>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {ticket.roomNo ? `${ticket.building} - ${ticket.roomNo} (${ticket.seatNo})` : 'To be allotted'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={14} className="text-slate-400" />
                        <div>
                          <p className="text-slate-500">Generated</p>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {ticket.generatedAt ? new Date(ticket.generatedAt).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="mt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subjects ({ticket.subjects.length})</h4>
                      <div className="grid gap-2">
                        {ticket.subjects.slice(0, 3).map((subj, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs">
                            <div>
                              <p className="font-bold">{subj.subjectCode} - {subj.subjectName}</p>
                              <p className="text-slate-500">{subj.examDate} • {subj.examTime}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${subj.isAppearing ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                              {subj.isAppearing ? 'Appearing' : 'Not Appearing'}
                            </span>
                          </div>
                        ))}
                        {ticket.subjects.length > 3 && (
                          <p className="text-xs text-slate-500 text-center">+{ticket.subjects.length - 3} more subjects</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} className="text-slate-600" />
                    </button>
                    {!isBlocked && (
                      <button
                        onClick={() => {
                          // In real app, this would download PDF
                          alert(`Downloading hall ticket ${ticket.hallTicketNo} - PDF generation would happen here via /api/papers/${ticket.examSessionId}/pdf`);
                        }}
                        className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors shadow-sm"
                        title="Download Hall Ticket"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Ticket size={20} className="text-teal-600" />
                    Hall Ticket Details
                  </h2>
                  <p className="text-sm text-slate-500 font-mono mt-1">{selectedTicket.hallTicketNo}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <QrCode size={48} className="text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-500 mt-2">QR VERIFICATION</p>
                  <p className="text-[8px] font-mono text-slate-400 mt-1">{selectedTicket.hallTicketNo.slice(0, 12)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Student Name</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">{profile?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">USN / Reg No</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">{profile?.regNo || profile?.rollNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Course</p>
                  <p className="font-bold mt-1">{profile?.course} - Sem {profile?.semester}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Academic Year</p>
                  <p className="font-bold mt-1">{selectedTicket.academicYear}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-3">Examination Schedule</h4>
                <div className="space-y-2">
                  {selectedTicket.subjects.map((subj, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                      <div>
                        <p className="font-bold text-sm">{subj.subjectCode}</p>
                        <p className="text-xs text-slate-500">{subj.subjectName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{subj.examDate}</p>
                        <p className="text-xs text-slate-500">{subj.examTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2">
                  <FileText size={14} />
                  Instructions
                </h4>
                <ul className="text-xs text-amber-800 dark:text-amber-200 mt-2 space-y-1 list-disc list-inside">
                  <li>Bring this hall ticket + college ID card to exam hall</li>
                  <li>Reach exam center 30 mins before exam time</li>
                  <li>Mobile phones, smart watches not allowed</li>
                  <li>Verify room allotment on college notice board</li>
                  <li>QR code will be scanned at entry</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('PDF download would start here');
                  setSelectedTicket(null);
                }}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
