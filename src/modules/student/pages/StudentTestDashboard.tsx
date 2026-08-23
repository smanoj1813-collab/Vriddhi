// src/modules/student/pages/StudentTestDashboard.tsx
// Real assessments dashboard — reads studentAssessments via useStudentData.
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlayArrow, Schedule, CheckCircle, Cancel,
  TrendingUp, EmojiEvents, Visibility, CalendarToday,
  AccessTime, Assessment, Lock,
} from "@mui/icons-material";
import { MathRenderer } from '../components/MathRenderer';
import { useStudentData } from '../hooks/useStudentData';
import type { StudentTestCardData } from '../api/studentDataApi';

const TABS = [
  { key: "upcoming", label: "Upcoming", icon: <Schedule fontSize="small" />, color: "info" },
  { key: "active", label: "Active Now", icon: <PlayArrow fontSize="small" />, color: "success" },
  { key: "completed", label: "Completed", icon: <CheckCircle fontSize="small" />, color: "primary" },
  { key: "missed", label: "Missed", icon: <Cancel fontSize="small" />, color: "error" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function matchesTab(t: StudentTestCardData, tab: TabKey): boolean {
  if (tab === "upcoming") return t.status === "upcoming";
  if (tab === "active") return t.status === "available" || t.status === "ongoing";
  if (tab === "completed") return t.status === "completed" || t.status === "graded";
  if (tab === "missed") return t.status === "missed";
  return false;
}

function getTimeRemaining(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

const StudentTestDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tests, loading } = useStudentData();
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");

  const results = useMemo(
    () => tests.filter((t) => t.status === "completed" || t.status === "graded"),
    [tests]
  );

  const filteredTests = useMemo(
    () => tests.filter((t) => matchesTab(t, activeTab)),
    [tests, activeTab]
  );

  const completedCount = results.length;
  const passedCount = results.filter((r) => (r.percentage ?? 0) >= 40).length;
  const avgScore = results.length
    ? Math.round(results.reduce((a, b) => a + (b.percentage ?? 0), 0) / results.length)
    : 0;
  const upcomingCount = tests.filter((t) => t.status === "upcoming").length;

  const goInstructions = (id: string) => navigate(`/student/test/${id}/instructions`);
  const goResult = (id: string) => navigate(`/student/test/${id}/result`);

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Assessment className="text-teal-400" /> My Assessments
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          View upcoming tests, track your progress, and analyze your performance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile icon={<CheckCircle className="text-emerald-400" />} label="Completed" value={completedCount} subtitle={`${passedCount} passed`} />
        <StatTile icon={<TrendingUp className="text-sky-400" />} label="Average Score" value={`${avgScore}%`} subtitle="Across tests" />
        <StatTile icon={<EmojiEvents className="text-amber-400" />} label="Best Grade" value={results[0]?.grade || '—'} subtitle="Latest graded" />
        <StatTile icon={<Schedule className="text-indigo-400" />} label="Upcoming" value={upcomingCount} subtitle="Scheduled tests" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tests.filter((t) => matchesTab(t, tab.key)).length;
          const active = activeTab === tab.key;
          const colorMap: Record<string, string> = {
            info: 'text-sky-400 border-sky-400 bg-sky-400/10',
            success: 'text-emerald-400 border-emerald-400 bg-emerald-400/10',
            primary: 'text-teal-400 border-teal-400 bg-teal-400/10',
            error: 'text-red-400 border-red-400 bg-red-400/10',
          };
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active ? colorMap[tab.color] : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-800">{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="text-slate-600 flex justify-center mb-2">
              {activeTab === 'upcoming' ? <Schedule fontSize="large" /> :
               activeTab === 'active' ? <PlayArrow fontSize="large" /> :
               activeTab === 'completed' ? <CheckCircle fontSize="large" /> :
               <Cancel fontSize="large" />}
            </div>
            <p className="text-slate-300 font-medium">No {activeTab} tests</p>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'upcoming' && "You're all caught up! Check back later."}
              {activeTab === 'active' && 'No tests are currently in progress.'}
              {activeTab === 'completed' && 'Your completed tests will appear here.'}
              {activeTab === 'missed' && "Great job! You haven't missed any tests."}
            </p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <TestRow
              key={test.id}
              test={test}
              onStart={goInstructions}
              onResult={goResult}
            />
          ))
        )}
      </div>
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; subtitle: string }> =
  ({ icon, label, value, subtitle }) => (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">{icon}{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>
    </div>
  );

const TestRow: React.FC<{
  test: StudentTestCardData;
  onStart: (id: string) => void;
  onResult: (id: string) => void;
}> = ({ test, onStart, onResult }) => {
  const isActive = test.status === 'available' || test.status === 'ongoing';
  const isCompleted = test.status === 'completed' || test.status === 'graded';
  const isMissed = test.status === 'missed';
  const start = test.startDateTime ? new Date(test.startDateTime) : null;
  const pct = test.percentage ?? (test.totalMarks && test.marksObtained ? (test.marksObtained / test.totalMarks) * 100 : undefined);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-5 hover:border-slate-700 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">
            <MathRenderer text={test.title} inline />
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">{test.subject || 'Assessment'}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
            {test.totalQuestions ? <span>{test.totalQuestions} questions</span> : null}
            {test.duration ? <span>{test.duration} min</span> : null}
            {test.totalMarks ? <span>{test.totalMarks} marks</span> : null}
            {start && (
              <>
                <span className="flex items-center gap-1"><CalendarToday fontSize="inherit" /> {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><AccessTime fontSize="inherit" /> {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2">
          {isActive && (
            <button
              onClick={() => onStart(test.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium"
            >
              <PlayArrow fontSize="small" /> Start Test
            </button>
          )}
          {test.status === 'upcoming' && start && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs">
              <Schedule fontSize="small" /> Starts in {getTimeRemaining(test.startDateTime)}
            </span>
          )}
          {isMissed && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              <Cancel fontSize="small" /> Missed
            </span>
          )}
          {isCompleted && (
            <>
              <div className="text-right">
                <div className={`text-lg font-bold ${(pct ?? 0) >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {test.marksObtained ?? '—'}/{test.totalMarks || '—'}
                </div>
                <div className="text-xs text-slate-500">
                  {pct != null ? `${Math.round(pct)}%` : ''} {test.grade ? `• Grade ${test.grade}` : ''}
                </div>
              </div>
              <button
                onClick={() => onResult(test.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-teal-500/50 text-slate-300 text-xs"
              >
                <Visibility fontSize="small" /> View Result
              </button>
            </>
          )}
          {!isActive && !isCompleted && !isMissed && test.status !== 'upcoming' && (
            <Lock fontSize="small" className="text-slate-600" />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTestDashboard;
