// src/types/studentMappers.ts
// ============================================================
// Mappers: StudentIndex ↔ StudentProfile (dashboard compat)
// ============================================================

import type { StudentIndex } from './students';
import type { StudentProfile } from './students';

/** Convert master index record to dashboard StudentProfile */
export function toStudentProfile(s: StudentIndex): StudentProfile {
  return {
    name: s.name,
    regNo: s.registrationNumber,
    course: s.department,
    batch: String(s.batch),
    email: s.email,
    phone: s.phoneNumber,
    avatar: s.avatar,
  };
}

/** Convert StudentProfile back to partial StudentIndex (for updates) */
export function fromStudentProfile(
  profile: StudentProfile,
  collegeId: string
): Partial<StudentIndex> {
  return {
    collegeId,
    name: profile.name,
    email: profile.email || '',
    registrationNumber: profile.regNo,
    phoneNumber: profile.phone || '',
    department: profile.course,
    course: profile.course,
    batch: Number(profile.batch),
    batchString: profile.batch,
  };
}

/** Build a display label: "Vihaan Shinde (VA0001) — B.Com 2027-B" */
export function getStudentLabel(s: StudentIndex): string {
  return `${s.name} (${s.registrationNumber}) — ${s.department} ${s.batch}-${s.division}`;
}

/** Build a short label: "VA0001 — Vihaan" */
export function getStudentShortLabel(s: StudentIndex): string {
  return `${s.registrationNumber} — ${s.name.split(' ')[0]}`;
}