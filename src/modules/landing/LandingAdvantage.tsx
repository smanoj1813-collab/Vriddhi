import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, BookOpen, BrainCircuit, CalendarDays, Check,
  ClipboardCheck, GraduationCap, Languages, Palette, ShieldCheck, Smartphone,
  Sparkles, Users, Wallet, Workflow,
} from 'lucide-react';

const COMPARISON_ROWS = [
  {
    moment: 'Starting the day',
    without: 'Check notices, ask around, and piece together what changed.',
    with: 'Open one workspace and see the classes, tasks, and updates that matter to your role.',
  },
  {
    moment: 'Tracking attendance',
    without: 'Move between registers, spreadsheets, and follow-up messages.',
    with: 'Keep attendance connected to classes and make the record easier to review.',
  },
  {
    moment: 'Preparing assessments',
    without: 'Rebuild question papers and chase review steps by hand.',
    with: 'Use question banks, preparation workflows, and reviewable AI assistance where it is enabled.',
  },
  {
    moment: 'Handling fees and campus requests',
    without: 'Search for receipts, status updates, and the person who owns the next step.',
    with: 'Keep ledgers, requests, and approvals in a clearer shared trail.',
  },
  {
    moment: 'Supporting students after class',
    without: 'Point learners to another portal, another login, or another source of truth.',
    with: 'Bring academic life and assigned upskill courses into the same student experience.',
  },
];

const SPECIAL_POINTS = [
  {
    icon: Workflow,
    title: 'One campus, not ten tabs',
    body: 'Academics, operations, finance, and student learning stop feeling like separate worlds.',
  },
  {
    icon: ShieldCheck,
    title: 'People still make the calls',
    body: 'Role-based access and review steps keep responsibility with the people who know the college best.',
  },
  {
    icon: Palette,
    title: 'Shaped around your college',
    body: 'Branding, permissions, academic rules, and language options can reflect how your institution works.',
  },
];

function EffortGraph() {
  const titleId = useId();
  const descId = useId();

  return (
    <figure className="landing-graph-card">
      <div className="landing-graph-top">
        <div>
          <h3>The shape of a semester</h3>
          <p>Less chasing. More room for the work that matters.</p>
        </div>
      </div>
      <p className="landing-graph-y-label">More manual follow-up</p>
      <svg className="landing-graph" viewBox="0 0 640 200" preserveAspectRatio="none" role="img" aria-labelledby={titleId} aria-describedby={descId}>
        <title id={titleId}>Illustrative manual coordination effort across a semester</title>
        <desc id={descId}>
          A conceptual comparison. Without a connected system, manual coordination stays high and spikes around assessments and results. With Vriddhi, the illustrative effort is lower and steadier. This is not measured customer data.
        </desc>
        <g className="landing-graph-grid" aria-hidden="true">
          <line x1="8" y1="15" x2="632" y2="15" vectorEffect="non-scaling-stroke" />
          <line x1="8" y1="60" x2="632" y2="60" vectorEffect="non-scaling-stroke" />
          <line x1="8" y1="105" x2="632" y2="105" vectorEffect="non-scaling-stroke" />
          <line x1="8" y1="150" x2="632" y2="150" vectorEffect="non-scaling-stroke" />
          <line x1="8" y1="185" x2="632" y2="185" vectorEffect="non-scaling-stroke" />
        </g>
        <path className="landing-graph-line landing-graph-line-without" vectorEffect="non-scaling-stroke" d="M8 62 C62 40 102 74 156 58 S242 12 294 36 S382 6 430 28 S540 14 632 40" />
        <path className="landing-graph-line landing-graph-line-with" vectorEffect="non-scaling-stroke" d="M8 138 C72 130 112 120 166 116 S252 102 304 98 S392 88 440 82 S540 74 632 68" />
      </svg>
      <div className="landing-graph-xlabels" aria-hidden="true">
        <span>Start</span><span>Classes</span><span>Tests</span><span>Results</span><span>Review</span>
      </div>
      <div className="landing-graph-scale" aria-hidden="true"><span>Less manual follow-up</span><span>A semester →</span></div>
      <div className="landing-graph-legend">
        <span><i className="legend-without" aria-hidden="true" />Without a connected system</span>
        <span><i className="legend-with" aria-hidden="true" />With Vriddhi</span>
      </div>
      <figcaption>Illustrative workflow comparison, not measured customer results. The point is the pattern: connected records can reduce repeated follow-up.</figcaption>
    </figure>
  );
}

