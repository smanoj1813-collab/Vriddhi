import type { ReactNode } from 'react';
import { ArrowLeft, BookOpen, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Campus3D from '@/shared/visuals/Campus3D';
import LanguageSwitcher from '@/shared/components/LanguageSwitcher';
import { useTranslation } from '@/shared/contexts/LanguageProvider';
import '../styles/auth.css';

/** Presentation only. Account verification, redirects and recovery stay in
 * each existing login page; this shell never imports a data SDK or polls. */
export default function AuthPageLayout({ portal, children }: { portal: 'staff' | 'student'; children: ReactNode }) {
  const { t } = useTranslation();
  const portals = [
    { id: 'staff', path: '/login', label: t('auth.staffFaculty'), Icon: Users },
    { id: 'student', path: '/student/login', label: t('auth.studentPortal'), Icon: BookOpen },
  ] as const;

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark"><img src="/brand/hero/vriddhi-mark-hero-light@600.png" alt="" width={44} height={44} /></span>
          <span><strong>{t('brand.portal')}</strong><small>{t('brand.academicSystem')}</small></span>
        </Link>
        <LanguageSwitcher compact showLabel={false} />
      </header>

      <div className="auth-content">
        <section className="auth-story" aria-labelledby="auth-story-heading">
          <p className="auth-eyebrow"><span aria-hidden="true" />{t('brand.subtitle')}</p>
          <h1 id="auth-story-heading">{t('auth.heroTitle')}<br /><em>{t('auth.heroAccent')}</em></h1>
          <p className="auth-story-description">{t('auth.heroDescription')}</p>
          <div className="auth-art">
            <Campus3D showControls={false} autoDrift className="auth-art-3d" />
            <div className="auth-art-note" aria-hidden="true">
              <span className="auth-note-icon"><Sparkles size={20} /></span>
              <span><small>{t('auth.campusLife')}</small><strong>{t('auth.heroCaption')}</strong></span>
              <span className="auth-note-dot" />
            </div>
          </div>
        </section>

        <div className="auth-form-column">
          <section className="auth-card" aria-labelledby="auth-form-heading">
            <nav className="auth-portals" aria-label={t('auth.choosePortal')}>
              {portals.map(({ id, path, label, Icon }) => portal === id
                ? <span key={id} aria-current="page" className="auth-portal auth-portal-active"><Icon size={16} aria-hidden="true" /><span>{label}</span></span>
                : <Link key={id} to={path} className="auth-portal"><Icon size={16} aria-hidden="true" /><span>{label}</span></Link>)}
            </nav>
            <div className="auth-form-intro">
              <span className="auth-welcome-mark" aria-hidden="true"><Sparkles size={18} /></span>
              <h2 id="auth-form-heading">{t('auth.welcomeBack')}</h2>
              <p>{t(portal === 'student' ? 'auth.studentSubtitle' : 'auth.staffSubtitle')}</p>
            </div>
            {children}
          </section>
          <p className="auth-account-note"><ShieldCheck size={14} aria-hidden="true" />{t('auth.collegeAccess')}</p>
        </div>
      </div>

      <footer className="auth-footer">
        <Link to="/"><ArrowLeft size={15} aria-hidden="true" />{t('auth.backHome')}</Link>
        <span aria-hidden="true" className="auth-footer-signature">Vriddhi <span>·</span> {t('auth.heroCaption')}</span>
      </footer>
    </main>
  );
}
