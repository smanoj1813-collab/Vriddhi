// src/pages/student/StudentSettings.tsx
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Save, ChevronRight, Loader2, Check } from 'lucide-react';
import { updatePassword, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/Firebase/config';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useAuth } from '../../auth/context/AuthContext';

type TabId = 'profile' | 'notifications' | 'privacy' | 'appearance';

interface Prefs {
  exams: boolean;
  fees: boolean;
  assignments: boolean;
  events: boolean;
}

const DEFAULT_PREFS: Prefs = { exams: true, fees: true, assignments: true, events: true };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('vriddhi_notification_prefs');
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function StudentSettings() {
  const { user } = useAuth();
  const { profile, loading } = useStudentProfile(user?.uid);

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAvatar(profile.avatar || '');
    }
  }, [profile]);

  const tabs = useMemo(
    () => [
      { id: 'profile' as TabId, label: 'Profile', icon: User },
      { id: 'notifications' as TabId, label: 'Notifications', icon: Bell },
      { id: 'privacy' as TabId, label: 'Privacy & Security', icon: Shield },
      { id: 'appearance' as TabId, label: 'Appearance', icon: Palette },
    ],
    []
  );

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updates: Record<string, unknown> = {
        name,
        phone,
        avatar,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'students', profile.id), updates);
      if (auth.currentUser && name && name !== auth.currentUser.displayName) {
        await updateFirebaseProfile(auth.currentUser, { displayName: name });
      }
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (err) {
      console.error('[Settings] profile update failed:', err);
      setProfileMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const togglePref = (key: keyof Prefs) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('vriddhi_notification_prefs', JSON.stringify(next));
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 1500);
      return next;
    });
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }
    if (!auth.currentUser) {
      setPasswordMsg({ type: 'err', text: 'No authenticated user found.' });
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMsg({ type: 'ok', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('[Settings] password change failed:', err);
      const code = err?.code || '';
      const text =
        code === 'auth/requires-recent-login'
          ? 'For your security, please log out and log in again before changing your password.'
          : err?.message || 'Failed to update password.';
      setPasswordMsg({ type: 'err', text });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  <ChevronRight size={14} className="text-slate-600" />
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Full Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Registration Number</label>
                      <input type="text" value={profile?.regNo || ''} disabled
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Email</label>
                      <input type="email" value={profile?.email || user?.email || ''} disabled
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Phone</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-slate-400 mb-2 block">Avatar URL</label>
                      <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…"
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50" />
                    </div>
                  </div>

                  {profileMsg && (
                    <p className={`text-sm ${profileMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{profileMsg.text}</p>
                  )}

                  <div className="flex justify-end">
                    <button onClick={handleSaveProfile} disabled={savingProfile}
                      className="px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-white font-medium transition-colors flex items-center gap-2">
                      {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {savingProfile ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
                    {prefsSaved && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={12} /> Saved</span>}
                  </div>
                  {[
                    { key: 'exams' as const, label: 'Exam & Assessment Alerts', desc: 'Upcoming exams and published results' },
                    { key: 'fees' as const, label: 'Fee Payment Reminders', desc: 'Due dates and payment confirmations' },
                    { key: 'assignments' as const, label: 'Assignment Deadlines', desc: 'New assignments and due reminders' },
                    { key: 'events' as const, label: 'College Events', desc: 'Cultural fests, workshops and seminars' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <Toggle checked={prefs[item.key]} onChange={() => togglePref(item.key)} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Current Password</label>
                      <input type="password" autoComplete="current-password" value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                      <p className="text-[11px] text-slate-500 mt-1">Only required if you signed in with email/password.</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">New Password</label>
                      <input type="password" autoComplete="new-password" value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Confirm New Password</label>
                      <input type="password" autoComplete="new-password" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                  </div>

                  {passwordMsg && (
                    <p className={`text-sm max-w-md ${passwordMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{passwordMsg.text}</p>
                  )}

                  <div className="flex justify-end">
                    <button onClick={handleChangePassword} disabled={savingPassword}
                      className="px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-white font-medium transition-colors flex items-center gap-2">
                      {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Appearance</h2>
                  <div className="flex items-center justify-between py-3 border-b border-slate-700/30">
                    <div>
                      <p className="text-sm font-medium text-white">Dark Mode</p>
                      <p className="text-xs text-slate-400">The student portal uses a dark theme by default.</p>
                    </div>
                    <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded">Active</span>
                  </div>
                  <p className="text-xs text-slate-500">Theme switching is not available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-700'}`}>
      <span
        className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

