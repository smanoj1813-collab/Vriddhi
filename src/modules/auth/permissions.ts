// src/modules/auth/permissions.ts
// ------------------------------------------------------------------
// Role → permission matrix for client-side identity & access checks.
//
// Deny-by-default: an unknown or unmapped permission is never granted.
//
// IMPORTANT: this is a UX/authorisation *hint*, not a security boundary.
// Firestore rules and Cloud Functions remain the only trusted enforcement
// points (current-firestore.rules mirrors this matrix: isFinance / isOps /
// isPayrollManager). Use it to show/hide controls and gate routes only.
//
// Office roles
//   accounts   — fees, payments, receipts, challans, finance settings, guest
//                billing, vendor bills, library fines, finance reports and
//                (only when the college enables it) payroll.
//   operations — library, inventory, stores, purchase orders, vendors,
//                library fines, no-dues.
// HODs / department admins hold NO finance access; the principal keeps
// oversight of everything, including payroll, always.
// ------------------------------------------------------------------
import type { UserRole } from './context/auth';

/**
 * Known permission identifiers and the roles that may hold each one.
 * `superadmin` is intentionally omitted and handled as a global bypass.
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

  // ── Academic administration (department heads + principal) ────
  'academic.admin': ['admin', 'hod', 'principal'],
  'grade.manage': ['hod', 'principal', 'admin'],
  'college.manage': ['admin'],
  'users.manage': ['admin'],

  // ── Finance (accounts team) ───────────────────────────────────
  'accounts.desk': ['accounts', 'principal'],
  'fees.manage': ['accounts', 'principal'],
  'finance.settings': ['accounts', 'principal'],
  'finance.reports': ['accounts', 'principal'],
  'guestBilling.manage': ['accounts', 'principal'],
  'vendorBills.manage': ['accounts', 'principal'],
  'fines.waive': ['accounts', 'principal'],
  // Payroll: principal always; other roles only via AccessSettings.payrollRoles.
  'payroll.view': ['principal'],

  // ── Operations (library, inventory, stores) ───────────────────
  'operations.desk': ['operations', 'principal'],
  'library.manage': ['operations', 'principal'],
  'inventory.manage': ['operations', 'principal'],
  'procurement.order': ['operations', 'principal'],
  // Departments raise purchase requests; approval follows the college chain.
  'procurement.request': ['operations', 'principal', 'hod', 'admin', 'accounts'],
  'procurement.approve': ['principal', 'hod', 'admin', 'accounts'],

  // ── Shared office surfaces ────────────────────────────────────
  'library.fines': ['accounts', 'operations', 'principal'],
  'vendors.manage': ['accounts', 'operations', 'principal'],
  'noDues.manage': ['accounts', 'operations', 'principal'],

  // ── Principal-only governance ─────────────────────────────────
  'officeStaff.manage': ['principal'],
  'access.settings': ['principal'],
};

/** All permission identifiers known to the matrix. */
export const KNOWN_PERMISSIONS = Object.keys(PERMISSION_MATRIX) as readonly string[];

/** Roles that belong to the college office (no academic surface). */
export const OFFICE_ROLES: readonly UserRole[] = ['accounts', 'operations'];

/** Roles that may use the academic admin surface (/admin/* academic pages). */
export const ACADEMIC_ADMIN_ROLES: readonly UserRole[] = ['admin', 'hod', 'principal', 'superadmin'];

/** Per-college access choices, stored at colleges/{id}/config/access. */
export interface AccessSettings {
  /** Roles (besides the principal) that may view and run payroll. */
  payrollRoles: UserRole[];
}

export const DEFAULT_ACCESS_SETTINGS: AccessSettings = { payrollRoles: [] };

/** Roles a college may additionally grant payroll to. */
export const PAYROLL_GRANTABLE_ROLES: readonly UserRole[] = ['accounts'];

/**
 * Deny-by-default role check for a single permission.
 *
 * - no role → `false`;
 * - `superadmin` → `true` (global bypass);
 * - `payroll.view` also honours the college's AccessSettings;
 * - unknown permission → `false`.
 */
export function roleHasPermission(
  role: UserRole | null | undefined,
  permission: string,
  access: AccessSettings = DEFAULT_ACCESS_SETTINGS,
): boolean {
  if (!role) return false;
  if (role === 'superadmin') return true;
  if (permission === 'payroll.view' && access.payrollRoles.includes(role)) {
    return (PAYROLL_GRANTABLE_ROLES as readonly string[]).includes(role);
  }
  const allowed = PERMISSION_MATRIX[permission];
  return Array.isArray(allowed) && (allowed as readonly string[]).includes(role);
}

/**
 * /admin/* pages that need a specific permission. Anything under /admin not
 * listed here is an ACADEMIC page (department heads + principal only).
 * `null` = any signed-in /admin user (install app etc.).
 */
export const ADMIN_ROUTE_PERMISSIONS: ReadonlyArray<{ path: string; permission: string | null }> = [
  // Finance
  { path: '/admin/accounts', permission: 'accounts.desk' },
  { path: '/admin/fee-management', permission: 'fees.manage' },
  { path: '/admin/challans', permission: 'fees.manage' },
  { path: '/admin/finance-settings', permission: 'finance.settings' },
  { path: '/admin/finance-reports', permission: 'finance.reports' },
  { path: '/admin/guest-faculty-billing', permission: 'guestBilling.manage' },
  { path: '/admin/payroll', permission: 'payroll.view' },
  { path: '/admin/vendor-bills', permission: 'vendorBills.manage' },
  // Operations
  { path: '/admin/operations', permission: 'operations.desk' },
  { path: '/admin/library', permission: 'library.manage' },
  { path: '/admin/inventory', permission: 'inventory.manage' },
  { path: '/admin/purchase-orders', permission: 'procurement.order' },
  // Shared
  { path: '/admin/library-fines', permission: 'library.fines' },
  { path: '/admin/purchase-requests', permission: 'procurement.request' },
  { path: '/admin/vendors', permission: 'vendors.manage' },
  { path: '/admin/no-dues', permission: 'noDues.manage' },
  // Principal
  { path: '/admin/office-staff', permission: 'officeStaff.manage' },
  // Everyone in the shell
  { path: '/admin/install-app', permission: null },
  { path: '/admin/pwa-install', permission: null },
];

function matchesPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * May `role` open `pathname` (an /admin/* route)? Pure — unit tested.
 * Longest matching entry wins so '/admin/library-fines' is not mistaken for
 * '/admin/library'.
 */
export function canAccessAdminPath(
  role: UserRole | null | undefined,
  pathname: string,
  access: AccessSettings = DEFAULT_ACCESS_SETTINGS,
): boolean {
  if (!role) return false;
  if (role === 'superadmin') return true;
  const path = pathname.replace(/\/+$/, '') || '/admin';
  const entry = ADMIN_ROUTE_PERMISSIONS
    .filter(e => matchesPath(path, e.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (entry) {
    if (entry.permission === null) return true;
    return roleHasPermission(role, entry.permission, access);
  }
  // Unlisted /admin page ⇒ academic surface.
  return (ACADEMIC_ADMIN_ROLES as readonly string[]).includes(role);
}
