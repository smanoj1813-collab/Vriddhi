import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BookOpen, Building2, CalendarDays, ClipboardCheck,
  GraduationCap, Landmark, ShieldCheck, Sparkles, Wallet, Workflow, X,
  type LucideIcon,
} from 'lucide-react';
import { LANDING_ROLES } from './roles';
import { ROLE_ICONS } from './roleIcons';
import DrilldownScene from './DrilldownScene';
import { getDrilldownVisuals } from './drilldownVisuals';
import {
  getDrilldownContent, roleLabelForDrilldown, type DrilldownSelection,
} from './drilldowns';

const DIALOG_ICONS: Record<string, LucideIcon> = {
  academics: CalendarDays,
  assessments: ClipboardCheck,
  'campus-operations': Workflow,
  upskilling: Sparkles,
  principal: Landmark,
  hod: Building2,
  faculty: BookOpen,
  operations: Workflow,
  finance: Wallet,
  students: GraduationCap,
};

interface DrilldownDialogProps {
  selection: DrilldownSelection;
  onClose: () => void;
}

/**
 * A native modal dialog gives us focus trapping, Escape handling, and an
 * inert background without pulling a UI library into the public page.
 */
export default function DrilldownDialog({ selection, onClose }: DrilldownDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const content = getDrilldownContent(selection);
  const visuals = getDrilldownVisuals(selection);
  const iconKey = selection.kind === 'upskilling' ? 'upskilling' : selection.id;
  const Icon = DIALOG_ICONS[iconKey] ?? Sparkles;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      previouslyFocused?.focus();
    };
  }, []);

  const action = content.action;
  const loginRole = action.type === 'role-login'
    ? LANDING_ROLES.find((role) => role.id === action.roleId)
    : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="landing-dialog"
      aria-labelledby="landing-drilldown-title"
      aria-describedby="landing-drilldown-intro"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="landing-dialog-card">
        <header className="landing-dialog-header">
          <div className="landing-dialog-heading">
            <span className="landing-dialog-icon"><Icon size={24} strokeWidth={1.7} aria-hidden="true" /></span>
            <div>
              <p className="landing-eyebrow landing-dialog-eyebrow">{content.eyebrow}</p>
              <h2 id="landing-drilldown-title">{content.title}</h2>
            </div>
          </div>
          <button type="button" className="landing-dialog-close" onClick={onClose} aria-label="Close details">
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        <div className="landing-dialog-body">
          <p id="landing-drilldown-intro" className="landing-dialog-intro">{content.intro}</p>
          <DrilldownScene scene={visuals.scene} />

          <section aria-labelledby="drilldown-highlights-heading">
            <h3 id="drilldown-highlights-heading" className="landing-dialog-section-title">What’s inside</h3>
            <div className="landing-dialog-highlights">
              {content.highlights.map((highlight, index) => {
                const HighlightIcon = visuals.highlights[index] ?? Icon;
                return (
                  <article key={highlight.title} className="landing-dialog-highlight">
                    <span className="landing-dialog-highlight-icon"><HighlightIcon size={19} strokeWidth={1.7} aria-hidden="true" /></span>
                    <h4>{highlight.title}</h4>
                    <p>{highlight.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="drilldown-workflow-heading">
            <h3 id="drilldown-workflow-heading" className="landing-dialog-section-title">How it fits together</h3>
            <ol className="landing-dialog-workflow">
              {content.workflow.map((step, index) => {
                const StepIcon = visuals.workflow[index] ?? Icon;
                return (
                  <li key={step.label}>
                    <span className="landing-dialog-step-icon"><StepIcon size={16} strokeWidth={1.8} aria-hidden="true" /></span>
                    <strong>{step.label}</strong>
                    <p>{step.description}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="drilldown-roles-heading">
            <h3 id="drilldown-roles-heading" className="landing-dialog-section-title">Who it connects</h3>
            <ul className="landing-dialog-roles">
              {content.roleIds.map((roleId) => {
                const RoleIcon = ROLE_ICONS[roleId];
                return <li key={roleId}><RoleIcon size={13} strokeWidth={1.9} aria-hidden="true" />{roleLabelForDrilldown(roleId)}</li>;
              })}
            </ul>
          </section>

          <p className="landing-dialog-note"><ShieldCheck size={16} aria-hidden="true" />{content.note}</p>
        </div>

        <footer className="landing-dialog-footer">
          <button type="button" className="landing-button landing-button-outline landing-button-small" onClick={onClose}>Back to overview</button>
          {content.action.type === 'roles' && (
            <a className="landing-button landing-button-primary landing-button-small" href="#roles" onClick={onClose}>Find your role <ArrowUpRight size={16} aria-hidden="true" /></a>
          )}
          {content.action.type === 'courses' && (
            <Link className="landing-button landing-button-primary landing-button-small" to="/student/login?next=courses">Access your courses <ArrowUpRight size={16} aria-hidden="true" /></Link>
          )}
          {loginRole && (
            <Link className="landing-button landing-button-primary landing-button-small" to={loginRole.loginPath}>
              Sign in as {loginRole.id === 'students' ? 'Student' : loginRole.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </footer>
      </div>
    </dialog>
  );
}
