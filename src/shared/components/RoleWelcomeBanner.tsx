import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import PortalIllustration, { type PortalScene } from './PortalIllustration';

const ROLE_NAMES: Record<string, string> = {
  hod: 'HOD', admin: 'Department', principal: 'Principal', faculty: 'Faculty',
  mentor: 'Mentor', accounts: 'Accounts', operations: 'Operations', superadmin: 'Superadmin', employee: 'Employee',
};

/** Shared visual language, not a second source of role permissions. */
export default function RoleWelcomeBanner({ role, title, subtitle, headingLevel = 2, actions, className = '' }: {
  role: string;
  title: string;
  subtitle: ReactNode;
  headingLevel?: 1 | 2;
  actions?: ReactNode;
  className?: string;
}) {
  const scene: PortalScene = role === 'admin' ? 'hod' : role === 'mentor' ? 'faculty'
    : ['hod', 'principal', 'faculty', 'accounts', 'operations', 'superadmin', 'employee'].includes(role) ? role as PortalScene : 'academics';
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <header className={`portal-role-banner grid grid-cols-[minmax(0,1fr)_88px] sm:grid-cols-[minmax(0,1fr)_180px] items-center gap-x-4 gap-y-2 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-amber-50/60 p-5 sm:p-6 dark:border-teal-900/60 dark:from-teal-950/50 dark:via-slate-900 dark:to-slate-900 ${className}`}>
      <div className="min-w-0">
        <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> {ROLE_NAMES[role] || 'Campus'} workspace
        </span>
        <Heading className="text-xl sm:text-2xl font-extrabold tracking-tight break-words text-slate-900 dark:text-white">{title}</Heading>
      </div>
      <PortalIllustration scene={scene} className="col-start-2 row-start-1 sm:row-span-2" />
      <div className="col-span-2 sm:col-span-1 sm:row-start-2 self-start text-sm leading-relaxed text-slate-600 dark:text-slate-300">{subtitle}</div>
      {actions && <div className="col-span-2 mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
