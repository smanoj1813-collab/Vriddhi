import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/data';
import type { RiskCategory, RiskSeverity, RiskSettings } from '../../../functions/src/riskCore';

export interface AcademicRiskAlert {
  id: string;
  key: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  message: string;
  path: string;
  subjectUid: string;
  subjectName: string;
  state: 'active' | 'unverified' | 'resolved' | 'archived';
  stale: boolean;
  read: boolean;
  checkedAt: number;
  createdAt: number;
  updatedAt: number;
}
export interface AcademicRiskInbox {
  alerts: AcademicRiskAlert[];
  checkedAt: number | null;
  truncated: boolean;
  canConfigure: boolean;
  reviewCadence?: 'daily' | 'weekly' | 'monthly';
}
export interface FacultyRiskWorkSchedule {
  facultyUid: string;
  days: number[];
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo: string;
  excludedDates: string[];
}
export interface AcademicRiskConfiguration {
  settings: RiskSettings;
  revision: number;
  schedules: FacultyRiskWorkSchedule[];
  faculty: Array<{ uid: string; name: string }>;
  truncated: boolean;
}
async function call<T>(name: string, payload: unknown = {}): Promise<T> {
  return (await httpsCallable<unknown, T>(functions, name)(payload)).data;
}
export const getMyAcademicRiskAlerts = () => call<AcademicRiskInbox>('getMyAcademicRiskAlerts');
export const markMyAcademicRiskAlertRead = (id: string) => call('markMyAcademicRiskAlertRead', { id });
export const getAcademicRiskConfiguration = () => call<AcademicRiskConfiguration>('getAcademicRiskConfiguration');
export const saveAcademicRiskConfiguration = (settings: RiskSettings, expectedRevision: number) => call('saveAcademicRiskConfiguration', { settings, expectedRevision });
export const saveFacultyRiskWorkSchedule = (facultyUid: string, schedule: Omit<FacultyRiskWorkSchedule, 'facultyUid'> | null) => call('saveFacultyRiskWorkSchedule', schedule ? { facultyUid, schedule } : { facultyUid, remove: true });
export const registerAcademicRiskDevice = (token: string) => call('registerMyAcademicRiskDevice', { token });
export const unregisterAcademicRiskDevice = (token: string) => call('unregisterMyAcademicRiskDevice', { token });
