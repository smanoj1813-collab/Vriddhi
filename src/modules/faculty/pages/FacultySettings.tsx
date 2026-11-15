import { useEffect, useMemo, useState } from 'react'
import AppearanceSettings from '@/shared/components/AppearanceSettings'
import ChangePasswordForm from '@/shared/components/ChangePasswordForm'
import { User, Bell, Shield, Palette, Save, Loader2, Check, Mail, Building2, Phone, GraduationCap } from 'lucide-react'
import { useAuth, type AppUser } from '../../auth/context/AuthContext'
import AccountSecurityNotice from '@/shared/components/AccountSecurityNotice'
import { getMyStaffSettings, updateMyStaffProfile } from '@/shared/services/staffProfile'
import { useAccountScope } from '@/shared/hooks/useAccountScope'
import { booleanPreferences, cacheAccountPreferences, readAccountPreferences, FACULTY_NOTIFICATION_DEFAULTS } from '@/shared/utils/accountPreferences'

type TabId = 'profile' | 'notifications' | 'security' | 'appearance'

type Prefs = typeof FACULTY_NOTIFICATION_DEFAULTS
const DEFAULT_PREFS = FACULTY_NOTIFICATION_DEFAULTS
const PREFS_KEY = 'vriddhi_faculty_prefs'

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all ${checked ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function FacultySettings() {
  const { user } = useAuth()
  return <FacultyAccountSettings key={user?.uid || 'signed-out'} user={user} />
}

function FacultyAccountSettings({ user }: { user: AppUser | null }) {
  const isCurrent = useAccountScope(user?.uid)
  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [fullName, setFullName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [collegeId, setCollegeId] = useState(user?.collegeId || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [prefs, setPrefs] = useState<Prefs>(() => readAccountPreferences(PREFS_KEY, user?.uid, DEFAULT_PREFS))
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsError, setPrefsError] = useState<string | null>(null)
  const [legacyAppearance, setLegacyAppearance] = useState<unknown>()

  const tabs = useMemo(() => [
    { id: 'profile' as const, label: 'Profile Details', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ], [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    if (!user) { setLoading(false); return }
    getMyStaffSettings().then(data => {
      if (cancelled || !isCurrent()) return
      if (data.uid !== user.uid) throw new Error('Your account changed. Reload settings.')
      setFullName(data.name || user.name || '')
      setEmail(data.email || user.email || '')
      setPhone(data.phone)
      setDepartment(data.department)
      setCollegeId(data.collegeId || '')
      setPrefs(booleanPreferences(DEFAULT_PREFS, data.notificationPrefs ?? readAccountPreferences(PREFS_KEY, user.uid, DEFAULT_PREFS)))
      setLegacyAppearance(data.appearance)
    }).catch((error: unknown) => {
      if (!cancelled && isCurrent()) setLoadError(error instanceof Error ? error.message : 'Unable to load your cloud settings. Try again.')
    }).finally(() => {
      if (!cancelled && isCurrent()) setLoading(false)
    })
    return () => { cancelled = true }
  }, [user, isCurrent, reloadKey])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCurrent() || !user || savingProfile) return
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

  const handleSavePrefs = async () => {
    if (!isCurrent() || !user || savingPrefs || loadError) return
    setSavingPrefs(true)
    setPrefsSaved(false)
    setPrefsError(null)
    try {
      await updateMyStaffProfile(user.uid, { notificationPrefs: prefs })
      if (!isCurrent()) return
      cacheAccountPreferences(PREFS_KEY, user.uid, DEFAULT_PREFS, prefs)
      setPrefsSaved(true)
    } catch (error: unknown) {
      if (isCurrent()) setPrefsError(error instanceof Error ? error.message : 'Failed to sync notification preferences. Please try again.')
    } finally {
      if (isCurrent()) setSavingPrefs(false)
    }
  }

  if (!user) return <p role="alert">Sign in to manage your settings.</p>

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Faculty Settings</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your faculty profile, notifications, security and appearance</p>
      </div>

      {loadError && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        Cloud settings could not be loaded: {loadError}{' '}
        <button type="button" disabled={savingProfile || savingPrefs} className="font-bold underline" onClick={() => setReloadKey(key => key + 1)}>Retry</button>
      </div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1 md:col-span-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all text-left ${active ? 'bg-teal-600 text-white shadow-sm' : 'bg-white dark:bg-[#131b2e] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
          <div className="hidden md:block mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Faculty Info</p>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2"><Building2 size={12} /> Dept: {department || '—'}</div>
              <div className="flex items-center gap-2"><GraduationCap size={12} /> College: {collegeId ? collegeId.slice(0, 8) + '...' : '—'}</div>
              <div className="flex items-center gap-2"><Mail size={12} /> {email || '—'}</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Profile Details</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Update your personal information. Email and college are managed by admin.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {fullName.charAt(0)?.toUpperCase() || 'F'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{fullName || 'Faculty User'}</p>
                  <p className="text-xs text-slate-500">{email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label htmlFor="faculty-full-name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input id="faculty-full-name" maxLength={100} disabled={savingProfile} value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input disabled value={email} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="faculty-phone" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input id="faculty-phone" maxLength={32} disabled={savingProfile} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">Department</label>
                    <input disabled value={department} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 cursor-not-allowed" />
                    <p className="text-[11px] text-slate-400 mt-1">Contact admin to change department</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">College ID</label>
                    <input disabled value={collegeId} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {profileMsg && (
                <div role={profileMsg.type === 'err' ? 'alert' : 'status'} className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${profileMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300'}`}>
                  {profileMsg.type === 'ok' ? <Check size={14} /> : <Shield size={14} />} {profileMsg.text}
                </div>
              )}

              <button type="submit" disabled={savingProfile} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs md:text-sm flex items-center gap-2">
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your faculty alerts and reminders.</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { key: 'classes' as const, label: 'Class Schedule Updates', desc: 'Notifications for schedule changes and rescheduling' },
                  { key: 'attendance' as const, label: 'Attendance Reminders', desc: 'Daily reminders to mark attendance' },
                  { key: 'assignments' as const, label: 'Assignment Submissions', desc: 'Alerts when students submit assignments' },
                  { key: 'announcements' as const, label: 'College Announcements', desc: 'Important announcements from administration' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="pr-4">
                      <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle label={item.label} disabled={savingPrefs || !!loadError} checked={prefs[item.key]} onChange={v => { setPrefs({ ...prefs, [item.key]: v }); setPrefsSaved(false); setPrefsError(null) }} />
                  </div>
                ))}
              </div>

              {prefsError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{prefsError}</p>}
              <div className="flex items-center gap-3 pt-3">
                <button onClick={handleSavePrefs} disabled={savingPrefs || !!loadError} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs md:text-sm flex items-center gap-2">
                  {savingPrefs ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Preferences
                </button>
                {prefsSaved && <span role="status" className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={14} /> Saved!</span>}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <ChangePasswordForm />

              <AccountSecurityNotice />
            </div>
          )}

          {activeTab === 'appearance' && (
            <AppearanceSettings
              legacyAppearance={legacyAppearance}
              showCompactMode
            />
          )}
        </div>
      </div>
    </div>
  )
}
