import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Save, ChevronRight, Loader2, Check, Lock, Phone, Mail } from 'lucide-react';
import { updatePassword, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/Firebase/config';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useAuth } from '../../auth/context/AuthContext';
import { useThemeMode } from '../../../shared/contexts/ThemeProvider';

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
  const { resolvedMode, toggleMode } = useThemeMode();

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const tabs = useMemo(
    () => [
      { id: 'profile' as const, label: 'Profile Details', icon: User },
      { id: 'notifications' as const, label: 'Alert Preferences', icon: Bell },
      { id: 'privacy' as const, label: 'Security & Password', icon: Shield },
      { id: 'appearance' as const, label: 'Appearance & Theme', icon: Palette },
    ],
    []
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: name });
      }
      if (profile?.id && profile?.collegeId) {
        await updateDoc(doc(db, 'colleges', profile.collegeId, 'students', profile.id), {
          name,
          phone,
          updatedAt: new Date().toISOString(),
        });
      }
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrefs = () => {
    localStorage.setItem('vriddhi_notification_prefs', JSON.stringify(prefs));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'Password must be at least 6 characters.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordMsg({ type: 'ok', text: 'Password updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'err', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage personal profile, notifications, password and app preferences</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tabs Sidebar */}
        <div className="space-y-1 md:col-span-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all text-left ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : 'bg-white dark:bg-[#131b2e] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <Icon size={16} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="md:col-span-3 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-sm font-medium cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Email is managed by college administration.</span>
                </div>
              </div>

              {profileMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${profileMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {profileMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs md:text-sm shadow-sm transition-all flex items-center gap-2"
              >
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Notification Preferences
              </h2>

              <div className="space-y-3">
                {[
                  { key: 'exams' as const, label: 'Exam & Assessment Reminders', desc: 'Get notified when new tests are published or deadlines approach.' },
                  { key: 'assignments' as const, label: 'Assignment Deadlines', desc: 'Alerts for upcoming homework submissions and teacher remarks.' },
                  { key: 'fees' as const, label: 'Fee Invoices & Dues', desc: 'Reminders for fee term deadlines and cleared payment receipts.' },
                  { key: 'events' as const, label: 'Campus Events & Workshops', desc: 'Updates regarding university workshops, webinars and fests.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs[item.key]}
                      onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleSavePrefs}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs md:text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <Save size={16} /> Save Notification Preferences
                </button>
                {prefsSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check size={14} /> Saved!
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Security &amp; Password
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {passwordMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${passwordMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {passwordMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs md:text-sm shadow-sm transition-all flex items-center gap-2"
              >
                {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Update Password
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Interface Appearance
              </h2>

              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Vriddhi defaults to a clean light academic palette. You can toggle dark theme for low-light study sessions.
              </p>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs md:text-sm shadow-sm flex items-center gap-2"
                >
                  <Palette size={16} /> Switch to {resolvedMode === 'dark' ? 'Light Theme' : 'Dark Theme'}
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Currently active: <span className="font-bold uppercase text-teal-600">{resolvedMode} mode</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
