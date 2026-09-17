// prep-app/src/components/Navbar.tsx
import React, { useState } from 'react';
import {
  GraduationCap, BookOpen, User, LogOut, CheckCircle2,
  Sparkles, Flame, Shield, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  PREP_PROGRAM_CATALOG,
  getPrepProgramsForLevel,
  type PrepDegreeLevel,
} from '../../../functions/src/prepShared';

interface NavbarProps {
  onOpenAuth: () => void;
  onHomeClick: () => void;
  selectedProgram: string;
  onSelectProgram: (prog: string) => void;
  degreeLevel: PrepDegreeLevel;
  onSelectDegreeLevel: (level: PrepDegreeLevel) => void;
}

const DEGREE_LEVELS: Array<{ id: PrepDegreeLevel; label: string }> = [
  { id: 'undergraduate', label: 'Undergraduate' },
  { id: 'postgraduate', label: 'Postgraduate' },
];

export default function Navbar({
  onOpenAuth,
  onHomeClick,
  selectedProgram,
  onSelectProgram,
  degreeLevel,
  onSelectDegreeLevel,
}: NavbarProps) {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const activeProgram =
    PREP_PROGRAM_CATALOG.find((p) => p.code === selectedProgram) ?? null;
  const programsForLevel = getPrepProgramsForLevel(degreeLevel);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={onHomeClick}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-all">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Vriddhi<span className="text-teal-600 dark:text-teal-400">Prep</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 uppercase tracking-wider">
                  {activeProgram ? `${activeProgram.code} Hub` : 'Prep Hub'}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 -mt-0.5">
                {activeProgram ? activeProgram.fullName : 'Karnataka NEP Prep'}
              </p>
            </div>
          </button>

          {/* Degree Level Toggle + Program Switcher */}
          <div className="hidden md:flex items-center gap-2">
            <div
              role="group"
              aria-label="Degree level"
              className="flex items-center bg-teal-50 dark:bg-teal-950/40 p-1 rounded-xl text-xs font-bold border border-teal-200 dark:border-teal-900"
            >
              {DEGREE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => onSelectDegreeLevel(level.id)}
                  aria-pressed={degreeLevel === level.id}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    degreeLevel === level.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">
              {programsForLevel.map((prog) => (
                <button
                  key={prog.code}
                  onClick={() => onSelectProgram(prog.code)}
                  title={prog.fullName}
                  aria-pressed={selectedProgram === prog.code}
                  className={`px-3 py-1 rounded-lg uppercase transition-all ${
                    selectedProgram === prog.code
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {prog.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Auth & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>NEP 2020 Aligned</span>
          </div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'S'}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 text-xs space-y-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'B2C Student'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      B2C Learner
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              Sign In / Join Free
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
