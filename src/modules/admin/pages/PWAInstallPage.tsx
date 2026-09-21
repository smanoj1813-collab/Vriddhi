import PWAInstallCard from '@/shared/components/PWAInstallCard'
import { Smartphone, Download, Bell, CheckCircle } from 'lucide-react'

export default function PWAInstallPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="text-teal-600" /> Install Vriddhi App
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Get Uniclare-like mobile app experience - PWA install with push notifications for hall tickets, room allotment, fee alerts, results
        </p>
      </div>

      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Download size={20} /> Why Install? Beat Uniclare App (500k Downloads)
        </h3>
        <p className="text-teal-50 mt-2 text-sm">
          Uniclare's main moat was mobile app with push for hall ticket, room allotment, fee last date, results. Vriddhi PWA gives same + more: full college OS offline, not just notifications. Uniclare unpublished Oct 2024, we fill gap.
        </p>
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
      </div>

      <PWAInstallCard variant="page" />

      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" /> After Install - What Works Offline
        </h3>
        <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <p className="font-bold">Student Offline</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1 list-disc list-inside">
              <li>Hall tickets (already downloaded)</li>
              <li>Timetable, class schedule</li>
              <li>Fee receipts, challans</li>
              <li>Assignments, materials</li>
              <li>Grades, journey</li>
            </ul>
          </div>
          <div>
            <p className="font-bold">Faculty Offline</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1 list-disc list-inside">
              <li>Mark attendance (sync later)</li>
              <li>View student analysis</li>
              <li>Question bank</li>
              <li>Assessment schedule</li>
            </ul>
          </div>
          <div>
            <p className="font-bold">Admin Offline</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1 list-disc list-inside">
              <li>View students, attendance</li>
              <li>Fee ledger (cached)</li>
              <li>Exam sessions, hall tickets list</li>
              <li>BCU compliance dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
