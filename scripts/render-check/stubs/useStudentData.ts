// Stub for `useStudentData` — the real hook must run inside its provider,
// which would pull live Firestore reads into a render check. Defaults are a
// linked student with empty dashboard data; individual checks can override
// fields through __RC_STUDENT_DATA without changing production code.
export function useStudentData() {
  const profile = {
    id: (globalThis as any).__RC_STUDENT_ID ?? 'student-domain-a',
    name: 'Bala Kumar',
    regNo: '21BCA045',
    course: 'BCA',
    batch: '2021-2024',
  };
  return {
    studentId: profile.id,
    collegeId: (globalThis as any).__RC_COLLEGE_ID ?? 'college-a',
    student: profile,
    profile,
    unreadNotifications: 2,
    codingLabEnabled: false,
    assignments: [],
    notifications: [],
    assessments: [],
    schedule: [],
    tests: [],
    warnings: [],
    feeSummary: null,
    fees: null,
    stats: null,
    attendance: null,
    todayDate: '2026-11-13',
    loading: false,
    error: null,
    refresh: () => {},
    ...(globalThis as any).__RC_STUDENT_DATA,
  } as any;
}

export function StudentDataProvider({ children }: { children: any }) {
  return children;
}

export default useStudentData;
