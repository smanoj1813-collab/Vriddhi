import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useUniversities,
  useUniversityStats,
  useRolloutProgress,
  useSeedUniversities,
} from '../../admin/hooks/useUniversities';
import { getManagementTypeColor } from '@/shared/types/university';
import { getTotalEstimatedColleges, getPrioritySummary } from '../../../shared/data/karnatakaUniversities';
import type { ListUniversitiesOptions, University, UniversityStats, RolloutItem } from '@/shared/types/university';

import {
  Building2, MapPin, GraduationCap, TrendingUp, Target, Search,
  Database, CheckCircle2, AlertCircle, Loader2, ChevronRight,
  BarChart3, Layers,
} from "lucide-react";

const SuperAdminUniversities: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListUniversitiesOptions["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const { data: universitiesData, isLoading: unisLoading } = useUniversities({
    status: statusFilter, search: searchQuery, limit: 50,
  });
  const { data: statsRaw, isLoading: statsLoading } = useUniversityStats();
  const { data: rolloutRaw, isLoading: rolloutLoading } = useRolloutProgress();
  const seedMutation = useSeedUniversities();

  const universities: University[] = (universitiesData as any)?.items || [];
  const stats = statsRaw as UniversityStats | undefined;
  const rollout = rolloutRaw as RolloutItem[] | undefined;
  const { min: totalMin, max: totalMax } = getTotalEstimatedColleges();
  const prioritySummary = getPrioritySummary();

  const filteredUniversities =
    priorityFilter === "all"
      ? universities
      : universities.filter((u: University) =>
          priorityFilter === "null" ? u.priority === null : u.priority === parseInt(priorityFilter)
        );

  const handleSeed = async () => {
    setShowSeedConfirm(false);
    try {
      const result = await seedMutation.mutateAsync() as { created: number; updated: number; errors: string[] };
      alert(`Seed complete! Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`);
    } catch (err) {
      alert("Seed failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">University Master</h1>
            <p className="text-slate-400 text-sm mt-1">
              Karnataka Government Universities — {universities.length} loaded, ~{totalMin.toLocaleString()}–{totalMax.toLocaleString()} colleges
            </p>
          </div>
          <button
            onClick={() => setShowSeedConfirm(true)}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-600/40 text-teal-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Seed Universities
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Building2 className="w-5 h-5 text-teal-400" />} label="Total Universities" value={statsLoading ? "..." : stats?.totalUniversities ?? 0} subtext="Government + Aided" />
        <StatCard icon={<GraduationCap className="w-5 h-5 text-blue-400" />} label="Onboarded Colleges" value={statsLoading ? "..." : stats?.onboardedColleges ?? 0} subtext={statsLoading ? "" : `of ~${totalMax.toLocaleString()} estimated`} />
        <StatCard icon={<Target className="w-5 h-5 text-emerald-400" />} label="Active Colleges" value={statsLoading ? "..." : stats?.activeColleges ?? 0} subtext="Fully operational" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-amber-400" />} label="Coverage" value={statsLoading ? "..." : `${(stats?.coveragePercentage ?? 0).toFixed(1)}%`} subtext="Onboarded / Estimated" />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" /> Rollout Priority Tiers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {prioritySummary.map((tier) => (
            <div key={tier.priority} className={`p-4 rounded-lg border ${tier.priority === 1 ? "bg-teal-950/30 border-teal-800/50" : tier.priority === 2 ? "bg-blue-950/30 border-blue-800/50" : tier.priority === 3 ? "bg-indigo-950/30 border-indigo-800/50" : tier.priority === 4 ? "bg-slate-800/50 border-slate-700" : "bg-slate-800/30 border-slate-700/50"}`}>
              <p className="text-xs text-slate-400 mb-1">{tier.label}</p>
              <p className="text-2xl font-bold text-white">{tier.universities}</p>
              <p className="text-xs text-slate-500 mt-1">{tier.collegesMin.toLocaleString()}–{tier.collegesMax.toLocaleString()} colleges</p>
            </div>
          ))}
        </div>
      </div>

      {!rolloutLoading && rollout && rollout.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" /> Onboarding Progress
          </h3>
          <div className="space-y-3">
            {rollout.sort((a, b) => a.priority - b.priority).map((r) => (
              <div key={r.universityId} className="flex items-center gap-4">
                <div className="w-48 shrink-0">
                  <p className="text-sm text-white truncate">{r.universityName}</p>
                  <p className="text-xs text-slate-500">P{r.priority} • Target: {r.targetColleges}</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${r.percentageComplete >= 80 ? "bg-emerald-500" : r.percentageComplete >= 50 ? "bg-teal-500" : r.percentageComplete >= 25 ? "bg-amber-500" : "bg-slate-500"}`} style={{ width: `${Math.max(2, r.percentageComplete)}%` }} />
                  </div>
                </div>
                <div className="w-24 text-right shrink-0">
                  <p className="text-sm text-white">{r.onboardedColleges} / {r.targetColleges}</p>
                  <p className="text-xs text-slate-500">{r.percentageComplete}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search university..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 w-64" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ListUniversitiesOptions["status"])} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400">
          <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400">
          <option value="all">All Priorities</option><option value="1">Phase 1</option><option value="2">Phase 2</option><option value="3">Phase 3</option><option value="4">Phase 4</option><option value="5">Phase 5</option><option value="null">Unprioritized</option>
        </select>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {unisLoading ? (
          <div className="p-12 flex items-center justify-center"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
        ) : filteredUniversities.length === 0 ? (
          <div className="p-12 text-center"><Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No universities found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">University</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Districts</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Colleges</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Courses</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="w-10" />
              </tr></thead>
              <tbody>
                {filteredUniversities.map((u) => (
                  <tr key={u.id} onClick={() => navigate(`/superadmin/university/${u.id}`)} className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${getManagementTypeColor(u.managementType)}20`, color: getManagementTypeColor(u.managementType) }}>{u.shortName}</div>
                        <div><p className="text-sm text-white font-medium">{u.name}</p>{u.isWomensUniversity && <span className="text-xs text-pink-400">Women's University</span>}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{u.code}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${u.priority === 1 ? "bg-teal-500/20 text-teal-400" : u.priority === 2 ? "bg-blue-500/20 text-blue-400" : u.priority === 3 ? "bg-indigo-500/20 text-indigo-400" : u.priority === 4 ? "bg-slate-500/20 text-slate-400" : "bg-slate-700/30 text-slate-500"}`}>{u.priority ? `P${u.priority}` : "—"}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1 text-sm text-slate-300"><MapPin className="w-3 h-3 text-slate-500" />{(u.districts?.length || 0)} district{(u.districts?.length || 0) > 1 ? "s" : ""}</div></td>
                    <td className="px-4 py-3 text-sm text-slate-300">{u.collegeCountMin.toLocaleString()}–{u.collegeCountMax.toLocaleString()}</td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{u.courses.slice(0, 4).map((c) => (<span key={c.code} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">{c.code}</span>))}{u.courses.length > 4 && <span className="px-1.5 py-0.5 text-xs text-slate-500">+{u.courses.length - 4}</span>}</div></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs ${u.status === "active" ? "text-emerald-400" : u.status === "pending" ? "text-amber-400" : "text-red-400"}`}>{u.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}{u.status}</span></td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-slate-600" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Seed Universities</h3>
            <p className="text-slate-400 text-sm mb-4">This will populate Firestore with all 23 Karnataka government universities.</p>
            <div className="bg-slate-900 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-500">Universities to seed: 23</p>
              <p className="text-xs text-slate-500">Estimated colleges: {totalMin.toLocaleString()}–{totalMax.toLocaleString()}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSeedConfirm(false)} className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm">Cancel</button>
              <button onClick={handleSeed} disabled={seedMutation.isPending} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2">{seedMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Seed Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: number | string; subtext?: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3"><div className="p-2 bg-slate-700/50 rounded-lg">{icon}</div></div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      {subtext && <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>}
    </div>
  );
}

export default SuperAdminUniversities;
