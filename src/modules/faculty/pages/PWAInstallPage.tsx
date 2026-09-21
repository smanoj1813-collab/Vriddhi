import PWAInstallCard from '@/shared/components/PWAInstallCard'
import { Smartphone, Download } from 'lucide-react'

export default function FacultyPWAInstallPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="text-teal-600" /> Install Vriddhi App
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Faculty app — mark attendance offline, question bank, auto-grading, push alerts
        </p>
      </div>

      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-5 text-white">
        <h3 className="font-bold flex items-center gap-2"><Download size={18}/> Faculty Benefits</h3>
        <ul className="text-sm text-teal-50 mt-2 space-y-1 list-disc list-inside">
          <li>Offline attendance marking — sync when online</li>
          <li>Push for appointments, reschedule requests</li>
          <li>Question bank & paper generator on mobile</li>
          <li>Auto-grading 5M/10M descriptive answers</li>
        </ul>
      </div>

      <PWAInstallCard variant="page" />
    </div>
  )
}