export function WhyVriddhiSection() {
  return (
    <section className="landing-why landing-section" id="why-vriddhi" aria-labelledby="why-heading">
      <div className="landing-container">
        <div className="landing-section-heading landing-centered-heading">
          <p className="landing-eyebrow">WHY COLLEGES LOOK AT VRIDDHI</p>
          <h2 id="why-heading">It’s not just software.<br />It’s a calmer college day.</h2>
          <p>Most colleges don’t need another dashboard. They need fewer loose ends. Here’s the difference a connected campus can make.</p>
        </div>

        <div className="landing-comparison" role="group" aria-label="Without a connected system compared with Vriddhi">
          {COMPARISON_ROWS.map((row) => (
            <article key={row.moment} className="landing-comparison-row">
              <h3>{row.moment}</h3>
              <div className="landing-comparison-cell is-without">
                <span className="landing-comparison-label">Without a connected system</span>
                <p>{row.without}</p>
              </div>
              <div className="landing-comparison-cell is-with">
                <span className="landing-comparison-label"><Check size={14} aria-hidden="true" />With Vriddhi</span>
                <p>{row.with}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="landing-comparison-note">A comparison of typical disconnected workflows, not a claim about every other platform.</p>

        <EffortGraph />

        <div className="landing-special-grid">
          {SPECIAL_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <article key={point.title} className="landing-special-card">
                <span className="landing-feature-icon landing-icon-mint"><Icon size={23} strokeWidth={1.7} /></span>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const MOBILE_TABS = [
  { id: 'today', label: 'Today' },
  { id: 'learn', label: 'Learn' },
  { id: 'campus', label: 'Campus' },
] as const;

type MobileTab = (typeof MOBILE_TABS)[number]['id'];

const MOBILE_CARDS: Record<MobileTab, { title: string; body: string; icon: typeof CalendarDays }[]> = {
  today: [
    { title: 'Your classes', body: 'See what’s scheduled and what changed.', icon: CalendarDays },
    { title: 'Attendance', body: 'Keep your own record in view.', icon: ClipboardCheck },
    { title: 'Next assessment', body: 'Find instructions and upcoming work.', icon: BookOpen },
  ],
  learn: [
    { title: 'Assigned courses', body: 'Continue the upskill courses your college assigned.', icon: GraduationCap },
    { title: 'Progress', body: 'Pick up where you left off.', icon: Sparkles },
    { title: 'Materials', body: 'Open learning content from the same workspace.', icon: BookOpen },
  ],
  campus: [
    { title: 'Fee information', body: 'Check records and finance-office guidance.', icon: Wallet },
    { title: 'Library', body: 'See student-facing library activity where enabled.', icon: BookOpen },
    { title: 'Updates', body: 'Keep campus notices easier to find.', icon: Users },
  ],
};

export function MobileViewSection() {
  const [tab, setTab] = useState<MobileTab>('today');
  const cardsId = useId();
  const cards = MOBILE_CARDS[tab];

  return (
    <section className="landing-mobile-view landing-section" id="mobile-view" aria-labelledby="mobile-view-heading">
      <div className="landing-container landing-mobile-view-grid">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">MOBILE VIEW</p>
          <h2 id="mobile-view-heading">Your college day,<br />in your pocket.</h2>
          <p>Students and staff are not always at a desk. Vriddhi’s responsive workspace and installable app experience keep the next step close — on a phone, tablet, or laptop.</p>
          <ul className="landing-mobile-points">
            <li><Check size={16} aria-hidden="true" />Designed for small screens, not squeezed onto them</li>
            <li><Check size={16} aria-hidden="true" />Installable from supported browsers</li>
            <li><Check size={16} aria-hidden="true" />The same role-based access as the desktop workspace</li>
          </ul>
          <Link className="landing-button landing-button-primary" to="/student/login">Open student sign-in <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>

        <div className="landing-phone-stage">
          <div className="landing-phone" role="group" aria-label="Illustrative mobile workspace preview">
            <div className="landing-phone-notch" aria-hidden="true" />
            <div className="landing-phone-screen">
              <div className="landing-phone-header">
                <span className="landing-phone-logo">V</span>
                <div><strong>Vriddhi</strong><span>Student workspace</span></div>
                <Smartphone size={17} aria-hidden="true" />
              </div>
              <div className="landing-phone-tabs" role="group" aria-label="Preview a mobile workspace area">
                {MOBILE_TABS.map((item) => (
                  <button key={item.id} type="button" aria-pressed={tab === item.id} aria-controls={cardsId} onClick={() => setTab(item.id)}>{item.label}</button>
                ))}
              </div>
              <div className="landing-phone-cards" id={cardsId} aria-live="polite" aria-atomic="true">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="landing-phone-card">
                      <span><Icon size={17} aria-hidden="true" /></span>
                      <div><strong>{card.title}</strong><p>{card.body}</p></div>
                    </div>
                  );
                })}
              </div>
              <div className="landing-phone-footer" aria-hidden="true">Illustrative preview</div>
            </div>
          </div>
          <p className="landing-phone-note">Your college’s live information appears after sign-in.</p>
        </div>
      </div>
    </section>
  );
}

const ACCENTS = [
  // The deeper brand teal keeps small white preview text readable (AA).
  { id: 'teal', label: 'Teal', value: '#0f766e' },
  { id: 'indigo', label: 'Indigo', value: '#4f46e5' },
  { id: 'amber', label: 'Amber', value: '#b45309' },
  { id: 'rose', label: 'Rose', value: '#be123c' },
] as const;

export function CustomizationSection() {
  const [accent, setAccent] = useState<(typeof ACCENTS)[number]['value']>('#0f766e');
  const [collegeName, setCollegeName] = useState('Your college');
  const previewName = collegeName.trim() || 'Your college';

  return (
    <section className="landing-custom landing-section" id="customise" aria-labelledby="custom-heading">
      <div className="landing-container landing-custom-grid">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">MAKE IT YOURS</p>
          <h2 id="custom-heading">It should feel like your college.<br />Because it is.</h2>
          <p>Vriddhi can be shaped around your institution’s identity and working style — not the other way around.</p>
          <div className="landing-custom-options">
            <div><Palette size={19} aria-hidden="true" /><span><strong>Identity</strong>College name, logo, and accent choices.</span></div>
            <div><ShieldCheck size={19} aria-hidden="true" /><span><strong>Access</strong>Workspaces shaped by role and responsibility.</span></div>
            <div><Workflow size={19} aria-hidden="true" /><span><strong>Academic rules</strong>Scheme packs and workflows that match your setup.</span></div>
            <div><Languages size={19} aria-hidden="true" /><span><strong>Language</strong>Student-facing options including English, Kannada, Tamil, Telugu, Malayalam, and Hindi.</span></div>
          </div>
        </div>

        <div className="landing-custom-preview-card">
          <div className="landing-custom-controls">
            <label htmlFor="college-preview-name">Try a college name</label>
            <input id="college-preview-name" type="text" value={collegeName} maxLength={32} onChange={(event) => setCollegeName(event.target.value)} placeholder="Your college" />
            <span className="landing-custom-swatch-label" id="accent-label">Pick an accent</span>
            <div className="landing-custom-swatches" role="group" aria-labelledby="accent-label">
              {ACCENTS.map((item) => (
                <button key={item.id} type="button" aria-label={`${item.label} accent`} aria-pressed={accent === item.value} style={{ background: item.value }} onClick={() => setAccent(item.value)} />
              ))}
            </div>
          </div>
          <div className="landing-custom-preview" style={{ borderTopColor: accent }}>
            <div className="landing-custom-preview-header" style={{ background: accent }}>
              <span className="landing-custom-preview-logo" aria-hidden="true">{previewName.slice(0, 1).toUpperCase()}</span>
              <div><strong>{previewName}</strong><span>Connected workspace</span></div>
            </div>
            <div className="landing-custom-preview-body">
              <div className="landing-custom-preview-row"><span style={{ background: accent }} /><div><strong>Welcome back</strong><p>Your role, your records, your next step.</p></div></div>
              <div className="landing-custom-preview-row"><span style={{ background: accent }} /><div><strong>Today at a glance</strong><p>Classes, tasks, and updates in one place.</p></div></div>
            </div>
          </div>
          <p className="landing-custom-note">A look-and-feel preview, not your college’s live settings. Available options depend on your institution’s setup.</p>
        </div>
      </div>
    </section>
  );
}

const AI_HELP = [
  {
    icon: BrainCircuit,
    title: 'A first draft, not a final decision',
    body: 'Where enabled, AI can help draft questions and question papers from the college’s question bank, giving faculty a starting point instead of a blank page.',
  },
  {
    icon: ClipboardCheck,
    title: 'Reviewable grading support',
    body: 'Objective tests can be auto-scored, and written answers can receive rubric-based or AI-assisted suggestions for faculty review — not silent final judgement.',
  },
  {
    icon: Languages,
    title: 'Help in the learner’s language',
    body: 'AI-assisted question generation can work in supported Indian languages, so language does not have to be the barrier to a useful first draft.',
  },
];

export function AiSection() {
  return (
    <section className="landing-ai landing-section" id="ai" aria-labelledby="ai-heading">
      <div className="landing-container">
        <div className="landing-section-heading landing-centered-heading">
          <p className="landing-eyebrow">AI, WITH PEOPLE IN CHARGE</p>
          <h2 id="ai-heading">A helpful assistant.<br />Not the head of the college.</h2>
          <p>AI should take some of the repetitive lifting off your team — while teachers and administrators keep the judgement, context, and final say.</p>
        </div>
        <div className="landing-ai-grid">
          {AI_HELP.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="landing-ai-card">
                <span className="landing-feature-icon landing-icon-peach"><Icon size={23} strokeWidth={1.7} /></span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
        <ol className="landing-ai-flow" aria-label="Human-reviewed AI workflow">
          <li>Ask</li>
          <li>Draft</li>
          <li className="is-human">Faculty review</li>
          <li>Use with confidence</li>
        </ol>
        <p className="landing-ai-note"><ShieldCheck size={16} aria-hidden="true" />AI features depend on your college’s configuration. When AI is unavailable, core academic workflows still have non-AI paths.</p>
      </div>
    </section>
  );
}
