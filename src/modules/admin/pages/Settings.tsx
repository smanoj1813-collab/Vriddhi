import React, { useState } from 'react'
import { useThemeMode } from '../../../shar../../shared/contexts/ThemeProvider'
import {
  Save, User, Building2, Bell, Shield, Palette, Database, Download,
  Sun, Moon, Monitor, Check, Upload, Trash2, AlertTriangle,
  Lock, Eye, EyeOff, Smartphone, Mail, FileText, Calendar
} from 'lucide-react'

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      {label && <span className="sr-only">{label}</span>}
    </button>
  )
}

// Card Component - adapts to light/dark
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

// Input Component - adapts to light/dark
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

// Select Component
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

// Section Title
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
      {children}
    </h3>
  )
}

// Section Description
function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
      {children}
    </p>
  )
}

// Label
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
      {children}
    </label>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const { mode, resolvedMode, setMode } = useThemeMode()

  // General state
  const [collegeName, setCollegeName] = useState('KGIS Institute of Technology')
  const [academicYear, setAcademicYear] = useState('2024-2025')
  const [semesterStart, setSemesterStart] = useState('2024-07-01')
  const [semesterEnd, setSemesterEnd] = useState('2024-12-15')
  const [passPercentage, setPassPercentage] = useState('40')

  // Profile state
  const [fullName, setFullName] = useState('Admin User')
  const [email, setEmail] = useState('admin@vriddhi.edu')
  const [phone, setPhone] = useState('+91 98765 43210')

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailAssessments: true,
    smsAttendance: true,
    weeklyReports: false,
    milestoneAlerts: true,
    maintenance: true,
    pushEnabled: true,
  })

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }

  // Security state
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)

  // Appearance state
  const [accentColor, setAccentColor] = useState('#14b8a6')
  const [fontSize, setFontSize] = useState('medium')
  const [compactMode, setCompactMode] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)

  const accentColors = [
    { color: '#14b8a6', name: 'Teal' },
    { color: '#6366f1', name: 'Indigo' },
    { color: '#f59e0b', name: 'Amber' },
    { color: '#ef4444', name: 'Red' },
    { color: '#8b5cf6', name: 'Violet' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#84cc16', name: 'Lime' },
  ]

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Backup', icon: Database },
  ]

  const handleSave = (section: string) => {
    // TODO: Connect to your backend/Firebase
    alert(`${section} settings saved!`)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your application preferences</p>
      </div>

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

          {/* Current Theme Indicator */}
          <div className="mt-4 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {resolvedMode === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Currently in {resolvedMode} mode
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* ===== GENERAL ===== */}
          {activeTab === 'general' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>General Settings</SectionTitle>
              <SectionDesc>Configure your college and academic preferences</SectionDesc>

              <div className="space-y-6">
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
                    placeholder="e.g., 2024-2025"
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
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <button
                    onClick={() => handleSave('General')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ===== PROFILE ===== */}
          {activeTab === 'profile' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>Profile Settings</SectionTitle>
              <SectionDesc>Manage your personal information and account details</SectionDesc>

              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center text-3xl font-bold text-teal-600 dark:text-teal-400 border-2 border-teal-500/20">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      Change Avatar
                    </button>
                    <p className="text-xs text-slate-400">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <SettingsInput
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <SettingsInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <SettingsInput
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <Label>Role</Label>
                  <SettingsInput type="text" value="Administrator" disabled />
                  <p className="text-xs text-slate-400 mt-1">Contact super admin to change your role</p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <button
                    onClick={() => handleSave('Profile')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20"
                  >
                    <Save className="w-4 h-4" />
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
              <SectionDesc>Choose how and when you want to be notified</SectionDesc>

              <div className="space-y-4">
                {/* Push Notifications Master Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">Push Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Enable push notifications on this device</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={notifications.pushEnabled}
                    onChange={(v) => updateNotification('pushEnabled', v)}
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
                          <p className="text-xs text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onChange={(v) => updateNotification(item.key, v)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <button
                    onClick={() => handleSave('Notification')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20"
                  >
                    <Save className="w-4 h-4" />
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
                {/* Password Change */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Change Password</h4>

                  <div className="relative">
                    <Label>Current Password</Label>
                    <SettingsInput
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div>
                    <Label>New Password</Label>
                    <SettingsInput
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    {newPassword && (
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              newPassword.length >= i * 2
                                ? newPassword.length >= 8
                                  ? 'bg-green-500'
                                  : 'bg-yellow-500'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Confirm New Password</Label>
                    <SettingsInput
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSave('Password')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20"
                  >
                    <Lock className="w-4 h-4" />
                    Update Password
                  </button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700/50 pt-6">
                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={twoFAEnabled}
                      onChange={setTwoFAEnabled}
                    />
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="border-t border-slate-200 dark:border-slate-700/50 pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Active Sessions</h4>
                  <div className="space-y-2">
                    {[
                      { device: 'Windows PC - Chrome', location: 'Mumbai, India', current: true, time: 'Active now' },
                      { device: 'iPhone 14 - Safari', location: 'Mumbai, India', current: false, time: '2 hours ago' },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {session.device}
                            {session.current && <span className="ml-2 text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">Current</span>}
                          </p>
                          <p className="text-xs text-slate-400">{session.location} · {session.time}</p>
                        </div>
                        {!session.current && (
                          <button className="text-xs text-red-500 hover:text-red-600 font-medium">
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ===== APPEARANCE ===== */}
          {activeTab === 'appearance' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>Appearance</SectionTitle>
              <SectionDesc>Customize how Vriddhi looks and feels</SectionDesc>

              <div className="space-y-6">
                {/* Theme Mode */}
                <div>
                  <Label>Theme Mode</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: Sun, desc: 'Always light' },
                      { id: 'dark', label: 'Dark', icon: Moon, desc: 'Always dark' },
                      { id: 'system', label: 'System', icon: Monitor, desc: 'Follow OS' },
                    ].map((theme) => {
                      const isActive = mode === theme.id
                      const Icon = theme.icon
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setMode(theme.id as 'light' | 'dark' | 'system')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                            ${isActive
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
                              : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                          <Icon className={`w-6 h-6 ${isActive ? 'text-teal-500' : 'text-slate-400'}`} />
                          <span className={`text-sm font-medium ${isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {theme.label}
                          </span>
                          <span className="text-xs text-slate-400">{theme.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex flex-wrap gap-3">
                    {accentColors.map((item) => (
                      <button
                        key={item.color}
                        onClick={() => setAccentColor(item.color)}
                        className={`group relative w-12 h-12 rounded-xl transition-all duration-200
                          ${accentColor === item.color
                            ? 'ring-2 ring-offset-2 ring-teal-500 ring-offset-white dark:ring-offset-slate-800 scale-110'
                            : 'hover:scale-105'
                          }`}
                        style={{ backgroundColor: item.color }}
                        title={item.name}
                      >
                        {accentColor === item.color && (
                          <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <Label>Font Size</Label>
                  <SettingsSelect
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  >
                    <option value="small">Small (14px)</option>
                    <option value="medium">Medium (16px)</option>
                    <option value="large">Large (18px)</option>
                  </SettingsSelect>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Compact Mode</p>
                      <p className="text-xs text-slate-400">Reduce spacing for denser layout</p>
                    </div>
                    <ToggleSwitch checked={compactMode} onChange={setCompactMode} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Animations</p>
                      <p className="text-xs text-slate-400">Enable smooth transitions and animations</p>
                    </div>
                    <ToggleSwitch checked={animationsEnabled} onChange={setAnimationsEnabled} />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <button
                    onClick={() => handleSave('Appearance')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-teal-500/20"
                  >
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </button>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ===== DATA & BACKUP ===== */}
          {activeTab === 'data' && (
            <SettingsCard className="p-6 md:p-8">
              <SectionTitle>Data & Backup</SectionTitle>
              <SectionDesc>Export, import, and manage your data</SectionDesc>

              <div className="space-y-4">
                {/* Export */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Export All Data</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Download a complete backup of all student records, assessments, attendance, and fee data.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <FileText className="w-4 h-4" />
                          Export as Excel
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <Download className="w-4 h-4" />
                          Export as JSON
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Import */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Import Data</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Import student records, faculty data, or attendance from CSV or Excel files.
                      </p>
                      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        Choose File
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto Backup */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">Automatic Backups</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Schedule automatic backups to cloud storage.
                      </p>
                      <SettingsSelect defaultValue="weekly">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="never">Never</option>
                      </SettingsSelect>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Danger Zone</h4>
                      <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
                        These actions are irreversible. Proceed with caution.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                          Clear All Data
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </div>
  )
}
