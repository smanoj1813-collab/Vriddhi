// src/pages/student/StudentSettings.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Save, ChevronRight } from 'lucide-react';

export default function StudentSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
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

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-xl border border-slate-700/30 p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Full Name</label>
                      <input type="text" defaultValue="Priya Sharma" className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Registration Number</label>
                      <input type="text" defaultValue="R2024001" disabled className="w-full px-4 py-2.5 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Email</label>
                      <input type="email" defaultValue="priya.sharma@vriddhi.edu" className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Phone</label>
                      <input type="tel" defaultValue="+91 98765 43210" className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
                  {[
                    { label: 'Exam & Assessment Alerts', desc: 'Get notified about upcoming exams and results' },
                    { label: 'Fee Payment Reminders', desc: 'Reminders for fee due dates and payments' },
                    { label: 'Assignment Deadlines', desc: 'Alerts for upcoming assignment submissions' },
                    { label: 'College Events', desc: 'Updates about cultural fests and seminars' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Privacy & Security</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Current Password</label>
                      <input type="password" placeholder="Enter current password" className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">New Password</label>
                      <input type="password" placeholder="Enter new password" className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Confirm New Password</label>
                      <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Appearance</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-700/30">
                      <div>
                        <p className="text-sm font-medium text-white">Dark Mode</p>
                        <p className="text-xs text-slate-400">Currently using dark theme</p>
                      </div>
                      <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-700/30">
                      <div>
                        <p className="text-sm font-medium text-white">Compact Mode</p>
                        <p className="text-xs text-slate-400">Reduce spacing for more content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-700/30 flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
