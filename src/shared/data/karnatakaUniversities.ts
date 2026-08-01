// src/shared/data/karnatakaUniversities.ts
import type {
  University,
  DistrictUniversityMapping,
  UniversityCourse,
} from "../types/university";

const COURSE_MAP: Record<string, UniversityCourse> = {
  BA: { code: "BA", name: "Bachelor of Arts" },
  "B.Com": { code: "B.Com", name: "Bachelor of Commerce" },
  BBA: { code: "BBA", name: "Bachelor of Business Administration" },
  BCA: { code: "BCA", name: "Bachelor of Computer Applications" },
  "B.Sc": { code: "B.Sc", name: "Bachelor of Science" },
  BSW: { code: "BSW", name: "Bachelor of Social Work" },
  BPA: { code: "BPA", name: "Bachelor of Performing Arts" },
  "B.Voc": { code: "B.Voc", name: "Bachelor of Vocation" },
};

const toCourses = (codes: string[]): UniversityCourse[] =>
  codes.map((code) => COURSE_MAP[code] || { code, name: code });

const COURSES_ALL = toCourses(["BA", "B.Com", "BBA", "BCA", "B.Sc", "BSW", "BPA", "B.Voc"]);
const COURSES_CORE = toCourses(["BA", "B.Com", "BBA", "BCA", "B.Sc"]);
const COURSES_CORE_BSW = toCourses(["BA", "B.Com", "BBA", "BCA", "B.Sc", "BSW"]);
const COURSES_CORE_BPA = toCourses(["BA", "B.Com", "BBA", "BCA", "B.Sc", "BSW", "BPA"]);
const COURSES_CORE_VOC = toCourses(["BA", "B.Com", "BBA", "BCA", "B.Sc", "BSW", "B.Voc"]);

