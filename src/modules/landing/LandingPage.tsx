import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays,
  Check, CheckCheck, ChevronDown, ClipboardCheck, GraduationCap,
  Layers3, Menu, Play, ShieldCheck, Sparkles, Users, Workflow, X,
} from 'lucide-react';
import VriddhiLogo from '@/shared/components/VriddhiLogo';
import { ROLE_ICONS } from './roleIcons';
import CampusIllustration from './CampusIllustration';
import DrilldownDialog from './DrilldownDialog';
import { AiSection, CustomizationSection, MobileViewSection, WhyVriddhiSection } from './LandingAdvantage';
import type { DrilldownSelection } from './drilldowns';
import { LANDING_ROLES, type LandingRoleId } from './roles';
import './landing.css';

const NAVIGATION = [
  { label: 'The platform', href: '#platform' },
  { label: 'Why Vriddhi', href: '#why-vriddhi' },
  { label: 'Mobile view', href: '#mobile-view' },
  { label: 'Your role', href: '#roles' },
  { label: 'Make it yours', href: '#customise' },
  { label: 'AI & you', href: '#ai' },
  { label: 'Upskilling', href: '#upskilling' },
  { label: 'FAQs', href: '#faqs' },
];

const QUESTIONS = [
  {
    question: 'Who is Vriddhi for?',
    answer: 'Vriddhi brings principals, HODs, faculty, operations, finance, and students onto one connected platform. Each role gets a workspace shaped around its everyday responsibilities — so people see what they need, without wading through everything else.',
  },
  {
    question: 'What actually changes if our college uses Vriddhi?',
    answer: 'The small, repeated frustrations get quieter: fewer places to check for updates, fewer disconnected records, and clearer next steps. The comparison above is illustrative, but the goal is practical — give your team more time for students and less time chasing paperwork.',
  },
  {
    question: 'How do I get from this page to my workspace?',
    answer: 'Choose your role below, then use its sign-in button. Staff arrive at the staff sign-in with a helpful role hint; students arrive at the student portal. After sign-in, Vriddhi opens the dashboard for your account’s actual role — this page never assigns permissions.',
  },
  {
    question: 'How do I get my account?',
    answer: 'Your college provides your login details. Choose your role above and sign in with the account issued to you. If you need an account or help getting access, your college administrator is the best place to start.',
  },
  {
    question: 'Can we make it feel like our college?',
    answer: 'Yes. College identity, role-based access, academic scheme packs, and student-facing language options can be configured around your institution. The exact options depend on your college’s setup.',
  },
  {
    question: 'Does AI replace our faculty?',
    answer: 'No. Where AI is enabled, it helps with first drafts and reviewable suggestions. Faculty and administrators still review, decide, and remain responsible for academic work.',
  },
  {
    question: 'Can I explore more before signing in?',
    answer: 'Absolutely. Use the “Explore” options on the platform cards, the selected role workspace, and the upskilling section to drill down. Course titles and learning materials still stay inside the assigned student workspace.',
  },
  {
    question: 'Where can I see the available upskill courses?',
    answer: 'Sign in to the student portal and open Courses. You’ll see the courses assigned to your college. We keep course titles and learning materials off this public page so the details live where they belong — in your learning workspace.',
  },
  {
    question: 'Can I use Vriddhi on my phone?',
    answer: 'Yes. Vriddhi works in your mobile browser, and supported browsers let you install it as an app. Once signed in, look for “Install app” in your workspace to add it to your home screen.',
  },
];

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link to="/" className={`landing-brand${footer ? ' landing-brand-footer' : ''}`} aria-label="Vriddhi home">
      <VriddhiLogo variant="horizontal" height={43} title="Vriddhi Institutions" />
    </Link>
  );
}

