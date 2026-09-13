// src/modules/admin/hooks/useAdmissions.ts
// ------------------------------------------------------------------
// Admission Center state. One list call serves the funnel board, the table and
// the filters, so the counts and the rows are always from the same read.
// ------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  ADMISSION_STAGES,
  describeError,
  listApplications,
  type AdmissionApplication,
  type AdmissionFunnelTotals,
} from '../api/admissionApi';

export interface UseAdmissionsReturn {
  applications: AdmissionApplication[];
  counts: Record<string, number>;
  totals: AdmissionFunnelTotals;
  loading: boolean;
  error: string | null;
  collegeId: string;
  refresh: () => void;
}

export function useAdmissions(): UseAdmissionsReturn {
  const { user } = useAuth();
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || '';

  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<AdmissionFunnelTotals>({
    total: 0,
    inPipeline: 0,
    reachedOffer: 0,
    enrolled: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!collegeId) {
      setLoading(false);
      setError('No college is linked to this sign-in.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    listApplications(collegeId)
      .then((data) => {
        if (cancelled) return;
        setApplications(data.applications);
        setCounts(data.counts);
        setTotals(data.totals);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(describeError(err));
        setApplications([]);
        setCounts({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [collegeId, nonce]);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  return { applications, counts, totals, loading, error, collegeId, refresh };
}

/** Filters for the application table. */
export interface AdmissionFilters {
  stage: string;
  program: string;
  batch: string;
  search: string;
}

export const EMPTY_FILTERS: AdmissionFilters = { stage: 'all', program: 'all', batch: 'all', search: '' };

export function useFilteredAdmissions(
  applications: AdmissionApplication[],
  filters: AdmissionFilters
): AdmissionApplication[] {
  return useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return applications.filter((application) => {
      if (filters.stage !== 'all' && application.status !== filters.stage) return false;
      if (filters.program !== 'all' && application.program !== filters.program) return false;
      if (filters.batch !== 'all' && application.batch !== filters.batch) return false;
      if (!search) return true;
      const haystack = [
        application.applicationNo,
        application.applicantName,
        application.email,
        application.phone,
        application.regNo,
        application.city,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [applications, filters]);
}

/** Distinct program and batch values present in the real data. */
export function useAdmissionCohorts(applications: AdmissionApplication[]): {
  programs: string[];
  batches: string[];
} {
  return useMemo(() => {
    const programs = new Set<string>();
    const batches = new Set<string>();
    applications.forEach((application) => {
      if (application.program) programs.add(application.program);
      if (application.batch) batches.add(application.batch);
    });
    return { programs: [...programs].sort(), batches: [...batches].sort() };
  }, [applications]);
}

/**
 * Rank applicants within a stage by merit.
 *
 * Applicants with no recorded components sort last and are labelled
 * "not scored" rather than ranked at zero — a missing score is missing
 * paperwork, not a result.
 */
export function rankByMerit(applications: AdmissionApplication[]): Array<{
  application: AdmissionApplication;
  rank: number | null;
}> {
  const scored = applications.filter((application) => application.merit.score !== null);
  const unscored = applications.filter((application) => application.merit.score === null);

  const ordered = [...scored].sort(
    (left, right) => (right.merit.score as number) - (left.merit.score as number)
  );

  return [
    ...ordered.map((application, index) => ({ application, rank: index + 1 })),
    ...unscored.map((application) => ({ application, rank: null })),
  ];
}

export const STAGE_LABELS: Record<string, string> = {
  enquiry: 'Enquiry',
  application: 'Application',
  screening: 'Screening',
  offer: 'Offer',
  fee: 'Fee',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export { ADMISSION_STAGES };