export const KARNATAKA_UNIVERSITIES: Omit<University, "id" | "createdAt" | "updatedAt" | "status">[] = [
  {
    name: "Bengaluru City University", shortName: "BCU", code: "BCU",
    managementType: "Government", priority: 1,
    districts: ["Bengaluru Urban (Central Colleges)"],
    collegeCountMin: 200, collegeCountMax: 240,
    courses: COURSES_CORE_BPA, location: "Bengaluru", establishedYear: 2017,
  },
  {
    name: "Bengaluru North University", shortName: "BNU", code: "BNU",
    managementType: "Government", priority: 1,
    districts: ["Kolar", "Chikkaballapur", "Bengaluru Urban (North)"],
    collegeCountMin: 180, collegeCountMax: 220,
    courses: COURSES_CORE, location: "Bengaluru", establishedYear: 2017,
  },
  {
    name: "Karnatak University", shortName: "KUD", code: "KUD",
    managementType: "Government", priority: 1,
    districts: ["Dharwad", "Gadag", "Haveri", "Uttara Kannada"],
    collegeCountMin: 230, collegeCountMax: 260,
    courses: COURSES_CORE_BSW, location: "Dharwad", establishedYear: 1949,
  },
  {
    name: "Rani Channamma University", shortName: "RCU", code: "RCU",
    managementType: "Government", priority: 1,
    districts: ["Belagavi"],
    collegeCountMin: 180, collegeCountMax: 200,
    courses: COURSES_CORE_BSW, location: "Belagavi", establishedYear: 2010,
  },
  {
    name: "Mangalore University", shortName: "MNG", code: "MNG",
    managementType: "Government", priority: 1,
    districts: ["Dakshina Kannada", "Udupi"],
    collegeCountMin: 160, collegeCountMax: 170,
    courses: COURSES_CORE_BSW, location: "Mangaluru", establishedYear: 1980,
  },
  {
    name: "Bengaluru University", shortName: "BU", code: "BU",
    managementType: "Government", priority: 2,
    districts: ["Bengaluru Urban (South/West Colleges)", "Bengaluru Rural", "Ramanagara"],
    collegeCountMin: 130, collegeCountMax: 150,
    courses: COURSES_CORE_VOC, location: "Bengaluru", establishedYear: 1964,
  },
  {
    name: "University of Mysore", shortName: "UOM", code: "UOM",
    managementType: "Government", priority: 2,
    districts: ["Mysuru"],
    collegeCountMin: 110, collegeCountMax: 130,
    courses: COURSES_CORE_BPA, location: "Mysuru", establishedYear: 1916,
  },
  {
    name: "Gulbarga University", shortName: "GUL", code: "GUL",
    managementType: "Government", priority: 2,
    districts: ["Kalaburagi"],
    collegeCountMin: 120, collegeCountMax: 140,
    courses: COURSES_CORE_BSW, location: "Kalaburagi", establishedYear: 1980,
  },
  {
    name: "Kuvempu University", shortName: "KUV", code: "KUV",
    managementType: "Government", priority: 2,
    districts: ["Shivamogga", "Chikkamagaluru"],
    collegeCountMin: 120, collegeCountMax: 140,
    courses: COURSES_CORE_BSW, location: "Shivamogga", establishedYear: 1987,
  },
  {
    name: "Davangere University", shortName: "DAV", code: "DAV",
    managementType: "Government", priority: 3,
    districts: ["Davanagere", "Chitradurga"],
    collegeCountMin: 90, collegeCountMax: 110,
    courses: COURSES_CORE, location: "Davanagere", establishedYear: 2009,
  },
  {
    name: "Tumakuru University", shortName: "TUM", code: "TUM",
    managementType: "Government", priority: 3,
    districts: ["Tumakuru"],
    collegeCountMin: 90, collegeCountMax: 110,
    courses: COURSES_CORE_BSW, location: "Tumakuru", establishedYear: 2017,
  },
  {
    name: "Vijayanagara Sri Krishnadevaraya University", shortName: "VSKU", code: "VSKU",
    managementType: "Government", priority: 3,
    districts: ["Ballari", "Vijayanagara"],
    collegeCountMin: 110, collegeCountMax: 130,
    courses: COURSES_CORE, location: "Ballari", establishedYear: 2010,
  },
  {
    name: "Mandya University", shortName: "MND", code: "MND",
    managementType: "Government", priority: 4,
    districts: ["Mandya"],
    collegeCountMin: 35, collegeCountMax: 50,
    courses: COURSES_CORE, location: "Mandya", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Hassan University", shortName: "HAS", code: "HAS",
    managementType: "Government", priority: 4,
    districts: ["Hassan"],
    collegeCountMin: 40, collegeCountMax: 60,
    courses: COURSES_CORE, location: "Hassan", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Kodagu University", shortName: "KOD", code: "KOD",
    managementType: "Government", priority: 4,
    districts: ["Kodagu"],
    collegeCountMin: 15, collegeCountMax: 25,
    courses: COURSES_CORE, location: "Madikeri", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Chamarajanagar University", shortName: "CMR", code: "CMR",
    managementType: "Government", priority: 4,
    districts: ["Chamarajanagar"],
    collegeCountMin: 20, collegeCountMax: 30,
    courses: COURSES_CORE, location: "Chamarajanagar", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Koppal University", shortName: "KOP", code: "KOP",
    managementType: "Government", priority: 4,
    districts: ["Koppal"],
    collegeCountMin: 25, collegeCountMax: 40,
    courses: COURSES_CORE, location: "Koppal", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Raichur University", shortName: "RAI", code: "RAI",
    managementType: "Government", priority: 4,
    districts: ["Raichur"],
    collegeCountMin: 35, collegeCountMax: 50,
    courses: COURSES_CORE, location: "Raichur", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Yadgir University", shortName: "YAD", code: "YAD",
    managementType: "Government", priority: 4,
    districts: ["Yadgir"],
    collegeCountMin: 20, collegeCountMax: 35,
    courses: COURSES_CORE, location: "Yadgir", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Bidar University", shortName: "BID", code: "BID",
    managementType: "Government", priority: 4,
    districts: ["Bidar"],
    collegeCountMin: 30, collegeCountMax: 45,
    courses: COURSES_CORE, location: "Bidar", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Bagalkot University", shortName: "BGK", code: "BGK",
    managementType: "Government", priority: 4,
    districts: ["Bagalkot"],
    collegeCountMin: 40, collegeCountMax: 60,
    courses: COURSES_CORE, location: "Bagalkot", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Haveri University", shortName: "HAV", code: "HAV",
    managementType: "Government", priority: 4,
    districts: ["Haveri"],
    collegeCountMin: 25, collegeCountMax: 40,
    courses: COURSES_CORE, location: "Haveri", establishedYear: 2017, isNewUniversity: true,
  },
  {
    name: "Akkamahadevi Women's University", shortName: "AMWU", code: "AMWU",
    managementType: "Government", priority: 5,
    districts: ["Vijayapura", "Statewide (Women's Colleges)"],
    collegeCountMin: 150, collegeCountMax: 180,
    courses: COURSES_CORE, location: "Vijayapura", establishedYear: 2003, isWomensUniversity: true,
  },
];

