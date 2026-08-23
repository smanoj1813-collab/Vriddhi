// src/types/superAdmin.ts
// Centralized types for Super Admin module

import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════════════
// UNIVERSITY CLASSIFICATION (shared with types/university.ts)
// ═══════════════════════════════════════════════════════════════════════

export type UniversityManagementType = "Government" | "Government Aided" | "Private";
export type AutonomyStatus = "Autonomous" | "Non-Autonomous";
export type CourseCode = "BA" | "B.Com" | "BBA" | "BCA" | "B.Sc" | "BSW" | "BPA" | "B.Voc";
export type VriddhiStatus = "not_onboarded" | "onboarding" | "active" | "suspended";

// ═══════════════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════════════
export interface PaginatedResult<T> {
  items: T[];
  data: T[]; // alias for items, backward compatibility
  total: number;
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

// ═══════════════════════════════════════════════════════════════════════
// COLLEGE TYPES
// ═══════════════════════════════════════════════════════════════════════
export type CollegeStatus = "active" | "inactive" | "suspended" | "trial";
export type PlanType = "basic" | "standard" | "premium" | "enterprise" | "pro";
export type BillingCycle = "monthly" | "quarterly" | "yearly";

export interface College {
  id: string;
  name: string;
  code: string;
  shortName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: CollegeStatus;
  plan: PlanType;
  billingCycle: BillingCycle;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  facultyCount: number;
  adminCount: number;
  currentStudents?: number;
  currentFaculty?: number;
  courses?: number;
  subscriptionEnd?: string;
  logo?: string;

  // ═══ NEW: University Classification Fields ═══
  /** Firestore ID of the affiliated university */
  universityId?: string;
  /** Name of the affiliated university */
  universityName?: string;
  /** University short code (e.g., "BCU", "BU") */
  universityCode?: string;
  /** Government / Government Aided / Private */
  managementType?: UniversityManagementType;
  /** Autonomous / Non-Autonomous */
  autonomyStatus?: AutonomyStatus;
  /** Karnataka district where the college is located */
  district?: string;
  /** Courses this specific college offers (subset of university courses) */
  offeredCourses?: CourseCode[];
  /** Vriddhi onboarding status */
  vriddhiStatus?: VriddhiStatus;
  /** When the college was onboarded to Vriddhi */
  vriddhiOnboardingDate?: string;
}

export interface CreateCollegeInput {
  name: string;
  code: string;
  shortName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  plan?: PlanType;
  billingCycle?: BillingCycle;
  currentStudents?: number;
  currentFaculty?: number;
  courses?: number;
  subscriptionEnd?: string;
  pincode?: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  establishedYear?: string;
  affiliation?: string;
  accreditation?: string;
  description?: string;

