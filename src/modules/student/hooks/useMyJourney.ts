// src/modules/student/hooks/useMyJourney.ts
// ------------------------------------------------------------------
// The signed-in student's academic journey, end to end.
//
// Every figure comes from the `getMyAcademicJourney` callable, which reads the
// student's real attendance rows, real assessment attempts and real published
// grade records, and counts their rank across their own batch and branch.
// Nothing here derives a grade from a test percentage and nothing is
// defaulted: where the college has published no grades yet, the value is
// `null` and the UI says so rather than showing a plausible-looking number.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';

export interface JourneyProfile {
  name: string;
  regNo: string;
  course: string;
  branch: string;
  batch: string;
  division: string;
  semester: number;
}

export interface JourneyAttendance {
  percentage: number | null;
  totalClasses: number;
  present: number;
  late: number;
  absent: number;
  requiredPercentage: number;
}

export interface JourneyAssessmentEntry {
  title: string;
  subject: string;
  percentage: number;
  grade: string;
  submittedAt: string | null;
}

export interface JourneyAssessments {
  attempted: number;
  graded: number;
  awaitingGrading: number;
  averagePercentage: number | null;
  recent: JourneyAssessmentEntry[];
}

export interface JourneySubject {
  code: string;
  subject: string;
  credits: number;
  gradePoint: number;
  grade: string;
  total: number | null;
  semester: number;
}

export interface JourneySemester {
  semester: number;
  sgpa: number | null;
  credits: number;
}

export interface JourneyGrades {
  published: boolean;
  subjects: JourneySubject[];
  semesters: JourneySemester[];
  cgpa: number | null;
  creditsEarned: number;
}

export interface JourneyStanding {
  branch: string;
  batch: string;
  cohortSize: number;
  rank: number | null;
  percentile: number | null;
}

export interface ReadinessBandInfo {
  id: string;
  label: string;
  outlook: string;
  minCgpa: number;
}

export interface JourneyReadiness {
  hasCgpa: boolean;
  band: { id: string; label: string; outlook: string } | null;
  minCgpaForBand: number | null;
  nextBand: { id: string; label: string; minCgpa: number; gap: number | null } | null;
  attendanceGate: number;
  attendanceShortfall: number;
  bands: ReadinessBandInfo[];
}

export interface AcademicJourney {
  profile: JourneyProfile;
  attendance: JourneyAttendance;
  assessments: JourneyAssessments;
  grades: JourneyGrades;
  standing: JourneyStanding;
  readiness: JourneyReadiness;
}

export interface UseMyJourneyReturn {
  journey: AcademicJourney | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMyJourney(): UseMyJourneyReturn {
  const [journey, setJourney] = useState<AcademicJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const getMyAcademicJourney = httpsCallable<Record<string, never>, AcademicJourney>(
      functions,
      'getMyAcademicJourney'
    );

    getMyAcademicJourney({})
      .then((result) => {
        if (cancelled) return;
        setJourney(result.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          typeof (err as { message?: unknown })?.message === 'string'
            ? ((err as { message: string }).message as string)
            : 'Could not load your academic journey.';
        setError(message);
        setJourney(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  return { journey, loading, error, refresh };
}

/**
 * Which stage of the journey the student has actually reached, from real
 * records — not a fixed list. A stage is `done` only when the underlying data
 * proves it, and `blocked` when the data says the student cannot progress yet
 * (for example attendance below the published gate).
 */
export type StageState = 'done' | 'active' | 'upcoming' | 'blocked';

export interface JourneyStage {
  id: string;
  title: string;
  description: string;
  state: StageState;
  detail: string;
}

export function buildJourneyStages(journey: AcademicJourney): JourneyStage[] {
  const { attendance, assessments, grades, standing, readiness } = journey;

  const enrolled: JourneyStage = {
    id: 'enrolled',
    title: 'Enrolled',
    description: 'Admission and programme registration',
    state: 'done',
    detail: [
      journey.profile.regNo && `Reg. ${journey.profile.regNo}`,
      journey.profile.course,
      journey.profile.branch,
      journey.profile.batch && `Batch ${journey.profile.batch}`,
    ]
      .filter(Boolean)
      .join(' · '),
  };

  const attendanceBelowGate =
    attendance.percentage !== null && attendance.percentage < readiness.attendanceGate;

  const learning: JourneyStage = {
    id: 'learning',
    title: 'Attending & learning',
    description: 'Classes attended across marked sessions',
    state:
      attendance.percentage === null
        ? 'active'
        : attendanceBelowGate
          ? 'blocked'
          : 'done',
    detail:
      attendance.percentage === null
        ? 'No attendance has been marked for you yet.'
        : `${attendance.percentage}% of ${attendance.totalClasses} marked sessions` +
          (attendanceBelowGate
            ? ` — below the ${readiness.attendanceGate}% gate`
            : ''),
  };

  const assessed: JourneyStage = {
    id: 'assessed',
    title: 'Assessed',
    description: 'Internal tests and assessments',
    state:
      assessments.graded > 0 ? 'done' : assessments.attempted > 0 ? 'active' : 'upcoming',
    detail:
      assessments.attempted === 0
        ? 'No assessment attempts recorded yet.'
        : `${assessments.graded} graded of ${assessments.attempted} attempted` +
          (assessments.averagePercentage !== null
            ? ` · average ${assessments.averagePercentage}%`
            : ' · awaiting grades'),
  };

  const graded: JourneyStage = {
    id: 'graded',
    title: 'Results published',
    description: 'Official transcript grades and CGPA',
    state: grades.published ? 'done' : 'upcoming',
    detail: grades.published
      ? `CGPA ${grades.cgpa ?? '—'} across ${grades.creditsEarned} credits` +
        (standing.rank !== null ? ` · rank ${standing.rank} of ${standing.cohortSize}` : '')
      : 'Your college has not published grades for you yet.',
  };

  const placement: JourneyStage = {
    id: 'placement',
    title: 'Placement ready',
    description: 'Eligible for the drives your college publishes',
    state:
      !readiness.hasCgpa
        ? 'upcoming'
        : readiness.attendanceShortfall > 0 || readiness.band?.id === 'below'
          ? 'blocked'
          : 'done',
    detail: !readiness.hasCgpa
      ? 'Readiness is calculated once your grades are published.'
      : readiness.attendanceShortfall > 0
        ? `${readiness.band?.label} — attendance is ${readiness.attendanceShortfall}% short of the ${readiness.attendanceGate}% gate.`
        : `${readiness.band?.label}. ${readiness.band?.outlook}`,
  };

  return [enrolled, learning, assessed, graded, placement];
}
