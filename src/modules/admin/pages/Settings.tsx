import React, { useState, useEffect } from 'react'
import AppearanceSettings from '@/shared/components/AppearanceSettings'
import { applyLocalAppearance, DEFAULT_APPEARANCE } from '@/shared/theme/appearance'
import { saveAppearancePreferences } from '@/shared/services/appearancePreferences'
import { useSearchParams } from 'react-router-dom'
import { useThemeMode } from '../../../shared/contexts/ThemeProvider'
import { useAuth, type AppUser } from '../../auth/context/AuthContext'
import AccountSecurityNotice from '@/shared/components/AccountSecurityNotice'
import { getMyStaffSettings, updateMyStaffProfile } from '@/shared/services/staffProfile'
import { useAccountScope } from '@/shared/hooks/useAccountScope'
import { booleanPreferences, cacheAccountPreferences, readAccountPreferences, ADMIN_NOTIFICATION_DEFAULTS } from '@/shared/utils/accountPreferences'
import { db } from '@/Firebase/data'
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore'
import ChangePasswordForm from '../../../shared/components/ChangePasswordForm'
import {
  Save, User, Building2, Bell, Shield, Palette, Database, Download,
  Sun, Moon, Check, Upload, Trash2, AlertTriangle,
  Smartphone, Mail, FileText, Calendar, Loader2, Info, Sparkles
} from 'lucide-react'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import { useTranslation } from '../../../shared/contexts/LanguageProvider'
import AiStudyContentTab from './AiStudyContentTab'
import CompanyPrepVisibilityPanel from '@/shared/components/prep/CompanyPrepVisibilityPanel'
import CourseAssignmentPanel from '@/shared/components/courses/CourseAssignmentPanel'
import ResumeAddonPanel from '@/shared/components/resume/ResumeAddonPanel'
import CollegeBrandingUpload from '@/shared/components/CollegeBrandingUpload'
import EmailSettingsCard from '../components/EmailSettingsCard'
import CohortConfigPanel from '../components/CohortConfigPanel'

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      {label && <span className="sr-only">{label}</span>}
    </button>
  )
}

function SettingsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border transition-colors duration-300 ${className}
      bg-white dark:bg-slate-800/60
      border-slate-200 dark:border-slate-700/50
      shadow-sm dark:shadow-none`}>
      {children}
    </div>
  )
}

function SettingsInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300
        bg-slate-50 dark:bg-slate-900/50
        border-slate-200 dark:border-slate-700/50
        text-slate-800 dark:text-white
        placeholder-slate-400 dark:placeholder-slate-500
        focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${props.className || ''}`}
    />
  )
}

function SettingsSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300
        bg-slate-50 dark:bg-slate-900/50
        border-slate-200 dark:border-slate-700/50
        text-slate-800 dark:text-white
        focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500
        ${props.className || ''}`}
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
      {children}
    </h3>
  )
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
      {children}
    </p>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
      {children}
    </label>
  )
}

function Message({ type, text }: { type: 'ok' | 'err' | 'info'; text: string }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
    err: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  }
  return (
    <div role={type === 'err' ? 'alert' : 'status'} className={`p-3 rounded-xl text-xs font-semibold border flex items-start gap-2 ${styles[type]}`}>
      {type === 'ok' ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : type === 'err' ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <Info className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{text}</span>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  return <AccountSettings key={user?.uid || 'signed-out'} user={user} />
}

function AccountSettings({ user }: { user: AppUser | null }) {
  const isCurrent = useAccountScope(user?.uid)
  // Platform accounts have no college settings to load/save by default.
  const [activeTab, setActiveTab] = useState(() => user?.role === 'superadmin' ? 'appearance' : 'general')
  // Deep-link support: /admin/settings?tab=ai-content lands the superadmin
  // straight on the "AI Content & Cost" tab (which hosts Prep Content Studio).
  const [searchParams] = useSearchParams()
  const { resolvedMode, setMode } = useThemeMode()
  const { t } = useTranslation()
  const { showSuccess, showWarning, showError } = useNotification()

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // General state
  const [collegeName, setCollegeName] = useState('')
  const [academicYear, setAcademicYear] = useState('2026-2027')
  const [semesterStart, setSemesterStart] = useState('2026-07-01')
  const [semesterEnd, setSemesterEnd] = useState('2026-12-15')
  const [passPercentage, setPassPercentage] = useState('40')
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [generalMsg, setGeneralMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Profile state
  const [fullName, setFullName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const role = user?.role === 'admin' || user?.role === 'hod' ? t('role.hod') : user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Notifications state
  const [notifications, setNotifications] = useState(() => readAccountPreferences('vriddhi_admin_notifications', user?.uid, ADMIN_NOTIFICATION_DEFAULTS))
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
    setNotificationMsg(null)
  }

  // Security state — password change lives in the shared ChangePasswordForm
  // (re-authenticates with the current password, 10-char floor, clears the
  // mustChangePassword claim), so no local password state is needed here.

  // Existing profile preferences are read-only migration fallbacks; all new
  // appearance writes use the signed-in owner's private preference document.
  const [legacyAppearance, setLegacyAppearance] = useState<{ uid: string; value: unknown } | null>(null)
  const [resettingAppearance, setResettingAppearance] = useState(false)
  const [autoBackup, setAutoBackup] = useState('weekly')

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Backup', icon: Database },
    // AI content & cost data is INTERNAL (platform-level spend and caps):
    // the tab exists for superadmin only and is never shown to college staff.
    // (The server enforces this too — the controls endpoints 403 non-superadmin.)
    ...(user?.role === 'superadmin'
      ? [{ id: 'ai-content', label: 'AI Content & Cost', icon: Sparkles }]
      : []),
  ]

  // Honour ?tab=<tabId> deep links. Only tabs that actually exist for this
  // viewer are accepted, so a college admin hitting ?tab=ai-content simply
  // stays on General rather than being routed to a superadmin-only surface.
  useEffect(() => {
    const requested = searchParams.get('tab')
    if (!requested) return
    if (tabs.some((tab) => tab.id === requested)) {
      setActiveTab(requested)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.role])

  // Parallel, one-shot reads. Ignore responses after an account switch; cloud
  // preferences take precedence over this account's optional offline cache.
  useEffect(() => {
    let cancelled = false
    setInitialLoading(true)
    setLoadError(null)
    if (!user) { setInitialLoading(false); return }
    const current = () => !cancelled && isCurrent()
    const loadProfile = async () => {
      const data = await getMyStaffSettings()
      if (!current()) return
      if (data.uid !== user.uid) throw new Error('Your account changed. Reload settings.')
      setFullName(data.name || user.name || '')
      setEmail(data.email || user.email || '')
      setPhone(data.phone)
      setNotifications(booleanPreferences(ADMIN_NOTIFICATION_DEFAULTS, data.notificationPrefs ?? readAccountPreferences('vriddhi_admin_notifications', user.uid, ADMIN_NOTIFICATION_DEFAULTS)))
      if (data.appearance) setLegacyAppearance({ uid: user.uid, value: data.appearance })
    }
    const loadCollege = async () => {
      if (!user.collegeId) return
      const snapshot = await getDoc(doc(db, 'colleges', user.collegeId))
      if (!current() || !snapshot.exists()) return
      const data = snapshot.data()
      setCollegeName(data.name || data.collegeName || '')
      setAcademicYear(data.academicYear || data.settings?.academicYear || '2026-2027')
      setSemesterStart(data.semesterStart || data.settings?.semesterStart || '2026-07-01')
      setSemesterEnd(data.semesterEnd || data.settings?.semesterEnd || '2026-12-15')
      setPassPercentage(String(data.passPercentage ?? data.settings?.passPercentage ?? '40'))
      if (['daily', 'weekly', 'monthly', 'never'].includes(data.settings?.autoBackup)) setAutoBackup(data.settings.autoBackup)
    }
    Promise.allSettled([loadProfile(), loadCollege()]).then(results => {
      if (!current()) return
      const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      if (failure) setLoadError(failure.reason instanceof Error ? failure.reason.message : 'Unable to load cloud settings.')
      setInitialLoading(false)
    })
    return () => { cancelled = true }
  }, [user, isCurrent, reloadKey])

  // Handlers
  const handleSaveGeneral = async () => {
    if (!isCurrent() || savingGeneral) return
    if (!user?.collegeId) {
      setGeneralMsg({ type: 'err', text: 'No college ID found. Please contact support.' })
      return
    }
    setSavingGeneral(true)
    setGeneralMsg(null)
    try {
      const collegeRef = doc(db, 'colleges', user.collegeId)
      await setDoc(collegeRef, {
        name: collegeName,
        academicYear,
        semesterStart,
        semesterEnd,
        passPercentage: Number(passPercentage),
        settings: {
          academicYear,
          semesterStart,
          semesterEnd,
          passPercentage: Number(passPercentage),
          autoBackup,
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      if (isCurrent()) setGeneralMsg({ type: 'ok', text: 'General settings saved successfully!' })
    } catch (e: any) {
      if (isCurrent()) setGeneralMsg({ type: 'err', text: e.message || 'Failed to save general settings' })
    } finally {
      if (isCurrent()) setSavingGeneral(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !isCurrent() || savingProfile) return
    if (fullName.trim().length < 2) {
      setProfileMsg({ type: 'err', text: 'Full name must have at least 2 characters' })
      return
    }
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const result = await updateMyStaffProfile(user.uid, { name: fullName.trim(), phone: phone.trim() })
      if (isCurrent()) setProfileMsg({ type: 'ok', text: result.authDisplayNameSynced
        ? 'Profile updated successfully!'
        : 'Profile saved. The sign-in display name could not sync; save again to retry.' })
    } catch (error: unknown) {
      if (isCurrent()) setProfileMsg({ type: 'err', text: error instanceof Error ? error.message : 'Failed to update profile' })
    } finally {
      if (isCurrent()) setSavingProfile(false)
    }
  }

  // Push toggle must actually ask the browser — before, it only flipped a flag.
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  )
  const handleTogglePush = async (value: boolean) => {
    if (!isCurrent() || savingNotifications) return
    if (!value) { updateNotification('pushEnabled', false); return }
    if (!('Notification' in window)) {
      setPushPermission('unsupported')
      setNotificationMsg({ type: 'err', text: 'This browser does not support notifications.' })
      return
    }
    let perm = Notification.permission
    try {
      if (perm === 'default') perm = await Notification.requestPermission()
    } catch {
      if (isCurrent()) setNotificationMsg({ type: 'err', text: 'Notification permission could not be requested. Try again from your browser settings.' })
      return
    }
    if (!isCurrent()) return
    setPushPermission(perm)
    if (perm !== 'granted') {
      updateNotification('pushEnabled', false)
      setNotificationMsg({ type: 'err', text: 'Notifications are blocked for this site. Allow them in your browser settings and try again.' })
      return
    }
    updateNotification('pushEnabled', true)
    try {
      new Notification('Vriddhi notifications enabled', { body: 'You will see alerts on this device.', icon: '/favicon.ico' })
    } catch {
      // Some mobile browsers only allow notifications via a service worker.
      navigator.serviceWorker?.ready.then((reg) => { if (isCurrent()) return reg.showNotification('Vriddhi notifications enabled', { body: 'You will see alerts on this device.' }) }).catch(() => undefined)
    }
  }

  const handleSaveNotifications = async () => {
    if (!user || !isCurrent() || savingNotifications || loadError) return
    setSavingNotifications(true)
    setNotificationMsg(null)
    try {
      await updateMyStaffProfile(user.uid, { notificationPrefs: notifications })
      if (!isCurrent()) return
      cacheAccountPreferences('vriddhi_admin_notifications', user.uid, ADMIN_NOTIFICATION_DEFAULTS, notifications)
      setNotificationMsg({ type: 'ok', text: 'Notification preferences saved!' })
    } catch (error: unknown) {
      if (isCurrent()) setNotificationMsg({ type: 'err', text: error instanceof Error ? error.message : 'Failed to save preferences' })
    } finally {
      if (isCurrent()) setSavingNotifications(false)
    }
  }

  const handleExportJSON = async () => {
    if (!isCurrent()) return
    try {
      if (!user?.collegeId) throw new Error('No college ID')
      const collegeId = user.collegeId
      // Fetch college data
      const collegeSnap = await getDoc(doc(db, 'colleges', collegeId))
      if (!isCurrent()) return
      const collegeData = collegeSnap.exists() ? collegeSnap.data() : {}

      // Fetch students
      let students: any[] = []
      {
        const q = query(collection(db, 'students'), where('collegeId', '==', collegeId))
        const snap = await getDocs(q)
        if (!isCurrent()) return
        students = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }

      // Fetch faculty
      let faculty: any[] = []
      {
        const q = query(collection(db, 'faculty'), where('collegeId', '==', collegeId))
        const snap = await getDocs(q)
        if (!isCurrent()) return
        faculty = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }

      const exportData = {
        college: collegeData,
        students,
        faculty,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vriddhi-backup-${collegeId}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      if (isCurrent()) showError(`Export failed: ${e.message}`)
    }
  }

  const handleExportCSV = async () => {
    if (!isCurrent()) return
    try {
      if (!user?.collegeId) throw new Error('No college ID')
      const collegeId = user.collegeId
      let students: any[] = []
      {
        const q = query(collection(db, 'students'), where('collegeId', '==', collegeId))
        const snap = await getDocs(q)
        if (!isCurrent()) return
        students = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }

      if (students.length === 0) {
        showWarning('No students found to export')
        return
      }
      const headers = ['id', 'name', 'email', 'department', 'course', 'batch', 'regNo']
      const rows = students.map((s: any) => headers.map(h => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vriddhi-students-${collegeId}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      if (isCurrent()) showError(`Export failed: ${e.message}`)
    }
  }

  if (!user) return <p role="alert">Sign in to manage your settings.</p>

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your college and personal preferences</p>
      </div>

      {loadError && <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        Cloud settings could not be loaded: {loadError}{' '}
        <button type="button" disabled={savingProfile || savingNotifications || savingGeneral} className="font-bold underline" onClick={() => setReloadKey(key => key + 1)}>Retry</button>
      </div>}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl">
        {/* Sidebar Tabs */}
        <div className="lg:w-72 flex-shrink-0">
          <SettingsCard className="p-2">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </SettingsCard>

          <div className="mt-4 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {resolvedMode === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Currently in {resolvedMode} mode • {user?.collegeId ? `College ${user.collegeId.slice(0, 6)}` : 'No college'}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* ===== GENERAL ===== */}
          {activeTab === 'general' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>General Settings</SectionTitle>
              <SectionDesc>Configure your college and academic preferences. Changes are saved to your college profile in Firestore.</SectionDesc>

              <div className="space-y-6">
                {user?.collegeId && ['principal', 'admin', 'superadmin'].includes(String(user?.role)) && (
                  <div className="pb-6 border-b border-slate-200 dark:border-slate-700/50">
                    <CollegeBrandingUpload collegeId={user.collegeId} />
                  </div>
                )}
                <div>
                  <Label>College Name</Label>
                  <SettingsInput
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="Enter college name"
                  />
                </div>

                <div>
                  <Label>Academic Year</Label>
                  <SettingsInput
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g., 2026-2027"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Semester Start</Label>
                    <SettingsInput
                      type="date"
                      value={semesterStart}
                      onChange={(e) => setSemesterStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Semester End</Label>
                    <SettingsInput
                      type="date"
                      value={semesterEnd}
                      onChange={(e) => setSemesterEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Default Pass Percentage</Label>
                  <div className="relative">
                    <SettingsInput
                      type="number"
                      value={passPercentage}
                      onChange={(e) => setPassPercentage(e.target.value)}
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                  </div>
                </div>

                {generalMsg && <Message type={generalMsg.type} text={generalMsg.text} />}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={savingGeneral}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20"
                  >
                    {savingGeneral ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Cohort vocabulary — the sections and semesters this college
                  runs. Academic setup belongs to the college, so principal /
                  admin can edit it; the server-side validators and every
                  onboarding screen read from this one document. */}
              {user?.collegeId && ['principal', 'admin', 'superadmin'].includes(String(user?.role)) && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                  <CohortConfigPanel
                    collegeId={user.collegeId}
                    canEdit={['principal', 'admin', 'superadmin'].includes(String(user?.role))}
                    embedded
                  />
                </div>
              )}

              {/* Placement prep visibility and course assignments are PLATFORM
                  controls. The Vriddhi superadmin decides which company guides
                  and course packs a college's learners see — college staff
                  (principal / HOD / admin) get a pointer instead of the
                  switches, mirroring how the Resume Builder add-on is governed.
                  Server side: the prep settings API and the Firestore rules for
                  colleges/{id}/config/courses both enforce superadmin-only
                  writes, so this is convenience rather than the boundary. */}
              {user?.role === 'superadmin' && user?.collegeId && (
                <>
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <CompanyPrepVisibilityPanel collegeId={user.collegeId} collegeName={collegeName} embedded />
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <CourseAssignmentPanel collegeId={user.collegeId} collegeName={collegeName} embedded />
                  </div>
                </>
              )}
              {user?.role && user.role !== 'superadmin' && ['admin', 'principal', 'hod'].includes(user.role) && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-4 py-3">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Company-specific placement prep and course assignments are managed by the Vriddhi platform team.</span>{' '}
                      To switch a company guide or course pack on or off for your college, please contact the platform superadmin.
                    </p>
                  </div>
                </div>
              )}

              {/* Resume Builder add-on — read-only for the college (uptake +
                  what is switched on); a superadmin enables it per college. */}
              {user?.collegeId && ['admin', 'principal', 'superadmin'].includes(user.role) && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                  <ResumeAddonPanel collegeId={user.role === 'superadmin' ? user.collegeId : undefined} collegeName={collegeName} canEdit={user.role === 'superadmin'} embedded />
                </div>
              )}
            </SettingsCard>
          )}

          {/* ===== PROFILE ===== */}
          {activeTab === 'profile' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>Profile Settings</SectionTitle>
              <SectionDesc>Manage your personal information and account details</SectionDesc>

              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-teal-500/10 dark:bg-teal-900/30 flex items-center justify-center text-3xl font-bold text-teal-600 dark:text-teal-400 border-2 border-teal-500/20">
                    {fullName.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{fullName || 'Admin User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>
                    <p className="text-xs text-slate-400">JPG, PNG or GIF. Max 2MB. Avatar upload coming soon.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <SettingsInput
                      type="text"
                      maxLength={100}
                      disabled={savingProfile}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <SettingsInput
                      type="email"
                      value={email}
                      disabled
                      className="cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Email is managed by authentication system</p>
                  </div>
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <SettingsInput
                    type="tel"
                    maxLength={32}
                    disabled={savingProfile}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <Label>Role</Label>
                  <SettingsInput type="text" value={role} disabled />
                  <p className="text-xs text-slate-500 mt-1">Contact super admin to change your role</p>
                </div>

                {profileMsg && <Message type={profileMsg.type} text={profileMsg.text} />}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Profile
                  </button>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === 'notifications' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>Notification Preferences</SectionTitle>
              <SectionDesc>Choose how and when you want to be notified. Preferences are saved to your account; the browser keeps an optional account-specific cache.</SectionDesc>

              <div className="mb-4"><EmailSettingsCard /></div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-900/30 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">Push Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enable push notifications on this device
                        {' · '}
                        <span className={pushPermission === 'granted' ? 'text-emerald-600' : pushPermission === 'denied' ? 'text-rose-600' : 'text-amber-600'}>
                          {pushPermission === 'granted' ? 'Browser permission granted'
                            : pushPermission === 'denied' ? 'Blocked in browser settings — allow notifications for this site'
                            : pushPermission === 'unsupported' ? 'Not supported on this browser'
                            : 'Browser permission not yet granted'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    label="Push Notifications"
                    disabled={savingNotifications || !!loadError}
                    checked={notifications.pushEnabled}
                    onChange={handleTogglePush}
                  />
                </div>

                <div className="pt-2 space-y-3">
                  {[
                    { key: 'emailAssessments', label: 'Email notifications for new assessments', icon: Mail, desc: 'Get notified when new assessments are created' },
                    { key: 'smsAttendance', label: 'SMS alerts for low attendance', icon: Smartphone, desc: 'Receive SMS when attendance drops below threshold' },
                    { key: 'weeklyReports', label: 'Weekly performance reports', icon: FileText, desc: 'Summary of weekly academic performance' },
                    { key: 'milestoneAlerts', label: 'Student milestone alerts', icon: Calendar, desc: 'Notifications for student achievements' },
                    { key: 'maintenance', label: 'System maintenance notifications', icon: AlertTriangle, desc: 'Planned downtime and updates' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        label={item.label}
                        disabled={savingNotifications || !!loadError}
                        checked={notifications[item.key as keyof typeof notifications]}
                        onChange={(v) => updateNotification(item.key, v)}
                      />
                    </div>
                  ))}
                </div>

                {notificationMsg && <Message type={notificationMsg.type} text={notificationMsg.text} />}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={savingNotifications || !!loadError}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20"
                  >
                    {savingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Preferences
                  </button>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === 'security' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>Security Settings</SectionTitle>
              <SectionDesc>Manage your password and account security</SectionDesc>

              <div className="space-y-6">
                {/* Shared flow: verifies the CURRENT password via Firebase
                    re-authentication (the old local form collected it but
                    never checked it), enforces the platform 10-char floor,
                    and clears the mustChangePassword claim server-side. */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Change Password</h4>
                  <ChangePasswordForm bare />
                </div>

                <AccountSecurityNotice showSessions />
              </div>
            </SettingsCard>
          )}

          {/* ===== APPEARANCE ===== */}
          {activeTab === 'appearance' && (
            <SettingsCard className="p-6 md:p-8">
              <AppearanceSettings
                legacyAppearance={legacyAppearance?.uid === user?.uid ? legacyAppearance?.value : undefined}
                showCompactMode
                showAnimations
              />
            </SettingsCard>
          )}

          {/* ===== DATA & BACKUP ===== */}
          {activeTab === 'data' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>Data & Backup</SectionTitle>
              <SectionDesc>Export, import, and manage your data. Exports are generated from live Firestore data.</SectionDesc>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Export All Data</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Download a complete backup of college, student records, faculty, and settings as JSON or CSV.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <FileText className="w-4 h-4" />
                          Export Students CSV
                        </button>
                        <button onClick={handleExportJSON} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors shadow-sm">
                          <Download className="w-4 h-4" />
                          Export Full JSON
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Import Data</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Import student records, faculty data, or attendance from CSV or Excel files. Use the dedicated import pages for bulk operations.
                      </p>
                      <div className="flex gap-2">
                        <a href="/admin/students" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          Go to Students Import
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Automatic Backups</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Choose the college backup preference. Use Save Changes on the General tab to save it to your college.
                      </p>
                      <SettingsSelect aria-label="Automatic backup frequency" value={autoBackup} onChange={(e) => setAutoBackup(e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="never">Never</option>
                      </SettingsSelect>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger Zone</h4>
                      <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
                        These actions are irreversible. Proceed with caution. Clearing local data will remove cached preferences.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => {
                          if (confirm('Clear all local cached data? This will remove theme, notification prefs, etc.')) {
                            try {
                              localStorage.clear()
                              showSuccess('Local data cleared. Please refresh.')
                            } catch { showError('Browser storage is unavailable; the cache could not be cleared.') }
                          }
                        }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                          Clear Local Cache
                        </button>
                        <button disabled={resettingAppearance} onClick={async () => {
                          if (!isCurrent() || !user?.uid || resettingAppearance || !confirm('Reset appearance to defaults?')) return
                          setResettingAppearance(true)
                          applyLocalAppearance(user.uid, { ...DEFAULT_APPEARANCE })
                          setMode('light')
                          try {
                            await saveAppearancePreferences(user.uid, { ...DEFAULT_APPEARANCE })
                            if (isCurrent()) showSuccess('Appearance reset to defaults')
                          } catch {
                            if (isCurrent()) showError('Appearance was reset on this device, but could not be synced. Try again.')
                          } finally {
                            if (isCurrent()) setResettingAppearance(false)
                          }
                        }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60">
                          Reset Appearance
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* AI Content & Cost — internal (superadmin-only) spend meter, limits, exam freezes, pre-warm */}
          {activeTab === 'ai-content' && user?.role === 'superadmin' && <AiStudyContentTab />}
        </div>
      </div>
    </div>
  )
}