  // ═══ NEW ═══
  universityId?: string;
  universityName?: string;
  managementType?: UniversityManagementType;
  autonomyStatus?: AutonomyStatus;
  district?: string;
  offeredCourses?: CourseCode[];
}

export interface ListCollegesOptions {
  status?: CollegeStatus | "all";
  search?: string;
  limit?: number;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN TYPES
// ═══════════════════════════════════════════════════════════════════════
export type AdminRole = "superadmin" | "admin" | "hod" | "mentor" | "coordinator" | "department_head";
export type AdminStatus = "active" | "inactive";

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  collegeId: string;
  collegeName?: string;
  collegeCode?: string;
  status: AdminStatus;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  department?: string;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  role: AdminRole;
  collegeId: string;
  phone?: string;
  department?: string;
  password?: string;
}

export interface ListAdminsOptions {
  collegeId?: string;
  status?: AdminStatus | "all";
  role?: AdminRole;
  search?: string;
  limit?: number;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

// ═══════════════════════════════════════════════════════════════════════
// STUDENT TYPES
// ═══════════════════════════════════════════════════════════════════════
export type StudentStatus = "active" | "inactive";

export interface Student {
  id: string;
  name: string;
  email: string;
  regNo: string;
  collegeId: string;
  collegeName?: string;
  batch: string;
  division: string;
  mentor?: string;
  department?: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
  avatar?: string;
  uid?: string;
}

export interface ListStudentsOptions {
  collegeId?: string;
  batch?: string;
  division?: string;
  status?: StudentStatus | "all";
  search?: string;
  limit?: number;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

export interface UpdateStudentInput {
  name?: string;
  email?: string;
  regNo?: string;
  batch?: string;
  division?: string;
  mentor?: string;
  department?: string;
  status?: StudentStatus;
  phone?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// IMPORT TYPES
// ═══════════════════════════════════════════════════════════════════════
export interface ImportUserEntry {
  name: string;
  email: string;
  regNo?: string;
  role: "student" | "faculty";
  batch?: string;
  division?: string;
  phone?: string;
  mentor?: string;
  department?: string;
  semester?: number;
  dob?: string;
  gender?: string;
  address?: string;
}

export interface ImportUsersInput {
  collegeId: string;
  users: ImportUserEntry[];
}

export interface ImportResult {
  success: number;
  successful?: number;
  failed: number;
  errors: string[];
  imported: Array<{ id: string; email: string; password?: string }>;
}

// ═══════════════════════════════════════════════════════════════════════
// FACULTY IMPORT TYPES
// ═══════════════════════════════════════════════════════════════════════
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'ADJUNCT' | 'VISITING';

export interface FacultyImportEntry {
  facultyId?: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  gender?: string;
  collegeName?: string;
  collegeCode: string;
  department?: string;
  designation?: string;
  employmentType?: EmploymentType;
  joiningDate?: string;
  qualification?: string;
  specialization?: string;
  subjectsUG?: string[];
  subjectsPG?: string[];
  experienceYears?: number;
  isHOD?: boolean;
}

export interface FacultyImportPayload {
  collegeId: string;
  faculty: FacultyImportEntry[];
}

// ═══════════════════════════════════════════════════════════════════════
// FACULTY TYPES
// ═══════════════════════════════════════════════════════════════════════
export interface Faculty {
  id: string;
  facultyId: string;
  name: string;           // ← computed from firstName + lastName
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  collegeId: string;
  collegeName: string;
  collegeCode: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  joiningDate: string;
  qualification: string;
  specialization: string;
  subjectsUG: string[];
  subjectsPG: string[];
  experienceYears: number;
  isHOD: boolean;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  password?: string;
  lastLogin?: string;
}

export interface ListFacultyOptions {
  collegeId?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  limit?: number;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

export interface UpdateFacultyInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  department?: string;
  designation?: string;
  employmentType?: EmploymentType;
  joiningDate?: string;
  qualification?: string;
  specialization?: string;
  subjectsUG?: string[];
  subjectsPG?: string[];
  experienceYears?: number;
  isHOD?: boolean;
  status?: 'active' | 'inactive';
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD TYPES
// ═══════════════════════════════════════════════════════════════════════
export interface DashboardStats {
  totalColleges: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  activeColleges: number;
  suspendedColleges: number;
  newCollegesThisMonth: number;
  revenueThisMonth: number;
  activeAssessments?: number;
  recentImports?: number;
  planDistribution?: Record<string, number>;
}

export interface RecentActivity {
  id: string;
  type: "college_created" | "admin_created" | "student_imported" | "plan_changed" | "login";
  description: string;
  userName: string;
  user?: string;
  action?: string;
  target?: string;
  status?: string;
  timestamp: string;
  collegeName?: string;
}

export interface TopCollege {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  facultyCount: number;
  students?: number;
  faculty?: number;
  avgAttendance: number;
  passRate: number;
  score: number;
  status?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPARISON TYPES
// ═══════════════════════════════════════════════════════════════════════
export type ComparisonMetric = "attendance" | "score" | "passRate" | "feeCollection" | "libraryUsage" | "placement" | "mentorRatio" | "research";
export type TimeRange = "7d" | "30d" | "90d" | "1y";

export interface ComparisonFilter {
  metric: ComparisonMetric;
  timeRange: TimeRange;
}

export interface CollegeMetric {
  collegeId: string;
  collegeName: string;
  collegeCode: string;
  students: number;
  faculty: number;
  avgAttendance: number;
  avgScore: number;
  passRate: number;
  feeCollectionRate: number;
  libraryUsage: number;
  placementRate: number;
  mentorRatio: number;
  researchPapers: number;
  trendAttendance: number;
  trendScore: number;
  trendPassRate: number;
  percentileAttendance: number;
  percentileScore: number;
  percentilePassRate: number;
}

export interface ComparisonResult {
  colleges: CollegeMetric[];
  average: number;
  median: number;
  stdDev: number;
  best: CollegeMetric;
  worst: CollegeMetric;
}

export interface BenchmarkData {
  metric: string;
  collegeValue: number;
  averageValue: number;
  topValue: number;
  percentile: number;
}

// ═══════════════════════════════════════════════════════════════════════
// SUBSCRIPTION TYPES
// ═══════════════════════════════════════════════════════════════════════
export interface SubscriptionPlan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  billingCycle: BillingCycle;
  maxStudents: number;
  maxFaculty: number;
  maxStorageGB: number;
  maxAssessments: number;
  features: string[];
  isPopular?: boolean;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export type SubscriptionStatus = "active" | "suspended" | "trialing" | "past_due" | "canceled";

export interface CollegeSubscription {
  id: string;
  collegeId: string;
  collegeName: string;
  collegeCode: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  autoRenew: boolean;
  nextBillingDate: string;
  trialEndsAt?: string;
  usage: {
    students: { used: number; limit: number };
    studentsUsed?: number;
    faculty: { used: number; limit: number };
    facultyUsed?: number;
    storage: { used: number; limit: number };
    storageUsedGB?: number;
    assessments: { used: number; limit: number };
  };
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "paid" | "pending" | "overdue" | "failed" | "refunded";

export interface PaymentRecord {
  id: string;
  collegeId: string;
  collegeName: string;
  invoiceNumber: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentHistory {
  id: string;
  collegeId: string;
  collegeName: string;
  invoiceNumber: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  createdAt: string;
}

export interface RenewalAlert {
  id: string;
  collegeId: string;
  collegeName: string;
  planName: string;
  daysUntilExpiry: number;
  currentPlan: PlanType;
  amount: number;
  status: "info" | "warning" | "urgent";
  autoRenewEnabled: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// SYSTEM HEALTH TYPES
// ═══════════════════════════════════════════════════════════════════════
export type HealthStatus = "healthy" | "degraded" | "critical" | "maintenance";

export interface ServiceHealth {
  name: string;
  status: "operational" | "degraded" | "down";
  uptime: number;
  responseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  incidents24h: number;
  lastChecked: string;
}

export interface SlowQuery {
  id: string;
  query: string;
  endpoint: string;
  duration: number;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
}

export interface ErrorLog {
  id: string;
  message: string;
  endpoint: string;
  method: string;
  statusCode: number;
  count: number;
  firstSeen: string;
  lastSeen: string;
  stack?: string;
  resolved: boolean;
}

export interface HealthAlert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
  service?: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SystemHealthStatus {
  overallStatus: HealthStatus;
  uptime: number;
  uptime24h: number;
  errorRate24h: number;
  avgResponseTime: number;
  totalRequests24h: number;
  services: ServiceHealth[];
  slowQueries: SlowQuery[];
  recentErrors: ErrorLog[];
  alerts: HealthAlert[];
}

export interface PerformanceMetric {
  timestamp: string;
  responseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

// ═══════════════════════════════════════════════════════════════════════
// API ERROR
// ═══════════════════════════════════════════════════════════════════════
export class SuperAdminApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "SuperAdminApiError";
  }
}