export const DISTRICT_UNIVERSITY_MAP: DistrictUniversityMapping[] = [
  { district: "Bengaluru Urban (Central Colleges)", primaryUniversityId: "BCU", primaryUniversityName: "Bengaluru City University", courses: COURSES_CORE_BPA },
  { district: "Bengaluru Urban (South/West Colleges)", primaryUniversityId: "BU", primaryUniversityName: "Bengaluru University", courses: COURSES_CORE_VOC },
  { district: "Bengaluru Rural", primaryUniversityId: "BU", primaryUniversityName: "Bengaluru University", courses: COURSES_CORE },
  { district: "Ramanagara", primaryUniversityId: "BU", primaryUniversityName: "Bengaluru University", courses: COURSES_CORE },
  { district: "Kolar", primaryUniversityId: "BNU", primaryUniversityName: "Bengaluru North University", courses: COURSES_CORE },
  { district: "Chikkaballapur", primaryUniversityId: "BNU", primaryUniversityName: "Bengaluru North University", courses: COURSES_CORE },
  { district: "Tumakuru", primaryUniversityId: "TUM", primaryUniversityName: "Tumakuru University", courses: COURSES_CORE_BSW },
  { district: "Mysuru", primaryUniversityId: "UOM", primaryUniversityName: "University of Mysore", courses: COURSES_CORE_BPA },
  { district: "Mandya", primaryUniversityId: "MND", primaryUniversityName: "Mandya University", courses: COURSES_CORE },
  { district: "Hassan", primaryUniversityId: "HAS", primaryUniversityName: "Hassan University", courses: COURSES_CORE },
  { district: "Kodagu", primaryUniversityId: "KOD", primaryUniversityName: "Kodagu University", courses: COURSES_CORE },
  { district: "Chamarajanagar", primaryUniversityId: "CMR", primaryUniversityName: "Chamarajanagar University", courses: COURSES_CORE },
  { district: "Shivamogga", primaryUniversityId: "KUV", primaryUniversityName: "Kuvempu University", courses: COURSES_CORE_BSW },
  { district: "Chikkamagaluru", primaryUniversityId: "KUV", primaryUniversityName: "Kuvempu University", courses: COURSES_CORE },
  { district: "Davanagere", primaryUniversityId: "DAV", primaryUniversityName: "Davangere University", courses: COURSES_CORE },
  { district: "Chitradurga", primaryUniversityId: "DAV", primaryUniversityName: "Davangere University", courses: COURSES_CORE },
  { district: "Ballari", primaryUniversityId: "VSKU", primaryUniversityName: "Vijayanagara Sri Krishnadevaraya University", courses: COURSES_CORE },
  { district: "Vijayanagara", primaryUniversityId: "VSKU", primaryUniversityName: "Vijayanagara Sri Krishnadevaraya University", courses: COURSES_CORE },
  { district: "Koppal", primaryUniversityId: "KOP", primaryUniversityName: "Koppal University", courses: COURSES_CORE },
  { district: "Raichur", primaryUniversityId: "RAI", primaryUniversityName: "Raichur University", courses: COURSES_CORE },
  { district: "Yadgir", primaryUniversityId: "YAD", primaryUniversityName: "Yadgir University", courses: COURSES_CORE },
  { district: "Kalaburagi", primaryUniversityId: "GUL", primaryUniversityName: "Gulbarga University", courses: COURSES_CORE_BSW },
  { district: "Bidar", primaryUniversityId: "BID", primaryUniversityName: "Bidar University", courses: COURSES_CORE },
  { district: "Belagavi", primaryUniversityId: "RCU", primaryUniversityName: "Rani Channamma University", courses: COURSES_CORE_BSW },
  { district: "Bagalkot", primaryUniversityId: "BGK", primaryUniversityName: "Bagalkot University", courses: COURSES_CORE },
  { district: "Vijayapura", primaryUniversityId: "AMWU", primaryUniversityName: "Akkamahadevi Women's University", secondaryUniversityId: "BGK", secondaryUniversityName: "Bagalkot University / RCU", courses: COURSES_CORE, notes: "Women's colleges under AMWU; others under Bagalkot/RCU" },
  { district: "Dharwad", primaryUniversityId: "KUD", primaryUniversityName: "Karnatak University", courses: COURSES_CORE_BSW },
  { district: "Gadag", primaryUniversityId: "KUD", primaryUniversityName: "Karnatak University", courses: COURSES_CORE },
  { district: "Haveri", primaryUniversityId: "KUD", primaryUniversityName: "Karnatak University", secondaryUniversityId: "HAV", secondaryUniversityName: "Haveri University", courses: COURSES_CORE, notes: "Transitioning to Haveri University" },
  { district: "Uttara Kannada", primaryUniversityId: "KUD", primaryUniversityName: "Karnatak University", courses: COURSES_CORE },
  { district: "Dakshina Kannada", primaryUniversityId: "MNG", primaryUniversityName: "Mangalore University", courses: COURSES_CORE_BSW },
  { district: "Udupi", primaryUniversityId: "MNG", primaryUniversityName: "Mangalore University", courses: COURSES_CORE },
];

