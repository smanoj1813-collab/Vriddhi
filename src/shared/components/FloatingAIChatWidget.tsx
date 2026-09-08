// src/shared/components/FloatingAIChatWidget.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, X, Send, Sparkles, Bot, User, Trash2,
  ChevronDown, ExternalLink, RefreshCw, HelpCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { sendAIChatMessage, type AIChatMessage } from '../services/aiChatService';

export default function FloatingAIChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'student';

  // Role-specific suggested prompts
  const suggestedPrompts: Record<string, string[]> = {
    superadmin: [
      'Summarize multi-college metrics',
      'How do I add a new university affiliation?',
      'Check system provisioning health',
    ],
    admin: [
      'Show students with attendance below 75%',
      'What are our total fee collection figures?',
      'How do I create an examination paper?',
      'Summarize department faculty ratios',
    ],
    principal: [
      'Overview of institutional attendance',
      'Check pending HOD approvals',
      'How to export university accreditation reports',
    ],
    hod: [
      'Review pending faculty reschedules',
      'Check subject performance analytics',
      'Identify students needing remedial sessions',
    ],
    faculty: [
      'How do I generate an exam paper with Bloom levels?',
      'How to request a lecture reschedule?',
      'Draft 3 practice questions on Financial Accounting',
      'Check my assigned class schedule',
    ],
    student: [
      'What is my current attendance percentage?',
      'How do I view my pending fee balance?',
      'What are the rules for exam eligibility?',
      'Explain the difference between Cost & Financial Accounting',
    ],
  };

  const activeSuggestions = suggestedPrompts[role] || suggestedPrompts.student;

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: AIChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi **${user?.name || 'there'}**! I am **Vriddhi AI**, your multi-role campus assistant.\n\nAsk me anything about your courses, attendance, fees, schedules, or question banks!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);
    }
  }, [user?.name]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      history.push({ role: 'user', content: text });

      const replyContent = await sendAIChatMessage({
        messages: history,
        context: {
          role,
          name: user?.name,
          email: user?.email,
          collegeId: user?.collegeId,
        },
      });

      // Check if response contains direct action links
      let action: { label: string; path: string } | undefined;
      const lowerReply = replyContent.toLowerCase();
      if (lowerReply.includes('attendance tab') || lowerReply.includes('attendance portal')) {
        action = { label: 'Go to Attendance', path: role === 'student' ? '/student/attendance' : '/admin/attendance' };
      } else if (lowerReply.includes('fee portal') || lowerReply.includes('fee management')) {
        action = { label: 'Open Fees', path: role === 'student' ? '/student/fees' : '/admin/fees' };
      } else if (lowerReply.includes('question bank') || lowerReply.includes('paper builder')) {
        action = { label: 'Open Question Bank', path: role === 'faculty' ? '/faculty/question-bank' : '/admin/question-bank' };
      } else if (lowerReply.includes('reschedule')) {
        action = { label: 'Open Reschedule', path: '/faculty/reschedule' };
      }

      const assistantMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ I encountered an error processing your query. Please try again or check your internet connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. How can I assist you now, **${user?.name || 'friend'}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'superadmin': return 'SuperAdmin Co-Pilot';
      case 'admin': return 'Admin AI Co-Pilot';
      case 'principal': return 'Principal AI Advisor';
      case 'hod': return 'HOD Department Assistant';
      case 'faculty': return 'Faculty Assistant';
      case 'student': return 'Student Study Tutor';
      default: return 'Vriddhi AI Assistant';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
          aria-label="Open Vriddhi AI Assistant"
        >
          <Sparkles className="w-5 h-5 text-teal-200 animate-pulse" />
          <span className="text-sm font-semibold tracking-wide">Ask AI</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/15 backdrop-blur-sm">
                <Bot className="w-5 h-5 text-teal-100" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-none flex items-center gap-1.5">
                  Vriddhi AI
                  <span className="text-[10px] uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-teal-100 font-medium mt-0.5">
                  {getRoleLabel()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-slate-950/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5 border border-teal-200 dark:border-teal-800">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-normal">
                    {msg.content}
                  </div>

                  {msg.action && (
                    <button
                      onClick={() => {
                        navigate(msg.action!.path);
                        setIsOpen(false);
                      }}
                      className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 text-[11px] font-semibold transition-all group"
                    >
                      <span>{msg.action.label}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.role === 'user' ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-[11px] ml-1">Vriddhi AI is analyzing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {activeSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or choose a suggestion..."
              rows={1}
              className="flex-1 max-h-24 resize-none rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400"
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white shadow-sm transition-all shrink-0 focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
