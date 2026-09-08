// src/shared/components/chat/ChatActionPills.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import type { ChatAction, ChatActionIcon } from '@/shared/services/chatResponseRules';

/**
 * One-click deep links rendered under an assistant reply.
 *
 * The paths arrive pre-filtered by role from `deriveChatActions`, so every pill
 * here is a screen the current user can actually open — the previous
 * implementation mapped a student's "question bank" mention onto
 * /admin/question-bank.
 */

type IconComponent = React.ComponentType<{ className?: string }>;

const ICONS: Record<ChatActionIcon, IconComponent> = {
  attendance: ClipboardList,
  fees: Wallet,
  assessments: GraduationCap,
  'question-bank': BookOpen,
  paper: FileText,
  faculty: Users,
  timetable: CalendarDays,
  library: BookOpen,
  materials: NotebookPen,
  grades: Star,
  analytics: BarChart3,
  portal: LayoutDashboard,
};

interface ChatActionPillsProps {
  actions: ChatAction[];
  /** 'sm' fits the floating widget, 'md' the full-page console. */
  size?: 'sm' | 'md';
  /** Invoked after navigation (e.g. to close the floating widget). */
  onAfterNavigate?: (action: ChatAction) => void;
}

export default function ChatActionPills({ actions, size = 'md', onAfterNavigate }: ChatActionPillsProps) {
  const navigate = useNavigate();

  if (!actions?.length) return null;

  const sizing =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-1.5 gap-1.5 rounded-lg'
      : 'text-xs px-3.5 py-1.5 gap-2 rounded-xl';

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Quick actions">
      {actions.map(action => {
        const Icon = ICONS[action.icon] ?? LayoutDashboard;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              navigate(action.path);
              onAfterNavigate?.(action);
            }}
            className={`group inline-flex items-center font-semibold transition-all border bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border-teal-200 dark:border-teal-800 ${sizing}`}
          >
            <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
            <span>{action.label}</span>
            <ArrowRight className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0 group-hover:translate-x-0.5 transition-transform`} />
          </button>
        );
      })}
    </div>
  );
}
