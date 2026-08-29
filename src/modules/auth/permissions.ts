// src/modules/auth/permissions.ts
// ------------------------------------------------------------------
// Role → permission matrix for client-side identity & access checks.
//
// `hasPermission` in AuthContext previously returned `true` for every
// permission string, which made it an unusable (and dangerous) gate:
// any future UI/API code relying on it would have silently authorised
// everything. This module replaces that with a deny-by-default matrix so
// an unknown or unmapped permission can never be granted accidentally.
//
// IMPORTANT: this is a UX/authorisation *hint*, not a security boundary.
// Firebase Firestore rules and Cloud Functions remain the only trusted
// enforcement points. Never use `hasPermission` to decide what data a
// caller may receive — only to show/hide controls.
// ------------------------------------------------------------------
import type { UserRole } from './context/auth';

/**
 * Known permission identifiers and the roles that may hold each one.
 * `superadmin` is intentionally omitted from every list and handled as a
 * global bypass in `roleHasPermission`.
 */
export const PERMISSION_MATRIX: Readonly<Record<string, readonly UserRole[]>> = {
  // ── Student portal ─────────────────────────────────────────────
  'student.access': ['student', 'parent'],
  'student.assessments': ['student'],
  'student.assignments': ['student'],
  'student.grades': ['student', 'parent'],

  // ── Faculty / academic operations ─────────────────────────────
  'faculty.access': ['faculty', 'mentor', 'hod', 'principal', 'admin'],
  'faculty.attendance': ['faculty', 'mentor', 'hod', 'principal', 'admin'],
  'faculty.schedule': ['faculty', 'hod', 'principal', 'admin'],
  'faculty.assessments': ['faculty', 'hod', 'principal', 'admin'],

  // ── Content authoring ─────────────────────────────────────────
  'question.manage': ['faculty', 'hod', 'principal', 'admin'],
  'paper.manage': ['faculty', 'hod', 'principal', 'admin'],

  // ── Administrative / college governance ───────────────────────
  'grade.manage': ['hod', 'principal', 'admin'],
  'fees.manage': ['admin'],
  'college.manage': ['admin'],
  'users.manage': ['admin'],
};

/** All permission identifiers known to the matrix. */
export const KNOWN_PERMISSIONS = Object.keys(PERMISSION_MATRIX) as readonly string[];

/**
 * Deny-by-default role check for a single permission.
 *
 * - no role → `false`;
 * - `superadmin` → `true` (global bypass);
 * - unknown permission → `false`;
 * - otherwise → `true` only when the role is listed for the permission.
 */
export function roleHasPermission(
  role: UserRole | null | undefined,
  permission: string
): boolean {
  if (!role) return false;
  if (role === 'superadmin') return true;
  const allowed = PERMISSION_MATRIX[permission];
  return Array.isArray(allowed) && (allowed as readonly string[]).includes(role);
}
