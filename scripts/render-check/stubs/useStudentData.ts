// Stub for `useStudentData` — the real hook must run inside its provider,
// which would drag the whole student data layer (and its Firestore reads) into
// a render check. Only the identity fields pages read are provided.
export function useStudentData() {
  return {
    studentId: (globalThis as any).__RC_STUDENT_ID ?? 'student-domain-a',
    collegeId: (globalThis as any).__RC_COLLEGE_ID ?? 'college-a',
    profile: {
      id: (globalThis as any).__RC_STUDENT_ID ?? 'student-domain-a',
      name: 'Bala Kumar',
      regNo: '21BCA045',
      course: 'BCA',
      batch: '2021-2024',
    },
    unreadNotifications: 2,
    loading: false,
    error: null,
    refresh: () => {},
  } as any;
}

export function StudentDataProvider({ children }: { children: any }) {
  return children;
}

export default useStudentData;
