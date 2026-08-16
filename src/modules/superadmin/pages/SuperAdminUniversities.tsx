import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useUniversities,
  useUniversityStats,
  useRolloutProgress,
  useSeedUniversities,
} from "../../admin/hooks/useUniversities";
import {
  getTotalEstimatedColleges,
  getPrioritySummary,
} from "../../../shared/data/karnatakaUniversities";
import type {
  University,
  UniversityRolloutProgress,
} from "@/shared/types/university";

import {
  Building2,
  MapPin,
  GraduationCap,
  TrendingUp,
  Target,
  Search,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  BarChart3,
  Layers,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// LOCAL HELPERS
// ═══════════════════════════════════════════════════════════════════════

function getMgmtClasses(type: string): { bg: string; text: string } {
  const t = type.toLowerCase();
  if (t.includes("government")) return { bg: "bg-blue-500/20", text: "text-blue-400" };
  if (t.includes("private")) return { bg: "bg-purple-500/20", text: "text-purple-400" };
  if (t.includes("aided")) return { bg: "bg-green-500/20", text: "text-green-400" };
  if (t.includes("autonomous")) return { bg: "bg-orange-500/20", text: "text-orange-400" };
  if (t.includes("deemed")) return { bg: "bg-pink-500/20", text: "text-pink-400" };
  return { bg: "bg-slate-500/20", text: "text-slate-400" };
}

function getCourseCode(c: unknown): string {
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "code" in c) return String((c as Record<string, unknown>).code);
  return String(c);
}

function safeLength(arr: unknown): number {
  return Array.isArray(arr) ? arr.length : 0;
}

