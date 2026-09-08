// src/modules/admin/pages/AIAgentPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Send, Bot, User, Trash2,
  Users, FileText, AlertTriangle, ShieldCheck, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { db } from '@/Firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { sendAIChatMessage, type AIChatMessage } from '@/shared/services/aiChatService';
import ChatMarkdown from '@/shared/components/chat/ChatMarkdown';
import ChatActionPills from '@/shared/components/chat/ChatActionPills';
import CopyMessageButton from '@/shared/components/chat/CopyMessageButton';

/**
 * Admin AI Command Center.
 *
 * Open-ended by design: there is no canned-query carousel. Administrators type
 * any question, get a markdown-structured answer, and act on the role-checked
 * deep links attached to that answer.
 */
export default function AIAgentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Stats State
  const [stats, setStats] = useState({
    totalStudents: 0,
    defaultersCount: 0,
    totalFaculty: 0,
    totalQuestions: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const collegeId = user?.collegeId || '';

  useEffect(() => {
    async function loadLiveStats() {
      if (!collegeId) {
        setLoadingStats(false);
        return;
      }
      try {
        const [studentsSnap, facultySnap, attendanceSnap, questionsSnap] = await Promise.all([
          getDocs(collection(db, 'colleges', collegeId, 'students')),
          getDocs(collection(db, 'colleges', collegeId, 'faculty')),
          getDocs(collection(db, 'colleges', collegeId, 'attendanceSummary')),
          getDocs(collection(db, 'questions')),
        ]);

        let defaulters = 0;
        attendanceSnap.forEach(d => {
          const data = d.data();
          if (data.percentage !== undefined && data.percentage < 75) {
            defaulters++;
          }
        });

        setStats({
          totalStudents: studentsSnap.size,
          defaultersCount: defaulters,
          totalFaculty: facultySnap.size,
          totalQuestions: questionsSnap.size,
        });
      } catch (err) {
        console.warn('Failed to fetch AI agent stats:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadLiveStats();
  }, [collegeId]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: buildWelcomeContent(user?.name),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [user?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => !m.id.startsWith('welcome'))
        .map(m => ({ role: m.role, content: m.content }));

      history.push({ role: 'user', content: query });

      const reply = await sendAIChatMessage({
        messages: history,
        context: {
          role: user?.role || 'admin',
          name: user?.name,
          collegeId: user?.collegeId,
          liveStats: stats,
        },
      });

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: reply.actions,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '### ⚠️ Unable to process query\nThe assistant could not reach the analysis service. Please check connectivity and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const capabilityAreas = [
    { icon: '📊', label: 'Attendance & defaulters', hint: 'thresholds, trends, remedial plans' },
    { icon: '📝', label: 'Examinations & question bank', hint: 'Bloom levels, paper generation, review' },
    { icon: '💳', label: 'Fees & reconciliation', hint: 'realisation, arrears, receipts' },
    { icon: '🗓️', label: 'Timetable & scheduling', hint: 'conflicts, reschedules, approvals' },
    { icon: '🤝', label: 'Faculty office hours', hint: 'student requests, confirmations' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 border border-teal-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">AI Agent Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active v2.1
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Intelligent copilot for campus analytics, exam drafting, and institutional decision support.
          </p>
        </div>

        <button
          onClick={() => setMessages([{
            id: `welcome-${Date.now()}`,
            role: 'assistant',
            content: buildWelcomeContent(user?.name),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }])}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all self-start md:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Conversation
        </button>
      </div>

      {/* Live Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Enrolled Students</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {loadingStats ? '...' : stats.totalStudents}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Attendance Defaulters (&lt;75%)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {loadingStats ? '...' : stats.defaultersCount}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faculty Members</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {loadingStats ? '...' : stats.totalFaculty}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Question Pool</span>
            <FileText className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {loadingStats ? '...' : stats.totalQuestions}
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chat Feed */}
        <div className="lg:col-span-2 flex flex-col h-[650px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((m) => {
              const body = m.content;
              const hasActions = Boolean(m.actions?.length);
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <ChatMarkdown content={body} />
                    ) : (
                      <div className="whitespace-pre-wrap">{body}</div>
                    )}

                    {m.role === 'assistant' && hasActions && (
                      <ChatActionPills actions={m.actions || []} size="md" />
                    )}

                    <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                      <span>{m.timestamp}</span>
                      {m.role === 'assistant' && (
                        <CopyMessageButton text={body} size="md" className="text-[10px]" />
                      )}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3 text-sm text-slate-500">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs ml-1">Vriddhi AI is analyzing institutional data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input — free-form by design */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything — attendance trends, paper design, fee arrears, scheduling…"
                aria-label="Ask the AI assistant"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <MessageSquare className="w-3 h-3" />
              Natural-language only — no canned prompts. Action pills appear under each reply.
            </p>
          </div>
        </div>

        {/* Right: Capabilities & Portals */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-500" />
              What This Assistant Knows
            </h3>

            <ul className="space-y-2">
              {capabilityAreas.map((area) => (
                <li
                  key={area.label}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
                >
                  <span className="text-base leading-none mt-0.5">{area.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{area.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{area.hint}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask in your own words — questions are answered against your live college data, and only
              questions from privileged roles reach examination-authoring tooling.
            </p>
          </div>

          {/* Direct Portals Access */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Portals
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/admin/view360')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left font-medium text-slate-700 dark:text-slate-300"
              >
                🔍 View 360°
              </button>
              <button
                onClick={() => navigate('/admin/question-bank')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left font-medium text-slate-700 dark:text-slate-300"
              >
                📚 Question Bank
              </button>
              <button
                onClick={() => navigate('/admin/hod-dashboard')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left font-medium text-slate-700 dark:text-slate-300"
              >
                🏛️ HOD Overview
              </button>
              <button
                onClick={() => navigate('/admin/fee-management')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left font-medium text-slate-700 dark:text-slate-300"
              >
                💳 Fees Desk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Opening bubble: what the assistant can do, without prescriptive canned prompts. */
function buildWelcomeContent(name?: string | null): string {
  return `### 👋 Welcome to the Vriddhi AI Command Center
${name || 'Administrator'} — ask me anything about your institution in plain language.

- **Attendance & defaulters**: thresholds, cohort dips and intervention options.
- **Examinations**: question bank curation, Bloom's distribution and paper generation.
- **Fees**: realisation, arrears by branch and reconciliation timelines.
- **Operations**: timetable conflicts, reschedule approvals and announcement reach.

> Answers are advisory only — nothing here writes to your college records. Tap an action pill below a reply to open the matching portal.`;
}
