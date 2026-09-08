// src/shared/components/FloatingAIChatWidget.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { sendAIChatMessage, type AIChatMessage } from '../services/aiChatService';
import ChatMarkdown from './chat/ChatMarkdown';
import ChatActionPills from './chat/ChatActionPills';
import CopyMessageButton from './chat/CopyMessageButton';

/**
 * Global floating assistant.
 *
 * Deliberately free-form: there is no hardcoded prompt carousel. Every role
 * types whatever they need in natural language, and the reply carries its own
 * action pills derived from the question and the caller's role.
 */
export default function FloatingAIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'student';

  const welcomeMessage = (): AIChatMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: `### 👋 Hi **${user?.name || 'there'}**, I'm Vriddhi AI
Ask me anything in plain language — a concept you want explained, your attendance, fee status, an upcoming test, or booking time with a professor.

> ${getWelcomeHint(role)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([welcomeMessage()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
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

      const reply = await sendAIChatMessage({
        messages: history,
        context: {
          role,
          name: user?.name,
          email: user?.email,
          collegeId: user?.collegeId,
        },
      });

      const assistantMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: reply.actions,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '### ⚠️ Something went wrong\nI could not process that query. Please try again, or check your internet connection.',
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
        ...welcomeMessage(),
        id: `welcome-${Date.now()}`,
        content: `### 🧹 Chat cleared\nHow can I assist you now, **${user?.name || 'friend'}**?`,
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
                  {msg.role === 'assistant' ? (
                    <ChatMarkdown content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap font-normal">{msg.content}</div>
                  )}

                  {msg.role === 'assistant' && (
                    <ChatActionPills
                      actions={msg.actions || []}
                      size="sm"
                      onAfterNavigate={() => setIsOpen(false)}
                    />
                  )}

                  <div
                    className={`flex items-center justify-between gap-3 mt-1.5 text-[9px] ${
                      msg.role === 'user' ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <CopyMessageButton text={msg.content} size="sm" className="text-[9px]" />
                    )}
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

          {/* Input Bar — open-ended by design, no suggestion chips */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything — concepts, attendance, fees, scheduling…"
                rows={1}
                className="flex-1 max-h-24 resize-none rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white shadow-sm transition-all shrink-0 focus:outline-none"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
              <MessageSquare className="w-2.5 h-2.5" />
              Free-form answers only — nothing is submitted to the portal from this panel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getWelcomeHint(role: string): string {
  switch (role) {
    case 'student':
      return 'I explain concepts, point you to study notes and scheduled tests, and help you book office hours with a professor.';
    case 'faculty':
      return 'Ask about attendance, your schedule and reschedules, question papers, or managing student office-hour requests.';
    case 'hod':
      return 'Ask about cohort analytics, pending approvals and departmental intervention options.';
    case 'principal':
    case 'admin':
    case 'superadmin':
      return 'Ask about institution-wide attendance, fee collection, exam operations and analytics.';
    default:
      return 'Ask a question and I will point you to the right screen.';
  }
}
