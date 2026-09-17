// prep-app/src/App.tsx
import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { getPrepProgramsForLevel, type PrepDegreeLevel } from '../../functions/src/prepShared';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import HubPage from './pages/HubPage';
import SubjectPage from './pages/SubjectPage';
import TopicPage from './pages/TopicPage';

type ViewState =
  | { page: 'hub' }
  | { page: 'subject'; subjectId: string }
  | { page: 'topic'; subjectId: string; topicId: string; initialTab?: string };

export default function App() {
  const [view, setView] = useState<ViewState>({ page: 'hub' });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [degreeLevel, setDegreeLevel] = useState<PrepDegreeLevel>('undergraduate');
  const [selectedProgram, setSelectedProgram] = useState('bba');

  // Switching degree level snaps to that level's first program, so the hub is
  // never left showing a program that does not belong to the selected level.
  const handleSelectDegreeLevel = (level: PrepDegreeLevel) => {
    setDegreeLevel(level);
    const first = getPrepProgramsForLevel(level)[0];
    if (first) {
      setSelectedProgram(first.code);
      setView({ page: 'hub' });
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
        <Navbar
          onOpenAuth={() => setIsAuthOpen(true)}
          onHomeClick={() => setView({ page: 'hub' })}
          selectedProgram={selectedProgram}
          onSelectProgram={(p) => {
            setSelectedProgram(p);
            setView({ page: 'hub' });
          }}
          degreeLevel={degreeLevel}
          onSelectDegreeLevel={handleSelectDegreeLevel}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {view.page === 'hub' && (
            <HubPage
              selectedProgram={selectedProgram}
              degreeLevel={degreeLevel}
              onSelectSubject={(subjId) => setView({ page: 'subject', subjectId: subjId })}
            />
          )}

          {view.page === 'subject' && (
            <SubjectPage
              subjectId={view.subjectId}
              onBack={() => setView({ page: 'hub' })}
              onSelectTopic={(topId, initialTab) =>
                setView({
                  page: 'topic',
                  subjectId: view.subjectId,
                  topicId: topId,
                  initialTab,
                })
              }
            />
          )}

          {view.page === 'topic' && (
            <TopicPage
              subjectId={view.subjectId}
              topicId={view.topicId}
              initialTab={view.initialTab}
              onBackToSubject={() => setView({ page: 'subject', subjectId: view.subjectId })}
              onBackToHub={() => setView({ page: 'hub' })}
            />
          )}
        </main>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-950 text-center text-xs text-slate-500">
          <p>© 2026 Vriddhi Prep — India's Premier UG/PG Prep Hub (BBA, B.Com, BCA, B.Sc, BA, MBA, M.Com, MCA).</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Centrally operated platform content. Authored once, cached forever with zero AI drift.
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
}