function LearningPreview() {
  return (
    <div className="learning-preview" aria-hidden="true">
      <div className="learning-orbit learning-orbit-one" />
      <div className="learning-orbit learning-orbit-two" />
      <div className="learning-back-card"><Layers3 size={26} /></div>
      <div className="learning-window">
        <div className="learning-window-top">
          <span className="learning-window-icon"><GraduationCap size={21} /></span>
          <span>Your learning space</span>
          <span className="learning-window-dots">•••</span>
        </div>
        <div className="learning-video"><span><Play size={25} fill="currentColor" /></span></div>
        <div className="learning-skeleton"><i /><i /></div>
        <div className="learning-lesson"><span className="lesson-check"><Check size={13} /></span><span>Learn something new</span><BookOpen size={15} /></div>
        <div className="learning-lesson"><span className="lesson-number">02</span><span>Put it into practice</span><ArrowUpRight size={15} /></div>
        <div className="learning-progress"><span /></div>
        <div className="learning-progress-label"><span>Your progress, at your pace</span><Sparkles size={13} /></div>
      </div>
      <div className="learning-growth-badge"><span><Sparkles size={21} /></span><div>Small steps.<strong>New possibilities.</strong></div></div>
      <span className="learning-spark"><Sparkles size={30} strokeWidth={1.5} /></span>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LandingRoleId>('principal');
  const [drilldown, setDrilldown] = useState<DrilldownSelection | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const activeRole = LANDING_ROLES.find((role) => role.id === selectedRole)!;
  const signInLabel = selectedRole === 'students' ? 'Student' : activeRole.label;

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute('content') ?? '';
    document.title = 'Vriddhi — A connected campus. A brighter next step.';
    description?.setAttribute('content', 'One connected platform for principals, HODs, faculty, operations, finance, and students. Simplify campus life and grow with upskill courses.');
    return () => {
      document.title = previousTitle;
      if (previousDescription !== undefined) description?.setAttribute('content', previousDescription);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  function onRoleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % LANDING_ROLES.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + LANDING_ROLES.length) % LANDING_ROLES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = LANDING_ROLES.length - 1;
    else return;
    event.preventDefault();
    setSelectedRole(LANDING_ROLES[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="landing" id="top">
      <a className="landing-skip" href="#main-content">Skip to content</a>
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Brand />
          <nav className="landing-desktop-nav" aria-label="Main navigation">
            {NAVIGATION.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </nav>
          <div className="landing-header-actions">
            <Link className="landing-button landing-button-small landing-button-outline" to="/login">Sign in <ArrowUpRight size={16} aria-hidden="true" /></Link>
            <button ref={menuButtonRef} className="landing-menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" className="landing-mobile-nav" aria-label="Mobile navigation">
            {NAVIGATION.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}<ArrowUpRight size={16} aria-hidden="true" /></a>)}
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <div className="landing-eyebrow landing-hero-eyebrow"><span className="landing-status-dot" /> ONE CAMPUS. CONNECTED FOR GROWTH.</div>
              <h1 id="hero-heading">Less busywork.<br />More <span>possibilities.</span></h1>
              <p className="landing-hero-description">Behind every class, receipt, and report are people doing their best work. Vriddhi brings your college’s everyday tools together — so your team can spend less time chasing updates and more time helping students grow.</p>
              <div className="landing-hero-actions">
                <a className="landing-button landing-button-primary" href="#platform">Explore the platform <ArrowRight size={18} aria-hidden="true" /></a>
                <a className="landing-button landing-button-text" href="#roles">Find your role <ArrowUpRight size={18} aria-hidden="true" /></a>
              </div>
              <div className="landing-hero-note"><ShieldCheck size={17} aria-hidden="true" /><span>Role-based access. A connected experience.</span></div>
            </div>
            <div className="landing-hero-art">
              <CampusIllustration />
              <div className="landing-art-badge landing-art-badge-top" aria-hidden="true"><span><CheckCheck size={20} /></span><div>Everything, together.<strong>One connected campus</strong></div></div>
              <div className="landing-art-badge landing-art-badge-bottom" aria-hidden="true"><span><GraduationCap size={23} /></span><div>Built for learning.<strong>Designed for growth.</strong></div></div>
              <span className="landing-art-caption" aria-hidden="true">A little more connected. A lot more possible.</span>
            </div>
          </div>
          <div className="landing-container landing-hero-bottom"><span>LESS FRICTION. MORE FORWARD.</span><a href="#platform" aria-label="Discover the platform"><ArrowDown size={17} aria-hidden="true" /></a><span>YOUR COLLEGE, IN SYNC.</span></div>
        </section>

        <section className="landing-platform landing-section" id="platform" aria-labelledby="platform-heading">
          <div className="landing-container">
            <div className="landing-section-heading landing-split-heading">
              <div><p className="landing-eyebrow">THE CONNECTED CAMPUS</p><h2 id="platform-heading">Different tasks.<br />One shared rhythm.</h2></div>
              <p>From the first class to the final receipt, bring the everyday into one place. Less switching between tools. More space for what matters. Pick an area to see what’s inside.</p>
            </div>
            <div className="landing-feature-grid">
              <article className="landing-feature-card">
                <span className="landing-feature-icon landing-icon-mint"><CalendarDays size={25} strokeWidth={1.7} /></span>
                <h3>Academics, in step.</h3>
                <p>Connect curriculum, timetables, and attendance so your college moves to the same schedule.</p>
                <div className="landing-feature-tags"><span>Curriculum</span><span>Timetables</span><span>Attendance</span></div>
                <button type="button" className="landing-drilldown-trigger" aria-haspopup="dialog" onClick={() => setDrilldown({ kind: 'platform', id: 'academics' })}>Explore academics <ArrowRight size={16} aria-hidden="true" /></button>
              </article>
              <article className="landing-feature-card">
                <span className="landing-feature-icon landing-icon-peach"><ClipboardCheck size={25} strokeWidth={1.7} /></span>
                <h3>Assessments, simplified.</h3>
                <p>Bring question banks, question papers, and student assessments into a connected academic flow.</p>
                <div className="landing-feature-tags"><span>Question banks</span><span>Papers</span><span>Results</span></div>
                <button type="button" className="landing-drilldown-trigger" aria-haspopup="dialog" onClick={() => setDrilldown({ kind: 'platform', id: 'assessments' })}>Explore assessments <ArrowRight size={16} aria-hidden="true" /></button>
              </article>
              <article className="landing-feature-card">
                <span className="landing-feature-icon landing-icon-lilac"><Workflow size={25} strokeWidth={1.7} /></span>
                <h3>Operations, connected.</h3>
                <p>Keep fees, library, inventory, and campus workflows organized — with the right people in the loop.</p>
                <div className="landing-feature-tags"><span>Finance</span><span>Library</span><span>Inventory</span></div>
                <button type="button" className="landing-drilldown-trigger" aria-haspopup="dialog" onClick={() => setDrilldown({ kind: 'platform', id: 'campus-operations' })}>Explore operations <ArrowRight size={16} aria-hidden="true" /></button>
              </article>
            </div>
          </div>
        </section>

        <WhyVriddhiSection />
        <MobileViewSection />

        <section className="landing-roles landing-section" id="roles" aria-labelledby="roles-heading">
          <div className="landing-container">
            <div className="landing-section-heading landing-centered-heading">
              <p className="landing-eyebrow">A PLACE FOR EVERYONE</p>
              <h2 id="roles-heading">Your role. Your workspace.</h2>
              <p>The right tools, without the noise. Choose a role, explore the workspace, then sign in to continue into the platform.</p>
            </div>
            <ol className="landing-entry-steps" aria-label="From the landing page to your workspace">
              <li><span>1</span><strong>Pick your role</strong></li>
              <li><span>2</span><strong>Sign in with your college account</strong></li>
              <li><span>3</span><strong>Land in your workspace</strong></li>
            </ol>
            <div className="landing-role-tabs" role="tablist" aria-label="Choose your role">
              {LANDING_ROLES.map((role, index) => {
                const Icon = ROLE_ICONS[role.id];
                const selected = selectedRole === role.id;
                return (
                  <button key={role.id} ref={(node) => { tabRefs.current[index] = node; }} id={`role-tab-${role.id}`} type="button" role="tab" aria-selected={selected} aria-controls="role-panel" tabIndex={selected ? 0 : -1} className={`landing-role-tab${selected ? ' is-selected' : ''}`} onClick={() => setSelectedRole(role.id)} onKeyDown={(event) => onRoleKeyDown(event, index)}>
                    <span className="landing-role-icon"><Icon size={25} strokeWidth={1.65} /></span>
                    <strong>{role.label}</strong><span className="landing-role-tagline">{role.tagline}</span>
                    <ArrowUpRight className="landing-role-tab-arrow" size={15} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            <div className="landing-role-panel" id="role-panel" role="tabpanel" aria-labelledby={`role-tab-${selectedRole}`} tabIndex={0}>
              <div className="landing-role-panel-copy" key={selectedRole}>
                <span className="landing-role-panel-label">A WORKSPACE THAT WORKS LIKE YOU DO</span>
                <h3>{activeRole.heading}</h3>
                <p>{activeRole.description}</p>
                <ul>{activeRole.features.map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
              </div>
              <div className="landing-role-panel-action">
                <Link className="landing-button landing-button-primary" to={activeRole.loginPath}>Sign in as {signInLabel} <ArrowRight size={17} aria-hidden="true" /></Link>
                <button type="button" className="landing-role-explore" aria-haspopup="dialog" aria-label={`Explore workspace (${activeRole.label})`} onClick={() => setDrilldown({ kind: 'role', id: selectedRole })}>Explore workspace <ArrowRight size={15} aria-hidden="true" /></button>
                <span>Your college manages your account.</span>
              </div>
            </div>
            <p className="landing-roles-note"><Users size={16} aria-hidden="true" /> Six perspectives. One connected college.</p>
          </div>
        </section>

        <CustomizationSection />
        <AiSection />

        <section className="landing-upskilling landing-section" id="upskilling" aria-labelledby="upskilling-heading">
          <div className="landing-container">
            <div className="landing-upskill-panel">
              <div className="landing-upskill-copy">
                <span className="landing-upskill-badge"><Sparkles size={14} aria-hidden="true" /> UPSKILL COURSES AVAILABLE</span>
                <h2 id="upskilling-heading">Your degree is a start.<br /><span>Your skills take you further.</span></h2>
                <p>Make room for what’s next. Upskill courses bring practical learning into the platform your students already use — with lessons, hands-on practice, and progress that stays in view.</p>
                <div className="landing-upskill-features"><span><Check size={15} /> Guided lessons</span><span><Check size={15} /> Practical projects</span><span><Check size={15} /> Knowledge checks</span></div>
                <div className="landing-upskill-actions">
                  <Link className="landing-button landing-button-light" to="/student/login?next=courses">Access your courses <ArrowUpRight size={18} aria-hidden="true" /></Link>
                  <button type="button" className="landing-drilldown-trigger landing-drilldown-trigger-light" aria-haspopup="dialog" onClick={() => setDrilldown({ kind: 'upskilling' })}>See how upskilling works <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
                <span className="landing-upskill-note">Sign in to discover the courses assigned to your college.</span>
              </div>
              <LearningPreview />
            </div>
          </div>
        </section>

        <section className="landing-faq landing-section" id="faqs" aria-labelledby="faq-heading">
          <div className="landing-container landing-faq-grid">
            <div className="landing-section-heading"><p className="landing-eyebrow">A LITTLE MORE CLARITY</p><h2 id="faq-heading">Good questions.<br />Simple answers.</h2><p>A few things to know before<br className="landing-desktop-break" /> you find your workspace.</p></div>
            <div className="landing-faq-list">
              {QUESTIONS.map((item) => <details key={item.question} className="landing-faq-item"><summary>{item.question}<ChevronDown size={19} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}
            </div>
          </div>
        </section>

        <section className="landing-closing" aria-labelledby="closing-heading">
          <div className="landing-container landing-closing-inner"><div><span className="landing-eyebrow">LET’S MOVE FORWARD, TOGETHER.</span><h2 id="closing-heading">A connected campus.<br />A brighter next step.</h2></div><a className="landing-button landing-button-primary" href="#roles">Find your workspace <ArrowUpRight size={18} aria-hidden="true" /></a><GraduationCap className="landing-closing-decoration" size={220} strokeWidth={0.65} aria-hidden="true" /></div>
        </section>
      </main>

      <footer className="landing-footer"><div className="landing-container landing-footer-main"><div><Brand footer /><p>Growth starts with connection.</p></div><nav aria-label="Footer navigation">{NAVIGATION.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav><a className="landing-back-top" href="#top">Back to top <ArrowUpRight size={16} aria-hidden="true" /></a></div><div className="landing-container landing-footer-bottom"><span>© {new Date().getFullYear()} Vriddhi. All rights reserved.</span><span>Thoughtfully built for colleges.</span></div></footer>
      {drilldown && <DrilldownDialog selection={drilldown} onClose={() => setDrilldown(null)} />}
    </div>
  );
}