function safeSlice<T>(arr: unknown, start: number, end?: number): T[] {
  return Array.isArray(arr) ? (arr as T[]).slice(start, end) : [];
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const SuperAdminUniversities: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  // EXPLICIT UNION — avoids type mismatch between src/types and src/modules/superadmin/types
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const { data: universitiesData, isLoading: unisLoading } = useUniversities({
    status: statusFilter,
    search: searchQuery,
    limit: 50,
  });
  const { data: stats, isLoading: statsLoading } = useUniversityStats();
  const { data: rollout, isLoading: rolloutLoading } = useRolloutProgress();
  const seedMutation = useSeedUniversities();

  const universities: University[] =
    (universitiesData as any)?.data ??
    (universitiesData as any)?.items ??
    [];

  const { min: totalMin, max: totalMax } = getTotalEstimatedColleges();
  const prioritySummary = getPrioritySummary();

  const filteredUniversities =
    priorityFilter === "all"
      ? universities
      : universities.filter((u: University) =>
          priorityFilter === "null"
            ? u.priority === null
            : u.priority === parseInt(priorityFilter, 10)
        );

  const handleSeed = async () => {
    setShowSeedConfirm(false);
    try {
      const result = (await seedMutation.mutateAsync()) as any;
      const created = result?.created ?? result?.seeded ?? 0;
      const updated = result?.updated ?? 0;
      const errors: string[] = result?.errors ?? [];
      alert(
        `Seed complete! ${created} created, ${updated} updated.` +
          (errors.length > 0 ? `\n${errors.length} errors.` : "")
      );
    } catch (err) {
      alert("Seed failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">University Master</h1>
            <p className="text-slate-400 text-sm mt-1">
              Karnataka Government Universities — {universities.length} loaded, ~
              {totalMin.toLocaleString()}–{totalMax.toLocaleString()} colleges
            </p>
          </div>
          <button
            onClick={() => setShowSeedConfirm(true)}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-600/40 text-teal-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            {seedMutation.isPending ? (
              <span className="animate-spin"><Loader2 size={16} /></span>
            ) : (
              <Database size={16} />
            )}
            Seed Universities
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-700/50 rounded-lg text-teal-400">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {statsLoading ? "..." : stats?.totalUniversities ?? 0}
          </p>
          <p className="text-sm text-slate-400 mt-1">Total Universities</p>
          <p className="text-xs text-slate-500 mt-0.5">Government + Aided</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">
              <GraduationCap size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {statsLoading ? "..." : stats?.onboardedColleges ?? 0}
          </p>
          <p className="text-sm text-slate-400 mt-1">Onboarded Colleges</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {statsLoading ? "" : `of ~${totalMax.toLocaleString()} estimated`}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-700/50 rounded-lg text-emerald-400">
              <Target size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {statsLoading ? "..." : stats?.activeColleges ?? 0}
          </p>
          <p className="text-sm text-slate-400 mt-1">Active Colleges</p>
          <p className="text-xs text-slate-500 mt-0.5">Fully operational</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-700/50 rounded-lg text-amber-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {statsLoading
              ? "..."
              : `${(stats?.coveragePercentage ?? 0).toFixed(1)}%`}
          </p>
          <p className="text-sm text-slate-400 mt-1">Coverage</p>
          <p className="text-xs text-slate-500 mt-0.5">Onboarded / Estimated</p>
        </div>
      </div>

      {/* Rollout Priority Tiers */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-teal-400"><Layers size={20} /></span> Rollout Priority Tiers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {prioritySummary.map((tier) => (
            <div
              key={tier.priority}
              className={`p-4 rounded-lg border ${
                tier.priority === 1
                  ? "bg-teal-950/30 border-teal-800/50"
                  : tier.priority === 2
                  ? "bg-blue-950/30 border-blue-800/50"
                  : tier.priority === 3
                  ? "bg-indigo-950/30 border-indigo-800/50"
                  : tier.priority === 4
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-slate-800/30 border-slate-700/50"
              }`}
            >
              <p className="text-xs text-slate-400 mb-1">{tier.label}</p>
              <p className="text-2xl font-bold text-white">{tier.universities}</p>
              <p className="text-xs text-slate-500 mt-1">
                {tier.collegesMin.toLocaleString()}–{tier.collegesMax.toLocaleString()} colleges
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding Progress */}
      {!rolloutLoading && rollout && rollout.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-teal-400"><BarChart3 size={20} /></span> Onboarding Progress
          </h3>
          <div className="space-y-3">
            {[...rollout]
              .sort((a, b) => a.priority - b.priority)
              .map((r) => (
                <div key={r.universityId} className="flex items-center gap-4">
                  <div className="w-48 shrink-0">
                    <p className="text-sm text-white truncate">{r.universityName}</p>
                    <p className="text-xs text-slate-500">
                      P{r.priority} • Target: {r.targetColleges}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          r.percentageComplete >= 80
                            ? "bg-emerald-500"
                            : r.percentageComplete >= 50
                            ? "bg-teal-500"
                            : r.percentageComplete >= 25
                            ? "bg-amber-500"
                            : "bg-slate-500"
                        }`}
                        style={{ width: `${Math.max(2, r.percentageComplete)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right shrink-0">
                    <p className="text-sm text-white">
                      {r.onboardedColleges} / {r.targetColleges}
                    </p>
                    <p className="text-xs text-slate-500">{r.percentageComplete}%</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive" | "pending")}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
        >
          <option value="all">All Priorities</option>
          <option value="1">Phase 1</option>
          <option value="2">Phase 2</option>
          <option value="3">Phase 3</option>
          <option value="4">Phase 4</option>
          <option value="5">Phase 5</option>
          <option value="null">Unprioritized</option>
        </select>
      </div>

      {/* Universities Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {unisLoading ? (
          <div className="p-12 flex items-center justify-center">
            <span className="text-teal-400 animate-spin"><Loader2 size={32} /></span>
          </div>
        ) : filteredUniversities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-slate-600 mx-auto mb-3 flex justify-center">
              <Building2 size={48} />
            </div>
            <p className="text-slate-400">No universities found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    University
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    Priority
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    Districts
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    Colleges
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    Courses
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredUniversities.map((u: University) => {
                  const mgmt = getMgmtClasses(u.managementType);
                  const coursesArr = safeSlice<unknown>(u.courses, 0, 4);
                  const coursesTotal = safeLength(u.courses);
                  return (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`/superadmin/universities/${u.id}`)}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${mgmt.bg} ${mgmt.text}`}
                          >
                            {u.shortName || u.code}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{u.name}</p>
                            {u.isWomensUniversity && (
                              <span className="text-xs text-pink-400">Women&apos;s University</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                        {u.code}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            u.priority === 1
                              ? "bg-teal-500/20 text-teal-400"
                              : u.priority === 2
                              ? "bg-blue-500/20 text-blue-400"
                              : u.priority === 3
                              ? "bg-indigo-500/20 text-indigo-400"
                              : u.priority === 4
                              ? "bg-slate-500/20 text-slate-400"
                              : "bg-slate-700/30 text-slate-500"
                          }`}
                        >
                          {u.priority ? `P${u.priority}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-slate-300">
                          <span className="text-slate-500"><MapPin size={12} /></span>
                          {safeLength(u.districts)} district
                          {safeLength(u.districts) !== 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {u.collegeCountMin.toLocaleString()}–
                        {u.collegeCountMax.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {coursesArr.map((c, idx) => (
                            <span
                              key={`${getCourseCode(c)}-${idx}`}
                              className="px-1.5 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400"
                            >
                              {getCourseCode(c)}
                            </span>
                          ))}
                          {coursesTotal > 4 && (
                            <span className="px-1.5 py-0.5 text-xs text-slate-500">
                              +{coursesTotal - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            u.status === "active"
                              ? "text-emerald-400"
                              : u.status === "pending"
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {u.status === "active" ? (
                            <span><CheckCircle2 size={12} /></span>
                          ) : (
                            <span><AlertCircle size={12} /></span>
                          )}
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600"><ChevronRight size={16} /></span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seed Confirm Modal */}
      {showSeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Seed Universities</h3>
            <p className="text-slate-400 text-sm mb-4">
              This will populate Firestore with all Karnataka government universities.
            </p>
            <div className="bg-slate-900 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-500">
                Universities to seed:{" "}
                {prioritySummary.reduce((s, t) => s + t.universities, 0)}
              </p>
              <p className="text-xs text-slate-500">
                Estimated colleges: {totalMin.toLocaleString()}–{totalMax.toLocaleString()}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSeedConfirm(false)}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSeed}
                disabled={seedMutation.isPending}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                {seedMutation.isPending && (
                  <span className="animate-spin"><Loader2 size={16} /></span>
                )}
                Seed Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUniversities;