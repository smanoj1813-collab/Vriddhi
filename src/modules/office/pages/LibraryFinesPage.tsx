// /admin/library-fines — one fines ledger shared by Accounts and the library.

import { IndianRupee } from 'lucide-react'
import { Loading, PageHeader } from '../components/officeUi'
import FinesTab from '../components/library/FinesTab'
import { useLibrarySettings } from '../hooks/useLibrary'

export default function LibraryFinesPage() {
  const { settings, loading } = useLibrarySettings()
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Library Fines"
        subtitle="Overdue, lost and damaged-book charges — collected at the library desk or through the student fee account."
        icon={<IndianRupee className="w-5 h-5" />}
      />
      {loading ? <Loading /> : <FinesTab settings={settings} />}
    </div>
  )
}
