import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { getMyAcademicRiskAlerts, markMyAcademicRiskAlertRead, refreshMyAcademicRiskAlerts } from '../services/riskAlertsApi';

/** Used by LAZY authenticated pages only. Do not import into Layout/login. */
export function useAcademicRiskAlerts() {
  const { user } = useAuth();
  const client = useQueryClient();
  const uid = user?.uid || user?.id || '';
  const key = ['academic-risk-alerts', uid, user?.collegeId, user?.role];
  const eligible = !!uid && ['faculty', 'mentor', 'student', 'hod', 'admin', 'principal'].includes(user?.role || '');
  const query = useQuery({ queryKey: key, queryFn: getMyAcademicRiskAlerts, enabled: eligible,
    staleTime: 30_000, refetchInterval: 120_000, refetchIntervalInBackground: false, retry: 1 });
  const invalidate = () => client.invalidateQueries({ queryKey: ['academic-risk-alerts', uid] });
  const refresh = useMutation({ mutationFn: refreshMyAcademicRiskAlerts, onSuccess: invalidate });
  const markRead = useMutation({ mutationFn: markMyAcademicRiskAlertRead, onSuccess: invalidate });
  useEffect(() => {
    if (!eligible || !('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'VRIDDHI_ACADEMIC_RISK_UPDATED' && event.data.recipientUid === uid) void client.invalidateQueries({ queryKey: ['academic-risk-alerts', uid] });
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [eligible, uid, client]);
  return { ...query, refresh, markRead, eligible, uid, user };
}
