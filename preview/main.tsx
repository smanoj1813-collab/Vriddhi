// ═══════════════════════════════════════════════════════════════════════
// preview/main.tsx — Standalone UI preview of the Academic Calendar.
// Runs against mock data (no Firebase). Not part of the app build.
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, Moon, Sun } from 'lucide-react';

import '../src/index.css';
import AcademicCalendar from '../src/components/AcademicCalendar';

const facultyList = [
  { id: 'f1', name: 'Prof. Anitha R', department: 'CSE' },
  { id: 'f2', name: 'Dr. Kiran Kumar', department: 'CSE' },
  { id: 'f3', name: 'Dr. Meera S', department: 'AIML' },
  { id: 'f4', name: 'Prof. Rajesh N', department: 'ECE' },
];

const curriculumList = [
  {
    id: 'cur1',
    title: 'B.E. CSE — Scheme 2021',
    branch: 'CSE',
    semester: 3,
    courses: [
      {
        id: 'c1', code: '21CS32', name: 'Data Structures',
        modules: [
          { id: 'm1', moduleNo: 1, moduleName: 'Arrays & Linked Lists', title: 'Arrays & Linked Lists' },
          { id: 'm2', moduleNo: 2, moduleName: 'Stacks & Queues', title: 'Stacks & Queues' },
          { id: 'm3', moduleNo: 3, moduleName: 'Trees', title: 'Trees' },
        ],
      },
      {
        id: 'c2', code: '21CS33', name: 'Analog & Digital Electronics',
        modules: [{ id: 'm4', moduleNo: 1, moduleName: 'Logic Gates', title: 'Logic Gates' }],
      },
    ],
  },
  {
    id: 'cur2',
    title: 'B.E. AIML — Scheme 2021',
    branch: 'AIML',
    semester: 6,
    courses: [
      {
        id: 'c3', code: '21AI61', name: 'Machine Learning',
        modules: [
          { id: 'm5', moduleNo: 1, moduleName: 'Supervised Learning', title: 'Supervised Learning' },
          { id: 'm6', moduleNo: 2, moduleName: 'Neural Networks', title: 'Neural Networks' },
        ],
      },
    ],
  },
];

function PreviewApp() {
  const [dark, setDark] = useState(true);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.body.style.backgroundColor = dark ? '#0b1220' : '#f1f5f9';
  }, [dark]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <CalendarDays size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Calendar</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                UI preview with sample data — same component rendered in the Principal dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setDark(d => !d)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>

        <AcademicCalendar
          collegeId="demo-college"
          userId="demo-user"
          userName="Dr. Principal"
          facultyList={facultyList}
          curriculumList={curriculumList}
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PreviewApp />);
