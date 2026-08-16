// src/pages/superadmin/SuperAdminUniversityDetail.tsx
// Super Admin: Single University Detail — affiliated colleges, district coverage,
// course offerings, rollout progress.

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useUniversity,
  useUniversityColleges,
  useUpdateUniversity,
} from '../../admin/hooks/useUniversities';
import { getPriorityLabel, getManagementTypeColor } from '@/shared/types/university';
import type { University, UniversityCollege, DistrictUniversityMapping } from '@/shared/types/university';

import {
  ArrowLeft,
  Building2,
  MapPin,
  GraduationCap,
  BookOpen,
  Users,
  Target,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  AlertCircle,
  BarChart3,
  Globe,
  Calendar,
} from "lucide-react";

// TODO: Move this data to ../../../shared/data/karnatakaUniversities and export it,
// then re-enable the import above and remove this local definition.
const DISTRICT_UNIVERSITY_MAP: DistrictUniversityMapping[] = [];

// ── Component ─────────────────────────────────────────────────────────
const SuperAdminUniversityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "colleges" | "districts">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: universityRaw, isLoading: uniLoading } = useUniversity(id);
  const { data: collegesRaw, isLoading: collegesLoading } = useUniversityColleges(id);
  const updateMutation = useUpdateUniversity();

  const university = universityRaw as University | undefined;
  const colleges = collegesRaw as UniversityCollege[] | undefined;

  // District mappings for this university
  const districtMappings: DistrictUniversityMapping[] = DISTRICT_UNIVERSITY_MAP.filter(
    (m: DistrictUniversityMapping) => m.primaryUniversityId === university?.code || m.secondaryUniversityId === university?.code
  );

  // Filtered colleges
  const filteredColleges: UniversityCollege[] =
    searchQuery && colleges
      ? colleges.filter(
          (c: UniversityCollege) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.code || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      : colleges || [];

  // ── Loading ────────────────────────────────────────────────────────
  if (uniLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">University not found</p>
          <button
            onClick={() => navigate("/superadmin/universities")}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
          >
            Back to Universities
          </button>
        </div>
      </div>
    );
  }

  const onboardedCount = colleges?.filter((c: UniversityCollege) => c.status === "active").length || 0;
  const targetCount = university.collegeCountMax;
  const progressPct = targetCount > 0 ? Math.round((onboardedCount / targetCount) * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate("/superadmin/universities")}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: `${getManagementTypeColor(university.managementType)}20`,
                color: getManagementTypeColor(university.managementType),
              }}
            >
              {university.shortName}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{university.name}</h1>
              <p className="text-slate-400 text-sm">
                {university.code} • {university.location} • Est. {university.establishedYear}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                university.priority === 1
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                  : university.priority === 2
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : university.priority === 3
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
              }`}
            >
              {/* FIX: priority may be null — default to 0 */}
              {getPriorityLabel(university.priority ?? 0)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30 capitalize">
              {university.managementType}
            </span>
            {university.isWomensUniversity && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Women&apos;s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Building2 className="w-5 h-5 text-teal-400" />}
          label="Affiliated Colleges"
          value={`${onboardedCount} / ${targetCount}`}
          subtext={`${progressPct}% onboarded`}
        />
        <StatCard
          icon={<MapPin className="w-5 h-5 text-blue-400" />}
          label="Districts Covered"
          value={university.districts?.length ?? 0}
          subtext={university.districts?.join(", ")}
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-amber-400" />}
          label="UG Courses"
          value={university.courses.length}
          // FIX: courses is string[] (course codes), not object array
          subtext={university.courses.join(", ")}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-purple-400" />}
          label="Onboarded"
          value={university.onboardedColleges || 0}
          subtext={`${university.activeColleges || 0} active`}
        />
      </div>

      {/* PROGRESS BAR */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Onboarding Progress
          </h3>
          <span className="text-sm text-slate-400">{progressPct}% complete</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPct >= 80
                ? "bg-emerald-500"
                : progressPct >= 50
                ? "bg-teal-500"
                : progressPct >= 25
                ? "bg-amber-500"
                : "bg-slate-500"
            }`}
            style={{ width: `${Math.max(2, progressPct)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0</span>
          <span>{Math.round(targetCount / 2)}</span>
          <span>{targetCount} target</span>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-slate-700 mb-6">
        <div className="flex gap-1">
          {[
            { id: "overview" as const, label: "Overview", icon: <Building2 className="w-4 h-4" /> },
            { id: "colleges" as const, label: "Colleges", icon: <GraduationCap className="w-4 h-4" />, count: colleges?.length },
            { id: "districts" as const, label: "Districts", icon: <MapPin className="w-4 h-4" />, count: districtMappings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[400px]">
        {/* ── OVERVIEW ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* University Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">University Details</h3>
              <div className="space-y-4">
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Full Name" value={university.name} />
                <InfoRow icon={<Globe className="w-4 h-4" />} label="Short Name" value={university.shortName} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={university.location} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Established" value={university.establishedYear?.toString()} />
                <InfoRow icon={<Target className="w-4 h-4" />} label="Priority" value={getPriorityLabel(university.priority ?? 0)} />
                <InfoRow icon={<Users className="w-4 h-4" />} label="Management Type" value={university.managementType} />
                {university.website && (
                  <InfoRow icon={<Globe className="w-4 h-4" />} label="Website" value={university.website} isLink />
                )}
              </div>
            </div>

            {/* Courses Offered */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">UG Courses Offered</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* FIX: courses is string[] — use course code directly */}
                {university.courses.map((course) => (
                  <div
                    key={course}
                    className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{course}</p>
                      <p className="text-xs text-slate-500">{course}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                <p className="text-xs text-slate-500">
                  <span className="text-teal-400 font-medium">{university.courses.length}</span> courses available for question bank and paper generation
                </p>
              </div>
            </div>

            {/* District Coverage */}
            <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">District Coverage</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {districtMappings.map((m: DistrictUniversityMapping) => (
                  <div
                    key={m.district}
                    className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg"
                  >
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-white">{m.district}</p>
                      {m.notes && <p className="text-xs text-slate-500 mt-0.5">{m.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COLLEGES ───────────────────────────────────────────────── */}
        {activeTab === "colleges" && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Affiliated Colleges</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 w-64"
                />
              </div>
            </div>

            {collegesLoading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              </div>
            ) : filteredColleges.length === 0 ? (
              <div className="p-12 text-center">
                <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  {colleges && colleges.length === 0
                    ? "No colleges onboarded yet for this university."
                    : "No colleges match your search."}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Target: {university.collegeCountMin}–{university.collegeCountMax} colleges
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">College</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Code</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">District</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredColleges.map((c: UniversityCollege) => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/superadmin/college/${c.id}`)}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-white">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-300 font-mono">{c.code}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{c.district || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs ${
                              c.status === "active"
                                ? "text-emerald-400"
                                : c.status === "onboarding"
                                ? "text-amber-400"
                                : "text-slate-400"
                            }`}
                          >
                            {c.status === "active" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : c.status === "onboarding" ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DISTRICTS ──────────────────────────────────────────────── */}
        {activeTab === "districts" && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">District Coverage Map</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {districtMappings.map((m: DistrictUniversityMapping) => (
                <div key={m.district} className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{m.district}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {m.courses.length} courses offered
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {/* FIX: m.courses is string[] */}
                        {m.courses.slice(0, 5).map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 bg-slate-800 rounded text-xs text-slate-400"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      {m.secondaryUniversityName && (
                        <p className="text-xs text-amber-400 mt-2">
                          Also under: {m.secondaryUniversityName}
                        </p>
                      )}
                      {m.notes && (
                        <p className="text-xs text-slate-500 mt-1">{m.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-slate-700/50 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      {subtext && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtext}</p>}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLink,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  isLink?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        {isLink ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-teal-400 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-white">{value}</p>
        )}
      </div>
    </div>
  );
}

export default SuperAdminUniversityDetail;