// src/shared/pages/PWAInstallPage.tsx
//
// Item 4.5 of docs/HANDOFF_OPTIMISATION_2026-09-25.md — one install page for
// every role.
//
// There used to be three copies (admin / faculty / student). They had already
// drifted: the student copy had the "like Uniclare" pitch and the extra mobile
// padding, the faculty copy had the faculty benefit list, and the admin copy
// had the offline matrix. A fourth role — office, mentor, principal — would have
// meant a fourth file, each one a new place for the same PWA instructions to go
// stale.
//
// The role-specific parts are now data (a copy block per role); the layout, the
// install card and the offline matrix are shared. `role` defaults to 'student'
// so an existing route cannot render an empty page by forgetting the prop.

import PWAInstallCard from '@/shared/components/PWAInstallCard';
import { Bell, CheckCircle, Download, Smartphone } from 'lucide-react';

export type PwaInstallRole = 'student' | 'faculty' | 'admin';

interface RoleCopy {
  /** One-line subtitle under the heading. */
  subtitle: string;
  /** Title of the highlight block. */
  highlightTitle: string;
  /** Bullets in the highlight block. */
  highlights: string[];
  /** The Admin copy shows the Uniclare comparison matrix; the others do not. */
  showComparison?: boolean;
  /** Extra page padding — the student route renders flush against the app shell. */
  extraPadding?: boolean;
}

const ROLE_COPY: Record<PwaInstallRole, RoleCopy> = {
  student: {
    subtitle: 'Like Uniclare? Get hall ticket, room allotment, fee last date, results alerts + offline access',
    highlightTitle: 'Why install over Uniclare?',
    highlights: [
      'Uniclare unpublished Oct 2024 — Vriddhi is the replacement with full college OS',
      'Push notifications: hall ticket ready, room allotted, fee due, results out (same as Uniclare)',
      'Offline: hall tickets, timetable, fees, grades work without internet',
      'One app for everything: attendance, assignments, assessments, fees, challan, results, journey',
    ],
    extraPadding: true,
  },
  faculty: {
    subtitle: 'Faculty app — mark attendance offline, question bank, auto-grading, push alerts',
    highlightTitle: 'Faculty Benefits',
    highlights: [
      'Offline attendance marking — sync when online',
      'Push for appointments, reschedule requests',
      'Question bank & paper generator on mobile',
      'Auto-grading 5M/10M descriptive answers',
    ],
  },
  admin: {
    subtitle:
      'Get Uniclare-like mobile app experience - PWA install with push notifications for hall tickets, room allotment, fee alerts, results',
    highlightTitle: 'Why Install? Beat Uniclare App (500k Downloads)',
    highlights: [
      'All Uniclare alerts + push via FCM',
      'Offline hall ticket, timetable, fees',
      'Full college OS: attendance, assignments, assessments, fees, challan, results, journey',
      'UUCMS integration, BCU compliance, result importer, auto-grading',
      'Parent portal, faculty, admin - all in one app',
    ],
    showComparison: true,
  },
};

/** The Uniclare comparison the admin page has always shown. */
function UniclareComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-3 mt-4">
      <div className="bg-white/15 rounded-xl p-3">
        <p className="font-bold text-sm">Uniclare Had</p>
        <ul className="text-xs text-teal-100 mt-1 space-y-1 list-disc list-inside">
          <li>Hall ticket download alert</li>
          <li>Room allotment alert</li>
          <li>Exam fee last date alert</li>
          <li>Results announcement</li>
          <li>Fee paid details</li>
        </ul>
      </div>
      <div className="bg-white/15 rounded-xl p-3">
        <p className="font-bold text-sm">Vriddhi PWA Has + More</p>
        <ul className="text-xs text-teal-100 mt-1 space-y-1 list-disc list-inside">
          <li>All Uniclare alerts + push via FCM</li>
          <li>Offline hall ticket, timetable, fees</li>
          <li>Full college OS: attendance, assignments, assessments, fees, challan, results, journey</li>
          <li>UUCMS integration, BCU compliance, result importer, auto-grading</li>
          <li>Parent portal, faculty, admin - all in one app</li>
        </ul>
      </div>
    </div>
  );
}

/** What each role can still reach without a network connection. */
function OfflineMatrix() {
  const columns: Array<{ title: string; items: string[] }> = [
    {
      title: 'Student Offline',
      items: ['Hall tickets (already downloaded)', 'Timetable, class schedule', 'Fee receipts, challans', 'Assignments, materials', 'Grades, journey'],
    },
    {
      title: 'Faculty Offline',
      items: ['Mark attendance (sync later)', 'View student analysis', 'Question bank', 'Assessment schedule'],
    },
    {
      title: 'Admin Offline',
      items: ['View students, attendance', 'Fee ledger (cached)', 'Exam sessions, hall tickets list', 'BCU compliance dashboard'],
    },
  ];
  return (
    <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <h3 className="font-bold flex items-center gap-2">
        <CheckCircle size={18} className="text-emerald-600" /> After Install - What Works Offline
      </h3>
      <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="font-bold">{column.title}</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1 list-disc list-inside">
              {column.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PWAInstallPage({ role = 'student' }: { role?: PwaInstallRole }) {
  const copy = ROLE_COPY[role] ?? ROLE_COPY.student;
  return (
    <div className={`max-w-4xl mx-auto space-y-6${copy.extraPadding ? ' p-4 md:p-0' : ''}`}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="text-teal-600" /> Install Vriddhi App
        </h1>
        <p className="text-sm text-slate-500 mt-1">{copy.subtitle}</p>
      </div>

      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-5 md:p-6 text-white">
        <h3 className="font-bold flex items-center gap-2">
          <Download size={18} /> {copy.highlightTitle}
        </h3>
        {role === 'admin' ? (
          <p className="text-teal-50 mt-2 text-sm">
            Uniclare&apos;s main moat was mobile app with push for hall ticket, room allotment, fee last date, results. Vriddhi
            PWA gives same + more: full college OS offline, not just notifications. Uniclare unpublished Oct 2024, we fill gap.
          </p>
        ) : null}
        <ul className="text-sm text-teal-50 mt-2 space-y-1 list-disc list-inside">
          {copy.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {copy.showComparison ? <UniclareComparison /> : null}
      </div>

      <PWAInstallCard variant="page" />

      {/* Push permission is part of installing, and every role needs the same
          instruction — it lived only on the admin copy before. */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Bell size={16} className="text-teal-600" /> Turn on notifications
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Installing adds the app to your home screen. Allow notifications when your browser asks — that is how hall tickets,
          fee deadlines, results and appointment updates reach you while the app is closed.
        </p>
      </div>

      <OfflineMatrix />
    </div>
  );
}
