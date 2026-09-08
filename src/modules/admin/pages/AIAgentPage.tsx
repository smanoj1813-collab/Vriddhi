// src/modules/admin/pages/AIAgentPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Send, Bot, User, Trash2, ArrowRight,
  TrendingDown, Users, FileText, CreditCard, Calendar,
  AlertTriangle, ShieldCheck, CheckCircle2, Copy, Check
} from 'lucide-react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { db } from '@/Firebase/config';
import { collection, getDocs, limit } from 'firebase/firestore';
import { sendAIChatMessage, type AIChatMessage } from '@/shared/services/aiChatService';

export default function AIAgentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
          content: `👋 **Welcome to Vriddhi AI Agent Command Center**, ${user?.name || 'Administrator'}!\n\nI can analyze live attendance figures, generate question papers with Bloom's taxonomy, track fee realizations, and suggest academic interventions across your departments. Select a prompt below or type your question!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [user?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
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
        .filter(m => m.id !== 'welcome')
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

      let action: { label: string; path: string } | undefined;
      const lower = reply.toLowerCase();
      if (lower.includes('attendance') || lower.includes('defaulter')) {
        action = { label: 'View 360° Defaulter List', path: '/admin/view360' };
      } else if (lower.includes('fee') || lower.includes('payment')) {
        action = { label: 'Open Fee Management', path: '/admin/fees' };
      } else if (lower.includes('question') || lower.includes('paper')) {
        action = { label: 'Go to Question Bank', path: '/admin/question-bank' };
      } else if (lower.includes('notification') || lower.includes('announcement')) {
        action = { label: 'Issue Faculty Announcement', path: '/faculty/announcements' };
      }

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Unable to process query. Please check connectivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const domainPrompts = [
    {
      category: 'Attendance & Defaulters',
      icon: TrendingDown,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      prompts: [
        'How many students are below 75% attendance threshold?',
        'Draft a reminder notice for attendance shortage',
        'Suggest remedial action plan for high-risk cohorts',
      ],
    },
    {
      category: 'Exams & Question Generation',
      icon: FileText,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      prompts: [
        'Draft 3 medium difficulty MCQs for Financial Accounting',
        'Explain Bloom\'s taxonomy distribution for End-Term papers',
        'How do I create a new question template in Paper Builder?',
      ],
    },
    {
      category: 'Fees & Operations',
      icon: CreditCard,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      prompts: [
        'Summarize student fee recovery guidelines',
        'How to manage timetable conflict resolution?',
        'Check pending HOD reschedule approvals',
      ],
    },
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
            content: 'Conversation history reset. How can I assist you now?',
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
            {messages.map((m) => (
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
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.action && (
                    <button
                      onClick={() => navigate(m.action!.path)}
                      className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 text-xs font-semibold transition-all group"
                    >
                      <span>{m.action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => copyText(m.id, m.content)}
                        className="hover:text-teal-500 transition-colors flex items-center gap-1"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

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

          {/* Chat Input */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about attendance defaulters, draft questions, or fee summaries..."
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
        </div>

        {/* Right: Suggested Intelligence Categories */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-500" />
              Suggested Queries
            </h3>

            {domainPrompts.map((dp, idx) => {
              const Icon = dp.icon;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className={`p-1 rounded-md ${dp.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    {dp.category}
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {dp.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(p)}
                        className="w-full text-left p-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-800 transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
                onClick={() => navigate('/admin/fees')}
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
