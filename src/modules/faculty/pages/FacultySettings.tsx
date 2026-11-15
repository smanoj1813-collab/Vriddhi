import { useEffect, useMemo, useState } from 'react'
import AppearanceSettings from '@/shared/components/AppearanceSettings'
import ChangePasswordForm from '@/shared/components/ChangePasswordForm'
import { User, Bell, Shield, Palette, Save, Loader2, Check, Mail, Building2, Phone, GraduationCap } from 'lucide-react'
import { updateProfile as updateFirebaseProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth } from '@/Firebase/config'
import { db } from '@/Firebase/data'
import { useAuth } from '../../auth/context/AuthContext'

type TabId = 'profile' | 'notifications' | 'security' | 'appearance'

interface Prefs {
  classes: boolean
  attendance: boolean
  assignments: boolean
  announcements: boolean
}

const DEFAULT_PREFS: Prefs = { classes: true, attendance: true, assignments: true, announcements: true }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('vriddhi_faculty_prefs')
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all ${checked ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function FacultySettings() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<TabId>('profile')
  const [loading, setLoading] = useState(true)

  // Profile
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Notifications
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsError, setPrefsError] = useState<string | null>(null)

  // Security
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)

  // Retain existing cloud values as read-only migration fallbacks.
  const [legacyAppearance, setLegacyAppearance] = useState<{ uid: string; value: unknown } | null>(null)

  const tabs = useMemo(() => [
    { id: 'profile' as const, label: 'Profile Details', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ], [])

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        setFullName(user.name || '')
        setEmail(user.email || '')
        setPhone(user.phone || '')
        setDepartment(user.department || '')
        setCollegeId(user.collegeId || '')

        // Try to load faculty doc
        try {
          const ref = doc(db, 'faculty', user.uid)
          const snap = await getDoc(ref)
          if (snap.exists()) {
            const data = snap.data() as any
            setFullName(`${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || user.name || '')
            setEmail(data.email || user.email || '')
            setPhone(data.phone || user.phone || '')
            setDepartment(data.department || user.department || '')
            setCollegeId(data.collegeId || user.collegeId || '')
            if (data.notificationPrefs) setPrefs(prev => ({ ...prev, ...data.notificationPrefs }))
            if (typeof data.twoFAEnabled === 'boolean') setTwoFAEnabled(data.twoFAEnabled)
            if (data.appearance) setLegacyAppearance({ uid: user.uid, value: data.appearance })
          }
        } catch { }

        // Local prefs (this account's keys only)
        try {
          const local2FA = localStorage.getItem('vriddhi_faculty_2fa')
          if (local2FA) setTwoFAEnabled(local2FA === 'true')
        } catch { }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setProfileMsg({ type: 'err', text: 'Full name cannot be empty' })
      return
    }
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: fullName.trim() })
      }
      if (user?.uid) {
        const ref = doc(db, 'faculty', user.uid)
        // Split name into first/last for compatibility
        const parts = fullName.trim().split(' ')
        const firstName = parts[0] || ''
        const lastName = parts.slice(1).join(' ') || ''
        await setDoc(ref, {
          firstName,
          lastName,
          name: fullName.trim(),
          phone: phone.trim(),
          department,
          updatedAt: new Date().toISOString(),
        }, { merge: true })
      }
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully!' })
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message || 'Failed to update profile' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    setPrefsSaved(false)
    setPrefsError(null)
    try {
      localStorage.setItem('vriddhi_faculty_prefs', JSON.stringify(prefs))
      if (user?.uid) {
        await setDoc(doc(db, 'faculty', user.uid), { notificationPrefs: prefs, updatedAt: new Date().toISOString() }, { merge: true })
      }
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2500)
    } catch (err: any) {
      setPrefsError(err.message || 'Failed to sync notification preferences. Please try again.')
    } finally {
      setSavingPrefs(false)
    }
  }

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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
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
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
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
                <div className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${profileMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300'}`}>
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
                    <Toggle checked={prefs[item.key]} onChange={v => setPrefs({ ...prefs, [item.key]: v })} />
                  </div>
                ))}
              </div>

              {prefsError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{prefsError}</p>}
              <div className="flex items-center gap-3 pt-3">
                <button onClick={handleSavePrefs} disabled={savingPrefs} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs md:text-sm flex items-center gap-2">
                  {savingPrefs ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Preferences
                </button>
                {prefsSaved && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={14} /> Saved!</span>}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <ChangePasswordForm />

              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Add extra security layer</p>
                    </div>
                  </div>
                  <Toggle checked={twoFAEnabled} onChange={async v => {
                    setTwoFAEnabled(v)
                    localStorage.setItem('vriddhi_faculty_2fa', String(v))
                    if (user?.uid) {
                      try { await setDoc(doc(db, 'faculty', user.uid), { twoFAEnabled: v }, { merge: true }) } catch { }
                    }
                  }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <AppearanceSettings
              legacyAppearance={legacyAppearance?.uid === user?.uid ? legacyAppearance?.value : undefined}
              showCompactMode
            />
          )}
        </div>
      </div>
    </div>
  )
}
