import PWAInstallCard from '@/shared/components/PWAInstallCard'
import { Smartphone, Download } from 'lucide-react'

export default function StudentPWAInstallPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="text-teal-600" /> Install Vriddhi App
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Like Uniclare? Get hall ticket, room allotment, fee last date, results alerts + offline access
        </p>
      </div>

      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-5 text-white">
        <h3 className="font-bold flex items-center gap-2"><Download size={18}/> Why install over Uniclare?</h3>
        <ul className="text-sm text-teal-50 mt-2 space-y-1 list-disc list-inside">
          <li>Uniclare unpublished Oct 2024 — Vriddhi is the replacement with full college OS</li>
          <li>Push notifications: hall ticket ready, room allotted, fee due, results out (same as Uniclare)</li>
          <li>Offline: hall tickets, timetable, fees, grades work without internet</li>
          <li>One app for everything: attendance, assignments, assessments, fees, challan, results, journey</li>
        </ul>
      </div>

      <PWAInstallCard variant="page" />
    </div>
  )
}