export function getAllDistricts(): string[] {
  return DISTRICT_UNIVERSITY_MAP.map((m) => m.district);
}

export function getUniversityByCode(code: string) {
  return KARNATAKA_UNIVERSITIES.find((u) => u.code === code);
}

export function getUniversityByDistrict(district: string): DistrictUniversityMapping | undefined {
  return DISTRICT_UNIVERSITY_MAP.find((m) => m.district === district);
}

export function getUniversitiesByPriority(priority: number) {
  return KARNATAKA_UNIVERSITIES.filter((u) => u.priority === priority);
}

export function getTotalEstimatedColleges(): { min: number; max: number } {
  const min = KARNATAKA_UNIVERSITIES.reduce((sum, u) => sum + u.collegeCountMin, 0);
  const max = KARNATAKA_UNIVERSITIES.reduce((sum, u) => sum + u.collegeCountMax, 0);
  return { min, max };
}

export function getPrioritySummary() {
  const tiers = [1, 2, 3, 4, 5];
  return tiers.map((p) => {
    const unis = KARNATAKA_UNIVERSITIES.filter((u) => u.priority === p);
    return {
      priority: p,
      label: p === 1 ? "Phase 1 — Critical" : p === 2 ? "Phase 2 — High" : p === 3 ? "Phase 3 — Medium" : p === 4 ? "Phase 4 — Low" : "Phase 5 — Future",
      universities: unis.length,
      collegesMin: unis.reduce((s, u) => s + u.collegeCountMin, 0),
      collegesMax: unis.reduce((s, u) => s + u.collegeCountMax, 0),
    };
  });
}

export function isCourseValidForUniversity(course: string, universityCode: string): boolean {
  const uni = getUniversityByCode(universityCode);
  if (!uni) return false;
  return uni.courses.some((c) => c.code === course);
}

export function getCoursesByDistrict(district: string): UniversityCourse[] {
  const mapping = getUniversityByDistrict(district);
  return mapping?.courses || [];
}